/*
 PhenotypeDistribution Component for Genetics Visualization
 表型分布柱状图组件 - 用于展示群体表型分布
*/

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface PhenotypeData {
  phenotype: string;
  count: number;
  percentage: number;
}

@customElement('phenotype-distribution')
export class PhenotypeDistribution extends LitElement {
  @property({ type: Array }) data: PhenotypeData[] = [];
  @property({ type: String }) trait: string = '';

  private static readonly COLORS = [
    '#1a73e8',
    '#188038',
    '#f9ab00',
    '#d93025',
    '#7c3aed',
    '#2563eb',
    '#059669',
    '#e53935'
  ];

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-family: 'Roboto', sans-serif;
    }

    .container {
      max-width: 700px;
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
      color: #5f6368;
      text-align: right;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      height: 32px;
      background: #f8f9fa;
      border-radius: 4px;
      overflow: hidden;
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
      opacity: 0.9;
      transform: scaleY(1.05);
      transform-origin: center;
    }

    .bar-label {
      color: #fff;
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
      color: #202124;
    }

    .stat-count {
      font-size: 0.85rem;
      color: #5f6368;
    }

    .total-stats {
      margin-top: 16px;
      padding: 12px;
      background: #e8f0fe;
      border-radius: 6px;
      display: flex;
      justify-content: space-around;
    }

    .stat-item {
      text-align: center;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #5f6368;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a73e8;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #5f6368;
      font-style: italic;
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
      background: #fff;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #5f6368;
      flex: 1;
    }
  `;

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
                      <span class="bar-label">${item.percentage.toFixed(1)}%</span>
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
