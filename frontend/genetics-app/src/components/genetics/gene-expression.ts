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
  `];

  private chartType: 'bar' | 'line' = 'bar';

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const genes = this.unwrapValue(this._genes, 'array');
    const conditions = this.unwrapValue(this._conditions, 'array');

    if (genes.length === 0) {
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
                    class="bar"
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

    // Unwrap values for drawing
    const genes = this.unwrapValue(this._genes, 'array');
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
    this.dispatchEvent(new CustomEvent('bar-click', {
      detail: {
        gene: gene.gene,
        condition: conditions[conditionIndex]?.name,
        level
      },
      bubbles: true,
      composed: true
    }));
  }
}
