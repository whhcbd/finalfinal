/**
 * ChatOrchestrator - 聊天编排器
 *
 * 负责协调聊天流程，分离业务逻辑和 UI 组件
 * 支持 WebSocket 实时通信
 */

import { A2UIRenderer } from './a2ui-renderer';

export interface ChatResponse {
  text: string;
  a2ui?: any[];
  error?: string;
}

export class ChatOrchestrator {
  private renderer: A2UIRenderer;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private websocket: WebSocket | null = null;
  private sessionId: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;

  constructor(renderer: A2UIRenderer, sessionId: string) {
    this.renderer = renderer;
    this.sessionId = sessionId;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:8000/ws/chat/${this.sessionId}`;
        console.log('[Orchestrator] 连接 WebSocket:', wsUrl);

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('[Orchestrator] WebSocket 连接成功');
          this.reconnectAttempts = 0;

          // 将 WebSocket 传递给 renderer，用于发送 action 消息
          this.renderer.setWebSocket(this.websocket!);

          // 注册持久的 dataModelUpdate 处理器
          this.onMessage('dataModelUpdate', (data: any) => {
            console.log('[Orchestrator] 收到实时 dataModelUpdate');
            if (data.message) {
              this.handleDataModelUpdate(data.message);
            }
          });

          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.websocket.onerror = (error) => {
          console.error('[Orchestrator] WebSocket 错误:', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('[Orchestrator] WebSocket 连接关闭');
          this.handleDisconnect();
        };

      } catch (error) {
        console.error('[Orchestrator] WebSocket 连接失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type;

      console.log('[Orchestrator] 收到消息:', messageType);

      // 调用注册的处理器
      const handler = this.messageHandlers.get(messageType);
      if (handler) {
        handler(data);
      } else {
        // 只对真正未知的消息类型发出警告，忽略已知但未注册的类型
        const knownTypes = ['text', 'a2ui', 'error', 'dataModelUpdate', 'complete'];
        if (!knownTypes.includes(messageType)) {
          console.warn('[Orchestrator] 未知的消息类型:', messageType);
        } else {
          console.log(`[Orchestrator] 收到 ${messageType} 消息，但当前没有活动的处理器`);
        }
      }

    } catch (error) {
      console.error('[Orchestrator] 解析消息失败:', error);
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Orchestrator] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('[Orchestrator] 重连失败:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('[Orchestrator] 达到最大重连次数，停止重连');
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 发送消息到服务器
   */
  sendMessage(type: string, payload: any): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error('[Orchestrator] WebSocket 未连接');
      return;
    }

    const message = {
      type,
      ...payload
    };

    console.log('[Orchestrator] 发送消息:', type);
    this.websocket.send(JSON.stringify(message));
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * 处理用户消息并生成响应（通过 WebSocket）
   * @param userMessage - 用户输入的消息
   * @returns 包含文本和 A2UI 数据的响应对象
   */
  async processMessage(userMessage: string): Promise<ChatResponse> {
    // 添加到历史记录
    this.conversationHistory.push({ role: 'user', content: userMessage });

    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket 未连接'));
        return;
      }

      let textResponse = '';
      const a2uiMessages: any[] = [];
      let hasError = false;
      let responseComplete = false;
      let textReceived = false;
      let lastMessageTime = Date.now();

      // 创建临时消息处理器
      const textHandler = (data: any) => {
        console.log('[processMessage] 收到 text:', data.text);
        textResponse = data.text;
        textReceived = true;
        lastMessageTime = Date.now();
        if (data.text) {
          this.conversationHistory.push({ role: 'assistant', content: data.text });
        }
      };

      const a2uiHandler = (data: any) => {
        console.log('[processMessage] 收到 a2ui 消息');
        lastMessageTime = Date.now();
        if (data.message) {
          a2uiMessages.push(data.message);
        }
      };

      const errorHandler = (data: any) => {
        hasError = true;
        responseComplete = true;
        // 清理处理器
        this.messageHandlers.delete('text');
        this.messageHandlers.delete('a2ui');
        this.messageHandlers.delete('error');
        this.messageHandlers.delete('complete');
        clearTimeout(timeout);
        resolve({
          text: data.message || '服务器错误',
          error: data.message
        });
      };

      const completeHandler = (data: any) => {
        if (!responseComplete) {
          responseComplete = true;
          console.log('[processMessage] 收到完成信号，返回数据:', { text: textResponse, a2uiCount: a2uiMessages.length });
          // 清理处理器
          this.messageHandlers.delete('text');
          this.messageHandlers.delete('a2ui');
          this.messageHandlers.delete('error');
          this.messageHandlers.delete('complete');
          clearTimeout(timeout);
          resolve({
            text: textResponse,
            a2ui: a2uiMessages.length > 0 ? a2uiMessages : undefined
          });
        }
      };

      // 注册临时处理器
      this.onMessage('text', textHandler);
      this.onMessage('a2ui', a2uiHandler);
      this.onMessage('error', errorHandler);
      this.onMessage('complete', completeHandler);

      // 发送聊天消息
      this.sendMessage('chat', {
        message: userMessage,
        use_ui: true,
        history: this.conversationHistory.slice(-10)
      });

      // 设置超时（5分钟，作为最后的安全网）
      const timeout = setTimeout(() => {
        if (!hasError && !responseComplete) {
          responseComplete = true;
          console.log('[processMessage] 超时，返回数据:', { text: textResponse, a2uiCount: a2uiMessages.length });
          // 清理处理器
          this.messageHandlers.delete('text');
          this.messageHandlers.delete('a2ui');
          this.messageHandlers.delete('error');
          this.messageHandlers.delete('complete');
          resolve({
            text: textResponse || '请求超时',
            a2ui: a2uiMessages.length > 0 ? a2uiMessages : undefined
          });
        }
      }, 300000); // 5分钟超时，只作为安全网
    });
  }

  /**
   * 处理 dataModelUpdate 消息
   * 更新指定 surface 的数据模型
   */
  private handleDataModelUpdate(message: any): void {
    try {
      const surfaceId = message.dataModelUpdate?.surfaceId;
      if (!surfaceId) {
        console.warn('[Orchestrator] dataModelUpdate 缺少 surfaceId');
        return;
      }

      // 使用 renderer 的 updateDataModel 方法
      console.log(`[Orchestrator] 处理 dataModelUpdate for surface: ${surfaceId}`);
      this.renderer.updateDataModel(surfaceId, [message]);

      console.log('[Orchestrator] dataModelUpdate 处理完成，组件将自动更新');
    } catch (error) {
      console.error('[Orchestrator] 处理 dataModelUpdate 失败:', error);
    }
  }

  /**
   * 发送用户操作（action）到服务器
   */
  sendAction(actionName: string, context: any): void {
    this.sendMessage('action', {
      action: {
        name: actionName,
        context
      }
    });
  }

  /**
   * 渲染 A2UI 内容到指定容器
   */
  renderA2UI(container: HTMLElement, a2uiData: any[]): void {
    if (a2uiData && a2uiData.length > 0) {
      console.log('[Orchestrator] Rendering A2UI with', a2uiData.length, 'messages');
      this.renderer.render(container, a2uiData);
    }
  }

  /**
   * 清除对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 获取对话历史
   */
  getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }
}
