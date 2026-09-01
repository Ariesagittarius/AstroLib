// =========================================================================
// AstroLib Typst Academic Problem Set & Exam Document
// Generated automatically on: 2026/08/31
// Template: workbook | Paper: a4 | Base Font Size: 10.5pt
// Fully compatible with native Typst (Zero external preview package dependencies)
// =========================================================================

#set document(
  title: "工科数学分析第1章极限与连续练习本",
  author: "AstroLib",
)

#set page(
  paper: "a4",
  margin: (x: 2.0cm, top: 2.3cm, bottom: 2.2cm),
  footer-descent: 0%,
  footer: context align(center)[
    #text(font: ("Times New Roman", "SimSun", "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC"), size: 9pt)[
      工科数学分析试题第#counter(page).display()页（共#counter(page).final().at(0)页）
    ]
  ]
)

#set text(
  font: ("Times New Roman", "SimSun", "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC"),
  size: 10.5pt,
  lang: "zh",
)

#set par(
  leading: 1.15em,
  justify: true,
)

// 行内数学公式微距美化
#show math.equation.where(block: false): it => h(0.25em, weak: true) + it + h(0.25em, weak: true)

// -------------------------------------------------------------------------
// 核心学术排版宏定义 (Academic Design System Tokens)
// -------------------------------------------------------------------------
#let blank(width) = box(width: width)[#line(length: 100%, stroke: 0.6pt)]
#let dfrac(num, den) = math.display(math.frac(num, den))
#let heiti(size: 1em, body) = text(font: ("SimHei", "Heiti SC", "Source Han Sans SC", "Microsoft YaHei"), size: size)[#body]
#let question-spacing = 1.6em

#let problem(body) = block[
  #set par(first-line-indent: 0pt)
  #h(2em)#body
]

#let part(label, body) = problem[(#box(width: 0.8em, align(center)[#label]))#h(0.4em)#body]

#set heading(hanging-indent: 2em)
#show heading.where(level: 1): body => [
  #v(1.2em)
  #heiti(size: 11.5pt)[#body]
  #v(0.5em)
]

// 智能多列选择题排版宏
#let choice(
  ..items,
  columns: 1,
  row-gutter: 1.2em,
  column-gutter: 0pt,
  label-format: "A.",
  label-gap: 0.3em,
) = {
  let cells = items
    .pos()
    .enumerate()
    .map(((i, item)) => [
      #numbering(label-format, i + 1)#h(label-gap)#item
    ])

  v(0.2em)
  grid(
    columns: (1fr,) * columns,
    row-gutter: row-gutter,
    column-gutter: column-gutter,
    ..cells,
  )
}

// 元数据与考点微标
#let meta-pill(label) = {
  box(
    fill: rgb("#fafafa"),
    stroke: 0.35pt + rgb("#d4d4d8"),
    radius: 2pt,
    inset: (x: 4pt, y: 1.8pt),
    baseline: 0%,
    [#text(size: 6.8pt, fill: rgb("#52525b"))[#label]]
  )
}

