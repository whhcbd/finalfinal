/*
 DNAStructure Component for Genetics Visualization
 DNA双螺旋结构组件 - 用于展示DNA序列和碱基配对
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import animationStyles from '../../styles/animations.css?inline';

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
  private _interactive: boolean = true;

  @property({ type: String })
  get sequence(): string {
    return this._sequence;
  }
  set sequence(value: any) {
    const oldValue = this._sequence;
    // Store the raw value (could be a path reference or literal)
    this._sequence = value;
    this.requestUpdate('sequence', oldValue);
  }

  @property({ type: Boolean })
  get showLabels(): boolean {
    return this._showLabels;
  }
  set showLabels(value: any) {
    const oldValue = this._showLabels;
    // Store the raw value (could be a path reference or literal)
    this._showLabels = value;
    this.requestUpdate('showLabels', oldValue);
  }

  @property({ type: Array })
  get highlightRegions(): Array<{ start: number; end: number; label: string }> {
    return this._highlightRegions;
  }
  set highlightRegions(value: any) {
    const oldValue = this._highlightRegions;
    // Store the raw value (could be a path reference or literal)
    this._highlightRegions = value;
    this.requestUpdate('highlightRegions', oldValue);
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
  selectedBase: { base: string; index: number; pair: string } | null = null;

  private unwrapValue(value: any, type: 'string' | 'boolean' | 'number' | 'array'): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return type === 'string' ? '' :
             type === 'boolean' ? false :
             type === 'number' ? 0 :
             type === 'array' ? [] : null;
    }

    // Handle A2UI data binding (path references)
    if (value && typeof value === 'object' && 'path' in value && value.path) {
      if (!this.processor || !this.component) {
        return type === 'string' ? '' :
               type === 'boolean' ? false :
               type === 'number' ? 0 :
               type === 'array' ? [] : null;
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
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('literalString' in value) return value.literalString;
      if ('literalBoolean' in value) return value.literalBoolean;
      if ('literalNumber' in value) return value.literalNumber;
      if ('literalArray' in value) return value.literalArray;
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
      overflow-x: auto;
    }

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      text-align: center;
      margin-bottom: 16px;
    }

    .dna-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
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
      transition: all 0.2s ease;
      cursor: pointer;
      border: 2px solid;
    }

    .base:hover {
      transform: translateY(-2px);
    }

    .base.A {
      background: #fef3c7;
      color: #92400e;
      border-color: #f59e0b;
    }

    .base.T {
      background: #dbeafe;
      color: #1e40af;
      border-color: #3b82f6;
    }

    .base.C {
      background: #d1fae5;
      color: #065f46;
      border-color: #10b981;
    }

    .base.G {
      background: #fce7f3;
      color: #9f1239;
      border-color: #ec4899;
    }

    .base.highlight {
      border-color: #111827;
      border-width: 3px;
      background: #fafafa;
    }

    .bond {
      position: absolute;
      width: 2px;
      height: 8px;
      background: #e5e7eb;
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
      color: #6b7280;
      text-align: center;
      margin-top: 2px;
    }

    .legend {
      margin-top: 16px;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
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
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      background: #fafafa;
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
      color: #111827;
      border: 2px solid;
    }

    .legend-base.A {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }

    .legend-base.T {
      background: #dbeafe;
      border-color: #3b82f6;
      color: #1e40af;
    }

    .legend-base.C {
      background: #d1fae5;
      border-color: #10b981;
      color: #065f46;
    }

    .legend-base.G {
      background: #fce7f3;
      border-color: #ec4899;
      color: #9f1239;
    }

    .legend-text {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .sequence-info {
      margin-top: 12px;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      border-left: 3px solid #111827;
      border: 1px solid #e5e7eb;
    }

    .sequence-text {
      font-family: monospace;
      font-size: 0.95rem;
      color: #111827;
      word-break: break-all;
      line-height: 1.6;
    }

    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
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
      font-size: 1.2rem;
      font-weight: 600;
      color: #111827;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }

    .base.selected {
      border-width: 3px;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      transform: scale(1.1);
    }

    .base.paired {
      border-color: #10b981;
      background: #d1fae5;
    }

    .hydrogen-bond {
      position: absolute;
      width: 1px;
      background: #6b7280;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .base-pair.show-bonds .hydrogen-bond {
      opacity: 1;
    }

    .base-detail-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 1000;
      min-width: 320px;
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
  `];

  private getBasePairs(sequence: string): BasePair[] {
    if (!sequence) return [];

    const bases: BasePair[] = [];
    const upperSequence = sequence.toUpperCase();

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

  private isHighlighted(index: number, highlightRegions: any[]): boolean {
    if (!Array.isArray(highlightRegions)) return false;
    return highlightRegions.some(region =>
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

  private validateSequence(sequence: string): boolean {
    if (!sequence) return true;
    const upperSequence = sequence.toUpperCase();

    for (const char of upperSequence) {
      if (!this.isValidBase(char)) {
        return false;
      }
    }

    return true; // 移除长度必须是偶数的限制
  }

  private getSequenceStats(sequence: string): { baseCounts: Record<string, number>; length: number; gcContent: number } {
    const baseCounts: Record<string, number> = { 'A': 0, 'T': 0, 'C': 0, 'G': 0 };
    const upperSequence = sequence.toUpperCase();

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
    // Unwrap values at render time (when dataModel is ready)
    const sequence = this.unwrapValue(this.sequence, 'string');
    const showLabels = this.unwrapValue(this.showLabels, 'boolean');
    const highlightRegions = this.unwrapValue(this.highlightRegions, 'array');

    const isValid = this.validateSequence(sequence);

    if (!isValid || sequence.length === 0) {
      return html`
        <div class="empty">
          ${sequence.length === 0
            ? '请输入DNA序列（例如：ATCGATCG）'
            : 'DNA序列包含无效的碱基。请只使用 A、T、C、G。'}
        </div>
      `;
    }

    const basePairs = this.getBasePairs(sequence);
    const stats = this.getSequenceStats(sequence);

    return html`
      <div class="container">
        <div class="title">DNA 双螺旋结构</div>

        <div class="dna-wrapper">
          <div class="strand left">
            ${map(basePairs, (pair, index) => html`
              <div class="base-pair ${this.selectedBase?.index === index ? 'show-bonds' : ''}">
                <div class="bond top"></div>
                ${this.renderHydrogenBonds(pair.base1, index)}
                <div
                  class="base ${pair.base1} ${this.isHighlighted(index, highlightRegions) ? 'highlight' : ''} ${this.selectedBase?.index === index ? 'selected' : ''} ${this.selectedBase?.index === index && this.selectedBase?.base === pair.base1 ? 'paired' : ''}"
                  @click=${() => this.handleBaseClick(pair.base1, index, true)}
                  aria-label="${pair.base1}"
                  tabindex="0"
                >
                  ${pair.base1}
                </div>
                ${showLabels ? html`<div class="label">${index + 1}</div>` : ''}
              </div>
            `)}
          </div>

          <div class="strand right">
            ${map([...basePairs].reverse(), (pair, index) => {
              const originalIndex = basePairs.length - 1 - index;
              return html`
              <div class="base-pair ${this.selectedBase?.index === originalIndex ? 'show-bonds' : ''}">
                ${showLabels ? html`<div class="label">${originalIndex + 1}</div>` : ''}
                <div
                  class="base ${pair.base2} ${this.isHighlighted(originalIndex, highlightRegions) ? 'highlight' : ''} ${this.selectedBase?.index === originalIndex ? 'selected' : ''} ${this.selectedBase?.index === originalIndex && this.selectedBase?.base === pair.base2 ? 'paired' : ''}"
                  @click=${() => this.handleBaseClick(pair.base2, originalIndex, false)}
                  aria-label="${pair.base2}"
                  tabindex="0"
                >
                  ${pair.base2}
                </div>
                ${this.renderHydrogenBonds(pair.base2, originalIndex)}
                <div class="bond bottom"></div>
              </div>
            `})}
          </div>
        </div>

        <div class="sequence-info">
          <div class="sequence-text">
            <strong>原始链 (5'→3')：</strong> ${sequence.toUpperCase()}<br>
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

        ${showLabels ? html`
          <div class="legend">
            <div class="legend-title">碱基配对规则</div>
            <div class="legend-grid">
              ${map([
                { base: 'A', label: '腺嘌呤', pair: 'T', pairLabel: '胸腺嘧啶', bonds: 2 },
                { base: 'T', label: '胸腺嘧啶', pair: 'A', pairLabel: '腺嘌呤', bonds: 2 },
                { base: 'C', label: '胞嘧啶', pair: 'G', pairLabel: '鸟嘌呤', bonds: 3 },
                { base: 'G', label: '鸟嘌呤', pair: 'C', pairLabel: '胞嘧啶', bonds: 3 }
              ], (item) => html`
                <div class="legend-item">
                  <div class="legend-base ${item.base}">${item.base}</div>
                  <div class="legend-text">
                    ${item.label}<br>
                    <small>与 ${item.pairLabel} (${item.pair}) 配对 - ${item.bonds}个氢键</small>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${this.selectedBase ? this.renderBaseDetailModal() : ''}
      </div>
    `;
  }

  private handleBaseClick(base: string, index: number, isTopStrand: boolean) {
    if (!this._interactive) return;

    const pair = this.getComplementaryBase(base);
    this.selectedBase = { base, index, pair };
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        component: 'dna_structure',
        action: 'base_click',
        data: {
          base,
          index,
          pair,
          isTopStrand
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  private renderHydrogenBonds(base: string, index: number) {
    if (!this.selectedBase || this.selectedBase.index !== index) {
      return '';
    }

    const bondCount = (base === 'A' || base === 'T') ? 2 : 3;
    const bonds = [];

    for (let i = 0; i < bondCount; i++) {
      bonds.push(html`
        <div class="hydrogen-bond" style="
          height: 20px;
          top: ${10 + i * 8}px;
        "></div>
      `);
    }

    return bonds;
  }

  private renderBaseDetailModal() {
    if (!this.selectedBase) return '';

    const { base, pair } = this.selectedBase;
    const bondCount = (base === 'A' || base === 'T') ? 2 : 3;
    const baseName = this.getBaseName(base);
    const pairName = this.getBaseName(pair);

    return html`
      <div class="modal-overlay" @click=${() => this.closeModal()}></div>
      <div class="base-detail-modal">
        <button class="modal-close" @click=${() => this.closeModal()}>×</button>
        <div class="modal-header">碱基配对详情</div>
        <div class="modal-content">
          <p><strong>选中碱基：</strong>${baseName} (${base})</p>
          <p><strong>配对碱基：</strong>${pairName} (${pair})</p>
          <p><strong>氢键数量：</strong>${bondCount} 个</p>
          <p><strong>配对规则：</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${base === 'A' || base === 'T' ? html`
              <li>腺嘌呤 (A) 与 胸腺嘧啶 (T) 通过 <strong>2个氢键</strong> 配对</li>
              <li>嘌呤与嘧啶配对，保持DNA双螺旋结构稳定</li>
            ` : html`
              <li>鸟嘌呤 (G) 与 胞嘧啶 (C) 通过 <strong>3个氢键</strong> 配对</li>
              <li>G-C 配对比 A-T 配对更稳定（氢键更多）</li>
            `}
          </ul>
          <p style="margin-top: 12px; font-size: 0.9rem; color: #6b7280;">
            💡 提示：碱基互补配对是DNA复制和遗传信息传递的基础
          </p>
        </div>
      </div>
    `;
  }

  private getBaseName(base: string): string {
    const names: Record<string, string> = {
      'A': '腺嘌呤',
      'T': '胸腺嘧啶',
      'C': '胞嘧啶',
      'G': '鸟嘌呤'
    };
    return names[base.toUpperCase()] || base;
  }

  private closeModal() {
    this.selectedBase = null;
    this.requestUpdate();
  }
}
