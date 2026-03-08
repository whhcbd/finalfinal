/*
 PunnettSquare Component for Genetics Visualization
 孟德尔方格图组件 - 用于展示基因杂交后代的基因型和表型分布
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface GenotypeData {
  genotype: string;
  phenotype: string;
}

@customElement('punnett-square')
export class PunnettSquare extends Root {
  private _parent1Genotype: string = '';
  private _parent2Genotype: string = '';
  private _trait: string = '';
  private _showPhenotype: boolean = true;

  @property({ type: String })
  get parent1Genotype(): string {
    return this._parent1Genotype;
  }
  set parent1Genotype(value: any) {
    const oldValue = this._parent1Genotype;
    this._parent1Genotype = this.unwrapValue(value, 'string');
    this.requestUpdate('parent1Genotype', oldValue);
  }

  @property({ type: String })
  get parent2Genotype(): string {
    return this._parent2Genotype;
  }
  set parent2Genotype(value: any) {
    const oldValue = this._parent2Genotype;
    this._parent2Genotype = this.unwrapValue(value, 'string');
    this.requestUpdate('parent2Genotype', oldValue);
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

  @property({ type: Boolean })
  get showPhenotype(): boolean {
    return this._showPhenotype;
  }
  set showPhenotype(value: any) {
    const oldValue = this._showPhenotype;
    this._showPhenotype = this.unwrapValue(value, 'boolean');
    this.requestUpdate('showPhenotype', oldValue);
  }

  private unwrapValue(value: any, type: 'string' | 'boolean'): any {
    // Handle A2UI Proxy-wrapped values
    if (value && typeof value === 'object') {
      if (type === 'string' && 'literalString' in value) {
        return value.literalString;
      }
      if (type === 'boolean' && 'literalBoolean' in value) {
        return value.literalBoolean;
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
      font-family: 'Roboto', sans-serif;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .trait-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #202124;
      text-align: center;
      margin-bottom: 16px;
    }

    .parents {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 0 16px;
    }

    .parent {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 500;
      color: #5f6368;
    }

    .parent-label {
      color: #5f6368;
      font-size: 0.9rem;
    }

    .genotype {
      background: #e8f0fe;
      color: #1a73e8;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1.2rem;
      font-family: monospace;
    }

    .grid-container {
      display: grid;
      gap: 2px;
      background: #dadce0;
      border: 2px solid #dadce0;
      border-radius: 8px;
      overflow: hidden;
    }

    .grid-cell {
      background: #fff;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      position: relative;
    }

    .grid-cell.header {
      background: #f8f9fa;
      font-weight: 600;
      color: #5f6368;
      font-size: 0.9rem;
    }

    .grid-cell.empty {
      background: transparent;
    }

    .cell-genotype {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a73e8;
      font-family: monospace;
      margin-bottom: 4px;
      word-break: break-all;
    }

    .cell-phenotype {
      font-size: 0.85rem;
      color: #5f6368;
      text-align: center;
    }

    .cell-phenotype .dominant {
      color: #188038;
      font-weight: 600;
    }

    .cell-phenotype .recessive {
      color: #d93025;
      font-weight: 600;
    }

    .cell-phenotype .heterozygous {
      color: #f9ab00;
      font-weight: 600;
    }

    .offspring-section {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .offspring-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #202124;
      margin-bottom: 12px;
    }

    .offspring-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .offspring-item {
      background: #fff;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #1a73e8;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .offspring-genotype {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a73e8;
      margin-bottom: 4px;
    }

    .offspring-phenotype {
      font-size: 0.9rem;
      color: #5f6368;
    }

    .offspring-ratio {
      font-size: 0.85rem;
      color: #188038;
      font-weight: 500;
    }

    .phenotype-legend {
      margin-top: 16px;
      padding: 12px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #dadce0;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .legend-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .legend-indicator.dominant {
      background: #188038;
    }

    .legend-indicator.recessive {
      background: #d93025;
    }

    .legend-indicator.heterozygous {
      background: #f9ab00;
    }

    .legend-text {
      font-size: 0.9rem;
      color: #5f6368;
    }
    `
  ];

  private getGametes(genotype: string): string[] {
    if (!genotype || genotype.length === 0 || genotype.length % 2 !== 0) return [];

    // 提取所有基因对：AaBbCc → [[A,a], [B,b], [C,c]]
    const genePairs: string[][] = [];
    for (let i = 0; i < genotype.length; i += 2) {
      genePairs.push([genotype[i], genotype[i + 1]]);
    }

    // 生成所有可能的配子组合（笛卡尔积）
    const gametes = this.cartesianProduct(genePairs);
    return gametes.map(g => g.join(''));
  }

  // 计算笛卡尔积：[[A,a], [B,b]] → [[A,B], [A,b], [a,B], [a,b]]
  private cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(x => [x]);

    const [first, ...rest] = arrays;
    const restProduct = this.cartesianProduct(rest);
    const result: string[][] = [];

    for (const item of first) {
      for (const combo of restProduct) {
        result.push([item, ...combo]);
      }
    }

    return result;
  }

  private calculateOffspring(): GenotypeData[] {
    const gametes1 = this.getGametes(this.parent1Genotype);
    const gametes2 = this.getGametes(this.parent2Genotype);

    if (gametes1.length === 0 || gametes2.length === 0) {
      return [];
    }

    const offspring: GenotypeData[] = [];

    for (const g1 of gametes1) {
      for (const g2 of gametes2) {
        const genotype = this.combineGametes(g1, g2);
        const phenotype = this.determinePhenotype(genotype);
        offspring.push({ genotype, phenotype });
      }
    }

    return offspring;
  }

  private combineGametes(g1: string, g2: string): string {
    if (g1.length !== g2.length) return g1 + g2;

    // 对每个基因位点进行配对和排序
    let result = '';
    for (let i = 0; i < g1.length; i++) {
      const pair = [g1[i], g2[i]].sort((a, b) => {
        // 大写字母（显性）排在前面
        if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
        if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
        return a.localeCompare(b);
      });
      result += pair.join('');
    }
    return result;
  }

  private determinePhenotype(genotype: string): string {
    const upperCaseCount = (genotype.match(/[A-Z]/g) || []).length;
    const totalAlleles = genotype.length;

    if (upperCaseCount === totalAlleles) {
      return 'dominant';
    } else if (upperCaseCount === 0) {
      return 'recessive';
    } else {
      return 'heterozygous';
    }
  }

  private calculatePhenotypeRatios(offspring: GenotypeData[]): Map<string, number> {
    const ratios = new Map<string, number>();

    for (const item of offspring) {
      const count = ratios.get(item.phenotype) || 0;
      ratios.set(item.phenotype, count + 1);
    }

    return ratios;
  }

  override render() {
    const offspring = this.calculateOffspring();
    const gametes1 = this.getGametes(this.parent1Genotype);
    const gametes2 = this.getGametes(this.parent2Genotype);

    if (offspring.length === 0) {
      return html`<div class="empty">请输入有效的基因型（例如：Aa, AaBb, AaBbCc）</div>`;
    }

    // 动态计算网格大小
    const gridSize = gametes1.length;
    const gridStyle = `
      grid-template-columns: auto repeat(${gridSize}, 1fr);
      grid-template-rows: auto repeat(${gridSize}, 1fr);
    `;

    return html`
      <div class="container">
        <div class="trait-title">${this.trait || '孟德尔方格图'}</div>

        <div class="parents">
          <div class="parent">
            <span class="parent-label">亲本1:</span>
            <span class="genotype">${this.parent1Genotype}</span>
          </div>
          <div class="parent">
            <span class="parent-label">亲本2:</span>
            <span class="genotype">${this.parent2Genotype}</span>
          </div>
        </div>

        <div class="grid-container" style="${gridStyle}">
          <div class="grid-cell empty"></div>
          ${map(gametes1, (g) => html`
            <div class="grid-cell header">${g}</div>
          `)}
          ${map(gametes2, (g2) => html`
            <div class="grid-cell header">${g2}</div>
            ${map(gametes1, (g1) => {
              const genotype = this.combineGametes(g1, g2);
              const item = offspring.find(o => o.genotype === genotype);
              if (!item) return '';

              return html`
                <button
                  class="grid-cell"
                  @click=${() => this.handleCellClick(item)}
                  aria-label="${item.genotype} - ${this.getPhenotypeLabel(item.phenotype)}"
                  tabindex="0"
                >
                  <div class="cell-genotype">${item.genotype}</div>
                  ${this.showPhenotype ? html`
                    <div class="cell-phenotype ${item.phenotype}">
                      ${this.getPhenotypeLabel(item.phenotype)}
                    </div>
                  ` : ''}
                </button>
              `;
            })}
          `)}
        </div>

        ${this.showPhenotype ? html`
          <div class="offspring-section">
            <div class="offspring-title">后代表型比例</div>
            <div class="offspring-grid">
              ${map(Array.from(this.calculatePhenotypeRatios(offspring).entries()), ([phenotype, count]) => {
                const ratio = this.calculateRatio(count, offspring.length);
                return html`
                  <div class="offspring-item">
                    <div class="offspring-genotype">${phenotype}</div>
                    <div class="offspring-phenotype">${this.getPhenotypeLabel(phenotype)}</div>
                    <div class="offspring-ratio">${ratio} (${count}/${offspring.length})</div>
                  </div>
                `;
              })}
            </div>
          </div>

          <div class="phenotype-legend">
            ${map([
              { type: 'dominant', label: '显性性状' },
              { type: 'recessive', label: '隐性性状' },
              { type: 'heterozygous', label: '杂合性状' }
            ], (item) => html`
              <div class="legend-item">
                <div class="legend-indicator ${item.type}"></div>
                <span class="legend-text">${item.label}</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  private getPhenotypeLabel(phenotype: string): string {
    const labels: Record<string, string> = {
      dominant: '显性',
      recessive: '隐性',
      heterozygous: '杂合'
    };
    return labels[phenotype] || phenotype;
  }

  private calculateRatio(count: number, total: number): string {
    const ratio = (count / total * 100).toFixed(1);
    return `${ratio}%`;
  }

  private handleCellClick(item: GenotypeData) {
    this.dispatchEvent(new CustomEvent('cell-click', {
      detail: { genotype: item.genotype, phenotype: item.phenotype },
      bubbles: true,
      composed: true
    }));
  }
}
