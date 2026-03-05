import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
}

interface KnowledgePoint {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  categoryResults: Record<string, { total: number; correct: number }>;
}

interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
}

@customElement('quiz-module')
export class QuizModule extends LitElement {
  @state()
  currentView: 'selection' | 'quiz' | 'result' = 'selection';

  @state()
  selectedKnowledgePoint: string | null = null;

  @state()
  questions: QuizQuestion[] = [];

  @state()
  currentQuestionIndex = 0;

  @state()
  userAnswers: UserAnswer[] = [];

  @state()
  selectedOptionId: string | null = null;

  @state()
  showFeedback = false;

  @state()
  quizStartTime: number | null = null;

  @state()
  questionStartTime: number | null = null;

  @state()
  quizResult: QuizResult | null = null;

  @state()
  isLoading = false;

  @state()
  showExplanation = false;

  @state()
  correctCount = 0;

  @state()
  streakCount = 0;

  @state()
  maxStreak = 0;

  knowledgePoints: KnowledgePoint[] = [
    {
      id: 'mendelian',
      name: '孟德尔遗传',
      description: '分离定律、自由组合定律、显隐性等',
      icon: '🧬',
      questionCount: 15
    },
    {
      id: 'dna',
      name: 'DNA 结构与复制',
      description: '双螺旋结构、碱基配对、复制过程',
      icon: '🔬',
      questionCount: 12
    },
    {
      id: 'gene-expression',
      name: '基因表达',
      description: '转录、翻译、蛋白质合成',
      icon: '🧪',
      questionCount: 18
    },
    {
      id: 'pedigree',
      name: '系谱分析',
      description: '遗传图谱解读、遗传方式判断',
      icon: '📊',
      questionCount: 10
    },
    {
      id: 'mutations',
      name: '基因突变',
      description: '点突变、移码突变、染色体变异',
      icon: '⚡',
      questionCount: 14
    },
    {
      id: 'population',
      name: '群体遗传',
      description: '哈迪-温伯格定律、基因频率',
      icon: '👥',
      questionCount: 8
    }
  ];

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 2.5em;
      margin: 0 0 12px 0;
      color: #1a1a1a;
    }

    .header p {
      color: #666;
      font-size: 1.1em;
      margin: 0;
    }

    .back-btn {
      background: none;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
      padding: 8px;
      margin-bottom: 16px;
      transition: transform 0.2s ease;
    }

    .back-btn:hover {
      transform: translateX(-4px);
    }

    .knowledge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .knowledge-card {
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .knowledge-card:hover {
      border-color: #667eea;
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
    }

    .knowledge-icon {
      font-size: 3em;
      margin-bottom: 12px;
    }

    .knowledge-name {
      font-size: 1.3em;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }

    .knowledge-description {
      color: #666;
      font-size: 0.95em;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .question-count {
      color: #667eea;
      font-weight: 600;
      font-size: 0.9em;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.5s ease;
      border-radius: 4px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .question-number {
      font-size: 1.2em;
      font-weight: 600;
      color: #333;
    }

    .streak-badge {
      background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .question-text {
      font-size: 1.4em;
      color: #333;
      line-height: 1.6;
      margin-bottom: 32px;
      font-weight: 500;
    }

    .question-difficulty {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .difficulty-easy {
      background: #d4edda;
      color: #155724;
    }

    .difficulty-medium {
      background: #fff3cd;
      color: #856404;
    }

    .difficulty-hard {
      background: #f8d7da;
      color: #721c24;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option-item {
      padding: 16px 20px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.05em;
    }

    .option-item:hover:not(.disabled) {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .option-item.selected {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .option-item.correct {
      border-color: #28a745;
      background: #d4edda;
      color: #155724;
    }

    .option-item.incorrect {
      border-color: #dc3545;
      background: #f8d7da;
      color: #721c24;
    }

    .option-item.disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .option-letter {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .option-item.correct .option-letter {
      background: #28a745;
    }

    .option-item.incorrect .option-letter {
      background: #dc3545;
    }

    .feedback-section {
      margin-top: 24px;
      padding: 20px;
      border-radius: 12px;
      animation: fadeIn 0.3s ease;
    }

    .feedback-section.correct {
      background: #d4edda;
      border: 2px solid #28a745;
    }

    .feedback-section.incorrect {
      background: #f8d7da;
      border: 2px solid #dc3545;
    }

    .feedback-title {
      font-size: 1.2em;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feedback-section.correct .feedback-title {
      color: #155724;
    }

    .feedback-section.incorrect .feedback-title {
      color: #721c24;
    }

    .explanation {
      color: #333;
      line-height: 1.6;
      margin-top: 12px;
    }

    .explanation-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      justify-content: center;
    }

    .btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .result-card {
      text-align: center;
    }

    .score-display {
      margin: 32px 0;
    }

    .score-circle {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #667eea 0%, #764ba2 100%);
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .score-circle::before {
      content: '';
      position: absolute;
      width: 180px;
      height: 180px;
      background: white;
      border-radius: 50%;
    }

    .score-value {
      font-size: 3em;
      font-weight: 700;
      color: #667eea;
      position: relative;
      z-index: 1;
    }

    .score-label {
      font-size: 1.2em;
      color: #666;
      margin-bottom: 8px;
    }

    .score-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }

    .detail-item {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
    }

    .detail-value {
      font-size: 2em;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 4px;
    }

    .detail-label {
      color: #666;
      font-size: 0.9em;
    }

    .category-results {
      margin-top: 32px;
      text-align: left;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .category-name {
      font-weight: 600;
      color: #333;
    }

    .category-score {
      color: #667eea;
      font-weight: 700;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .empty-state-icon {
      font-size: 4em;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 20px 12px;
      }

      .card {
        padding: 20px;
      }

      .header h1 {
        font-size: 2em;
      }

      .knowledge-grid {
        grid-template-columns: 1fr;
      }

      .question-text {
        font-size: 1.2em;
      }
    }
  `;

  private async loadQuestions(knowledgePointId: string) {
    this.isLoading = true;
    this.currentView = 'quiz';
    this.selectedKnowledgePoint = knowledgePointId;

    try {
      const response = await fetch(`/api/quiz/questions?category=${knowledgePointId}`);
      if (!response.ok) throw new Error('Failed to load questions');
      
      this.questions = await response.json();
      this.currentQuestionIndex = 0;
      this.userAnswers = [];
      this.selectedOptionId = null;
      this.showFeedback = false;
      this.quizStartTime = Date.now();
      this.questionStartTime = Date.now();
      this.correctCount = 0;
      this.streakCount = 0;
      this.maxStreak = 0;
    } catch (error) {
      console.error('Error loading questions:', error);
      this.questions = this.getSampleQuestions();
      this.quizStartTime = Date.now();
      this.questionStartTime = Date.now();
    } finally {
      this.isLoading = false;
    }
  }

  private getSampleQuestions(): QuizQuestion[] {
    return [
      {
        id: '1',
        question: '孟德尔第一定律（分离定律）的核心内容是什么？',
        options: [
          { id: 'a', text: '等位基因在形成配子时会分离', isCorrect: true, explanation: '孟德尔分离定律指出，在生物体形成配子时，成对的等位基因彼此分离，分别进入不同的配子中。' },
          { id: 'b', text: '不同性状的基因自由组合', isCorrect: false, explanation: '这是孟德尔第二定律（自由组合定律）的内容。' },
          { id: 'c', text: '显性基因总是掩盖隐性基因', isCorrect: false, explanation: '虽然显性基因通常掩盖隐性基因的表达，但这不是分离定律的核心内容。' },
          { id: 'd', text: '基因位于染色体上', isCorrect: false, explanation: '这是萨顿-博韦里理论的内容，不属于孟德尔定律。' }
        ],
        difficulty: 'easy',
        category: 'mendelian'
      },
      {
        id: '2',
        question: 'DNA双螺旋结构中，碱基配对的规律是什么？',
        options: [
          { id: 'a', text: 'A-T, G-C', isCorrect: true, explanation: 'DNA中腺嘌呤(A)与胸腺嘧啶(T)配对，鸟嘌呤(G)与胞嘧啶(C)配对，这是碱基互补配对原则。' },
          { id: 'b', text: 'A-G, T-C', isCorrect: false, explanation: 'A与G不配对，T与C不配对。' },
          { id: 'c', text: 'A-C, G-T', isCorrect: false, explanation: 'A与C不配对，G与T不配对。' },
          { id: 'd', text: 'A-A, T-T, G-G, C-C', isCorrect: false, explanation: '同种碱基不能配对。' }
        ],
        difficulty: 'easy',
        category: 'dna'
      },
      {
        id: '3',
        question: '一个杂合子（Aa）自交，后代中纯合子的比例是多少？',
        options: [
          { id: 'a', text: '25%', isCorrect: false, explanation: '这是显性纯合子（AA）的比例。' },
          { id: 'b', text: '50%', isCorrect: true, explanation: '杂合子Aa自交，后代基因型比例为1:2:1（AA:Aa:aa），其中纯合子（AA和aa）占50%。' },
          { id: 'c', text: '75%', isCorrect: false, explanation: '这是显性个体（AA和Aa）的比例。' },
          { id: 'd', text: '100%', isCorrect: false, explanation: '杂合子自交不会全部产生纯合子。' }
        ],
        difficulty: 'medium',
        category: 'mendelian'
      }
    ];
  }

  private handleOptionClick(optionId: string) {
    if (this.showFeedback || this.selectedOptionId) return;

    this.selectedOptionId = optionId;
    const question = this.questions[this.currentQuestionIndex];
    const option = question.options.find(o => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;

    const timeSpent = this.questionStartTime ? Date.now() - this.questionStartTime : 0;

    if (isCorrect) {
      this.correctCount++;
      this.streakCount++;
      this.maxStreak = Math.max(this.maxStreak, this.streakCount);
    } else {
      this.streakCount = 0;
    }

    this.userAnswers.push({
      questionId: question.id,
      selectedOptionId: optionId,
      isCorrect,
      timeSpent
    });

    this.showFeedback = true;
  }

  private handleNextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedOptionId = null;
      this.showFeedback = false;
      this.questionStartTime = Date.now();
    } else {
      this.finishQuiz();
    }
  }

  private finishQuiz() {
    const totalTime = this.quizStartTime ? Date.now() - this.quizStartTime : 0;
    const categoryResults: Record<string, { total: number; correct: number }> = {};

    this.userAnswers.forEach(answer => {
      const question = this.questions.find(q => q.id === answer.questionId);
      if (question) {
        if (!categoryResults[question.category]) {
          categoryResults[question.category] = { total: 0, correct: 0 };
        }
        categoryResults[question.category].total++;
        if (answer.isCorrect) {
          categoryResults[question.category].correct++;
        }
      }
    });

    this.quizResult = {
      totalQuestions: this.questions.length,
      correctAnswers: this.correctCount,
      score: Math.round((this.correctCount / this.questions.length) * 100),
      timeSpent: totalTime,
      categoryResults
    };

    this.currentView = 'result';
  }

  private restartQuiz() {
    if (this.selectedKnowledgePoint) {
      this.loadQuestions(this.selectedKnowledgePoint);
    }
  }

  private goToSelection() {
    this.currentView = 'selection';
    this.selectedKnowledgePoint = null;
    this.questions = [];
    this.userAnswers = [];
    this.quizResult = null;
  }

  private getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty}`;
  }

  private getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };
    return labels[difficulty] || difficulty;
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }

  render() {
    return html`
      <div class="container">
        ${this.renderContent()}
      </div>
    `;
  }

  private renderContent() {
    switch (this.currentView) {
      case 'selection':
        return this.renderSelection();
      case 'quiz':
        return this.renderQuiz();
      case 'result':
        return this.renderResult();
      default:
        return nothing;
    }
  }

  private renderSelection() {
    return html`
      <div class="card">
        <div class="header">
          <h1>🧬 遗传学知识测验</h1>
          <p>选择一个知识点开始测试你的学习成果</p>
        </div>

        <div class="knowledge-grid">
          ${repeat(
            this.knowledgePoints,
            (kp) => kp.id,
            (kp) => html`
              <div class="knowledge-card" @click=${() => this.loadQuestions(kp.id)}>
                <div class="knowledge-icon">${kp.icon}</div>
                <div class="knowledge-name">${kp.name}</div>
                <div class="knowledge-description">${kp.description}</div>
                <div class="question-count">${kp.questionCount} 道题目</div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private renderQuiz() {
    const question = this.questions[this.currentQuestionIndex];
    const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;

    return html`
      <div class="card">
        <button class="back-btn" @click=${() => this.goToSelection()}>◀</button>

        <div class="progress-info">
          <span class="question-number">
            第 ${this.currentQuestionIndex + 1} / ${this.questions.length} 题
          </span>
          ${this.streakCount > 0 ? html`
            <div class="streak-badge">
              🔥 ${this.streakCount} 连续正确
            </div>
          ` : nothing}
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>

        ${question ? html`
          <span class="question-difficulty ${this.getDifficultyClass(question.difficulty)}">
            ${this.getDifficultyLabel(question.difficulty)}
          </span>

          <div class="question-text">${question.question}</div>

          <div class="options-list">
            ${repeat(
              question.options,
              (opt) => opt.id,
              (opt) => {
                let className = 'option-item';
                if (this.selectedOptionId === opt.id) {
                  className += opt.isCorrect ? ' correct' : ' incorrect';
                } else if (this.showFeedback && opt.isCorrect) {
                  className += ' correct';
                }
                if (this.showFeedback) className += ' disabled';

                return html`
                  <div
                    class="${className}"
                    @click=${() => this.handleOptionClick(opt.id)}
                  >
                    <div class="option-letter">${opt.id.toUpperCase()}</div>
                    <span>${opt.text}</span>
                  </div>
                `;
              }
            )}
          </div>

          ${this.showFeedback ? html`
            <div class="feedback-section ${this.selectedOptionId && question.options.find(o => o.id === this.selectedOptionId)?.isCorrect ? 'correct' : 'incorrect'}">
              <div class="feedback-title">
                ${this.selectedOptionId && question.options.find(o => o.id === this.selectedOptionId)?.isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
              </div>
              <div class="explanation">
                <div class="explanation-title">答案解析：</div>
                ${question.explanation || question.options.find(o => o.id === this.selectedOptionId)?.explanation || ''}
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn btn-primary" @click=${() => this.handleNextQuestion()}>
                ${this.currentQuestionIndex < this.questions.length - 1 ? '下一题' : '查看结果'}
              </button>
            </div>
          ` : nothing}
        ` : html`
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <p>加载中...</p>
          </div>
        `}
      </div>
    `;
  }

  private renderResult() {
    if (!this.quizResult) return nothing;

    const { score, correctAnswers, totalQuestions, timeSpent, categoryResults } = this.quizResult;

    return html`
      <div class="card result-card">
        <button class="back-btn" @click=${() => this.goToSelection()}>◀</button>

        <div class="header">
          <h1>🎉 测验完成！</h1>
          <p>查看你的学习成果</p>
        </div>

        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">${score}%</span>
          </div>
          <div class="score-label">最终得分</div>
        </div>

        <div class="score-details">
          <div class="detail-item">
            <div class="detail-value">${correctAnswers}/${totalQuestions}</div>
            <div class="detail-label">正确题数</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${this.formatTime(timeSpent)}</div>
            <div class="detail-label">用时</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${this.maxStreak}</div>
            <div class="detail-label">最高连对</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${correctAnswers / totalQuestions > 0.8 ? '🌟' : correctAnswers / totalQuestions > 0.6 ? '👍' : '💪'}</div>
            <div class="detail-label">评价</div>
          </div>
        </div>

        ${Object.keys(categoryResults).length > 0 ? html`
          <div class="category-results">
            <h3>各知识点表现</h3>
            ${repeat(
              Object.entries(categoryResults),
              ([category]) => category,
              ([category, result]) => {
                const kp = this.knowledgePoints.find(k => k.id === category);
                const categoryScore = Math.round((result.correct / result.total) * 100);
                return html`
                  <div class="category-item">
                    <div class="category-name">${kp?.icon || ''} ${kp?.name || category}</div>
                    <div class="category-score">${result.correct}/${result.total} (${categoryScore}%)</div>
                  </div>
                `;
              }
            )}
          </div>
        ` : nothing}

        <div class="action-buttons">
          <button class="btn btn-secondary" @click=${() => this.goToSelection()}>
            返回选择
          </button>
          <button class="btn btn-primary" @click=${() => this.restartQuiz()}>
            重新测验
          </button>
        </div>
      </div>
    `;
  }
}
