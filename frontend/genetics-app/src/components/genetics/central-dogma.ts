/*
  CentralDogma Component for Genetics Visualization
  中心法则组件 - 展示DNA复制、转录、翻译过程
*/

import { Root } from '@a2ui/lit/ui';
import { html, css, unsafeCSS } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import animationStyles from '../../styles/animations.css?inline';

@customElement('central-dogma')
export class CentralDogma extends Root {
  private _phase: 'idle' | 'replication' | 'transcription' | 'translation' | 'completed' = 'idle';

  @property({ type: String })
  get phase(): string {
    return this._phase;
  }
  set phase(value: any) {
    const oldValue = this._phase;
    const newPhase = this.unwrapValue(value, 'string') || 'idle';
    if (newPhase !== this._phase) {
      this._phase = newPhase;
      this.requestUpdate('phase', oldValue);
    }
  }

  private _dnaSequence: string = 'ATCGATCG';

  @property({ type: String })
  get dnaSequence(): string {
    return this._dnaSequence;
  }
  set dnaSequence(value: any) {
    const oldValue = this._dnaSequence;
    this._dnaSequence = this.unwrapValue(value, 'string') || 'ATCGATCG';
    this.requestUpdate('dnaSequence', oldValue);
  }

  private _animationSpeed: number = 1000;

  @property({ type: Number })
  get animationSpeed(): number {
    return this._animationSpeed;
  }
  set animationSpeed(value: any) {
    const oldValue = this._animationSpeed;
    const numValue = this.unwrapValue(value, 'number');
    if (typeof numValue === 'number' && numValue > 0) {
      this._animationSpeed = numValue;
    }
    this.requestUpdate('animationSpeed', oldValue);
  }

  private get fastSlow(): 'fast' | 'slow' {
    return this._animationSpeed < 1000 ? 'fast' : 'slow';
  }

  private get animationInterval(): number {
    return this._animationSpeed;
  }

  @state()
  private isPaused: boolean = false;

  @state()
  private replicationStep: 'initial' | 'unwinding' | 'unwound' = 'initial';

  @state()
  private unwindProgress: number = 0; // 0-N, how many base pairs have separated

  private _unwindTimer: ReturnType<typeof setTimeout> | null = null;

  @state()
  private synthesisProgress: number = 0; // how many new bases have appeared

  @state()
  private synthesisStep: 'idle' | 'running' | 'done' = 'idle';

  private _synthesisTimer: ReturnType<typeof setTimeout> | null = null;

  // Transcription state
  @state() private transcriptionProgress: number = 0;
  @state() private transcriptionStep: 'idle' | 'running' | 'done' = 'idle';
  @state() private polymerasePos: number = -1;
  @state() private showSigmaFactor: boolean = true;      // task 11: σ factor visible before start
  @state() private showTermination: boolean = false;     // task 12: termination signal
  @state() private showProcessing: boolean = false;      // task 13: post-transcriptional processing
  @state() private processingStep: 'none' | 'cap' | 'polya' | 'splicing' | 'done' = 'none'; // task 13
  private _transcriptionTimer: ReturnType<typeof setTimeout> | null = null;
  private _processingTimer: ReturnType<typeof setTimeout> | null = null;

  // Translation state
  @state() private ribosomeCodon: number = 0; // current codon index (0-based)
  @state() private translationStep: 'idle' | 'running' | 'done' = 'idle';
  @state() private aminoAcids: string[] = [];
  private _translationTimer: ReturnType<typeof setTimeout> | null = null;
  // task 14: A/P/E site tracking (codon indices relative to ribosome)
  // A=ribosomeCodon, P=ribosomeCodon-1, E=ribosomeCodon-2 (derived, no extra state needed)
  // task 15: tRNA at A site
  @state() private tRNACodon: string = '';   // anticodon of tRNA at A site
  @state() private tRNAAmino: string = '';   // amino acid carried by A-site tRNA
  // task 16: polyribosome — multiple ribosomes on same mRNA
  @state() private polyRibosomes: number[] = []; // codon positions of trailing ribosomes
  // task 17: start/stop codon highlighting (derived from mRNA, no extra state)

  // Replication fork / Okazaki fragment state
  private static readonly PRIMER_LEN = 2; // RNA primer length per fragment
  private static readonly FRAG_LEN = 3;   // DNA bases per Okazaki fragment

  // Sequence input error
  @state() private seqError: string = '';

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

      // Use A2UI's getData to resolve path
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

  private static readonly CODON_TABLE: Record<string, string> = {
    'AUG':'甲硫氨酸 Met','UUU':'苯丙氨酸 Phe','UUC':'苯丙氨酸 Phe',
    'UUA':'亮氨酸 Leu','UUG':'亮氨酸 Leu','CUU':'亮氨酸 Leu','CUC':'亮氨酸 Leu','CUA':'亮氨酸 Leu','CUG':'亮氨酸 Leu',
    'AUU':'异亮氨酸 Ile','AUC':'异亮氨酸 Ile','AUA':'异亮氨酸 Ile',
    'GUU':'缬氨酸 Val','GUC':'缬氨酸 Val','GUA':'缬氨酸 Val','GUG':'缬氨酸 Val',
    'UCU':'丝氨酸 Ser','UCC':'丝氨酸 Ser','UCA':'丝氨酸 Ser','UCG':'丝氨酸 Ser','AGU':'丝氨酸 Ser','AGC':'丝氨酸 Ser',
    'CCU':'脯氨酸 Pro','CCC':'脯氨酸 Pro','CCA':'脯氨酸 Pro','CCG':'脯氨酸 Pro',
    'ACU':'苏氨酸 Thr','ACC':'苏氨酸 Thr','ACA':'苏氨酸 Thr','ACG':'苏氨酸 Thr',
    'GCU':'丙氨酸 Ala','GCC':'丙氨酸 Ala','GCA':'丙氨酸 Ala','GCG':'丙氨酸 Ala',
    'UAU':'酪氨酸 Tyr','UAC':'酪氨酸 Tyr',
    'CAU':'组氨酸 His','CAC':'组氨酸 His',
    'CAA':'谷氨酰胺 Gln','CAG':'谷氨酰胺 Gln',
    'AAU':'天冬酰胺 Asn','AAC':'天冬酰胺 Asn',
    'AAA':'赖氨酸 Lys','AAG':'赖氨酸 Lys',
    'GAU':'天冬氨酸 Asp','GAC':'天冬氨酸 Asp',
    'GAA':'谷氨酸 Glu','GAG':'谷氨酸 Glu',
    'UGU':'半胱氨酸 Cys','UGC':'半胱氨酸 Cys',
    'UGG':'色氨酸 Trp',
    'CGU':'精氨酸 Arg','CGC':'精氨酸 Arg','CGA':'精氨酸 Arg','CGG':'精氨酸 Arg','AGA':'精氨酸 Arg','AGG':'精氨酸 Arg',
    'GGU':'甘氨酸 Gly','GGC':'甘氨酸 Gly','GGA':'甘氨酸 Gly','GGG':'甘氨酸 Gly',
    'UAA':'终止 Stop','UAG':'终止 Stop','UGA':'终止 Stop',
  };

