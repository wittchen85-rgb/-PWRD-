// 合作类型：渠道费用 / 支付通道费用
export type CooperationType = 'channel' | 'payment';

// 今日状态：有效 / 未配置
export type TodayStatus = 'valid' | 'unconfigured';

// 游戏项目主数据
export interface GameProject {
  id: string;
  projectName: string;
  gameName: string;
  studio: string;
  region: string;
  platform: string;
}

// 列表行 = 主数据 + 今日状态 + 当前生效周期
export interface GameProjectRow extends GameProject {
  todayStatus: TodayStatus;
  effectivePeriod: string | null;
}

// 合作费用（可为 0 条或多条）
export interface CooperationFee {
  id: string;
  type: CooperationType;
  partner: string;
  billingBase: string;
  revenueRatio: number | null;
  rate: number | null;
}

// CP 分成阶梯
export interface CpTier {
  id: string;
  threshold: number | null;
  ratio: number | null;
}

// CP 分成方案（仅一条）
export interface CpPlan {
  enabled: boolean;
  billingBase: string | null;
  profitSharing: boolean;
  fixedCost: number | null;
  deductCooperationFee: boolean;
  tiers: CpTier[];
}

// 生效周期
export interface EffectivePeriod {
  id: string;
  startDate: string | null;
  endDate: string | null;
  fees: CooperationFee[];
  cpPlan: CpPlan;
}

// 某游戏项目的分成配置
export interface ShareConfig {
  projectId: string;
  periods: EffectivePeriod[];
}

// 规则变更记录
export interface RuleChangeLog {
  id: string;
  operator: string;
  time: string;
  content: string;
  period: string;
}

// 数据执行日志
export interface ExecutionLog {
  id: string;
  operator: string;
  startTime: string;
  calcStartDate: string;
  projects: string;
  result: string;
}
