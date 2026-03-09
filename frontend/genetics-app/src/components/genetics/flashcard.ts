import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('genetics-flashcard')
export class Flashcard extends LitElement {
  @property({ type: String }) front: string = '';
  @property({ type: String }) back: string = '';
  @property({ type: String }) category: string = '';

  @state()
  private _flipped = false;

  static styles = css`
    :host {
      display: block;
      perspective: 1000px;
      width: 100%;
      max-width: 340px;
      min-width: 280px;
      margin: 0 auto 12px auto;
    }

    .flashcard-container {
      width: 100%;
      height: 320px;
      position: relative;
      cursor: pointer;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .flashcard-container.flipped {
      transform: rotateY(180deg);
    }

    .flashcard-face {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .flashcard-front {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .flashcard-back {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      transform: rotateY(180deg);
    }

    .flashcard-category {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .flashcard-category::before {
      content: "";
      width: 8px;
      height: 8px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.6;
    }

    .flashcard-content {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 14px;
      line-height: 1.5;
      font-weight: 500;
      overflow-y: auto;
      padding: 8px;
    }

    .flashcard-front .flashcard-content {
      font-size: 16px;
      font-weight: 600;
    }

    .flashcard-back .flashcard-content {
      font-size: 13px;
      line-height: 1.45;
      text-align: left;
      align-items: flex-start;
    }

    .flashcard-hint {
      font-size: 11px;
      opacity: 0.7;
      text-align: center;
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .flashcard-hint .icon {
      font-size: 16px;
    }

    .flashcard-container:hover {
      transform: scale(1.02);
    }

    .flashcard-container.flipped:hover {
      transform: rotateY(180deg) scale(1.02);
    }

    .label-front,
    .label-back {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
    }
  `;

  private handleClick() {
    this._flipped = !this._flipped;
  }

  render() {
    return html`
      <div
        class="flashcard-container ${this._flipped ? 'flipped' : ''}"
        @click="${this.handleClick}"
      >
        <div class="flashcard-face flashcard-front">
          <span class="label-front">问题</span>
          ${this.category
            ? html`<div class="flashcard-category">${this.category}</div>`
            : ''}
          <div class="flashcard-content">${this.front}</div>
          <div class="flashcard-hint">
            <span class="icon">↻</span>
            点击查看答案
          </div>
        </div>
        <div class="flashcard-face flashcard-back">
          <span class="label-back">答案</span>
          ${this.category
            ? html`<div class="flashcard-category">${this.category}</div>`
            : ''}
          <div class="flashcard-content">${this.back}</div>
          <div class="flashcard-hint">
            <span class="icon">↻</span>
            点击查看问题
          </div>
        </div>
      </div>
    `;
  }
}
