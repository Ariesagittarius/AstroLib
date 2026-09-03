"""一键回滚脚本：将 src/content/docs 恢复至纠正前备份副本。"""
import os
import shutil

PROJECT_ROOT = r'd:\Antigravity\project\AstroLib'
DOCS_DIR = os.path.join(PROJECT_ROOT, 'src', 'content', 'docs')
BACKUP_PATH = r'd:\Antigravity\project\AstroLib\.backups\docs_pre_note_fix_20260831_111422'

def rollback():
    print(f"正在从备份目录恢复文档: {BACKUP_PATH} -> {DOCS_DIR} ...")
    if not os.path.exists(BACKUP_PATH):
        print("错误：备份目录不存在，无法回滚！")
        return
    shutil.rmtree(DOCS_DIR)
    shutil.copytree(BACKUP_PATH, DOCS_DIR)
    print("回滚完成！已完全恢复至本次修改前的所有文件。")

if __name__ == '__main__':
    rollback()
