import dayjs from 'dayjs';
import type {
  EffectivePeriod,
  ExecutionLog,
  GameProject,
  GameProjectRow,
  RuleChangeLog,
  ShareConfig,
} from '../types';
import { mockGameProjects } from '../mock/masterData';
import { mockShareConfigs } from '../mock/shareConfig';
import { mockExecutionLogs, mockRuleChangeLogs } from '../mock/logs';

/**
 * 本文件集中放置「将来要调后端接口」的位置：每个函数上方标注
 * 页面位置 / 意图 / 期望请求参 / 期望返回参（只写诉求，最终契约由后端定）。
 * 当前实现全部走 mock，替换时保持函数签名不变即可。
 */

// ---- mock 内部状态（替换真实接口时可整体删除）----

const executionTasks = new Map<
  string,
  { startedAt: number; durationMs: number; projects: string[]; calcStartDate: string }
>();

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- 通用工具 ----

// 判断某个生效周期是否覆盖指定日期
export const isPeriodCovering = (period: EffectivePeriod, date: string): boolean => {
  if (!period.startDate || !period.endDate) return false;
  return date >= period.startDate && date <= period.endDate;
};

// 取某项目当前生效周期（覆盖今天的那个）
export const pickEffectivePeriod = (config: ShareConfig | undefined, date: string) =>
  config?.periods.find((period) => isPeriodCovering(period, date));

// ---- 接口（Mock）----

/**
 * 【待对接接口 1】游戏项目主数据列表
 * 页面位置：分成配置列表 - 表格主体 + 「刷新」按钮
 * 意图：拉取游戏项目主数据（项目名、游戏名、研发工作室、发布地区、发布端口），并带上今日状态与当前生效周期
 * 期望请求参：{ keyword?: string; today: string }
 * 期望返回参：{ list: GameProjectRow[] }
 */
export async function fetchGameProjectRows(params: { keyword?: string } = {}): Promise<GameProjectRow[]> {
  await delay();
  const today = dayjs().format('YYYY-MM-DD');
  const keyword = params.keyword?.trim().toLowerCase() ?? '';
  return clone(mockGameProjects)
    .filter((project: GameProject) => {
      if (!keyword) return true;
      return (
        project.projectName.toLowerCase().includes(keyword) ||
        project.gameName.toLowerCase().includes(keyword)
      );
    })
    .map((project: GameProject) => {
      const period = pickEffectivePeriod(mockShareConfigs[project.id], today);
      return {
        ...project,
        todayStatus: period ? 'valid' : 'unconfigured',
        effectivePeriod: period ? `${period.startDate} ~ ${period.endDate}` : null,
      } as GameProjectRow;
    });
}

/**
 * 【待对接接口 2】单个游戏项目的分成配置详情
 * 页面位置：分成配置列表 - 单行「配置」→ 配置抽屉
 * 意图：打开抽屉时读取该项目的全部生效周期及其合作费用、CP 分成方案
 * 期望请求参：{ projectId: string }
 * 期望返回参：{ config: ShareConfig | null }（null 表示未配置）
 */
export async function fetchShareConfig(projectId: string): Promise<ShareConfig | null> {
  await delay();
  const config = mockShareConfigs[projectId];
  return config ? clone(config) : null;
}

/**
 * 【待对接接口 3】保存分成配置
 * 页面位置：配置抽屉 - 「保存」
 * 意图：整体保存该项目的生效周期列表（含合作费用、CP 分成方案），并写一条规则变更记录
 * 期望请求参：{ config: ShareConfig }
 * 期望返回参：{ success: boolean; message?: string }
 */
export async function saveShareConfig(config: ShareConfig): Promise<{ success: boolean }> {
  await delay();
  mockShareConfigs[config.projectId] = clone(config);
  return { success: true };
}

/**
 * 【待对接接口 4】规则变更记录
 * 页面位置：日志抽屉 - 「规则变更记录」Tab
 * 意图：读取某个项目的配置变更流水
 * 期望请求参：{ projectId?: string; page?: number; pageSize?: number }
 * 期望返回参：{ list: RuleChangeLog[]; total: number }
 */
export async function fetchRuleChangeLogs(projectId?: string): Promise<RuleChangeLog[]> {
  await delay();
  void projectId;
  return clone(mockRuleChangeLogs);
}

/**
 * 【待对接接口 5】数据执行日志
 * 页面位置：日志抽屉 - 「数据执行日志」Tab
 * 意图：读取数据计算任务的执行流水
 * 期望请求参：{ projectId?: string; page?: number; pageSize?: number }
 * 期望返回参：{ list: ExecutionLog[]; total: number }
 */
export async function fetchExecutionLogs(projectId?: string): Promise<ExecutionLog[]> {
  await delay();
  void projectId;
  return clone(mockExecutionLogs);
}

/**
 * 【待对接接口 6】发起数据计算任务
 * 页面位置：执行数据弹窗 - 「发起执行」
 * 意图：按勾选项目与计算开始日期发起一次异步计算任务，返回任务 ID 供轮询
 * 期望请求参：{ projectIds: string[]; calcStartDate: string }
 * 期望返回参：{ taskId: string }
 */
export async function startDataExecution(payload: {
  projectIds: string[];
  calcStartDate: string;
}): Promise<{ taskId: string }> {
  await delay(200);
  const taskId = `TASK-${Date.now()}`;
  executionTasks.set(taskId, {
    startedAt: Date.now(),
    durationMs: 4200,
    projects: payload.projectIds,
    calcStartDate: payload.calcStartDate,
  });
  return { taskId };
}

/**
 * 【待对接接口 7】查询数据计算任务进度 / 结果
 * 页面位置：执行数据弹窗 - 执行中进度与完成反馈
 * 意图：轮询异步任务进度，完成后返回结果并写入数据执行日志
 * 期望请求参：{ taskId: string }
 * 期望返回参：{ status: 'running' | 'done'; progress: number; result?: string }
 */
export async function fetchExecutionTask(taskId: string): Promise<{
  status: 'running' | 'done';
  progress: number;
  result?: string;
}> {
  const task = executionTasks.get(taskId);
  if (!task) return { status: 'done', progress: 100, result: '执行成功' };
  const elapsed = Date.now() - task.startedAt;
  if (elapsed >= task.durationMs) {
    return { status: 'done', progress: 100, result: '执行成功' };
  }
  return { status: 'running', progress: Math.min(99, Math.round((elapsed / task.durationMs) * 100)) };
}

// 任务完成后写入数据执行日志（真实实现由后端落库）
export function commitExecutionLog(taskId: string, operator = '当前用户'): void {
  const task = executionTasks.get(taskId);
  const projectNames = (task?.projects ?? [])
    .map((id) => mockGameProjects.find((project) => project.id === id)?.projectName ?? id)
    .join('、');
  mockExecutionLogs.unshift({
    id: `EX-${Date.now()}`,
    operator,
    startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    calcStartDate: task?.calcStartDate ?? dayjs().format('YYYY-MM-DD'),
    projects: projectNames,
    result: '执行成功',
  });
}

// 保存后追加规则变更记录（真实实现由后端落库）
export function appendRuleChangeLog(content: string, period: string, operator = '当前用户'): void {
  mockRuleChangeLogs.unshift({
    id: `RC-${Date.now()}`,
    operator,
    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    content,
    period,
  });
}