// 精美作答辅助底纹宏
#let answer-box(height: 5cm, style: "ruled") = {
  if height <= 0cm { return }
  v(4pt)
  if style == "ruled" {
    rect(
      width: 100%,
      height: height,
      stroke: 0.35pt + rgb("#e4e4e7"),
      fill: rgb("#fcfcfd"),
      radius: 2pt,
      inset: 0pt,
      [
        #layout(size => {
          let line-spacing = 8mm
          let count = int(size.height / line-spacing)
          if count > 1 {
            for i in range(1, count) {
              place(top + left, dy: i * line-spacing, line(length: 100%, stroke: (dash: "solid", thickness: 0.3pt, paint: rgb("#edf0f5"))))
            }
          }
          place(bottom + right, dx: -6pt, dy: -4pt)[
            #text(size: 6.5pt, fill: rgb("#a1a1aa"))[作答与推导演算区]
          ]
        })
      ]
    )
  } else if style == "dotted" {
    rect(
      width: 100%,
      height: height,
      stroke: 0.35pt + rgb("#e4e4e7"),
      fill: rgb("#fcfcfd"),
      radius: 2pt,
      inset: 0pt,
      [
        #layout(size => {
          let dot-spacing = 5mm
          let rows = int(size.height / dot-spacing)
          if rows > 1 {
            for r in range(1, rows) {
              place(top + left, dy: r * dot-spacing, line(length: 100%, stroke: (dash: "dotted", thickness: 0.4pt, paint: rgb("#d4d4d8"))))
            }
          }
          place(bottom + right, dx: -6pt, dy: -4pt)[
            #text(size: 6.5pt, fill: rgb("#a1a1aa"))[点阵网格作答区]
          ]
        })
      ]
    )
  } else if style == "grid" {
    rect(
      width: 100%,
      height: height,
      stroke: 0.35pt + rgb("#e4e4e7"),
      fill: rgb("#fcfcfd"),
      radius: 2pt,
      inset: 0pt,
      [
        #layout(size => {
          let grid-spacing = 6mm
          let rows = int(size.height / grid-spacing)
          if rows > 1 {
            for r in range(1, rows) {
              place(top + left, dy: r * grid-spacing, line(length: 100%, stroke: (dash: "solid", thickness: 0.25pt, paint: rgb("#f0f2f5"))))
            }
          }
          place(bottom + right, dx: -6pt, dy: -4pt)[
            #text(size: 6.5pt, fill: rgb("#a1a1aa"))[方格草稿作答区]
          ]
        })
      ]
    )
  } else {
    // blank
    rect(
      width: 100%,
      height: height,
      stroke: 0.4pt + rgb("#e4e4e7"),
      fill: rgb("#fafafa"),
      radius: 3pt,
      inset: 6pt,
      [
        #align(bottom + right)[
          #text(size: 7pt, fill: rgb("#a1a1aa"))[作答留白区]
        ]
      ]
    )
  }
  v(4pt)
}

#align(center)[
  #text(font: ("SimHei", "Heiti SC", "Source Han Sans SC", "Microsoft YaHei"), size: 17pt, weight: "bold", fill: rgb("#18181b"))[工科数学分析第1章极限与连续练习本]
  #if "AstroLib 数字化教辅与智能真题库" != "" [
    #v(3pt)
    #text(size: 10pt, fill: rgb("#52525b"))[AstroLib 数字化教辅与智能真题库]
  ]
]

#v(4pt)


