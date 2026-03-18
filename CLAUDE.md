# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a genetics learning platform built with A2UI (Agent to UI) protocol v0.8, GLM-4.7 LLM, FastAPI backend, and Lit Web Components frontend. The platform enables AI-driven dynamic visualization of genetics concepts through 6 custom components.

**Key Architecture**: AI generates A2UI JSON messages → Frontend renders custom genetics components → User interacts with visualizations.

## Development Commands

### Backend (Python 3.10+)

```powershell
# Activate virtual environment
cd C:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1

# Start backend server
py -m uvicorn backend.main:app --reload --port 8000

# Run A2UI SDK tests (100 tests)
cd backend\python\a2ui_agent
pytest tests/inference/test_validator.py -v
```

### Frontend (Node.js 18+)

```bash
cd frontend/genetics-app

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### Quick Start Scripts

```bash
# Windows batch scripts in scripts/
scripts\start-backend.bat      # Start backend
scripts\start-frontend.bat     # Start frontend
scripts\restart-backend.bat    # Kill and restart backend
scripts\restart-frontend.bat   # Kill and restart frontend
```

## Critical Architecture Concepts

### 1. A2UI Protocol v0.8 Message Flow

**IMPORTANT**: This project uses A2UI v0.8, NOT v0.9. The message format is:

```json
[
  {
    "beginRendering": {
      "surfaceId": "genetics_ui",
      "root": "main_component"
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "genetics_ui",
      "components": [
        {
          "id": "main_component",
          "component": {
            "PunnettSquare": {
              "parent1Genotype": {"literalString": "Aa"},
              "parent2Genotype": {"path": "/parent2"}
            }
          }
        }
      ]
    }
  },
  {
    "dataModelUpdate": {
      "surfaceId": "genetics_ui",
      "contents": [
        {"key": "parent2", "valueString": "aa"}
      ]
    }
  }
]
```

**Key differences from v0.9**:
- Use `beginRendering` (NOT `createSurface`)
- Must specify `root` field pointing to root component ID
- Data binding uses `{"literalString": "value"}` or `{"path": "/key"}`

### 2. Backend A2UI Generation Pipeline

**Location**: `backend/main.py` lines 1152-1325

```
User message → IntentService.identify_intent()
            → GLMService.generate_a2ui_response() with system prompt
            → validate_and_fix_response() (A2UI SDK validation)
            → If validation fails → generate_local_a2ui() (fallback)
            → Return {text, a2ui, intent, keywords}
```

**Critical files**:
- `backend/services/a2ui_service.py`: System prompt generation, schema validation
- `backend/services/intent_service.py`: 10 intent types with context awareness
- `backend/main.py`: `generate_local_a2ui_with_binding()` fallback generator

**Fallback strategy**: When GLM generates invalid A2UI JSON, `generate_local_a2ui_with_binding()` creates a hardcoded valid response based on intent type. This ensures users always see visualizations.

### 3. Frontend A2UI Rendering

**Location**: `frontend/genetics-app/src/a2ui-renderer.ts`

```typescript
// Uses @a2ui/lit v0.8 standard signal processor
const processor = v0_8.Data.createSignalA2uiMessageProcessor();
processor.processMessages(a2uiMessages);
const surfaces = processor.getSurfaces();
// Render each surface's component tree
```

**Component registration**: `frontend/genetics-app/src/index.ts` lines 29-41

All 6 custom genetics components must be registered with A2UI registry before rendering:

```typescript
registry.register('PunnettSquare', PunnettSquare as any, 'punnett-square', schema);
```

### 4. Custom Genetics Components

**Location**: `frontend/genetics-app/src/components/genetics/`

All components extend `LitElement` and implement `unwrapValue()` to handle A2UI data binding:

```typescript
private unwrapValue(value: any, type: 'string' | 'boolean' | 'array' | 'object'): any {
  if (value && typeof value === 'object') {
    if (type === 'string' && 'literalString' in value) {
      return value.literalString;
    }
    if (type === 'string' && 'path' in value) {
      // Path binding handled by A2UI renderer
      return value.path;
    }
  }
  return value;
}
```

**6 Components**:
1. `punnett-square.ts` - Mendelian crosses (Aa × aa)
2. `dna-structure.ts` - DNA double helix visualization
3. `phenotype-distribution.ts` - Bar chart for phenotype ratios
4. `gene-expression.ts` - Gene expression levels
5. `pedigree-chart.ts` - Family inheritance trees
6. `crossover-map.ts` - Chromosomal crossover events

### 5. Intent Recognition System

**Location**: `backend/services/intent_service.py`

**10 Intent Types**:
- **Genetics components (6)**: punnett_square, dna_structure, phenotype_distribution, gene_expression, pedigree_chart, cross_over_map
- **Other (4)**: quiz, video, general, greeting

**Context-aware recognition**: The system analyzes conversation history to resolve ambiguous requests like "画一个" (draw one) or "展示一下" (show it) by referencing previous messages.

**Keyword patterns**: Fallback regex matching when LLM intent recognition fails (lines 19-20).

### 6. Local Model Configuration

**CRITICAL**: This project uses LOCAL Hugging Face models, NOT online downloads.

**Location**: `backend/services/embedding_service.py` lines 9-18

```python
cache_dir = project_root / ".cache" / "huggingface"
os.environ['HF_HUB_OFFLINE'] = '1'  # Force local cache
```

**Model**: `paraphrase-multilingual-MiniLM-L12-v2` (for RAG embeddings)

**If backend is slow (3+ minutes)**: Check that `HF_HUB_OFFLINE = '1'`. If set to '0', it will attempt network downloads with 5 retries, causing massive delays.

### 7. A2UI SDK Integration

**Location**: `backend/python/a2ui_agent/`

This is Google's official A2UI Python SDK (Apache 2.0 licensed). Key modules:

- `src/a2ui/inference/schema/manager.py`: Schema validation and catalog management
- `src/a2ui/inference/schema/common_modifiers.py`: Schema modification utilities
- `specification/v0_8/`: A2UI v0.8 JSON schemas

**Custom catalog**: `backend/schemas/genetics_catalog.json` defines the 6 custom components with their schemas.

**Test suite**: `backend/python/a2ui_agent/tests/inference/test_validator.py` (100 tests)

**IMPORTANT FIX**: Line 107 must use `"$id": "https://a2ui.org/specification/v0_9/catalog.json"` (NOT `basic_catalog.json`) for v0.9 tests to pass.

## Environment Variables

**File**: `.env` (root directory)

```env
# GLM API Configuration
GLM_API_KEY=your_api_key_here
GLM_MODEL=glm-4.7

