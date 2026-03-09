import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { router } from './router';
import { HomePage } from './home-page';
import { ChatModule } from './chat-module';
import { QuizModule } from './quiz-module';
import { KnowledgeGraphModule } from './knowledge-graph-module';

@customElement('genetics-app')
export class App extends LitElement {
  @state()
  currentRoute = '/';

  @state()
  currentParams: Record<string, string> = {};

  @state()
  isTransitioning = false;

  private unsubscribe: (() => void) | null = null;

  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #fafafa;
        position: relative;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .app-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      /* 顶部导航栏 - 简洁专业 */
      .top-navbar {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 0 32px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 100;
      }

      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .navbar-brand:hover {
        opacity: 0.7;
      }

      .brand-icon {
        font-size: 1.5em;
      }

      .brand-text {
        font-size: 1.1em;
        font-weight: 600;
        color: #111827;
        letter-spacing: -0.01em;
      }

      .navbar-nav {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .nav-item {
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
        font-size: 0.9em;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .nav-item:hover {
        background: #f3f4f6;
        color: #111827;
      }

      .nav-item.active {
        background: #111827;
        color: #ffffff;
      }

      .nav-icon {
        font-size: 1.1em;
      }

      .route-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        background: #fafafa;
      }

      .route-view {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transition: opacity 0.3s ease;
        opacity: 0;
        pointer-events: none;
      }

      .route-view.active {
        opacity: 1;
        pointer-events: auto;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 16px;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .loading-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #111827;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        font-size: 0.9em;
        color: #6b7280;
        font-weight: 500;
      }

      .error-boundary {
        padding: 48px;
        text-align: center;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin: 40px;
        max-width: 500px;
        margin: 40px auto;
      }

      .error-boundary h1 {
        color: #dc2626;
        margin-bottom: 12px;
        font-size: 1.5em;
        font-weight: 600;
      }

      .error-boundary p {
        color: #6b7280;
        margin-bottom: 24px;
        line-height: 1.6;
      }

      .error-boundary button {
        padding: 10px 24px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 500;
        transition: background 0.2s;
      }

      .error-boundary button:hover {
        background: #1f2937;
      }

      @media (max-width: 768px) {
        .top-navbar {
          padding: 0 16px;
          height: 56px;
        }

        .brand-text {
          font-size: 1em;
        }

        .navbar-nav {
          gap: 2px;
        }

        .nav-item {
          padding: 6px 10px;
          font-size: 0.85em;
        }

        .nav-item span:not(.nav-icon) {
          display: none;
        }

        .nav-icon {
          font-size: 1.2em;
        }

        .error-boundary {
          padding: 32px 24px;
          margin: 20px;
        }
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this.initializeRouter();
    this.setupRouteListener();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private initializeRouter() {
    router.register('/', 'home-page', {
      callback: () => {
        this.currentRoute = '/';
        this.currentParams = {};
      }
    });

    router.register('/chat', 'chat-module', {
      callback: () => {
        this.currentRoute = '/chat';
        this.currentParams = {};
      }
    });

    router.register('/quiz', 'quiz-module', {
      callback: () => {
        this.currentRoute = '/quiz';
        this.currentParams = {};
      }
    });

    router.register('/knowledge', 'knowledge-graph-module', {
      callback: () => {
        this.currentRoute = '/knowledge';
        this.currentParams = {};
      }
    });

    const initialPath = window.location.pathname;
    if (initialPath !== '/') {
      router.navigate(initialPath);
    }
  }

  private setupRouteListener() {
    this.unsubscribe = router.onRouteChange((event) => {
      this.handleRouteTransition(event.route, event.params, event.from);
    });

    window.addEventListener('route-change', this.handleRouteChange.bind(this) as EventListener);
  }

  private handleRouteChange(event: Event) {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { route, params } = customEvent.detail;
      this.currentRoute = route;
      this.currentParams = params || {};
    }
  }

  private async handleRouteTransition(to: string, params: Record<string, string>, from: string | null) {
    this.isTransitioning = true;
    this.currentParams = params;

    await new Promise(resolve => setTimeout(resolve, 100));
    this.currentRoute = to;
    this.isTransitioning = false;
  }

  private getRouteComponent(route: string) {
    const routeMap: Record<string, string> = {
      '/': 'home-page',
      '/chat': 'chat-module',
      '/quiz': 'quiz-module',
      '/knowledge': 'knowledge-graph-module'
    };

    return routeMap[route] || 'home-page';
  }

  private handleGoHome() {
    router.navigate('/');
  }

  private navigateTo(route: string) {
    router.navigate(route);
  }

  render() {
    return html`
      <div class="app-container">
        <!-- 顶部导航栏 -->
        <nav class="top-navbar">
          <div class="navbar-brand" @click=${() => this.navigateTo('/')}>
            <span class="brand-icon">🧬</span>
            <span class="brand-text">Helix Lab</span>
          </div>

          <div class="navbar-nav">
            <div class="nav-item ${this.currentRoute === '/' ? 'active' : ''}"
                 @click=${() => this.navigateTo('/')}>
              <span class="nav-icon">🏠</span>
              <span>首页</span>
            </div>
            <div class="nav-item ${this.currentRoute === '/chat' ? 'active' : ''}"
                 @click=${() => this.navigateTo('/chat')}>
              <span class="nav-icon">💬</span>
              <span>AI 助手</span>
            </div>
            <div class="nav-item ${this.currentRoute === '/quiz' ? 'active' : ''}"
                 @click=${() => this.navigateTo('/quiz')}>
              <span class="nav-icon">📝</span>
              <span>知识测验</span>
            </div>
            <div class="nav-item ${this.currentRoute === '/knowledge' ? 'active' : ''}"
                 @click=${() => this.navigateTo('/knowledge')}>
              <span class="nav-icon">🔗</span>
              <span>知识图谱</span>
            </div>
          </div>
        </nav>

        <div class="route-container">
          <div class="route-view ${this.currentRoute === '/' ? 'active' : ''}">
            <home-page @navigate=${this.handleNavigate}></home-page>
          </div>

          <div class="route-view ${this.currentRoute === '/chat' ? 'active' : ''}">
            <chat-module @navigate=${this.handleNavigate}></chat-module>
          </div>

          <div class="route-view ${this.currentRoute === '/quiz' ? 'active' : ''}">
            <quiz-module @navigate=${this.handleNavigate}></quiz-module>
          </div>

          <div class="route-view ${this.currentRoute === '/knowledge' ? 'active' : ''}">
            <knowledge-graph-module @navigate=${this.handleNavigate}></knowledge-graph-module>
          </div>
        </div>

        <div class="loading-overlay ${this.isTransitioning ? 'visible' : ''}">
          <div class="spinner"></div>
          <div class="loading-text">Loading...</div>
        </div>
      </div>
    `;
  }

  private handleNavigate(event: CustomEvent) {
    const { route } = event.detail;
    if (route && typeof route === 'string') {
      router.navigate(route);
    }
  }
}