#align(center)[
  #box(
    fill: rgb("#fafafa"),
    stroke: 0.5pt + rgb("#e4e4e7"),
    radius: 3pt,
    inset: (x: 12pt, y: 6pt),
    [
      #grid(
        columns: (1.2fr, 1.2fr, 1.2fr, 1fr),
        align: (left, left, left, right),
        text(size: 8.5pt)[姓名：#underline(offset: 2pt)[#box(width: 60pt)]],
        text(size: 8.5pt)[学号：#underline(offset: 2pt)[#box(width: 65pt)]],
        text(size: 8.5pt)[完成日期：#underline(offset: 2pt)[#box(width: 60pt)[2026/08/31]]],
        text(size: 8.5pt, weight: "bold")[目标分：#underline(offset: 2pt)[#box(width: 35pt)] / 91]
      )
    ]
  )
]
#v(8pt)


= 一、选择题：本大题共 10 小题，共 50 分。在每小题给出的四个选项中，只有一项是符合题目要求的。

#block(width: 100%, breakable: true)[
  1. 已知非负数列 $\{a_n\}, \{b_n\}, \{c_n\}$．且 $lim_(n -> infinity) a_n = 0$, $lim_(n -> infinity) b_n = 1$, $lim_(n -> infinity) c_n = + infinity$，则 ( )．

  #choice(
    $a_n < b_n$,
    $b_n < c_n$,
    [$lim_(n -> infinity) a_n c_n$ 不存在],
    [$lim_(n -> infinity) b_n c_n$ 不存在],
    columns: 1,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: 数列") #meta-pill("考点: a_n")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  2. 设 $f(x) = dfrac(1, x^2) sin x$, $g(x) = dfrac(1, x)$，则当 $x -> infinity$ 时，$f(x)$ 是 $g(x)$ 的 ( )．

  #choice(
    [高阶无穷小],
    [低阶无穷小],
    [等价无穷小],
    [同阶但非等价无穷小],
    columns: 4,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: 无穷小") #meta-pill("考点: 等价无穷小")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  3. 若 $lim_(x -> a) f(x) = infinity$, $lim_(x -> a) g(x) = infinity$，则必有 ( )．

  #choice(
    $lim_(x -> a) (f(x) + g(x)) = infinity$,
    $lim_(x -> a) (f(x) - g(x)) = 0$,
    $lim_(x -> a) dfrac(f(x), g(x)) = infinity$,
    $lim_(x -> a) k f(x) = infinity , k eq.not 0$,
    columns: 1,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  4. $lim_(x -> 0^+) (dfrac(1, x))^( sin x) = ( #h(0.8em) )$．

  #choice(
    [0],
    [1],
    $e$,
    [不存在],
    columns: 4,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  5. 设 $f(x)$ 在 $x=x_0$ 的某个邻域内有定义，下面的条件中为 $f(x)$ 在 $x=x_0$ 处可导的充分必要条件是 ( )．

  #choice(
    [$lim_(h -> 0) dfrac(f(x_0+h) - f(x_0), h)$ 存在],
    [$lim_(h -> 0) dfrac(f(x_0+h^2) - f(x_0), h^2)$ 存在],
    [$lim_(Delta x -> 0) dfrac(f(x_0+ Delta x) - f(x_0- Delta x), Delta x)$ 存在],
    [$lim_(Delta x -> 0) dfrac(f(x_0) - f(x_0- Delta x), Delta x)$ 存在],
    columns: 1,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: lim")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  6. 当 $x -> + infinity$ 时，下列函数中与 $sqrt(x^2+1)-x$ 为等价无穷小的是 ( )．

  #choice(
    $sin dfrac(1, x)$,
    $ln (1-dfrac(1, x))$,
    $1- cos dfrac(1, x)$,
    $e^(1/x^2)-1$,
    columns: 2,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: 无穷小") #meta-pill("考点: 等价无穷小")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  7. 设有数列：① $\{ (2^n+(-2)^n)^(1/n) \}$，② $\{ dfrac(1, 1+2) + dfrac(1, 1+2^2) + ... + dfrac(1, 1+2^n) \}$，③ $\{ (1+dfrac(1, n))^n \}$，④ $\{ dfrac(n+2^n, 3^n) \}$，其中收敛数列的个数为 ( )．

  #choice(
    [1],
    [2],
    [3],
    [4],
    columns: 4,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: 数列") #meta-pill("考点: 收敛")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  8. 设 $f(x) = cases(dfrac(2+e^(1/x), 1+e^(1/x)) + arctan dfrac(1, x), quad x eq.not 0, 0, quad x=0)$，则 $x=0$ 是 $f(x)$ 的 ( )．

  #choice(
    [连续点],
    [第一类间断点，且为跳跃间断点],
    [第一类间断点，且为可去间断点],
    [第二类间断点],
    columns: 2,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: 连续") #meta-pill("考点: 间断点")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  9. 设 $lim_(x -> 0) ( 1+dfrac(f(2x), x) )^(1/x) = e$，则 $lim_(x -> 0) dfrac(f(x), x^2) = ( #h(0.8em) )$．

  #choice(
    $dfrac(1, 4)$,
    $dfrac(1, 2)$,
    [2],
    [4],
    columns: 2,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: lim")]
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  10. 设函数 $f(x) = cases(dfrac(e^x-1-x, x^2), quad x < 0, dfrac(1, ln (1+x)), quad x gt.eq.slant 0)$，则 $f(x)$ 在 $x=0$ 处 ( )．

  #choice(
    [不连续],
    [连续，但不导],
    [一阶可导，但二阶不可导],
    [二阶可导],
    columns: 4,
  )
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("工科数学分析（上）") #meta-pill("考点: 连续")]
  #v(0.6em)
]


= 二、填空题：本大题共 3 小题，共 15 分。请将最终计算或化简结果填入指定横线上。

#block(width: 100%, breakable: true)[
  11. $lim_(n -> infinity) (sqrt(n+sqrt(n)) - sqrt(n-sqrt(n))) =$ #blank(5em)．
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #answer-box(height: 0.8cm, style: "ruled")
]

#block(width: 100%, breakable: true)[
  12. $lim_(x -> infinity) dfrac(3x^2+5, 5x+3) sin dfrac(2, x) =$ #blank(5em)．
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #answer-box(height: 0.8cm, style: "ruled")
]

#block(width: 100%, breakable: true)[
  13. 若 $lim_(x -> 0) dfrac(f'(x), g'(x))$ 不存在，则由 LHôpital 法则得 $lim_(x -> 0) dfrac(f(x), g(x))$ 不存在 #blank(5em) （填“对”或“错”）．
  #v(2pt)
  #align(right)[#meta-pill("5 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #answer-box(height: 0.8cm, style: "ruled")
]


= 三、计算解答题：本大题共 2 小题，共 26 分。解答应写出文字说明、证明过程或演算步骤。

