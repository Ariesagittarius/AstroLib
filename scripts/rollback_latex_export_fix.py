# -*- coding: utf-8 -*-
"""一键回滚脚本：将 LaTeX 导出核心模块恢复至本次修改前备份副本。"""
import os
import shutil

PROJECT_ROOT = r'd:\Antigravity\project\AstroLib'
BACKUP_DIR = os.path.join(PROJECT_ROOT, '.backups', 'latex_export_fix_20260915_121000')

FILES = [
    (os.path.join(BACKUP_DIR, 'chapter-semantic.ts'), os.path.join(PROJECT_ROOT, 'src', 'types', 'chapter-semantic.ts')),
    (os.path.join(BACKUP_DIR, 'mdx-chapter-parser.ts'), os.path.join(PROJECT_ROOT, 'src', 'publishing', 'common', 'mdx-chapter-parser.ts')),
    (os.path.join(BACKUP_DIR, 'latex-generator.ts'), os.path.join(PROJECT_ROOT, 'src', 'publishing', 'latex', 'latex-generator.ts')),
    (os.path.join(BACKUP_DIR, 'astrolib-chapter.sty'), os.path.join(PROJECT_ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty')),
]

def rollback():
    print(f"正在从备份目录恢复文件: {BACKUP_DIR} ...")
    if not os.path.exists(BACKUP_DIR):
        print("错误：备份目录不存在，无法回滚！")
        return
    for src, dst in FILES:
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"  已还原: {os.path.basename(dst)}")
        else:
            print(f"  警告: 备份文件不存在: {src}")
    print("回滚完成！已完全恢复至本次修改前的状态。")

if __name__ == '__main__':
    rollback()
