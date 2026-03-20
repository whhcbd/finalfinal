/*
 PedigreeChart Component for Genetics Visualization
 家系图组件 - 用于展示家族遗传疾病传递模式
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

export interface Individual {
  id: string;
  gender: 'male' | 'female';
  phenotype: 'normal' | 'affected' | 'carrier' | 'uncertain';
  generation: number;
  position?: number;
  parents?: {
    father?: string;
    mother?: string;
  };
  children?: string[];
  label?: string;  // 个体编号（如 "1", "2", "I-1"）
  age?: string;    // 年龄信息
  genotype?: string; // 基因型信息（如 "WT/MT"）
  spouseId?: string; // 配偶ID，用于绘制婚配线
}

export interface Generation {
  individuals: Individual[];
}

@customElement('pedigree-chart')
export class PedigreeChart extends Root {
  private _generations: Generation[] = [];
  private _trait: string = '';
  private _interactive: boolean = true;

  @state()
  private selectedIndividual: Individual | null = null;

  @state()
  private highlightedPath: Set<string> = new Set();

  @state()
  private scale: number = 1;

  @state()
  private translateX: number = 0;

  @state()
  private translateY: number = 0;

  @state()
  private showGenotype: boolean = false;

  @state()
  private editMode: boolean = false;

  @state()
  private editingIndividual: Individual | null = null;

  // Stores user overrides: id -> { phenotype?, genotype? }
  @state()
  private editOverrides: Map<string, Partial<Individual>> = new Map();

  private isPanning: boolean = false;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private panStartTX: number = 0;
  private panStartTY: number = 0;

  @property({ type: Array })
  get generations(): Generation[] {
    return this._generations;
  }
  set generations(value: any) {
    const oldValue = this._generations;
    // Store the raw value (could be a path reference or literal)
    this._generations = value;
    this.requestUpdate('generations', oldValue);
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
      max-width: 1200px;
      margin: 0 auto;
      overflow-x: auto;
    }

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      text-align: center;
      margin-bottom: 24px;
    }

    .zoom-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      justify-content: flex-end;
    }

    .zoom-btn {
      width: 28px;
      height: 28px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
    }

    .zoom-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .zoom-reset {
      font-size: 0.85rem;
    }

    .zoom-label {
      font-size: 0.8rem;
      color: #6b7280;
      min-width: 40px;
      text-align: center;
    }

    .chart-container {
      background: #fafafa;
      padding: 40px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
      cursor: grab;
    }

    .chart-container.panning {
      cursor: grabbing;
    }

    .chart-inner {
      transform-origin: 0 0;
      position: relative;
      display: inline-block;
      min-width: 100%;
    }

    .generation-wrapper {
      position: relative;
      margin-bottom: 80px;
    }

    .generation-label {
      position: absolute;
      top: -30px;
      left: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      background: #fafafa;
      padding: 4px 12px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .generation {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      gap: var(--ind-gap, 80px);
      position: relative;
    }

    .individual {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
    }

    .symbol {
      width: 40px;
      height: 40px;
      border: 2px solid #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      position: relative;
      background: #ffffff;
      z-index: 1;
    }

    /* 男性：方形 */
    .symbol.male {
      border-radius: 0;
    }

    /* 女性：圆形 */
    .symbol.female {
      border-radius: 50%;
    }

    /* 正常：空心 */
    .symbol.normal {
      background: #ffffff;
    }

    /* 患病：实心 */
    .symbol.affected {
      background: #111827;
    }

    /* 携带者：中心圆点 */
    .symbol.carrier {
      background: #ffffff;
    }

    .symbol.carrier::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: #111827;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* 不确定/多种可能：对角线填充 */
    .symbol.uncertain {
      background: repeating-linear-gradient(
        45deg,
        #111827,
        #111827 2px,
        #ffffff 2px,
        #ffffff 6px
      );
    }

    .symbol:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .individual.selected .symbol {
      border-color: #3b82f6;
      border-width: 3px;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    /* Inheritance path highlighting */
    .individual.highlighted .symbol {
      border-color: #10b981;
      border-width: 3px;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }

    @keyframes pathPulse {
      0%, 100% {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.4);
      }
    }

    .individual.path-highlight .symbol {
      animation: pathPulse 1s ease-in-out;
    }

    /* Highlighted connection lines */
    .connection-line.highlighted,
    .mating-line.highlighted {
      stroke: #10b981;
      stroke-width: 3;
    }

    .individual-label {
      position: absolute;
      top: -20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #111827;
    }

    .individual-info {
      margin-top: 8px;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .individual-age {
      font-weight: 500;
      color: #111827;
    }

    .individual-genotype {
      font-family: monospace;
      color: #6b7280;
    }

    .genotype-badge {
      position: absolute;
      top: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
      font-family: monospace;
      font-size: 0.78rem;
      font-weight: 600;
      color: #111827;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 1px 6px;
      white-space: nowrap;
      z-index: 2;
      pointer-events: none;
    }

    .genotype-btn {
      font-size: 0.75rem;
      width: auto;
      padding: 0 8px;
    }

    .genotype-btn.active {
      background: #111827;
      color: #ffffff;
      border-color: #111827;
    }

    .edit-mode-btn {
      font-size: 0.75rem;
      width: auto;
      padding: 0 8px;
    }

    .edit-mode-btn.active {
      background: #111827;
      color: #ffffff;
      border-color: #111827;
    }

    .individual.edit-mode-hover:hover .symbol {
      outline: 2px dashed #6b7280;
      outline-offset: 3px;
    }

    .individual.has-override .symbol {
      outline: 2px solid #111827;
      outline-offset: 3px;
    }

    /* Edit selector popup */
    .edit-popup {
      position: fixed;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      padding: 16px;
      z-index: 2000;
      min-width: 220px;
      animation: fadeIn 0.15s ease-out;
    }

    .edit-popup-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .edit-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #374151;
      transition: background 0.15s;
    }

    .edit-option:hover {
      background: #f3f4f6;
    }

    .edit-option-symbol {
      width: 22px;
      height: 22px;
      border: 2px solid #111827;
      flex-shrink: 0;
      position: relative;
    }

    .edit-option-symbol.male { border-radius: 0; }
    .edit-option-symbol.female { border-radius: 50%; }
    .edit-option-symbol.affected { background: #111827; }
    .edit-option-symbol.normal { background: #ffffff; }
    .edit-option-symbol.carrier { background: #ffffff; }
    .edit-option-symbol.carrier::after {
      content: '';
      position: absolute;
      width: 6px; height: 6px;
      background: #111827;
      border-radius: 50%;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
    }

    .edit-reset-btn {
      margin-top: 10px;
      width: 100%;
      padding: 6px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #fafafa;
      cursor: pointer;
      font-size: 0.8rem;
      color: #6b7280;
    }

    .edit-reset-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    /* 连接线 */
    svg.connections {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .connection-line {
      stroke: #111827;
      stroke-width: 2;
      fill: none;
    }

    .mating-line {
      stroke: #111827;
      stroke-width: 2;
    }

    .legend {
      margin-top: 24px;
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .legend-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }

    .legend-symbol {
      width: 28px;
      height: 28px;
      border: 2px solid #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }

    .legend-symbol.male {
      border-radius: 0;
      background: #ffffff;
    }

    .legend-symbol.female {
      border-radius: 50%;
      background: #ffffff;
    }

    .legend-symbol.affected {
      background: #111827;
    }

    .legend-symbol.carrier {
      background: #ffffff;
    }

    .legend-symbol.carrier::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      background: #111827;
      border-radius: 50%;
    }

    .legend-symbol.uncertain {
      background: repeating-linear-gradient(
        45deg,
        #111827,
        #111827 2px,
        #ffffff 2px,
        #ffffff 6px
      );
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
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

    /* Detail panel styles */
    .detail-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 24px;
      min-width: 320px;
      max-width: 480px;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -48%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999;
      animation: fadeInOverlay 0.2s ease-out;
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .detail-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .detail-label {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.95rem;
      color: #111827;
      font-weight: 600;
    }

    .detail-symbol-preview {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-symbol {
      width: 36px;
      height: 36px;
      border: 2px solid #111827;
      position: relative;
    }

    .detail-symbol.male {
      border-radius: 0;
      background: #ffffff;
    }

    .detail-symbol.female {
      border-radius: 50%;
      background: #ffffff;
    }

    .detail-symbol.affected {
      background: #111827;
    }

    .detail-symbol.carrier {
      background: #ffffff;
    }

    .detail-symbol.carrier::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: #111827;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .detail-explanation {
      margin-top: 8px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .detail-explanation-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .detail-explanation-text {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.6;
    }
  `];

  private getAllIndividuals(generations: Generation[]): Individual[] {
    const individuals: Individual[] = [];
    if (!Array.isArray(generations)) {
      console.warn('PedigreeChart: generations is not an array:', generations);
      return individuals;
    }
    for (const gen of generations) {
      if (gen && Array.isArray(gen.individuals)) {
        individuals.push(...gen.individuals);
      }
    }
    return individuals;
  }

  private getPhenotypeStats(generations: Generation[]): { normal: number; affected: number; carriers: number } {
    const stats = { normal: 0, affected: 0, carriers: 0 };
    for (const individual of this.getAllIndividuals(generations)) {
      if (individual.phenotype === 'normal') {
        stats.normal++;
      } else if (individual.phenotype === 'affected') {
        stats.affected++;
      } else if (individual.phenotype === 'carrier') {
        stats.carriers++;
      }
    }
    return stats;
  }

  private getGenderStats(generations: Generation[]): { male: number; female: number } {
    const stats = { male: 0, female: 0 };
    for (const individual of this.getAllIndividuals(generations)) {
      if (individual.gender === 'male') {
        stats.male++;
      } else if (individual.gender === 'female') {
        stats.female++;
      }
    }
    return stats;
  }

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const generations = this.unwrapValue(this._generations, 'array');
    const traitName = this.unwrapValue(this._trait, 'string');

    if (!generations || generations.length === 0) {
      return html`<div class="empty">暂无家系数据</div>`;
    }

    const phenotypeStats = this.getPhenotypeStats(generations);
    const genderStats = this.getGenderStats(generations);

    return html`
      <div class="container">
        <div class="title">${traitName || '家系图'}</div>

        <div class="zoom-toolbar">
          <button class="zoom-btn" @click=${() => { this.scale = Math.min(3, this.scale * 1.2); requestAnimationFrame(() => this.drawConnections()); }} title="放大">＋</button>
          <span class="zoom-label">${Math.round(this.scale * 100)}%</span>
          <button class="zoom-btn" @click=${() => { this.scale = Math.max(0.3, this.scale * 0.8); requestAnimationFrame(() => this.drawConnections()); }} title="缩小">－</button>
          <button class="zoom-btn zoom-reset" @click=${() => { this.scale = 1; this.translateX = 0; this.translateY = 0; requestAnimationFrame(() => this.drawConnections()); }} title="重置视图">⊙</button>
          <button class="zoom-btn genotype-btn ${this.showGenotype ? 'active' : ''}" @click=${() => { this.showGenotype = !this.showGenotype; }} title="查看基因型">基因型</button>
          <button class="zoom-btn edit-mode-btn ${this.editMode ? 'active' : ''}" @click=${() => { this.editMode = !this.editMode; if (!this.editMode) { this.editingIndividual = null; } }} title="编辑成员属性">编辑</button>
          ${this.editOverrides.size > 0 ? html`<button class="zoom-btn edit-mode-btn" @click=${() => this.resetEdits()} title="重置所有编辑">重置</button>` : ''}
        </div>

        <div
          class="chart-container ${this.isPanning ? 'panning' : ''}"
          @wheel=${this.handleWheel}
          @mousedown=${this.handleMouseDown}
          @mousemove=${this.handleMouseMove}
          @mouseup=${this.handleMouseUp}
          @mouseleave=${this.handleMouseUp}
        >
          <div class="chart-inner" style="transform: translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale}); --ind-gap: ${this.computeIndGap(generations)}px">
          <!-- SVG for connection lines -->
          <svg class="connections" xmlns="http://www.w3.org/2000/svg"></svg>

          ${map(generations, (gen, genIndex) => html`
            <div class="generation-wrapper">
              <div class="generation-label">Generation ${this.toRoman(genIndex + 1)}</div>
              <div class="generation" id="gen-${genIndex}">
                ${map(gen.individuals, (ind, indIndex) => {
                  const eff = this.getEffectiveIndividual(ind);
                  return html`
                  <div
                    class="individual ${this.selectedIndividual?.id === ind.id ? 'selected' : ''} ${this.highlightedPath.has(ind.id) ? 'highlighted' : ''} ${this.editMode ? 'edit-mode-hover' : ''} ${this.editOverrides.has(ind.id) ? 'has-override' : ''}"
                    id="ind-${ind.id}"
                    data-gen="${genIndex}"
                    data-pos="${indIndex}"
                    @click=${(e: MouseEvent) => this.editMode ? this.handleEditClick(e, ind) : this.handleIndividualClick(ind)}
                    aria-label="${eff.gender === 'male' ? '男性' : '女性'} - ${this.getPhenotypeLabel(eff.phenotype)}"
                    tabindex="0"
                  >
                    ${eff.label ? html`<div class="individual-label">${eff.label}</div>` : ''}
                    <div
                      class="symbol ${eff.gender} ${eff.phenotype}"
                      title="${this.getPhenotypeLabel(eff.phenotype)}"
                    ></div>
                    ${eff.age ? html`
                      <div class="individual-info">
                        <div class="individual-age">${eff.age}</div>
                      </div>
                    ` : ''}
                    ${this.showGenotype ? html`
                      <div class="genotype-badge">${eff.genotype || '?'}</div>
                    ` : ''}
                  </div>
                `;
                })}
              </div>
            </div>
          `)}
          </div>
        </div>

        <div class="legend">
          <div class="legend-title">图例 (Legend)</div>
          <div class="legend-grid">
            ${map([
              { type: 'male', phenotype: 'normal', label: '正常男性 (Male)' },
              { type: 'female', phenotype: 'normal', label: '正常女性 (Female)' },
              { type: 'male', phenotype: 'affected', label: '患病男性 (Affected Male)' },
              { type: 'female', phenotype: 'affected', label: '患病女性 (Affected Female)' },
              { type: 'male', phenotype: 'carrier', label: '男性携带者 (Male Carrier)' },
              { type: 'female', phenotype: 'carrier', label: '女性携带者 (Female Carrier)' },
              { type: 'male', phenotype: 'uncertain', label: '男性不确定/多种可能 (Uncertain Male)' },
              { type: 'female', phenotype: 'uncertain', label: '女性不确定/多种可能 (Uncertain Female)' }
            ], (item) => html`
              <div class="legend-item">
                <div class="legend-symbol ${item.type} ${item.phenotype}"></div>
                <span class="legend-text">${item.label}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">总人数</div>
            <div class="stat-value">${this.getAllIndividuals(generations).length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">男性</div>
            <div class="stat-value">${genderStats.male}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">女性</div>
            <div class="stat-value">${genderStats.female}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">患病</div>
            <div class="stat-value">${phenotypeStats.affected}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">携带者</div>
            <div class="stat-value">${phenotypeStats.carriers}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">正常</div>
            <div class="stat-value">${phenotypeStats.normal}</div>
          </div>
        </div>

        ${this.selectedIndividual && this.interactive ? html`
          <div class="detail-overlay" @click=${this.handleCloseDetail}></div>
          <div class="detail-panel">
            <div class="detail-header">
              <div class="detail-title">个体详情</div>
              <button class="close-btn" @click=${this.handleCloseDetail} aria-label="关闭">×</button>
            </div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">编号</span>
                <span class="detail-value">${this.selectedIndividual.label || this.selectedIndividual.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">世代</span>
                <span class="detail-value">第 ${this.toRoman(this.selectedIndividual.generation + 1)} 代</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">性别</span>
                <div class="detail-symbol-preview">
                  <div class="detail-symbol ${this.selectedIndividual.gender} ${this.selectedIndividual.phenotype}"></div>
                  <span class="detail-value">${this.selectedIndividual.gender === 'male' ? '男性' : '女性'}</span>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">表型</span>
                <span class="detail-value">${this.getPhenotypeLabel(this.selectedIndividual.phenotype)}</span>
              </div>
              ${this.selectedIndividual.genotype ? html`
                <div class="detail-row">
                  <span class="detail-label">基因型</span>
                  <span class="detail-value" style="font-family: monospace;">${this.selectedIndividual.genotype}</span>
                </div>
              ` : ''}
              ${this.selectedIndividual.age ? html`
                <div class="detail-row">
                  <span class="detail-label">年龄</span>
                  <span class="detail-value">${this.selectedIndividual.age}</span>
                </div>
              ` : ''}
              <div class="detail-explanation">
                <div class="detail-explanation-title">遗传学解释</div>
                <div class="detail-explanation-text">${this.getIndividualExplanation(this.selectedIndividual)}</div>
              </div>
            </div>
          </div>
        ` : ''}

        ${this.editingIndividual ? html`
          <div class="detail-overlay" @click=${() => { this.editingIndividual = null; }}></div>
          <div class="edit-popup" style="top:50%;left:50%;transform:translate(-50%,-50%)">
            <div class="edit-popup-title">修改表型 — ${this.editingIndividual.label || ('第' + this.toRoman(this.editingIndividual.generation + 1) + '代')} ${this.editingIndividual.gender === 'male' ? '男' : '女'}</div>
            ${(['normal', 'affected', 'carrier', 'uncertain'] as const).map(p => html`
              <div class="edit-option" @click=${() => this.handleEditPhenotype(p)}>
                <div class="edit-option-symbol ${this.editingIndividual!.gender} ${p}"></div>
                <span>${this.getPhenotypeLabel(p)}</span>
              </div>
            `)}
            <button class="edit-reset-btn" @click=${() => {
              this.editOverrides.delete(this.editingIndividual!.id);
              this.editOverrides = new Map(this.editOverrides);
              this.editingIndividual = null;
              requestAnimationFrame(() => this.drawConnections());
            }}>恢复原始值</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Edit mode: inheritance detection ──────────────────────────────────

  private detectInheritanceMode(trait: string): 'AR' | 'AD' | 'XR' | 'XD' | 'Y' {
    const t = trait || '';
    if (/Y染色体|Y.?连锁/.test(t)) return 'Y';
    if (/X.*(显性|dominant)/i.test(t) || /显性.*X/i.test(t)) return 'XD';
    if (/X.*(隐性|recessive)/i.test(t) || /隐性.*X/i.test(t) || /伴X隐性/.test(t)) return 'XR';
    if (/常染色体.*显性|显性.*常染色体|autosomal dominant/i.test(t)) return 'AD';
    // default autosomal recessive
    return 'AR';
  }

  private getEffectiveIndividual(ind: Individual): Individual {
    const ov = this.editOverrides.get(ind.id);
    if (!ov) return ind;
    return { ...ind, ...ov };
  }

  // Infer genotype from phenotype + inheritance mode + gender
  private inferGenotype(phenotype: 'normal' | 'affected' | 'carrier' | 'uncertain', gender: 'male' | 'female', mode: 'AR' | 'AD' | 'XR' | 'XD' | 'Y'): string {
    switch (mode) {
      case 'AR':
        if (phenotype === 'affected') return 'aa';
        if (phenotype === 'carrier') return 'Aa';
        if (phenotype === 'uncertain') return 'AA、Aa或aa';
        return 'AA或Aa';
      case 'AD':
        if (phenotype === 'affected') return 'Aa或AA';
        if (phenotype === 'uncertain') return 'Aa、AA或aa';
        return 'aa';
      case 'XR':
        if (gender === 'male') {
          if (phenotype === 'affected') return 'X^aY';
          if (phenotype === 'uncertain') return 'X^AY或X^aY';
          return 'X^AY';
        } else {
          if (phenotype === 'affected') return 'X^aX^a';
          if (phenotype === 'carrier') return 'X^AX^a';
          if (phenotype === 'uncertain') return 'X^AX^A、X^AX^a或X^aX^a';
          return 'X^AX^A或X^AX^a';
        }
      case 'XD':
        if (gender === 'male') {
          if (phenotype === 'affected') return 'X^AY';
          if (phenotype === 'uncertain') return 'X^AY或X^aY';
          return 'X^aY';
        } else {
          if (phenotype === 'affected') return 'X^AX^a或X^AX^A';
          if (phenotype === 'uncertain') return 'X^AX^a、X^AX^A或X^aX^a';
          return 'X^aX^a';
        }
      case 'Y':
        if (gender === 'male') return phenotype === 'affected' ? 'X^aY' : 'XY';
        return 'XX';
    }
  }

  // Cascade recalculate descendants' genotypes/phenotypes when a member changes
  private recalcDescendants(changedId: string, allIndividuals: Individual[], mode: 'AR' | 'AD' | 'XR' | 'XD' | 'Y') {
    // Build children map
    const childrenOf = new Map<string, Individual[]>();
    for (const ind of allIndividuals) {
      if (ind.parents?.father) {
        if (!childrenOf.has(ind.parents.father)) childrenOf.set(ind.parents.father, []);
        childrenOf.get(ind.parents.father)!.push(ind);
      }
      if (ind.parents?.mother) {
        if (!childrenOf.has(ind.parents.mother)) childrenOf.set(ind.parents.mother, []);
        childrenOf.get(ind.parents.mother)!.push(ind);
      }
    }

    // BFS from changed individual downward
    const queue = [changedId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const pid = queue.shift()!;
      const children = childrenOf.get(pid) || [];
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        // Get effective parents
        const fatherId = child.parents?.father;
        const motherId = child.parents?.mother;
        const father = fatherId ? allIndividuals.find(i => i.id === fatherId) : null;
        const mother = motherId ? allIndividuals.find(i => i.id === motherId) : null;
        const effFather = father ? this.getEffectiveIndividual(father) : null;
        const effMother = mother ? this.getEffectiveIndividual(mother) : null;
        // Infer child genotype from parents
        const newGenotype = this.inferChildGenotype(effFather, effMother, child.gender, mode);
        if (newGenotype) {
          const existing = this.editOverrides.get(child.id) || {};
          this.editOverrides = new Map(this.editOverrides.set(child.id, { ...existing, genotype: newGenotype.genotype, phenotype: newGenotype.phenotype }));
        }
        queue.push(child.id);
      }
    }
  }

  private inferChildGenotype(father: Individual | null, mother: Individual | null, childGender: 'male' | 'female', mode: 'AR' | 'AD' | 'XR' | 'XD' | 'Y'): { genotype: string; phenotype: 'normal' | 'affected' | 'carrier' | 'uncertain' } | null {
    if (!father && !mother) return null;
    const fG = father?.genotype || this.inferGenotype(father?.phenotype || 'normal', 'male', mode);
    const mG = mother?.genotype || this.inferGenotype(mother?.phenotype || 'normal', 'female', mode);

    switch (mode) {
      case 'AR': {
        const fHasA = fG.includes('a');
        const mHasA = mG.includes('a');
        const fAff = father?.phenotype === 'affected';
        const mAff = mother?.phenotype === 'affected';
        if (fAff && mAff) return { genotype: 'aa', phenotype: 'affected' };
        if (fAff || mAff) {
          const otherCarrier = fHasA || mHasA;
          return otherCarrier
            ? { genotype: 'Aa或aa', phenotype: 'uncertain' }
            : { genotype: 'Aa', phenotype: 'carrier' };
        }
        if (fHasA && mHasA) return { genotype: 'AA、Aa或aa', phenotype: 'uncertain' };
        if (fHasA || mHasA) return { genotype: 'AA或Aa', phenotype: 'uncertain' };
        return { genotype: 'AA', phenotype: 'normal' };
      }
      case 'AD': {
        const fAff = father?.phenotype === 'affected';
        const mAff = mother?.phenotype === 'affected';
        if (!fAff && !mAff) return { genotype: 'aa', phenotype: 'normal' };
        return { genotype: 'Aa或AA', phenotype: 'affected' };
      }
      case 'XR': {
        const fAff = father?.phenotype === 'affected';
        const mAff = mother?.phenotype === 'affected';
        const mCarrier = mother?.phenotype === 'carrier';
        if (childGender === 'male') {
          if (mAff || mCarrier) return { genotype: 'X^AY或X^aY', phenotype: 'uncertain' };
          return { genotype: 'X^AY', phenotype: 'normal' };
        } else {
          if (fAff && (mAff || mCarrier)) return { genotype: 'X^AX^a或X^aX^a', phenotype: 'uncertain' };
          if (fAff) return { genotype: 'X^AX^a', phenotype: 'carrier' };
          if (mAff || mCarrier) return { genotype: 'X^AX^A或X^AX^a', phenotype: 'uncertain' };
          return { genotype: 'X^AX^A', phenotype: 'normal' };
        }
      }
      case 'XD': {
        const fAff = father?.phenotype === 'affected';
        const mAff = mother?.phenotype === 'affected';
        if (childGender === 'male') {
          return mAff ? { genotype: 'X^AY或X^aY', phenotype: 'uncertain' } : { genotype: 'X^aY', phenotype: 'normal' };
        } else {
          if (fAff) return { genotype: 'X^AX^a', phenotype: 'affected' };
          return mAff ? { genotype: 'X^AX^a或X^AX^A', phenotype: 'affected' } : { genotype: 'X^aX^a', phenotype: 'normal' };
        }
      }
      case 'Y':
        if (childGender === 'male') {
          return father?.phenotype === 'affected'
            ? { genotype: 'X^aY', phenotype: 'affected' }
            : { genotype: 'XY', phenotype: 'normal' };
        }
        return { genotype: 'XX', phenotype: 'normal' };
    }
  }

  private handleEditPhenotype(phenotype: 'normal' | 'affected' | 'carrier' | 'uncertain') {
    if (!this.editingIndividual) return;
    const generations = this.unwrapValue(this._generations, 'array') as Generation[];
    const trait = this.unwrapValue(this._trait, 'string') as string;
    const mode = this.detectInheritanceMode(trait);
    const allInds = this.getAllIndividuals(generations);
    const id = this.editingIndividual.id;
    const genotype = this.inferGenotype(phenotype, this.editingIndividual.gender, mode);
    this.editOverrides = new Map(this.editOverrides.set(id, { phenotype, genotype }));
    this.recalcDescendants(id, allInds, mode);
    this.editingIndividual = null;
    requestAnimationFrame(() => this.drawConnections());
  }

  private resetEdits() {
    this.editOverrides = new Map();
    this.editingIndividual = null;
    requestAnimationFrame(() => this.drawConnections());
  }

  // ─────────────────────────────────────────────────────────────────────────

  private toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  private getPhenotypeLabel(phenotype: string): string {
    const labels: Record<string, string> = {
      normal: '正常',
      affected: '患病',
      carrier: '携带者'
    };
    return labels[phenotype] || phenotype;
  }

  private handleIndividualClick(individual: Individual) {
    if (!this.interactive) return;

    this.selectedIndividual = individual;

    // Highlight inheritance path
    this.highlightInheritancePath(individual);

    // Dispatch action event to backend
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        type: 'action',
        action: {
          name: 'individual_click',
          context: {
            component: 'pedigree_chart',
            individualId: individual.id,
            gender: individual.gender,
            phenotype: individual.phenotype,
            generation: individual.generation,
            genotype: individual.genotype || '',
            label: individual.label || ''
          }
        },
        surfaceId: 'genetics_ui'
      },
      bubbles: true,
      composed: true
    }));
  }

  private highlightInheritancePath(individual: Individual) {
    const generations = this.unwrapValue(this._generations, 'array');
    if (!generations || generations.length === 0) return;

    // Build individual map
    const individualMap = new Map<string, Individual>();
    this.getAllIndividuals(generations).forEach(ind => individualMap.set(ind.id, ind));

    // Get path from ancestors to this individual
    const path = this.getInheritancePath(individual, individualMap);

    // Clear previous highlights
    this.highlightedPath.clear();

    // Add all individuals in path to highlighted set
    path.forEach(id => this.highlightedPath.add(id));

    // Trigger re-render
    this.requestUpdate();

    // Animate path highlighting with delay
    path.forEach((id, index) => {
      setTimeout(() => {
        const el = this.shadowRoot?.getElementById(`ind-${id}`);
        if (el) {
          el.classList.add('path-highlight');
          setTimeout(() => el.classList.remove('path-highlight'), 1000);
        }
      }, index * 300);
    });
  }

  private getInheritancePath(individual: Individual, individualMap: Map<string, Individual>): string[] {
    const path: string[] = [];
    const visited = new Set<string>();

    const traverse = (ind: Individual) => {
      if (visited.has(ind.id)) return;
      visited.add(ind.id);

      // Add parents first (ancestors before descendants)
      if (ind.parents) {
        if (ind.parents.father) {
          const father = individualMap.get(ind.parents.father);
          if (father) traverse(father);
        }
        if (ind.parents.mother) {
          const mother = individualMap.get(ind.parents.mother);
          if (mother) traverse(mother);
        }
      }

      // Then add current individual
      path.push(ind.id);
    };

    traverse(individual);
    return path;
  }

  private computeIndGap(generations: Generation[]): number {
    const maxInRow = Math.max(...generations.map(g => g.individuals.length), 1);
    // Shrink gap as population grows, minimum 40px
    return Math.max(40, Math.min(80, Math.floor(480 / maxInRow)));
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.min(3, Math.max(0.3, this.scale * delta));
    // Redraw connections after scale change
    requestAnimationFrame(() => this.drawConnections());
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    this.isPanning = true;
    this.panStartX = e.clientX;
    this.panStartY = e.clientY;
    this.panStartTX = this.translateX;
    this.panStartTY = this.translateY;
    (e.currentTarget as HTMLElement).classList.add('panning');
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isPanning) return;
    this.translateX = this.panStartTX + (e.clientX - this.panStartX);
    this.translateY = this.panStartTY + (e.clientY - this.panStartY);
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isPanning) return;
    this.isPanning = false;
    (e.currentTarget as HTMLElement).classList.remove('panning');
    requestAnimationFrame(() => this.drawConnections());
  }

  private handleCloseDetail() {
    this.selectedIndividual = null;
  }

  private handleEditClick(e: MouseEvent, ind: Individual) {
    e.stopPropagation();
    this.editingIndividual = ind;
  }

  private getIndividualExplanation(individual: Individual): string {
    const genderText = individual.gender === 'male' ? '男性' : '女性';
    const phenotypeText = this.getPhenotypeLabel(individual.phenotype);

    let explanation = `这是第 ${this.toRoman(individual.generation + 1)} 代的一位${genderText}个体，表型为${phenotypeText}。`;

    if (individual.genotype) {
      explanation += `\n\n基因型：${individual.genotype}`;
    }

    if (individual.phenotype === 'affected') {
      explanation += '\n\n该个体表现出遗传性状，可能从父母一方或双方遗传了致病基因。';
    } else if (individual.phenotype === 'carrier') {
      explanation += '\n\n该个体是携带者，自身不发病但携带致病基因，可能将其传递给后代。';
    } else {
      explanation += '\n\n该个体表型正常，但仍可能携带隐性致病基因。';
    }

    return explanation;
  }

  override updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // Redraw connections after DOM updates
    if (changedProperties.has('generations')) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        this.drawConnections();
      });
    }
  }

  override firstUpdated() {
    super.firstUpdated();
    // Draw connections on first render
    requestAnimationFrame(() => {
      this.drawConnections();
    });
  }

  private getElCenter(el: Element, containerRect: DOMRect): { x: number; y: number; top: number; bottom: number } {
    const r = el.getBoundingClientRect();
    const s = this.scale;
    return {
      x: (r.left - containerRect.left + r.width / 2) / s,
      y: (r.top - containerRect.top + r.height / 2) / s,
      top: (r.top - containerRect.top) / s,
      bottom: (r.top - containerRect.top + r.height) / s,
    };
  }

  private makeLine(cls: string, x1: number, y1: number, x2: number, y2: number): SVGLineElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', cls);
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    return line;
  }

  private drawConnections() {
    const generations = this.unwrapValue(this._generations, 'array');
    if (!generations || !generations.length) return;

    const svg = this.shadowRoot?.querySelector('svg.connections') as SVGElement;
    if (!svg) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const container = this.shadowRoot?.querySelector('.chart-inner');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const allIndividuals = this.getAllIndividuals(generations);
    const individualMap = new Map<string, Individual>();
    allIndividuals.forEach(ind => individualMap.set(ind.id, ind));

    // --- 1. Draw spouse lines from spouseId (covers childless couples) ---
    const drawnSpouseLines = new Set<string>();
    allIndividuals.forEach(ind => {
      if (!ind.spouseId) return;
      const key = [ind.id, ind.spouseId].sort().join('-');
      if (drawnSpouseLines.has(key)) return;
      drawnSpouseLines.add(key);
      const el1 = this.shadowRoot?.getElementById(`ind-${ind.id}`);
      const el2 = this.shadowRoot?.getElementById(`ind-${ind.spouseId}`);
      if (!el1 || !el2) return;
      const c1 = this.getElCenter(el1, containerRect);
      const c2 = this.getElCenter(el2, containerRect);
      const highlighted = this.isLineHighlighted(ind.id, ind.spouseId);
      svg.appendChild(this.makeLine(`mating-line${highlighted ? ' highlighted' : ''}`, c1.x, c1.y, c2.x, c2.y));
    });

    // --- 2. Group children by parent pair ---
    const coupleChildren = new Map<string, { fatherId: string; motherId: string; childIds: string[] }>();
    allIndividuals.forEach(child => {
      if (!child.parents?.father || !child.parents?.mother) return;
      const key = `${child.parents.father}-${child.parents.mother}`;
      if (!coupleChildren.has(key)) {
        coupleChildren.set(key, { fatherId: child.parents.father, motherId: child.parents.mother, childIds: [] });
      }
      coupleChildren.get(key)!.childIds.push(child.id);
    });

    coupleChildren.forEach(({ fatherId, motherId, childIds }) => {
      const fatherEl = this.shadowRoot?.getElementById(`ind-${fatherId}`);
      const motherEl = this.shadowRoot?.getElementById(`ind-${motherId}`);
      if (!fatherEl || !motherEl) return;

      const fc = this.getElCenter(fatherEl, containerRect);
      const mc = this.getElCenter(motherEl, containerRect);

      // Draw mating line if not already drawn via spouseId
      const spouseKey = [fatherId, motherId].sort().join('-');
      if (!drawnSpouseLines.has(spouseKey)) {
        const highlighted = this.isLineHighlighted(fatherId, motherId);
        svg.appendChild(this.makeLine(`mating-line${highlighted ? ' highlighted' : ''}`, fc.x, fc.y, mc.x, mc.y));
        drawnSpouseLines.add(spouseKey);
      }

      const midX = (fc.x + mc.x) / 2;
      const midY = (fc.y + mc.y) / 2;

      // Collect child elements and their centers
      const childCenters: { id: string; x: number; topY: number }[] = [];
      childIds.forEach(cid => {
        const el = this.shadowRoot?.getElementById(`ind-${cid}`);
        if (!el) return;
        const c = this.getElCenter(el, containerRect);
        childCenters.push({ id: cid, x: c.x, topY: c.top });
      });
      if (!childCenters.length) return;

      // Vertical drop from mating midpoint
      const dropY = midY + 30;
      svg.appendChild(this.makeLine('connection-line', midX, midY, midX, dropY));

      if (childCenters.length === 1) {
        // Single child: straight vertical line
        const cc = childCenters[0];
        const isHL = this.highlightedPath.has(cc.id) && (this.highlightedPath.has(fatherId) || this.highlightedPath.has(motherId));
        svg.appendChild(this.makeLine(`connection-line${isHL ? ' highlighted' : ''}`, midX, dropY, cc.x, dropY));
        svg.appendChild(this.makeLine(`connection-line${isHL ? ' highlighted' : ''}`, cc.x, dropY, cc.x, cc.topY));
      } else {
        // Multiple children: shared horizontal bar then individual drops
        const leftX = Math.min(...childCenters.map(c => c.x));
        const rightX = Math.max(...childCenters.map(c => c.x));
        // Horizontal bar from leftmost to rightmost child
        svg.appendChild(this.makeLine('connection-line', leftX, dropY, rightX, dropY));
        // If midX is outside the bar, draw a horizontal connector to the bar
        if (midX < leftX) svg.appendChild(this.makeLine('connection-line', midX, dropY, leftX, dropY));
        if (midX > rightX) svg.appendChild(this.makeLine('connection-line', rightX, dropY, midX, dropY));
        childCenters.forEach(cc => {
          const isHL = this.highlightedPath.has(cc.id) && (this.highlightedPath.has(fatherId) || this.highlightedPath.has(motherId));
          svg.appendChild(this.makeLine(`connection-line${isHL ? ' highlighted' : ''}`, cc.x, dropY, cc.x, cc.topY));
        });
      }
    });

    // Legacy: draw mating lines for couples without spouseId and no children recorded
    // (handled above via coupleChildren + spouseId paths)

  }

  private isLineHighlighted(id1: string, id2: string): boolean {
    return this.highlightedPath.has(id1) && this.highlightedPath.has(id2);
  }

  private renderConnections(generations: Generation[]) {
    // Return empty template - actual drawing happens in drawConnections()
    return html``;
  }
}
