import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

interface ComponentData {
  Text?: { text: string; fontSize?: number; fontWeight?: string; textAlign?: string; color?: string; margin?: any };
  Header?: { text: string; fontSize?: number; fontWeight?: string; textAlign?: string; color?: string; margin?: any };
  Button?: { text: string; onClick?: string };
  PunnettSquare?: { parent1Genotype?: any; parent2Genotype?: any; trait?: any; showPhenotype?: any };
  DNAStructure?: { sequence?: any; showLabels?: any; highlightRegions?: any };
  PhenotypeDistribution?: { trait?: any; data?: any; totalCount?: any; showPercentage?: any };
  GeneExpression?: { genes?: any; expressionLevels?: any; conditions?: any };
  PedigreeChart?: { generations?: any; trait?: any; diseaseName?: any; inheritancePattern?: any; showLegend?: any };
  CrossOverMap?: { chromosomeLength?: any; genes?: any; crossoverPoints?: any; labelChromosomes?: any; showRecombinationFreq?: any };
  Flashcard?: { front?: any; back?: any; category?: any };
  Container?: { children?: any[] };
  Row?: { children?: any[] };
  Column?: { children?: any[] };
  CentralDogma?: { dnaSequence?: any; animationSpeed?: any; phase?: any };
  MendelSimulator?: { parent1Genotype?: any; parent2Genotype?: any; traitType?: any; simulationCount?: any; interactive?: any };
  NaturalSelectionSimulator?: { populationSize?: any; initialDarkFrequency?: any; environmentColor?: any; generations?: any; interactive?: any };
}

export class A2UIManager {
  #surfaceElements: Map<string, HTMLElement> = new Map();
  #dataModel: Map<string, any> = new Map();

  constructor() {}

  handleMessage(message: any): void {
    if (!message || typeof message !== 'object') {
      return;
    }

    if (message.beginRendering) {
      this.handleBeginRendering(message.beginRendering);
    } else if (message.surfaceUpdate) {
      this.handleSurfaceUpdate(message.surfaceUpdate);
    } else if (message.dataModelUpdate) {
      this.handleDataModelUpdate(message.dataModelUpdate);
    } else if (message.deleteSurface) {
      this.handleDeleteSurface(message.deleteSurface);
    }
  }

  private handleBeginRendering(data: any): void {
    const container = document.createElement('div');
    container.className = 'a2ui-surface';
    container.id = `surface-${data.surfaceId}`;
    
    if (data.root) {
      container.setAttribute('data-root', data.root);
    }
    
    this.#surfaceElements.set(data.surfaceId, container);
  }

  private handleSurfaceUpdate(data: any): void {
    let container = this.#surfaceElements.get(data.surfaceId);

    if (!container) {
      container = document.createElement('div');
      container.className = 'a2ui-surface';
      container.id = `surface-${data.surfaceId}`;
      this.#surfaceElements.set(data.surfaceId, container);
    }

    if (data.components && Array.isArray(data.components)) {
      data.components.forEach((comp: any, index: number) => {
        try {
          const child = this.renderComponent(comp.component);
          if (child instanceof HTMLElement) {
            container.appendChild(child);
          } else {
            console.error('renderComponent did not return an HTMLElement for:', comp);
            const wrapper = document.createElement('div');
            wrapper.textContent = `Invalid component: ${JSON.stringify(comp)}`;
            container.appendChild(wrapper);
          }
        } catch (error) {
          console.error('Error rendering component at index', index, error);
        }
      });
    }
  }

  private handleDataModelUpdate(data: any): void {
    console.log('Data model update:', data);
    if (data.surfaceId && data.contents) {
      for (const entry of data.contents) {
        const key = data.path ? `${data.path}/${entry.key}` : entry.key;
        if (entry.valueString !== undefined) {
          this.#dataModel.set(key, entry.valueString);
        } else if (entry.valueNumber !== undefined) {
          this.#dataModel.set(key, entry.valueNumber);
        } else if (entry.valueBoolean !== undefined) {
          this.#dataModel.set(key, entry.valueBoolean);
        } else if (entry.valueMap !== undefined) {
          this.#dataModel.set(key, entry.valueMap);
        }
      }
    }
  }

  private handleDeleteSurface(data: any): void {
    const container = this.#surfaceElements.get(data.surfaceId);
    if (container) {
      container.remove();
      this.#surfaceElements.delete(data.surfaceId);
    }
  }

