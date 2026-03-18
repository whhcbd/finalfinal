# 家系图组件改进文档

## 改进日期
2026-03-18

## 问题分析

对比标准遗传学家系图与原实现，发现以下关键问题：

### 1. 符号形状错误
- **标准**：男性用方形（□），女性用圆形（○）
- **原实现**：全部使用圆形
- **影响**：无法快速区分性别

### 2. 表型表示错误
- **标准**：
  - 正常个体：空心符号
  - 患病个体：实心填充（●/■）
  - 携带者：中心圆点（⊙）
- **原实现**：使用不同颜色的边框和背景色
- **影响**：不符合遗传学标准，打印时无法区分

### 3. 缺少连接线
- **标准**：有横线连接配偶（婚配线），竖线连接父母和子女
- **原实现**：完全没有连接线
- **影响**：无法清晰显示家族关系

### 4. 缺少个体标识
- **标准**：每个个体有编号（1、2、3、4）、年龄、基因型信息
- **原实现**：只显示性别符号
- **影响**：无法追踪特定个体

### 5. 代际标注不规范
- **标准**：使用罗马数字（I、II、III、IV）
- **原实现**：使用中文"第 X 代"
- **影响**：不符合国际标准

## 改进方案

### 1. 符号系统重新设计

```css
/* 男性：方形 */
.symbol.male {
  border-radius: 0;
}

/* 女性：圆形 */
.symbol.female {
  border-radius: 50%;
}

/* 正常：空心白色背景 */
.symbol.normal {
  background: #ffffff;
  border: 2px solid #111827;
}

/* 患病：实心黑色填充 */
.symbol.affected {
  background: #111827;
  border: 2px solid #111827;
}

/* 携带者：中心圆点 */
.symbol.carrier {
  background: #ffffff;
  border: 2px solid #111827;
}

.symbol.carrier::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #111827;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### 2. 数据结构扩展

```typescript
export interface Individual {
  id: string;
  gender: 'male' | 'female';
  phenotype: 'normal' | 'affected' | 'carrier';
  generation: number;
  position?: number;
  parents?: {
    father?: string;
    mother?: string;
  };
  children?: string[];
  label?: string;      // 个体编号（如 "1", "2", "I-1"）
  age?: string;        // 年龄信息（如 "35 yr"）
  genotype?: string;   // 基因型信息（如 "WT/MT"）
  spouseId?: string;   // 配偶ID，用于绘制婚配线
}
```

### 3. 个体信息显示

```html
<div class="individual">
  <!-- 个体编号 -->
  <div class="individual-label">1</div>

  <!-- 符号 -->
  <div class="symbol male affected"></div>

  <!-- 详细信息 -->
  <div class="individual-info">
    <div class="individual-age">35 yr</div>
    <div class="individual-genotype">MT/MT</div>
  </div>
</div>
```

### 4. 代际标注改进

使用罗马数字标注：
- Generation I（第一代）
- Generation II（第二代）
- Generation III（第三代）
- Generation IV（第四代）

```typescript
private toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}
```

### 5. 连接线系统（待实现）

需要实现以下连接线：

1. **婚配线（Mating Line）**
   - 水平线连接配偶
   - 位于两个符号之间

2. **子女线（Offspring Line）**
   - 从婚配线中点向下延伸
   - 连接到子女符号上方

3. **兄弟姐妹线（Sibship Line）**
   - 水平线连接同代兄弟姐妹
   - 每个子女从此线向上连接到符号

实现方式：使用 SVG 绘制连接线

```html
<svg class="connections">
  <!-- 婚配线 -->
  <line class="mating-line" x1="..." y1="..." x2="..." y2="..." />

  <!-- 子女连接线 -->
  <path class="connection-line" d="M ... L ... L ..." />
</svg>
```

## 改进效果对比

### 改进前
- ❌ 全部使用圆形符号
- ❌ 使用彩色边框区分状态
- ❌ 没有连接线
- ❌ 没有个体编号和详细信息
- ❌ 使用中文代际标注

### 改进后
- ✅ 男性方形，女性圆形
- ✅ 标准黑白符号系统（正常空心、患病实心、携带者中心点）
- ✅ 支持个体编号、年龄、基因型显示
- ✅ 使用罗马数字代际标注
- ⏳ 连接线系统（待实现）

## 使用示例

```typescript
const pedigreeData = {
  generations: [
    {
      individuals: [
        {
          id: 'I-1',
          gender: 'male',
          phenotype: 'normal',
          generation: 0,
          label: '1',
          age: '52 yr',
          genotype: 'WT/MT',
          spouseId: 'I-2'
        },
        {
          id: 'I-2',
          gender: 'female',
          phenotype: 'carrier',
          generation: 0,
          label: '2',
          age: '50 yr',
          genotype: 'WT/MT'
        }
      ]
    },
    {
      individuals: [
        {
          id: 'II-1',
          gender: 'male',
          phenotype: 'affected',
          generation: 1,
          label: '1',
          age: '35 yr',
          genotype: 'MT/MT',
          parents: { father: 'I-1', mother: 'I-2' }
        },
        {
          id: 'II-2',
          gender: 'female',
          phenotype: 'normal',
          generation: 1,
          label: '2',
          age: '30 yr',
          genotype: 'WT/WT',
          parents: { father: 'I-1', mother: 'I-2' }
        }
      ]
    }
  ]
};
```

## 后续改进计划

### 短期（1周内）
- [x] 修复符号形状（方形/圆形）
- [x] 实现标准表型表示（空心/实心/中心点）
- [x] 添加个体标识和详细信息
- [x] 使用罗马数字代际标注
- [ ] 实现连接线系统

### 中期（2-4周）
- [ ] 支持更复杂的家系结构（近亲婚配、双胞胎）
- [ ] 添加交互式编辑功能
- [ ] 支持导出为标准格式（PNG、SVG、PDF）
- [ ] 添加自动布局算法

### 长期（1-3月）
- [ ] 支持大型家系图（100+ 个体）
- [ ] 添加基因型推断功能
- [ ] 集成遗传咨询工具
- [ ] 支持多种遗传模式分析

## 参考资源

- **遗传学家系图标准**：Bennett et al. (2008) "Standardized Human Pedigree Nomenclature"
- **在线工具参考**：
  - PedigreeChart.com
  - GenoPro
  - Progeny Pedigree Draw

---

*文档创建时间：2026-03-18*
*当前状态：符号系统已改进，连接线系统待实现*
