/*
 PedigreeChart Component for Genetics Visualization
 家系图组件 - 用于展示家族遗传疾病传递模式
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface Individual {
  id: string;
  gender: 'male' | 'female';
  phenotype: 'normal' | 'affected' | 'carrier';
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

    .chart-container {
      background: #fafafa;
      padding: 40px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      position: relative;
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
      gap: 80px;
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

    .symbol:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

        <div class="chart-container">
          <!-- SVG for connection lines -->
          <svg class="connections" xmlns="http://www.w3.org/2000/svg">
            ${this.renderConnections(generations)}
          </svg>

          ${map(generations, (gen, genIndex) => html`
            <div class="generation-wrapper">
              <div class="generation-label">Generation ${this.toRoman(genIndex + 1)}</div>
              <div class="generation" id="gen-${genIndex}">
                ${map(gen.individuals, (ind, indIndex) => html`
                  <div
                    class="individual"
                    id="ind-${ind.id}"
                    data-gen="${genIndex}"
                    data-pos="${indIndex}"
                    @click=${() => this.handleIndividualClick(ind)}
                    aria-label="${ind.gender === 'male' ? '男性' : '女性'} - ${this.getPhenotypeLabel(ind.phenotype)}"
                    tabindex="0"
                  >
                    ${ind.label ? html`<div class="individual-label">${ind.label}</div>` : ''}
                    <div
                      class="symbol ${ind.gender} ${ind.phenotype}"
                      title="${this.getPhenotypeLabel(ind.phenotype)}"
                    ></div>
                    ${ind.age || ind.genotype ? html`
                      <div class="individual-info">
                        ${ind.age ? html`<div class="individual-age">${ind.age}</div>` : ''}
                        ${ind.genotype ? html`<div class="individual-genotype">${ind.genotype}</div>` : ''}
                      </div>
                    ` : ''}
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>

        <div class="legend">
          <div class="legend-title">图例 (Legend)</div>
          <div class="legend-grid">
            ${map([
              { type: 'male', phenotype: 'normal', label: '正常男性 (Male)' },
              { type: 'female', phenotype: 'normal', label: '正常女性 (Female)' },
              { type: 'male', phenotype: 'affected', label: '患病男性 (Affected Male)' },
              { type: 'female', phenotype: 'affected', label: '患病女性 (Affected Female)' },
              { type: 'female', phenotype: 'carrier', label: '携带者 (Carrier)' }
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
      </div>
    `;
  }

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
    this.dispatchEvent(new CustomEvent('individual-click', {
      detail: {
        id: individual.id,
        gender: individual.gender,
        phenotype: individual.phenotype,
        generation: individual.generation,
        parents: individual.parents
      },
      bubbles: true,
      composed: true
    }));
  }

  override updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // Redraw connections after DOM updates
    if (changedProperties.has('_generations')) {
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

  private drawConnections() {
    const generations = this.unwrapValue(this._generations, 'array');
    if (!generations || generations.length < 2) {
      console.log('[PedigreeChart] Not enough generations to draw connections');
      return;
    }

    const svg = this.shadowRoot?.querySelector('svg.connections') as SVGElement;
    if (!svg) {
      console.log('[PedigreeChart] SVG element not found');
      return;
    }

    // Clear existing lines
    svg.innerHTML = '';

    const allIndividuals = this.getAllIndividuals(generations);
    const individualMap = new Map<string, Individual>();
    allIndividuals.forEach(ind => individualMap.set(ind.id, ind));

    // Track which parent pairs we've already drawn mating lines for
    const drawnMatingLines = new Set<string>();

    let linesDrawn = 0;

    allIndividuals.forEach(child => {
      if (!child.parents) return;

      const fatherId = child.parents.father;
      const motherId = child.parents.mother;

      if (!fatherId || !motherId) return;

      const father = individualMap.get(fatherId);
      const mother = individualMap.get(motherId);

      if (!father || !mother) return;

      const fatherEl = this.shadowRoot?.getElementById(`ind-${fatherId}`);
      const motherEl = this.shadowRoot?.getElementById(`ind-${motherId}`);
      const childEl = this.shadowRoot?.getElementById(`ind-${child.id}`);

      if (!fatherEl || !motherEl || !childEl) {
        console.log(`[PedigreeChart] Missing elements: father=${!!fatherEl}, mother=${!!motherEl}, child=${!!childEl}`);
        return;
      }

      const container = this.shadowRoot?.querySelector('.chart-container');
      if (!container) {
        console.log('[PedigreeChart] Container not found');
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const fatherRect = fatherEl.getBoundingClientRect();
      const motherRect = motherEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();

      // Calculate center positions relative to container
      const fatherX = fatherRect.left - containerRect.left + fatherRect.width / 2;
      const fatherY = fatherRect.top - containerRect.top + fatherRect.height / 2;
      const motherX = motherRect.left - containerRect.left + motherRect.width / 2;
      const motherY = motherRect.top - containerRect.top + motherRect.height / 2;
      const childX = childRect.left - containerRect.left + childRect.width / 2;
      const childY = childRect.top - containerRect.top + childRect.height / 2;

      console.log(`[PedigreeChart] Drawing connection: father(${fatherX},${fatherY}) mother(${motherX},${motherY}) child(${childX},${childY})`);

      // Draw mating line between parents (only once per couple)
      const matingKey = `${fatherId}-${motherId}`;
      if (!drawnMatingLines.has(matingKey)) {
        const matingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        matingLine.setAttribute('class', 'mating-line');
        matingLine.setAttribute('x1', fatherX.toString());
        matingLine.setAttribute('y1', fatherY.toString());
        matingLine.setAttribute('x2', motherX.toString());
        matingLine.setAttribute('y2', motherY.toString());
        svg.appendChild(matingLine);
        drawnMatingLines.add(matingKey);
        linesDrawn++;
      }

      // Calculate midpoint of mating line
      const midX = (fatherX + motherX) / 2;
      const midY = (fatherY + motherY) / 2;
      const verticalY = midY + 40;

      // Vertical line from mating line
      const vertLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vertLine1.setAttribute('class', 'connection-line');
      vertLine1.setAttribute('x1', midX.toString());
      vertLine1.setAttribute('y1', midY.toString());
      vertLine1.setAttribute('x2', midX.toString());
      vertLine1.setAttribute('y2', verticalY.toString());
      svg.appendChild(vertLine1);
      linesDrawn++;

      // Horizontal line to child
      const horizLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      horizLine.setAttribute('class', 'connection-line');
      horizLine.setAttribute('x1', midX.toString());
      horizLine.setAttribute('y1', verticalY.toString());
      horizLine.setAttribute('x2', childX.toString());
      horizLine.setAttribute('y2', verticalY.toString());
      svg.appendChild(horizLine);
      linesDrawn++;

      // Vertical line to child
      const vertLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vertLine2.setAttribute('class', 'connection-line');
      vertLine2.setAttribute('x1', childX.toString());
      vertLine2.setAttribute('y1', verticalY.toString());
      vertLine2.setAttribute('x2', childX.toString());
      vertLine2.setAttribute('y2', childY.toString());
      svg.appendChild(vertLine2);
      linesDrawn++;
    });

    console.log(`[PedigreeChart] Drew ${linesDrawn} lines total`);
  }

  private renderConnections(generations: Generation[]) {
    // Return empty template - actual drawing happens in drawConnections()
    return html``;
  }
}
