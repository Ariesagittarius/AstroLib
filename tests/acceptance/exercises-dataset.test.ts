import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Exercises Dataset Acceptance Suite', () => {
  const root = path.resolve('.');
  const exDir = path.join(root, 'src', 'data', 'exercises');

  it('所有题目数据集 JSON 文件均可合法解析', () => {
    expect(fs.existsSync(exDir)).toBe(true);
    const files = fs.readdirSync(exDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);

    for (const f of files) {
      const fullPath = path.join(exDir, f);
      const raw = fs.readFileSync(fullPath, 'utf8');
      let parsed: any;
      expect(() => {
        parsed = JSON.parse(raw);
      }, `解析 ${f} 失败`).not.toThrow();
      expect(parsed).toBeDefined();
    }
  });

  it('工科数学分析真题精选库 engineering_analysis_exercises 具备规范的数据结构', () => {
    const file = path.join(exDir, 'engineering_analysis_exercises.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    expect(data.chapters).toBeDefined();
    const chapterKeys = Object.keys(data.chapters);
    expect(chapterKeys.length).toBeGreaterThan(0);

    let totalQ = 0;
    for (const [ch, qList] of Object.entries<any[]>(data.chapters)) {
      expect(Array.isArray(qList)).toBe(true);
      expect(qList.length).toBeGreaterThan(0);
      totalQ += qList.length;

      for (const q of qList.slice(0, 5)) {
        expect(q.id).toBeDefined();
        expect(typeof q.id).toBe('string');
        expect(q.content?.stem).toBeDefined();
      }
    }
    expect(totalQ).toBeGreaterThan(100);
  });

  it('工科数学分析教材课后习题库 engineering_analysis_textbook_exercises 具备有效题量', () => {
    const file = path.join(exDir, 'engineering_analysis_textbook_exercises.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    const list = data.questions || (data.chapters ? Object.values(data.chapters).flat() : data);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(50);
  });

  it('高等代数与几何课后习题库 linear_algebra_geometry_textbook_exercises 具备有效题量', () => {
    const file = path.join(exDir, 'linear_algebra_geometry_textbook_exercises.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    const list = data.questions || (data.chapters ? Object.values(data.chapters).flat() : data);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(50);
  });

  it('线性代数与几何真题精选库 linear_algebra_geometry_exercises 具备规范的数据结构与有效题量', () => {
    const file = path.join(exDir, 'linear_algebra_geometry_exercises.json');
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    expect(data.course).toBe('linear_algebra_geometry');
    expect(data.chapters).toBeDefined();
    const chapterKeys = Object.keys(data.chapters);
    expect(chapterKeys.length).toBe(9);

    let totalQ = 0;
    for (const [ch, qList] of Object.entries<any[]>(data.chapters)) {
      expect(Array.isArray(qList)).toBe(true);
      expect(qList.length).toBeGreaterThan(0);
      totalQ += qList.length;

      for (const q of qList.slice(0, 5)) {
        expect(q.id).toBeDefined();
        expect(typeof q.id).toBe('string');
        expect(q.content?.stem).toBeDefined();
        expect(q.mapping?.linear_algebra_geometry).toBeDefined();
        expect(q.mapping.linear_algebra_geometry.chapter).toBe(parseInt(ch, 10));
      }
    }
    expect(totalQ).toBeGreaterThan(300);
  });

  it('数字电路与逻辑设计课后习题库 digital_circuit_textbook_exercises 具备有效题量与结构', () => {
    const file = path.join(exDir, 'digital_circuit_textbook_exercises.json');
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    expect(data.book).toBe('digital_circuit');
    expect(data.total_chapters).toBe(10);
    expect(data.total_questions).toBe(262);
    expect(data.chapters).toBeDefined();

    let totalQ = 0;
    for (const [ch, qList] of Object.entries<any[]>(data.chapters)) {
      expect(Array.isArray(qList)).toBe(true);
      expect(qList.length).toBeGreaterThan(0);
      totalQ += qList.length;

      for (const q of qList.slice(0, 3)) {
        expect(q.id).toBeDefined();
        expect(q.content?.stem).toBeDefined();
        expect(q.source?.raw_title).toContain('《数字电路与逻辑设计》');
      }
    }
    expect(totalQ).toBe(262);
  });

  it('电子电路基础课后习题库 electronic_circuits_textbook_exercises 具备有效题量与官方答案回填', () => {
    const file = path.join(exDir, 'electronic_circuits_textbook_exercises.json');
    expect(fs.existsSync(file)).toBe(true);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    expect(data.book).toBe('electronic_circuits');
    expect(data.total_chapters).toBe(7);
    expect(data.total_questions).toBe(277);
    expect(data.chapters).toBeDefined();

    let totalQ = 0;
    let answeredQ = 0;
    for (const [ch, qList] of Object.entries<any[]>(data.chapters)) {
      expect(Array.isArray(qList)).toBe(true);
      expect(qList.length).toBeGreaterThan(0);
      totalQ += qList.length;

      for (const q of qList) {
        expect(q.id).toBeDefined();
        expect(q.content?.stem).toBeDefined();
        if (q.content?.solution) {
          answeredQ++;
        }
      }
    }
    expect(totalQ).toBe(277);
    // 验证书末官方答案回填率（216 题）
    expect(answeredQ).toBeGreaterThanOrEqual(200);
  });
});
