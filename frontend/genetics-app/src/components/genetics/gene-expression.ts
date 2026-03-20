/*
 GeneExpression Component for Genetics Visualization
 基因表达水平组件 - 用于展示不同条件下基因的表达数据
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

export interface GeneData {
  gene: string;
  expressionLevels: number[];
}

export interface Condition {
  name: string;
  color?: string;
}

@customElement('gene-expression')
export class GeneExpression extends Root {
  private _genes: GeneData[] = [];
  private _expressionLevels: number[][] = [];
  private _conditions: Condition[] = [];
  private _interactive: boolean = true;

  @property({ type: Array })
  get genes(): GeneData[] {
    return this._genes;
  }
  set genes(value: any) {
    const oldValue = this._genes;
    // Store the raw value (could be a path reference or literal)
    this._genes = value;
    this.requestUpdate('genes', oldValue);
  }

  @property({ type: Array })
  get expressionLevels(): number[][] {
    return this._expressionLevels;
  }
  set expressionLevels(value: any) {
    const oldValue = this._expressionLevels;
    // Store the raw value (could be a path reference or literal)
    this._expressionLevels = value;
    this.requestUpdate('expressionLevels', oldValue);
  }

  @property({ type: Array })
  get conditions(): Condition[] {
    return this._conditions;
  }
  set conditions(value: any) {
    const oldValue = this._conditions;
    // Store the raw value (could be a path reference or literal)
    this._conditions = value;
    this.requestUpdate('conditions', oldValue);
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

  @property({ type: Object })
  selectedGene: { gene: string; conditionIndex: number } | null = null;

  @property({ type: Boolean })
  lacOperonMode: boolean = false;

  @property({ type: Boolean })
  lactosePresent: boolean = false;

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'number' | 'array'): any {
    if (value === null || value === undefined) {
      return type === 'string' ? '' :
             type === 'boolean' ? false :
             type === 'number' ? 0 :
             type === 'array' ? [] : null;
    }

    // Handle A2UI data binding (path references)
    if (value && typeof value === 'object' && 'path' in value && value.path) {
      if (!this.processor || !this.component) {
        return type === 'string' ? '' :
               type === 'boolean' ? false :
               type === 'number' ? 0 :
               type === 'array' ? [] : null;
      }

      // Use A2UI's getData to resolve the path
      const resolvedValue = this.processor.getData(this.component, value.path);

      // If still undefined, try to get directly from dataModel
      if (resolvedValue === undefined) {
        const surface = (this.processor as any).surfaces?.get('genetics_ui');
        if (surface && surface.dataModel) {
          const key = value.path.startsWith('/') ? value.path.substring(1) : value.path;
          return surface.dataModel.get(key);
        }
      }

      return resolvedValue;
    }

    // Handle literal values
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
      if (type === 'array' && 'literalArray' in value) {
        return value.literalArray;
      }
    }

    return value;
  }

  private static readonly DEFAULT_COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16'
  ];

  private getConditionColor(index: number, conditions: Condition[]): string {
    if (conditions[index]?.color) {
      return conditions[index].color;
    }
    return GeneExpression.DEFAULT_COLORS[index % GeneExpression.DEFAULT_COLORS.length];
  }

  private getMaxExpressionLevel(genes: GeneData[]): number {
    let max = 0;
    for (const gene of genes) {
      for (const level of gene.expressionLevels) {
        if (level > max) {
          max = level;
        }
      }
    }
    return max;
  }

  private getAverageExpressionLevel(gene: GeneData): number {
    if (gene.expressionLevels.length === 0) return 0;
    const sum = gene.expressionLevels.reduce((a, b) => a + b, 0);
    return sum / gene.expressionLevels.length;
  }

  private getBarHeight(level: number, genes: GeneData[]): number {
    const max = this.getMaxExpressionLevel(genes);
    if (max === 0) return 0;
    return (level / max) * 100;
  }

  static styles = [
    ...Root.styles,
    css`${unsafeCSS(animationStyles)}`,
    css`
    :host {
      display: block;
      padding: 16px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      text-align: center;
      margin-bottom: 16px;
    }

    .chart-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .chart-type-selector {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .chart-type-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .chart-type-btn:hover {
      background: #fafafa;
      border-color: #111827;
      color: #111827;
    }

    .chart-type-btn.active {
      background: #111827;
      border-color: #111827;
      color: #ffffff;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .gene-row {
      background: #fafafa;
      border-radius: 6px;
      padding: 12px;
      border: 1px solid #e5e7eb;
    }

    .gene-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .bars-container {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      height: 200px;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bar {
      width: 100%;
      background: #111827;
      border-radius: 4px 4px 0 0;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      min-height: 4px;
    }

    .bar:hover {
      opacity: 0.85;
    }

    .bar-label {
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
      white-space: nowrap;
    }

    .bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      font-weight: 600;
      color: #111827;
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .line-chart {
      position: relative;
      height: 300px;
      padding: 20px;
    }

    .chart-canvas {
      width: 100%;
      height: 100%;
    }

    .legend {
      margin-top: 16px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .legend-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #6b7280;
      flex: 1;
    }

    .stats {
      margin-top: 16px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      display: flex;
      justify-content: space-around;
      border: 1px solid #e5e7eb;
    }

    .stat-item {
      text-align: center;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }

    .interactive-controls {
      margin-top: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .control-section {
      margin-bottom: 16px;
    }

    .control-section:last-child {
      margin-bottom: 0;
    }

    .control-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slider-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .slider-label {
      min-width: 80px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #111827;
    }

    .slider-input {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #e5e7eb;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }

    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #111827;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .slider-input::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      background: #3b82f6;
    }

    .slider-input::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #111827;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .slider-input::-moz-range-thumb:hover {
      transform: scale(1.2);
      background: #3b82f6;
    }

    .slider-value {
      min-width: 50px;
      text-align: right;
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
    }

    .lac-operon-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toggle-group {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .toggle-label {
      flex: 1;
      font-size: 0.9rem;
      color: #111827;
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 24px;
      background: #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .toggle-switch.active {
      background: #10b981;
    }

    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: #ffffff;
      border-radius: 50%;
      transition: transform 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch.active .toggle-slider {
      transform: translateX(24px);
    }

    .operon-info {
      padding: 12px;
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .bar.animating {
      transition: height 0.5s ease-out, background-color 0.5s ease-out;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
    }

    .bar.selected {
      animation: pulse 1.5s infinite;
      border: 2px solid #3b82f6;
    }
  `];

  private chartType: 'bar' | 'line' = 'bar';

  private getNormalizedGenes(): GeneData[] {
    const rawGenes = this.unwrapValue(this._genes, 'array');
    const rawExpressionLevels = this.unwrapValue(this._expressionLevels, 'array');
    return rawGenes.map((g: any, i: number) => {
      if (typeof g === 'string') {
        return { gene: g, expressionLevels: rawExpressionLevels[i] ?? [] };
      }
      if (g && typeof g === 'object') {
        const levels = g.expressionLevels ?? rawExpressionLevels[i] ?? [];
        return { gene: g.gene ?? g.name ?? String(g), expressionLevels: Array.isArray(levels) ? levels : [] };
      }
      return { gene: String(g), expressionLevels: rawExpressionLevels[i] ?? [] };
    });
  }

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const genes = this.getNormalizedGenes();
    const conditions = this.unwrapValue(this._conditions, 'array');

    if (genes.length === 0) {
      return html`<div class="empty">暂无基因表达数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">基因表达水平</div>

        ${this._interactive ? this.renderInteractiveControls(genes, conditions) : ''}

        <div class="chart-container">
          <div class="chart-type-selector">
            <button
              class="chart-type-btn ${this.chartType === 'bar' ? 'active' : ''}"
              @click=${() => this.setChartType('bar')}
            >
              条形图
            </button>
            <button
              class="chart-type-btn ${this.chartType === 'line' ? 'active' : ''}"
              @click=${() => this.setChartType('line')}
            >
              折线图
            </button>
          </div>

          ${this.chartType === 'bar' ? this.renderBarChart(genes, conditions) : this.renderLineChart(genes, conditions)}
        </div>

        <div class="legend">
          <div class="legend-title">条件图例</div>
          <div class="legend-grid">
            ${map(conditions, (condition, index) => html`
              <div class="legend-item">
                <div
                  class="legend-color"
                  style="background-color: ${this.getConditionColor(index, conditions)};"
                ></div>
                <span class="legend-text">${condition.name}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">基因数量</div>
            <div class="stat-value">${genes.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">条件数量</div>
            <div class="stat-value">${conditions.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最高表达量</div>
            <div class="stat-value">${this.getMaxExpressionLevel(genes)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均表达量</div>
            <div class="stat-value">${this.getAverageExpression(genes)}</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderBarChart(genes: GeneData[], conditions: Condition[]) {
    return html`
      <div class="bar-chart">
        ${map(genes, (gene, geneIndex) => html`
          <div class="gene-row">
            <div class="gene-name">${gene.gene}</div>
            <div class="bars-container">
              ${map(gene.expressionLevels, (level, levelIndex) => html`
                <div class="bar-wrapper">
                  <div
                    class="bar ${this._interactive && this.selectedGene?.gene === gene.gene && this.selectedGene?.conditionIndex === levelIndex ? 'selected' : ''} ${this._interactive ? 'animating' : ''}"
                    style="height: ${this.getBarHeight(level, genes)}%; background-color: ${this.getConditionColor(levelIndex, conditions)};"
                    @click=${() => this.handleBarClick(gene, levelIndex, level, conditions)}
                    aria-label="${gene.gene} - ${conditions[levelIndex]?.name || '条件 ' + (levelIndex + 1)}: ${level}"
                    tabindex="0"
                  >
                    ${this.getBarHeight(level, genes) > 15 ? html`
                      <div class="bar-value">${level}</div>
                    ` : ''}
                  </div>
                  <div class="bar-label">${conditions[levelIndex]?.name || '条件 ' + (levelIndex + 1)}</div>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderLineChart(genes: GeneData[], conditions: Condition[]) {
    return html`
      <div class="line-chart">
        <canvas class="chart-canvas" id="lineChart"></canvas>
      </div>
    `;
  }

  private setChartType(type: 'bar' | 'line') {
    this.chartType = type;
    this.requestUpdate();

    if (type === 'line') {
      setTimeout(() => this.drawLineChart(), 100);
    }
  }

  private drawLineChart() {
    const canvas = this.shadowRoot?.querySelector('#lineChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const genes = this.getNormalizedGenes();
    const conditions = this.unwrapValue(this._conditions, 'array');

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const padding = 40;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;
    const maxLevel = this.getMaxExpressionLevel(genes);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const xStep = width / (conditions.length - 1);

    for (const gene of genes) {
      const color = this.getConditionColor(genes.indexOf(gene), conditions);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      gene.expressionLevels.forEach((level, index) => {
        const x = padding + index * xStep;
        const y = padding + height - (level / maxLevel) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      gene.expressionLevels.forEach((level, index) => {
        const x = padding + index * xStep;
        const y = padding + height - (level / maxLevel) * height;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.fillStyle = '#5f6368';
    ctx.font = '12px Roboto';

    conditions.forEach((condition, index) => {
      const x = padding + index * xStep;
      ctx.fillText(condition.name, x - 20, rect.height - 10);
    });
  }

  private getAverageExpression(genes: GeneData[]): string {
    if (genes.length === 0) return '0.0';
    const sum = genes.reduce((total, gene) => {
      return total + this.getAverageExpressionLevel(gene);
    }, 0);
    return (sum / genes.length).toFixed(1);
  }

  private handleBarClick(gene: GeneData, conditionIndex: number, level: number, conditions: Condition[]) {
    if (!this._interactive) return;

    this.selectedGene = { gene: gene.gene, conditionIndex };
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'gene_expression',
        action: 'bar_click',
        data: {
          gene: gene.gene,
          condition: conditions[conditionIndex]?.name,
          level
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private renderInteractiveControls(genes: GeneData[], conditions: Condition[]) {
    return html`
      <div class="interactive-controls">
        <div class="control-section">
          <div class="control-title">调节基因表达水平</div>
          <div class="slider-group">
            ${map(genes, (gene, geneIndex) => html`
              ${map(conditions, (condition, conditionIndex) => html`
                <div class="slider-item">
                  <span class="slider-label">${gene.gene} - ${condition.name}</span>
                  <input
                    type="range"
                    class="slider-input"
                    min="0"
                    max="100"
                    .value=${gene.expressionLevels[conditionIndex]?.toString() || '0'}
                    @input=${(e: Event) => this.handleSliderChange(geneIndex, conditionIndex, (e.target as HTMLInputElement).value)}
                    aria-label="调节 ${gene.gene} 在 ${condition.name} 条件下的表达水平"
                  />
                  <span class="slider-value">${gene.expressionLevels[conditionIndex] || 0}%</span>
                </div>
              `)}
            `)}
          </div>
        </div>

        <div class="control-section">
          <div class="control-title">lac 操纵子模拟</div>
          <div class="lac-operon-controls">
            <div class="toggle-group">
              <span class="toggle-label">启用 lac 操纵子模式</span>
              <div
                class="toggle-switch ${this.lacOperonMode ? 'active' : ''}"
                @click=${() => this.toggleLacOperonMode()}
                role="switch"
                aria-checked=${this.lacOperonMode}
                tabindex="0"
              >
                <div class="toggle-slider"></div>
              </div>
            </div>

            ${this.lacOperonMode ? html`
              <div class="toggle-group">
                <span class="toggle-label">乳糖存在</span>
                <div
                  class="toggle-switch ${this.lactosePresent ? 'active' : ''}"
                  @click=${() => this.toggleLactose()}
                  role="switch"
                  aria-checked=${this.lactosePresent}
                  tabindex="0"
                >
                  <div class="toggle-slider"></div>
                </div>
              </div>

              <div class="operon-info">
                ${this.lactosePresent
                  ? '✓ 乳糖存在：lac 操纵子开启，lacZ、lacY、lacA 基因高表达（>80%），编码分解乳糖的酶'
                  : '✗ 无乳糖：lac 操纵子关闭，阻遏蛋白结合操纵子，基因表达受抑制（<10%）'
                }
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private handleSliderChange(geneIndex: number, conditionIndex: number, value: string) {
    if (!this._interactive) return;

    const newValue = parseInt(value, 10);
    const genes = this.getNormalizedGenes();

    if (genes[geneIndex]) {
      const oldValue = genes[geneIndex].expressionLevels[conditionIndex];
      genes[geneIndex].expressionLevels[conditionIndex] = newValue;

      this._genes = [...genes];
      this.requestUpdate();

      this.animateBarChange(geneIndex, conditionIndex, oldValue, newValue);

      this.dispatchEvent(new CustomEvent('a2ui-action', {
        detail: {
          component: 'gene_expression',
          action: 'slider_change',
          data: {
            gene: genes[geneIndex].gene,
            conditionIndex,
            value: newValue
          }
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  private animateBarChange(geneIndex: number, conditionIndex: number, oldValue: number, newValue: number) {
    const bar = this.shadowRoot?.querySelector(
      `.gene-row:nth-child(${geneIndex + 1}) .bar-wrapper:nth-child(${conditionIndex + 1}) .bar`
    ) as HTMLElement;

    if (bar) {
      bar.classList.add('animating');
      setTimeout(() => {
        bar.classList.remove('animating');
      }, 500);
    }
  }

  private toggleLacOperonMode() {
    if (!this._interactive) return;

    this.lacOperonMode = !this.lacOperonMode;

    if (this.lacOperonMode) {
      this.lactosePresent = false;
      this.applyLacOperonEffect();
    }

    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'gene_expression',
        action: 'toggle_lac_operon',
        data: {
          enabled: this.lacOperonMode
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private toggleLactose() {
    if (!this._interactive || !this.lacOperonMode) return;

    this.lactosePresent = !this.lactosePresent;
    this.applyLacOperonEffect();
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'gene_expression',
        action: 'toggle_lactose',
        data: {
          present: this.lactosePresent
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private applyLacOperonEffect() {
    const genes = this.getNormalizedGenes();
    const lacGenes = ['lacZ', 'lacY', 'lacA'];

    genes.forEach((gene, geneIndex) => {
      if (lacGenes.includes(gene.gene)) {
        gene.expressionLevels = gene.expressionLevels.map((level, conditionIndex) => {
          const targetValue = this.lactosePresent ? 85 + Math.random() * 10 : 5 + Math.random() * 5;

          setTimeout(() => {
            this.animateBarChange(geneIndex, conditionIndex, level, Math.round(targetValue));
          }, conditionIndex * 100);

          return Math.round(targetValue);
        });
      }
    });

    this._genes = [...genes];
  }
}
