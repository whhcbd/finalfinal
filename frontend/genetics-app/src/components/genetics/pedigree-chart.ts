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
    this._generations = this.unwrapValue(value, 'array');
    this.requestUpdate('generations', oldValue);
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
      overflow-x: auto;
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

    .generation {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 20px;
      padding: 10px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .generation-label {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .generation-wrapper {
      position: relative;
    }

    .individual {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .individual:hover {
      transform: translateY(-2px);
    }

    .symbol {
      width: 40px;
      height: 40px;
      border: 3px solid;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s ease;
      position: relative;
    }

    .symbol.male {
      border-color: #3b82f6;
      background: #dbeafe;
      color: #1e40af;
    }

    .symbol.female {
      border-color: #ec4899;
      background: #fce7f3;
      color: #9f1239;
    }

    .symbol.normal {
      border-color: #10b981;
      background: #d1fae5;
      color: #065f46;
    }

    .symbol.affected {
      border-color: #ef4444;
      background: #fee2e2;
      color: #991b1b;
    }

    .symbol.carrier {
      border-color: #f59e0b;
      background: #fef3c7;
      color: #92400e;
      border-style: dashed;
    }

    .symbol:hover {
      border-width: 4px;
    }

    .connections {
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0;
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }

    .legend-symbol {
      width: 24px;
      height: 24px;
      border: 2px solid;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .legend-symbol.male {
      border-color: #3b82f6;
      background: #dbeafe;
      color: #1e40af;
    }

    .legend-symbol.female {
      border-color: #ec4899;
      background: #fce7f3;
      color: #9f1239;
    }

    .legend-symbol.normal {
      border-color: #10b981;
      background: #d1fae5;
      color: #065f46;
    }

    .legend-symbol.affected {
      border-color: #ef4444;
      background: #fee2e2;
      color: #991b1b;
    }

    .legend-symbol.carrier {
      border-color: #f59e0b;
      background: #fef3c7;
      color: #92400e;
      border-style: dashed;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #6b7280;
      flex: 1;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }
  `];

  private getAllIndividuals(): Individual[] {
    const individuals: Individual[] = [];
    if (!Array.isArray(this.generations)) {
      console.warn('PedigreeChart: generations is not an array:', this.generations);
      return individuals;
    }
    for (const gen of this.generations) {
      if (gen && Array.isArray(gen.individuals)) {
        individuals.push(...gen.individuals);
      }
    }
    return individuals;
  }

  private getPhenotypeStats(): { normal: number; affected: number; carriers: number } {
    const stats = { normal: 0, affected: 0, carriers: 0 };
    for (const individual of this.getAllIndividuals()) {
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

  private getGenderStats(): { male: number; female: number } {
    const stats = { male: 0, female: 0 };
    for (const individual of this.getAllIndividuals()) {
      if (individual.gender === 'male') {
        stats.male++;
      } else if (individual.gender === 'female') {
        stats.female++;
      }
    }
    return stats;
  }

  override render() {
    if (this.generations.length === 0) {
      return html`<div class="empty">暂无家系数据</div>`;
    }

    const phenotypeStats = this.getPhenotypeStats();
    const genderStats = this.getGenderStats();

    return html`
      <div class="container">
        <div class="title">${this.trait || '家系图'}</div>

        <div class="chart-container">
          ${map(this.generations, (gen, genIndex) => html`
            <div class="generation-wrapper">
              <div class="generation-label">第 ${genIndex + 1} 代</div>
              <div class="generation">
                ${map(gen.individuals, (ind) => html`
                  <div
                    class="individual"
                    @click=${() => this.handleIndividualClick(ind)}
                    aria-label="${ind.gender === 'male' ? '男性' : '女性'} - ${this.getPhenotypeLabel(ind.phenotype)}"
                    tabindex="0"
                  >
                    <div
                      class="symbol ${ind.gender} ${ind.phenotype}"
                      title="${this.getPhenotypeLabel(ind.phenotype)}"
                    >
                      ${ind.gender === 'male' ? '♂' : '♀'}
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>

        <div class="legend">
          <div class="legend-title">图例</div>
          <div class="legend-grid">
            ${map([
              { type: 'male', label: '男性' },
              { type: 'female', label: '女性' },
              { type: 'normal', label: '正常' },
              { type: 'affected', label: '患病' },
              { type: 'carrier', label: '携带者' }
            ], (item) => html`
              <div class="legend-item">
                <div class="legend-symbol ${item.type} ${item.type === 'male' || item.type === 'female' ? item.type : ''}">
                  ${item.type === 'male' ? '♂' : item.type === 'female' ? '♀' : ''}
                </div>
                <span class="legend-text">${item.label}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">总人数</div>
            <div class="stat-value">${this.getAllIndividuals().length}</div>
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
}
