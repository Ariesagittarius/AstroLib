import fitz
import re
import os

pdf_path = r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
output_dir = r"src\content\docs\collections\telecom\communication_principles\images"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)

# Definition of the 21 figures with page and search pattern
# Format: (fig_id, phys_page, caption_regex, top_padding_ratio_or_keyword, bottom_offset)
figure_targets = [
    # Chapter 11
    ("fig_11_2_1", 403, r"图\s*11\.\s*2\.1\s*"),
    ("fig_11_2_2", 404, r"图\s*11\.\s*2\.\s*2\s*BPSK"),
    ("fig_11_2_3", 404, r"图\s*11\.\s*2\.\s*3\s*产生QAM"),
    ("fig_11_2_4", 405, r"图\s*11\.\s*2\.\s*4\s*先产生"),
    ("fig_11_3_1", 406, r"图\s*11\.\s*3\.\s*1\s*OFDM"),
    ("fig_11_4_1", 407, r"图\s*11\.\s*4\.\s*1\s*加入保护"),
    ("fig_11_4_2", 407, r"图\s*11\.\s*4\.\s*2\s*加空闲"),
    ("fig_11_4_3", 408, r"图\s*11\.\s*4\.\s*3\s*"),
    ("fig_11_4_4", 408, r"图\s*11\.\s*4\.\s*4\s*"),
    ("fig_11_5_1", 409, r"图\s*11\.\s*5\.1\s*OFDM"),
    ("fig_11_6_1", 411, r"图\s*11\.6\.1\s*DAB"),

    # Chapter 12
    ("fig_12_1_1", 412, r"图\s*12\.\s*1\.\s*1\s*简化的通信"),
    ("fig_12_3_1", 418, r"图\s*12\.\s*3\.\s*1\s*频谱效率"),
    ("fig_12_3_2", 419, r"图\s*12\.\s*3\.\s*2\s*实际编码"),
    ("fig_12_4_1", 421, r"图\s*12\.\s*4\.\s*1\s*移动通信"),
    ("fig_12_4_2", 422, r"图\s*12\.4\.2\s*衰落信道"),

    # Chapter 13
    ("fig_13_2_1", 425, r"图\s*13\.\s*2\.\s*1\s*树形图"),
    ("fig_13_3_1", 426, r"图\s*13\.3\.\s*1\s*电路转接"),
    ("fig_13_4_1", 430, r"图\s*13\.\s*4\.\s*1\s*电话信令"),
    ("fig_13_4_2", 432, r"图\s*13\.\s*4\.\s*2\s*HDLC"),
    ("fig_13_5_1", 433, r"图\s*13\.\s*5\.\s*1\s*NGN"),
]

# Let's inspect each figure's caption bbox on its page and figure out the drawing bbox above/below it
results = []
for fig_id, phys_p, cap_pattern in figure_targets:
    page = doc[phys_p - 1]
    blocks = page.get_text("blocks")
    
    cap_block = None
    for b in blocks:
        text = b[4].strip()
        if re.search(cap_pattern, text):
            cap_block = b
            break
            
    if not cap_block:
        # try more relaxed
        for b in blocks:
            text = b[4].strip()
            clean_text = re.sub(r"\s+", "", text)
            clean_pat = re.sub(r"\\s\*", "", cap_pattern).replace(r"\.", ".").replace("r", "")
            if fig_id.replace("_", ".") in clean_text:
                cap_block = b
                break
                
    results.append({
        "fig_id": fig_id,
        "phys_page": phys_p,
        "found": cap_block is not None,
        "cap_bbox": cap_block[:4] if cap_block else None,
        "cap_text": cap_block[4] if cap_block else None
    })

print(f"Matched {sum(1 for r in results if r['found'])} / {len(results)} figure captions.")
for r in results:
    status = "OK" if r['found'] else "MISSING"
    print(f"{r['fig_id']} (Phys {r['phys_page']}): {status} -> {repr(r['cap_text'])}")
