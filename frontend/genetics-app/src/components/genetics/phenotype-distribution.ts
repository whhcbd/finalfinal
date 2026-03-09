/*
 PhenotypeDistribution Component for Genetics Visualization
 表型分布柱状图组件 - 用于展示群体表型分布
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface PhenotypeData {
  phenotype: string;
  count: number;
  percentage: number;
}

@customElement('phenotype-distribution')
export class PhenotypeDistribution extends Root {
  private _data: PhenotypeData[] = [];
  private _trait: string = '';

  @property({ type: Array })
  get data(): PhenotypeData[] {
    return this._data;
  }
  set data(value: any) {
    const oldValue = this._data;
    this._data = this.unwrapValue(value, 'array');
    this.requestUpdate('data', oldValue);
  }

  @property({ type: String })
  get trait(): string {
    return this._trait;
  }
  set trait(value: any) {
    const oldValue = this._trait;
    this._trait = this.unwrapValue(value, 'string');
    this.requestUpdate('trait', oldValue);
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

  private static readonly COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16'
  ];

  static styles = [
    ...Root.styles,
    css`
    :host {
      display: block;
      padding: 16px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .container {
      max-width: 700px;
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

    .chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bar-label {
      min-width: 100px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #6b7280;
      text-align: right;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      height: 32px;
      background: #fafafa;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    .bar {
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 12px;
      border-radius: 4px;
      transition: width 0.3s ease, opacity 0.2s ease;
      cursor: pointer;
      position: relative;
    }

    .bar:hover {
      opacity: 0.85;
    }

    .bar-text {
      color: #ffffff;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-stats {
      min-width: 100px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .stat-percentage {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .stat-count {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .total-stats {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  `];

  private getTotalCount(): number {
    return this.data.reduce((sum, item) => sum + item.count, 0);
  }

  private getMaxCount(): number {
    return Math.max(...this.data.map(item => item.count));
  }

  private getBarWidth(count: number): number {
    const max = this.getMaxCount();
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  private getBarColor(index: number): string {
    return PhenotypeDistribution.COLORS[index % PhenotypeDistribution.COLORS.length];
  }

  override render() {
    const totalCount = this.getTotalCount();

    if (this.data.length === 0) {
      return html`<div class="empty">暂无表型分布数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">${this.trait || '表型分布'}</div>

        <div class="chart-container">
          <div class="chart">
            ${map(this.data, (item, index) => html`
              <div class="bar-row">
                <div class="bar-label">${item.phenotype}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar"
                    style="width: ${this.getBarWidth(item.count)}%; background-color: ${this.getBarColor(index)};"
                    @click=${() => this.handleBarClick(item)}
                    aria-label="${item.phenotype}: ${item.count} (${item.percentage}%)"
                    tabindex="0"
                  >
                    ${this.getBarWidth(item.count) > 15 ? html`
                      <span class="bar-text">${item.percentage.toFixed(1)}%</span>
                    ` : ''}
                  </div>
                </div>
                <div class="bar-stats">
                  <div class="stat-percentage">${item.percentage.toFixed(1)}%</div>
                  <div class="stat-count">${item.count}</div>
                </div>
              </div>
            `)}
          </div>

          <div class="total-stats">
            <div class="stat-item">
              <div class="stat-label">总数量</div>
              <div class="stat-value">${totalCount}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">表型种类</div>
              <div class="stat-value">${this.data.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大数量</div>
              <div class="stat-value">${this.getMaxCount()}</div>
            </div>
          </div>
        </div>

        <div class="legend">
          <div class="legend-title">颜色图例</div>
          <div class="legend-grid">
            ${map(this.data, (item, index) => html`
              <div class="legend-item">
                <div
                  class="legend-color"
                  style="background-color: ${this.getBarColor(index)};"
                ></div>
                <div class="legend-text">
                  <strong>${item.phenotype}</strong><br>
                  <small>${item.percentage.toFixed(1)}%</small>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private handleBarClick(item: PhenotypeData) {
    this.dispatchEvent(new CustomEvent('bar-click', {
      detail: {
        phenotype: item.phenotype,
        count: item.count,
        percentage: item.percentage
      },
      bubbles: true,
      composed: true
    }));
  }
}
