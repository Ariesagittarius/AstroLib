// =========================================================================
// Academic Mathematical Problem Sheet
// Template: handout | Paper: a4 | Font: 10.5pt
// Clean, minimal, publication-grade academic layout (Zero UI clutter)
// =========================================================================

#set document(
  title: "第 1 章 极限与连续",
  author: "AstroLib",
)

#set page(
  paper: "a4",
  margin: (x: 2.2cm, top: 2.4cm, bottom: 2.2cm),
  header: context {
    if counter(page).get().first() > 1 [
      #set text(font: ("New Computer Modern", "Times New Roman", "Source Han Serif SC", "SimSun", "STSong", "Songti SC"), size: 8.5pt, fill: rgb("#555555"))
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        [工科数学分析],
        [第 1 章 极限与连续],
      )
      #v(-0.4em)
      #line(length: 100%, stroke: 0.35pt + rgb("#b0b0b0"))
    ]
  },
  footer: context {
    set text(font: ("New Computer Modern", "Times New Roman", "Source Han Serif SC", "SimSun", "STSong", "Songti SC"), size: 8.5pt, fill: rgb("#333333"))
    align(center)[#counter(page).display("1")]
  }
)

#set text(
  font: ("New Computer Modern", "Times New Roman", "Source Han Serif SC", "SimSun", "STSong", "Songti SC"),
  size: 10.5pt,
  lang: "zh",
)

#set par(
  leading: 0.85em,
  justify: true,
)

// 行内数学公式微距微调
#show math.equation.where(block: false): it => h(0.2em, weak: true) + it + h(0.2em, weak: true)

// 基础排版宏
#let blank(width) = box(width: width)[#line(length: 100%, stroke: 0.5pt)]
#let dfrac(num, den) = math.display(math.frac(num, den))

// 一级大题标题规范（教材体例）
#show heading.where(level: 1): it => block(spacing: 1.2em)[
  #text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 11pt, weight: "bold")[#it.body]
  #v(0.3em)
]

// 智能选择题多列网格宏
#let choice(
  ..items,
  columns: 1,
  row-gutter: 0.9em,
  column-gutter: 1.5em,
  label-format: "A.",
  label-gap: 0.35em,
) = {
  let cells = items
    .pos()
    .enumerate()
    .map(((i, item)) => [
      #text(weight: "medium")[#numbering(label-format, i + 1)]#h(label-gap)#item
    ])

  v(0.2em)
  grid(
    columns: (1fr,) * columns,
    row-gutter: row-gutter,
    column-gutter: column-gutter,
    ..cells,
  )
  v(0.2em)
}

// -------------------------------------------------------------------------
// 章节讲义卷头
// -------------------------------------------------------------------------
#align(center)[
  #v(0.4em)
  #text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 10pt, fill: rgb("#555555"), tracking: 1.2pt)[工科数学分析]
  #v(0.2em)
  #text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 17pt, weight: "bold")[第 1 章 极限与连续]
  #v(0.6em)
  #line(length: 100%, stroke: 0.4pt + rgb("#333333"))
  #v(0.5em)
]

= 一、选择题（下列各题给出的四个选项中，只有一个选项符合题目要求。）

