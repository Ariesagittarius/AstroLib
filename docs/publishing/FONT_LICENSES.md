# AstroLib 学术字体合规与开源许可证清单 (Font Licenses & Compliance)

本文档归档 AstroLib 学术出版导出体系（Academic Typography System）所涉及之全部开源字体家族的授权许可、上游维护方、版权声明与分发策略。

---

## 1. 总体原则 (Guiding Principles)

1. **100% 自由开源 (100% Free & Open Source)**:
   AstroLib 绝不在核心代码库与默认出版链中绑定任何闭源、商业专有或未明确许可再分发的字体（如方正、汉仪等商业字库）。
2. **TeX Live 原生内建优先 (TeX Live Bundled First)**:
   对于跨平台构建与自动化 CI，优先复用 CTAN / TeX Live 官方发行版自带的标准 OpenType / TrueType 字体包（Fandol, STIX Two, Latin Modern, Libertinus, LXGW WenKai, New Computer Modern）。
3. **零字体污染 (Zero Artifact Clutter)**:
   严禁将数十兆的未裁剪 CJK 字库直接随意存入 Git 版本库，避免仓库膨胀。

---

## 2. 官方字体家族许可证详细清单

### 2.1 STIX Two (Text & Math)
- **授权协议**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **版权声明**: Copyright © 2001–2021 by the STIX Fonts Project Authors.
- **上游地址**: [https://github.com/stipub/stixfonts](https://github.com/stipub/stixfonts)
- **CTAN 包**: `stix2-type1` / `stix2-otf`
- **TeX Live 内置**: 是（包含完整的 OpenType 数学表 `STIXTwoMath-Regular.otf` 与西文正文 `STIXTwoText-*.otf`）
- **分发权限**: 允许商业使用、自由分发、允许嵌入 PDF 文档。

### 2.2 思源宋体 / Source Han Serif SC (Noto Serif CJK SC)
- **授权协议**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **版权声明**: Copyright © 2017–2021 Adobe (http://www.adobe.com/).
- **上游地址**: [https://github.com/adobe-fonts/source-han-serif](https://github.com/adobe-fonts/source-han-serif)
- **TeX Live 内置**: 否（通过操作系统字体库或 Debian/Ubuntu `fonts-noto-cjk` 宏包提供）
- **回退策略**: 若未安装，自动回退至 TeX Live 内建的 `FandolSong-Regular.otf`。

### 2.3 思源黑体 / Source Han Sans SC (Noto Sans CJK SC)
- **授权协议**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **版权声明**: Copyright © 2014–2021 Adobe (http://www.adobe.com/).
- **上游地址**: [https://github.com/adobe-fonts/source-han-sans](https://github.com/adobe-fonts/source-han-sans)
- **TeX Live 内置**: 否（同上）
- **回退策略**: 若未安装，自动回退至 TeX Live 内建的 `FandolHei-Regular.otf`。

### 2.4 Fandol 家族 (Song, Hei, Kai, Fang)
- **授权协议**: GNU General Public License version 3 with Font Exception (GPLv3 + FE)
- **版权声明**: Copyright © 2013–2015 Clerk Ma & Jiun-Jie Wang.
- **上游地址**: [https://ctan.org/pkg/fandol](https://ctan.org/pkg/fandol)
- **TeX Live 内置**: 是（所有 TeX Live 发行版内建标配，Linux 下 ctex 宏包官方默认中文字体）
- **地位**: AstroLib 在极端无网络、无外部字体容器中出具高品质 PDF 的**确定性兜底基石**。

### 2.5 Latin Modern (Roman & Math)
- **授权协议**: GUST Font License (GFL)
- **版权声明**: Copyright © 2003–2009 B. Jackowski and J. M. Nowacki.
- **上游地址**: [https://ctan.org/pkg/lm](https://ctan.org/pkg/lm)
- **TeX Live 内置**: 是
- **地位**: 经典 TeX / LaTeX 官方现代衬线与公式标杆。

### 2.6 Libertinus (Serif & Math)
- **授权协议**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **版权声明**: Copyright © 2012–2023 Khaled Hosny, Caleb Maclennan.
- **上游地址**: [https://github.com/alerque/libertinus](https://github.com/alerque/libertinus)
- **TeX Live 内置**: 是
- **地位**: 专为数理分析、理论物理与高级排版设计的极高可读性字体。

### 2.7 霞鹜文楷 GB / LXGW WenKai GB (Lite)
- **授权协议**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **版权声明**: Copyright © 2020–2024 lxgw (NeoXiang), based on Fontworks Klee One.
- **上游地址**: [https://github.com/lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai)
- **CTAN 包**: `lxgw-wenkai`
- **TeX Live 内置**: 是 (`texmf-dist/fonts/truetype/public/lxgw-fonts/`)
- **地位**: 专用于大学课程讲义、教师随堂教案、图表题注与拓展数字资源前缀的高品质手写楷体。

### 2.8 New Computer Modern (Book & Math)
- **授权协议**: GUST Font License (GFL)
- **版权声明**: Copyright © 2019–2023 Antonis Tsolomitis.
- **上游地址**: [https://ctan.org/pkg/newcomputermodern](https://ctan.org/pkg/newcomputermodern)
- **TeX Live 内置**: 是
- **地位**: 现代 Typst 导出版式默认同款公式字体。
