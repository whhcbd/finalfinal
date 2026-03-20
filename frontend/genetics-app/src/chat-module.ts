import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import * as marked from 'marked';
import * as katex from 'katex';
import { ChatOrchestrator } from './chat-orchestrator';
import { A2UIRenderer } from './a2ui-renderer';

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  a2uiData?: any;
  timestamp: Date;
  isStreaming?: boolean;
  isTyping?: boolean;
  a2uiLoading?: boolean;
  isFallback?: boolean;
  a2uiRendered?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: Date;
}

@customElement('chat-module')
export class ChatModule extends LitElement {
  @state()
  conversations: Conversation[] = [];

  @state()
  currentConversationId: string | null = null;

  @state()
  inputMessage = '';

  @state()
  isSidebarOpen = true;

  @state()
  isLoading = false;

  @state()
  isStreaming = false;

  @query('#message-input')
  inputElement: HTMLTextAreaElement | undefined;

  #eventSource: EventSource | null = null;
  private isProcessingNewMessage = false;
  private typewriterSpeed = 30;
  private orchestrator: ChatOrchestrator | null = null;

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: calc(100vh - 64px);
      background: #fafafa;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative;
      overflow: hidden;
    }

    .container {
      display: flex;
      width: 100%;
      height: 100%;
      position: relative;
    }

    .sidebar {
      width: 280px;
      background: #ffffff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }

    .sidebar.closed {
      transform: translateX(-100%);
      position: absolute;
      z-index: 100;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #ffffff;
    }

    .sidebar-header h2 {
      margin: 0 0 16px 0;
      font-size: 1.1em;
      font-weight: 600;
      color: #111827;
      letter-spacing: -0.01em;
    }

    .new-chat-btn {
      width: 100%;
      padding: 12px 16px;
      background: #111827;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9em;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .new-chat-btn:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }

    .new-chat-btn:active {
      transform: translateY(0);
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      scrollbar-width: thin;
      scrollbar-color: #e5e7eb transparent;
    }

    .conversations-list::-webkit-scrollbar {
      width: 6px;
    }

    .conversations-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .conversations-list::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 3px;
    }

    .conversations-list::-webkit-scrollbar-thumb:hover {
      background: #d1d5db;
    }

    .conversation-item {
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 4px;
      position: relative;
      background: transparent;
      border: 1px solid transparent;
    }

    .conversation-item:hover {
      background: #f3f4f6;
      border-color: #e5e7eb;
    }

    .conversation-item.active {
      background: #f3f4f6;
      border-color: #111827;
    }

    .conversation-item.active .conversation-title {
      color: #111827;
      font-weight: 600;
    }

    .conversation-title {
      font-weight: 500;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #111827;
      font-size: 0.9em;
    }

    .conversation-time {
      font-size: 0.75em;
      color: #6b7280;
    }

    .conversation-actions {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .conversation-item:hover .conversation-actions {
      opacity: 1;
    }

    .delete-btn {
      background: #f3f4f6;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px 6px;
      font-size: 0.9em;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .delete-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .conversation-item.active .delete-btn {
      color: #111827;
      background: #e5e7eb;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      position: relative;
    }

    .chat-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
    }

    .toggle-sidebar-btn {
      background: #f3f4f6;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      color: #111827;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-sidebar-btn:hover {
      background: #e5e7eb;
    }

    .toggle-sidebar-btn:active {
      transform: scale(0.95);
    }

    .chat-title {
      font-size: 1.1em;
      font-weight: 600;
      color: #111827;
      letter-spacing: -0.01em;
      flex: 1;
    }

    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85em;
      font-weight: 500;
      transition: all 0.2s;
      color: #111827;
    }

    .action-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .action-btn.stop {
      background: #dc2626;
      color: white;
      border-color: transparent;
    }

    .action-btn.stop:hover {
      background: #b91c1c;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scrollbar-width: thin;
      scrollbar-color: #e5e7eb transparent;
    }

    .messages-container::-webkit-scrollbar {
      width: 8px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 4px;
    }

    .message {
      max-width: 75%;
      padding: 16px 20px;
      border-radius: 12px;
      position: relative;
      animation: messageSlideIn 0.3s ease;
    }

    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      align-self: flex-end;
      background: #111827;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant {
      align-self: flex-start;
      background: #f3f4f6;
      color: #111827;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }

    .message.system {
      align-self: center;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      max-width: 85%;
      font-size: 0.9em;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.8em;
      opacity: 0.7;
      font-weight: 500;
    }

    .message-content {
      line-height: 1.6;
    }

    .message-content h1 {
      font-size: 1.5em;
      margin: 0.8em 0 0.5em;
      font-weight: 600;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.3em;
    }

    .message-content h2 {
      font-size: 1.3em;
      margin: 0.7em 0 0.4em;
      font-weight: 600;
      color: #111827;
    }

    .message-content h3 {
      font-size: 1.1em;
      margin: 0.6em 0 0.3em;
      font-weight: 600;
      color: #111827;
    }

    .message-content p {
      margin: 1em 0;
      color: inherit;
    }

    .message-content ul, .message-content ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    .message-content li {
      margin: 0.5em 0;
    }

    .message-content code {
      background: #e5e7eb;
      color: #111827;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
    }

    .message.user .message-content code {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .message-content pre {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid #e5e7eb;
    }

    .message-content pre code {
      background: none;
      padding: 0;
      border: none;
      color: #111827;
    }

    .message-content blockquote {
      border-left: 3px solid #111827;
      padding-left: 1em;
      margin: 1em 0;
      color: #6b7280;
      font-style: italic;
    }

    .message-content strong {
      font-weight: 600;
      color: inherit;
    }

    .message-content em {
      font-style: italic;
    }

    .message-content a {
      color: #111827;
      text-decoration: underline;
      transition: opacity 0.2s;
    }

    .message-content a:hover {
      opacity: 0.7;
    }

    .message.user .message-content a {
      color: white;
    }

    .message-content .katex {
      font-size: 1.1em;
      overflow-x: auto;
      padding: 4px;
    }

    .message-content .katex .katex-display {
      display: block;
      margin: 1em 0;
      text-align: center;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .message-content .katex .katex-inline {
      display: inline-block;
      vertical-align: middle;
      padding: 2px 4px;
    }

    .message-content.typing::after {
      content: '▋';
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .a2ui-container {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-top: 12px;
      border: 1px solid #e0e0e0;
      width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }

    .a2ui-loading {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 24px;
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      border: 1px dashed #dee2e6;
    }

    .a2ui-loading .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #111827;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .a2ui-loading span {
      color: #111827;
      font-size: 0.9em;
    }

    .a2ui-fallback-notice {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeIn 0.3s ease;
    }

    .a2ui-fallback-notice .notice-icon {
      font-size: 1.2em;
    }

    .a2ui-fallback-notice .notice-text {
      color: #92400e;
      font-size: 0.9em;
      font-weight: 500;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .message:hover .message-actions {
      opacity: 1;
    }

    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9em;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .copy-btn:hover {
      opacity: 1;
    }

    .input-area {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      background: #ffffff;
    }

    .input-container {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      max-width: 1200px;
      margin: 0 auto;
    }

    .message-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95em;
      font-family: 'Inter', sans-serif;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      transition: all 0.2s;
      background: white;
      color: #111827;
      line-height: 1.5;
    }

    .message-input::placeholder {
      color: #9ca3af;
    }

    .message-input:focus {
      outline: none;
      border-color: #111827;
    }

    .send-btn {
      padding: 10px 20px;
      background: #111827;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9em;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      min-width: 70px;
    }

    .send-btn:hover:not(:disabled) {
      background: #1f2937;
    }

    .send-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .empty-state-icon {
      font-size: 4em;
      margin-bottom: 16px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 16px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #6b7280;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        position: absolute;
        height: 100%;
        z-index: 100;
      }

      .sidebar.closed {
        transform: translateX(-100%);
      }

      .message {
        max-width: 90%;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadConversations();

    // 只在没有对话时创建新对话
    if (this.conversations.length === 0) {
      this.createNewConversation();
    } else {
      // 如果有对话，选择最新的一个
      this.currentConversationId = this.conversations[0].id;
    }

    // 初始化 ChatOrchestrator 并连接 WebSocket
    const renderer = new A2UIRenderer();
    const sessionId = this.currentConversationId || crypto.randomUUID();
    this.orchestrator = new ChatOrchestrator(renderer, sessionId);

    // 连接 WebSocket
    this.orchestrator.connect().then(() => {
      console.log('[ChatModule] WebSocket 连接成功');
    }).catch(error => {
      console.error('[ChatModule] WebSocket 连接失败:', error);
    });

    // 等待 DOM 更新后重新渲染历史消息中的 A2UI 组件
    this.updateComplete.then(() => {
      // 使用 setTimeout 确保 DOM 完全渲染
      setTimeout(() => {
        this.reRenderHistoricalA2UI();
      }, 100);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStreaming();

    // 断开 WebSocket 连接
    if (this.orchestrator) {
      this.orchestrator.disconnect();
    }
  }

  private reRenderHistoricalA2UI() {
    if (!this.orchestrator) return;

    const conv = this.getCurrentConversation();
    if (!conv) return;

    // 遍历所有消息，重新渲染有 A2UI 数据的消息
    conv.messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.a2uiData) {
        // 等待下一帧，确保 DOM 已经渲染
        requestAnimationFrame(() => {
          const messageElement = this.shadowRoot?.querySelector(`.message[data-id="${msg.id}"]`);
          if (messageElement) {
            const a2uiContainer = messageElement.querySelector('.a2ui-container');
            if (a2uiContainer && a2uiContainer.children.length === 0) {
              // 只在容器为空时才渲染
              try {
                this.orchestrator!.renderA2UI(a2uiContainer as HTMLElement, msg.a2uiData);
                console.log(`[ChatModule] Re-rendered A2UI for message ${msg.id}`);
              } catch (error) {
                console.error(`[ChatModule] Failed to re-render A2UI for message ${msg.id}:`, error);
              }
            }
          }
        });
      }
    });
  }

  private loadConversations() {
    const stored = localStorage.getItem('conversations');
    if (stored) {
      this.conversations = JSON.parse(stored).map((conv: any) => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  }

  private saveConversations() {
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
  }

  private createNewConversation() {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: '新对话',
      messages: [],
      timestamp: new Date()
    };
    this.conversations.unshift(newConv);
    this.currentConversationId = newConv.id;
    this.saveConversations();
  }

  private getCurrentConversation() {
    return this.conversations.find(c => c.id === this.currentConversationId);
  }

  private selectConversation(id: string) {
    this.currentConversationId = id;
    // 切换对话后重新渲染 A2UI 组件
    this.updateComplete.then(() => {
      setTimeout(() => {
        this.reRenderHistoricalA2UI();
      }, 100);
    });
  }

  private deleteConversation(id: string, event: Event) {
    event.stopPropagation();
    this.conversations = this.conversations.filter(c => c.id !== id);
    if (this.currentConversationId === id) {
      this.currentConversationId = this.conversations.length > 0 ? this.conversations[0].id : null;
    }
    this.saveConversations();
  }

  private toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private clearChat() {
    const conv = this.getCurrentConversation();
    if (conv) {
      conv.messages = [];
      this.saveConversations();
      this.requestUpdate();
    }
  }

  private async sendMessage() {
    const content = this.inputMessage.trim();
    if (!content || this.isStreaming) return;

    this.isProcessingNewMessage = true;

    const conv = this.getCurrentConversation();
    if (!conv) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    conv.messages.push(userMessage);
    this.inputMessage = '';
    this.saveConversations();

    if (conv.messages.length === 1) {
      conv.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      this.saveConversations();
    }

    this.requestUpdate();

    await this.fetchAIResponse(content);

    this.isProcessingNewMessage = false;
  }

  private async fetchAIResponse(userMessage: string) {
    this.isStreaming = true;
    this.isLoading = true;

    const conv = this.getCurrentConversation();
    if (!conv) return;

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      isTyping: true
    };

    conv.messages.push(assistantMessage);
    this.requestUpdate();

    // 等待 DOM 更新
    await this.updateComplete;

    try {
      this.setTypingIndicator(assistantMessage, false);

      // 使用 ChatOrchestrator 通过 WebSocket 处理消息
      if (this.orchestrator) {
        // 调用 orchestrator 获取响应数据，onChunk 实时更新消息内容
        // onA2UI 在后台 A2UI 生成完成后被调用
        assistantMessage.a2uiLoading = true;
        this.requestUpdate();

        const response = await this.orchestrator.processMessage(
          userMessage,
          (chunk: string) => {
            assistantMessage.content += chunk;
            this.requestUpdate();
          },
          async (a2uiData: any[]) => {
            // A2UI 后台生成完成
            if (a2uiData.length === 0) {
              // 无 A2UI 内容，关闭 loading
              assistantMessage.a2uiLoading = false;
              this.requestUpdate();
              return;
            }
            // 有 A2UI 内容，先确保容器存在再渲染
            assistantMessage.a2uiData = a2uiData;
            assistantMessage.a2uiLoading = false;
            this.requestUpdate();
            await this.updateComplete;
            const messageElement = this.shadowRoot?.querySelector(`.message[data-id="${assistantMessage.id}"]`);
            if (messageElement) {
              const a2uiContainer = messageElement.querySelector('.a2ui-container');
              if (a2uiContainer) {
                this.orchestrator!.renderA2UI(a2uiContainer as HTMLElement, a2uiData);
                assistantMessage.a2uiRendered = true;
                this.saveConversations();
                this.requestUpdate();
              }
            }
          }
        );

        // 以后端清理后的完整文本为准
        assistantMessage.content = response.text;
        // a2uiLoading 由 onA2UI 回调或 a2ui_complete（无内容时）负责关闭
      }

      assistantMessage.isStreaming = false;
      this.saveConversations();
      this.requestUpdate();

    } catch (error) {
      console.error('Error fetching AI response:', error);
      this.setTypingIndicator(assistantMessage, false);
      this.showError(assistantMessage, '网络连接失败，请检查网络设置');
    } finally {
      this.isStreaming = false;
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  private stopStreaming() {
    if (this.#eventSource) {
      this.#eventSource.close();
      this.#eventSource = null;
    }
    this.isStreaming = false;
    this.isLoading = false;

    const conv = this.getCurrentConversation();
    if (conv) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg && lastMsg.isStreaming) {
        lastMsg.isStreaming = false;
        this.saveConversations();
      }
    }
    this.requestUpdate();
  }

  private getConversationHistory(): any[] {
    const conv = this.getCurrentConversation();
    if (!conv) return [];
    return conv.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private setTypingIndicator(message: ChatMessage, isTyping: boolean): void {
    message.isTyping = isTyping;
    this.requestUpdate();
  }

  private showError(message: ChatMessage, errorText: string): void {
    message.content = errorText;
    message.isStreaming = false;
    this.saveConversations();
    this.requestUpdate();
  }

  private showFallbackNotice(message: ChatMessage): void {
    setTimeout(() => {
      const container = this.shadowRoot?.querySelector(`[data-message-id="${message.id}"] .a2ui-container`);
      if (container) {
        const notice = document.createElement('div');
        notice.className = 'a2ui-fallback-notice';
        notice.innerHTML = `
          <span class="notice-icon">⚠️</span>
          <span class="notice-text">使用简化内容，完整功能正在加载...</span>
        `;
        container.insertBefore(notice, container.firstChild);
      }
    }, 600);
  }

  private async typeWriterEffect(message: ChatMessage, text: string): Promise<void> {
    message.content = '';
    this.requestUpdate();

    const charsPerSecond = this.typewriterSpeed;
    const baseDelay = 1000 / charsPerSecond;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      message.content = text.substring(0, i + 1);
      this.requestUpdate();

      let delay = baseDelay;
      if ('，。！？；：\n'.includes(char)) {
        delay = baseDelay * 3;
      } else if (' '.includes(char)) {
        delay = baseDelay * 1.5;
      }

      await new Promise(resolve => setTimeout(resolve, delay));

      if (this.isProcessingNewMessage) {
        message.content = text;
        break;
      }
    }

    message.content = text;
    this.requestUpdate();
  }

  private renderA2UI(message: ChatMessage, a2uiData: any[]): void {
    // 这个方法现在已经被 ChatOrchestrator 替代
    // 保留空实现以避免破坏现有代码
    console.warn('[ChatModule] renderA2UI is deprecated, use ChatOrchestrator instead');
  }

  private initializeA2UIComponents(message: ChatMessage, a2uiData: any[]): void {
    // 这个方法现在已经被 ChatOrchestrator 替代
    // 保留空实现以避免破坏现有代码
    console.warn('[ChatModule] initializeA2UIComponents is deprecated, use ChatOrchestrator instead');
  }

  private async copyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      alert('消息已复制到剪贴板');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  render() {
    const conv = this.getCurrentConversation();

    return html`
      <div class="container">
        <aside class="sidebar ${this.isSidebarOpen ? '' : 'closed'}">
          <div class="sidebar-header">
            <h2>💬 聊天历史</h2>
            <button class="new-chat-btn" @click=${() => this.createNewConversation()}>
              <span>➕</span>
              <span>新对话</span>
            </button>
          </div>
          <div class="conversations-list">
            ${repeat(
              this.conversations,
              (conv) => conv.id,
              (conv) => html`
                <div class="conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}"
                     @click=${() => this.selectConversation(conv.id)}>
                  <div class="conversation-title">${conv.title}</div>
                  <div class="conversation-time">${this.formatTime(conv.timestamp)}</div>
                  <div class="conversation-actions">
                    <button class="delete-btn" @click=${(e: Event) => this.deleteConversation(conv.id, e)}>
                      🗑️
                    </button>
                  </div>
                </div>
              `
            )}
          </div>
        </aside>

        <main class="main-content">
          <div class="chat-header">
            <button class="toggle-sidebar-btn" @click=${() => this.toggleSidebar()}>
              ${this.isSidebarOpen ? '◀' : '▶'}
            </button>
            <h1 class="chat-title">${conv?.title || '新对话'}</h1>
            <div class="header-actions">
              <button class="action-btn" @click=${() => this.clearChat()}>清除</button>
              ${this.isStreaming ? html`
                <button class="action-btn stop" @click=${() => this.stopStreaming()}>停止</button>
              ` : nothing}
            </div>
          </div>

          <div class="messages-container" id="messages">
            ${conv && conv.messages.length > 0 ? repeat(
              conv.messages,
              (msg) => msg.id,
              (msg) => html`
                <div class="message ${msg.role} ${msg.isTyping ? 'typing' : ''}" data-id="${msg.id}">
                  <div class="message-header">
                    ${msg.role === 'user' ? '👤 你' : msg.role === 'assistant' ? '🤖 AI' : '📋 系统'}
                    <span>${this.formatTime(msg.timestamp)}</span>
                  </div>
                  <div class="message-content ${msg.isTyping ? 'typing' : ''}">
                    ${msg.isTyping && !msg.content ? this.renderTypingIndicator() : unsafeHTML(marked.parse(this.renderWithKaTeX(msg.content, msg.isStreaming ?? false)) as string)}
                  </div>
                  ${msg.a2uiLoading ? html`
                    <div class="a2ui-loading">
                      <div class="spinner"></div>
                      <span>正在生成学习内容...</span>
                    </div>
                  ` : ''}
                  ${msg.role === 'assistant' && (msg.a2uiData || msg.a2uiLoading) ? html`
                    <div class="a2ui-container"></div>
                  ` : nothing}
                  <div class="message-actions">
                    <button class="copy-btn" @click=${() => this.copyMessage(msg)}>📋 复制</button>
                  </div>
                </div>
              `
            ) : html`
              <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <p>开始新的对话吧！</p>
              </div>
            `}
          </div>

          <div class="input-area">
            <div class="input-container">
              <textarea
                id="message-input"
                class="message-input"
                placeholder="输入消息..."
                .value=${this.inputMessage}
                @input=${(e: Event) => {
                  const target = e.target as HTMLTextAreaElement;
                  this.inputMessage = target.value;
                }}
                @keydown=${this.handleKeyDown}
                ?disabled=${this.isStreaming}
              ></textarea>
              <button class="send-btn" @click=${() => this.sendMessage()} ?disabled=${!this.inputMessage.trim() || this.isStreaming}>
                发送
              </button>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  private renderTypingIndicator() {
    return html`
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }

  private renderWithKaTeX(content: string, isStreaming: boolean): string {
    if (isStreaming) {
      return content;
    }
    
    let processedContent = content;
    
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, latexContent) => {
      try {
        return katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: true
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        return match;
      }
    });
    
    processedContent = processedContent.replace(/\$([^$]+)\$/g, (match, latexContent) => {
      try {
        return katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: false
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        return match;
      }
    });
    
    return processedContent;
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString();
  }
}
