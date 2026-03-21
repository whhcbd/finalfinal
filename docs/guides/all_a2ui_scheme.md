# 项目中所有可用的 A2UI 组件清单

**更新日期**: 2026-03-03
**A2UI 版本**: v0.8 (stable)
**项目路径**: `c:\trae_coding\A2UI-main\my-a2ui-project`

---

## 一、自定义生物遗传学组件

这些组件是为生物遗传学学习平台专门开发的，已在前端实现并可在 LLM 响应中使用。

### 1. PunnettSquare（孟德尔方格图）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L4-L92)
- 前端实现: `frontend/genetics-app/src/components/genetics/punnett-square.ts`

**描述**: 孟德尔方格图组件，用于展示基因杂交后代的基因型和表型比例

**适用场景**: 预测后代的基因型和表型，如用户询问 "Aa × aa 的后代是什么"

**必需参数**:

- `parent1Genotype`: 亲本1的基因型（如 'Aa', 'BB'）
- `parent2Genotype`: 亲本2的基因型（如 'aa', 'Bb'）

**可选参数**:

- `trait`: 控制的性状名称（如 '豌豆颜色', '花朵形状'）
- `showPhenotype`: 是否显示表型比例
- `dominantAllele`: 显性等位基因（如 'A', 'B'）
- `recessiveAllele`: 隐性等位基因（如 'a', 'b'）

---

### 2. DNAStructure（DNA双螺旋结构）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L93-L175)
- 前端实现: `frontend/genetics-app/src/components/genetics/dna-structure.ts`

**描述**: DNA双螺旋结构组件，用于展示DNA序列和碱基配对

**适用场景**: 展示DNA序列、基因位点，如用户询问 "DNA的结构是什么样的"

**必需参数**:

- `sequence`: DNA序列字符串（如 'ATCGGCTA'）

**可选参数**:

- `showLabels`: 是否显示碱基标签
- `highlightRegions`: 高亮的基因区域数组（如 [{'start': 0, 'end': 3, 'label': '启动子'}]）
- `showComplementary`: 是否显示互补链

---

### 3. PhenotypeDistribution（表型分布柱状图）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L176-L259)
- 前端实现: `frontend/genetics-app/src/components/genetics/phenotype-distribution.ts`

**描述**: 表型分布柱状图组件，用于展示群体中不同表型的分布情况

**适用场景**: 统计不同表型的数量或比例，如用户询问 "后代中显性和隐性的比例"

**必需参数**:

- `data`: 表型数据数组，包含 phenotype, count, percentage, color
- `trait`: 性状名称

**可选参数**:

- `totalCount`: 总个体数
- `showPercentage`: 是否显示百分比标签

---

### 4. GeneExpression（基因表达水平）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L260-L357)
- 前端实现: `frontend/genetics-app/src/components/genetics/gene-expression.ts`

**描述**: 基因表达水平组件，用于展示不同条件下的基因表达量数据

**适用场景**: 展示基因在不同条件下的表达量，如用户询问 "基因 A 和 B 在不同组织中的表达"

**必需参数**:

- `geneName`: 基因名称
- `expressionData`: 表达数据数组，包含 condition, expressionLevel, standardError

**可选参数**:

- `expressionUnit`: 表达量单位（如 'FPKM', 'TPM', 'RPM'）
- `chartType`: 图表类型（bar, line, scatter）
- `showErrorBars`: 是否显示误差线

---

### 5. PedigreeChart（家系图）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L358-L466)
- 前端实现: `frontend/genetics-app/src/components/genetics/pedigree-chart.ts`

**描述**: 家系图组件，用于展示遗传疾病在家族中的传递情况

**适用场景**: 展示家族遗传模式，如用户询问 "绘制这个家族的遗传图谱"

**必需参数**:

- `generations`: 世代数据数组，包含该世代的个体数组
- `diseaseName`: 疾病名称

**可选参数**:

- `inheritancePattern`: 遗传模式（如 '常染色体显性', 'X连锁隐性'）
- `showLegend`: 是否显示图例

---

### 6. CrossOverMap（交叉互换图谱）

**文件位置**:

- 后端 Schema: `backend/schemas/genetics_catalog.json` (L467-L589)
- 前端实现: `frontend/genetics-app/src/components/genetics/crossover-map.ts`

**描述**: 交叉互换图谱组件，用于展示减数分裂中同源染色体之间的交叉互换事件

**适用场景**: 展示基因连锁和交换，如用户询问 "基因 A 和 B 之间的距离"

**必需参数**:

- `chromosome1`: 第一条染色体的基因标记数组
- `chromosome2`: 第二条染色体的基因标记数组

**可选参数**:

- `crossOverPoints`: 交叉点位置数组
- `showRecombinationFreq`: 是否显示重组频率
- `labelChromosomes`: 是否标注染色体

---

## 二、官方 A2UI 标准组件

这些组件来自 A2UI 官方 Lit 渲染器库（v0.8），可直接在 LLM 响应中使用。

**文件位置**: `frontend/lit/src/0.8/ui/`

### 布局组件

#### 1. Column（列布局）

**文件**: `column.ts`
**描述**: 垂直布局容器，子元素按列排列

#### 2. Row（行布局）

