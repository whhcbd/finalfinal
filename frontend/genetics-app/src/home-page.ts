import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@customElement('home-page')
export class HomePage extends LitElement {
  @state()
  userName = '学习者';

  @state()
  learningProgress = 35;

  @state()
  cards: NavigationCard[] = [
    {
      id: 'chat',
      title: 'AI 助手对话',
      description: '与 AI 交互学习遗传学知识，回答问题',
      icon: '💬',
      route: '/chat',
      color: '#4285f4'
    },
    {
      id: 'quiz',
      title: '知识测验',
      description: '测试你对遗传学概念的掌握程度',
      icon: '📝',
      route: '/quiz',
      color: '#34a853'
    },
    {
      id: 'knowledge',
      title: '知识图谱',
      description: '探索遗传学知识之间的关系网络',
      icon: '🔗',
      route: '/knowledge',
      color: '#ea4335'
    }
  ];

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #fafafa;
      overflow-y: auto;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px;
    }

    .header {
      margin-bottom: 48px;
    }

    .header h1 {
      font-size: 2.5em;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .header p {
      font-size: 1.1em;
      color: #6b7280;
      font-weight: 400;
    }

    .progress-section {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .progress-label {
      font-size: 0.9em;
      font-weight: 600;
      color: #111827;
    }

    .progress-percentage {
      font-size: 1.1em;
      font-weight: 600;
      color: #111827;
    }

    .progress-bar {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #111827;
      transition: width 0.5s ease;
      border-radius: 4px;
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .nav-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .nav-card:hover {
      border-color: #111827;
      transform: translateY(-2px);
    }

    .card-icon {
      font-size: 2em;
      margin-bottom: 12px;
      display: block;
    }

    .card-title {
      font-size: 1.2em;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .card-description {
      font-size: 0.9em;
      color: #6b7280;
      line-height: 1.5;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 0.85em;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media (max-width: 768px) {
      .container {
        padding: 32px 16px;
      }

      .header h1 {
        font-size: 2em;
      }

      .cards-container {
        grid-template-columns: 1fr;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }
    }
  `;

  private handleCardClick(route: string) {
    const event = new CustomEvent('navigate', {
      detail: { route },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);

    window.history.pushState({}, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>🧬 欢迎来到遗传学学习平台</h1>
          <p>你好，${this.userName}！开始你的遗传学探索之旅</p>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">学习进度</span>
            <span class="progress-percentage">${this.learningProgress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.learningProgress}%"></div>
          </div>
        </div>

        <div class="cards-container">
          ${repeat(
            this.cards,
            (card) => card.id,
            (card) => html`
              <div class="nav-card" @click=${() => this.handleCardClick(card.route)}>
                <div class="card-decoration" style="background-color: ${card.color}"></div>
                <div class="card-content">
                  <span class="card-icon">${card.icon}</span>
                  <h2 class="card-title">${card.title}</h2>
                  <p class="card-description">${card.description}</p>
                </div>
              </div>
            `
          )}
        </div>

        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">12</div>
            <div class="stat-label">完成课程</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">8</div>
            <div class="stat-label">通过测验</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">156</div>
            <div class="stat-label">学习分钟</div>
          </div>
        </div>
      </div>
    `;
  }
}
