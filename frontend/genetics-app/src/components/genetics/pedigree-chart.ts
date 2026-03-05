/*
 PedigreeChart Component for Genetics Visualization
 家系图组件 - 用于展示家族遗传疾病传递模式
*/

import { LitElement, html, css } from 'lit';
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
export class PedigreeChart extends LitElement {
  @property({ type: Array }) generations: Generation[] = [];
  @property({ type: String }) trait: string = '';

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-family: 'Roboto', sans-serif;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      overflow-x: auto;
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

    .generation {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 20px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .generation-label {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      font-weight: 600;
      color: #5f6368;
      background: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      transform: scale(1.05);
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
      border-color: #1a73e8;
      background: #e8f0fe;
      color: #1a73e8;
    }

    .symbol.female {
      border-color: #d93025;
      background: #fce8e6;
      color: #d93025;
    }

    .symbol.normal {
      border-color: #188038;
      background: #e6f4ea;
      color: #188038;
    }

    .symbol.affected {
      border-color: #d93025;
      background: #ffebee;
      color: #d93025;
    }

    .symbol.carrier {
      border-color: #f9ab00;
      background: #fff8e1;
      color: #f9ab00;
      border-style: dashed;
    }

    .symbol:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
      padding: 6px;
      border-radius: 4px;
      background: #fff;
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
      border-color: #1a73e8;
      background: #e8f0fe;
      color: #1a73e8;
    }

    .legend-symbol.female {
      border-color: #d93025;
      background: #fce8e6;
      color: #d93025;
    }

    .legend-symbol.normal {
      border-color: #188038;
      background: #e6f4ea;
      color: #188038;
    }

    .legend-symbol.affected {
      border-color: #d93025;
      background: #ffebee;
      color: #d93025;
    }

    .legend-symbol.carrier {
      border-color: #f9ab00;
      background: #fff8e1;
      color: #f9ab00;
      border-style: dashed;
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
  `;

  private getAllIndividuals(): Individual[] {
    const individuals: Individual[] = [];
    for (const gen of this.generations) {
      individuals.push(...gen.individuals);
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