**文件**: `row.ts`
**描述**: 水平布局容器，子元素按行排列

#### 3. Surface（表面容器）

**文件**: `surface.ts`
**描述**: 卡片式容器，用于组织内容

#### 4. Root（根容器）

**文件**: `root.ts`
**描述**: A2UI 渲染树的根组件

---

### 文本组件

#### 5. Text（文本）

**文件**: `text.ts`
**描述**: 显示文本内容，支持样式

---

### 交互组件

#### 6. Button（按钮）

**文件**: `button.ts`
**描述**: 可点击的按钮组件

#### 7. Checkbox（复选框）

**文件**: `checkbox.ts`
**描述**: 可勾选的复选框

#### 8. Slider（滑块）

**文件**: `slider.ts`
**描述**: 可拖动的滑块控件

#### 9. TextField（文本输入框）

**文件**: `text-field.ts`
**描述**: 文本输入控件

---

### 数据展示组件

#### 10. Card（卡片）

**文件**: `card.ts`
**描述**: 内容卡片容器，带标题和内容区域

#### 11. List（列表）

**文件**: `list.ts`
**描述**: 列表展示组件

#### 12. Icon（图标）

**文件**: `icon.ts`
**描述**: 图标展示组件

#### 13. Image（图片）

**文件**: `image.ts`
**描述**: 图片展示组件

---

### 媒体组件

#### 14. Audio（音频）

**文件**: `audio.ts`
**描述**: 音频播放器组件

#### 15. Video（视频）

**文件**: `video.ts`
**描述**: 视频播放器组件

---

### 其他组件

#### 16. Modal（模态框）

**文件**: `modal.ts`
**描述**: 模态对话框组件

#### 17. Tabs（标签页）

**文件**: `tabs.ts`
**描述**: 标签页切换组件

#### 18. Divider（分隔线）

**文件**: `divider.ts`
**描述**: 分隔线组件

---

## 三、组件使用示例

### 示例 1: 使用自定义 PunnettSquare 组件

```json
{
  "operation": "surfaceUpdate",
  "surfaceId": "main",
  "components": [
    {
      "id": "punnett1",
      "component": {
        "PunnettSquare": {
          "parent1Genotype": { "literalString": "Aa" },
          "parent2Genotype": { "literalString": "aa" },
          "trait": { "literalString": "豌豆颜色" },
          "showPhenotype": { "literalBoolean": true }
        }
      }
    }
  ]
}
```

### 示例 2: 使用官方 Text 和 Card 组件

```json
{
  "operation": "surfaceUpdate",
  "surfaceId": "main",
  "components": [
    {
      "id": "card1",
      "component": {
        "Card": {
          "title": { "literalString": "DNA 结构简介" },
          "children": [
            {
              "id": "text1",
              "component": {
                "Text": {
                  "text": {
                    "literalString": "DNA 是双螺旋结构，由两条互补的核苷酸链组成。"
                  }
                }
              }
            }
          ]
        }
      }
    }
  ]
}
```

---

## 四、组件注册

所有自定义组件已在 `frontend/genetics-app/src/index.ts` 中注册，可通过以下方式导入和使用：

```typescript
import { PunnettSquare } from "./components/genetics/punnett-square";
import { DNAStructure } from "./components/genetics/dna-structure";
import { PhenotypeDistribution } from "./components/genetics/phenotype-distribution";
import { GeneExpression } from "./components/genetics/gene-expression";
import { PedigreeChart } from "./components/genetics/pedigree-chart";
import { CrossOverMap } from "./components/genetics/crossover-map";

customElements.define("genetics-punnett-square", PunnettSquare);
customElements.define("genetics-dna-structure", DNAStructure);
customElements.define("genetics-phenotype-distribution", PhenotypeDistribution);
customElements.define("genetics-gene-expression", GeneExpression);
customElements.define("genetics-pedigree-chart", PedigreeChart);
customElements.define("genetics-crossover-map", CrossOverMap);
```

---

## 五、注意事项

1. **A2UI 版本**: 项目使用 A2UI v0.8（稳定版本）
2. **Schema 验证**: 后端使用 `A2uiSchemaManager` 进行 schema 验证
3. **数据绑定**: 支持通过 `path` 字段进行数据绑定
4. **错误处理**: LLM 生成的 A2UI JSON 会经过验证，失败时会自动重试
5. **自定义组件**: 所有自定义组件都在 `genetics_catalog.json` 中定义 schema
6. **官方组件**: 官方组件由 Lit 渲染器直接支持，无需额外定义

---

## 六、相关文件

| 文件路径                                         | 说明                           |
| ------------------------------------------------ | ------------------------------ |
| `backend/schemas/genetics_catalog.json`          | 自定义组件的 Schema 定义       |
| `backend/main.py`                                | 后端主程序，包含 A2UI 集成逻辑 |
| `backend/services/a2ui_service.py`               | A2UI 服务层                    |
| `frontend/genetics-app/src/a2ui-manager.ts`      | 前端 A2UI 管理器               |
| `frontend/lit/src/0.8/ui/`                       | 官方 A2UI 组件实现             |
| `frontend/genetics-app/src/components/genetics/` | 自定义遗传学组件实现           |
