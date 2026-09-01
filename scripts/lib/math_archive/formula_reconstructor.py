# -*- coding: utf-8 -*-
"""
公式重构与 KaTeX / LaTeX 语法规范化与 MDX 转义保护模块
"""

import re
from .unicode_normalizer import normalize_math_unicode


def reconstruct_limits(text: str) -> str:
    """重构极限符号"""
    text = re.sub(r'\blim\s*([a-zA-Z\\]+)\s*\\to\s*([\w\+\-\\infty\d\^]+(?:\+|-)?)\b', r'\\lim_{\1 \\to \2}', text)
    text = re.sub(r'\blim\s*([a-zA-Z\\]+\s*\\to\s*[^,\s\(\)\{\}]+)', r'\\lim_{\1}', text)
    return text


def reconstruct_derivatives(text: str) -> str:
    """重构导数与微分符号"""
    text = re.sub(r'\bd2([a-zA-Z])\s*/\s*d([a-zA-Z])2\b', r'\\frac{\\mathrm{d}^2 \1}{\\mathrm{d}\2^2}', text)
    text = re.sub(r'\bd2([a-zA-Z])\s*d([a-zA-Z])2\b', r'\\frac{\\mathrm{d}^2 \1}{\\mathrm{d}\2^2}', text)
    text = re.sub(r'\bd([a-zA-Z])\s*/\s*d([a-zA-Z])\b', r'\\frac{\\mathrm{d}\1}{\\mathrm{d}\2}', text)
    text = re.sub(r'\bd([a-zA-Z])\s*d([a-zA-Z])\b', r'\\frac{\\mathrm{d}\1}{\\mathrm{d}\2}', text)
    text = re.sub(r'\\partial\s*([a-zA-Z])\s*/\s*\\partial\s*([a-zA-Z])', r'\\frac{\\partial \1}{\\partial \2}', text)
    return text


def reconstruct_roots(text: str) -> str:
    """重构根号表达式"""
    text = re.sub(r'\\sqrt\s*\((.*?)\)', r'\\sqrt{\1}', text)
    text = re.sub(r'\\sqrt\s*([a-zA-Z\d]+)', r'\\sqrt{\1}', text)
    return text


def balance_and_escape_katex_math(math_content: str) -> str:
    """
    轻量修复公式中未闭合的大括号或集合单边大括号
    """
    s = math_content
    open_count = len(re.findall(r'(?<!\\)\{', s))
    close_count = len(re.findall(r'(?<!\\)\}', s))
    
    if open_count != close_count:
        if open_count > close_count:
            s = re.sub(r'=\s*\{', r'= \\{ ', s)
            s = re.sub(r'(\s|^)\{([^}]+)$', r'\1\\{\2', s)
        elif close_count > open_count:
            s = re.sub(r'(?<!\\)\}', r'\\}', s, count=(close_count - open_count))

    # 修复 KaTeX 不原生支持的 \overparen 命令为 \overset{\frown}{...}
    s = re.sub(r'\\overparen\{([^}]+)\}', r'\\overset{\\frown}{\1}', s)
    s = re.sub(r'\\overparen\s+([a-zA-Z]+)', r'\\overset{\\frown}{\1}', s)

    return s


def format_latex_expression(expr: str) -> str:
    """对单条数学表达式进行深度清理与 LaTeX 化"""
    if not expr:
        return ""
    s = normalize_math_unicode(expr)
    s = reconstruct_limits(s)
    s = reconstruct_derivatives(s)
    s = reconstruct_roots(s)
    s = balance_and_escape_katex_math(s)
    return s.strip()


def wrap_math_formulas(text: str) -> str:
    """本地回退规则：将纯文本切片包裹公式"""
    if not text:
        return ""
    text = normalize_math_unicode(text)
    text = reconstruct_limits(text)
    text = reconstruct_derivatives(text)
    text = reconstruct_roots(text)
    return text


def escape_for_mdx(text: str) -> str:
    """
    MDX 转义保护：
    保护 LaTeX 公式 $...$ 和 $$...$$ 内的标准 LaTeX 语法与大括号，
    对公式外部的裸 { 转为 &#123;，裸 } 转为 &#125;，
    避免 Astro MDX JSX 编译器误判。
    """
    if not text:
        return ""

    parts = []
    last_end = 0
    math_pattern = re.compile(r'(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)')
    for m in math_pattern.finditer(text):
        non_math = text[last_end:m.start()]
        escaped_non_math = non_math.replace('{', '&#123;').replace('}', '&#125;')
        parts.append(escaped_non_math)
        
        raw_math = m.group(0)
        if raw_math.startswith('$$') and raw_math.endswith('$$'):
            inner = raw_math[2:-2]
            parts.append('$$' + balance_and_escape_katex_math(inner) + '$$')
        elif raw_math.startswith('$') and raw_math.endswith('$'):
            inner = raw_math[1:-1]
            parts.append('$' + balance_and_escape_katex_math(inner) + '$')
        else:
            parts.append(raw_math)

        last_end = m.end()
    
    remainder = text[last_end:]
    parts.append(remainder.replace('{', '&#123;').replace('}', '&#125;'))
    return "".join(parts)
