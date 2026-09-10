import zlib
import re
import os

gate_dir = '.tmp/typography-gate'
files = sorted([f for f in os.listdir(gate_dir) if f.endswith('.pdf')])

print(f"{'Filename':<32} | {'Embedded Fonts'}")
print("-" * 80)

for f in files:
    pdf_path = os.path.join(gate_dir, f)
    with open(pdf_path, 'rb') as fp:
        data = fp.read()

    decompressed = []
    for m in re.finditer(rb'stream[\r\n]+([\s\S]*?)[\r\n]+endstream', data):
        raw = m.group(1)
        try:
            decompressed.append(zlib.decompress(raw))
        except:
            decompressed.append(raw)
    all_text = data + b'\n' + b'\n'.join(decompressed)

    base_fonts = set()
    for match in re.finditer(rb'/(?:BaseFont|FontName)\s*/([A-Za-z0-9\+\-_]+)', all_text):
        clean = match.group(1).decode('latin1', errors='ignore').split('+')[-1]
        if not clean.endswith('Identity-H'):
            base_fonts.add(clean)

    fonts_str = ', '.join(sorted(base_fonts))
    print(f"{f:<32} | {fonts_str}")
