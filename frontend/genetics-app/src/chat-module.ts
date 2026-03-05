import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import * as marked from 'marked';
import * as katex from 'katex';

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

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .sidebar {
      width: 300px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }

    .sidebar.closed {
      transform: translateX(-100%);
      position: absolute;
      z-index: 100;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .sidebar-header h2 {
      margin: 0 0 15px 0;
      font-size: 1.3em;
      color: #333;
    }

    .new-chat-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .new-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }

    .conversation-item {
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      margin-bottom: 4px;
      position: relative;
    }

    .conversation-item:hover {
      background: #f0f0f0;
    }

    .conversation-item.active {
      background: #667eea;
      color: white;
    }

    .conversation-title {
      font-weight: 500;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conversation-time {
      font-size: 0.8em;
      opacity: 0.7;
    }

    .conversation-actions {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .conversation-item:hover .conversation-actions {
      opacity: 1;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      font-size: 1.2em;
    }

    .conversation-item.active .delete-btn {
      color: white;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .chat-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
    }

    .toggle-sidebar-btn {
      background: none;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
    }

    .toggle-sidebar-btn:hover {
      background: #f0f0f0;
    }

    .chat-title {
      font-size: 1.2em;
      font-weight: 600;
      color: #333;
    }

    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 8px 16px;
      border: 1px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .action-btn.stop {
      background: #ff4444;
      color: white;
      border-color: #ff4444;
    }

    .action-btn.stop:hover {
      background: #cc0000;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      position: relative;
      animation: messageIn 0.3s ease;
    }

    @keyframes messageIn {
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message.assistant {
      align-self: flex-start;
      background: #f0f0f0;
      color: #333;
    }

    .message.system {
      align-self: center;
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
      max-width: 90%;
      font-size: 0.9em;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.85em;
      opacity: 0.8;
    }

    .message-content {
      line-height: 1.6;
    }

    .message-content h1 {
      font-size: 1.5em;
      margin: 0.67em 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }

    .message-content h2 {
      font-size: 1.3em;
      margin: 0.83em 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }

    .message-content h3 {
      font-size: 1.17em;
      margin: 1em 0;
    }

    .message-content p {
      margin: 1em 0;
    }

    .message-content ul, .message-content ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    .message-content li {
      margin: 0.5em 0;
    }

    .message-content code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .message-content pre {
      background: #f4f4f4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
    }

    .message-content pre code {
      background: none;
      padding: 0;
    }

    .message-content blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
    }

    .message-content strong {
      font-weight: 600;
    }

    .message-content em {
      font-style: italic;
    }

    .message-content a {
      color: #667eea;
      text-decoration: none;
    }

    .message-content a:hover {
      text-decoration: underline;
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
      border: 2px solid #667eea;
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
      color: #667eea;
      font-size: 0.9em;
    }

    .a2ui-fallback-notice {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
      border: 1px solid #ffc107;
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
      color: #856404;
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
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    .input-container {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      padding: 14px 18px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 1em;
      font-family: inherit;
      resize: none;
      min-height: 50px;
      max-height: 150px;
      transition: border-color 0.2s ease;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .send-btn {
      padding: 14px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
      color: #999;
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
      background: #667eea;
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
    this.createNewConversation();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStreaming();
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: this.currentConversationId,
          use_ui: true,
          history: this.getConversationHistory()
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      this.setTypingIndicator(assistantMessage, false);

      if (data.error) {
        console.error('Server error:', data.error);
        this.showError(assistantMessage, '服务器错误，请稍后重试');
      } else {
        if (data.text) {
          await this.typeWriterEffect(assistantMessage, data.text);
        }

        if (data.a2ui && data.a2ui.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          this.renderA2UI(assistantMessage, data.a2ui);
        }
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
    if (!message.a2uiLoading) {
      message.a2uiLoading = true;
      this.requestUpdate();
    }

    setTimeout(() => {
      message.a2uiData = a2uiData;
      message.a2uiLoading = false;
      
      const a2uiContainer = this.shadowRoot?.querySelector(`.message[data-id="${message.id}"] .a2ui-container`);
      const managerComponent = a2uiContainer?.querySelector('a2ui-manager-component') as any;
      const isFallback = managerComponent?.manager?.getDataModelValue('_fallback') === true;
      message.isFallback = isFallback;
      
      this.requestUpdate();

      setTimeout(() => {
        this.initializeA2UIComponents(message, a2uiData);
        
        if (isFallback) {
          this.showFallbackNotice(message);
        }
      }, 100);
    }, 500);
  }

  private initializeA2UIComponents(message: ChatMessage, a2uiData: any[]): void {
    const messageElement = this.shadowRoot?.querySelector(`.message[data-id="${message.id}"]`);
    if (!messageElement) return;

    const a2uiContainer = messageElement.querySelector('.a2ui-container');
    if (!a2uiContainer) return;

    const managerComponent = a2uiContainer.querySelector('a2ui-manager-component') as any;

    if (managerComponent && managerComponent.manager) {
      const manager = managerComponent.manager;

      for (const a2uiMessage of a2uiData) {
        manager.handleMessage(a2uiMessage);
      }

      setTimeout(() => {
        managerComponent.requestUpdate();
      }, 50);
    }
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
                  ${msg.a2uiData && msg.a2uiData.length > 0 && !msg.a2uiLoading ? html`
                    <div class="a2ui-container">
                      <a2ui-manager-component></a2ui-manager-component>
                    </div>
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
