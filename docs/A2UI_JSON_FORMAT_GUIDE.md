# 📚 A2UI JSON 格式完整指南

## 🎯 核心概念

A2UI (Agent-to-User Interface) 使用特殊的 JSON 格式来描述 UI 组件。**所有属性值必须用类型包装器包装**。

---

## 📋 完整的 A2UI JSON 结构

### 1. 基本结构（3条消息）

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
            "组件名称": {
              "属性1": {"literalString": "值"},
              "属性2": {"literalBoolean": true}
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
        {
          "key": "_fallback",
          "valueBoolean": true
        }
      ]
    }
  }
]
```

---

## 🔑 类型包装器（Type Wrappers）

### 为什么需要包装器？

A2UI 需要明确知道每个值的类型，以便：
1. 正确地将数据传递给 Web Components
2. 支持数据绑定和响应式更新
3. 验证数据格式

### 包装器类型表

| JavaScript 类型 | A2UI 包装器 | 示例 |
|----------------|------------|------|
| `string` | `literalString` | `{"literalString": "Aa"}` |
| `number` | `literalNumber` | `{"literalNumber": 123}` |
| `boolean` | `literalBoolean` | `{"literalBoolean": true}` |
| `array` | `literalArray` | `{"literalArray": [1, 2, 3]}` |
| `object` | `literalObject` | `{"literalObject": {...}}` |

---

## ❌ 常见错误示例

### 错误 1: 直接使用原始值

```json
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": "Aa",           // ❌ 错误
      "parent2Genotype": "aa",           // ❌ 错误
      "trait": "花色",                   // ❌ 错误
      "showPhenotype": true              // ❌ 错误
    }
  }
}
```

**问题**: A2UI 渲染器无法识别这些值的类型，导致组件无法正确渲染。

### 错误 2: 混合使用包装器和原始值

```json
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": {"literalString": "Aa"},  // ✅ 正确
      "parent2Genotype": "aa",                     // ❌ 错误
      "trait": {"literalString": "花色"},          // ✅ 正确
      "showPhenotype": true                        // ❌ 错误
    }
  }
}
```

**问题**: 部分属性有包装器，部分没有，导致不一致。

---

## ✅ 正确示例

### 示例 1: PunnettSquare 组件

```json
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": {
        "literalString": "Aa"
      },
      "parent2Genotype": {
        "literalString": "aa"
      },
      "trait": {
        "literalString": "花色"
      },
      "showPhenotype": {
        "literalBoolean": true
      }
    }
  }
}
```

### 示例 2: DNAStructure 组件

```json
{
  "component": {
    "DNAStructure": {
      "sequence": {
        "literalString": "ATCGATCG"
      },
      "showLabels": {
        "literalBoolean": true
      },
      "highlightRegions": {
        "literalArray": []
      }
    }
  }
}
```

### 示例 3: PhenotypeDistribution 组件

```json
{
  "component": {
    "PhenotypeDistribution": {
      "trait": {
        "literalString": "花色"
      },
      "data": {
        "literalArray": [
          {"phenotype": "紫色花", "count": 750, "percentage": 75},
          {"phenotype": "白色花", "count": 250, "percentage": 25}
        ]
      },
      "totalCount": {
        "literalNumber": 1000
      },
      "showPercentage": {
        "literalBoolean": true
      }
    }
  }
}
```

---

## 🔍 你的问题诊断

### 你的后端返回（错误）

```json
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": "Aa",           // ❌ 缺少 literalString
      "parent2Genotype": "aa",           // ❌ 缺少 literalString
      "trait": "显性/隐性性状",          // ❌ 缺少 literalString
      "showPhenotype": true              // ❌ 缺少 literalBoolean
    }
  }
}
```

### 应该返回（正确）

```json
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": {
        "literalString": "Aa"
      },
      "parent2Genotype": {
        "literalString": "aa"
      },
      "trait": {
        "literalString": "显性/隐性性状"
      },
      "showPhenotype": {
        "literalBoolean": true
      }
    }
  }
}
```

---

## 🛠️ 问题根源

你的问题是 **LLM 生成的 A2UI JSON 没有使用包装器**。

### 为什么会这样？

1. **LLM 没有严格遵守 prompt 中的格式要求**
2. **prompt 中的示例可能不够明确**
3. **LLM 倾向于生成"更简洁"的 JSON**

### 解决方案

有两个选择：

#### 方案 1: 修复 LLM Prompt（推荐）

在 `main.py` 的 LLM prompt 中添加更明确的示例：

```python
示例格式（注意所有属性值都必须用包装器）：
[
  {{"beginRendering": {{"surfaceId": "genetics_ui", "root": "main_component"}}}},
  {{"surfaceUpdate": {{"surfaceId": "genetics_ui", "components": [
    {{
      "id": "main_component",
      "component": {{
        "PunnettSquare": {{
          "parent1Genotype": {{"literalString": "Aa"}},
          "parent2Genotype": {{"literalString": "aa"}},
          "trait": {{"literalString": "花色"}},
          "showPhenotype": {{"literalBoolean": true}}
        }}
      }}
    }}
  ]}}}}
]

⚠️ 关键：所有属性值必须用包装器：
- 字符串 → {{"literalString": "值"}}
- 布尔值 → {{"literalBoolean": true}}
- 数字 → {{"literalNumber": 123}}
- 数组 → {{"literalArray": [...]}}
```

#### 方案 2: 后端自动修复（临时方案）

创建一个函数自动添加包装器：

```python
def fix_a2ui_wrappers(a2ui_data):
    """自动为 A2UI JSON 添加类型包装器"""
    if not isinstance(a2ui_data, list):
        return a2ui_data

    for message in a2ui_data:
        if "surfaceUpdate" in message:
            components = message["surfaceUpdate"].get("components", [])
            for comp in components:
                if "component" in comp:
                    for comp_name, comp_props in comp["component"].items():
                        for prop_name, prop_value in comp_props.items():
                            # 如果值不是字典，添加包装器
                            if not isinstance(prop_value, dict):
                                if isinstance(prop_value, str):
                                    comp_props[prop_name] = {"literalString": prop_value}
                                elif isinstance(prop_value, bool):
                                    comp_props[prop_name] = {"literalBoolean": prop_value}
                                elif isinstance(prop_value, (int, float)):
                                    comp_props[prop_name] = {"literalNumber": prop_value}
                                elif isinstance(prop_value, list):
                                    comp_props[prop_name] = {"literalArray": prop_value}

    return a2ui_data
```

---

## 📝 快速检查清单

当你收到后端返回的 A2UI JSON 时，检查：

- [ ] 是否是数组格式 `[...]`
- [ ] 第一条消息是否有 `beginRendering`
- [ ] 第二条消息是否有 `surfaceUpdate`
- [ ] 组件 `id` 是否为 `"main_component"`
- [ ] **所有字符串属性是否用 `{"literalString": "..."}`**
- [ ] **所有布尔属性是否用 `{"literalBoolean": true/false}`**
- [ ] **所有数字属性是否用 `{"literalNumber": 123}`**
- [ ] **所有数组属性是否用 `{"literalArray": [...]}`**

---

## 🎓 记忆口诀

**A2UI 的黄金法则**：

> 所有属性值，必须包装；
> 字符串用 literalString，
> 布尔值用 literalBoolean，
> 数字用 literalNumber，
> 数组用 literalArray。

---

**创建时间**: 2026-03-06
**适用版本**: A2UI v0.8
