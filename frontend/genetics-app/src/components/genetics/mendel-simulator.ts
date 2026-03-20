/*
 MendelSimulator Component for Genetics Visualization
 孟德尔实验模拟器 - 用于模拟随机受精验证孟德尔定律
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Plotly from 'plotly.js-dist-min';
import animationStyles from '../../styles/animations.css?inline';

export interface SimulationResult {
  genotype: string;
  count: number;
  percentage: number;
  expectedPercentage: number;
}

export interface ChiSquareResult {
  value: number;
  degreesOfFreedom: number;
  pValue: number;
  significant: boolean;
}

@customElement('mendel-simulator')
export class MendelSimulator extends Root {
  private _parent1Genotype: string = 'Aa';
  private _parent2Genotype: string = 'Aa';
  private _traitType: string = 'single'; // 'single' or 'double'
  private _simulationCount: number = 1000;
  private _interactive: boolean = true;

  @state()
  private results: SimulationResult[] = [];

  @state()
  private isSimulating: boolean = false;

  @state()
  private chiSquare: ChiSquareResult | null = null;

  @state()
  private simulationSpeed: 'slow' | 'fast' | 'instant' = 'fast';

  @property({ type: String })
  get parent1Genotype(): string {
    return this._parent1Genotype;
  }
  set parent1Genotype(value: any) {
    const oldValue = this._parent1Genotype;
    this._parent1Genotype = this.unwrapValue(value, 'string');
    this.requestUpdate('parent1Genotype', oldValue);
  }

  @property({ type: String })
  get parent2Genotype(): string {
    return this._parent2Genotype;
  }
  set parent2Genotype(value: any) {
    const oldValue = this._parent2Genotype;
    this._parent2Genotype = this.unwrapValue(value, 'string');
    this.requestUpdate('parent2Genotype', oldValue);
  }

  @property({ type: String })
  get traitType(): string {
    return this._traitType;
  }
  set traitType(value: any) {
    const oldValue = this._traitType;
    this._traitType = this.unwrapValue(value, 'string');
    this.requestUpdate('traitType', oldValue);
  }

  @property({ type: Number })
  get simulationCount(): number {
    return this._simulationCount;
  }
  set simulationCount(value: any) {
    const oldValue = this._simulationCount;
    this._simulationCount = this.unwrapValue(value, 'number');
    this.requestUpdate('simulationCount', oldValue);
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

  private getGametes(genotype: string): string[] {
    if (genotype.length === 2) {
      // 单因子杂交 (Aa)
      return [genotype[0], genotype[1]];
    } else if (genotype.length === 4) {
      // 双因子杂交 (AaBb)
      const allele1A = genotype[0];
      const allele1B = genotype[1];
      const allele2A = genotype[2];
      const allele2B = genotype[3];
      return [
        allele1A + allele2A,
        allele1A + allele2B,
        allele1B + allele2A,
        allele1B + allele2B
      ];
    }
    return [];
  }

  private combineGametes(gamete1: string, gamete2: string): string {
    return gamete1 + gamete2;
  }

  private normalizeGenotype(genotype: string): string {
    // 标准化基因型顺序 (Aa, AaBb)
    if (genotype.length === 2) {
      const sorted = genotype.split('').sort((a, b) => {
        if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
        if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
        return a.localeCompare(b);
      });
      return sorted.join('');
    } else if (genotype.length === 4) {
      const first = [genotype[0], genotype[1]].sort((a, b) => {
        if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
        if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
        return a.localeCompare(b);
      }).join('');
      const second = [genotype[2], genotype[3]].sort((a, b) => {
        if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
        if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
        return a.localeCompare(b);
      }).join('');
      return first + second;
    }
    return genotype;
  }

  private async runSimulation() {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.results = [];
    this.chiSquare = null;

    const gametes1 = this.getGametes(this._parent1Genotype);
    const gametes2 = this.getGametes(this._parent2Genotype);

    const counts = new Map<string, number>();
    const totalCount = this._simulationCount;

    // 根据速度决定是否分批显示
    const batchSize = this.simulationSpeed === 'instant' ? totalCount :
                      this.simulationSpeed === 'fast' ? 100 : 10;
    const delay = this.simulationSpeed === 'instant' ? 0 :
                  this.simulationSpeed === 'fast' ? 10 : 50;

    for (let i = 0; i < totalCount; i++) {
      const gamete1 = gametes1[Math.floor(Math.random() * gametes1.length)];
      const gamete2 = gametes2[Math.floor(Math.random() * gametes2.length)];
      const offspring = this.normalizeGenotype(this.combineGametes(gamete1, gamete2));

      counts.set(offspring, (counts.get(offspring) || 0) + 1);

      // 分批更新 UI
      if ((i + 1) % batchSize === 0 || i === totalCount - 1) {
        this.updateResults(counts, i + 1);
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 计算卡方检验
    this.calculateChiSquare(counts, totalCount);
    this.isSimulating = false;

    // 绘制图表
    this.renderChart();

    // 发送 action 到后端
    this.dispatchAction('simulation_complete', {
      parent1: this._parent1Genotype,
      parent2: this._parent2Genotype,
      count: totalCount,
      results: Array.from(counts.entries()).map(([genotype, count]) => ({
        genotype,
        count,
        percentage: (count / totalCount) * 100
      }))
    });
  }

  private updateResults(counts: Map<string, number>, currentCount: number) {
    this.results = Array.from(counts.entries()).map(([genotype, count]) => {
      const percentage = (count / currentCount) * 100;
      const expectedPercentage = this.getExpectedPercentage(genotype);
      return {
        genotype,
        count,
        percentage,
        expectedPercentage
      };
    }).sort((a, b) => b.count - a.count);
  }

  private getExpectedPercentage(genotype: string): number {
    // 单因子杂交 Aa × Aa
    if (this._parent1Genotype === 'Aa' && this._parent2Genotype === 'Aa') {
      if (genotype === 'AA') return 25;
      if (genotype === 'Aa') return 50;
      if (genotype === 'aa') return 25;
    }

    // 双因子杂交 AaBb × AaBb
    if (this._parent1Genotype === 'AaBb' && this._parent2Genotype === 'AaBb') {
      const expectedRatios: { [key: string]: number } = {
        'AABB': 6.25, 'AABb': 12.5, 'AAbb': 6.25,
        'AaBB': 12.5, 'AaBb': 25, 'Aabb': 12.5,
        'aaBB': 6.25, 'aaBb': 12.5, 'aabb': 6.25
      };
      return expectedRatios[genotype] || 0;
    }

    // 默认均等分布
    const gametes1 = this.getGametes(this._parent1Genotype);
    const gametes2 = this.getGametes(this._parent2Genotype);
    return 100 / (gametes1.length * gametes2.length);
  }

  private calculateChiSquare(counts: Map<string, number>, total: number) {
    let chiSquareValue = 0;
    let df = counts.size - 1;

    counts.forEach((observed, genotype) => {
      const expected = (this.getExpectedPercentage(genotype) / 100) * total;
      chiSquareValue += Math.pow(observed - expected, 2) / expected;
    });

    // 简化的 p 值估算（χ² 分布）
    const pValue = this.estimatePValue(chiSquareValue, df);
    const significant = pValue < 0.05;

    this.chiSquare = {
      value: chiSquareValue,
      degreesOfFreedom: df,
      pValue,
      significant
    };
  }

  private estimatePValue(chiSquare: number, df: number): number {
    // 简化的 p 值估算（基于临界值表）
    const criticalValues: { [key: number]: number[] } = {
      1: [3.84, 6.63, 10.83],
      2: [5.99, 9.21, 13.82],
      3: [7.81, 11.34, 16.27],
      4: [9.49, 13.28, 18.47]
    };

    const critical = criticalValues[df] || [7.81, 11.34, 16.27];

    if (chiSquare < critical[0]) return 0.1; // p > 0.05
    if (chiSquare < critical[1]) return 0.03; // 0.01 < p < 0.05
    if (chiSquare < critical[2]) return 0.005; // 0.001 < p < 0.01
    return 0.0001; // p < 0.001
  }

  private renderChart() {
    const chartDiv = this.shadowRoot?.getElementById('chart-container');
    if (!chartDiv || this.results.length === 0) return;

    const genotypes = this.results.map(r => r.genotype);
    const observed = this.results.map(r => r.percentage);
    const expected = this.results.map(r => r.expectedPercentage);

    const data = [
      {
        x: genotypes,
        y: observed,
        name: '实际比例',
        type: 'bar',
        marker: { color: '#3b82f6' }
      },
      {
        x: genotypes,
        y: expected,
        name: '理论比例',
        type: 'bar',
        marker: { color: '#ef4444' }
      }
    ];

    const layout = {
      title: '基因型分布对比',
      xaxis: { title: '基因型' },
      yaxis: { title: '百分比 (%)' },
      barmode: 'group',
      height: 400,
      font: { family: 'Inter, sans-serif' }
    };

    Plotly.newPlot(chartDiv, data as any, layout as any, { responsive: true });
  }

  private handleStartSimulation() {
    if (!this._interactive) return;
    this.runSimulation();
  }

  private handleReset() {
    if (!this._interactive) return;
    this.results = [];
    this.chiSquare = null;
    const chartDiv = this.shadowRoot?.getElementById('chart-container');
    if (chartDiv) {
      Plotly.purge(chartDiv);
    }

    this.dispatchAction('reset_simulation', {});
  }

  private handleCountChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._simulationCount = parseInt(select.value, 10);
    this.dispatchAction('count_change', { count: this._simulationCount });
  }

  private handleSpeedChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.simulationSpeed = select.value as 'slow' | 'fast' | 'instant';
    this.dispatchAction('speed_change', { speed: this.simulationSpeed });
  }

  private handleParent1Change(e: Event) {
    const input = e.target as HTMLInputElement;
    this._parent1Genotype = input.value.trim();
    this.dispatchAction('parent1_change', { genotype: this._parent1Genotype });
  }

  private handleParent2Change(e: Event) {
    const input = e.target as HTMLInputElement;
    this._parent2Genotype = input.value.trim();
    this.dispatchAction('parent2_change', { genotype: this._parent2Genotype });
  }

  private dispatchAction(action: string, data: any) {
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'mendel_simulator',
        action,
        data
      },
      bubbles: true,
      composed: true
    }));
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
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .control-row .control-group {
      flex: 1;
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

    .results-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .results-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .results-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #6b7280;
    }

    .genotype-cell {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #111827;
    }

    .percentage-cell {
      font-weight: 600;
    }

    .deviation {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .deviation.high {
      color: #ef4444;
      font-weight: 600;
    }

    .chart-container {
      width: 100%;
      height: 400px;
      margin-bottom: 20px;
    }

    .chi-square-box {
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
    }

    .chi-square-box.significant {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .chi-square-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .chi-square-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 8px;
    }

    .chi-square-box.significant .chi-square-value {
      color: #ef4444;
    }

    .chi-square-info {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.6;
    }

    .chi-square-conclusion {
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .chi-square-box:not(.significant) .chi-square-conclusion {
      color: #059669;
    }

    .chi-square-box.significant .chi-square-conclusion {
      color: #dc2626;
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

    .simulating-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      z-index: 10;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: rotate 1s linear infinite;
    }

    @media (max-width: 768px) {
      .control-row {
        flex-direction: column;
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

    return html`
      <div class="simulator-container">
        <h2 class="title">🧬 孟德尔实验模拟器</h2>

        ${interactive ? html`
          <div class="controls-section">
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">亲本1基因型</label>
                <input
                  type="text"
                  class="control-input"
                  .value=${this._parent1Genotype}
                  @input=${this.handleParent1Change}
                  placeholder="例如: Aa 或 AaBb"
                />
              </div>
              <div class="control-group">
                <label class="control-label">亲本2基因型</label>
                <input
                  type="text"
                  class="control-input"
                  .value=${this._parent2Genotype}
                  @input=${this.handleParent2Change}
                  placeholder="例如: Aa 或 AaBb"
                />
              </div>
            </div>

            <div class="control-row">
              <div class="control-group">
                <label class="control-label">模拟次数</label>
                <select class="control-input" @change=${this.handleCountChange}>
                  <option value="100" ?selected=${this._simulationCount === 100}>100 次</option>
                  <option value="1000" ?selected=${this._simulationCount === 1000}>1000 次</option>
                  <option value="10000" ?selected=${this._simulationCount === 10000}>10000 次</option>
                </select>
              </div>
              <div class="control-group">
                <label class="control-label">模拟速度</label>
                <select class="control-input" @change=${this.handleSpeedChange}>
                  <option value="slow" ?selected=${this.simulationSpeed === 'slow'}>慢速（动画）</option>
                  <option value="fast" ?selected=${this.simulationSpeed === 'fast'}>快速</option>
                  <option value="instant" ?selected=${this.simulationSpeed === 'instant'}>瞬时</option>
                </select>
              </div>
            </div>

            <div class="button-group">
              <button
                class="btn btn-primary"
                @click=${this.handleStartSimulation}
                ?disabled=${this.isSimulating}
              >
                ${this.isSimulating ? '模拟中...' : '开始模拟'}
              </button>
              <button
                class="btn btn-secondary"
                @click=${this.handleReset}
                ?disabled=${this.isSimulating || this.results.length === 0}
              >
                重置
              </button>
            </div>
          </div>

          ${this.results.length > 0 ? html`
            <div class="results-section" style="position: relative;">
              ${this.isSimulating ? html`
                <div class="simulating-overlay">
                  <div class="spinner"></div>
                </div>
              ` : ''}

              <h3 class="section-title">📊 模拟结果</h3>

              <table class="results-table">
                <thead>
                  <tr>
                    <th>基因型</th>
                    <th>数量</th>
                    <th>实际比例</th>
                    <th>理论比例</th>
                    <th>偏差</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.results.map(result => {
                    const deviation = Math.abs(result.percentage - result.expectedPercentage);
                    return html`
                      <tr>
                        <td class="genotype-cell">${result.genotype}</td>
                        <td>${result.count}</td>
                        <td class="percentage-cell">${result.percentage.toFixed(2)}%</td>
                        <td>${result.expectedPercentage.toFixed(2)}%</td>
                        <td class="deviation ${deviation > 5 ? 'high' : ''}">
                          ${deviation > 0 ? '+' : ''}${(result.percentage - result.expectedPercentage).toFixed(2)}%
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>

              <div id="chart-container" class="chart-container"></div>

              ${this.chiSquare ? html`
                <div class="chi-square-box ${this.chiSquare.significant ? 'significant' : ''}">
                  <div class="chi-square-title">卡方检验（χ² Test）</div>
                  <div class="chi-square-value">
                    χ² = ${this.chiSquare.value.toFixed(3)}
                  </div>
                  <div class="chi-square-info">
                    自由度 (df) = ${this.chiSquare.degreesOfFreedom}<br>
                    p 值 ≈ ${this.chiSquare.pValue.toFixed(4)}<br>
                    显著性水平 α = 0.05
                  </div>
                  <div class="chi-square-conclusion">
                    ${this.chiSquare.significant
                      ? '❌ 实际结果与理论比例存在显著差异（p < 0.05），拒绝原假设'
                      : '✅ 实际结果与理论比例无显著差异（p ≥ 0.05），符合孟德尔定律'
                    }
                  </div>
                </div>
              ` : ''}
            </div>
          ` : html`
            <div class="results-section">
              <div class="empty-state">
                <div class="empty-icon">🧪</div>
                <div class="empty-text">点击"开始模拟"按钮运行孟德尔实验</div>
              </div>
            </div>
          `}
        ` : html`
          <div class="results-section">
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
