/*
 DNAStructure Component for Genetics Visualization
 DNA双螺旋结构组件 - 用于展示DNA序列和碱基配对
*/

import { Root } from '@a2ui/lit/ui';
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

export interface BasePair {
  base1: string;
  base2: string;
  index: number;
}

@customElement('dna-structure')
export class DNAStructure extends Root {
  private _sequence: string = '';
  private _showLabels: boolean = true;
  private _highlightRegions: Array<{ start: number; end: number; label: string }> = [];

  @property({ type: String })
  get sequence(): string {
    return this._sequence;
  }
  set sequence(value: any) {
    const oldValue = this._sequence;
    this._sequence = this.unwrapValue(value, 'string');
    this.requestUpdate('sequence', oldValue);
  }

  @property({ type: Boolean })
  get showLabels(): boolean {
    return this._showLabels;
  }
  set showLabels(value: any) {
    const oldValue = this._showLabels;
    this._showLabels = this.unwrapValue(value, 'boolean');
    this.requestUpdate('showLabels', oldValue);
  }

  @property({ type: Array })
  get highlightRegions(): Array<{ start: number; end: number; label: string }> {
    return this._highlightRegions;
  }
  set highlightRegions(value: any) {
    const oldValue = this._highlightRegions;
    this._highlightRegions = this.unwrapValue(value, 'array');
    this.requestUpdate('highlightRegions', oldValue);
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
      font-family: 'Roboto', sans-serif;
    }

