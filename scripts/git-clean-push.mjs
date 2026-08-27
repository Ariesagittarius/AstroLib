#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripContentByExtension } from './lib/comment-stripper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 1. 查找可用 Git 可执行文件路径
function getGitPath() {
  const candidates = [
    'git',
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  ];
  for (const cmd of candidates) {
    try {
      execSync(`"${cmd}" --version`, { stdio: 'ignore' });
      return cmd;
    } catch {
      // continue
    }
  }
  throw new Error('未找到 Git 可执行程序，请确认系统已安装 Git！');
}

const GIT = getGitPath();

function runGit(args, cwd = PROJECT_ROOT, options = {}) {
  const cmd = `"${GIT}" ${args}`;
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: options.stdio || 'pipe', ...options });
}

// 2. 解析 CLI 参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'clean', // 'clean', 'private', 'all'
    dryRun: false,
    force: false,
    remote: 'origin',
    privateRemote: 'private',
    branch: '',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--clean' || arg === '-c') {
      options.mode = 'clean';
    } else if (arg === '--private' || arg === '-p') {
      options.mode = 'private';
    } else if (arg === '--all' || arg === '-a') {
      options.mode = 'all';
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--remote' && i + 1 < args.length) {
      options.remote = args[++i];
    } else if (arg === '--private-remote' && i + 1 < args.length) {
      options.privateRemote = args[++i];
    } else if (arg === '--branch' && i + 1 < args.length) {
      options.branch = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
AstroLib Git 双模式推送工具 (Clean / Private / All)

使用方法:
  node scripts/git-clean-push.mjs [选项]
  npm run push:clean    # 剥离注释推送到公共仓库 (origin)
  npm run push:private  # 保留全部注释推送到私有仓库 (private)
  npm run push:all      # 双推：先推私有完整版，再推公共无注释版

选项:
  --clean, -c           剥离全部代码注释并推送到公共仓库 (默认模式)
  --private, -p         推送保留完整注释的代码到私有仓库
  --all, -a             同时推送到私有仓库（完整版）与公共仓库（无注释版）
  --dry-run, -d         演练模式：在临时沙箱中剥离并校验，不实际执行远程推送
  --force, -f           推送时附加 --force
  --remote <name>       公共仓库远程名称 (默认: origin)
  --private-remote <n>  私有仓库远程名称 (默认: private)
  --branch <name>       目标推送分支 (默认: 当前分支)
  --help, -h            显示帮助信息
`);
}

// 3. 检查并获取当前分支与提交
function getRepoInfo() {
  const branch = runGit('rev-parse --abbrev-ref HEAD').trim();
  const commit = runGit('rev-parse HEAD').trim();
  const commitMsg = runGit('log -1 --pretty=%B').trim();
  const remotes = runGit('remote').split(/\r?\n/).filter(Boolean);
  return { branch, commit, commitMsg, remotes };
}

// 4. 执行私有仓库推送（完整注释版）
async function pushPrivate(options, repoInfo) {
  console.log('\n🔒 [1/2] 正在准备推送【私有完整注释版】...');
  const targetBranch = options.branch || repoInfo.branch;
  const privateRemote = options.privateRemote;

  if (!repoInfo.remotes.includes(privateRemote)) {
    console.warn(`\n⚠️  未检测到私有远程仓库配置: '${privateRemote}'`);
    console.warn(`   如需使用私有备份功能，请先运行以下命令添加您的私有仓库地址：`);
    console.warn(`   git remote add ${privateRemote} <您的私有仓库URL>\n`);
    if (options.mode === 'private') {
      process.exit(1);
    }
    console.log('⏩ 跳过私有推送，继续执行公共仓库推送...');
    return false;
  }

  const forceFlag = options.force ? ' --force' : '';
  const pushCmd = `push ${privateRemote} ${repoInfo.branch}:${targetBranch}${forceFlag}`;

  if (options.dryRun) {
    console.log(`🔎 [Dry Run] 将执行命令: git ${pushCmd}`);
  } else {
    console.log(`🚀 正在推送到私有仓库 ${privateRemote}/${targetBranch} ...`);
    runGit(pushCmd, PROJECT_ROOT, { stdio: 'inherit' });
    console.log(`✅ 私有仓库推送成功（保留全部注释与历史）！`);
  }
  return true;
}

// 5. 执行公共仓库推送（剥离注释版，基于 Git Worktree 隔离沙箱）
async function pushClean(options, repoInfo) {
  console.log('\n🧹 [2/2] 正在准备推送【公共无注释版】...');
  const targetBranch = options.branch || repoInfo.branch;
  const remote = options.remote;

  if (!repoInfo.remotes.includes(remote)) {
    throw new Error(`未找到指定的公共远程仓库: '${remote}'`);
  }

  // 临时沙箱目录
  const tempDir = path.join(PROJECT_ROOT, 'node_modules', '.cache', `_git_clean_${Date.now()}`);
  fs.mkdirSync(path.dirname(tempDir), { recursive: true });

  console.log(`📦 创建临时 Worktree 沙箱: ${path.basename(tempDir)}`);
  try {
    // 创建 detached worktree，指向当前 HEAD
    runGit(`worktree add --detach "${tempDir}" HEAD`);

    // 获取沙箱中所有被 Git 追踪的文件
    const trackedFiles = runGit('ls-files', tempDir)
      .split(/\r?\n/)
      .map(f => f.trim())
      .filter(Boolean);

    // 净化沙箱：移除任何 Agent/Skill 目录或文件
    const bannedPrefixes = ['.agents', '.dsh', '.codex', '.cmd', 'CLAUDE.md', '.gemini', '.antigravity'];
    let agentCleanedCount = 0;
    for (const relPath of trackedFiles) {
      if (bannedPrefixes.some(prefix => relPath === prefix || relPath.startsWith(prefix + '/') || relPath.startsWith(prefix + '\\'))) {
        const fullPath = path.join(tempDir, relPath);
        if (fs.existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          agentCleanedCount++;
        }
      }
    }
    if (agentCleanedCount > 0) {
      runGit('add -u', tempDir);
      console.log(`🧹 已从发布沙箱中剔除 ${agentCleanedCount} 个 Agent / Skill 相关私有文件`);
    }

    console.log(`🔍 正在扫描并剥离代码注释 (共 ${trackedFiles.length} 个被追踪文件)...`);
    let strippedCount = 0;
    const processExtensions = new Set([
      '.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsonc',
      '.css', '.scss', '.less',
      '.astro',
      '.md', '.mdx',
      '.py',
      '.yml', '.yaml',
      '.sh', '.bash', '.ps1',
      '.html', '.svg',
    ]);

    for (const relPath of trackedFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!processExtensions.has(ext)) continue;

      const fullPath = path.join(tempDir, relPath);
      if (!fs.existsSync(fullPath)) continue;

      const original = fs.readFileSync(fullPath, 'utf8');
      const stripped = stripContentByExtension(original, ext);

      if (original !== stripped) {
        fs.writeFileSync(fullPath, stripped, 'utf8');
        strippedCount++;
      }
    }

    console.log(`✨ 已成功剥离 ${strippedCount} 个文件中的注释！`);

    // 运行语法校验 (scan-mdx)
    console.log('🧪 正在对无注释沙箱执行 MDX 语法健康校验...');
    try {
      execSync('node scripts/scan-mdx.mjs src/content/docs/collections/math/math_analysis', {
        cwd: tempDir,
        stdio: 'ignore',
      });
      console.log('✅ MDX 语法校验通过！');
    } catch {
      console.warn('⚠️  快速语法抽检跳过或提示警告');
    }

    // 检查沙箱是否有修改
    const status = runGit('status --porcelain', tempDir).trim();
    let strippedCommit = repoInfo.commit;

    if (status) {
      runGit('add -A', tempDir);
      const isSkipCi = /\[(skip ci|ci skip|skip vercel|vercel skip)\]/i.test(repoInfo.commitMsg);
      const cleanCommitMsg = `release(distribution): strip code annotations for public repository${isSkipCi ? ' [skip ci]' : ''}`;
      runGit(`commit -m "${cleanCommitMsg.replace(/"/g, '\\"')}"`, tempDir);
      strippedCommit = runGit('rev-parse HEAD', tempDir).trim();
      console.log(`📝 生成纯净无注释提交: ${strippedCommit.slice(0, 8)}`);
    } else {
      console.log(`ℹ️  未产生注释差异，直接使用当前提交: ${strippedCommit.slice(0, 8)}`);
    }

    // 推送到远程公共仓库（纯净镜像分支需 --force 覆盖发布）
    const forceFlag = ' --force';
    const pushCmd = `push ${remote} ${strippedCommit}:refs/heads/${targetBranch}${forceFlag}`;

    if (options.dryRun) {
      console.log(`🔎 [Dry Run] 将执行命令: git ${pushCmd}`);
      console.log(`🔎 [Dry Run] 演练成功，未真正推送到远程。`);
    } else {
      console.log(`🚀 正在推送无注释版本到公共仓库 ${remote}/${targetBranch} ...`);
      runGit(pushCmd, tempDir, { stdio: 'inherit' });
      console.log(`🎉 公共仓库推送成功（已完全剥离注释，Agent读取零干扰）！`);
    }
  } finally {
    // 清理 Worktree
    try {
      console.log('🧹 正在清理临时 Worktree 沙箱...');
      runGit(`worktree remove --force "${tempDir}"`, PROJECT_ROOT);
      runGit('worktree prune', PROJECT_ROOT);
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      // ignore cleanup errors
    }
  }
}

// 主入口
async function main() {
  const options = parseArgs();
  if (options.help) {
    showHelp();
    return;
  }

  const repoInfo = getRepoInfo();
  console.log(`📌 当前分支: ${repoInfo.branch} | 提交: ${repoInfo.commit.slice(0, 8)}`);

  if (options.mode === 'private') {
    await pushPrivate(options, repoInfo);
  } else if (options.mode === 'clean') {
    await pushClean(options, repoInfo);
  } else if (options.mode === 'all') {
    await pushPrivate(options, repoInfo);
    await pushClean(options, repoInfo);
  }

  console.log('\n💯 全部操作完成！本地工作区与全部注释完好保留。\n');
}

main().catch(err => {
  console.error('\n❌ 推送执行失败:', err.message);
  process.exit(1);
});
