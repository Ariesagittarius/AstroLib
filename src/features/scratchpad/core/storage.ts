/**
 * src/features/scratchpad/core/storage.ts
 * ============================================================================
 * 空白文档草稿持久化与预设模板库 (Storage & Template Presets)
 * ============================================================================
 * 职责：
 * 1. 负责草稿数据在浏览器 localStorage 中的防抖暂存与即时回填；
 * 2. 检查并消费来自正文划选的临时文段 (sessionStorage)；
 * 3. 内置 5 套权威学术预设模板，供边界查看与双语助读即开即测；
 * 4. 遵守 Rule 9: 绝不向本地代码仓库写入临时状态。
 * ============================================================================
 */

import type { ScratchpadDraft, TemplatePreset, WorkspaceViewMode } from '../types.ts';
import { serializeFrontmatter } from './markdown-parser.ts';

export const STORAGE_KEY_DRAFT = 'astrolib_blank_doc_draft';
export const STORAGE_KEY_VIEW_MODE = 'astrolib_blank_view_mode';
export const SESSION_KEY_SNIPPET = 'astrolib_blank_import_snippet';

/**
 * 内置学术预设模板集
 */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'literature-translation',
    title: '学术文献双语对照翻译',
    description: '前沿学术论文引言与定理段落，自带数学符号与学术专有名词，专为双语助读与临时翻译设计',
    badge: '双语助读推荐',
    category: 'translation',
    draft: {
      metadata: {
        title: 'Quantum Phase Estimation and Error Mitigation',
        description: 'An inquiry into the fault-tolerant bounds of quantum state preparation.',
        author: 'A. Nielsen & I. Chuang (Adapted)',
        subject: '前沿学术文献',
        tags: ['Quantum Computing', 'Linear Algebra', 'Translation'],
      },
      content: `## 1. Introduction and Problem Formulation

The quantum phase estimation (QPE) algorithm is a cornerstone of quantum computation, serving as the central subroutine in quantum algorithms for chemistry, quantum Fourier transform, and Shor's factoring algorithm. Given a unitary operator $U$ with eigenvector $|u\\rangle$ such that

$$
U|u\\rangle = e^{2\\pi i \\theta}|u\\rangle, \\quad \\text{where } \\theta \\in [0, 1)
$$

the objective of the algorithm is to estimate the eigenphase $\\theta$ to $n$ bits of precision with high success probability $1 - \\epsilon$.

In realistic physical implementations, however, environmental decoherence and gate infidelities severely perturb the underlying state. Consider a noise channel $\\mathcal{E}$ acting on the composite Hilbert space $\\mathcal{H}_A \\otimes \\mathcal{H}_B$:

$$
\\mathcal{E}(\\rho) = \\sum_{k=0}^{K-1} E_k \\rho E_k^\\dagger, \\quad \\sum_{k} E_k^\\dagger E_k = I
$$

Here, the Kraus operators $E_k$ characterize the non-unitary deviations from the ideal evolution. In this paper, we explore how real-time error mitigation bounds the estimator bias $\\Delta \\theta$.

## 2. Theoretical Bound on Estimator Variance

To rigorously quantify the measurement fidelity under stochastic Pauli noise, we state the following fundamental result:

<Theorem title="Theorem 1.1 (Phase Estimator Variance Bound)">
Let $U$ be a unitary acting on $n$ qubits, and let $\\widehat{\\theta}$ denote the estimator obtained from $m$ measurement shots. If the gate depolarizing rate satisfies $p < p_{\\text{crit}}$, then the mean squared error is strictly upper-bounded by:

$$
\\mathbb{E}[(\\widehat{\\theta} - \\theta)^2] \\le \\frac{\\pi^2}{2^{2m}} + \\frac{p}{1 - p} \\cdot \\|\\nabla_\\theta U\\|_2^2
$$
</Theorem>

<Note title="Note on Experimental Feasibility">
Notice that the second term depends linearly on the depolarizing parameter $p$. When implementing this on superconducting transmon processors, dynamical decoupling sequences should be inserted during idle stages.
</Note>

## 3. Algorithmic Complexity

We summarize the key complexity parameters in the comparison below:

| Protocol | Circuit Depth | Ancilla Qubits | Robustness to Dephasing |
| :--- | :---: | :---: | :---: |
| Standard QPE | $\\mathcal{O}(2^n)$ | $n$ | Low |
| Iterative QPE | $\\mathcal{O}(2^n)$ | $1$ | Moderate |
| Robust Adaptive QPE | $\\mathcal{O}(n \\log(1/\\epsilon))$ | $2$ | High |

The adaptive approach achieves an exponential reduction in ancilla overhead while maintaining Heisenberg-limited scaling.`,
    },
  },
  {
    id: 'math-boundary-test',
    title: '高等数学公式与定理边界测试',
    description: '涵盖长多行方程、分块矩阵、自定义编号、求和积分与极限，用于排查公式溢出与排版边界',
    badge: 'KaTeX 排版边界',
    category: 'math',
    draft: {
      metadata: {
        title: '泛函分析与微分方程边界排版测试',
        description: '极限排版边界、超宽矩阵与多行公式对齐测试',
        author: 'AstroLib Typography Lab',
        subject: '大学数学',
        tags: ['KaTeX', 'Matrix', 'Boundary Test'],
      },
      content: `## 1. 复杂矩阵与分块方程测试

以下为测试 KaTeX 在多视口与小屏幕下的横向自适应滚动行为：

$$
\\mathbf{A} = \\begin{pmatrix}
a_{11} & a_{12} & \\cdots & a_{1n} & \\big| & b_{11} & b_{12} \\\\
a_{21} & a_{22} & \\cdots & a_{2n} & \\big| & b_{21} & b_{22} \\\\
\\vdots & \\vdots & \\ddots & \\vdots & \\big| & \\vdots & \\vdots \\\\
a_{m1} & a_{m2} & \\cdots & a_{mn} & \\big| & b_{m1} & b_{m2} \\\\
\\hline
0 & 0 & \\cdots & 0 & \\big| & 1 & 0 \\\\
0 & 0 & \\cdots & 0 & \\big| & 0 & 1
\\end{pmatrix} \\in \\mathbb{R}^{(m+2) \\times (n+2)}
$$

## 2. 多行对齐与编号公式

通过 \`aligned\` 环境进行推导链条排版，并测试自定义 \`\\tag\` 编号：

$$
\\begin{aligned}
\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx
&= \\sqrt{\\left( \\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx \\right) \\left( \\int_{-\\infty}^{+\\infty} e^{-y^2} \\, dy \\right)} \\\\
&= \\sqrt{\\iint_{\\mathbb{R}^2} e^{-(x^2+y^2)} \\, dx \\, dy} \\\\
&= \\sqrt{\\int_0^{2\\pi} d\\theta \\int_0^{+\\infty} e^{-r^2} r \\, dr} \\\\
&= \\sqrt{2\\pi \\cdot \\left[ -\\frac{1}{2} e^{-r^2} \\right]_0^{+\\infty}} = \\sqrt{\\pi}
\\end{aligned}
\\tag{Gauss-Int}
$$

## 3. 分段函数与极限表达式

$$
f(x, y) = \\begin{cases}
\\dfrac{x^3 y - x y^3}{x^2 + y^2}, & (x, y) \\ne (0, 0) \\\\[1em]
0, & (x, y) = (0, 0)
\\end{cases}
$$

证明混合偏导数在原点处不连续：

$$
\\lim_{h \\to 0} \\frac{f_x(0, h) - f_x(0, 0)}{h} = -1 \\ne 1 = \\lim_{k \\to 0} \\frac{f_y(k, 0) - f_y(0, 0)}{k}
$$`,
    },
  },
  {
    id: 'mermaid-diagrams',
    title: 'Mermaid 知识流程与时序图',
    description: '测试 Mermaid 图表渲染，支持公式节点、深色浅色主题自适应与响应式宽度缩放',
    badge: '图表可视化',
    category: 'diagram',
    draft: {
      metadata: {
        title: '现代通信系统与信号处理拓扑',
        description: 'Mermaid 架构流程图与时序通信交互图',
        author: 'System Architecture Group',
        subject: '通信原理与计算机网络',
        tags: ['Mermaid', 'Flowchart', 'Sequence'],
      },
      content: `## 1. 数字带通调制系统处理流水线

下列流程图演示从基带脉冲成型到射频混频的完整硬件流向：

\`\`\`mermaid
flowchart LR
    subgraph Transmitter ["发射端链路"]
        Src["信源编码 $b_k$"] --> Mod["星座映射 (QPSK)"]
        Mod --> RRC["根升余弦成型滤波 $p(t)$"]
        RRC --> Mixer["I/Q 正交混频器"]
        LO["本地载波 $\\cos(2\\pi f_c t)$"] --> Mixer
        Mixer --> PA["功率放大器 (PA)"]
    end

    subgraph Channel ["无线信道"]
        PA --> AWGN["加性高斯白噪声信道 $n(t)$"]
    end

    subgraph Receiver ["接收端链路"]
        AWGN --> LNA["低噪声放大器 (LNA)"]
        LNA --> Demod["相干解调与下混频"]
        Demod --> Match["匹配滤波器 $h(t)$"]
        Match --> Decision["最大似然判决器 $\\widehat{b}_k$"]
    end
\`\`\`

## 2. 信令握手时序交互

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as 客户端 (Client)
    participant Auth as 认证中心 (Auth Center)
    participant Server as 业务服务 (App Server)
    participant DB as 分布式数据库

    Client->>Auth: 提交凭证请求 Token
    Auth-->>Client: 颁发数字签名 JWT (HS256)
    Client->>Server: 携带 Bearer Token 请求文章元数据
    Server->>DB: 验证缓存与段落索引
    DB-->>Server: 返回结构化段落与公式 AST
    Server-->>Client: 返回 200 OK 并开始渲染流
\`\`\``,
    },
  },
  {
    id: 'astrolib-academic-cards',
    title: 'AstroLib 核心学术卡片展示',
    description: '包含定理、定义、例题、性质、小结、注意、解析与算法等全部学术容器组件',
    badge: '全量学术卡片',
    category: 'cards',
    draft: {
      metadata: {
        title: 'AstroLib 大学教材全套排版组件速览',
        description: '验证 12 种核心学术卡片的色彩系统与图标对齐',
        author: 'AstroLib Editorial Board',
        subject: '排版规范与样式测试',
        tags: ['Design System', 'Cards', 'Academic Rigor'],
      },
      content: `## 1. 核心理论卡片

<Definition title="定义 2.1 (Hilbert 空间)">
设 $H$ 为数域 $\\mathbb{F}$ 上的内积空间。若 $H$ 在由内积诱导的范数 $\\|x\\| = \\sqrt{\\langle x, x \\rangle}$ 下是完备的度量空间，则称 $H$ 为 **Hilbert 空间**。
</Definition>

<Theorem title="定理 2.4 (Riesz 表示定理)">
设 $H$ 为实 Hilbert 空间，$f$ 是 $H$ 上的任意连续线性泛函。则在 $H$ 中存在唯一的向量 $y$，使得对所有的 $x \\in H$，均有：

$$
f(x) = \\langle x, y \\rangle, \\quad \\text{且 } \\|f\\| = \\|y\\|
$$
</Theorem>

<Property title="性质 2.2 (正交投影算子的自伴性)">
设 $M$ 为 Hilbert 空间 $H$ 的闭子空间，则到 $M$ 上的正交投影算子 $P_M$ 满足幂等性 $P_M^2 = P_M$ 且为自伴算子 $P_M^* = P_M$。
</Property>

## 2. 实践、例题与解析

<Example title="例题 2.1 (投影向量的最小距离性)">
求点 $v = (1, 2, 3)^T$ 到由向量 $u_1 = (1, 0, 1)^T, u_2 = (0, 1, 1)^T$ 张成的子空间 $W$ 上的正交投影 $\\operatorname{proj}_W(v)$。
</Example>

<Solution title="查看解题步骤与公式推导">
构造基矩阵 $A = [u_1, u_2]$，根据正规方程 $A^T A x = A^T v$ 计算投影系数：

$$
A^T A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}, \\quad A^T v = \\begin{pmatrix} 4 \\\\ 5 \\end{pmatrix}
$$

解得 $x = \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$，因此 $\\operatorname{proj}_W(v) = 1 u_1 + 2 u_2 = (1, 2, 3)^T$。点恰好位于子空间中，距离为 $0$。
</Solution>

<Note title="重要推论与易错点">
注意基向量 $u_1, u_2$ 并非正交基。在非正交基下必须求解正规方程或先施加 Gram-Schmidt 正交化，不可直接将各自分量简单相加！
</Note>

## 3. 算法描述

<Algorithm title="算法 1 (Gram-Schmidt 经典正交化)">
输入线性无关向量组 $\\{v_1, v_2, \\dots, v_k\\}$：
1. 取 $u_1 = v_1$；
2. 对 $i = 2, \\dots, k$，计算：
$$
u_i = v_i - \\sum_{j=1}^{i-1} \\frac{\\langle v_i, u_j \\rangle}{\\langle u_j, u_j \\rangle} u_j
$$
3. 输出正交向量组 $\\{u_1, \\dots, u_k\\}$。
</Algorithm>`,
    },
  },
  {
    id: 'clean-blank',
    title: '纯净空白文档',
    description: '清空全部内容与预设，提供极简白纸，准备开始自由创作与验证',
    badge: '从零开始',
    category: 'blank',
    draft: {
      metadata: {
        title: '我的学术随笔',
        description: '记录学术思考、推导笔记或临时文献翻译',
        author: '读者',
        subject: '自主研究',
        tags: ['Draft'],
      },
      content: `## 1. 标题一

在此处开始书写您的正文内容。支持标准 Markdown 语法、行内公式如 $E = mc^2$ 以及块级公式：

$$
e^{i\\pi} + 1 = 0
$$

点击右上角「双语助读 (Alt+Y)」可即时开启段落对照翻译；点击「导出」可一键生成高清学术 PDF。`,
    },
  },
];

