/*
 PhenotypeDistribution Component for Genetics Visualization
 表型分布柱状图组件 - 用于展示群体表型分布
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

export interface PhenotypeData {
  phenotype: string;
  count: number;
  percentage: number;
}

@customElement('phenotype-distribution')
export class PhenotypeDistribution extends Root {
  private _data: PhenotypeData[] = [];
  private _trait: string = '';
  private _interactive: boolean = true;

  @property({ type: Array })
  get data(): PhenotypeData[] {
    return this._data;
  }
  set data(value: any) {
    const oldValue = this._data;
    // Store the raw value (could be a path reference or literal)
    this._data = value;
    this.requestUpdate('data', oldValue);
  }

  @property({ type: String })
  get trait(): string {
    return this._trait;
  }
  set trait(value: any) {
    const oldValue = this._trait;
    // Store the raw value (could be a path reference or literal)
    this._trait = value;
    this.requestUpdate('trait', oldValue);
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
  selectedPhenotype: PhenotypeData | null = null;

  @property({ type: Array })
  selectedFilters: string[] = [];

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'array' | 'object'): any {
    if (value === null || value === undefined) {
      return type === 'string' ? '' :
             type === 'boolean' ? false :
             type === 'array' ? [] :
             type === 'object' ? {} : null;
    }

    // Handle A2UI data binding (path references)
    if (value && typeof value === 'object' && 'path' in value && value.path) {
      if (!this.processor || !this.component) {
        return type === 'string' ? '' :
               type === 'boolean' ? false :
               type === 'array' ? [] :
               type === 'object' ? {} : null;
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
      if (type === 'array' && 'literalArray' in value) {
        return value.literalArray;
      }
      if (type === 'object' && 'literalObject' in value) {
        return value.literalObject;
      }
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
    css`${unsafeCSS(animationStyles)}`,
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

    .bar.selected {
      border: 3px solid #111827;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    .bar.animating {
      transition: width 0.5s ease-out, opacity 0.3s ease;
    }

    .detail-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 1000;
      min-width: 350px;
      max-width: 500px;
      border: 1px solid #e5e7eb;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    .modal-header {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-color-badge {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .modal-content {
      font-size: 0.95rem;
      color: #6b7280;
      line-height: 1.6;
    }

    .modal-content strong {
      color: #111827;
      font-weight: 600;
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
    }

    .modal-close:hover {
      color: #111827;
    }

    .filter-controls {
      margin-top: 16px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .filter-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-checkbox:hover {
      border-color: #111827;
      background: #fafafa;
    }

    .filter-checkbox.active {
      background: #111827;
      color: #ffffff;
      border-color: #111827;
    }

    .filter-checkbox input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .filter-label {
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
    }

    @keyframes pulse-bar {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
    }

    .bar.selected {
      animation: pulse-bar 1.5s infinite;
    }
  `];

  private getTotalCount(data: PhenotypeData[]): number {
    return data.reduce((sum, item) => sum + item.count, 0);
  }

  private getMaxCount(data: PhenotypeData[]): number {
    return Math.max(...data.map(item => item.count));
  }

  private getBarWidth(count: number, data: PhenotypeData[]): number {
    const max = this.getMaxCount(data);
    if (max === 0) return 0;
    return (count / max) * 100;
  }

  private getBarColor(index: number): string {
    return PhenotypeDistribution.COLORS[index % PhenotypeDistribution.COLORS.length];
  }

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const data = this.unwrapValue(this._data, 'array');
    const trait = this.unwrapValue(this._trait, 'string');

    const filteredData = this.getFilteredData(data);
    const totalCount = this.getTotalCount(filteredData);

    if (data.length === 0) {
      return html`<div class="empty">暂无表型分布数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">${trait || '表型分布'}</div>

        ${this._interactive ? this.renderFilterControls(data) : ''}

        <div class="chart-container">
          <div class="chart">
            ${map(filteredData, (item, index) => {
              const originalIndex = data.findIndex(d => d.phenotype === item.phenotype);
              return html`
              <div class="bar-row">
                <div class="bar-label">${item.phenotype}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar ${this.selectedPhenotype?.phenotype === item.phenotype ? 'selected' : ''} animating"
                    style="width: ${this.getBarWidth(item.count, filteredData)}%; background-color: ${this.getBarColor(originalIndex)};"
                    @click=${() => this.handleBarClick(item, originalIndex)}
                    aria-label="${item.phenotype}: ${item.count} (${item.percentage}%)"
                    tabindex="0"
                  >
                    ${this.getBarWidth(item.count, filteredData) > 15 ? html`
                      <span class="bar-text">${item.percentage.toFixed(1)}%</span>
                    ` : ''}
                  </div>
                </div>
                <div class="bar-stats">
                  <div class="stat-percentage">${item.percentage.toFixed(1)}%</div>
                  <div class="stat-count">${item.count}</div>
                </div>
              </div>
            `})}
          </div>

          <div class="total-stats">
            <div class="stat-item">
              <div class="stat-label">总数量</div>
              <div class="stat-value">${totalCount}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">表型种类</div>
              <div class="stat-value">${filteredData.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大数量</div>
              <div class="stat-value">${this.getMaxCount(filteredData)}</div>
            </div>
          </div>
        </div>

        <div class="legend">
          <div class="legend-title">颜色图例</div>
          <div class="legend-grid">
            ${map(data, (item, index) => html`
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

        ${this.selectedPhenotype ? this.renderDetailModal() : ''}
      </div>
    `;
  }

  private handleBarClick(item: PhenotypeData, colorIndex: number) {
    if (!this._interactive) return;

    this.selectedPhenotype = item;
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'phenotype_distribution',
        action: 'bar_click',
        data: {
          phenotype: item.phenotype,
          count: item.count,
          percentage: item.percentage
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private renderDetailModal() {
    if (!this.selectedPhenotype) return '';

    const data = this.unwrapValue(this._data, 'array');
    const colorIndex = data.findIndex(d => d.phenotype === this.selectedPhenotype!.phenotype);
    const color = this.getBarColor(colorIndex);
    const totalCount = this.getTotalCount(data);

    return html`
      <div class="modal-overlay" @click=${() => this.closeModal()}></div>
      <div class="detail-modal">
        <button class="modal-close" @click=${() => this.closeModal()}>×</button>
        <div class="modal-header">
          <div class="modal-color-badge" style="background-color: ${color};"></div>
          <span>${this.selectedPhenotype.phenotype}</span>
        </div>
        <div class="modal-content">
          <p><strong>数量：</strong>${this.selectedPhenotype.count} 个体</p>
          <p><strong>百分比：</strong>${this.selectedPhenotype.percentage.toFixed(2)}%</p>
          <p><strong>占比：</strong>${this.selectedPhenotype.count} / ${totalCount}</p>
          <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <strong>统计信息：</strong>
          </p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
            <li>该表型在群体中的频率为 ${this.selectedPhenotype.percentage.toFixed(2)}%</li>
            <li>共有 ${this.selectedPhenotype.count} 个个体表现出该表型</li>
            <li>在 ${totalCount} 个总个体中排名第 ${this.getRank(this.selectedPhenotype, data)} 位</li>
          </ul>
          <p style="margin-top: 12px; font-size: 0.9rem; color: #6b7280;">
            💡 提示：表型分布反映了基因型与环境相互作用的结果
          </p>
        </div>
      </div>
    `;
  }

  private renderFilterControls(data: PhenotypeData[]) {
    return html`
      <div class="filter-controls">
        <div class="filter-title">筛选表型</div>
        <div class="filter-options">
          ${map(data, (item) => {
            const isSelected = this.selectedFilters.length === 0 || this.selectedFilters.includes(item.phenotype);
            return html`
              <label class="filter-checkbox ${isSelected ? 'active' : ''}">
                <input
                  type="checkbox"
                  .checked=${isSelected}
                  @change=${(e: Event) => this.handleFilterChange(item.phenotype, (e.target as HTMLInputElement).checked)}
                />
                <span class="filter-label">${item.phenotype}</span>
              </label>
            `;
          })}
        </div>
      </div>
    `;
  }

  private getFilteredData(data: PhenotypeData[]): PhenotypeData[] {
    if (this.selectedFilters.length === 0) {
      return data;
    }
    return data.filter(item => this.selectedFilters.includes(item.phenotype));
  }

  private handleFilterChange(phenotype: string, checked: boolean) {
    if (checked) {
      if (!this.selectedFilters.includes(phenotype)) {
        this.selectedFilters = [...this.selectedFilters, phenotype];
      }
    } else {
      this.selectedFilters = this.selectedFilters.filter(p => p !== phenotype);
    }
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'phenotype_distribution',
        action: 'filter_change',
        data: {
          selectedFilters: this.selectedFilters
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private getRank(item: PhenotypeData, data: PhenotypeData[]): number {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    return sorted.findIndex(d => d.phenotype === item.phenotype) + 1;
  }

  private closeModal() {
    this.selectedPhenotype = null;
    this.requestUpdate();
  }
}
