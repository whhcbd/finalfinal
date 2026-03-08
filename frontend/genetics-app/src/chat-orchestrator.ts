/**
 * ChatOrchestrator - 聊天编排器
 *
 * 负责协调聊天流程，分离业务逻辑和 UI 组件
 * 参考：personalized_learning/src/chat-orchestrator.ts
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

  constructor(renderer: A2UIRenderer) {
    this.renderer = renderer;
  }

  /**
   * 处理用户消息并生成响应
   * @param userMessage - 用户输入的消息
   * @param sessionId - 会话 ID
   * @returns 包含文本和 A2UI 数据的响应对象
   */
  async processMessage(
    userMessage: string,
    sessionId: string
  ): Promise<ChatResponse> {
    // 添加到历史记录
    this.conversationHistory.push({ role: 'user', content: userMessage });

    try {
      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          use_ui: true,
          history: this.conversationHistory.slice(-10) // 只发送最近 10 条消息
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // 处理错误响应
      if (data.error) {
        console.error('[Orchestrator] Server error:', data.error);
        return { text: '服务器错误，请稍后重试', error: data.error };
      }

      // 添加助手响应到历史记录
      if (data.text) {
        this.conversationHistory.push({ role: 'assistant', content: data.text });
      }

      // 返回响应数据
      return {
        text: data.text || '',
        a2ui: data.a2ui
      };

    } catch (error) {
      console.error('[Orchestrator] Error processing message:', error);
      return {
        text: '网络连接失败，请检查网络设置',
        error: error instanceof Error ? error.message : String(error)
      };
    }
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
