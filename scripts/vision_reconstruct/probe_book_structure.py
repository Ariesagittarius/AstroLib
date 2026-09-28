import re

with open('src/config/collections.config.ts', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('communication-principles')
with open('scripts/vision_reconstruct/book_config_dump.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx:idx+8000])

print("Config written to scripts/vision_reconstruct/book_config_dump.txt")
