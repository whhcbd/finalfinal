# A2UI 组件渲染问题诊断报告

## 问题概述

除了 PunnettSquare 组件外，其他5个自定义遗传学组件（DNAStructure、PhenotypeDistribution、GeneExpression、PedigreeChart、CrossOverMap）都无法正常渲染。

## 根本原因分析

### 1. 缺少属性值解包逻辑 ⚠️ 关键问题

**问题描述：**
- A2UI 协议使用 `{literalString: "value"}` 和 `{literalBoolean: true}` 包装属性值
- 组件接收到的是 Proxy 对象，而不是原始值
- 所有组件都使用 `@property()` 装饰器直接接收值，没有解包逻辑

**示例（DNAStructure）：**
```typescript
// ❌ 当前代码（错误）
@property({ type: String }) sequence: string = '';

// 后端发送：{"sequence": {"literalString": "ATCGATCG"}}
// 组件接收到：Proxy {literalString: "ATCGATCG"}
// 实际使用：this.sequence 是 Proxy 对象，不是字符串 "ATCGATCG"
```

**正确做法（参考 PunnettSquare）：**
```typescript
// ✅ 修复后的代码
private _sequence: string = '';

set sequence(value: any) {
  this._sequence = this.unwrapValue(value, 'string');
}

get sequence(): string {
  return this._sequence;
}

private unwrapValue(value: any, expectedType: string): any {
  if (value === null || value === undefined) {
    return expectedType === 'string' ? '' :
           expectedType === 'boolean' ? false :
           expectedType === 'number' ? 0 :
           expectedType === 'array' ? [] : null;
  }

  // 如果是 Proxy 包装的值，解包
  if (typeof value === 'object' && !Array.isArray(value)) {
    if ('literalString' in value) return value.literalString;
    if ('literalBoolean' in value) return value.literalBoolean;
    if ('literalNumber' in value) return value.literalNumber;
    if ('literalArray' in value) return value.literalArray;
  }

  return value;
}
```

### 2. 缺少 JSON Schema 定义

**问题描述：**
- 只有 PunnettSquare 在 `index.ts` 中注册了完整的 schema
- 其他组件都没有提供 schema，A2UI 无法正确映射属性

**当前代码（错误）：**
```typescript
registry.register('DNAStructure', DNAStructure as any, 'dna-structure');
registry.register('PhenotypeDistribution', PhenotypeDistribution as any, 'phenotype-distribution');
registry.register('GeneExpression', GeneExpression as any, 'gene-expression');
registry.register('PedigreeChart', PedigreeChart as any, 'pedigree-chart');
registry.register('CrossOverMap', CrossOverMap as any, 'crossover-map');
```

**正确做法：**
```typescript
registry.register('DNAStructure', DNAStructure as any, 'dna-structure', {
  type: "object",
  properties: {
    sequence: { type: "string" },
    showLabels: { type: "boolean" },
    highlightRegions: { type: "array" }
  },
  required: ["sequence"]
});
```

### 3. 后端数据格式错误

**问题描述：**
- 后端在生成 A2UI JSON 时，对数组内的对象属性也进行了包装
- 这是不正确的，只有组件的顶层属性需要包装

**错误示例（CrossOverMap）：**
```json
{
  "CrossOverMap": {
    "genes": [
      {
        "name": {"literalString": "GeneA"},      // ❌ 错误
        "position": {"literalNumber": 10}         // ❌ 错误
      }
    ]
  }
}
```

**正确格式：**
```json
{
  "CrossOverMap": {
    "genes": {
      "literalArray": [
        {"name": "GeneA", "position": 10},       // ✅ 正确：数组内的对象不需要包装
        {"name": "GeneB", "position": 30}
      ]
    }
  }
}
```

## 需要修复的组件清单

### ✅ 已修复
- [x] PunnettSquare - 完全修复，可以正常渲染

### ❌ 待修复
- [ ] DNAStructure
  - 缺少 `sequence` 属性解包
  - 缺少 `showLabels` 属性解包
  - 缺少 `highlightRegions` 属性解包
  - 缺少 `unwrapValue()` 方法
  - 缺少 schema 定义

- [ ] PhenotypeDistribution
  - 缺少 `data` 属性解包
  - 缺少 `trait` 属性解包
  - 缺少 `unwrapValue()` 方法
  - 缺少 schema 定义

- [ ] GeneExpression
  - 缺少 `genes` 属性解包
  - 缺少 `expressionLevels` 属性解包
  - 缺少 `conditions` 属性解包
  - 缺少 `unwrapValue()` 方法
  - 缺少 schema 定义

- [ ] PedigreeChart
  - 缺少 `generations` 属性解包
  - 缺少 `trait` 属性解包
  - 缺少 `unwrapValue()` 方法
  - 缺少 schema 定义

- [ ] CrossOverMap
  - 缺少 `chromosomeLength` 属性解包
  - 缺少 `genes` 属性解包
  - 缺少 `crossoverPoints` 属性解包
  - 缺少 `unwrapValue()` 方法
  - 缺少 schema 定义
  - 后端数据格式错误（数组内对象被过度包装）

## 修复优先级

### 高优先级（必须修复）
1. **添加属性解包逻辑** - 所有5个组件
2. **添加 unwrapValue() 方法** - 所有5个组件
3. **修复后端数据格式** - CrossOverMap 和其他使用数组的组件

### 中优先级（建议修复）
4. **添加 JSON Schema 定义** - 所有5个组件

## 修复步骤

### 步骤 1：修复前端组件（每个组件）

1. 将所有 `@property()` 属性改为私有变量 + getter/setter
2. 添加 `unwrapValue()` 方法
3. 在 setter 中调用 `unwrapValue()` 解包值

### 步骤 2：修复 index.ts

为每个组件添加完整的 schema 定义

### 步骤 3：修复后端数据生成

检查 `backend/main.py` 中的 `generate_local_a2ui()` 函数，确保：
- 顶层属性使用 `{literalString: "value"}` 包装
- 数组内的对象属性不需要包装

## 测试验证

修复后，使用以下测试问题验证：

1. **DNAStructure**: "请展示DNA序列ATCGATCG的双螺旋结构"
2. **PhenotypeDistribution**: "在1000株豌豆中，紫色花750株，白色花250株，展示表型分布"
3. **GeneExpression**: "展示GeneA在肝脏和大脑中的表达水平差异"
4. **PedigreeChart**: "展示一个常染色体隐性遗传病的家系图"
5. **CrossOverMap**: "展示染色体上两个基因之间的交叉互换"

## 预期结果

修复后，所有组件应该能够：
- 正确接收并解包 A2UI 属性值
- 在浏览器中正常渲染
- 显示正确的数据和样式
- 响应用户交互事件
