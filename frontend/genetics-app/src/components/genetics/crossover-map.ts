/*
 CrossOverMap Component for Genetics Visualization
 交叉互换图谱组件 - 用于展示减数分裂中的交叉互换现象
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

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
  private _interactive: boolean = true;

  @property({ type: Number })
  get chromosomeLength(): number {
    return this._chromosomeLength;
  }
  set chromosomeLength(value: any) {
    const oldValue = this._chromosomeLength;
    // Store the raw value (could be a path reference or literal)
    this._chromosomeLength = value;
    this.requestUpdate('chromosomeLength', oldValue);
  }

  @property({ type: Array })
  get genes(): Gene[] {
    return this._genes;
  }
  set genes(value: any) {
    const oldValue = this._genes;
    // Store the raw value (could be a path reference or literal)
    this._genes = value;
    this.requestUpdate('genes', oldValue);
  }

  @property({ type: Array })
  get crossoverPoints(): CrossoverPoint[] {
    return this._crossoverPoints;
  }
  set crossoverPoints(value: any) {
    const oldValue = this._crossoverPoints;
    // Store the raw value (could be a path reference or literal)
    this._crossoverPoints = value;
    this.requestUpdate('crossoverPoints', oldValue);
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
  selectedGene: Gene | null = null;

  @property({ type: Boolean })
  crossoverAnimating: boolean = false;

  @property({ type: Number })
  crossoverPosition: number = 0;

  @property({ type: Boolean })
  crossoverDone: boolean = false;

  @property({ type: Number })
  crossoverSwapPosition: number = 0;

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'number' | 'array' | 'object'): any {
    if (value === null || value === undefined) {
      return type === 'string' ? '' :
             type === 'boolean' ? false :
             type === 'number' ? 0 :
             type === 'array' ? [] :
             type === 'object' ? {} : null;
    }

    // Handle A2UI data binding (path references)
    if (value && typeof value === 'object' && 'path' in value && value.path) {
      if (!this.processor || !this.component) {
        return type === 'string' ? '' :
               type === 'boolean' ? false :
               type === 'number' ? 0 :
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
      if (type === 'number' && 'literalNumber' in value) {
        return value.literalNumber;
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

  private getGeneColor(index: number, genes: Gene[]): string {
    if (genes[index]?.color) {
      return genes[index].color;
    }
    return CrossOverMap.DEFAULT_COLORS[index % CrossOverMap.DEFAULT_COLORS.length];
  }

  private getPositionPercentage(position: number, chromosomeLength: number): number {
    if (chromosomeLength === 0) return 0;
    return (position / chromosomeLength) * 100;
  }

  private isCrossoverPosition(position: number, crossoverPoints: CrossoverPoint[]): boolean {
    return crossoverPoints.some(cp => cp.position === position);
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
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .chromosome-wrapper {
      position: relative;
      padding: 20px 0 50px;
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

    .chromosome-label-bottom {
      position: relative;
      top: auto;
      bottom: auto;
      left: auto;
      transform: none;
      display: inline-block;
      margin-bottom: 6px;
      margin-top: 4px;
    }

    .chromosome.homolog {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .chromosome.homolog::before {
      background: #1d4ed8;
    }

    .gene-marker.homolog-marker {
      opacity: 0.75;
      border-style: dashed;
    }

    .homolog-spacer {
      position: relative;
      height: 32px;
      margin: 4px 0;
    }

    .crossover-bridge {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, #ef4444, #ef4444);
      transform: translateX(-50%);
      border-radius: 2px;
      animation: bridgeAppear 0.3s ease-out;
    }

    .crossover-bridge-static {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #f59e0b;
      transform: translateX(-50%);
      border-radius: 2px;
      opacity: 0.7;
    }

    .crossover-bridge-done {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, #10b981, #10b981);
      transform: translateX(-50%);
      border-radius: 2px;
      opacity: 0.9;
      box-shadow: 0 0 6px #10b98188;
    }

    @keyframes bridgeAppear {
      from { opacity: 0; transform: translateX(-50%) scaleY(0); }
      to   { opacity: 1; transform: translateX(-50%) scaleY(1); }
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

    .gene-marker.selected {
      border-width: 4px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      transform: scale(1.2);
    }

    @keyframes pulse-gene {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      50% {
        box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
      }
    }

    .gene.selected {
      animation: pulse-gene 1.5s infinite;
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
      min-width: 380px;
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
      border-radius: 50%;
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

    .crossover-controls {
      margin-top: 16px;
      padding: 16px;
      background: #fef3c7;
      border-radius: 8px;
      border: 1px solid #fbbf24;
    }

    .control-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 12px;
    }

    .control-button {
      width: 100%;
      padding: 10px 16px;
      background: #f59e0b;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .control-button:hover {
      background: #d97706;
    }

    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .crossover-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    }

    .crossover-line {
      position: absolute;
      width: 3px;
      height: 100%;
      background: #ef4444;
      opacity: 0;
      animation: crossoverFlash 2s ease-out;
    }

    @keyframes crossoverFlash {
      0% {
        opacity: 0;
        transform: scaleY(0);
      }
      20% {
        opacity: 1;
        transform: scaleY(1);
      }
      80% {
        opacity: 1;
        transform: scaleY(1);
      }
      100% {
        opacity: 0;
        transform: scaleY(1);
      }
    }

    .chromosome.animating {
      animation: chromosomeShake 0.5s ease-out;
    }

    @keyframes chromosomeShake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-4px);
      }
      75% {
        transform: translateX(4px);
      }
    }
  `];

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const chromosomeLength = this.unwrapValue(this.chromosomeLength, 'number');
    const genes = this.unwrapValue(this.genes, 'array');
    const crossoverPoints = this.unwrapValue(this.crossoverPoints, 'array');

    if (genes.length === 0) {
      return html`<div class="empty">暂无基因数据</div>`;
    }

    return html`
      <div class="container">
        <div class="title">交叉互换图谱</div>

        ${this._interactive ? this.renderCrossoverControls() : ''}

        <div class="chart-container">
          <div class="chromosome-wrapper">
            <div class="chromosome-label">同源染色体 I</div>
            <div class="chromosome ${this.crossoverAnimating ? 'animating' : ''}">
              ${map(genes, (gene, index) => {
                const posPercent = this.getPositionPercentage(gene.position, chromosomeLength);
                // 交换后：交叉点右侧的基因从同源染色体II获得片段（显示为 homolog 样式）
                const isSwapped = this.crossoverDone && posPercent > this.crossoverSwapPosition;
                const labelSuffix = isSwapped ? "'" : '';
                const markerClass = isSwapped ? 'homolog-marker' : '';
                return html`
                <div
                  class="gene ${this.selectedGene?.name === gene.name ? 'selected' : ''}"
                  style="left: ${posPercent}%; transition: background 0.5s;"
                  @click=${() => this.handleGeneClick(gene, index, genes)}
                  aria-label="${gene.name} - 位置 ${gene.position}"
                  tabindex="0"
                >
                  <div
                    class="gene-marker ${markerClass} ${this.selectedGene?.name === gene.name ? 'selected' : ''}"
                    style="background-color: ${this.getGeneColor(index, genes)};"
                  >
                    ${index + 1}
                  </div>
                  <div class="gene-label">${gene.name}${labelSuffix}</div>
                </div>
              `; })}

              ${map(crossoverPoints, (cp, cpIndex) => html`
                <div
                  class="crossover-point"
                  style="left: ${this.getPositionPercentage(cp.position, chromosomeLength)}%;"
                  @click=${() => this.handleCrossoverClick(cp)}
                  aria-label="交叉互换点 ${cpIndex + 1}"
                  tabindex="0"
                >
                  <div class="crossover-marker">✕</div>
                  ${cp.label ? html`<div class="crossover-label">${cp.label}</div>` : ''}
                </div>
              `)}

              ${this.crossoverAnimating ? html`
                <div class="crossover-animation">
                  <div class="crossover-line" style="left: ${this.crossoverPosition}%;"></div>
                </div>
              ` : ''}
            </div>

            <div class="homolog-spacer">
              ${this.crossoverAnimating ? html`
                <div class="crossover-bridge" style="left: ${this.crossoverPosition}%;"></div>
              ` : ''}
              ${this.crossoverDone ? html`
                <div class="crossover-bridge-done" style="left: ${this.crossoverSwapPosition}%;"></div>
              ` : ''}
              ${map(crossoverPoints, (cp) => html`
                <div class="crossover-bridge-static" style="left: ${this.getPositionPercentage(cp.position, chromosomeLength)}%;"></div>
              `)}
            </div>

            <div class="chromosome-label chromosome-label-bottom">同源染色体 II</div>
            <div class="chromosome homolog ${this.crossoverAnimating ? 'animating' : ''}">
              ${map(genes, (gene, index) => {
                const posPercent = this.getPositionPercentage(gene.position, chromosomeLength);
                // 交换后：交叉点右侧的基因从同源染色体I获得片段（去掉撇号，显示为主染色体样式）
                const isSwapped = this.crossoverDone && posPercent > this.crossoverSwapPosition;
                const labelSuffix = isSwapped ? '' : "'";
                const markerClass = isSwapped ? '' : 'homolog-marker';
                return html`
                <div
                  class="gene homolog-gene ${this.selectedGene?.name === gene.name ? 'selected' : ''}"
                  style="left: ${posPercent}%; transition: background 0.5s;"
                  @click=${() => this.handleGeneClick(gene, index, genes)}
                  aria-label="${gene.name} 等位基因 - 位置 ${gene.position}"
                  tabindex="0"
                >
                  <div
                    class="gene-marker ${markerClass} ${this.selectedGene?.name === gene.name ? 'selected' : ''}"
                    style="background-color: ${this.getGeneColor(index, genes)};"
                  >
                    ${index + 1}
                  </div>
                  <div class="gene-label">${gene.name}${labelSuffix}</div>
                </div>
              `; })}

              ${this.crossoverAnimating ? html`
                <div class="crossover-animation">
                  <div class="crossover-line" style="left: ${this.crossoverPosition}%;"></div>
                </div>
              ` : ''}
            </div>
            <div class="chromosome-length" title="cM = 厘摩（centimorgan），1 cM ≈ 1% 重组率">${chromosomeLength} cM（厘摩）</div>
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
              <div class="stat-value" title="cM = 厘摩（centimorgan），1 cM ≈ 1% 重组率">${chromosomeLength} cM（厘摩）</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">基因数量</div>
              <div class="stat-value">${genes.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">交叉点数</div>
              <div class="stat-value">${crossoverPoints.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">基因密度</div>
              <div class="stat-value">${this.calculateGeneDensity(genes, chromosomeLength)}</div>
            </div>
          </div>
        </div>

        ${this.selectedGene ? this.renderGeneDetailModal(genes, chromosomeLength) : ''}
      </div>
    `;
  }

  private calculateGeneDensity(genes: Gene[], chromosomeLength: number): string {
    if (chromosomeLength === 0) return '0.0';
    const density = (genes.length / chromosomeLength * 10).toFixed(1);
    return `${density} / 10 cM`;
  }

  private handleGeneClick(gene: Gene, index: number, genes: Gene[]) {
    if (!this._interactive) return;

    this.selectedGene = gene;
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'crossover_map',
        action: 'gene_click',
        data: {
          name: gene.name,
          position: gene.position,
          color: gene.color || this.getGeneColor(index, genes)
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private handleCrossoverClick(point: CrossoverPoint) {
    if (!this._interactive) return;

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'crossover_map',
        action: 'crossover_click',
        data: {
          position: point.position,
          label: point.label
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private renderGeneDetailModal(genes: Gene[], chromosomeLength: number) {
    if (!this.selectedGene) return '';

    const geneIndex = genes.findIndex(g => g.name === this.selectedGene!.name);
    const color = this.getGeneColor(geneIndex, genes);

    // 计算与其他基因的距离
    const distances = genes
      .filter(g => g.name !== this.selectedGene!.name)
      .map(g => ({
        name: g.name,
        distance: Math.abs(g.position - this.selectedGene!.position)
      }))
      .sort((a, b) => a.distance - b.distance);

    // 计算重组率（图距 = 重组率）
    const recombinationRates = distances.map(d => ({
      ...d,
      rate: (d.distance / chromosomeLength * 100).toFixed(1)
    }));

    return html`
      <div class="modal-overlay" @click=${() => this.closeModal()}></div>
      <div class="detail-modal">
        <button class="modal-close" @click=${() => this.closeModal()}>×</button>
        <div class="modal-header">
          <div class="modal-color-badge" style="background-color: ${color};"></div>
          <span>${this.selectedGene.name}</span>
        </div>
        <div class="modal-content">
          <p><strong>染色体位置：</strong>${this.selectedGene.position} cM</p>
          <p><strong>相对位置：</strong>${this.getPositionPercentage(this.selectedGene.position, chromosomeLength).toFixed(1)}%</p>

          <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <strong>与其他基因的距离：</strong>
          </p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
            ${distances.slice(0, 3).map((d, i) => html`
              <li>${d.name}: ${d.distance} cM (重组率 ${recombinationRates[i].rate}%)</li>
            `)}
          </ul>

          <p style="margin-top: 12px; font-size: 0.9rem; color: #6b7280;">
            💡 提示：图距（cM）表示两个基因间的遗传距离，1 cM = 1% 重组率
          </p>
        </div>
      </div>
    `;
  }

  private renderCrossoverControls() {
    return html`
      <div class="crossover-controls">
        <div class="control-title">交叉互换模拟</div>
        <button
          class="control-button"
          @click=${() => this.animateCrossover()}
          ?disabled=${this.crossoverAnimating}
        >
          ${this.crossoverAnimating ? '动画播放中...' : '播放交叉互换动画'}
        </button>
      </div>
    `;
  }

  private async animateCrossover() {
    if (this.crossoverAnimating) return;

    const chromosomeLength = this.unwrapValue(this.chromosomeLength, 'number');

    // 每次重新播放时重置交换状态
    this.crossoverDone = false;
    this.crossoverSwapPosition = 0;

    // 随机选择一个交叉位置（在染色体中间区域）
    const position = 30 + Math.random() * 40; // 30%-70% 之间
    this.crossoverPosition = position;
    this.crossoverAnimating = true;
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'crossover_map',
        action: 'start_crossover_animation',
        data: {
          position: (position / 100) * chromosomeLength
        }
      },
      bubbles: true,
      composed: true
    }));

    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 动画完成后，标记交换已发生
    this.crossoverSwapPosition = position;
    this.crossoverDone = true;
    this.crossoverAnimating = false;
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'crossover_map',
        action: 'crossover_animation_complete',
        data: {
          position: (position / 100) * chromosomeLength
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private closeModal() {
    this.selectedGene = null;
    this.requestUpdate();
  }
}
