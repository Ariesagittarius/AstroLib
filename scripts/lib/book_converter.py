# -*- coding: utf-8 -*-
import os
import re
import shutil
import sys
from .mdx_sanitizer import MdxSanitizer, TextCleaner
from .section_chunker import SectionChunker, SectionData, ChapterData
from .card_parser import CardParser
from .exercise_parser import ExerciseParser

class BookConverter:
    """新书转换流水线通用框架基类。

    提供通用的 MinerU full.md 读取、清洗、章节切分、卡片组装、图片自动采集、MDX 规范化写入与封面管理能力。
    """

    DEFAULT_IMPORTS = (
        "import Guide from '@/components/Guide.astro';\n"
        "import Knowledge from '@/components/Knowledge.astro';\n"
        "import Example from '@/components/Example.astro';\n"
        "import Analysis from '@/components/Analysis.astro';\n"
        "import Solution from '@/components/Solution.astro';\n"
        "import Variant from '@/components/Variant.astro';\n"
        "import Note from '@/components/Note.astro';\n"
        "import Block from '@/components/Block.astro';\n"
        "import Method from '@/components/Method.astro';\n"
        "import Exercise from '@/components/Exercise.astro';\n"
    )

    def __init__(
        self,
        book_slug: str,
        collection: str = 'math',
        task_dirs: list[str] | None = None,
        out_dir: str | None = None,
        task_root: str | None = None,
        clean_out_dir: bool = False,
    ):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

        self.book_slug = book_slug
        self.collection = collection
        self.task_dirs = task_dirs or []

        # 路径解析
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = os.path.dirname(script_dir)
        self.task_root = task_root or os.path.join(self.project_root, 'task')
        self.public_dir = os.path.join(self.project_root, 'public')
        self.covers_dir = os.path.join(self.public_dir, 'covers')

        if out_dir:
            self.out_dir = out_dir
        else:
            self.out_dir = os.path.join(
                self.project_root, 'src', 'content', 'docs', 'collections', collection, book_slug
            )
        self.images_out = os.path.join(self.out_dir, 'images')

        if clean_out_dir and os.path.isdir(self.out_dir):
            shutil.rmtree(self.out_dir)
        os.makedirs(self.out_dir, exist_ok=True)

        # 核心子组件实例化
        self.sanitizer = MdxSanitizer()
        self.cleaner = TextCleaner
        self.chunker = SectionChunker
        self.card_parser = CardParser(self.sanitizer)
        self.exercise_parser = ExerciseParser(self.sanitizer)

        # 引用图片映射 {relative_path: source_task_dir}
        self.image_refs: dict[str, str | None] = {}

    def read_task_lines(self, rel_dir: str) -> list[str]:
        """读取指定 task 目录下的 full.md 文件行列表。"""
        full_path = os.path.join(self.task_root, rel_dir, 'full.md')
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"未找到原始产物: {full_path}")
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read().splitlines()

    def collect_images_from_text(self, text: str, default_src_dir: str | None = None):
        """扫描文本中出现的 Markdown 图片引用并登记。"""
        for m in re.finditer(r'!\[[^\]]*\]\((images/[^)]+)\)', text):
            rel = m.group(1)
            self.image_refs.setdefault(rel, default_src_dir)

    def collect_images_from_lines(self, lines: list[str], default_src_dir: str | None = None):
        """扫描行列表中出现的图片引用。"""
        self.collect_images_from_text('\n'.join(lines), default_src_dir=default_src_dir)

    def write_mdx(self, filename: str, title: str, body: str, imports: str | None = None):
        """写入单篇 MDX 文件，自动格式化 frontmatter title，注入组件引入并自动收集正文中的图片引用。"""
        os.makedirs(self.out_dir, exist_ok=True)
        # 自动收集图片
        self.collect_images_from_text(body)

        safe_title = self.sanitizer.clean_yaml_title(title)
        header = f"---\ntitle: '{safe_title}'\n---\n\n"
        imp = imports or self.DEFAULT_IMPORTS
        filepath = os.path.join(self.out_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(header + imp + '\n' + body.strip() + '\n')

    def write_intro(self, title: str, body: str, filename: str = '00_内容简介.mdx'):
        self.write_mdx(filename, title, body)
        print(f"  [page] 生成 {filename} ({title})")

    def write_preface(self, title: str, body: str, filename: str = '01_绪论.mdx'):
        self.write_mdx(filename, title, body)
        print(f"  [page] 生成 {filename} ({title})")

    def write_section(self, ch: int, sec: int, title: str, body: str) -> str:
        """生成并写入常规章节页面，返回文件名。"""
        stitle = self.sanitizer.safe_title(title)
        fname = f"{ch}.{sec}_{stitle}.mdx" if stitle else f"{ch}.{sec}.mdx"
        page_title = f"{ch}.{sec} {title}" if title else f"{ch}.{sec}"
        self.write_mdx(fname, page_title, body)
        print(f"  [page] 生成 {fname}")
        return fname

    def write_appendix(self, prefix: str, title: str, body: str) -> str:
        """生成并写入附录页面。"""
        stitle = self.sanitizer.safe_title(title)
        fname = f"{prefix}_{stitle}.mdx"
        self.write_mdx(fname, title, body)
        print(f"  [page] 生成 {fname}")
        return fname

    def write_answers_page(self, ch: int, sec: int, title: str, body: str, prefix: str = '') -> str:
        """生成并写入课后答案页面。"""
        if prefix:
            fname = f"{prefix}{ch}_{self.sanitizer.safe_title(title)}.mdx"
        else:
            fname = f"{ch}.{sec}_{self.sanitizer.safe_title(title)}.mdx"
        self.write_mdx(fname, title, body)
        print(f"  [page] 生成 {fname}")
        return fname

    def write_tail_exercises_by_type(
        self,
        ch: int,
        start_sec: int,
        tail_types: dict[str, list[str]],
        ans_chunk: list[str] | None = None,
    ) -> int:
        """批量按题型（选择题/填空题/解答题）写入课后题页面，返回下一个可用节序号。"""
        idx = start_sec
        type_mapping = {'选择题': 1, '填空题': 2, '解答题': 3}
        for tname, tlines in tail_types.items():
            if not tlines:
                continue
            sec_type = type_mapping.get(tname, 1)
            cards = self.exercise_parser.parse_exercises(tlines, ch, sec_type)
            body = f"## {tname}\n\n" + self.exercise_parser.render_exercises(cards)
            fname = f"{ch}.{idx}_第{ch}章习题-{tname}.mdx"
            self.write_mdx(fname, f"第{ch}章 习题（{tname}）", body)
            print(f"  [page] 生成 第{ch}章 习题-{tname} ({len(cards)} 题)")
            idx += 1

        if ans_chunk:
            body = "## 习题参考答案\n\n" + self.card_parser.render_body(ans_chunk)
            fname = f"{ch}.{idx}_第{ch}章习题参考答案.mdx"
            self.write_mdx(fname, f"第{ch}章 习题参考答案", body)
            print(f"  [page] 生成 第{ch}章 习题参考答案")
            idx += 1

        return idx

    def copy_images(self, search_dirs: list[str] | None = None) -> int:
        """将所有收集到的图片从 task 目录批量复制到输出 images/ 目录。"""
        os.makedirs(self.images_out, exist_ok=True)
        dirs = list(search_dirs or self.task_dirs)
        copied = 0
        missing = 0

        for rel, specific_src in self.image_refs.items():
            name = os.path.basename(rel)
            dst = os.path.join(self.images_out, name)
            if os.path.exists(dst):
                continue
            found = None
            cand_dirs = ([specific_src] if specific_src else []) + dirs
            for d in cand_dirs:
                if not d:
                    continue
                cand = os.path.join(self.task_root, d, 'images', name)
                if os.path.exists(cand):
                    found = cand
                    break
            if found:
                shutil.copy2(found, dst)
                copied += 1
            else:
                missing += 1
                print(f"  [warn] 图片缺失: {rel}")

        print(f"[images] 引用图片 {len(self.image_refs)} 个，新拷贝 {copied} 个 (缺失: {missing})")
        return copied

    def copy_cover(self, src_rel_or_name: str, dst_filename: str | None = None):
        """从 task 目录中复制封面图片到 public/covers/。"""
        os.makedirs(self.covers_dir, exist_ok=True)
        dst_name = dst_filename or f"{self.book_slug}.jpg"
        dst_path = os.path.join(self.covers_dir, dst_name)

        # 查找来源
        if os.path.isabs(src_rel_or_name) and os.path.exists(src_rel_or_name):
            shutil.copy2(src_rel_or_name, dst_path)
            print(f"[cover] 封面已拷贝到 public/covers/{dst_name}")
            return

        # 在 task_dirs 中逐一搜索
        found = None
        for d in self.task_dirs:
            cand1 = os.path.join(self.task_root, d, 'images', src_rel_or_name)
            cand2 = os.path.join(self.task_root, d, src_rel_or_name)
            if os.path.exists(cand1):
                found = cand1
                break
            if os.path.exists(cand2):
                found = cand2
                break

        if found:
            shutil.copy2(found, dst_path)
            print(f"[cover] 封面已拷贝到 public/covers/{dst_name}")
        else:
            print(f"  [warn] 未找到封面源图: {src_rel_or_name}")

    def generate_cover(
        self,
        title: str,
        subtitle: str = '',
        author: str = '',
        publisher: str = '',
        dst_filename: str | None = None,
    ):
        """使用 PIL 生成一张简约的图书卡片封面（用于 OCR 缺失封面图的书籍）。"""
        try:
            from PIL import Image, ImageDraw, ImageFont
        except Exception:
            print("  [warn] PIL 不可用，跳过封面生成")
            return

        os.makedirs(self.covers_dir, exist_ok=True)
        dst_name = dst_filename or f"{self.book_slug}.jpg"
        dst_path = os.path.join(self.covers_dir, dst_name)
        if os.path.exists(dst_path):
            return

        W, H = 600, 840
        img = Image.new('RGB', (W, H))
        draw = ImageDraw.Draw(img)
        top = (11, 45, 66)
        bottom = (3, 17, 32)
        for y in range(H):
            t = y / H
            r = int(top[0] + (bottom[0] - top[0]) * t)
            g = int(top[1] + (bottom[1] - top[1]) * t)
            b = int(top[2] + (bottom[2] - top[2]) * t)
            draw.line([(0, y), (W, y)], fill=(r, g, b))

        fonts = [
            r'C:\Windows\Fonts\msyhbd.ttc',
            r'C:\Windows\Fonts\msyh.ttc',
            r'C:\Windows\Fonts\simhei.ttf',
            r'C:\Windows\Fonts\simsun.ttc',
        ]
        font_path = next((p for p in fonts if os.path.exists(p)), None)

        def font(size):
            return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()

        draw.rectangle([0, 0, W, H], outline=(255, 255, 255), width=4)
        draw.rectangle([14, 14, W - 14, H - 14], outline=(255, 255, 255), width=2)
        draw.text((W // 2, 220), title, font=font(72), fill=(255, 255, 255), anchor='mm')
        if subtitle:
            draw.text((W // 2, 310), subtitle, font=font(44), fill=(190, 210, 230), anchor='mm')
        draw.line([(W // 2 - 90, 390), (W // 2 + 90, 390)], fill=(255, 255, 255), width=2)
        if author:
            draw.text((W // 2, 450), author, font=font(34), fill=(255, 255, 255), anchor='mm')
        if publisher:
            draw.text((W // 2, 650), publisher, font=font(34), fill=(190, 210, 230), anchor='mm')

        img.save(dst_path, quality=90)
        print(f"[cover] 封面已生成 public/covers/{dst_name}")
