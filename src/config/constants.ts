// 联调期开关：正式上线前置为 false，隐藏数据区顶部的 mock 提示条
export const SHOW_MOCK_NOTICE = true;

export const MOCK_NOTICE_TEXT = '请求 mock 数据成功，线上会实际请求数据接口';

// 计费基数（流水口径）候选
export const BILLING_BASE_OPTIONS = [
  { label: 'IAP', value: 'IAP' },
  { label: 'IAA', value: 'IAA' },
  { label: '总流水', value: '总流水' },
];

// 合作类型候选
export const COOPERATION_TYPE_OPTIONS = [
  { label: '渠道费用', value: 'channel' },
  { label: '支付通道费用', value: 'payment' },
];

// 合作方候选：按合作类型给不同候选
export const PARTNER_OPTIONS: Record<string, { label: string; value: string }[]> = {
  channel: [
    { label: 'App Store', value: 'App Store' },
    { label: 'Google Play', value: 'Google Play' },
    { label: '华为应用市场', value: '华为应用市场' },
    { label: 'TapTap', value: 'TapTap' },
  ],
  payment: [
    { label: '微信支付', value: '微信支付' },
    { label: '支付宝', value: '支付宝' },
    { label: '银联', value: '银联' },
  ],
};

// 今日状态候选
export const TODAY_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '有效', value: 'valid' },
  { label: '未配置', value: 'unconfigured' },
];
