/**
 * A2UI Renderer - 标准 A2UI 渲染器
 *
 * 使用 @a2ui/lit 的标准信号处理器来渲染 A2UI JSON
 * 参考：personalized_learning/src/a2ui-renderer.ts
 */

import { v0_8 } from "@a2ui/lit";

type A2uiMessageProcessor = InstanceType<typeof v0_8.Data.A2uiMessageProcessor>;

export class A2UIRenderer {
  private processors: Map<string, A2uiMessageProcessor> = new Map();

  /**
   * 渲染 A2UI JSON 到指定容器
   * @param container - 渲染容器（通常是 .a2ui-container）
   * @param a2uiMessages - A2UI 消息数组
   */
  render(container: HTMLElement, a2uiMessages: unknown[]): void {
    if (!a2uiMessages || a2uiMessages.length === 0) {
      console.warn('[A2UIRenderer] No A2UI messages to render');
      return;
    }

    console.log(`[A2UIRenderer] Rendering ${a2uiMessages.length} A2UI messages`);

    // 创建标准的信号处理器
    const processor = v0_8.Data.createSignalA2uiMessageProcessor();

    // 处理所有 A2UI 消息
    try {
      processor.processMessages(a2uiMessages as v0_8.Types.ServerToClientMessage[]);
      console.log('[A2UIRenderer] Messages processed successfully');
    } catch (error) {
      console.error('[A2UIRenderer] Error processing messages:', error);
      this.showError(container, '渲染 A2UI 内容时出错');
      return;
    }

    // 渲染所有 surfaces
    const surfaces = processor.getSurfaces();
    console.log(`[A2UIRenderer] Found ${surfaces.size} surfaces to render`);

    for (const [surfaceId, surface] of surfaces.entries()) {
      this.renderSurface(container, surfaceId, surface, processor);
      this.processors.set(surfaceId, processor);
    }
  }

  /**
   * 渲染单个 Surface
   */
  private renderSurface(
    container: HTMLElement,
    surfaceId: string,
    surface: v0_8.Types.Surface,
    processor: A2uiMessageProcessor
  ): void {
    console.log(`[A2UIRenderer] Rendering surface: ${surfaceId}`);

    // 创建 a2ui-surface 元素
    const surfaceElement = document.createElement('a2ui-surface') as any;
    surfaceElement.setAttribute('surface-id', surfaceId);

    // 设置 surface 数据和处理器
    if (surfaceElement) {
      surfaceElement.surface = surface;
      surfaceElement.processor = processor;
      // 🔑 关键：启用自定义组件！
      surfaceElement.enableCustomElements = true;
    }

    container.appendChild(surfaceElement);
  }

  /**
   * 显示错误信息
   */
  private showError(container: HTMLElement, message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    `;
    errorDiv.textContent = `❌ ${message}`;
    container.appendChild(errorDiv);
  }

  /**
   * 获取指定 surface 的处理器
   */
  getProcessor(surfaceId: string): A2uiMessageProcessor | undefined {
    return this.processors.get(surfaceId);
  }

  /**
   * 清除所有渲染的内容
   */
  clear(): void {
    this.processors.clear();
  }
}
