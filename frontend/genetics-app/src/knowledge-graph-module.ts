import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface GraphNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  description: string;
  connections: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

@customElement('knowledge-graph-module')
export class KnowledgeGraphModule extends LitElement {
  @state()
  nodes: GraphNode[] = [];

  @state()
  edges: GraphEdge[] = [];

  @state()
  categories: Category[] = [];

  @state()
  selectedCategory: string | null = null;

  @state()
  selectedNode: GraphNode | null = null;

  @state()
  scale = 1;

  @state()
  offsetX = 0;

  @state()
  offsetY = 0;

  @state()
  isDragging = false;

  @state()
  dragStartX = 0;

  @state()
  dragStartY = 0;

  @state()
  hoveredNode: GraphNode | null = null;

  @query('#graph-canvas')
  canvas: HTMLCanvasElement | undefined;

  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private physicsRunning = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }

    .header h1 {
      margin: 0 0 16px 0;
      font-size: 1.8em;
      color: #1a1a1a;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .filter-chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 2px solid #e0e0e0;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .filter-chip.active {
      border-color: var(--category-color, #667eea);
      background: var(--category-color, #667eea);
      color: white;
    }

    .filter-chip .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--category-color, #667eea);
    }

    .filter-chip.active .color-dot {
      background: white;
    }

    .canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
    }

    #graph-canvas {
      display: block;
      cursor: grab;
    }

    #graph-canvas:active {
      cursor: grabbing;
    }

    .controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: white;
      padding: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .control-btn {
      width: 40px;
      height: 40px;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.2em;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: #f0f0f0;
      transform: scale(1.1);
    }

    .legend {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
    }

    .legend h3 {
      margin: 0 0 12px 0;
      font-size: 1em;
      color: #333;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }

    .legend-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .legend-label {
      font-size: 0.9em;
      color: #666;
    }

    .node-detail {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      z-index: 100;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .node-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .node-detail-title {
      font-size: 1.3em;
      font-weight: 700;
      color: #333;
    }

    .node-detail-category {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      background: var(--category-color, #667eea);
      color: white;
    }

    .node-detail-description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .node-detail-connections {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
    }

    .node-detail-connections h4 {
      margin: 0 0 8px 0;
      font-size: 0.95em;
      color: #333;
    }

    .connection-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .connection-tag {
      background: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85em;
      color: #667eea;
      font-weight: 500;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
      color: #999;
      padding: 4px;
    }

    .close-btn:hover {
      color: #333;
    }

    .reset-btn {
      margin-left: auto;
      padding: 8px 16px;
      background: #f0f0f0;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .reset-btn:hover {
      background: #e0e0e0;
    }

    .stats {
      display: flex;
      gap: 24px;
      margin-top: 12px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 1.5em;
      font-weight: 700;
      color: #667eea;
    }

    .stat-label {
      font-size: 0.85em;
      color: #666;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.4em;
      }

      .node-detail {
        max-width: 90%;
        padding: 16px;
      }

      .controls {
        bottom: 10px;
        right: 10px;
      }

      .legend {
        bottom: 10px;
        left: 10px;
        max-height: 200px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initializeData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  updated() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.draw();
  }

  private initializeData() {
    this.categories = [
      { id: 'basic', name: '基础概念', color: '#667eea', enabled: true },
      { id: 'structure', name: 'DNA结构', color: '#28a745', enabled: true },
      { id: 'expression', name: '基因表达', color: '#ffc107', enabled: true },
      { id: 'inheritance', name: '遗传规律', color: '#dc3545', enabled: true },
      { id: 'mutation', name: '基因突变', color: '#6f42c1', enabled: true },
      { id: 'population', name: '群体遗传', color: '#fd7e14', enabled: true }
    ];

    this.nodes = [
      { id: '1', label: '孟德尔定律', category: 'inheritance', x: 400, y: 300, radius: 35, color: '#dc3545', description: '孟德尔遗传定律包括分离定律和自由组合定律，是现代遗传学的基础。', connections: ['2', '3', '7'] },
      { id: '2', label: '分离定律', category: 'inheritance', x: 250, y: 200, radius: 30, color: '#dc3545', description: '在生物体形成配子时，成对的等位基因彼此分离，分别进入不同的配子中。', connections: ['1', '4'] },
      { id: '3', label: '自由组合定律', category: 'inheritance', x: 550, y: 200, radius: 30, color: '#dc3545', description: '不同对相对性状的遗传是互不干扰的，可以自由组合。', connections: ['1', '5'] },
      { id: '4', label: '显性基因', category: 'inheritance', x: 150, y: 350, radius: 28, color: '#dc3545', description: '在杂合子中能表现出其性状的基因。', connections: ['2'] },
      { id: '5', label: '隐性基因', category: 'inheritance', x: 650, y: 350, radius: 28, color: '#dc3545', description: '在杂合子中不能表现出其性状的基因。', connections: ['3'] },
      { id: '6', label: 'DNA', category: 'structure', x: 800, y: 300, radius: 40, color: '#28a745', description: '脱氧核糖核酸，是遗传信息的携带者。', connections: ['7', '8', '9'] },
      { id: '7', label: '双螺旋结构', category: 'structure', x: 700, y: 450, radius: 32, color: '#28a745', description: 'DNA分子由两条反向平行的多核苷酸链盘旋成双螺旋结构。', connections: ['6'] },
      { id: '8', label: '碱基配对', category: 'structure', x: 900, y: 450, radius: 32, color: '#28a745', description: 'A与T配对，G与C配对，通过氢键连接。', connections: ['6'] },
      { id: '9', label: '基因', category: 'basic', x: 800, y: 150, radius: 36, color: '#667eea', description: '具有遗传效应的DNA片段。', connections: ['6', '10', '11'] },
      { id: '10', label: '转录', category: 'expression', x: 700, y: 100, radius: 30, color: '#ffc107', description: '以DNA为模板合成RNA的过程。', connections: ['9', '12'] },
      { id: '11', label: '翻译', category: 'expression', x: 900, y: 100, radius: 30, color: '#ffc107', description: '以mRNA为模板合成蛋白质的过程。', connections: ['9', '13'] },
      { id: '12', label: 'RNA', category: 'expression', x: 600, y: 50, radius: 28, color: '#ffc107', description: '核糖核酸，参与蛋白质合成。', connections: ['10'] },
      { id: '13', label: '蛋白质', category: 'expression', x: 1000, y: 50, radius: 28, color: '#ffc107', description: '生命活动的承担者，由氨基酸组成。', connections: ['11'] },
      { id: '14', label: '点突变', category: 'mutation', x: 100, y: 500, radius: 28, color: '#6f42c1', description: 'DNA分子中单个碱基对的改变。', connections: ['15'] },
      { id: '15', label: '移码突变', category: 'mutation', x: 200, y: 550, radius: 28, color: '#6f42c1', description: '插入或缺失碱基导致阅读框移位。', connections: ['14'] },
      { id: '16', label: '哈迪-温伯格', category: 'population', x: 50, y: 100, radius: 30, color: '#fd7e14', description: '描述理想群体中基因频率和基因型频率保持不变的定律。', connections: ['17'] },
      { id: '17', label: '基因频率', category: 'population', x: 150, y: 50, radius: 28, color: '#fd7e14', description: '群体中某个基因占该基因座所有等位基因的比例。', connections: ['16'] }
    ];

    this.edges = this.generateEdges();
    this.startPhysicsSimulation();
  }

  private generateEdges(): GraphEdge[] {
    const edgeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    for (const node of this.nodes) {
      for (const targetId of node.connections) {
        const edgeKey = [node.id, targetId].sort().join('-');
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            source: node.id,
            target: targetId,
            weight: 1
          });
        }
      }
    }

    return edges;
  }

  private getFilteredNodes(): GraphNode[] {
    if (!this.selectedCategory) return this.nodes;
    return this.nodes.filter(node => node.category === this.selectedCategory);
  }

  private getFilteredEdges(): GraphEdge[] {
    const filteredNodeIds = new Set(this.getFilteredNodes().map(n => n.id));
    return this.edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }

  private toggleCategory(categoryId: string) {
    const category = this.categories.find(c => c.id === categoryId);
    if (category) {
      category.enabled = !category.enabled;
      this.selectedCategory = category.enabled ? null : categoryId;
      this.categories = [...this.categories];
      this.draw();
    }
  }

  private handleNodeClick(node: GraphNode) {
    this.selectedNode = node;
  }

  private closeNodeDetail() {
    this.selectedNode = null;
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    if (!container) return;

    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.draw();
  }

  private startPhysicsSimulation() {
    if (this.physicsRunning) return;
    this.physicsRunning = true;
    this.runPhysics();
  }

  private runPhysics() {
    if (!this.physicsRunning) return;

    const filteredNodes = this.getFilteredNodes();
    const centerX = this.canvas ? this.canvas.width / 2 : 400;
    const centerY = this.canvas ? this.canvas.height / 2 : 300;

    for (const node of filteredNodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = dist * 0.001;
      
      node.x += dx * force;
      node.y += dy * force;

      for (const other of filteredNodes) {
        if (node.id === other.id) continue;
        const odx = node.x - other.x;
        const ody = node.y - other.y;
        const odist = Math.sqrt(odx * odx + ody * ody);
        const minDist = node.radius + other.radius + 50;
        
        if (odist < minDist) {
          const overlap = minDist - odist;
          const pushForce = overlap * 0.1;
          node.x += (odx / odist) * pushForce;
          node.y += (ody / odist) * pushForce;
        }
      }
    }

    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.runPhysics());
  }

  private draw() {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 + this.offsetX, height / 2 + this.offsetY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-width / 2, -height / 2);

    this.drawEdges(ctx);
    this.drawNodes(ctx);

    ctx.restore();
  }

  private drawEdges(ctx: CanvasRenderingContext2D) {
    const edges = this.getFilteredEdges();
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.lineWidth = 2;

    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  }

  private drawNodes(ctx: CanvasRenderingContext2D) {
    const nodes = this.getFilteredNodes();

    for (const node of nodes) {
      const category = this.categories.find(c => c.id === node.category);
      const color = category?.color || node.color;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(10, node.radius * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      if (node === this.hoveredNode || node === this.selectedNode) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  }

  private handleCanvasMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
  }

  private handleCanvasMouseMove(e: MouseEvent) {
    if (!this.canvas || !this.ctx) return;

    if (this.isDragging) {
      this.offsetX = e.clientX - this.dragStartX;
      this.offsetY = e.clientY - this.dragStartY;
      this.draw();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const worldX = (mouseX - centerX - this.offsetX) / this.scale + centerX;
    const worldY = (mouseY - centerY - this.offsetY) / this.scale + centerY;

    const nodes = this.getFilteredNodes();
    let found: GraphNode | null = null;

    for (const node of nodes) {
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius) {
        found = node;
        break;
      }
    }

    this.hoveredNode = found;
    this.canvas.style.cursor = found ? 'pointer' : 'grab';
    this.draw();
  }

  private handleCanvasMouseUp(e: MouseEvent) {
    if (this.isDragging) {
      this.isDragging = false;
      return;
    }

    if (this.hoveredNode) {
      this.handleNodeClick(this.hoveredNode);
    }
  }

  private handleCanvasWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(0.3, Math.min(3, this.scale * delta));
    this.draw();
  }

  private handleCanvasDoubleClick(e: MouseEvent) {
    this.zoomToFit();
  }

  private zoomIn() {
    this.scale = Math.min(3, this.scale * 1.2);
    this.draw();
  }

  private zoomOut() {
    this.scale = Math.max(0.3, this.scale * 0.8);
    this.draw();
  }

  private resetView() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.draw();
  }

  private zoomToFit() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.draw();
  }

  render() {
    const visibleNodes = this.getFilteredNodes();
    const visibleEdges = this.getFilteredEdges();
    const totalConnections = this.nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2;

    return html`
      <div class="container">
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>🔗 遗传学知识图谱</h1>
            <button class="reset-btn" @click=${() => this.resetView()}>
              重置视图
            </button>
          </div>
          <div class="filters">
            ${repeat(
              this.categories,
              (cat) => cat.id,
              (cat) => html`
                <div
                  class="filter-chip ${cat.enabled ? 'active' : ''}"
                  style="--category-color: ${cat.color}"
                  @click=${() => this.toggleCategory(cat.id)}
                >
                  <span class="color-dot"></span>
                  ${cat.name}
                </div>
              `
            )}
          </div>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-value">${visibleNodes.length}</span>
              <span class="stat-label">节点</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${visibleEdges.length}</span>
              <span class="stat-label">连接</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.categories.filter(c => c.enabled).length}</span>
              <span class="stat-label">类别</span>
            </div>
          </div>
        </div>

        <div class="canvas-container">
          <canvas
            id="graph-canvas"
            @mousedown=${this.handleCanvasMouseDown.bind(this)}
            @mousemove=${this.handleCanvasMouseMove.bind(this)}
            @mouseup=${this.handleCanvasMouseUp.bind(this)}
            @wheel=${this.handleCanvasWheel.bind(this)}
            @dblclick=${this.handleCanvasDoubleClick.bind(this)}
          ></canvas>

          <div class="controls">
            <button class="control-btn" @click=${() => this.zoomIn()} title="放大">+</button>
            <button class="control-btn" @click=${() => this.zoomOut()} title="缩小">-</button>
            <button class="control-btn" @click=${() => this.resetView()} title="重置">⟲</button>
          </div>

          <div class="legend">
            <h3>图例</h3>
            ${repeat(
              this.categories,
              (cat) => cat.id,
              (cat) => html`
                <div class="legend-item">
                  <span class="legend-dot" style="background: ${cat.color}"></span>
                  <span class="legend-label">${cat.name}</span>
                </div>
              `
            )}
          </div>
        </div>

        ${this.selectedNode ? (() => {
          const node = this.selectedNode;
          const category = this.categories.find(c => c.id === node.category);
          const categoryColor = category?.color || '#4a9eff';
          const categoryName = category?.name || 'Unknown';
          
          return html`
            <div class="node-detail" style="--category-color: ${categoryColor}">
              <div class="node-detail-header">
                <div>
                  <span class="node-detail-title">${node.label}</span>
                  <span class="node-detail-category">${categoryName}</span>
                </div>
                <button class="close-btn" @click=${() => this.closeNodeDetail()}>✕</button>
              </div>
              <div class="node-detail-description">
                ${node.description}
              </div>
              <div class="node-detail-connections">
                <h4>连接的知识点 (${node.connections.length})</h4>
                <div class="connection-list">
                  ${repeat(
                    node.connections,
                    (connId) => connId,
                    (connId) => {
                      const connNode = this.nodes.find(n => n.id === connId);
                      return connNode ? html`
                        <span class="connection-tag">${connNode.label}</span>
                      ` : nothing;
                    }
                  )}
                </div>
              </div>
            </div>
          `;
        })() : nothing}
      </div>
    `;
  }
}
