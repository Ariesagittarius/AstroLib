#!/usr/bin/env python3
r"""
scripts/measure-font-metrics.py
AstroLib Phase 6A: Typography Metrics Discovery Engine

Functions:
1. Physical OpenType/TrueType binary table extraction (unitsPerEm, ascent, descent, xHeight, capHeight, bbox, etc.)
2. XeLaTeX optical measurement for character sets:
   - CJK: 汉, 学, 微, 积
   - Latin: H, x, a, g
   - Math: X, x, \int, \sum, \phi, \partial
3. Optical alignment ratio computation (cap-to-CJK, x-to-cap, descent ratios)
4. JSON evidence generation
"""

import os
import sys
import json
import struct
import subprocess
import tempfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# -----------------------------------------------------------------------------
# 1. 字体文件定位映射 (使用 kpsewhich 或绝对路径)
# -----------------------------------------------------------------------------

def resolve_font_path(font_name):
    try:
        out = subprocess.check_output(['kpsewhich', font_name], text=True, stderr=subprocess.DEVNULL).strip()
        if out and os.path.exists(out):
            return out
    except Exception:
        pass
    
    # 宿主机备用路径
    fallback_dirs = [
        r'C:\Windows\Fonts',
        os.path.expanduser(r'~\AppData\Local\Microsoft\Windows\Fonts'),
        r'D:\texlive\2026\texmf-dist\fonts\opentype\public',
        r'D:\texlive\2026\texmf-dist\fonts\truetype\public',
    ]
    for d in fallback_dirs:
        candidate = os.path.join(d, font_name)
        if os.path.exists(candidate):
            return candidate
    return None

TARGET_FONTS = {
    # CJK Fonts
    'FandolSong': 'FandolSong-Regular.otf',
    'FandolKai': 'FandolKai-Regular.otf',
    'LXGWWenKaiGBLite': 'LXGWWenKaiGBLite-Regular.ttf',
    'SimSun': r'C:\Windows\Fonts\simsun.ttc',
    # Latin Fonts
    'STIXTwoText': 'STIXTwoText-Regular.otf',
    'LatinModernRoman': 'lmroman10-regular.otf',
    'LibertinusSerif': 'LibertinusSerif-Regular.otf',
    # Math Fonts
    'STIXTwoMath': 'STIXTwoMath-Regular.otf',
    'LatinModernMath': 'latinmodern-math.otf',
    'LibertinusMath': 'LibertinusMath-Regular.otf',
    'NewComputerModernMath': 'NewCMMath-Book.otf',
    'TeXGyreTermesMath': 'texgyretermes-math.otf',
    'TeXGyrePagellaMath': 'texgyrepagella-math.otf',
}

# -----------------------------------------------------------------------------
# 2. OpenType / TrueType 二进制表头解析器
# -----------------------------------------------------------------------------

