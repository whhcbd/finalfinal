/*
 PunnettSquare Component for Genetics Visualization
 孟德尔方格图组件 - 用于展示基因杂交后代的基因型和表型分布
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

export interface GenotypeData {
  genotype: string;
  phenotype: string;
}

export interface TraitDefinition {
  name: string;
  dominantTrait: string;
  recessiveTrait: string;
  incompleteDominance?: boolean;
  intermediateTrait?: string;
}

export interface LinkageInfo {
  isLinked: boolean;
  recombinationFrequency?: number;
}

@customElement('punnett-square')
export class PunnettSquare extends Root {
  private _parent1Genotype: string = '';
  private _parent2Genotype: string = '';
  private _trait: string = '';
  private _showPhenotype: boolean = true;
  private _traitDefinitions: TraitDefinition[] = [];
  private _linkageInfo: LinkageInfo = { isLinked: false };
  private _observedData: number[] = [];
  private _interactive: boolean = true;

  // 交互状态
  @state()
  private selectedCell: { row: number; col: number; genotype: string; phenotype: string } | null = null;

  // 模拟器状态
  @state()
  private simulationResults: Map<string, number> = new Map();

  @state()
  private simulationCount: number = 0;

  @state()
  private isSimulating: boolean = false;

  @property({ type: String })
  get parent1Genotype(): string {
    return this._parent1Genotype;
  }
  set parent1Genotype(value: any) {
    const oldValue = this._parent1Genotype;
    // Store the raw value (could be a path reference or literal)
    this._parent1Genotype = value;
    this.requestUpdate('parent1Genotype', oldValue);
  }

  @property({ type: String })
  get parent2Genotype(): string {
    return this._parent2Genotype;
  }
  set parent2Genotype(value: any) {
    const oldValue = this._parent2Genotype;
    // Store the raw value (could be a path reference or literal)
    this._parent2Genotype = value;
    this.requestUpdate('parent2Genotype', oldValue);
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
  get showPhenotype(): boolean {
    return this._showPhenotype;
  }
  set showPhenotype(value: any) {
    const oldValue = this._showPhenotype;
    // Store the raw value (could be a path reference or literal)
    this._showPhenotype = value;
    this.requestUpdate('showPhenotype', oldValue);
  }

  @property({ type: Array })
  get traitDefinitions(): TraitDefinition[] {
    return this._traitDefinitions;
  }
  set traitDefinitions(value: any) {
    const oldValue = this._traitDefinitions;
    // Store the raw value (could be a path reference or literal)
    this._traitDefinitions = value;
    this.requestUpdate('traitDefinitions', oldValue);
  }

  @property({ type: Object })
  get linkageInfo(): LinkageInfo {
    return this._linkageInfo;
  }
  set linkageInfo(value: any) {
    const oldValue = this._linkageInfo;
    this._linkageInfo = this.unwrapValue(value, 'object');
    this.requestUpdate('linkageInfo', oldValue);
  }

  @property({ type: Array })
  get observedData(): number[] {
    return this._observedData;
  }
  set observedData(value: any) {
    const oldValue = this._observedData;
    this._observedData = this.unwrapValue(value, 'array');
    this.requestUpdate('observedData', oldValue);
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
      max-width: 800px;
      margin: 0 auto;
    }

    .trait-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
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
      color: #6b7280;
    }

    .parent-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .genotype {
      background: #f3f4f6;
      color: #111827;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 1.2rem;
      font-family: monospace;
      border: 1px solid #e5e7eb;
    }

    .grid-container {
      display: grid;
      gap: 1px;
      background: #e5e7eb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .grid-cell {
      background: #ffffff;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      position: relative;
      transition: all 0.2s;
      border: 2px solid transparent;
      cursor: pointer;
    }

    .grid-cell:hover:not(.header):not(.empty) {
      background: #fafafa;
    }

    .grid-cell.selected {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .grid-cell.header {
      background: #f9fafb;
      font-weight: 600;
      color: #6b7280;
      font-size: 0.9rem;
      cursor: default;
    }

    .grid-cell.empty {
      background: transparent;
      cursor: default;
    }

    .cell-genotype {
      font-size: 1.3rem;
      font-weight: 700;
      color: #111827;
      font-family: monospace;
      margin-bottom: 4px;
      word-break: break-all;
    }

    .cell-phenotype {
      font-size: 0.85rem;
      color: #6b7280;
      text-align: center;
    }

    .cell-phenotype .dominant {
      color: #10b981;
      font-weight: 600;
    }

    .cell-phenotype .recessive {
      color: #ef4444;
      font-weight: 600;
    }

    .cell-phenotype .heterozygous {
      color: #f59e0b;
      font-weight: 600;
    }

    .offspring-section {
      margin-top: 24px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .offspring-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .offspring-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .offspring-item {
      background: #ffffff;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #111827;
      border: 1px solid #e5e7eb;
    }

    .offspring-genotype {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .offspring-phenotype {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .offspring-ratio {
      font-size: 0.85rem;
      color: #111827;
      font-weight: 500;
    }

    .phenotype-legend {
      margin-top: 16px;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
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
      background: #10b981;
    }

    .legend-indicator.recessive {
      background: #ef4444;
    }

    .legend-indicator.heterozygous {
      background: #f59e0b;
    }

    .legend-text {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .cell-phenotype .incomplete {
      color: #8b5cf6;
      font-weight: 600;
    }

    .legend-indicator.incomplete {
      background: #8b5cf6;
    }

    .warning-box {
      margin-top: 16px;
      padding: 12px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
    }

    .warning-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }

    .warning-text {
      font-size: 0.85rem;
      color: #78350f;
      line-height: 1.5;
    }

    .chi-square-section {
      margin-top: 16px;
      padding: 16px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .chi-square-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .chi-square-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    .chi-square-table th,
    .chi-square-table td {
      padding: 8px;
      text-align: center;
      border: 1px solid #e5e7eb;
      font-size: 0.85rem;
    }

    .chi-square-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #6b7280;
    }

    .chi-square-result {
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .chi-square-value {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .chi-square-conclusion {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .chi-square-conclusion.accept {
      color: #10b981;
      font-weight: 600;
    }

    .chi-square-conclusion.reject {
      color: #ef4444;
      font-weight: 600;
    }

    .trait-names {
      margin-top: 16px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }

    .trait-names-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 8px;
    }

    .trait-name-item {
      font-size: 0.85rem;
      color: #15803d;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trait-name-item strong {
      font-family: monospace;
      background: #dcfce7;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* 交互式输入样式 */
    .input-section {
      margin-bottom: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .input-row {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }

    .input-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
    }

    .input-field {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      font-family: monospace;
      font-weight: 600;
      transition: border-color 0.2s;
    }

    .input-field:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .action-button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-button.primary {
      background: #3b82f6;
      color: white;
    }

    .action-button.primary:hover {
      background: #2563eb;
    }

    .action-button.secondary {
      background: #e5e7eb;
      color: #374151;
    }

    .action-button.secondary:hover {
      background: #d1d5db;
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 详情面板样式 */
    .detail-panel {
      margin-top: 16px;
      padding: 16px;
      background: #eff6ff;
      border-radius: 8px;
      border: 2px solid #3b82f6;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .detail-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .close-button {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .close-button:hover {
      background: #dbeafe;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
    }

    .detail-label {
      font-weight: 600;
      color: #1e40af;
      min-width: 80px;
    }

    .detail-value {
      color: #111827;
      font-family: monospace;
      background: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }

    .detail-explanation {
      margin-top: 8px;
      padding: 12px;
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      font-size: 0.9rem;
      color: #374151;
      line-height: 1.6;
    }

    /* 模拟器样式 */
    .simulation-section {
      margin-top: 24px;
      padding: 16px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #bbf7d0;
    }

    .simulation-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 12px;
    }

    .simulation-controls {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .simulation-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #166534;
    }

    .simulation-select {
      padding: 8px 12px;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      background: #ffffff;
      color: #166534;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .simulation-results {
      margin-top: 16px;
      padding: 16px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #bbf7d0;
    }

    .results-title {
      font-size: 1rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 12px;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .result-item {
      padding: 12px;
      background: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }

    .result-phenotype {
      font-size: 1rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 8px;
    }

    .result-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .stat-label {
      color: #15803d;
      font-weight: 500;
    }

    .stat-value {
      color: #166534;
      font-family: monospace;
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

  private calculateOffspring(parent1?: string, parent2?: string): GenotypeData[] {
    const p1 = parent1 || this.parent1Genotype;
    const p2 = parent2 || this.parent2Genotype;

    const gametes1 = this.getGametes(p1);
    const gametes2 = this.getGametes(p2);

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
    // 检查是否有性状定义
    if (this.traitDefinitions.length > 0) {
      return this.determinePhenotypeWithTraits(genotype);
    }

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

  private determinePhenotypeWithTraits(genotype: string): string {
    // 按基因位点分组
    const genePairs: string[] = [];
    for (let i = 0; i < genotype.length; i += 2) {
      genePairs.push(genotype.substring(i, i + 2));
    }

    // 构建表型描述（多基因组合）
    const phenotypeParts: string[] = [];

    for (let i = 0; i < genePairs.length && i < this.traitDefinitions.length; i++) {
      const pair = genePairs[i];
      const trait = this.traitDefinitions[i];
      const upperCount = (pair.match(/[A-Z]/g) || []).length;

      if (trait.incompleteDominance) {
        // 不完全显性
        if (upperCount === 2) {
          phenotypeParts.push(trait.dominantTrait);
        } else if (upperCount === 1) {
          phenotypeParts.push(trait.intermediateTrait || '中间型');
        } else {
          phenotypeParts.push(trait.recessiveTrait);
        }
      } else {
        // 完全显性
        if (upperCount >= 1) {
          phenotypeParts.push(trait.dominantTrait);
        } else {
          phenotypeParts.push(trait.recessiveTrait);
        }
      }
    }

    return phenotypeParts.join('-');
  }

  private calculatePhenotypeRatios(offspring: GenotypeData[]): Map<string, number> {
    const ratios = new Map<string, number>();

    for (const item of offspring) {
      const count = ratios.get(item.phenotype) || 0;
      ratios.set(item.phenotype, count + 1);
    }

    return ratios;
  }

  private calculateChiSquare(offspring: GenotypeData[]): { value: number; pValue: number; accept: boolean } | null {
    if (this.observedData.length === 0) return null;

    const phenotypeRatios = this.calculatePhenotypeRatios(offspring);
    const phenotypes = Array.from(phenotypeRatios.keys());

    if (this.observedData.length !== phenotypes.length) return null;

    const total = offspring.length;
    let chiSquare = 0;

    phenotypes.forEach((phenotype, index) => {
      const expected = phenotypeRatios.get(phenotype) || 0;
      const observed = this.observedData[index] || 0;

      if (expected > 0) {
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }
    });

    // 自由度 = 类别数 - 1
    const df = phenotypes.length - 1;

    // 简化的 p 值判断（临界值 3.841 对应 df=1, p=0.05）
    const criticalValue = df === 1 ? 3.841 : df === 2 ? 5.991 : df === 3 ? 7.815 : 9.488;
    const accept = chiSquare < criticalValue;

    return {
      value: chiSquare,
      pValue: 0.05,
      accept
    };
  }

  private getPhenotypeDisplayName(phenotype: string, traitDefs?: TraitDefinition[]): string {
    // 如果表型已经是具体名称（包含"-"或中文），直接返回
    if (phenotype.includes('-') || /[\u4e00-\u9fa5]/.test(phenotype)) {
      return phenotype;
    }

    if (!traitDefs || traitDefs.length === 0) {
      return this.getPhenotypeLabel(phenotype);
    }

    // 使用自定义性状名称
    const trait = traitDefs[0];
    if (!trait) {
      return this.getPhenotypeLabel(phenotype);
    }
    if (phenotype === 'dominant') return trait.dominantTrait;
    if (phenotype === 'recessive') return trait.recessiveTrait;
    if (phenotype === 'incomplete' && trait.intermediateTrait) return trait.intermediateTrait;
    if (phenotype === 'heterozygous') return trait.dominantTrait;

    return this.getPhenotypeLabel(phenotype);
  }

  override render() {
    // Unwrap values at render time (when dataModel is ready)
    const parent1 = this.unwrapValue(this.parent1Genotype, 'string');
    const parent2 = this.unwrapValue(this.parent2Genotype, 'string');
    const traitName = this.unwrapValue(this.trait, 'string');
    const showPheno = this.unwrapValue(this.showPhenotype, 'boolean');
    const traitDefs = this.unwrapValue(this.traitDefinitions, 'array');

    const offspring = this.calculateOffspring(parent1, parent2);
    const gametes1 = this.getGametes(parent1);
    const gametes2 = this.getGametes(parent2);

    if (offspring.length === 0) {
      return html`<div class="empty">请输入有效的基因型（例如：Aa, AaBb, AaBbCc）</div>`;
    }

    // 动态计算网格大小
    const gridSize = gametes1.length;
    const gridStyle = `
      grid-template-columns: auto repeat(${gridSize}, 1fr);
      grid-template-rows: auto repeat(${gridSize}, 1fr);
    `;

    const chiSquareResult = this.calculateChiSquare(offspring);

    return html`
      <div class="container">
        <div class="trait-title">${traitName || '孟德尔方格图'}</div>

        ${traitDefs && traitDefs.length > 0 ? html`
          <div class="trait-names">
            <div class="trait-names-title">性状定义</div>
            ${map(traitDefs, (trait, index) => html`
              <div class="trait-name-item">
                <strong>${String.fromCharCode(65 + index)}${String.fromCharCode(65 + index)}</strong>
                <span>${trait.dominantTrait}</span>
                ${trait.incompleteDominance && trait.intermediateTrait ? html`
                  <span>|</span>
                  <strong>${String.fromCharCode(65 + index)}${String.fromCharCode(97 + index)}</strong>
                  <span>${trait.intermediateTrait}</span>
                ` : ''}
                <span>|</span>
                <strong>${String.fromCharCode(97 + index)}${String.fromCharCode(97 + index)}</strong>
                <span>${trait.recessiveTrait}</span>
              </div>
            `)}
          </div>
        ` : ''}

        ${this.linkageInfo.isLinked ? html`
          <div class="warning-box">
            <div class="warning-title">⚠️ 连锁遗传提示</div>
            <div class="warning-text">
              这些基因位于同一染色体上，不遵循自由组合定律。
              ${this.linkageInfo.recombinationFrequency ? html`
                重组频率约为 ${this.linkageInfo.recombinationFrequency}%。
                实际后代比例可能偏离理论预测。
              ` : ''}
            </div>
          </div>
        ` : ''}

        <div class="parents">
          <div class="parent">
            <span class="parent-label">亲本1:</span>
            <span class="genotype">${parent1}</span>
          </div>
          <div class="parent">
            <span class="parent-label">亲本2:</span>
            <span class="genotype">${parent2}</span>
          </div>
        </div>

        <div class="grid-container" style="${gridStyle}">
          <div class="grid-cell empty"></div>
          ${map(gametes1, (g) => html`
            <div class="grid-cell header">${g}</div>
          `)}
          ${map(gametes2, (g2, rowIndex) => html`
            <div class="grid-cell header">${g2}</div>
            ${map(gametes1, (g1, colIndex) => {
              const genotype = this.combineGametes(g1, g2);
              const item = offspring.find(o => o.genotype === genotype);
              if (!item) return '';

              const isSelected = this.selectedCell?.row === rowIndex && this.selectedCell?.col === colIndex;

              return html`
                <button
                  class="grid-cell ${isSelected ? 'selected' : ''}"
                  @click=${() => this.handleCellClick(item, rowIndex, colIndex)}
                  aria-label="${item.genotype} - ${this.getPhenotypeDisplayName(item.phenotype, traitDefs)}"
                  tabindex="0"
                >
                  <div class="cell-genotype">${item.genotype}</div>
                  ${showPheno ? html`
                    <div class="cell-phenotype ${item.phenotype}">
                      ${this.getPhenotypeDisplayName(item.phenotype, traitDefs)}
                    </div>
                  ` : ''}
                </button>
              `;
            })}
          `)}
        </div>

        ${this.interactive ? html`
          <div class="simulation-section">
            <div class="simulation-title">随机受精模拟器</div>
            <div class="simulation-controls">
              <div class="simulation-info">
                <span class="info-label">模拟次数:</span>
                <select class="simulation-select" @change=${this.handleSimulationCountChange}>
                  <option value="100">100 次</option>
                  <option value="1000" selected>1000 次</option>
                  <option value="10000">10000 次</option>
                </select>
              </div>
              <button
                class="action-button primary"
                @click=${this.handleSimulate}
                ?disabled=${this.isSimulating}
              >
                ${this.isSimulating ? '模拟中...' : '开始模拟'}
              </button>
              <button
                class="action-button secondary"
                @click=${this.handleResetSimulation}
                ?disabled=${this.isSimulating || this.simulationResults.size === 0}
              >
                重置
              </button>
            </div>
            ${this.simulationResults.size > 0 ? html`
              <div class="simulation-results">
                <div class="results-title">模拟结果 (共 ${this.simulationCount} 次)</div>
                <div class="results-grid">
                  ${map(Array.from(this.simulationResults.entries()), ([phenotype, count]) => {
                    const percentage = (count / this.simulationCount * 100).toFixed(2);
                    const expectedRatio = this.getExpectedRatio(phenotype, offspring);
                    return html`
                      <div class="result-item">
                        <div class="result-phenotype">${this.getPhenotypeDisplayName(phenotype, traitDefs)}</div>
                        <div class="result-stats">
                          <div class="stat-row">
                            <span class="stat-label">实际:</span>
                            <span class="stat-value">${count} 次 (${percentage}%)</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">理论:</span>
                            <span class="stat-value">${expectedRatio}</span>
                          </div>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${this.selectedCell && this.interactive ? html`
          <div class="detail-panel">
            <div class="detail-title">
              <span>格子详情</span>
              <button class="close-button" @click=${() => this.selectedCell = null} aria-label="关闭">×</button>
            </div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">位置:</span>
                <span class="detail-value">第 ${this.selectedCell.row + 1} 行, 第 ${this.selectedCell.col + 1} 列</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">基因型:</span>
                <span class="detail-value">${this.selectedCell.genotype}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">表型:</span>
                <span class="detail-value">${this.getPhenotypeDisplayName(this.selectedCell.phenotype, traitDefs)}</span>
              </div>
              <div class="detail-explanation">
                ${this.getCellExplanation(this.selectedCell, offspring.length)}
              </div>
            </div>
          </div>
        ` : ''}

        ${showPheno ? html`
          <div class="offspring-section">
            <div class="offspring-title">后代表型比例</div>
            <div class="offspring-grid">
              ${map(Array.from(this.calculatePhenotypeRatios(offspring).entries()).sort((a, b) => b[1] - a[1]), ([phenotype, count]) => {
                const ratio = this.calculateRatio(count, offspring.length);
                return html`
                  <div class="offspring-item">
                    <div class="offspring-phenotype">${this.getPhenotypeDisplayName(phenotype, traitDefs)}</div>
                    <div class="offspring-ratio">${ratio} (${count}/${offspring.length})</div>
                  </div>
                `;
              })}
            </div>
          </div>

          ${chiSquareResult ? html`
            <div class="chi-square-section">
              <div class="chi-square-title">卡方检验 (χ² Test)</div>
              <table class="chi-square-table">
                <thead>
                  <tr>
                    <th>表型</th>
                    <th>理论期望</th>
                    <th>实际观察</th>
                    <th>(O-E)²/E</th>
                  </tr>
                </thead>
                <tbody>
                  ${map(Array.from(this.calculatePhenotypeRatios(offspring).entries()), ([phenotype, expected], index) => {
                    const observed = this.observedData[index] || 0;
                    const contribution = expected > 0 ? Math.pow(observed - expected, 2) / expected : 0;
                    return html`
                      <tr>
                        <td>${this.getPhenotypeDisplayName(phenotype, traitDefs)}</td>
                        <td>${expected}</td>
                        <td>${observed}</td>
                        <td>${contribution.toFixed(3)}</td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
              <div class="chi-square-result">
                <div class="chi-square-value">χ² = ${chiSquareResult.value.toFixed(3)}</div>
                <div class="chi-square-conclusion ${chiSquareResult.accept ? 'accept' : 'reject'}">
                  ${chiSquareResult.accept
                    ? '✓ 接受原假设：实际数据符合理论比例 (p > 0.05)'
                    : '✗ 拒绝原假设：实际数据显著偏离理论比例 (p < 0.05)'}
                </div>
              </div>
            </div>
          ` : ''}

          <div class="phenotype-legend">
            ${traitDefs && traitDefs.length > 0 ? html`
              ${map(traitDefs, (trait, index) => html`
                <div class="legend-item">
                  <div class="legend-indicator dominant"></div>
                  <span class="legend-text">${trait.dominantTrait}</span>
                </div>
                ${trait.incompleteDominance && trait.intermediateTrait ? html`
                  <div class="legend-item">
                    <div class="legend-indicator incomplete"></div>
                    <span class="legend-text">${trait.intermediateTrait}</span>
                  </div>
                ` : ''}
                <div class="legend-item">
                  <div class="legend-indicator recessive"></div>
                  <span class="legend-text">${trait.recessiveTrait}</span>
                </div>
              `)}
            ` : html`
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
            `}
          </div>
        ` : ''}
      </div>
    `;
  }

  private getPhenotypeLabel(phenotype: string): string {
    const labels: Record<string, string> = {
      dominant: '显性',
      recessive: '隐性',
      heterozygous: '杂合',
      incomplete: '中间型'
    };
    return labels[phenotype] || phenotype;
  }

  private calculateRatio(count: number, total: number): string {
    const ratio = (count / total * 100).toFixed(1);
    return `${ratio}%`;
  }

  private handleCellClick(item: GenotypeData, row: number, col: number) {
    if (!this.interactive) return;

    // 更新选中状态
    this.selectedCell = {
      row,
      col,
      genotype: item.genotype,
      phenotype: item.phenotype
    };

    // 发送 action 到后端获取详细信息
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        type: 'action',
        action: {
          name: 'cell_click',
          context: {
            component: 'punnett_square',
            row,
            col,
            genotype: item.genotype,
            phenotype: item.phenotype
          }
        },
        surfaceId: 'genetics_ui'
      },
      bubbles: true,
      composed: true
    }));
  }

  private getCellExplanation(cell: { genotype: string; phenotype: string }, totalCells: number): string {
    const phenotypeLabel = this.getPhenotypeDisplayName(cell.phenotype, this.unwrapValue(this.traitDefinitions, 'array'));
    const probability = (1 / totalCells * 100).toFixed(1);

    let explanation = `该格子代表一种可能的子代基因型组合。`;
    explanation += `\n\n基因型 ${cell.genotype} 出现的概率为 1/${totalCells} = ${probability}%。`;

    if (cell.phenotype === 'dominant' || cell.phenotype.includes('显性')) {
      explanation += `\n\n该基因型表现为${phenotypeLabel}，因为含有至少一个显性等位基因。`;
    } else if (cell.phenotype === 'recessive' || cell.phenotype.includes('隐性')) {
      explanation += `\n\n该基因型表现为${phenotypeLabel}，因为两个等位基因都是隐性的。`;
    } else if (cell.phenotype === 'heterozygous' || cell.phenotype.includes('杂合')) {
      explanation += `\n\n该基因型为杂合子，表现为${phenotypeLabel}。`;
    }

    return explanation;
  }

  private handleSimulationCountChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.simulationCount = parseInt(select.value);
  }

  private async handleSimulate() {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.simulationResults = new Map();

    const parent1 = this.unwrapValue(this.parent1Genotype, 'string');
    const parent2 = this.unwrapValue(this.parent2Genotype, 'string');
    const gametes1 = this.getGametes(parent1);
    const gametes2 = this.getGametes(parent2);

    if (gametes1.length === 0 || gametes2.length === 0) {
      this.isSimulating = false;
      return;
    }

    // 获取模拟次数
    const count = this.simulationCount || 1000;

    // 模拟随机受精
    for (let i = 0; i < count; i++) {
      // 随机选择配子
      const g1 = gametes1[Math.floor(Math.random() * gametes1.length)];
      const g2 = gametes2[Math.floor(Math.random() * gametes2.length)];

      // 组合配子
      const genotype = this.combineGametes(g1, g2);
      const phenotype = this.determinePhenotype(genotype);

      // 统计结果
      const currentCount = this.simulationResults.get(phenotype) || 0;
      this.simulationResults.set(phenotype, currentCount + 1);

      // 每100次更新一次UI（提升性能）
      if (i % 100 === 0) {
        this.requestUpdate();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.isSimulating = false;
    this.requestUpdate();
  }

  private handleResetSimulation() {
    this.simulationResults = new Map();
    this.simulationCount = 1000;
    this.requestUpdate();
  }

  private getExpectedRatio(phenotype: string, offspring: GenotypeData[]): string {
    const phenotypeRatios = this.calculatePhenotypeRatios(offspring);
    const count = phenotypeRatios.get(phenotype) || 0;
    const total = offspring.length;
    const percentage = (count / total * 100).toFixed(2);
    return `${count}/${total} (${percentage}%)`;
  }
}
