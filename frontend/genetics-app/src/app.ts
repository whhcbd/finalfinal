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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: inherit;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
      }

      .app-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .route-container {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      .route-view {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
      }

      .route-view.active {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .route-view.exiting {
        opacity: 0;
        transform: translateY(-20px);
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
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .loading-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3f;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-boundary {
        padding: 40px;
        text-align: center;
        background: #fff3f3;
        border: 2px solid #ff0000;
        border-radius: 8px;
        margin: 20px;
      }

      .error-boundary h1 {
        color: #ff0000;
        margin-bottom: 16px;
      }

      .error-boundary p {
        color: #666;
        margin-bottom: 20px;
      }

      .error-boundary button {
        padding: 12px 24px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: background 0.2s ease;
      }

      .error-boundary button:hover {
        background: #5568d3;
      }

      @media (max-width: 768px) {
        :host {
          font-size: 14px;
        }

        .route-view {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
      }

      @media (prefers-color-scheme: dark) {
        :host {
          color: #e0e0e0;
        }

        body {
          color: #e0e0e0;
          background: #1a1a1a;
        }

        .loading-overlay {
          background: rgba(0, 0, 0, 0.9);
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

  render() {
    return html`
      <div class="app-container">
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