#block(width: 100%, breakable: true)[
  *1.* #h(0.35em) 已知非负数列 $\{a_n\}, \{b_n\}, \{c_n\}$．且 $lim_(n -> infinity) a_n = 0$, $lim_(n -> infinity) b_n = 1$, $lim_(n -> infinity) c_n = + infinity$，则 ( )．

  #choice(
    $a_n < b_n$,
    $b_n < c_n$,
    [$lim_(n -> infinity) a_n c_n$ 不存在],
    [$lim_(n -> infinity) b_n c_n$ 不存在],
    columns: 1,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *2.* #h(0.35em) 设 $f(x) = dfrac(1, x^2) sin x$, $g(x) = dfrac(1, x)$，则当 $x -> infinity$ 时，$f(x)$ 是 $g(x)$ 的 ( )．

  #choice(
    [高阶无穷小],
    [低阶无穷小],
    [等价无穷小],
    [同阶但非等价无穷小],
    columns: 4,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *3.* #h(0.35em) 若 $lim_(x -> a) f(x) = infinity$, $lim_(x -> a) g(x) = infinity$，则必有 ( )．

  #choice(
    $lim_(x -> a) (f(x) + g(x)) = infinity$,
    $lim_(x -> a) (f(x) - g(x)) = 0$,
    $lim_(x -> a) dfrac(f(x), g(x)) = infinity$,
    $lim_(x -> a) k f(x) = infinity , k eq.not 0$,
    columns: 1,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *4.* #h(0.35em) $lim_(x -> 0^+) ( dfrac(1, x) )^( sin x) = ( quad )$．

  #choice(
    [0],
    [1],
    $e$,
    [不存在],
    columns: 4,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *5.* #h(0.35em) 设 $f(x)$ 在 $x=x_0$ 的某个邻域内有定义，下面的条件中为 $f(x)$ 在 $x=x_0$ 处可导的充分必要条件是 ( )．

  #choice(
    [$lim_(h -> 0) dfrac(f(x_0+h) - f(x_0), h)$ 存在],
    [$lim_(h -> 0) dfrac(f(x_0+h^2) - f(x_0), h^2)$ 存在],
    [$lim_(Delta x -> 0) dfrac(f(x_0+ Delta x) - f(x_0- Delta x), Delta x)$ 存在],
    [$lim_(Delta x -> 0) dfrac(f(x_0) - f(x_0- Delta x), Delta x)$ 存在],
    columns: 1,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *6.* #h(0.35em) 当 $x -> + infinity$ 时，下列函数中与 $sqrt(x^2+1) -x$ 为等价无穷小的是 ( )．

  #choice(
    $sin dfrac(1, x)$,
    $ln (1- dfrac(1, x) )$,
    $1- cos dfrac(1, x)$,
    $e^(1/x^2)-1$,
    columns: 2,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *7.* #h(0.35em) 设有数列：① $\{ (2^n+(-2)^n)^(1/n) \}$，② $\{ dfrac(1, 1+2) + dfrac(1, 1+2^2) + ... + dfrac(1, 1+2^n) \}$，③ $\{ (1+ dfrac(1, n) )^n \}$，④ $\{ dfrac(n+2^n, 3^n) \}$，其中收敛数列的个数为 ( )．

  #choice(
    [1],
    [2],
    [3],
    [4],
    columns: 4,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *8.* #h(0.35em) 设 $f(x) = cases(dfrac(2+e^(1/x), 1+e^(1/x)) + arctan dfrac(1, x) , quad x eq.not 0, 0, quad x=0)$，则 $x=0$ 是 $f(x)$ 的 ( )．

  #choice(
    [连续点],
    [第一类间断点，且为跳跃间断点],
    [第一类间断点，且为可去间断点],
    [第二类间断点],
    columns: 2,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *9.* #h(0.35em) 设 $lim_(x -> 0) ( 1+ dfrac(f(2x), x) )^(1/x) = e$，则 $lim_(x -> 0) dfrac(f(x), x^2) = ( quad )$．

  #choice(
    $dfrac(1, 4)$,
    $dfrac(1, 2)$,
    [2],
    [4],
    columns: 2,
  )
  #v(0.6em)
]

#block(width: 100%, breakable: true)[
  *10.* #h(0.35em) 设函数 $f(x) = cases(dfrac(e^x-1-x, x^2) , quad x < 0, dfrac(1, ln (1+x)) , quad x gt.eq.slant 0)$，则 $f(x)$ 在 $x=0$ 处 ( )．

  #choice(
    [不连续],
    [连续，但不导],
    [一阶可导，但二阶不可导],
    [二阶可导],
    columns: 4,
  )
  #v(0.6em)
]


