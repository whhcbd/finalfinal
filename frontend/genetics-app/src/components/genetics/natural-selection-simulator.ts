/*
 NaturalSelectionSimulator Component for Genetics Visualization
 自然选择模拟器 - 用于模拟种群演化和基因频率变化
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Chart, registerables } from 'chart.js';
import animationStyles from '../../styles/animations.css?inline';

Chart.register(...registerables);

export interface Individual {
  id: number;
  genotype: 'AA' | 'Aa' | 'aa';
  phenotype: 'dark' | 'medium' | 'light';
  x: number;
  y: number;
  alive: boolean;
}

export interface GenerationData {
  generation: number;
  freqA: number;
  freqA_allele: number;
  population: number;
  survived: number;
}

@customElement('natural-selection-simulator')
export class NaturalSelectionSimulator extends Root {
  private _populationSize: number = 100;
  private _initialFreqA: number = 0.5;
  private _environmentType: string = 'dark'; // 'dark' or 'light'
  private _selectionStrength: number = 0.5;
  private _interactive: boolean = true;

  @state()
  private population: Individual[] = [];

  @state()
  private currentGeneration: number = 0;

  @state()
  private generationHistory: GenerationData[] = [];

  @state()
  private isRunning: boolean = false;

  @state()
  private isPaused: boolean = false;

  private chart: Chart | null = null;
  private animationFrameId: number | null = null;

  @property({ type: Number })
  get populationSize(): number {
    return this._populationSize;
  }
  set populationSize(value: any) {
    const oldValue = this._populationSize;
    this._populationSize = this.unwrapValue(value, 'number');
    this.requestUpdate('populationSize', oldValue);
  }

  @property({ type: Number })
  get initialFreqA(): number {
    return this._initialFreqA;
  }
  set initialFreqA(value: any) {
    const oldValue = this._initialFreqA;
    this._initialFreqA = this.unwrapValue(value, 'number');
    this.requestUpdate('initialFreqA', oldValue);
  }

  @property({ type: String })
  get environmentType(): string {
    return this._environmentType;
  }
  set environmentType(value: any) {
    const oldValue = this._environmentType;
    this._environmentType = this.unwrapValue(value, 'string');
    this.requestUpdate('environmentType', oldValue);
  }

  @property({ type: Number })
  get selectionStrength(): number {
    return this._selectionStrength;
  }
  set selectionStrength(value: any) {
    const oldValue = this._selectionStrength;
    this._selectionStrength = this.unwrapValue(value, 'number');
    this.requestUpdate('selectionStrength', oldValue);
  }

  @property({ type: Boolean })
  get interactive(): boolean {
    return this._interactive;
  }
  set interactive(value: any) {
    const oldValue = this._interactive;
    this._interactive = this.unwrapValue(value, 'boolean');
    this.requestUpdate('interactive', oldValue);
  }

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'number'): any {
    if (value === undefined || value === null) {
      return type === 'string' ? '' : type === 'boolean' ? false : 0;
    }

    if (value && typeof value === 'object' && 'path' in value && value.path) {
      if (!this.processor || !this.component) {
        return type === 'string' ? '' : type === 'boolean' ? false : 0;
      }
      const resolvedValue = this.processor.getData(this.component, value.path);
      if (resolvedValue === undefined) {
        const surface = (this.processor as any).surfaces?.get('genetics_ui');
        if (surface && surface.dataModel) {
          const key = value.path.startsWith('/') ? value.path.substring(1) : value.path;
          return surface.dataModel.get(key);
        }
      }
      return resolvedValue;
    }

    if (value && typeof value === 'object') {
      if (type === 'string' && 'literalString' in value) {
        return value.literalString;
      }
      if (type === 'boolean' && 'literalBoolean' in value) {
        return value.literalBoolean;
      }
      if (type === 'number' && 'literalNumber' in value) {
        return value.literalNumber;
      }
    }

    return value;
  }

  private initializePopulation() {
    this.population = [];
    const freqA = this._initialFreqA;
    const freqAA = freqA * freqA;
    const freqAa = 2 * freqA * (1 - freqA);
    const freqaa = (1 - freqA) * (1 - freqA);

    for (let i = 0; i < this._populationSize; i++) {
      const rand = Math.random();
      let genotype: 'AA' | 'Aa' | 'aa';

      if (rand < freqAA) {
        genotype = 'AA';
      } else if (rand < freqAA + freqAa) {
        genotype = 'Aa';
      } else {
        genotype = 'aa';
      }

      const phenotype = this.getPhenotype(genotype);

      this.population.push({
        id: i,
        genotype,
        phenotype,
        x: Math.random() * 100,
        y: Math.random() * 100,
        alive: true
      });
    }

    this.currentGeneration = 0;
    this.generationHistory = [this.calculateGenerationData()];
    this.renderCanvas();
  }

  private getPhenotype(genotype: 'AA' | 'Aa' | 'aa'): 'dark' | 'medium' | 'light' {
    if (genotype === 'AA') return 'dark';
    if (genotype === 'Aa') return 'medium';
    return 'light';
  }

  private getFitness(phenotype: 'dark' | 'medium' | 'light'): number {
    const env = this._environmentType;
    const strength = this._selectionStrength;

    if (env === 'dark') {
      if (phenotype === 'dark') return 1.0;
      if (phenotype === 'medium') return 1.0 - (strength * 0.3);
      return 1.0 - strength;
    } else {
      if (phenotype === 'light') return 1.0;
      if (phenotype === 'medium') return 1.0 - (strength * 0.3);
      return 1.0 - strength;
    }
  }

  private applySelection() {
    this.population.forEach(individual => {
      if (!individual.alive) return;

      const fitness = this.getFitness(individual.phenotype);
      const survivalChance = Math.random();

      if (survivalChance > fitness) {
        individual.alive = false;
      }
    });
  }

  private reproduce() {
    const survivors = this.population.filter(ind => ind.alive);
    if (survivors.length < 2) {
      this.stopSimulation();
      return;
    }

    const newPopulation: Individual[] = [];
    let nextId = this.population.length;

    while (newPopulation.length < this._populationSize) {
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

      const allele1 = this.getRandomAllele(parent1.genotype);
      const allele2 = this.getRandomAllele(parent2.genotype);

      const offspringGenotype = this.combineAlleles(allele1, allele2);
      const offspringPhenotype = this.getPhenotype(offspringGenotype);

      newPopulation.push({
        id: nextId++,
        genotype: offspringGenotype,
        phenotype: offspringPhenotype,
        x: Math.random() * 100,
        y: Math.random() * 100,
        alive: true
      });
    }

    this.population = newPopulation;
    this.currentGeneration++;
    this.generationHistory.push(this.calculateGenerationData());
  }

  private getRandomAllele(genotype: 'AA' | 'Aa' | 'aa'): 'A' | 'a' {
    if (genotype === 'AA') return 'A';
    if (genotype === 'aa') return 'a';
    return Math.random() < 0.5 ? 'A' : 'a';
  }

  private combineAlleles(allele1: 'A' | 'a', allele2: 'A' | 'a'): 'AA' | 'Aa' | 'aa' {
    if (allele1 === 'A' && allele2 === 'A') return 'AA';
    if (allele1 === 'a' && allele2 === 'a') return 'aa';
    return 'Aa';
  }

  private calculateGenerationData(): GenerationData {
    const alive = this.population.filter(ind => ind.alive);
    const total = alive.length;

    let countA = 0;
    alive.forEach(ind => {
      if (ind.genotype === 'AA') countA += 2;
      else if (ind.genotype === 'Aa') countA += 1;
    });

    const freqA_allele = total > 0 ? countA / (total * 2) : 0;
    const freqA = alive.filter(ind => ind.genotype === 'AA').length / total;

    return {
      generation: this.currentGeneration,
      freqA,
      freqA_allele,
      population: this.population.length,
      survived: total
    };
  }

  private renderCanvas() {
    const canvas = this.shadowRoot?.getElementById('population-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = this._environmentType === 'dark' ? '#1f2937' : '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw individuals
    this.population.forEach(individual => {
      const x = (individual.x / 100) * canvas.width;
      const y = (individual.y / 100) * canvas.height;
      const radius = individual.alive ? 4 : 3;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);

      if (!individual.alive) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      if (individual.phenotype === 'dark') {
        ctx.fillStyle = '#111827';
      } else if (individual.phenotype === 'medium') {
        ctx.fillStyle = '#6b7280';
      } else {
        ctx.fillStyle = '#e5e7eb';
      }

      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  private updateChart() {
    const chartCanvas = this.shadowRoot?.getElementById('frequency-chart') as HTMLCanvasElement;
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;

    const generations = this.generationHistory.map(d => d.generation);
    const frequencies = this.generationHistory.map(d => d.freqA_allele);

    if (this.chart) {
      // Reuse existing chart instance to avoid height growth
      this.chart.data.labels = generations;
      this.chart.data.datasets[0].data = frequencies;
      this.chart.update('none');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: generations,
        datasets: [{
          label: 'A 等位基因频率',
          data: frequencies,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: '等位基因频率'
            }
          },
          x: {
            title: {
              display: true,
              text: '世代'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  private async runGeneration() {
    if (!this.isRunning || this.isPaused) return;

    this.applySelection();
    this.renderCanvas(); // Show dead individuals in red

    await new Promise(resolve => setTimeout(resolve, 800));

    this.reproduce();
    this.renderCanvas(); // Show new generation
    this.updateChart();

    await new Promise(resolve => setTimeout(resolve, 400));

    if (this.currentGeneration < 50 && this.isRunning) {
      this.animationFrameId = requestAnimationFrame(() => this.runGeneration());
    } else {
      this.stopSimulation();
    }
  }

  private handleStart() {
    if (!this._interactive) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.initializePopulation();
    this.updateChart();
    this.isRunning = true;
    this.isPaused = false;
    this.runGeneration();

    this.dispatchAction('start_simulation', {
      populationSize: this._populationSize,
      initialFreqA: this._initialFreqA,
      environment: this._environmentType,
      selectionStrength: this._selectionStrength
    });
  }

  private handlePause() {
    if (!this._interactive) return;
    this.isPaused = !this.isPaused;

    if (!this.isPaused && this.isRunning) {
      this.runGeneration();
    }

    this.dispatchAction('pause_simulation', { paused: this.isPaused });
  }

  private handleStop() {
    if (!this._interactive) return;
    this.stopSimulation();
    this.dispatchAction('stop_simulation', {});
  }

  private stopSimulation() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private handleReset() {
    if (!this._interactive) return;
    this.stopSimulation();
    this.population = [];
    this.currentGeneration = 0;
    this.generationHistory = [];

    const canvas = this.shadowRoot?.getElementById('population-canvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.dispatchAction('reset_simulation', {});
  }

  private handlePopulationChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._populationSize = parseInt(input.value, 10);
    this.dispatchAction('population_change', { size: this._populationSize });
  }

  private handleFrequencyChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._initialFreqA = parseFloat(input.value);
    this.dispatchAction('frequency_change', { freqA: this._initialFreqA });
  }

  private handleEnvironmentChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._environmentType = select.value;
    this.dispatchAction('environment_change', { type: this._environmentType });
  }

  private handleSelectionChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._selectionStrength = parseFloat(input.value);
    this.dispatchAction('selection_change', { strength: this._selectionStrength });
  }

  private dispatchAction(action: string, data: any) {
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'natural_selection_simulator',
        action,
        data
      },
      bubbles: true,
      composed: true
    }));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopSimulation();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  static styles = [
    ...Root.styles,
    css`${unsafeCSS(animationStyles)}`,
    css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      padding: 24px;
      background: #fafafa;
      border-radius: 12px;
    }

    .simulator-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 24px;
      text-align: center;
    }

    .controls-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .control-group {
      margin-bottom: 16px;
    }

    .control-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .control-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
    }

    .control-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .control-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .range-value {
      display: inline-block;
      margin-left: 12px;
      font-weight: 600;
      color: #3b82f6;
    }

    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #d97706;
    }

    .visualization-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .canvas-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }

    #population-canvas {
      width: 100%;
      height: 400px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
    }

    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    #frequency-chart {
      width: 100%;
      height: 400px;
    }

    .stats-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .stat-card {
      padding: 16px;
      background: #f9fafb;
      border-radius: 6px;
      text-align: center;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 1rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .control-row {
        grid-template-columns: 1fr;
      }

      .visualization-section {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .button-group {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `];

  render() {
    const interactive = this.unwrapValue(this._interactive, 'boolean');
    const currentData = this.generationHistory[this.generationHistory.length - 1];

    return html`
      <div class="simulator-container">
        <h2 class="title">🦋 自然选择模拟器</h2>

        ${interactive ? html`
          <div class="controls-section">
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">
                  种群大小
                  <span class="range-value">${this._populationSize}</span>
                </label>
                <input
                  type="range"
                  class="control-input"
                  min="50"
                  max="200"
                  step="10"
                  .value=${this._populationSize.toString()}
                  @input=${this.handlePopulationChange}
                  ?disabled=${this.isRunning}
                />
              </div>
              <div class="control-group">
                <label class="control-label">
                  初始 A 等位基因频率
                  <span class="range-value">${this._initialFreqA.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  class="control-input"
                  min="0"
                  max="1"
                  step="0.05"
                  .value=${this._initialFreqA.toString()}
                  @input=${this.handleFrequencyChange}
                  ?disabled=${this.isRunning}
                />
              </div>
            </div>

            <div class="control-row">
              <div class="control-group">
                <label class="control-label">环境类型</label>
                <select
                  class="control-input"
                  @change=${this.handleEnvironmentChange}
                  ?disabled=${this.isRunning}
                >
                  <option value="dark" ?selected=${this._environmentType === 'dark'}>
                    深色环境（有利于深色个体）
                  </option>
                  <option value="light" ?selected=${this._environmentType === 'light'}>
                    浅色环境（有利于浅色个体）
                  </option>
                </select>
              </div>
              <div class="control-group">
                <label class="control-label">
                  选择压力强度
                  <span class="range-value">${this._selectionStrength.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  class="control-input"
                  min="0"
                  max="1"
                  step="0.1"
                  .value=${this._selectionStrength.toString()}
                  @input=${this.handleSelectionChange}
                  ?disabled=${this.isRunning}
                />
              </div>
            </div>

            <div class="button-group">
              <button
                class="btn btn-primary"
                @click=${this.handleStart}
                ?disabled=${this.isRunning}
              >
                开始模拟
              </button>
              <button
                class="btn btn-warning"
                @click=${this.handlePause}
                ?disabled=${!this.isRunning}
              >
                ${this.isPaused ? '继续' : '暂停'}
              </button>
              <button
                class="btn btn-secondary"
                @click=${this.handleStop}
                ?disabled=${!this.isRunning}
              >
                停止
              </button>
              <button
                class="btn btn-secondary"
                @click=${this.handleReset}
                ?disabled=${this.isRunning}
              >
                重置
              </button>
            </div>
          </div>

          ${this.population.length > 0 ? html`
            <div class="visualization-section">
              <div class="canvas-container">
                <h3 class="section-title">种群分布</h3>
                <canvas id="population-canvas" width="500" height="400"></canvas>
              </div>

              <div class="chart-container">
                <h3 class="section-title">等位基因频率变化</h3>
                <canvas id="frequency-chart" width="500" height="400"></canvas>
              </div>
            </div>

            ${currentData ? html`
              <div class="stats-section">
                <h3 class="section-title">当前统计数据</h3>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">当前世代</div>
                    <div class="stat-value">${currentData.generation}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">种群数量</div>
                    <div class="stat-value">${currentData.population}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">存活数量</div>
                    <div class="stat-value">${currentData.survived}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">A 频率</div>
                    <div class="stat-value">${currentData.freqA_allele.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            ` : ''}
          ` : html`
            <div class="stats-section">
              <div class="empty-state">
                <div class="empty-icon">🧬</div>
                <div class="empty-text">点击"开始模拟"按钮运行自然选择模拟</div>
              </div>
            </div>
          `}
        ` : html`
          <div class="stats-section">
            <div class="empty-state">
              <div class="empty-icon">🔒</div>
              <div class="empty-text">交互模式未启用</div>
            </div>
          </div>
        `}
      </div>
    `;
  }
}
