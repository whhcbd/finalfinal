// ✅ 导入 A2UI 标准组件库（必须在最前面）
// 这会自动注册所有标准 A2UI 组件（Button, Text, Card, Column, Row 等）
import "@a2ui/lit/ui";
import { v0_8 } from "@a2ui/lit";

import { PunnettSquare } from './components/genetics/punnett-square';
import { DNAStructure } from './components/genetics/dna-structure';
import { PhenotypeDistribution } from './components/genetics/phenotype-distribution';
import { GeneExpression } from './components/genetics/gene-expression';
import { PedigreeChart } from './components/genetics/pedigree-chart';
import { CrossOverMap } from './components/genetics/crossover-map';
import { MendelSimulator } from './components/genetics/mendel-simulator';
import { NaturalSelectionSimulator } from './components/genetics/natural-selection-simulator';
import { Flashcard } from './components/genetics/flashcard';
import { CentralDogma } from './components/genetics/central-dogma';
import { A2UIManager, A2UIManagerComponent } from './a2ui-manager';
import { A2UIThemeProvider } from './theme-provider';
import { HomePage } from './home-page';
import { ChatModule } from './chat-module';
import { QuizModule } from './quiz-module';
import { KnowledgeGraphModule } from './knowledge-graph-module';
import { router, Router } from './router';
import { App } from './app';

const defineCustomElement = (name: string, constructor: CustomElementConstructor) => {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
};

// ✅ 注册自定义遗传学组件到 A2UI 系统
// 使用 A2UI 的 componentRegistry 来注册自定义组件
const registry = v0_8.UI.componentRegistry;

// 注册遗传学组件到 A2UI（这样 A2UI 渲染器可以识别它们）
registry.register('PunnettSquare', PunnettSquare as any, 'punnett-square', {
  type: "object",
  properties: {
    parent1Genotype: { type: "string" },
    parent2Genotype: { type: "string" },
    trait: { type: "string" },
    showPhenotype: { type: "boolean" },
    traitDefinitions: { type: "array" },
    linkageInfo: { type: "object" },
    observedData: { type: "array" }
  },
  required: ["parent1Genotype", "parent2Genotype"]
});

registry.register('DNAStructure', DNAStructure as any, 'dna-structure', {
  type: "object",
  properties: {
    sequence: { type: "string" },
    showLabels: { type: "boolean" },
    highlightRegions: { type: "array" }
  },
  required: ["sequence"]
});

registry.register('PhenotypeDistribution', PhenotypeDistribution as any, 'phenotype-distribution', {
  type: "object",
  properties: {
    data: { type: "array" },
    trait: { type: "string" }
  },
  required: ["data", "trait"]
});

registry.register('GeneExpression', GeneExpression as any, 'gene-expression', {
  type: "object",
  properties: {
    genes: { type: "array" },
    expressionLevels: { type: "array" },
    conditions: { type: "array" }
  },
  required: ["genes", "conditions"]
});

registry.register('PedigreeChart', PedigreeChart as any, 'pedigree-chart', {
  type: "object",
  properties: {
    generations: { type: "array" },
    trait: { type: "string" }
  },
  required: ["generations"]
});

registry.register('CrossOverMap', CrossOverMap as any, 'crossover-map', {
  type: "object",
  properties: {
    chromosomeLength: { type: "number" },
    genes: { type: "array" },
    crossoverPoints: { type: "array" }
  },
  required: ["genes"]
});

registry.register('MendelSimulator', MendelSimulator as any, 'mendel-simulator', {
  type: "object",
  properties: {
    parent1Genotype: { type: "string" },
    parent2Genotype: { type: "string" },
    traitType: { type: "string" },
    simulationCount: { type: "number" },
    interactive: { type: "boolean" }
  },
  required: []
});

registry.register('NaturalSelectionSimulator', NaturalSelectionSimulator as any, 'natural-selection-simulator', {
  type: "object",
  properties: {
    populationSize: { type: "number" },
    initialFreqA: { type: "number" },
    environmentType: { type: "string" },
    selectionStrength: { type: "number" },
    interactive: { type: "boolean" }
  },
  required: []
});

registry.register('Flashcard', Flashcard as any, 'genetics-flashcard');

registry.register('CentralDogma', CentralDogma as any, 'central-dogma', {
  type: "object",
  properties: {
    dnaSequence: { type: "string" },
    animationSpeed: { type: "number" },
    phase: { type: "string" }
  },
  required: []
});

// 注册其他应用组件（非 A2UI 组件）
defineCustomElement('a2ui-manager-component', A2UIManagerComponent);
defineCustomElement('a2ui-theme-provider', A2UIThemeProvider);
defineCustomElement('home-page', HomePage);
defineCustomElement('chat-module', ChatModule);
defineCustomElement('quiz-module', QuizModule);
defineCustomElement('knowledge-graph-module', KnowledgeGraphModule);
defineCustomElement('genetics-app', App);

export {
  PunnettSquare,
  DNAStructure,
  PhenotypeDistribution,
  GeneExpression,
  PedigreeChart,
  CrossOverMap,
  MendelSimulator,
  NaturalSelectionSimulator,
  Flashcard,
  CentralDogma,
  A2UIManager,
  A2UIManagerComponent,
  A2UIThemeProvider,
  HomePage,
  ChatModule,
  QuizModule,
  KnowledgeGraphModule,
  router,
  Router,
  App
};