  private resolveProperty(prop: any): any {
    if (prop === null || prop === undefined) {
      return prop;
    }
    
    if (typeof prop !== 'object') {
      return prop;
    }

    if (prop.literalString !== undefined) {
      return prop.literalString;
    }
    if (prop.literalNumber !== undefined) {
      return prop.literalNumber;
    }
    if (prop.literalBoolean !== undefined) {
      return prop.literalBoolean;
    }
    if (prop.literalArray !== undefined) {
      return prop.literalArray;
    }
    if (prop.path !== undefined) {
      return this.getDataFromPath(prop.path);
    }

    return prop;
  }

  private getDataFromPath(path: string): any {
    if (!path || path === '/') {
      return null;
    }

    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const parts = normalizedPath.split('/').filter(p => p);

    let current: any = this.#dataModel;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  private renderComponent(componentData: ComponentData): HTMLElement {
    if (!componentData || typeof componentData !== 'object') {
      console.error('Invalid componentData:', componentData);
      const errorDiv = document.createElement('div');
      errorDiv.textContent = 'Invalid component data';
      return errorDiv;
    }

    const keys = Object.keys(componentData);
    
    const componentName = keys[0] as keyof ComponentData;
    if (!componentName) {
      console.error('No component name found in componentData:', componentData);
      const errorDiv = document.createElement('div');
      errorDiv.textContent = 'No component name found';
      return errorDiv;
    }

    const props = componentData[componentName] as any;

    try {
      switch (componentName) {
        case 'Text': {
          const element = document.createElement('div');
          element.style.cssText = this.getTextStyle(props);
          element.textContent = this.resolveProperty(props.text) || '';
          return element;
        }
        case 'Header': {
          const element = document.createElement('h2');
          element.style.cssText = this.getHeaderStyle(props);
          element.textContent = this.resolveProperty(props.text) || '';
          return element;
        }
        case 'Button': {
          const element = document.createElement('button');
          element.style.cssText = this.getButtonStyle();
          element.textContent = props.text || '';
          if (props.onClick) {
            element.addEventListener('click', () => this.handleButtonClick(props.onClick));
          }
          return element;
        }
        case 'PunnettSquare': {
          const element = document.createElement('punnett-square');
          if (props.parent1Genotype) (element as any).parent1Genotype = this.resolveProperty(props.parent1Genotype);
          if (props.parent2Genotype) (element as any).parent2Genotype = this.resolveProperty(props.parent2Genotype);
          if (props.trait) (element as any).trait = this.resolveProperty(props.trait);
          if (props.showPhenotype !== undefined) (element as any).showPhenotype = this.resolveProperty(props.showPhenotype);
          return element;
        }
        case 'DNAStructure': {
          const element = document.createElement('dna-structure');
          if (props.sequence) (element as any).sequence = this.resolveProperty(props.sequence);
          if (props.showLabels !== undefined) (element as any).showLabels = this.resolveProperty(props.showLabels);
          if (props.highlightRegions) (element as any).highlightRegions = this.resolveProperty(props.highlightRegions);
          return element;
        }
        case 'PhenotypeDistribution': {
          const element = document.createElement('phenotype-distribution');
          if (props.trait) (element as any).trait = this.resolveProperty(props.trait);
          if (props.data) (element as any).data = this.resolveProperty(props.data);
          if (props.totalCount) (element as any).totalCount = this.resolveProperty(props.totalCount);
          if (props.showPercentage !== undefined) (element as any).showPercentage = this.resolveProperty(props.showPercentage);
          return element;
        }
        case 'GeneExpression': {
          const element = document.createElement('gene-expression');
          if (props.genes) (element as any).genes = this.resolveProperty(props.genes);
          if (props.expressionLevels) (element as any).expressionLevels = this.resolveProperty(props.expressionLevels);
          if (props.conditions) (element as any).conditions = this.resolveProperty(props.conditions);
          return element;
        }
        case 'PedigreeChart': {
          const element = document.createElement('pedigree-chart');
          if (props.generations) (element as any).generations = this.resolveProperty(props.generations);
          if (props.trait) (element as any).trait = this.resolveProperty(props.trait);
          if (props.diseaseName) (element as any).diseaseName = this.resolveProperty(props.diseaseName);
          if (props.inheritancePattern) (element as any).inheritancePattern = this.resolveProperty(props.inheritancePattern);
          if (props.showLegend !== undefined) (element as any).showLegend = this.resolveProperty(props.showLegend);
          return element;
        }
        case 'CrossOverMap': {
          const element = document.createElement('crossover-map');
          if (props.chromosomeLength) (element as any).chromosomeLength = this.resolveProperty(props.chromosomeLength);
          if (props.genes) (element as any).genes = this.resolveProperty(props.genes);
          if (props.crossoverPoints) (element as any).crossoverPoints = this.resolveProperty(props.crossoverPoints);
          if (props.labelChromosomes !== undefined) (element as any).labelChromosomes = this.resolveProperty(props.labelChromosomes);
          if (props.showRecombinationFreq !== undefined) (element as any).showRecombinationFreq = this.resolveProperty(props.showRecombinationFreq);
          return element;
        }
        case 'Flashcard': {
          const element = document.createElement('genetics-flashcard');
          if (props.front) (element as any).front = this.resolveProperty(props.front);
          if (props.back) (element as any).back = this.resolveProperty(props.back);
          if (props.category) (element as any).category = this.resolveProperty(props.category);
          return element;
        }
        case 'Container': {
        const element = document.createElement('div');
        element.style.cssText = this.getContainerStyle();
        if (props.children && Array.isArray(props.children)) {
          props.children.forEach((c: any) => {
            try {
              const childComponentData = c.component || c;
              const child = this.renderComponent(childComponentData);
              element.appendChild(child);
            } catch (childError) {
              console.error('Error rendering child component:', childError, c);
            }
          });
        }
        return element;
      }
        case 'Row': {
        const element = document.createElement('div');
        element.style.display = 'flex';
        element.style.flexDirection = 'row';
        element.style.gap = '8px';
        if (props.children && Array.isArray(props.children)) {
          props.children.forEach((c: any) => {
            try {
              const childComponentData = c.component || c;
              const child = this.renderComponent(childComponentData);
              element.appendChild(child);
            } catch (childError) {
              console.error('Error rendering child component:', childError, c);
            }
          });
        }
        return element;
      }
        case 'Column': {
        const element = document.createElement('div');
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.gap = '8px';
        if (props.children && Array.isArray(props.children)) {
          props.children.forEach((c: any) => {
            try {
              const childComponentData = c.component || c;
              const child = this.renderComponent(childComponentData);
              element.appendChild(child);
            } catch (childError) {
              console.error('Error rendering child component:', childError, c);
            }
          });
        }
        return element;
      }
        case 'CentralDogma': {
          const element = document.createElement('central-dogma');
          if (props.dnaSequence) (element as any).dnaSequence = this.resolveProperty(props.dnaSequence);
          if (props.animationSpeed) (element as any).animationSpeed = this.resolveProperty(props.animationSpeed);
          if (props.phase) (element as any).phase = this.resolveProperty(props.phase);
          return element;
        }
        case 'MendelSimulator': {
          const element = document.createElement('mendel-simulator');
          if (props.parent1Genotype) (element as any).parent1Genotype = this.resolveProperty(props.parent1Genotype);
          if (props.parent2Genotype) (element as any).parent2Genotype = this.resolveProperty(props.parent2Genotype);
          if (props.traitType) (element as any).traitType = this.resolveProperty(props.traitType);
          if (props.simulationCount) (element as any).simulationCount = this.resolveProperty(props.simulationCount);
          if (props.interactive !== undefined) (element as any).interactive = this.resolveProperty(props.interactive);
          return element;
        }
        case 'NaturalSelectionSimulator': {
          const element = document.createElement('natural-selection-simulator');
          if (props.populationSize) (element as any).populationSize = this.resolveProperty(props.populationSize);
          if (props.initialDarkFrequency) (element as any).initialDarkFrequency = this.resolveProperty(props.initialDarkFrequency);
          if (props.environmentColor) (element as any).environmentColor = this.resolveProperty(props.environmentColor);
          if (props.generations) (element as any).generations = this.resolveProperty(props.generations);
          if (props.interactive !== undefined) (element as any).interactive = this.resolveProperty(props.interactive);
          return element;
        }
        default:
          console.error('Unknown component:', componentName, 'Full component data:', componentData);
          const fallback = document.createElement('div');
          fallback.style.color = '#ff6b6b';
          fallback.style.padding = '8px';
          fallback.style.background = '#fff3f3';
          fallback.style.border = '1px solid #ff6b6b';
          fallback.style.borderRadius = '4px';
          fallback.textContent = `Unknown component: ${componentName}`;
          return fallback;
      }
    } catch (error) {
      console.error('Error rendering component:', componentName, error);
      const errorDiv = document.createElement('div');
      errorDiv.style.color = '#ff6b6b';
      errorDiv.style.padding = '8px';
      errorDiv.style.background = '#fff3f3';
      errorDiv.style.border = '1px solid #ff6b6b';
      errorDiv.style.borderRadius = '4px';
      errorDiv.textContent = `Error rendering ${componentName}: ${error}`;
      return errorDiv;
    }
  }