#block(width: 100%, breakable: false)[
  14. 求函数 $f(x) = dfrac(ln |x|, |x-1|) sin x$ 的间断点并指出其类型．
  #v(2pt)
  #align(right)[#meta-pill("14 分") #meta-pill("数学分析（上）") #meta-pill("考点: 间断点") #meta-pill("考点: 可去间断点")]
  #answer-box(height: 5.5cm, style: "ruled")
]

#block(width: 100%, breakable: false)[
  15. 设 $lim_(x -> infinity) (x^2+2x^4)^b - x^a = b$．且 $b eq.not 0$，求常数 $a, b$．
  #v(2pt)
  #align(right)[#meta-pill("12 分") #meta-pill("数学分析（上）") #meta-pill("考点: lim")]
  #answer-box(height: 5.5cm, style: "ruled")
]


// -------------------------------------------------------------------------
// 参考答案与详细解题推导附录
// -------------------------------------------------------------------------
#pagebreak()

#align(center)[
  #text(font: ("SimHei", "Heiti SC", "Source Han Sans SC", "Microsoft YaHei"), size: 14pt, weight: "bold", fill: rgb("#18181b"))[参考答案与详细解题推导]
  #v(2pt)
  #text(size: 8.5pt, fill: rgb("#71717a"))[
    建议在全卷作答完成后对照自评，核验推导步骤完整度并标注错题本
  ]
]
#v(4pt)
#line(length: 100%, stroke: 0.4pt + rgb("#e4e4e7"))
#v(6pt)

#text(size: 10pt, weight: "bold")[一、参考答案速查总表]
#v(4pt)

#align(center)[
  #table(
    columns: (36pt, 1fr, 36pt, 1fr),
    align: (center + horizon, left + horizon, center + horizon, left + horizon),
    stroke: 0.35pt + rgb("#d4d4d8"),
    inset: (x: 6pt, y: 5pt),
    fill: (x, y) => if y == 0 { rgb("#f4f4f5") } else { none },
    [题号], [参考答案], [题号], [参考答案],
    [1], [$1$], [9], [$a = dfrac(1, 2)$, $b = dfrac(2, 3)$],
    [2], [$dfrac(6, 5)$], [10], [D],
    [3], [错], [11], [C],
    [4], [D], [12], [B],
    [5], [A], [13], [B],
    [6], [D], [14], [A],
    [7], [B], [15], [C],
    [8], [$f(x)$ 有可去间断点 $x=0$，跳跃间断点 $x=1$], [], [],
  )
]
#v(10pt)

#text(size: 10pt, weight: "bold")[二、重点大题规范推导与解析]
#v(6pt)
#block(width: 100%, breakable: true, fill: rgb("#fafafa"), stroke: 0.35pt + rgb("#e4e4e7"), radius: 3pt, inset: 8pt)[
  #text(weight: "bold", size: 9.5pt)[【第 1 题 (填空题)】]
  #h(6pt) *参考答案：* $1$
]
#v(6pt)

#block(width: 100%, breakable: true, fill: rgb("#fafafa"), stroke: 0.35pt + rgb("#e4e4e7"), radius: 3pt, inset: 8pt)[
  #text(weight: "bold", size: 9.5pt)[【第 2 题 (填空题)】]
  #h(6pt) *参考答案：* $dfrac(6, 5)$
]
#v(6pt)

#block(width: 100%, breakable: true, fill: rgb("#fafafa"), stroke: 0.35pt + rgb("#e4e4e7"), radius: 3pt, inset: 8pt)[
  #text(weight: "bold", size: 9.5pt)[【第 3 题 (填空题)】]
  #h(6pt) *参考答案：* 错
]
#v(6pt)

#block(width: 100%, breakable: true, fill: rgb("#fafafa"), stroke: 0.35pt + rgb("#e4e4e7"), radius: 3pt, inset: 8pt)[
  #text(weight: "bold", size: 9.5pt)[【第 8 题 (计算题)】]
  #h(6pt) *参考答案：* $f(x)$ 有可去间断点 $x=0$，跳跃间断点 $x=1$
]
#v(6pt)

#block(width: 100%, breakable: true, fill: rgb("#fafafa"), stroke: 0.35pt + rgb("#e4e4e7"), radius: 3pt, inset: 8pt)[
  #text(weight: "bold", size: 9.5pt)[【第 9 题 (计算题)】]
  #h(6pt) *参考答案：* $a = dfrac(1, 2)$, $b = dfrac(2, 3)$
]
#v(6pt)

