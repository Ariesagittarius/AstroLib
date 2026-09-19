import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SHARED_EXPORT_STORAGE_KEYS,
} from '@/publishing/common/export-settings.ts';
import {
  resolveChapterAssets,
  normalizeLatexPath,
} from '@/publishing/common/resource-resolver.ts';
import {
  exportChapterToLatex,
} from '@/publishing/latex/chapter-exporter.ts';
import {
  generateLatexDocument,
  renderChapterLatexDocument,
} from '@/publishing/latex/latex-generator.ts';
import { parseMdxChapter } from '@/publishing/common/mdx-chapter-parser.ts';

describe('Publishing Export Acceptance Suite', () => {
  const root = path.resolve('.');

  const createMockDoc = (title = '测试章') => ({
    title,
    cleanTitle: title,
    slug: 'test-chapter',
    images: [],
    blocks: [],
  });

  describe('Shared ExportSettings 跨模块调用一致性', () => {
    it('SHARED_EXPORT_STORAGE_KEYS 无重复键名', () => {
      const storageValues = Object.values(SHARED_EXPORT_STORAGE_KEYS);
      const uniqueStorageValues = new Set(storageValues);
      expect(uniqueStorageValues.size).toBe(storageValues.length);
    });

    it('Math Font 变更在 Chapter 与 Exercise 中均正确注入对应 OTF', () => {
      const fonts = ['typst', 'modern', 'times', 'pagella'] as const;
      const fontIdentifiers = {
        typst: 'NewCMMath-Book.otf',
        modern: 'latinmodern-math.otf',
        times: 'texgyretermes-math.otf',
        pagella: 'texgyrepagella-math.otf',
      };

      for (const f of fonts) {
        const chapterTex = renderChapterLatexDocument(
          createMockDoc('测试章'),
          { mathFont: f }
        );
        const exerciseTex = generateLatexDocument(
          [],
          { title: '测试习题', mathFont: f }
        );
        const targetOtf = fontIdentifiers[f];
        expect(chapterTex).toContain(targetOtf);
        expect(exerciseTex).toContain(targetOtf);
      }
    });

    it('Paper Size 变更在 Chapter 与 Exercise 中均输出预期文档类参数', () => {
      for (const p of ['a4', 'b5'] as const) {
        const chapterTex = renderChapterLatexDocument(
          createMockDoc('测试章'),
          { paperSize: p }
        );
        const exerciseTex = generateLatexDocument(
          [],
          { title: '测试习题', paperSize: p }
        );
        const paperClass = p === 'b5' ? 'b5paper' : 'a4paper';
        expect(chapterTex).toContain(paperClass);
        expect(exerciseTex).toContain(paperClass);
      }
    });

    it('Font Size 变更正确映射至文档类参数', () => {
      for (const s of [10.5, 11, 12] as const) {
        const chapterTex = renderChapterLatexDocument(
          createMockDoc('测试章'),
          { fontSize: s }
        );
        const ptStr = s === 10.5 ? '11pt' : `${s}pt`;
        expect(chapterTex).toContain(ptStr);
      }
    });
  });

  describe('Chapter-Scoped 静态资源解析与路径标准化', () => {
    it('normalizeLatexPath 规范化 Windows 反斜杠为 POSIX 正斜杠', () => {
      expect(normalizeLatexPath('assets\\figures\\01.jpg')).toBe('assets/figures/01.jpg');
      expect(normalizeLatexPath('assets/figures/01.jpg')).toBe('assets/figures/01.jpg');
    });

    it('真实章节精确提取当前章节引用的插图且目标文件均存在', () => {
      const sampleMdxPath = path.join(
        root,
        'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx'
      );
      expect(fs.existsSync(sampleMdxPath)).toBe(true);

      const mdxContent = fs.readFileSync(sampleMdxPath, 'utf8');
      const exportRes = exportChapterToLatex({
        mdxSource: mdxContent,
        slug: '1.1_集合映射与函数',
        bookSlug: 'engineering_analysis',
        colSlug: 'math',
        bookTitle: '工科数学分析',
      });

      expect(exportRes.assets.length).toBe(8);

      for (const asset of exportRes.assets) {
        expect(asset.targetPath.startsWith('assets/')).toBe(true);
        expect(fs.existsSync(asset.localPath)).toBe(true);
      }
    });

    it('成功解析普通相对图、点斜杠图与 public 根目录图为安全 POSIX 路径', () => {
      const mockChapterDir = path.join(root, 'src/content/docs/collections/math/engineering_analysis');
      const testImages = [
        { url: 'images/0058c5383413a71167a7502db8fbe568ac47a8c7bd11c667a848abe03a4cd693.jpg', alt: '普通图片', originalPath: 'images/0058c5383413a71167a7502db8fbe568ac47a8c7bd11c667a848abe03a4cd693.jpg' },
        { url: './images/008819fd288f39957ed5119085579a8a3983c6b09d8fd5931739d29cb1e13781.jpg', alt: '相对点斜杠图片', originalPath: './images/008819fd288f39957ed5119085579a8a3983c6b09d8fd5931739d29cb1e13781.jpg' },
        { url: '/favicon.svg', alt: '根目录公共图片', originalPath: '/favicon.svg' },
      ];

      const resolvedSpecial = resolveChapterAssets(testImages, mockChapterDir);
      expect(resolvedSpecial).toHaveLength(3);
      for (const r of resolvedSpecial) {
        expect(r.safeLatexPath).not.toContain('\\');
      }
    });
  });

  describe('学术版式与自适应图片语法规范', () => {
    const sampleMdxPath = path.join(
      root,
      'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx'
    );
    const mdxContent = fs.readFileSync(sampleMdxPath, 'utf8');
    const exportRes = exportChapterToLatex({
      mdxSource: mdxContent,
      slug: '1.1_集合映射与函数',
      bookSlug: 'engineering_analysis',
      colSlug: 'math',
      bookTitle: '工科数学分析',
    });

    it('彻底移除 \\maketitle，杜绝产生空洞封面', () => {
      expect(exportRes.tex).not.toContain('\\maketitle');
    });

    it('单章节导出默认采用 book 标准文档类', () => {
      expect(exportRes.tex).toContain('\\documentclass[a4paper,11pt,twoside,openright]{book}');
    });

    it('引入 adjustbox 宏包并生成自适应尺寸约束语法', () => {
      const hasAdjustbox = exportRes.styleSource.includes('adjustbox') || exportRes.tex.includes('adjustbox');
      expect(hasAdjustbox).toBe(true);
      expect(exportRes.tex).toContain('max width=0.65\\linewidth,max height=0.3\\textheight,keepaspectratio');
    });

    it('采用规范 \\chapter 结构与 \\pagestyle{fancy} 双面学术页眉', () => {
      expect(exportRes.tex).toContain('\\chapter{');
      expect(exportRes.tex).toContain('\\pagestyle{fancy}');
    });
  });

  describe('中文字体设置、纯粹书名页眉与克制弹窗规范', () => {
    it('cjkFont: "sourcehan" 成功注入思源宋体+思源黑体配置宏', () => {
      const sourceHanTex = renderChapterLatexDocument(
        createMockDoc('测试章'),
        { cjkFont: 'sourcehan' }
      );
      const defaultCjkTex = renderChapterLatexDocument(
        createMockDoc('测试章'),
        { cjkFont: 'default' }
      );
      expect(sourceHanTex).toContain('Source Han Serif SC');
      expect(sourceHanTex).toContain('Source Han Sans SC');
      expect(defaultCjkTex).not.toContain('Source Han Serif SC');
    });

    it('宏包清除品牌字样并将页眉右上角绑定为书名', () => {
      const sampleMdxPath = path.join(
        root,
        'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx'
      );
      const mdxContent = fs.readFileSync(sampleMdxPath, 'utf8');
      const exportRes = exportChapterToLatex({
        mdxSource: mdxContent,
        slug: '1.1_集合映射与函数',
        bookSlug: 'engineering_analysis',
        colSlug: 'math',
        bookTitle: '工科数学分析',
      });

      expect(exportRes.styleSource).not.toContain('AstroLib学术讲义');
      expect(exportRes.styleSource).not.toContain('{AstroLib');
      expect(exportRes.tex).toContain('\\renewcommand{\\astrolibbooktitle}{工科数学分析}');
    });

    it('ChapterExportModal 移除 SaaS 胶囊徽章与 Emoji，提供严肃学术选项', () => {
      const modalPath = path.join(root, 'src/components/publishing/ChapterExportModal.astro');
      const modalContent = fs.readFileSync(modalPath, 'utf8');

      expect(modalContent).not.toContain('dialog-badge');
      expect(modalContent).not.toContain('PUBLISHING / 导出');
      expect(modalContent).toContain('id="chapter-cjk-font"');
      expect(modalContent).toContain('value="sourcehan"');
      expect(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(modalContent)).toBe(false);
    });
  });

  describe('Academic Digital Resource 数字资源学术排版与语义流', () => {
    const sampleMdxPath = path.join(
      root,
      'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx'
    );
    const mdxContent = fs.readFileSync(sampleMdxPath, 'utf8');

    it('提取并语义结构化数字资源块', () => {
      const parsedSample = parseMdxChapter(mdxContent, { slug: '1.1_集合映射与函数' });
      const digitalResBlocks = parsedSample.blocks.filter((b) => b.kind === 'digital_resource');
      expect(digitalResBlocks.length).toBe(3);

      const firstRes = digitalResBlocks[0];
      expect(firstRes.resourceData?.category).toBe('digital_resource');
      expect(firstRes.resourceData?.relation).toBe('flow');
      expect(firstRes.resourceData?.title).toContain('对应法则');
    });

    it('嵌套在 Example 内的数字资源确定性绑定宿主', () => {
      const nestedSnippet = `
<Example title="例 1.1">
  <QRCodeVideo title="例题微课视频" url="http://2d.hep.cn/example-video" />
</Example>
`;
      const parsedNested = parseMdxChapter(nestedSnippet, { slug: 'test_nested' });
      const nestedExample = parsedNested.blocks.find((b) => b.kind === 'example');
      const nestedRes = nestedExample?.children?.find((b) => b.kind === 'digital_resource');

      expect(nestedRes).toBeDefined();
      expect(nestedRes?.resourceData?.relation).toBe('embedded');
      expect(nestedRes?.resourceData?.hostKind).toBe('example');
      expect(nestedRes?.resourceData?.hostId).toBe('例 1.1');
    });

    it('LaTeX 源码统一输出 \\astrolibdigitalresource 宏，彻底移除 \\footnote 与裸露 URL', () => {
      const exportRes = exportChapterToLatex({
        mdxSource: mdxContent,
        slug: '1.1_集合映射与函数',
        bookSlug: 'engineering_analysis',
        colSlug: 'math',
        bookTitle: '工科数学分析',
      });

      expect(exportRes.tex).not.toContain('\\footnote{配套数字资源');
      expect(exportRes.tex).not.toContain('\\url{http://2d.hep.cn');
      expect(exportRes.tex).toContain('\\astrolibdigitalresource[配套数字资源]{');

      const styleOrTex = exportRes.styleSource || exportRes.tex;
      expect(styleOrTex).toContain('\\newcommand{\\astrolibdigitalresource}');
      expect(styleOrTex).not.toMatch(/\\newcommand\{\\astrolibdigitalresource\}[\s\S]*?\\footnote/);
    });
  });
});
