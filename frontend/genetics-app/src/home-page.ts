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
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .header h1 {
      margin: 0 0 10px 0;
      font-size: 2.5em;
      color: #1a1a1a;
      font-weight: 700;
    }

    .header p {
      margin: 0;
      font-size: 1.2em;
      color: #666;
    }

    .progress-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 30px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .progress-label {
      font-size: 1.1em;
      font-weight: 600;
      color: #333;
    }

    .progress-percentage {
      font-size: 1.2em;
      font-weight: 700;
      color: #667eea;
    }

    .progress-bar {
      height: 12px;
      background: #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.5s ease-in-out;
      border-radius: 6px;
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 20px;
    }

    .nav-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .nav-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }

    .nav-card:hover .card-icon {
      transform: scale(1.2) rotate(5deg);
    }

    .card-icon {
      font-size: 3em;
      margin-bottom: 16px;
      transition: transform 0.3s ease;
      display: block;
    }

    .card-title {
      font-size: 1.5em;
      font-weight: 700;
      color: #333;
      margin: 0 0 12px 0;
    }

    .card-description {
      font-size: 1em;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    .card-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      transition: width 0.3s ease;
    }

    .nav-card:hover .card-decoration {
      width: 100%;
      opacity: 0.05;
    }

    .card-content {
      position: relative;
      z-index: 1;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 0.9em;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 2em;
      }

      .cards-container {
        grid-template-columns: 1fr;
      }

      .nav-card {
        padding: 24px;
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
