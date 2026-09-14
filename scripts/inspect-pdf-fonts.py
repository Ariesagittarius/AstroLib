import zlib
import re

presets = ['scholarly', 'classic', 'international', 'mathematical', 'lecture']

for p in presets:
    pdf_path = f'.tmp/typography-specimen/specimen_{p}.pdf'
    with open(pdf_path, 'rb') as f:
        data = f.read()

    decompressed_chunks = []
    for m in re.finditer(rb'stream[\r\n]+([\s\S]*?)[\r\n]+endstream', data):
        raw = m.group(1)
        try:
            decomp = zlib.decompress(raw)
            decompressed_chunks.append(decomp)
        except Exception:
            decompressed_chunks.append(raw)

    all_text = data + b'\n' + b'\n'.join(decompressed_chunks)

    base_fonts = set()
    for match in re.finditer(rb'/(?:BaseFont|FontName)\s*/([A-Za-z0-9\+\-_]+)', all_text):
        name = match.group(1).decode('latin1', errors='ignore')
        clean_name = name.split('+')[-1]
        base_fonts.add(clean_name)

    print(f'=== {p.upper()} ===')
    for fn in sorted(base_fonts):
        print(f'  - {fn}')