  static styles = [
    unsafeCSS(animationStyles),
    css`
      :host {
        display: block;
        font-family: Inter, sans-serif;
        background: #fafafa;
        border-radius: 12px;
        padding: 24px;
        color: #111827;
      }

      .header {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 16px;
        color: #111827;
      }

      .phase-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .phase-btn {
        padding: 8px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
        color: #6b7280;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .phase-btn.active {
        background: #111827;
        color: #fff;
        border-color: #111827;
      }

      .phase-btn:hover:not(.active) {
        border-color: #6b7280;
        color: #111827;
      }

      .visualization {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 32px 20px 20px 20px;
        min-height: 120px;
        display: block;
        overflow: visible;
        margin-bottom: 16px;
      }

      .scroll-area {
        overflow-x: auto;
        overflow-y: visible;
        padding-top: 24px;
        margin-top: -24px;
        cursor: grab;
        user-select: none;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        min-height: 120px;
      }

      .scroll-area::-webkit-scrollbar {
        width: 0;
        height: 4px;
      }

      .scroll-area::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 2px;
      }

      .scroll-area::-webkit-scrollbar:vertical {
        display: none;
      }

      .scroll-area:active {
        cursor: grabbing;
      }

      .scroll-area::-webkit-scrollbar {
        height: 4px;
      }

      .scroll-area::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 2px;
      }

      .scroll-hint {
        font-size: 0.65rem;
        color: #9ca3af;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .sequence-row {
        display: flex;
        gap: 4px;
        margin: 4px 0;
        align-items: center;
        position: relative;
        overflow: visible;
        flex-wrap: nowrap;
        min-width: max-content;
      }

      .base {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.875rem;
      }

      /* 任务9: 按规范更新碱基颜色 A红 T蓝 C绿 G黄 U紫 */
      .base-A { background: #fee2e2; color: #dc2626; }
      .base-T { background: #dbeafe; color: #1d4ed8; }
      .base-G { background: #fef9c3; color: #92400e; }
      .base-C { background: #dcfce7; color: #166534; }
      .base-U { background: #ede9fe; color: #7c3aed; }

      .base {
        transition: transform 0.15s ease;
      }
      .base:hover {
        transform: scale(1.1);
      }

      .strand-label {
        font-size: 0.75rem;
        color: #6b7280;
        width: 80px;
        flex-shrink: 0;
      }

      .idle-prompt {
        color: #6b7280;
        font-size: 0.875rem;
        text-align: center;
      }

      .sequence-input {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 16px;
      }

      .sequence-input input {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.875rem;
        font-family: monospace;
        color: #111827;
        flex: 1;
        outline: none;
      }

      .sequence-input input:focus {
        border-color: #6b7280;
      }

      .run-btn {
        padding: 8px 20px;
        background: #111827;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
      }

      .run-btn:hover {
        background: #374151;
      }

      .dna-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
      }

      .base-pair-row {
        display: flex;
        align-items: center;
        gap: 0;
      }

      .strand-top {
        display: flex;
        gap: 4px;
        transition: transform 0.4s ease, opacity 0.4s ease;
      }

      .strand-bottom {
        display: flex;
        gap: 4px;
        transition: transform 0.4s ease, opacity 0.4s ease;
      }

      .strand-top.unwinding {
        transform: translateY(-8px);
      }

      .strand-bottom.unwinding {
        transform: translateY(8px);
      }

      .strand-top.unwound {
        transform: translateY(-16px);
      }

      .strand-bottom.unwound {
        transform: translateY(16px);
      }

      .connector {
        width: 4px;
        align-self: stretch;
        background: #e5e7eb;
        margin: 0 2px;
        transition: opacity 0.3s ease;
        border-radius: 2px;
      }

      .connector.separated {
        opacity: 0;
      }

      .start-btn {
        padding: 6px 16px;
        background: #111827;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        margin-bottom: 12px;
      }

      .start-btn:disabled {
        background: #9ca3af;
        cursor: default;
      }

      .start-btn:not(:disabled):hover {
        background: #374151;
      }

      .controls-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .pause-btn {
        padding: 5px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
        color: #111827;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.15s;
      }
      .pause-btn:hover { background: #f3f4f6; }
      .pause-btn.paused { background: #111827; color: #fff; border-color: #111827; }

      .speed-label {
        font-size: 0.75rem;
        color: #6b7280;
        white-space: nowrap;
      }

      input[type=range] {
        width: 100px;
        accent-color: #111827;
      }

      @media (max-width: 480px) {
        :host { padding: 12px; }
        .strand-label { width: 56px; font-size: 0.65rem; }
        .base { width: 26px; height: 26px; font-size: 0.75rem; }
        .controls-bar { gap: 6px; }
        input[type=range] { width: 72px; }
      }
    `,
  ];

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      // resume whichever animation is active
      if (this.phase === 'replication') {
        if (this.replicationStep === 'unwinding') this.startUnwinding(true);
        else if (this.synthesisStep === 'running') this.startSynthesis(true);
      } else if (this.phase === 'transcription' && this.transcriptionStep === 'running') {
        this.startTranscription(true);
      } else if (this.phase === 'translation' && this.translationStep === 'running') {
        this.startTranslation(true);
      }
    }
  }

  private get isAnimating(): boolean {
    return this.replicationStep === 'unwinding' || this.synthesisStep === 'running' ||
      this.transcriptionStep === 'running' || this.translationStep === 'running';
  }

  private get isRunning(): boolean {
    return this.replicationStep === 'unwinding' || this.synthesisStep === 'running' ||
      this.transcriptionStep === 'running' || this.translationStep === 'running';
  }

  private startUnwinding(resume = false) {
    if (!resume && this.replicationStep !== 'initial') return;
    if (!resume) { this.replicationStep = 'unwinding'; this.unwindProgress = 0; }
    const seq = this.dnaSequence.toUpperCase();
    const total = seq.length;
    const interval = Math.max(100, this.animationInterval / total * 2);
    const tick = () => {
      if (this.isPaused) return;
      this.unwindProgress++;
      if (this.unwindProgress >= total) {
        this.replicationStep = 'unwound';
      } else {
        this._unwindTimer = setTimeout(tick, interval);
      }
    };
    this._unwindTimer = setTimeout(tick, interval);
  }

  private resetReplication() {
    if (this._unwindTimer) clearTimeout(this._unwindTimer);
    if (this._synthesisTimer) clearTimeout(this._synthesisTimer);
    this.replicationStep = 'initial';
    this.unwindProgress = 0;
    this.synthesisStep = 'idle';
    this.synthesisProgress = 0;
  }

  private startSynthesis(resume = false) {
    if (!resume && this.synthesisStep !== 'idle') return;
    if (!resume) { this.synthesisStep = 'running'; this.synthesisProgress = 0; }
    const total = this.dnaSequence.length;
    const interval = Math.max(200, this.animationInterval / total * 3);
    const tick = () => {
      if (this.isPaused) return;
      this.synthesisProgress++;
      if (this.synthesisProgress >= total) {
        this.synthesisStep = 'done';
        this.dispatchEvent(new CustomEvent('a2ui-action', {
          bubbles: true, composed: true,
          detail: { action: 'replication-complete' },
        }));
      } else {
        this._synthesisTimer = setTimeout(tick, interval);
      }
    };
    this._synthesisTimer = setTimeout(tick, interval);
  }

  private getComplement(base: string, toRNA = false): string {
    const map: Record<string, string> = toRNA
      ? { A: 'U', T: 'A', G: 'C', C: 'G' }
      : { A: 'T', T: 'A', G: 'C', C: 'G' };
    return map[base] ?? base;
  }

  private renderBase(base: string) {
    return html`<div class="base base-${base}">${base}</div>`;
  }

  // Returns hydrogen bond dots based on base pair: AT/AU=2 (··), GC=3 (···)
  private hBonds(base: string, pairBase?: string): string {
    const ref = pairBase ?? base;
    return (ref === 'A' || ref === 'T' || ref === 'U') ? '··' : '···';
  }

  private _setupDragScroll(el: Element) {
    const div = el as HTMLElement;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    div.addEventListener('pointerdown', (e: PointerEvent) => {
      isDown = true;
      div.setPointerCapture(e.pointerId);
      startX = e.clientX - div.getBoundingClientRect().left;
      scrollLeft = div.scrollLeft;
    });
    div.addEventListener('pointerup', () => { isDown = false; });
    div.addEventListener('pointercancel', () => { isDown = false; });
    div.addEventListener('pointermove', (e: PointerEvent) => {
      if (!isDown) return;
      const x = e.clientX - div.getBoundingClientRect().left;
      div.scrollLeft = scrollLeft - (x - startX);
    });
  }

  private renderReplicationFork(seq: string[], complement: string[]) {
    const n = seq.length;
    const prog = this.synthesisProgress; // 0..n
    const primerLen = CentralDogma.PRIMER_LEN;
    const fragLen = CentralDogma.FRAG_LEN;
    const unitLen = primerLen + fragLen; // bases per Okazaki unit

    // ── Enzyme legend ──────────────────────────────────────────────────────
    const enzymeLegend = html`
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;font-size:0.68rem">
        <span style="background:#7c3aed;color:#fff;padding:1px 6px;border-radius:3px">解旋酶 Helicase</span>
        <span style="background:#0891b2;color:#fff;padding:1px 6px;border-radius:3px">DNA聚合酶III</span>
        <span style="background:#b45309;color:#fff;padding:1px 6px;border-radius:3px">DNA聚合酶I</span>
        <span style="background:#be185d;color:#fff;padding:1px 6px;border-radius:3px">引物酶 Primase</span>
        <span style="background:#166534;color:#fff;padding:1px 6px;border-radius:3px">连接酶 Ligase</span>
        <span style="background:#374151;color:#fff;padding:1px 6px;border-radius:3px">SSB蛋白</span>
        <span style="background:#6d28d9;color:#fff;padding:1px 6px;border-radius:3px">拓扑异构酶</span>
      </div>
    `;

    // ── Replication fork diagram ────────────────────────────────────────────
    // fork point: where unwinding ended (= n, all unwound)
    const forkDiagram = html`
      <div style="font-size:0.7rem;color:#6b7280;margin-bottom:6px;font-weight:600">▶ 复制叉结构</div>
      <div style="position:relative;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:0.7rem;color:#374151;line-height:1.8">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
          <span style="background:#6d28d9;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">拓扑异构酶</span>
          <span style="color:#6b7280">→ 解除超螺旋</span>
          <span style="margin-left:12px;background:#7c3aed;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">解旋酶</span>
          <span style="color:#6b7280">→ 解开双链</span>
          <span style="margin-left:12px;background:#374151;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">SSB蛋白</span>
          <span style="color:#6b7280">→ 稳定单链</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="background:#be185d;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">引物酶</span>
          <span style="color:#6b7280">→ 合成RNA引物</span>
          <span style="margin-left:12px;background:#0891b2;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">DNA聚合酶III</span>
          <span style="color:#6b7280">→ 延伸新链</span>
          <span style="margin-left:12px;background:#b45309;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">DNA聚合酶I</span>
          <span style="color:#6b7280">→ 替换引物</span>
          <span style="margin-left:12px;background:#166534;color:#fff;padding:0 5px;border-radius:3px;font-size:0.65rem">连接酶</span>
          <span style="color:#6b7280">→ 连接片段</span>
        </div>
      </div>
    `;

    // ── Leading strand (continuous, 5'→3' L→R) ─────────────────────────────
    const leadingBases = seq.map((b, i) => {
      const visible = i < prog;
      const isPolIII = prog < n && i === prog - 1;
      return html`
        <div style="position:relative;display:inline-flex;flex-shrink:0">
          <div class="base base-${b}" style="opacity:${visible ? 1 : 0.15};transition:opacity 0.25s">${b}</div>
          ${isPolIII ? html`<div style="position:absolute;top:-17px;left:-4px;background:#0891b2;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;white-space:nowrap;font-weight:700">DNA聚合酶III</div>` : ''}
        </div>
      `;
    });

    // ── Lagging strand: Okazaki fragments (right-to-left synthesis) ─────────
    // Fragment k starts at position: n - (k+1)*unitLen, has primer then DNA
    // We display the lagging strand in the same L→R layout as coding strand
    // but synthesis grows from right to left.
    // fragIndex(i): which fragment position i belongs to (0 = rightmost)
    const lagBases = complement.map((_b, i) => {
      // position from right
      const ri = n - 1 - i;
      const fragIdx = Math.floor(ri / unitLen); // fragment number (0=rightmost)
      const posInFrag = ri % unitLen;           // position within fragment
      const isRNAPrimer = posInFrag < primerLen;
      // fragment k is synthesized when prog reaches n - fragIdx*unitLen
      const fragSynthStart = n - (fragIdx + 1) * unitLen;
      const baseProg = fragSynthStart + posInFrag + 1;
      const visible = prog >= baseProg;
      const base = complement[i];
      // Pol III is at the current synthesis tip within this fragment
      const isTip = prog === baseProg && !isRNAPrimer;
      const isPrimaseTip = prog === baseProg && isRNAPrimer;
      // Ligase appears when a full fragment (not the rightmost) is done and next is also done
      const fragDone = prog >= fragSynthStart + unitLen;
      const nextFragDone = fragIdx > 0 && prog >= n - fragIdx * unitLen;
      const showLigase = fragDone && nextFragDone && posInFrag === 0 && fragIdx > 0;
      const displayText = isRNAPrimer ? (base === 'T' ? 'U' : base) : base;
      return html`
        <div style="position:relative;display:inline-flex;flex-shrink:0">
          <div class="base ${isRNAPrimer ? 'base-U' : 'base-' + base}" style="opacity:${visible ? 1 : 0.15};outline:${isRNAPrimer && visible ? '2px solid #be185d' : 'none'};transition:opacity 0.25s">${visible && isRNAPrimer ? 'r' + displayText : displayText}</div>
          ${isTip && visible ? html`<div style="position:absolute;bottom:-17px;left:-4px;background:#0891b2;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;white-space:nowrap;font-weight:700">DNA聚合酶III</div>` : ''}
          ${isPrimaseTip && visible ? html`<div style="position:absolute;bottom:-17px;left:-4px;background:#be185d;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;white-space:nowrap;font-weight:700">引物酶</div>` : ''}
          ${showLigase && posInFrag === 0 ? html`<div style="position:absolute;bottom:-17px;left:-10px;background:#166534;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;white-space:nowrap;font-weight:700">连接酶</div>` : ''}
        </div>
      `;
    });

    // Gap markers between Okazaki fragments
    const lagRow = html`
      <div style="display:flex;gap:4px;padding-bottom:20px;padding-top:2px">
        ${complement.map((_b, i) => {
          const ri = n - 1 - i;
          const fragIdx = Math.floor(ri / unitLen);
          const posInFrag = ri % unitLen;
          // Show gap marker between fragments (at boundary, leftmost base of each fragment)
          const isFragStart = posInFrag === unitLen - 1 && fragIdx > 0;
          return html`
            <div style="position:relative;display:inline-flex;flex-shrink:0;flex-direction:column;align-items:center">
              ${isFragStart ? html`<div style="position:absolute;top:0;left:-6px;width:2px;height:100%;border-left:2px dashed #f59e0b;z-index:1"></div>` : ''}
              ${lagBases[i]}
            </div>
          `;
        })}
      </div>
    `;


    return html`
      ${enzymeLegend}
      ${forkDiagram}

      ${seq.length > 8 ? html`<div class="scroll-hint">← 左右拖动查看完整序列 →</div>` : ''}
      <div style="font-size:0.7rem;color:#6b7280;margin-bottom:8px;font-weight:600">▶ 前导链（连续合成，5'→3'）</div>
      <div class="scroll-area" style="margin-bottom:4px" ${ref(el => el && this._setupDragScroll(el))}>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0">前导链 5'→3'</span>
          <div style="display:flex;gap:4px">${leadingBases}</div>
        </div>
        <div style="display:flex;gap:4px;margin:2px 0">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0"></span>
          <div style="display:flex;gap:4px">${seq.map((b, i) => html`
            <div style="width:32px;text-align:center;font-size:${b==='G'||b==='C'?'9':'11'}px;color:#94a3b8;line-height:32px;letter-spacing:-1px;opacity:${i < prog ? 1 : 0.15};transition:opacity 0.25s">${this.hBonds(b)}</div>
          `)}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0">模板链 3'←5'</span>
          <div style="display:flex;gap:4px">${complement.map((b, i) => html`
            <div style="position:relative;width:32px;flex-shrink:0">
              <div class="base base-${b}">${b}</div>
              ${i % 3 === 1 ? html`<div style="position:absolute;top:-13px;left:2px;background:#374151;color:#fff;font-size:7px;padding:0 3px;border-radius:2px;white-space:nowrap">SSB</div>` : ''}
            </div>
          `)}</div>
        </div>
      </div>

      <div style="height:20px;border-left:3px solid #7c3aed;margin-left:84px;position:relative">
        <span style="position:absolute;left:6px;top:2px;font-size:0.65rem;color:#7c3aed;font-weight:700">← 复制叉</span>
      </div>

      <div style="font-size:0.7rem;color:#6b7280;margin-bottom:8px;font-weight:600">▶ 后随链（冈崎片段，不连续合成，5'→3'↩）</div>
      <div class="scroll-area" ${ref(el => el && this._setupDragScroll(el))}>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0">模板链 3'←5'</span>
          <div style="display:flex;gap:4px">${seq.map((b, i) => html`
            <div style="position:relative;width:32px;flex-shrink:0">
              <div class="base base-${b}">${b}</div>
              ${i % 3 === 1 ? html`<div style="position:absolute;top:-13px;left:2px;background:#374151;color:#fff;font-size:7px;padding:0 3px;border-radius:2px;white-space:nowrap">SSB</div>` : ''}
            </div>
          `)}</div>
        </div>
        <div style="display:flex;gap:4px;margin:4px 0">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0"></span>
          <div style="display:flex;gap:4px">${seq.map((b, i) => {
            const ri = n - 1 - i;
            const posInFrag = ri % unitLen;
            const fragIdx = Math.floor(ri / unitLen);
            const fragSynthStart = n - (fragIdx + 1) * unitLen;
            const baseProg = fragSynthStart + posInFrag + 1;
            const visible = prog >= baseProg;
            return html`<div style="width:32px;text-align:center;font-size:${b==='G'||b==='C'?'9':'11'}px;color:#94a3b8;line-height:32px;letter-spacing:-1px;opacity:${visible?1:0.12};transition:opacity 0.25s">${this.hBonds(b)}</div>`;
          })}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;margin-top:4px">
          <span class="strand-label" style="font-size:0.68rem;flex-shrink:0">后随链 5'→3'↩</span>
          ${lagRow}
        </div>
        <div style="font-size:0.65rem;color:#be185d;margin-top:4px;margin-left:84px">
          <span style="background:#fdf2f8;padding:1px 6px;border-radius:3px;border:1px solid #fbcfe8">rX = RNA引物碱基（引物酶合成，后由DNA聚合酶I替换）</span>
          <span style="margin-left:8px;background:#fefce8;padding:1px 6px;border-radius:3px;border:1px solid #fde68a">虚线 = 冈崎片段间隙（连接酶封口）</span>
        </div>
      </div>
    `;
  }

  private renderVisualization() {
    const seq = this.dnaSequence.toUpperCase().split('');

    if (this.phase === 'idle') {
      return html`
        <div class="idle-prompt">选择一个阶段以开始动画演示</div>
      `;
    }

    if (this.phase === 'replication') {
      // complement[i] is the complementary base of seq[i]
      // coding strand: 5'-seq-3' (left to right)
      // template strand: 3'-complement-5' (left to right, antiparallel)
      // new strand from template (leading): 5'→3' left to right = seq sequence
      // new strand from coding (lagging, simplified): 3'→5' overall = complement sequence reversed display
      const complement = seq.map(b => this.getComplement(b));
      const step = this.replicationStep;
      const unwindIdx = this.unwindProgress;
      const helicaseAt = step === 'unwinding' ? unwindIdx : -1;

      // Helper: render a strand row with scroll wrapper
      const strandRow = (label: string, bases: string[], opts: {
        shiftUp?: boolean, shiftDown?: boolean, unwindFade?: boolean,
        synthFade?: boolean, synthProgress?: number,
        polLabel?: string, polPos?: number, polBottom?: boolean,
        hbonds?: boolean, hbondsProgress?: number,
      } = {}) => {
        const { shiftUp, shiftDown, unwindFade, synthFade, synthProgress = 0,
          polLabel, polPos = -1, polBottom, hbonds, hbondsProgress } = opts;
        return html`
          <div class="sequence-row">
            <span class="strand-label" style="font-size:0.68rem;flex-shrink:0">${label}</span>
            <div style="display:flex;gap:4px;flex-shrink:0">
              ${bases.map((b, i) => {
                const separated = unwindFade && i < unwindIdx;
                const visible = synthFade ? i < synthProgress : true;
                const ty = shiftUp && separated ? -20 : shiftDown && separated ? 20 : 0;
                if (hbonds) {
                  // render hydrogen bond dots
                  const fade = hbondsProgress !== undefined ? i < hbondsProgress : false;
                  return html`<div style="width:32px;text-align:center;font-size:${b==='G'||b==='C'?'9':'11'}px;color:#94a3b8;opacity:${fade||separated?0:1};transition:opacity 0.25s ease;line-height:32px;letter-spacing:-1px">${this.hBonds(b)}</div>`;
                }
                return html`
                  <div style="position:relative;transform:translateY(${ty}px);transition:transform 0.3s ease;opacity:${visible?1:0};transition:transform 0.3s ease,opacity 0.25s ease;display:inline-flex;flex-shrink:0">
                    ${this.renderBase(b)}
                    ${i === helicaseAt && step === 'unwinding' && !shiftDown ? html`
                      <div style="position:absolute;top:-17px;left:-2px;background:#7c3aed;color:#fff;font-size:8px;padding:1px 5px;border-radius:3px;white-space:nowrap;font-weight:700">解旋酶</div>
                    ` : ''}
                    ${polLabel && i === polPos ? html`
                      <div style="position:absolute;${polBottom?'bottom':'top'}:-17px;left:-4px;background:#0891b2;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;white-space:nowrap;font-weight:700">${polLabel}</div>
                    ` : ''}
                  </div>
                `;
              })}
            </div>
          </div>
        `;
      };

      return html`
        <div style="width:100%">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <button class="start-btn" ?disabled=${step !== 'initial'} @click=${() => this.startUnwinding()}>
              ${step === 'initial' ? '① 开始解旋' : step === 'unwinding' ? '解旋中...' : '✓ 解旋完成'}
            </button>
            ${step === 'unwound' ? html`
              <button class="start-btn" ?disabled=${this.synthesisStep !== 'idle'} @click=${() => this.startSynthesis()}>
                ${this.synthesisStep === 'idle' ? '② 开始新链合成' : this.synthesisStep === 'running' ? '合成中...' : '✓ 合成完成'}
              </button>
            ` : ''}
            <button class="start-btn" style="background:#6b7280" @click=${() => this.resetReplication()}>重置</button>
          </div>

          <!-- Original double helix -->
          ${seq.length > 8 ? html`<div class="scroll-hint">← 左右拖动查看完整序列 →</div>` : ''}
          <div class="scroll-area" style="min-height:160px" ${ref(el => el && this._setupDragScroll(el))}>
            <!-- coding strand 5'→3' -->
            ${strandRow("编码链 5'→3'", seq, { shiftUp: true, unwindFade: true })}
            <!-- H-bonds (AT=2, GC=3) -->
            ${strandRow('', seq, { hbonds: true, unwindFade: true })}
            <!-- template strand 3'→5' (displayed L→R same as coding for alignment) -->
            ${strandRow("模板链 3'←5'", complement, { shiftDown: true, unwindFade: true })}
          </div>

          <!-- After unwinding: new strand synthesis -->
          ${step === 'unwound' ? html`
            <div style="margin-top:14px;border-top:1px dashed #e5e7eb;padding-top:10px">
              ${this.renderReplicationFork(seq, complement)}
            </div>
          ` : ''}
        </div>
      `;
    }

    if (this.phase === 'transcription') {
      const template = seq.map(b => this.getComplement(b));
      const mRNA = seq.map(b => this.getComplement(b, true));
      const prog = this.transcriptionProgress;
      // Transcription bubble: bases within 2 positions behind RNAP are locally unwound
      const BUBBLE_HALF = 2;

      const resetTranscription = () => {
        this.transcriptionStep = 'idle';
        this.transcriptionProgress = 0;
        this.polymerasePos = -1;
        this.showSigmaFactor = true;
        this.showTermination = false;
        this.showProcessing = false;
        this.processingStep = 'none';
        if (this._transcriptionTimer) clearTimeout(this._transcriptionTimer);
        if (this._processingTimer) clearTimeout(this._processingTimer);
      };

      // Task 13: post-processing panel
      const processingPanel = this.showProcessing ? html`
        <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#f9fafb">
          <div style="font-size:0.75rem;font-weight:600;color:#111827;margin-bottom:8px">转录后加工（真核生物）</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <!-- 5' cap -->
            <div style="display:flex;align-items:center;gap:8px;opacity:${['cap','polya','splicing','done'].includes(this.processingStep) ? 1 : 0.2};transition:opacity 0.4s">
              <div style="background:#2563eb;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0">5' 帽</div>
              <div style="font-size:0.72rem;color:#374151">7-甲基鸟苷帽加到 5' 末端 → 保护 mRNA、辅助核糖体识别</div>
              ${this.processingStep === 'cap' ? html`<div style="font-size:9px;color:#2563eb;animation:blink 0.8s infinite">◀ 进行中</div>` : ''}
            </div>
            <!-- 3' polyA -->
            <div style="display:flex;align-items:center;gap:8px;opacity:${['polya','splicing','done'].includes(this.processingStep) ? 1 : 0.2};transition:opacity 0.4s">
              <div style="background:#7c3aed;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0">3' polyA</div>
              <div style="font-size:0.72rem;color:#374151">加poly(A)尾（~200个腺苷酸）→ 稳定性 & 出核</div>
              ${this.processingStep === 'polya' ? html`<div style="font-size:9px;color:#7c3aed;animation:blink 0.8s infinite">◀ 进行中</div>` : ''}
            </div>
            <!-- Splicing -->
            <div style="display:flex;align-items:center;gap:8px;opacity:${['splicing','done'].includes(this.processingStep) ? 1 : 0.2};transition:opacity 0.4s">
              <div style="background:#d97706;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0">RNA剪接</div>
              <div style="font-size:0.72rem;color:#374151">剪接体切除<span style="color:#ef4444;font-weight:600">内含子</span>，拼接<span style="color:#16a34a;font-weight:600">外显子</span> → 成熟 mRNA</div>
              ${this.processingStep === 'splicing' ? html`<div style="font-size:9px;color:#d97706;animation:blink 0.8s infinite">◀ 进行中</div>` : ''}
            </div>
            ${this.processingStep === 'done' ? html`
              <div style="margin-top:4px;display:flex;align-items:center;gap:6px;font-size:0.72rem;color:#16a34a;font-weight:600">
                <span>✓ 成熟 mRNA 完成，可出核进行翻译</span>
              </div>
              <!-- Simplified mRNA with exons/introns visualized -->
              <div style="margin-top:6px;display:flex;align-items:center;gap:2px;flex-wrap:wrap">
                <span style="font-size:0.65rem;color:#6b7280;margin-right:4px">成熟mRNA:</span>
                ${mRNA.map((b, i) => {
                  const isIntron = i % 4 === 3; // every 4th base simulates intron removed
                  return isIntron ? '' : html`<div class="base base-${b}" style="font-size:9px;width:24px;height:24px;line-height:24px">${b}</div>`;
                })}
              </div>
            ` : ''}
          </div>
        </div>
      ` : '';

      return html`
        <div style="width:100%">
          <!-- task 11: σ factor / TFIID before start -->
          ${this.showSigmaFactor ? html`
            <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:6px">
              <div style="background:#d97706;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px">σ因子 / TFIID</div>
              <span style="font-size:0.72rem;color:#92400e">转录起始因子已结合启动子（−10/−35 区），RNA聚合酶招募中</span>
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <button
              class="start-btn"
              ?disabled=${this.transcriptionStep !== 'idle'}
              @click=${() => this.startTranscription()}
            >${this.transcriptionStep === 'idle' ? '开始转录' : this.transcriptionStep === 'running' ? '转录中...' : '✓ 转录完成'}</button>
            ${this.transcriptionStep !== 'idle' ? html`
              <button class="start-btn" style="background:#6b7280" @click=${resetTranscription}>重置</button>
            ` : ''}
          </div>

          ${seq.length > 8 ? html`<div class="scroll-hint">← 左右拖动查看完整序列 →</div>` : ''}
          <div class="scroll-area" ${ref(el => el && this._setupDragScroll(el))}>
            <!-- Coding strand (non-template) 5'→3' -->
            <div class="sequence-row" style="margin-top:8px">
              <span class="strand-label">5' 编码链</span>
              ${seq.map((b, i) => {
                const inBubble = prog > 0 && i >= prog - BUBBLE_HALF && i < prog && this.transcriptionStep === 'running';
                return html`
                  <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center">
                    <div class="base base-${b}" style="outline:${inBubble ? '2px solid #f59e0b' : 'none'};outline-offset:1px">${b}</div>
                    ${inBubble ? html`<div style="font-size:7px;color:#f59e0b;line-height:1;margin-top:1px">~</div>` : ''}
                  </div>
                `;
              })}
            </div>

            <!-- Template strand 3'→5' with RNAP marker and bubble -->
            <div class="sequence-row" style="margin-top:4px">
              <span class="strand-label">3' 模板链</span>
              ${template.map((b, i) => {
                const isRNAP = i === this.polymerasePos && this.transcriptionStep === 'running';
                const inBubble = prog > 0 && i >= prog - BUBBLE_HALF && i < prog && this.transcriptionStep === 'running';
                return html`
                  <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center">
                    ${isRNAP ? html`
                      <div style="position:absolute;top:-20px;left:-8px;width:48px;height:15px;background:#3b82f6;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">RNAP</div>
                    ` : ''}
                    <div class="base base-${b}" style="outline:${inBubble ? '2px solid #f59e0b' : 'none'};outline-offset:1px">${b}</div>
                    ${inBubble ? html`<div style="font-size:7px;color:#f59e0b;line-height:1;margin-top:1px">~</div>` : ''}
                  </div>
                `;
              })}
            </div>

            <!-- mRNA growing 5'→3' -->
            <div class="sequence-row" style="margin-top:4px">
              <span class="strand-label">mRNA 5'→3'</span>
              ${mRNA.map((b, i) => html`
                <div style="opacity:${i < prog ? 1 : 0};transition:opacity 0.2s ease;display:inline-flex">
                  ${this.renderBase(b)}
                </div>
              `)}
            </div>

            <!-- Bubble legend -->
            ${this.transcriptionStep === 'running' ? html`
              <div style="margin-top:6px;margin-left:84px;font-size:0.65rem;color:#92400e">
                <span style="background:#fef3c7;padding:1px 6px;border-radius:3px;border:1px solid #fde68a">~ 黄色框 = 转录泡（局部解链区域，约17 bp）</span>
              </div>
            ` : ''}

            <!-- task 12: termination signal -->
            ${this.showTermination ? html`
              <div style="margin-top:8px;margin-left:84px;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fee2e2;border:1px solid #fca5a5;border-radius:6px">
                <div style="background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px">终止信号</div>
                <span style="font-size:0.72rem;color:#991b1b">RNA聚合酶识别终止子序列，转录终止，mRNA与模板链解离</span>
              </div>
            ` : ''}
          </div>

          <!-- task 13: post-transcriptional processing -->
          ${processingPanel}
        </div>
      `;
    }

    if (this.phase === 'translation' || this.phase === 'completed') {
      const mRNA = seq.map(b => this.getComplement(b, true));
      const totalCodons = Math.floor(mRNA.length / 3);
      const isRunning = this.translationStep === 'running';

      const resetTranslation = () => {
        this.translationStep = 'idle';
        this.ribosomeCodon = 0;
        this.aminoAcids = [];
        this.tRNACodon = '';
        this.tRNAAmino = '';
        this.polyRibosomes = [];
        if (this._translationTimer) clearTimeout(this._translationTimer);
      };

      // task 17: classify each codon index
      const startCodon = mRNA.slice(0, 3).join('') === 'AUG' ? 0 : -1;
      const stopCodons = new Set<number>();
      for (let i = 0; i < totalCodons; i++) {
        const c = mRNA.slice(i * 3, i * 3 + 3).join('');
        if (c === 'UAA' || c === 'UAG' || c === 'UGA') stopCodons.add(i);
      }

      // Ribosome site codon indices
      const aIdx = this.ribosomeCodon;      // A site: next to be decoded
      const pIdx = this.ribosomeCodon - 1;  // P site: current peptidyl-tRNA
      const eIdx = this.ribosomeCodon - 2;  // E site: exiting tRNA

      return html`
        <div style="width:100%">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <button
              class="start-btn"
              ?disabled=${this.translationStep !== 'idle'}
              @click=${() => this.startTranslation()}
            >${this.translationStep === 'idle' ? '开始翻译' : isRunning ? '翻译中...' : '✓ 翻译完成'}</button>
            ${this.translationStep !== 'idle' ? html`
              <button class="start-btn" style="background:#6b7280" @click=${resetTranslation}>重置</button>
            ` : ''}
          </div>

          <!-- task 16: polyribosome indicator -->
          ${isRunning && this.polyRibosomes.length > 0 ? html`
            <div style="margin-bottom:8px;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px">
              <div style="background:#ea580c;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px">多聚核糖体</div>
              <span style="font-size:0.72rem;color:#9a3412">第二个核糖体已进入mRNA，同时翻译同一条链（polyribosome）</span>
            </div>
          ` : ''}

          <!-- task 15: tRNA display at A site -->
          ${isRunning && this.tRNAAmino ? html`
            <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px">
              <div style="background:#16a34a;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px">tRNA</div>
              <div style="font-size:0.72rem;color:#166534">
                A位点 · 反密码子 <strong>${this.tRNACodon}</strong> · 携带氨基酸：<strong>${this.tRNAAmino}</strong>
              </div>
              <!-- simplified tRNA cloverleaf symbol -->
              <div style="font-size:18px;line-height:1" title="tRNA">☘</div>
            </div>
          ` : ''}

          <!-- mRNA with ribosome A/P/E sites -->
          ${mRNA.length > 8 ? html`<div class="scroll-hint">← 左右拖动查看完整序列 →</div>` : ''}
          <div class="scroll-area" ${ref(el => el && this._setupDragScroll(el))}>
            <!-- A/P/E site labels above ribosome -->
            ${isRunning ? html`
              <div style="display:flex;margin-left:84px;margin-bottom:2px">
                ${Array.from({length: totalCodons}, (_, i) => {
                  const isA = i === aIdx, isP = i === pIdx, isE = i === eIdx;
                  const poly = this.polyRibosomes.includes(i);
                  const label = isA ? 'A' : isP ? 'P' : isE ? 'E' : poly ? 'A₂' : '';
                  const bg = isA ? '#3b82f6' : isP ? '#8b5cf6' : isE ? '#6b7280' : poly ? '#ea580c' : 'transparent';
                  return html`
                    <div style="width:${3*36}px;text-align:center">
                      ${label ? html`<div style="background:${bg};color:#fff;font-size:8px;font-weight:700;border-radius:3px;padding:1px 0">${label}位</div>` : ''}
                    </div>
                  `;
                })}
              </div>
            ` : ''}

            <div class="sequence-row" style="margin-top:4px">
              <span class="strand-label">mRNA</span>
              ${mRNA.map((b, i) => {
                const codonIdx = Math.floor(i / 3);
                // task 14: color by A/P/E site
                const isA = isRunning && codonIdx === aIdx;
                const isP = isRunning && codonIdx === pIdx;
                const isE = isRunning && codonIdx === eIdx;
                const isPoly = isRunning && this.polyRibosomes.includes(codonIdx);
                // task 17: start/stop codon outline
                const isStart = codonIdx === startCodon;
                const isStop = stopCodons.has(codonIdx);
                let outline = 'none';
                if (isStart && this.translationStep !== 'idle') outline = '2px solid #16a34a';
                if (isStop) outline = '2px solid #dc2626';
                // ribosome site tint
                let siteBg = '';
                if (isA) siteBg = 'rgba(59,130,246,0.15)';
                else if (isP) siteBg = 'rgba(139,92,246,0.15)';
                else if (isE) siteBg = 'rgba(107,114,128,0.15)';
                else if (isPoly) siteBg = 'rgba(234,88,12,0.12)';
                return html`
                  <div style="position:relative;display:inline-flex;background:${siteBg};border-radius:4px;outline:${outline};outline-offset:1px">
                    ${this.renderBase(b)}
                    ${isA && i % 3 === 1 ? html`
                      <div style="position:absolute;top:-20px;left:-8px;width:48px;height:15px;background:#3b82f6;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">核糖体</div>
                    ` : ''}
                    ${isPoly && i % 3 === 1 ? html`
                      <div style="position:absolute;top:-20px;left:-8px;width:48px;height:15px;background:#ea580c;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:600">核糖体₂</div>
                    ` : ''}
                  </div>
                `;
              })}
            </div>

            <!-- codon labels with start/stop annotation -->
            <div style="display:flex;margin-left:84px;margin-top:2px">
              ${Array.from({length: totalCodons}, (_, i) => {
                const codon = mRNA.slice(i*3, i*3+3).join('');
                const isStart = i === startCodon;
                const isStop = stopCodons.has(i);
                return html`
                  <div style="width:${3*36}px;font-size:9px;text-align:center;border-left:1px dashed #e5e7eb;padding-top:2px">
                    <div style="color:${isStart ? '#16a34a' : isStop ? '#dc2626' : '#6b7280'};font-weight:${isStart||isStop ? '700' : '400'}">${codon}</div>
                    ${isStart ? html`<div style="font-size:7px;color:#16a34a">起始</div>` : ''}
                    ${isStop ? html`<div style="font-size:7px;color:#dc2626">终止</div>` : ''}
                  </div>
                `;
              })}
            </div>

            <!-- A/P/E legend -->
            <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
              <span style="font-size:0.65rem;background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:3px">A位 = 氨酰位（解码）</span>
              <span style="font-size:0.65rem;background:#ede9fe;color:#5b21b6;padding:1px 6px;border-radius:3px">P位 = 肽酰位（肽键形成）</span>
              <span style="font-size:0.65rem;background:#f3f4f6;color:#374151;padding:1px 6px;border-radius:3px">E位 = 出口位（tRNA离开）</span>
            </div>
          </div>

          <!-- amino acid chain -->
          ${this.aminoAcids.length > 0 ? html`
            <div style="margin-top:12px;border-top:1px dashed #e5e7eb;padding-top:8px">
              <div style="font-size:0.75rem;color:#6b7280;margin-bottom:6px">蛋白质链：</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${this.aminoAcids.map((aa, i) => html`
                  <div style="
                    background:${aa.includes('Stop') ? '#fee2e2' : '#f0fdf4'};
                    color:${aa.includes('Stop') ? '#dc2626' : '#166534'};
                    border:1px solid ${aa.includes('Stop') ? '#fca5a5' : '#86efac'};
                    border-radius:6px;padding:3px 8px;font-size:0.75rem;
                    animation:fadeIn 0.3s ease;
                  ">${i+1}. ${aa}</div>
                `)}
              </div>
            </div>
          ` : ''}

          ${this.translationStep === 'done' ? html`
            <div style="margin-top:12px;font-size:0.8rem;color:#166534;font-weight:600">翻译完成！共合成 ${this.aminoAcids.length} 个氨基酸。</div>
          ` : ''}
        </div>
      `;
    }

    return html``;
  }

  private startTranscription(resume = false) {
    if (!resume && this.transcriptionStep !== 'idle') return;
    if (!resume) {
      this.transcriptionStep = 'running';
      this.transcriptionProgress = 0;
      this.polymerasePos = 0;
      this.showSigmaFactor = false; // σ factor released once elongation begins
      this.showTermination = false;
      this.showProcessing = false;
      this.processingStep = 'none';
    }
    const total = this.dnaSequence.length;
    const interval = Math.max(200, this.animationInterval / total * 3);
    const tick = () => {
      if (this.isPaused) return;
      this.transcriptionProgress++;
      this.polymerasePos = this.transcriptionProgress;
      if (this.transcriptionProgress >= total) {
        this.transcriptionStep = 'done';
        this.polymerasePos = total;
        this.showTermination = true; // task 12: show termination signal
        // task 13: start post-transcriptional processing sequence
        this._startPostProcessing();
        this.dispatchEvent(new CustomEvent('a2ui-action', {
          bubbles: true, composed: true,
          detail: { action: 'transcription-complete' },
        }));
      } else {
        this._transcriptionTimer = setTimeout(tick, interval);
      }
    };
    this._transcriptionTimer = setTimeout(tick, interval);
  }

  private _startPostProcessing() {
    const delay = Math.max(600, this.animationInterval * 0.8);
    this.processingStep = 'cap';
    this.showProcessing = true;
    this._processingTimer = setTimeout(() => {
      this.processingStep = 'polya';
      this._processingTimer = setTimeout(() => {
        this.processingStep = 'splicing';
        this._processingTimer = setTimeout(() => {
          this.processingStep = 'done';
        }, delay);
      }, delay);
    }, delay);
  }

  private startTranslation(resume = false) {
    if (!resume && this.translationStep !== 'idle') return;
    if (!resume) {
      this.translationStep = 'running';
      this.ribosomeCodon = 0;
      this.aminoAcids = [];
      this.tRNACodon = '';
      this.tRNAAmino = '';
      this.polyRibosomes = [];
    }
    const mRNA = this.dnaSequence.toUpperCase().split('').map(b => this.getComplement(b, true));
    const totalCodons = Math.floor(mRNA.length / 3);
    const interval = Math.max(400, this.animationInterval / totalCodons * 4);
    // Polyribosome: a second ribosome trails 2 codons behind
    const POLY_GAP = 2;
    const tick = () => {
      if (this.isPaused) return;
      const codonSeq = mRNA.slice(this.ribosomeCodon * 3, this.ribosomeCodon * 3 + 3).join('');
      const aa = CentralDogma.CODON_TABLE[codonSeq] ?? '未知';
      // task 15: set tRNA anticodon (complement of codon) and amino acid
      this.tRNAAmino = aa;
      this.tRNACodon = codonSeq.split('').map(b =>
        b === 'A' ? 'U' : b === 'U' ? 'A' : b === 'G' ? 'C' : 'G'
      ).join('');
      this.aminoAcids = [...this.aminoAcids, aa];
      this.ribosomeCodon++;
      // task 16: polyribosome — trailing ribosome enters once leader is 2+ codons ahead
      if (this.ribosomeCodon >= POLY_GAP) {
        this.polyRibosomes = [this.ribosomeCodon - POLY_GAP];
      }
      if (this.ribosomeCodon >= totalCodons || aa.includes('Stop')) {
        this.translationStep = 'done';
        this.tRNACodon = '';
        this.tRNAAmino = '';
        this.polyRibosomes = [];
        this.dispatchEvent(new CustomEvent('a2ui-action', {
          bubbles: true, composed: true,
          detail: { action: 'translation-complete', aminoAcids: this.aminoAcids },
        }));
      } else {
        this._translationTimer = setTimeout(tick, interval);
      }
    };
    this._translationTimer = setTimeout(tick, interval);
  }

  private setPhase(p: typeof this.phase) {
    if (this.isAnimating || this.isPaused) return;
    if (this._unwindTimer) clearTimeout(this._unwindTimer);
    if (this._synthesisTimer) clearTimeout(this._synthesisTimer);
    if (this._transcriptionTimer) clearTimeout(this._transcriptionTimer);
    if (this._translationTimer) clearTimeout(this._translationTimer);
    this.replicationStep = 'initial';
    this.unwindProgress = 0;
    this.synthesisStep = 'idle';
    this.synthesisProgress = 0;
    this.transcriptionStep = 'idle';
    this.transcriptionProgress = 0;
    this.polymerasePos = -1;
    this.showSigmaFactor = true;
    this.showTermination = false;
    this.showProcessing = false;
    this.processingStep = 'none';
    if (this._processingTimer) clearTimeout(this._processingTimer);
    this.translationStep = 'idle';
    this.ribosomeCodon = 0;
    this.aminoAcids = [];
    this.tRNACodon = '';
    this.tRNAAmino = '';
    this.polyRibosomes = [];
    this.phase = p;
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      bubbles: true, composed: true,
      detail: { action: 'phase-change', phase: p },
    }));
  }

  private handleSequenceInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const val = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    if (input.value && val !== input.value.toUpperCase()) {
      this.seqError = 'DNA序列只能包含 A/T/C/G 字符';
    } else {
      this.seqError = '';
    }
    this.dnaSequence = val;
  }

  render() {
    type PhaseKey = 'idle' | 'replication' | 'transcription' | 'translation' | 'completed';
    const phases: Array<{ key: PhaseKey; label: string }> = [
      { key: 'replication', label: 'DNA 复制' },
      { key: 'transcription', label: '转录' },
      { key: 'translation', label: '翻译' },
    ];

    console.log('[CentralDogma] render() - phase:', this.phase, 'isAnimating:', this.isAnimating, 'isPaused:', this.isPaused, 'dnaSequence:', this.dnaSequence);

    return html`
      <div class="header">中心法则演示</div>

      <div class="sequence-input">
        <input
          type="text"
          .value=${this.dnaSequence}
          @input=${this.handleSequenceInput}
          placeholder="输入 DNA 序列 (A/T/C/G)"
          maxlength="20"
          style="border-color:${this.seqError ? '#ef4444' : ''}"
        />
      </div>
      ${this.seqError ? html`<div style="font-size:0.75rem;color:#ef4444;margin-bottom:8px">${this.seqError}</div>` : ''}

      <div class="phase-controls" role="group" aria-label="阶段选择">
        ${phases.map(p => html`
          <button
            class="phase-btn ${this.phase === p.key ? 'active' : ''}"
            aria-pressed="${this.phase === p.key}"
            ?disabled=${this.isAnimating || this.isPaused}
            @click=${() => this.setPhase(p.key)}
          >${p.label}</button>
        `)}
      </div>

      ${this.isAnimating || this.isPaused ? html`
        <div class="controls-bar" aria-label="动画控制">
          <button
            class="pause-btn ${this.isPaused ? 'paused' : ''}"
            aria-label="${this.isPaused ? '继续' : '暂停'}"
            @click=${() => this.togglePause()}
          >${this.isPaused ? '▶ 继续' : '⏸ 暂停'}</button>
          <span class="speed-label">速度</span>
          <button
            class="pause-btn ${this.fastSlow === 'slow' ? 'paused' : ''}"
            @click=${() => { this._animationSpeed = 1500; this.requestUpdate('animationSpeed', this._animationSpeed); }}
          >慢速</button>
          <button
            class="pause-btn ${this.fastSlow === 'fast' ? 'paused' : ''}"
            @click=${() => { this._animationSpeed = 500; this.requestUpdate('animationSpeed', this._animationSpeed); }}
          >快速</button>
        </div>
      ` : ''}

      <div class="visualization">
        ${this.renderVisualization()}
      </div>
    `;
  }
}
