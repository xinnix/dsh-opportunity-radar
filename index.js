/** Host half: slash command, read-only report archive routes for the sidebar panel. */
import { readFileSync } from 'node:fs';

const NAME = '@local/opportunity-radar';

function loadWorkflow() {
  try {
    return readFileSync(new URL('./WORKFLOW.md', import.meta.url), 'utf8');
  } catch {
    return '（流程文档 WORKFLOW.md 未找到，请检查 bundle 安装是否完整）';
  }
}

const USAGE = [
  '商机雷达 · 用法',
  '',
  '  /radar              查看完整调研流程 SOP',
  '  /opportunity        同上（ASCII 别名）',
  '  /radar 平台         默认数据源清单与访问限制',
  '  /radar 评分         五维评分矩阵与判废标准',
  '  /radar 报告         报告结构与网页交付要求',
].join('\n');

const SOURCES = [
  '商机雷达 · 默认数据源',
  '',
  'V2EX        /go/qna, /go/programmer, /go/create   中文开发者痛点 + 供给饱和度',
  'Hacker News /ask, /newest, item?id=              英文开发者痛点 + 工具信任危机',
  'Indie Hackers 首页帖子, /ideas                   独立开发者获客/变现 + 品类收入',
  'Reddit      old.reddit.com/r/<sub>/top           细分群体抱怨（常 403）',
  'Product Hunt 首页                                新品供给 / 赛道拥挤度（常 403）',
  '小红书 / 知乎 / 微信生态                        中文消费者需求（需补充）',
  '',
  '采集纪律：先抓列表页挑高讨论帖，再逐个抓详情页读原帖 + 前 10-30 条回复。',
].join('\n');

const RUBRIC = [
  '商机雷达 · 筛选与评分',
  '',
  '【是否一个数字产品可解】任一条不满足即降级或淘汰：',
  '  · 边界清晰  · 有明确付费方且付费方 = 痛点承受者',
  '  · 不需要线下履约/重资产/强牌照  · 不会被大平台一次更新吞并',
  '  · 需要持续维护、数据积累或稳定性保障',
  '',
  '【五维评分，1-5 分】需求证据 / 竞争空间 / 技术可行性 / 变现潜力 / 一人可做性',
  '综合分满分 25。结论：优先验证 / 轻量 MVP / 作为验证手段 / 先访谈 / 找差异化再说 / 平台风险高',
].join('\n');

const REPORT = [
  '商机雷达 · 报告与网页',
  '',
  'Markdown 报告：范围与证据 → 痛点信号 → 候选评估 → 评分排序 → 下一步 → 风险 → 来源',
  '网页：单文件 index.html，无外部依赖，可离线打开，带来源链接。',
  '归档：每次调研放入 reports/<日期-主题>/，含 index.html、report.md、meta.json，面板即可看到。',
].join('\n');

function answer(rawInput) {
  const key = (rawInput || '').trim().toLowerCase();
  if (!key || ['help', '帮助', 'sop', '流程'].includes(key)) {
    return `${USAGE}\n\n${'='.repeat(48)}\n\n${loadWorkflow()}`;
  }
  if (['平台', 'source', 'sources', '数据源'].includes(key)) return SOURCES;
  if (['评分', 'rubric', '评估', 'score'].includes(key)) return RUBRIC;
  if (['报告', 'report', '网页'].includes(key)) return REPORT;
  return `${USAGE}\n\n未识别的参数：${rawInput}`;
}

export const inject = ['commands'];

export function apply(ctx) {
  const disposers = [];

  if (ctx.commands && typeof ctx.commands.register === 'function') {
    const definition = {
      description: '查看或复用数字产品商机调研流程（采集 / 筛选 / 评估 / 报告 / 验证）',
      input: { hint: '[平台|评分|报告]' },
      handler: (invocation) => ({ kind: 'success', text: answer(invocation?.rawInput) }),
    };
    disposers.push(ctx.commands.register({ ...definition, definitionId: NAME, name: 'radar' }));
    disposers.push(ctx.commands.register({ ...definition, definitionId: `${NAME}/opportunity`, name: 'opportunity' }));
  }

  return () => { for (const dispose of disposers) { if (typeof dispose === 'function') dispose(); } };
}