  private getTextStyle(props: any): string {
    const styleParts: string[] = [];
    if (props.fontSize) styleParts.push(`font-size: ${props.fontSize}px`);
    if (props.fontWeight) styleParts.push(`font-weight: ${props.fontWeight}`);
    if (props.textAlign) styleParts.push(`text-align: ${props.textAlign}`);
    if (props.color) styleParts.push(`color: ${props.color}`);
    if (props.margin) {
      if (typeof props.margin === 'object') {
        const margin = props.margin;
        if (margin.top) styleParts.push(`margin-top: ${margin.top}px`);
        if (margin.bottom) styleParts.push(`margin-bottom: ${margin.bottom}px`);
        if (margin.left) styleParts.push(`margin-left: ${margin.left}px`);
        if (margin.right) styleParts.push(`margin-right: ${margin.right}px`);
      } else {
        styleParts.push(`margin: ${props.margin}px`);
      }
    }
    return styleParts.join('; ');
  }

  private getHeaderStyle(props: any): string {
    const styleParts: string[] = [];
    if (props.fontSize) styleParts.push(`font-size: ${props.fontSize}px`);
    if (props.fontWeight) styleParts.push(`font-weight: ${props.fontWeight}`);
    if (props.textAlign) styleParts.push(`text-align: ${props.textAlign}`);
    if (props.color) styleParts.push(`color: ${props.color}`);
    if (props.margin) {
      if (typeof props.margin === 'object') {
        const margin = props.margin;
        if (margin.top) styleParts.push(`margin-top: ${margin.top}px`);
        if (margin.bottom) styleParts.push(`margin-bottom: ${margin.bottom}px`);
        if (margin.left) styleParts.push(`margin-left: ${margin.left}px`);
        if (margin.right) styleParts.push(`margin-right: ${margin.right}px`);
      } else {
        styleParts.push(`margin: ${props.margin}px`);
      }
    }
    return styleParts.join('; ');
  }

