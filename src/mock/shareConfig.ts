import type { ShareConfig } from '../types';

// 分成配置（Mock）：按 projectId 存放；P1003 / P1005 / P1007 无配置
export const mockShareConfigs: Record<string, ShareConfig> = {
  P1001: {
    projectId: 'P1001',
    periods: [
      {
        id: 'PD-1001-1',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        fees: [
          {
            id: 'F-1001-1',
            type: 'channel',
            partner: 'App Store',
            billingBase: 'IAP',
            revenueRatio: 100,
            rate: 30,
          },
        ],
        cpPlan: {
          enabled: true,
          billingBase: 'IAP',
          profitSharing: false,
          fixedCost: null,
          deductCooperationFee: true,
          tiers: [
            { id: 'T-1001-1', threshold: 0, ratio: 50 },
            { id: 'T-1001-2', threshold: 500, ratio: 60 },
          ],
        },
      },
      {
        id: 'PD-1001-2',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        fees: [
          {
            id: 'F-1001-2',
            type: 'channel',
            partner: 'App Store',
            billingBase: 'IAP',
            revenueRatio: 100,
            rate: 30,
          },
          {
            id: 'F-1001-3',
            type: 'payment',
            partner: '微信支付',
            billingBase: 'IAP',
            revenueRatio: 100,
            rate: 0.6,
          },
        ],
        cpPlan: {
          enabled: true,
          billingBase: 'IAP',
          profitSharing: true,
          fixedCost: 120,
          deductCooperationFee: true,
          tiers: [
            { id: 'T-1001-3', threshold: 0, ratio: 50 },
            { id: 'T-1001-4', threshold: 800, ratio: 55 },
            { id: 'T-1001-5', threshold: 1500, ratio: 60 },
          ],
        },
      },
    ],
  },
  P1002: {
    projectId: 'P1002',
    periods: [
      {
        id: 'PD-1002-1',
        startDate: '2025-06-01',
        endDate: '2026-06-30',
        fees: [
          {
            id: 'F-1002-1',
            type: 'channel',
            partner: 'Google Play',
            billingBase: 'IAP',
            revenueRatio: 100,
            rate: 15,
          },
        ],
        cpPlan: {
          enabled: true,
          billingBase: 'IAP',
          profitSharing: false,
          fixedCost: null,
          deductCooperationFee: false,
          tiers: [{ id: 'T-1002-1', threshold: 0, ratio: 40 }],
        },
      },
    ],
  },
  P1004: {
    projectId: 'P1004',
    periods: [
      {
        id: 'PD-1004-1',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        fees: [
          {
            id: 'F-1004-1',
            type: 'channel',
            partner: 'Google Play',
            billingBase: 'IAP',
            revenueRatio: 100,
            rate: 30,
          },
        ],
        cpPlan: {
          enabled: true,
          billingBase: 'IAP',
          profitSharing: false,
          fixedCost: null,
          deductCooperationFee: true,
          tiers: [
            { id: 'T-1004-1', threshold: 0, ratio: 45 },
            { id: 'T-1004-2', threshold: 300, ratio: 50 },
          ],
        },
      },
    ],
  },
  P1006: {
    projectId: 'P1006',
    periods: [
      {
        id: 'PD-1006-1',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        fees: [],
        cpPlan: {
          enabled: true,
          billingBase: '总流水',
          profitSharing: true,
          fixedCost: 300,
          deductCooperationFee: false,
          tiers: [
            { id: 'T-1006-1', threshold: 0, ratio: 50 },
            { id: 'T-1006-2', threshold: 1000, ratio: 58 },
          ],
        },
      },
    ],
  },
};