# RAG Service (local model)
KNOWLEDGE_BASE_PATH=C:\trae_coding\A2UI-main\my-a2ui-project\docs\full.md

# Hugging Face (MUST use local cache)
EMBEDDING_MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2
HF_CACHE_DIR=C:\trae_coding\A2UI-main\my-a2ui-project\.cache\huggingface
```

## Common Issues and Solutions

### Backend generates `createSurface` instead of `beginRendering`

**Symptom**: Frontend logs show "Surface has no children - component may have failed to render"

**Cause**: Backend using v0.9 format instead of v0.8

**Fix**: In `backend/main.py` function `generate_local_a2ui_with_binding()`, ensure all fallback responses use:
```python
{"beginRendering": {"surfaceId": "genetics_ui", "root": "main_component"}}
```

### Backend extremely slow (3+ minutes to respond)

**Symptom**: RAG service tries to download embedding model from Hugging Face

**Fix**: Set `os.environ['HF_HUB_OFFLINE'] = '1'` in `backend/services/embedding_service.py` line 18

### A2UI SDK tests failing (14 failures)

**Symptom**: Catalog reference resolution errors in v0.9 tests

**Fix**: Change `$id` field in `backend/python/a2ui_agent/tests/inference/test_validator.py` line 107 from `basic_catalog.json` to `catalog.json`

### Frontend components not rendering

**Checklist**:
1. Are components registered in `frontend/genetics-app/src/index.ts`?
2. Does backend return `beginRendering` (not `createSurface`)?
3. Is `root` field set to valid component ID?
4. Check browser console for A2UI renderer errors

## API Endpoints

- `POST /api/chat` - Main chat endpoint (returns {text, a2ui, intent, keywords})
- `GET /api/quiz/questions?category={category}` - Quiz questions
- `GET /health` - Health check
- `WebSocket /ws/chat/{session_id}` - WebSocket chat (alternative to POST)

## Design Principles

- **Grayscale color scheme**: #111827, #6b7280, #e5e7eb, #fafafa
- **Font**: Inter (loaded in index.html)
- **No AI-style decorations**: Clean, professional, minimal animations
- **Card-based layout**: Clear hierarchy with subtle shadows

## Testing Strategy

- **Backend**: Run pytest on A2UI SDK tests (100 tests must pass)
- **Frontend**: Manual testing with various genetics questions
- **Integration**: Test full pipeline from user input → A2UI generation → component rendering

## Key Dependencies

**Backend**:
- FastAPI (web framework)
- GLM-4.7 (LLM via API)
- sentence-transformers (embeddings)
- A2UI Python SDK (local in `backend/python/a2ui_agent/`)

**Frontend**:
- Vite (build tool)
- Lit 3.3.1 (web components)
- @a2ui/lit (local in `frontend/lit/`)
- @a2ui/web_core (local in `frontend/web_core/`)
- marked (markdown rendering)
- KaTeX (math formulas)

**Note**: A2UI packages are local file dependencies, not npm registry packages.
