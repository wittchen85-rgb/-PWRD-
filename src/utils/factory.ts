import type { CooperationFee, CpPlan, CpTier, EffectivePeriod } from '../types';
import { uid } from './id';

// 空的 CP 分成方案（新增周期时的默认值）
export const createEmptyCpPlan = (): CpPlan => ({
  enabled: false,
  billingBase: null,
  profitSharing: false,
  fixedCost: null,
  deductCooperationFee: false,
  tiers: [],
});

export const createEmptyFee = (): CooperationFee => ({
  id: uid('FEE'),
  type: 'channel',
  partner: '',
  billingBase: '',
  revenueRatio: null,
  rate: null,
});

export const createEmptyTier = (): CpTier => ({
  id: uid('TIER'),
  threshold: null,
  ratio: null,
});

export const createEmptyPeriod = (): EffectivePeriod => ({
  id: uid('PD'),
  startDate: null,
  endDate: null,
  fees: [],
  cpPlan: createEmptyCpPlan(),
});