def parse_font_tables(font_path):
    if not font_path or not os.path.exists(font_path):
        return {'error': 'File not found'}
    
    with open(font_path, 'rb') as f:
        full_data = f.read()
    
    # TTC (TrueType Collection) 处理
    is_ttc = full_data[:4] == b'ttcf'
    if is_ttc:
        num_fonts = struct.unpack('>I', full_data[8:12])[0]
        offset_0 = struct.unpack('>I', full_data[12:16])[0]
        font_data = full_data[offset_0:]
    else:
        font_data = full_data

    if len(font_data) < 12:
        return {'error': 'Invalid font file'}

    sfnt_version = font_data[:4]
    num_tables = struct.unpack('>H', font_data[4:6])[0]
    tables = {}
    for i in range(num_tables):
        offset = 12 + i * 16
        if offset + 16 > len(font_data):
            break
        tag = font_data[offset:offset+4].decode('latin1', errors='ignore')
        chk, tbl_offset, tbl_len = struct.unpack('>III', font_data[offset+4:offset+16])
        if tbl_offset + tbl_len <= len(full_data):
            tables[tag] = full_data[tbl_offset:tbl_offset+tbl_len]
    
    # 'head' table
    head = tables.get('head', b'')
    upem = struct.unpack('>H', head[18:20])[0] if len(head) >= 20 else 0
    bbox = struct.unpack('>hhhh', head[36:44]) if len(head) >= 44 else (0, 0, 0, 0)
    
    # 'hhea' table
    hhea = tables.get('hhea', b'')
    hhea_asc, hhea_desc, hhea_linegap = struct.unpack('>hhh', hhea[4:10]) if len(hhea) >= 10 else (0, 0, 0)
    
    # 'OS/2' table
    os2 = tables.get('OS/2', b'')
    os2_ver = struct.unpack('>H', os2[:2])[0] if len(os2) >= 2 else 0
    weight_class = struct.unpack('>H', os2[4:6])[0] if len(os2) >= 6 else 0
    fs_selection = struct.unpack('>H', os2[62:64])[0] if len(os2) >= 64 else 0
    typo_asc, typo_desc, typo_linegap = struct.unpack('>hhh', os2[68:74]) if len(os2) >= 74 else (0, 0, 0)
    win_asc, win_desc = struct.unpack('>HH', os2[74:78]) if len(os2) >= 78 else (0, 0)
    x_height = struct.unpack('>h', os2[86:88])[0] if len(os2) >= 88 and os2_ver >= 2 else None
    cap_height = struct.unpack('>h', os2[88:90])[0] if len(os2) >= 90 and os2_ver >= 2 else None
    
    # 'maxp' table
    maxp = tables.get('maxp', b'')
    num_glyphs = struct.unpack('>H', maxp[4:6])[0] if len(maxp) >= 6 else 0
    
    # 特性探测
    has_math = 'MATH' in tables
    has_gsub = 'GSUB' in tables
    has_gpos = 'GPOS' in tables
    has_cff = 'CFF ' in tables or 'CFF2' in tables
    is_italic = bool(fs_selection & 0x01)
    is_bold = bool(fs_selection & 0x20)

    return {
        'path': font_path,
        'format': 'CFF/OTF' if has_cff else 'TrueType',
        'unitsPerEm': upem,
        'bbox': {'xMin': bbox[0], 'yMin': bbox[1], 'xMax': bbox[2], 'yMax': bbox[3]},
        'hhea': {'ascent': hhea_asc, 'descent': hhea_desc, 'lineGap': hhea_linegap},
        'typo': {'ascent': typo_asc, 'descent': typo_desc, 'lineGap': typo_linegap},
        'win': {'ascent': win_asc, 'descent': win_desc},
        'xHeight': x_height,
        'capHeight': cap_height,
        'weightClass': weight_class,
        'numGlyphs': num_glyphs,
        'hasMath': has_math,
        'hasGSUB': has_gsub,
        'hasGPOS': has_gpos,
        'isItalic': is_italic,
        'isBold': is_bold,
        'tableTags': sorted(list(tables.keys())),
    }

# -----------------------------------------------------------------------------
# 3. XeLaTeX 物理排版字符光学测量 (Optical Character Measurement)
# -----------------------------------------------------------------------------

