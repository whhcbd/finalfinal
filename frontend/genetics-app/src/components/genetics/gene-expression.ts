/*
 GeneExpression Component for Genetics Visualization
 基因表达水平组件 - 用于展示不同条件下基因的表达数据
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

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

  @property({ type: Array })
  get genes(): GeneData[] {
    return this._genes;
  }
  set genes(value: any) {
    const oldValue = this._genes;
    this._genes = this.unwrapValue(value, 'array');
    this.requestUpdate('genes', oldValue);
  }

  @property({ type: Array })
  get expressionLevels(): number[][] {
    return this._expressionLevels;
  }
  set expressionLevels(value: any) {
    const oldValue = this._expressionLevels;
    this._expressionLevels = this.unwrapValue(value, 'array');
    this.requestUpdate('expressionLevels', oldValue);
  }

  @property({ type: Array })
  get conditions(): Condition[] {
    return this._conditions;
  }
  set conditions(value: any) {
    const oldValue = this._conditions;
    this._conditions = this.unwrapValue(value, 'array');
    this.requestUpdate('conditions', oldValue);
  }

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'number' | 'array'): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return type === 'string' ? '' :
             type === 'boolean' ? false :
             type === 'number' ? 0 :
             type === 'array' ? [] : null;
    }

    // Handle A2UI Proxy-wrapped values
    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('literalString' in value) return value.literalString;
      if ('literalBoolean' in value) return value.literalBoolean;
      if ('literalNumber' in value) return value.literalNumber;
      if ('literalArray' in value) return value.literalArray;
    }

    return value;
  }

  private static readonly DEFAULT_COLORS = [
    '#1a73e8',
    '#188038',
    '#f9ab00',
    '#d93025',
    '#7c3aed',
    '#2563eb',
    '#059669',
    '#e53935'
  ];

  private getConditionColor(index: number): string {
    if (this.conditions[index]?.color) {
      return this.conditions[index].color;
    }
    return GeneExpression.DEFAULT_COLORS[index % GeneExpression.DEFAULT_COLORS.length];
  }

  private getMaxExpressionLevel(): number {
    let max = 0;
    for (const gene of this.genes) {
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

  private getBarHeight(level: number): number {
    const max = this.getMaxExpressionLevel();
    if (max === 0) return 0;
    return (level / max) * 100;
  }

  static styles = [
    ...Root.styles,
    css`
    :host {
      display: block;
      padding: 16px;
      font-family: 'Roboto', sans-serif;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #202124;
      text-align: center;
      margin-bottom: 16px;
    }

    .chart-container {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .chart-type-selector {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .chart-type-btn {
      padding: 8px 16px;
      border: 2px solid #dadce0;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      color: #5f6368;
      transition: all 0.2s ease;
    }

    .chart-type-btn:hover {
      background: #e8f0fe;
      border-color: #1a73e8;
      color: #1a73e8;
    }

    .chart-type-btn.active {
      background: #1a73e8;
      border-color: #1a73e8;
      color: #fff;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .gene-row {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 12px;
    }

    .gene-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #202124;
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
      background: #1a73e8;
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      min-height: 4px;
    }

    .bar:hover {
      opacity: 0.9;
      transform: scaleY(1.05);
      transform-origin: bottom;
    }

    .bar-label {
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: #5f6368;
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
      color: #202124;
      background: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      background: #f8f9fa;
      border-radius: 6px;
    }

    .legend-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #202124;
      margin-bottom: 8px;
    }

    .legend-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #fff;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #5f6368;
    }

    .stats {
      margin-top: 16px;
      padding: 12px;
      background: #e8f0fe;
      border-radius: 6px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #5f6368;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1a73e8;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #5f6368;
      font-style: italic;
    }

    .toggle-wrapper {
      margin-top: 12px;
      text-align: center;
    }
  `];

  private chartType: 'bar' | 'line' = 'bar';

  override render() {
    if (this.genes.length === 0) {
      return html`<div class="empty">暂无基因表达数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">基因表达水平</div>

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

          ${this.chartType === 'bar' ? this.renderBarChart() : this.renderLineChart()}
        </div>

        <div class="legend">
          <div class="legend-title">条件图例</div>
          <div class="legend-grid">
            ${map(this.conditions, (condition, index) => html`
              <div class="legend-item">
                <div
                  class="legend-color"
                  style="background-color: ${this.getConditionColor(index)};"
                ></div>
                <span class="legend-text">${condition.name}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">基因数量</div>
            <div class="stat-value">${this.genes.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">条件数量</div>
            <div class="stat-value">${this.conditions.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最高表达量</div>
            <div class="stat-value">${this.getMaxExpressionLevel()}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均表达量</div>
            <div class="stat-value">${this.getAverageExpression()}</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderBarChart() {
    return html`
      <div class="bar-chart">
        ${map(this.genes, (gene, geneIndex) => html`
          <div class="gene-row">
            <div class="gene-name">${gene.gene}</div>
            <div class="bars-container">
              ${map(gene.expressionLevels, (level, levelIndex) => html`
                <div class="bar-wrapper">
                  <div
                    class="bar"
                    style="height: ${this.getBarHeight(level)}%; background-color: ${this.getConditionColor(levelIndex)};"
                    @click=${() => this.handleBarClick(gene, levelIndex, level)}
                    aria-label="${gene.gene} - ${this.conditions[levelIndex]?.name || '条件 ' + (levelIndex + 1)}: ${level}"
                    tabindex="0"
                  >
                    ${this.getBarHeight(level) > 15 ? html`
                      <div class="bar-value">${level}</div>
                    ` : ''}
                  </div>
                  <div class="bar-label">${this.conditions[levelIndex]?.name || '条件 ' + (levelIndex + 1)}</div>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderLineChart() {
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

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const padding = 40;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;
    const maxLevel = this.getMaxExpressionLevel();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const xStep = width / (this.conditions.length - 1);

    for (const gene of this.genes) {
      const color = this.getConditionColor(this.genes.indexOf(gene));

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

    this.conditions.forEach((condition, index) => {
      const x = padding + index * xStep;
      ctx.fillText(condition.name, x - 20, rect.height - 10);
    });
  }

  private getAverageExpression(): string {
    if (this.genes.length === 0) return '0.0';
    const sum = this.genes.reduce((total, gene) => {
      return total + this.getAverageExpressionLevel(gene);
    }, 0);
    return (sum / this.genes.length).toFixed(1);
  }

  private handleBarClick(gene: GeneData, conditionIndex: number, level: number) {
    this.dispatchEvent(new CustomEvent('bar-click', {
      detail: {
        gene: gene.gene,
        condition: this.conditions[conditionIndex]?.name,
        level
      },
      bubbles: true,
      composed: true
    }));
  }
}
