/*
 CrossOverMap Component for Genetics Visualization
 交叉互换图谱组件 - 用于展示减数分裂中的交叉互换现象
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface Gene {
  name: string;
  position: number;
  color?: string;
}

export interface CrossoverPoint {
  position: number;
  label?: string;
}

@customElement('crossover-map')
export class CrossOverMap extends Root {
  private _chromosomeLength: number = 100;
  private _genes: Gene[] = [];
  private _crossoverPoints: CrossoverPoint[] = [];

  @property({ type: Number })
  get chromosomeLength(): number {
    return this._chromosomeLength;
  }
  set chromosomeLength(value: any) {
    const oldValue = this._chromosomeLength;
    this._chromosomeLength = this.unwrapValue(value, 'number');
    this.requestUpdate('chromosomeLength', oldValue);
  }

  @property({ type: Array })
  get genes(): Gene[] {
    return this._genes;
  }
  set genes(value: any) {
    const oldValue = this._genes;
    this._genes = this.unwrapValue(value, 'array');
    this.requestUpdate('genes', oldValue);
  }

  @property({ type: Array })
  get crossoverPoints(): CrossoverPoint[] {
    return this._crossoverPoints;
  }
  set crossoverPoints(value: any) {
    const oldValue = this._crossoverPoints;
    this._crossoverPoints = this.unwrapValue(value, 'array');
    this.requestUpdate('crossoverPoints', oldValue);
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
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16'
  ];

  private getGeneColor(index: number): string {
    if (this.genes[index]?.color) {
      return this.genes[index].color;
    }
    return CrossOverMap.DEFAULT_COLORS[index % CrossOverMap.DEFAULT_COLORS.length];
  }

  private getPositionPercentage(position: number): number {
    if (this.chromosomeLength === 0) return 0;
    return (position / this.chromosomeLength) * 100;
  }

  private isCrossoverPosition(position: number): boolean {
    return this.crossoverPoints.some(cp => cp.position === position);
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
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .chromosome-wrapper {
      position: relative;
      padding: 20px 0;
    }

    .chromosome {
      position: relative;
      height: 60px;
      background: #f3f4f6;
      border-radius: 30px;
      border: 2px solid #e5e7eb;
      margin-bottom: 40px;
    }

    .chromosome::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: #111827;
      border-radius: 50%;
    }

    .chromosome-label {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      background: #ffffff;
      padding: 4px 12px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .chromosome-length {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.9rem;
      color: #111827;
      font-weight: 600;
    }

    .gene {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .gene:hover {
      transform: translate(-50%, -50%) scale(1.15);
      z-index: 20;
    }

    .gene-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: all 0.2s ease;
    }

    .gene-marker:hover {
      border-width: 3px;
    }

    .crossover-point {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 30;
      cursor: pointer;
    }

    .crossover-marker {
      width: 36px;
      height: 36px;
      border: 3px solid #ef4444;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #ef4444;
      transition: all 0.2s ease;
    }

    .crossover-marker:hover {
      border-width: 4px;
      transform: scale(1.1);
    }

    .crossover-label {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      font-weight: 600;
      color: #ef4444;
      white-space: nowrap;
      background: #fee2e2;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #fecaca;
    }

    .gene-label {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      color: #6b7280;
      white-space: nowrap;
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
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
      padding: 4px 8px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }

    .legend-marker {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: #ffffff;
    }

    .legend-marker.gene {
      border-color: #3b82f6;
      background: #3b82f6;
    }

    .legend-marker.crossover {
      border-color: #ef4444;
      background: #fee2e2;
      border-width: 3px;
      color: #ef4444;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .stats {
      margin-top: 16px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      border: 1px solid #e5e7eb;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1rem;
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

  override render() {
    if (this.genes.length === 0) {
      return html`<div class="empty">暂无基因数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">交叉互换图谱</div>

        <div class="chart-container">
          <div class="chromosome-wrapper">
            <div class="chromosome-label">同源染色体</div>
            <div class="chromosome">
              ${map(this.genes, (gene, index) => html`
                <div
                  class="gene"
                  style="left: ${this.getPositionPercentage(gene.position)}%;"
                  @click=${() => this.handleGeneClick(gene)}
                  aria-label="${gene.name} - 位置 ${gene.position}"
                  tabindex="0"
                >
                  <div
                    class="gene-marker"
                    style="background-color: ${this.getGeneColor(index)};"
                  >
                    ${index + 1}
                  </div>
                  <div class="gene-label">${gene.name}</div>
                </div>
              `)}

              ${map(this.crossoverPoints, (cp, cpIndex) => html`
                <div
                  class="crossover-point"
                  style="left: ${this.getPositionPercentage(cp.position)}%;"
                  @click=${() => this.handleCrossoverClick(cp)}
                  aria-label="交叉互换点 ${cpIndex + 1}"
                  tabindex="0"
                >
                  <div class="crossover-marker">✕</div>
                  ${cp.label ? html`<div class="crossover-label">${cp.label}</div>` : ''}
                </div>
              `)}
            </div>
            <div class="chromosome-length">${this.chromosomeLength} cM</div>
          </div>

          <div class="legend">
            <div class="legend-title">图例</div>
            <div class="legend-grid">
              <div class="legend-item">
                <div class="legend-marker gene"></div>
                <span class="legend-text">基因位置</span>
              </div>
              <div class="legend-item">
                <div class="legend-marker crossover"></div>
                <span class="legend-text">交叉互换点</span>
              </div>
            </div>
          </div>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-label">染色体长度</div>
              <div class="stat-value">${this.chromosomeLength} cM</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">基因数量</div>
              <div class="stat-value">${this.genes.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">交叉点数</div>
              <div class="stat-value">${this.crossoverPoints.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">基因密度</div>
              <div class="stat-value">${this.calculateGeneDensity()}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private calculateGeneDensity(): string {
    if (this.chromosomeLength === 0) return '0.0';
    const density = (this.genes.length / this.chromosomeLength * 10).toFixed(1);
    return `${density} / 10 cM`;
  }

  private handleGeneClick(gene: Gene) {
    this.dispatchEvent(new CustomEvent('gene-click', {
      detail: {
        name: gene.name,
        position: gene.position,
        color: gene.color || this.getGeneColor(this.genes.indexOf(gene))
      },
      bubbles: true,
      composed: true
    }));
  }

  private handleCrossoverClick(point: CrossoverPoint) {
    this.dispatchEvent(new CustomEvent('crossover-click', {
      detail: {
        position: point.position,
        label: point.label
      },
      bubbles: true,
      composed: true
    }));
  }
}