  private getButtonStyle(): string {
    return 'padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
  }

  private getContainerStyle(): string {
    return 'padding: 16px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 16px;';
  }

  private handleButtonClick(onClick: string): void {
    console.log('Button clicked:', onClick);
  }

  getSurfaceElements(): Map<string, HTMLElement> {
    return this.#surfaceElements;
  }

  getDataModelValue(key: string): any {
    return this.#dataModel.get(key);
  }

  clear(): void {
    this.#surfaceElements.forEach((element) => element.remove());
    this.#surfaceElements.clear();
    this.#dataModel.clear();
  }
}

@customElement("a2ui-manager-component")
export class A2UIManagerComponent extends LitElement {
  @state()
  manager: A2UIManager | null = null;

  #container: HTMLElement | null = null;

  static styles = css`
      :host {
        display: block;
        width: 100%;
        min-height: 100%;
      }

      .surfaces-container {
        width: 100%;
        max-width: 100%;
        padding: 16px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .surface-wrapper {
        margin-bottom: 16px;
        animation: fadeIn 0.3s ease-in-out;
      }
    `;

  connectedCallback() {
    super.connectedCallback();
    this.manager = new A2UIManager();
  }

  render() {
    return html`<div class="surfaces-container"></div>`;
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if (!this.#container) {
      this.#container = this.shadowRoot?.querySelector('.surfaces-container') as HTMLElement;
    }

    if (this.#container && this.manager) {
      const surfaceElements = this.manager.getSurfaceElements();
      
      this.#container.innerHTML = '';
      
      surfaceElements.forEach((element) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'surface-wrapper';
        wrapper.appendChild(element);
        this.#container.appendChild(wrapper);
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.manager?.clear();
  }
}
