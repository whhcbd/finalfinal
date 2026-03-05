import { PunnettSquare } from './components/genetics/punnett-square';
import { DNAStructure } from './components/genetics/dna-structure';
import { PhenotypeDistribution } from './components/genetics/phenotype-distribution';
import { GeneExpression } from './components/genetics/gene-expression';
import { PedigreeChart } from './components/genetics/pedigree-chart';
import { CrossOverMap } from './components/genetics/crossover-map';
import { Flashcard } from './components/genetics/flashcard';
import { A2UIManager, A2UIManagerComponent } from './a2ui-manager';
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

defineCustomElement('punnett-square', PunnettSquare);
defineCustomElement('dna-structure', DNAStructure);
defineCustomElement('phenotype-distribution', PhenotypeDistribution);
defineCustomElement('gene-expression', GeneExpression);
defineCustomElement('pedigree-chart', PedigreeChart);
defineCustomElement('crossover-map', CrossOverMap);
defineCustomElement('genetics-flashcard', Flashcard);
defineCustomElement('a2ui-manager-component', A2UIManagerComponent);
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
  Flashcard,
  A2UIManager,
  A2UIManagerComponent,
  HomePage,
  ChatModule,
  QuizModule,
  KnowledgeGraphModule,
  router,
  Router,
  App
};