= 二、填空题（把答案填在题中横线上。）

#block(width: 100%, breakable: true)[
  *11.* #h(0.35em) $lim_(n -> infinity) ( sqrt(n+ sqrt(n)) - sqrt(n- sqrt(n)) ) =$ #blank(5em)．
  #v(1cm)
]

#block(width: 100%, breakable: true)[
  *12.* #h(0.35em) $lim_(x -> infinity) dfrac(3x^2+5, 5x+3) sin dfrac(2, x) =$ #blank(5em)．
  #v(1cm)
]

#block(width: 100%, breakable: true)[
  *13.* #h(0.35em) 若 $lim_(x -> 0) dfrac(f'(x), g'(x))$ 不存在，则由 LHôpital 法则得 $lim_(x -> 0) dfrac(f(x), g(x))$ 不存在 #blank(5em) （填“对”或“错”）．
  #v(1cm)
]


= 三、计算题（解答应写出文字说明、演算步骤或证明过程。）

#block(width: 100%, breakable: false)[
  *14.* #h(0.35em) 求函数 $f(x) = dfrac(ln |x|, |x-1|) sin x$ 的间断点并指出其类型．
  #v(5cm)
]

#block(width: 100%, breakable: false)[
  *15.* #h(0.35em) 设 $lim_(x -> infinity) (x^2+2x^4)^b - x^a = b$．且 $b eq.not 0$，求常数 $a, b$．
  #v(5cm)
]


// -------------------------------------------------------------------------
// 参考答案与提示 (Solutions & Hints)
// -------------------------------------------------------------------------
#pagebreak()

#align(center)[
  #v(0.4em)
  #text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 14pt, weight: "bold")[参考答案与提示]
  #v(0.5em)
  #line(length: 100%, stroke: 0.4pt + rgb("#333333"))
  #v(0.5em)
]

#text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 10pt, weight: "bold")[一、参考答案速查]
#v(0.3em)

#align(center)[
  #table(
    columns: (32pt, 1fr, 32pt, 1fr),
    align: (center + horizon, left + horizon, center + horizon, left + horizon),
    stroke: none,
    table.hline(stroke: 0.8pt),
    table.header([*题号*], [*答案*], [*题号*], [*答案*]),
    table.hline(stroke: 0.4pt),
    [1], [$1$], [9], [$a = dfrac(1, 2)$, $b = dfrac(2, 3)$],
    [2], [$dfrac(6, 5)$], [10], [D],
    [3], [错], [11], [C],
    [4], [D], [12], [B],
    [5], [A], [13], [B],
    [6], [D], [14], [A],
    [7], [B], [15], [C],
    [8], [$f(x)$ 有可去间断点 $x=0$，跳跃间断点 $x=1$], [], [],
    table.hline(stroke: 0.8pt),
  )
]
#v(1.0em)

#text(font: ("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman"), size: 10pt, weight: "bold")[二、详细推导与证明]
#v(0.4em)
#block(width: 100%, breakable: true)[
  *1.* #h(0.3em) *【解】* $1$ \ ]
#v(0.8em)

#block(width: 100%, breakable: true)[
  *2.* #h(0.3em) *【解】* $dfrac(6, 5)$ \ ]
#v(0.8em)

#block(width: 100%, breakable: true)[
  *3.* #h(0.3em) *【解】* 错 \ ]
#v(0.8em)

#block(width: 100%, breakable: true)[
  *8.* #h(0.3em) *【解】* $f(x)$ 有可去间断点 $x=0$，跳跃间断点 $x=1$ \ ]
#v(0.8em)

#block(width: 100%, breakable: true)[
  *9.* #h(0.3em) *【解】* $a = dfrac(1, 2)$, $b = dfrac(2, 3)$ \ ]
#v(0.8em)

