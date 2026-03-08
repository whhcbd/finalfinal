import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [],
  build: {
    target: 'esnext'
  },
  resolve: {
    dedupe: ['lit'],
    alias: {
      '@a2ui/web_core/types/types': path.resolve(__dirname, '../web_core/src/v0_8/types/types.ts'),
      '@a2ui/web_core/data/guards': path.resolve(__dirname, '../web_core/src/v0_8/data/guards.ts'),
      '@a2ui/web_core/data/model-processor': path.resolve(__dirname, '../web_core/src/v0_8/data/model-processor.ts'),
      '@a2ui/web_core/types/primitives': path.resolve(__dirname, '../web_core/src/v0_8/types/primitives.ts'),
      '@a2ui/web_core/styles/index': path.resolve(__dirname, '../web_core/src/v0_8/styles/index.ts'),
      '@a2ui/web_core': path.resolve(__dirname, '../web_core/src/v0_8/index.ts'),
      // ⚠️ 注意：@a2ui/lit/ui 必须在 @a2ui/lit 之前，否则会被 @a2ui/lit 匹配
      '@a2ui/lit/ui': path.resolve(__dirname, '../lit/src/0.8/ui/ui.ts'),
      '@a2ui/lit/types/types': path.resolve(__dirname, '../lit/src/0.8/types/types.ts'),
      '@a2ui/lit/types/primitives': path.resolve(__dirname, '../lit/src/0.8/types/primitives.ts'),
      '@a2ui/lit/styles/index': path.resolve(__dirname, '../web_core/src/v0_8/styles/index.ts'),
      '@a2ui/lit/data/guards': path.resolve(__dirname, '../web_core/src/v0_8/data/guards.ts'),
      '@a2ui/lit/data/model-processor': path.resolve(__dirname, '../web_core/src/v0_8/data/model-processor.ts'),
      '@a2ui/lit/events': path.resolve(__dirname, '../web_core/src/v0_8/events/index.ts'),
      '@a2ui/lit': path.resolve(__dirname, '../lit/src/index.ts'),
      '@a2ui/web_core/events': path.resolve(__dirname, '../web_core/src/v0_8/events/index.ts')
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
