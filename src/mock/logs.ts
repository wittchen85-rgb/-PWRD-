import type { ExecutionLog, RuleChangeLog } from '../types';

// 规则变更记录（Mock，可写）
export const mockRuleChangeLogs: RuleChangeLog[] = [
  {
    id: 'RC-0001',
    operator: '张三',
    time: '2026-09-28 14:22:10',
    content: '新增合作费用：渠道费用 / App Store / IAP / 收入占比 100% / 费率 30%',
    period: '2026-07-01 ~ 2026-12-31',
  },
  {
    id: 'RC-0002',
    operator: '张三',
    time: '2026-09-28 14:25:41',
    content: '调整 CP 分成方案：是否利润分成 否 → 是，固定成本 120 万元',
    period: '2026-07-01 ~ 2026-12-31',
  },
  {
    id: 'RC-0003',
    operator: '李四',
    time: '2026-08-05 09:10:03',
    content: '新增生效周期：2026-07-01 ~ 2026-12-31',
    period: '2026-07-01 ~ 2026-12-31',
  },
];

// 数据执行日志（Mock，可写）
export const mockExecutionLogs: ExecutionLog[] = [
  {
    id: 'EX-0001',
    operator: '张三',
    startTime: '2026-10-08 10:00:00',
    calcStartDate: '2026-10-08',
    projects: '幻境远征、王者交锋',
    result: '执行成功',
  },
  {
    id: 'EX-0002',
    operator: '李四',
    startTime: '2026-10-05 16:30:12',
    calcStartDate: '2026-10-05',
    projects: '萌兽大作战',
    result: '执行成功',
  },
];
