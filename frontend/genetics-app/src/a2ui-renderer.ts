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
  private websocket: WebSocket | null = null;

  /**
   * 设置 WebSocket 连接（用于发送 action 消息）
   */
  setWebSocket(websocket: WebSocket): void {
    this.websocket = websocket;
    console.log('[A2UIRenderer] WebSocket 已设置');
  }

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

    // 清空容器
    container.innerHTML = '';
    console.log('[A2UIRenderer] Container cleared');

    // 创建标准的信号处理器
    const processor = v0_8.Data.createSignalA2uiMessageProcessor();

    // 处理所有 A2UI 消息
    try {
      console.log('[A2UIRenderer] Processing messages:', a2uiMessages);
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
      console.log(`[A2UIRenderer] Surface ${surfaceId} state:`, {
        rootComponentId: surface.rootComponentId,
        hasComponentTree: !!surface.componentTree,
        componentsCount: surface.components?.size || 0,
        dataModelSize: surface.dataModel?.size || 0,
        componentTree: surface.componentTree
      });
      console.log(`[A2UIRenderer] ComponentTree details:`, surface.componentTree);
      this.renderSurface(container, surfaceId, surface, processor);
      // 保存处理器以便后续增量更新
      this.processors.set(surfaceId, processor);
    }
  }

  /**
   * 更新已存在的 surface 的数据模型
   * @param surfaceId - Surface ID
   * @param dataModelMessages - dataModelUpdate 消息数组
   */
  updateDataModel(surfaceId: string, dataModelMessages: unknown[]): void {
    const processor = this.processors.get(surfaceId);
    if (!processor) {
      console.warn(`[A2UIRenderer] 未找到 surface ${surfaceId} 的处理器，无法更新数据模型`);
      return;
    }

    try {
      console.log(`[A2UIRenderer] 更新 surface ${surfaceId} 的数据模型`);
      processor.processMessages(dataModelMessages as v0_8.Types.ServerToClientMessage[]);
      console.log('[A2UIRenderer] 数据模型更新成功，组件将自动响应');
    } catch (error) {
      console.error('[A2UIRenderer] 更新数据模型失败:', error);
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

      console.log('[A2UIRenderer] Surface data set:', {
        hasSurface: !!surface,
        hasProcessor: !!processor,
        surfaceKeys: surface ? Object.keys(surface) : [],
        enableCustomElements: true
      });
    }

    // 监听 action 事件
    surfaceElement.addEventListener('action', (event: CustomEvent) => {
      this.handleAction(surfaceId, event.detail);
    });

    container.appendChild(surfaceElement);
    console.log('[A2UIRenderer] Surface element appended to container');

    // 验证元素是否真的添加到了 DOM
    console.log('[A2UIRenderer] Container children count:', container.children.length);
    console.log('[A2UIRenderer] Container is connected:', container.isConnected);
    console.log('[A2UIRenderer] Surface element parent:', surfaceElement.parentElement);
    console.log('[A2UIRenderer] Surface element tag:', surfaceElement.tagName);

    // 等待一帧后检查渲染状态
    requestAnimationFrame(() => {
      console.log('[A2UIRenderer] After frame - Surface in container:', container.contains(surfaceElement));
      console.log('[A2UIRenderer] After frame - Surface shadowRoot:', !!surfaceElement.shadowRoot);
      console.log('[A2UIRenderer] After frame - Surface.surface:', surfaceElement.surface);
      console.log('[A2UIRenderer] After frame - Surface.processor:', surfaceElement.processor);

      // 检查是否有错误 - 使用 shadowRoot 而不是 children
      const hasShadowRoot = !!surfaceElement.shadowRoot;
      const hasSurface = !!surfaceElement.surface;
      const hasComponentTree = !!surfaceElement.surface?.componentTree;

      if (!hasShadowRoot && !hasComponentTree) {
        console.error('[A2UIRenderer] Surface rendering failed - no shadow root or component tree');
      } else {
        console.log('[A2UIRenderer] Surface rendered successfully');
      }
    });
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

  /**
   * 处理 action 事件
   */
  private handleAction(surfaceId: string, actionDetail: any): void {
    console.log(`[A2UIRenderer] Action triggered: surface=${surfaceId}`, actionDetail);

    // 获取当前 surface 的数据模型
    const processor = this.processors.get(surfaceId);
    const dataModel = processor ? this.extractDataModel(processor) : {};

    // 发送 action 消息到后端
    this.sendAction(surfaceId, actionDetail, dataModel);
  }

  /**
   * 发送 action 消息到后端
   */
  private sendAction(surfaceId: string, action: any, dataModel: any): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error('[A2UIRenderer] WebSocket 未连接，无法发送 action');
      return;
    }

    // 构造符合 A2UI v0.8 规范的 action 消息
    const actionMessage = {
      type: 'action',
      surfaceId: surfaceId,
      action: {
        name: action.name || action.actionName || 'unknown',
        context: {
          ...dataModel,
          ...action.context
        }
      }
    };

    console.log('[A2UIRenderer] 发送 action 消息:', actionMessage);

    try {
      this.websocket.send(JSON.stringify(actionMessage));
    } catch (error) {
      console.error('[A2UIRenderer] 发送 action 消息失败:', error);
    }
  }

  /**
   * 从处理器中提取数据模型
   */
  private extractDataModel(processor: A2uiMessageProcessor): any {
    try {
      // 获取数据模型的所有键值对
      const dataModel: any = {};
      const surfaces = processor.getSurfaces();

      // 遍历所有 surface 的数据
      for (const [_, surface] of surfaces.entries()) {
        if (surface.dataModel) {
          // 提取数据模型中的值
          Object.assign(dataModel, this.flattenDataModel(surface.dataModel));
        }
      }

      return dataModel;
    } catch (error) {
      console.error('[A2UIRenderer] 提取数据模型失败:', error);
      return {};
    }
  }

  /**
   * 扁平化数据模型
   */
  private flattenDataModel(dataModel: any, prefix: string = ''): any {
    const result: any = {};

    for (const key in dataModel) {
      const value = dataModel[key];
      const fullKey = prefix ? `${prefix}/${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // 递归处理嵌套对象
        Object.assign(result, this.flattenDataModel(value, fullKey));
      } else {
        // 直接存储值
        result[fullKey] = value;
      }
    }

    return result;
  }
}
