import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    target: 'esnext'
  },
  resolve: {
    dedupe: ['lit'],
    alias: {
      '@a2ui/web_core/types/types': '../../web_core/src/v0_8/types/types.ts',
      '@a2ui/web_core/data/guards': '../../web_core/src/v0_8/data/guards.ts',
      '@a2ui/web_core/data/model-processor': '../../web_core/src/v0_8/data/model-processor.ts',
      '@a2ui/web_core/types/primitives': '../../web_core/src/v0_8/types/primitives.ts',
      '@a2ui/web_core/styles/index': '../../web_core/src/v0_8/styles/index.ts',
      '@a2ui/web_core': '../../web_core/src/v0_8/index.ts',
      '@a2ui/lit': '../../lit/src/0.8/index.ts',
      '@a2ui/lit/types/types': '../../lit/src/0.8/types/types.ts',
      '@a2ui/lit/types/primitives': '../../lit/src/0.8/types/primitives.ts',
      '@a2ui/lit/styles/index': '../../web_core/src/v0_8/styles/index.ts',
      '@a2ui/lit/data/guards': '../../web_core/src/v0_8/data/guards.ts',
      '@a2ui/lit/data/model-processor': '../../web_core/src/v0_8/data/model-processor.ts',
      '@a2ui/web_core/events': '../../web_core/src/v0_8/events/index.ts',
      '@a2ui/lit/events': '../../web_core/src/v0_8/events/index.ts'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