    .container {
      max-width: 800px;
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

    .dna-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .strand {
      display: flex;
      align-items: center;
      gap: 0;
      position: relative;
      padding: 4px 0;
    }

    .strand.left {
      flex-direction: row;
    }

    .strand.right {
      flex-direction: row-reverse;
    }

    .base-pair {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      position: relative;
    }

    .base {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      font-family: monospace;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .base:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .base.A {
      background: linear-gradient(135deg, #e53935 0%, #f44336 100%);
      color: #fff;
    }

    .base.T {
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      color: #fff;
    }

    .base.C {
      background: linear-gradient(135deg, #0891b2 0%, #3b82f6 100%);
      color: #fff;
    }

    .base.G {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
    }

    .base.highlight {
      animation: pulse 1.5s ease-in-out infinite;
      border: 2px solid #ffd700;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .bond {
      position: absolute;
      width: 2px;
      height: 8px;
      background: #dadce0;
      left: 50%;
      transform: translateX(-50%);
    }

    .bond.top {
      top: -4px;
    }

    .bond.bottom {
      bottom: -4px;
    }

    .label {
      font-size: 0.7rem;
      color: #5f6368;
      text-align: center;
      margin-top: 2px;
    }

    .legend {
      margin-top: 16px;
      padding: 12px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #dadce0;
    }

    .legend-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #202124;
      margin-bottom: 8px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      background: #f8f9fa;
    }

    .legend-base {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.7rem;
      font-family: monospace;
      color: #fff;
    }

    .legend-base.A {
      background: linear-gradient(135deg, #e53935 0%, #f44336 100%);
    }

    .legend-base.T {
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    }

    .legend-base.C {
      background: linear-gradient(135deg, #0891b2 0%, #3b82f6 100%);
    }

    .legend-base.G {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .legend-text {
      font-size: 0.85rem;
      color: #5f6368;
    }

    .sequence-info {
      margin-top: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #1a73e8;
    }

    .sequence-text {
      font-family: monospace;
      font-size: 0.95rem;
      color: #202124;
      word-break: break-all;
      line-height: 1.6;
    }

    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 12px;
      padding: 12px;
      background: #e8f0fe;
      border-radius: 8px;
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
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a73e8;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #5f6368;
      font-style: italic;
    }
  `];

  private getBasePairs(): BasePair[] {
    if (!this.sequence) return [];

    const bases: BasePair[] = [];
    const upperSequence = this.sequence.toUpperCase();

    // 为每个碱基生成其互补碱基
    for (let i = 0; i < upperSequence.length; i++) {
      const base1 = upperSequence[i];
      const base2 = this.getComplementaryBase(base1);

      bases.push({
        base1,
        base2,
        index: i
      });
    }

    return bases;
  }

  private isHighlighted(index: number): boolean {
    return this.highlightRegions.some(region =>
      index >= region.start && index < region.end
    );
  }

  private isValidBase(base: string): boolean {
    return ['A', 'T', 'C', 'G'].includes(base.toUpperCase());
  }

  private getComplementaryBase(base: string): string {
    const pairs: Record<string, string> = {
      'A': 'T',
      'T': 'A',
      'C': 'G',
      'G': 'C'
    };
    return pairs[base.toUpperCase()] || '?';
  }

  private validateSequence(): boolean {
    if (!this.sequence) return true;
    const upperSequence = this.sequence.toUpperCase();

    for (const char of upperSequence) {
      if (!this.isValidBase(char)) {
        return false;
      }
    }

    return true; // 移除长度必须是偶数的限制
  }

  private getSequenceStats(): { baseCounts: Record<string, number>; length: number; gcContent: number } {
    const baseCounts: Record<string, number> = { 'A': 0, 'T': 0, 'C': 0, 'G': 0 };
    const upperSequence = this.sequence.toUpperCase();

    for (const base of upperSequence) {
      if (baseCounts[base] !== undefined) {
        baseCounts[base]++;
      }
    }

    const length = upperSequence.length;
    const gcCount = (baseCounts['G'] || 0) + (baseCounts['C'] || 0);
    const gcContent = length > 0 ? (gcCount / length * 100) : 0;

    return { baseCounts, length, gcContent };
  }

  override render() {
    const isValid = this.validateSequence();

    if (!isValid || this.sequence.length === 0) {
      return html`
        <div class="empty">
          ${this.sequence.length === 0
            ? '请输入DNA序列（例如：ATCGATCG）'
            : 'DNA序列包含无效的碱基。请只使用 A、T、C、G。'}
        </div>
      `;
    }

    const basePairs = this.getBasePairs();
    const stats = this.getSequenceStats();

    return html`
      <div class="container">
        <div class="title">DNA 双螺旋结构</div>

        <div class="dna-wrapper">
          <div class="strand left">
            ${map(basePairs, (pair, index) => html`
              <div class="base-pair">
                <div class="bond top"></div>
                <div
                  class="base ${pair.base1} ${this.isHighlighted(index) ? 'highlight' : ''}"
                  @click=${() => this.handleBaseClick(pair.base1, index)}
                  aria-label="${pair.base1}"
                >
                  ${pair.base1}
                </div>
                ${this.showLabels ? html`<div class="label">${index + 1}</div>` : ''}
              </div>
            `)}
          </div>

          <div class="strand right">
            ${map([...basePairs].reverse(), (pair, index) => {
              const originalIndex = basePairs.length - 1 - index;
              return html`
              <div class="base-pair">
                ${this.showLabels ? html`<div class="label">${originalIndex + 1}</div>` : ''}
                <div
                  class="base ${pair.base2} ${this.isHighlighted(originalIndex) ? 'highlight' : ''}"
                  @click=${() => this.handleBaseClick(pair.base2, originalIndex)}
                  aria-label="${pair.base2}"
                >
                  ${pair.base2}
                </div>
                <div class="bond bottom"></div>
              </div>
            `})}
          </div>
        </div>

        <div class="sequence-info">
          <div class="sequence-text">
            <strong>原始链 (5'→3')：</strong> ${this.sequence.toUpperCase()}<br>
            <strong>互补链 (3'→5')：</strong> ${basePairs.map(p => p.base2).reverse().join('')}
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">序列长度</div>
            <div class="stat-value">${stats.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">碱基对</div>
            <div class="stat-value">${stats.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">GC 含量</div>
            <div class="stat-value">${stats.gcContent.toFixed(1)}%</div>
          </div>
        </div>

        ${this.showLabels ? html`
          <div class="legend">
            <div class="legend-title">碱基配对规则</div>
            <div class="legend-grid">
              ${map([
                { base: 'A', label: '腺嘌呤', pair: 'T', pairLabel: '胸腺嘧啶' },
                { base: 'T', label: '胸腺嘧啶', pair: 'A', pairLabel: '腺嘌呤' },
                { base: 'C', label: '胞嘧啶', pair: 'G', pairLabel: '鸟嘌呤' },
                { base: 'G', label: '鸟嘌呤', pair: 'C', pairLabel: '胞嘧啶' }
              ], (item) => html`
                <div class="legend-item">
                  <div class="legend-base ${item.base}">${item.base}</div>
                  <div class="legend-text">
                    ${item.label}<br>
                    <small>与 ${item.pairLabel} (${item.pair}) 配对</small>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private handleBaseClick(base: string, index: number) {
    this.dispatchEvent(new CustomEvent('base-click', {
      detail: { base, index, pair: this.getComplementaryBase(base) },
      bubbles: true,
      composed: true
    }));
  }
}