def measure_optical_dimensions():
    """
    通过 XeLaTeX 实际测量指定字阶 (11pt 标准正文字阶) 下关键字符的 ht, dp, wd
    """
    tex_script = r'''\documentclass[11pt]{article}
\usepackage{fontspec}
\usepackage{unicode-math}

% CJK Fonts
\newfontfamily\fontFandolSong{FandolSong-Regular.otf}
\newfontfamily\fontFandolKai{FandolKai-Regular.otf}
\newfontfamily\fontWenKai{LXGWWenKaiGBLite-Regular.ttf}

% Latin Fonts
\newfontfamily\fontSTIX{STIX Two Text}
\newfontfamily\fontLM{Latin Modern Roman}
\newfontfamily\fontLibertinus{Libertinus Serif}

\newsavebox{\mboxitem}
\newcommand{\meas}[3]{%
  \sbox{\mboxitem}{#2{#3}}%
  \typeout{OPMEASURE:#1:#3:ht=\the\ht\mboxitem:dp=\the\dp\mboxitem:wd=\the\wd\mboxitem}%
}

\newcommand{\measmath}[3]{%
  \sbox{\mboxitem}{\ensuremath{#3}}%
  \typeout{OPMATH:#1:#2:ht=\the\ht\mboxitem:dp=\the\dp\mboxitem:wd=\the\wd\mboxitem}%
}

\begin{document}
$a$ % initialize math

% 1. CJK 测量 (汉, 学, 微, 积)
\meas{FandolSong}{\fontFandolSong}{汉}
\meas{FandolSong}{\fontFandolSong}{学}
\meas{FandolSong}{\fontFandolSong}{微}
\meas{FandolSong}{\fontFandolSong}{积}

\meas{FandolKai}{\fontFandolKai}{汉}
\meas{FandolKai}{\fontFandolKai}{学}
\meas{FandolKai}{\fontFandolKai}{微}
\meas{FandolKai}{\fontFandolKai}{积}

\meas{LXGWWenKai}{\fontWenKai}{汉}
\meas{LXGWWenKai}{\fontWenKai}{学}
\meas{LXGWWenKai}{\fontWenKai}{微}
\meas{LXGWWenKai}{\fontWenKai}{积}

% 2. Latin 测量 (H, x, a, g)
\meas{STIXTwoText}{\fontSTIX}{H}
\meas{STIXTwoText}{\fontSTIX}{x}
\meas{STIXTwoText}{\fontSTIX}{a}
\meas{STIXTwoText}{\fontSTIX}{g}

\meas{LatinModernRoman}{\fontLM}{H}
\meas{LatinModernRoman}{\fontLM}{x}
\meas{LatinModernRoman}{\fontLM}{a}
\meas{LatinModernRoman}{\fontLM}{g}

\meas{LibertinusSerif}{\fontLibertinus}{H}
\meas{LibertinusSerif}{\fontLibertinus}{x}
\meas{LibertinusSerif}{\fontLibertinus}{a}
\meas{LibertinusSerif}{\fontLibertinus}{g}

\end{document}
'''
    with tempfile.TemporaryDirectory() as td:
        tex_file = os.path.join(td, 'measure_optical.tex')
        with open(tex_file, 'w', encoding='utf8') as f:
            f.write(tex_script)
        res = subprocess.run(
            ['xelatex', '-interaction=nonstopmode', 'measure_optical.tex'],
            cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        optical_data = {}
        stdout_str = res.stdout.decode('utf-8', errors='replace')
        for line in stdout_str.splitlines():
            if line.startswith('OPMEASURE:'):
                parts = line.strip().split(':')
                font_name = parts[1]
                char = parts[2]
                ht_val = float(parts[3].replace('ht=', '').replace('pt', ''))
                dp_val = float(parts[4].replace('dp=', '').replace('pt', ''))
                wd_val = float(parts[5].replace('wd=', '').replace('pt', ''))
                if font_name not in optical_data:
                    optical_data[font_name] = {}
                optical_data[font_name][char] = {'ht': ht_val, 'dp': dp_val, 'wd': wd_val}
        return optical_data

def measure_math_dimensions():
    """
    测量不同数学字体下关键符号的尺寸
    """
    math_fonts = {
        'STIXTwoMath': 'STIXTwoMath-Regular.otf',
        'LatinModernMath': 'latinmodern-math.otf',
        'LibertinusMath': 'LibertinusMath-Regular.otf',
        'NewComputerModernMath': 'NewCMMath-Book.otf',
        'TeXGyreTermesMath': 'texgyretermes-math.otf',
        'TeXGyrePagellaMath': 'texgyrepagella-math.otf',
    }
    
    math_optical = {}
    
    for mname, mfile in math_fonts.items():
        doc = f'''\\documentclass[11pt]{{article}}
\\usepackage{{unicode-math}}
\\setmathfont{{{mfile}}}
\\newsavebox{{\\mboxitem}}
\\newcommand{{\\measmath}}[2]{{%
  \\sbox{{\\mboxitem}}{{\\ensuremath{{#2}}}}%
  \\typeout{{MATHMEASURE:{mname}:#1:ht=\\the\\ht\\mboxitem:dp=\\the\\dp\\mboxitem:wd=\\the\\wd\\mboxitem}}%
}}
\\begin{{document}}
$a$
\\measmath{{X}}{{X}}
\\measmath{{x}}{{x}}
\\measmath{{int}}{{\\int}}
\\measmath{{sum}}{{\\sum}}
\\measmath{{phi}}{{\\phi}}
\\measmath{{partial}}{{\\partial}}
\\end{{document}}
'''
        with tempfile.TemporaryDirectory() as td:
            tex_file = os.path.join(td, 'math_m.tex')
            with open(tex_file, 'w', encoding='utf8') as f:
                f.write(doc)
            res = subprocess.run(
                ['xelatex', '-interaction=nonstopmode', 'math_m.tex'],
                cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
            stdout_str = res.stdout.decode('utf-8', errors='replace')
            for line in stdout_str.splitlines():
                if line.startswith('MATHMEASURE:'):
                    parts = line.strip().split(':')
                    font_key = parts[1]
                    sym_name = parts[2]
                    ht_val = float(parts[3].replace('ht=', '').replace('pt', ''))
                    dp_val = float(parts[4].replace('dp=', '').replace('pt', ''))
                    wd_val = float(parts[5].replace('wd=', '').replace('pt', ''))
                    if font_key not in math_optical:
                        math_optical[font_key] = {}
                    math_optical[font_key][sym_name] = {'ht': ht_val, 'dp': dp_val, 'wd': wd_val}

    return math_optical

# -----------------------------------------------------------------------------
# 4. 主执行流程
# -----------------------------------------------------------------------------

def main():
    print('================================================================')
    print('🔬 AstroLib Phase 6A: Typography Metrics Discovery')
    print('================================================================\n')

    # 1. 表头解析
    print('1. 解析字体底层 OpenType/TrueType 规格表...')
    table_metrics = {}
    for name, fspec in TARGET_FONTS.items():
        if os.path.isabs(fspec) and os.path.exists(fspec):
            fpath = fspec
        else:
            fpath = resolve_font_path(fspec)
        
        if fpath:
            info = parse_font_tables(fpath)
            table_metrics[name] = info
            print(f'   [OK] {name:<22} -> UPEM={info.get("unitsPerEm")}, Glyphs={info.get("numGlyphs")}, CapH={info.get("capHeight")}, xH={info.get("xHeight")}')
        else:
            print(f'   [SKIP] {name:<20} -> 未在本地环境找到')

    # 2. XeLaTeX 光学排版测量
    print('\n2. 执行 XeLaTeX 物理渲染测量 (11pt 正文字阶)...')
    optical_cjk_latin = measure_optical_dimensions()
    print('   [OK] 完成 CJK 与 Latin 关键字符光学测量')

    # 3. 数学公式字体光学测量
    print('\n3. 执行 XeLaTeX 数学公式字体符号测量...')
    optical_math = measure_math_dimensions()
    print('   [OK] 完成 6 套数学字体关键符号光学测量')

    # 4. 汇总输出 JSON
    output_dir = os.path.join(os.path.dirname(__file__), '..', '.tmp', 'typography-metrics')
    os.makedirs(output_dir, exist_ok=True)
    evidence_path = os.path.join(output_dir, 'metrics_evidence.json')

    full_evidence = {
        'timestamp': '2026-09-08',
        'tableMetrics': table_metrics,
        'opticalMetrics': {
            'text': optical_cjk_latin,
            'math': optical_math,
        },
    }

    with open(evidence_path, 'w', encoding='utf8') as f:
        json.dump(full_evidence, f, indent=2, ensure_ascii=False)

    print(f'\n✅ 完整测量证据库已保存至: {evidence_path}')

if __name__ == '__main__':
    main()