export class ScratchpadStorage {
  /**
   * 读取保存的本地草稿
   */
  public static loadDraft(): ScratchpadDraft | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ScratchpadDraft;
      if (parsed && typeof parsed.content === 'string') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 保存草稿至本地 localStorage
   */
  public static saveDraft(draft: ScratchpadDraft): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
    } catch (e) {
      console.warn('[ScratchpadStorage] 写入草稿失败:', e);
    }
  }

  /**
   * 清除本地草稿
   */
  public static clearDraft(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch {}
  }

  /**
   * 读取视口模式偏好（split / preview / edit）
   */
  public static getViewMode(): WorkspaceViewMode {
    if (typeof localStorage === 'undefined') return 'split';
    try {
      const mode = localStorage.getItem(STORAGE_KEY_VIEW_MODE) as WorkspaceViewMode | null;
      if (mode === 'split' || mode === 'preview' || mode === 'edit') {
        return mode;
      }
    } catch {}
    // 默认大屏 split，小屏 preview
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'preview';
    }
    return 'split';
  }

  /**
   * 保存视口模式偏好
   */
  public static setViewMode(mode: WorkspaceViewMode): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_VIEW_MODE, mode);
    } catch {}
  }

  /**
   * 检查并消费来自阅读页划选的临时文段
   */
  public static consumeImportedSnippet(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const snippet = sessionStorage.getItem(SESSION_KEY_SNIPPET);
      if (snippet) {
        sessionStorage.removeItem(SESSION_KEY_SNIPPET);
        return snippet.trim();
      }
    } catch {}
    return null;
  }

  /**
   * 设置划选文段供工作台使用
   */
  public static setImportedSnippet(text: string): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_KEY_SNIPPET, text.trim());
    } catch {}
  }

  /**
   * 获取指定 ID 的预设模板，若未找到则返回默认文献翻译模板
   */
  public static getTemplate(templateId: string): TemplatePreset {
    const found = TEMPLATE_PRESETS.find((t) => t.id === templateId);
    return found || TEMPLATE_PRESETS[0];
  }
}
