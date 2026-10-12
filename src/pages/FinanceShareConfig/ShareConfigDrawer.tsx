import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  App,
  Button,
  Col,
  DatePicker,
  Divider,
  Drawer,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { appendRuleChangeLog, fetchShareConfig, saveShareConfig } from '../../api';
import {
  BILLING_BASE_OPTIONS,
  COOPERATION_TYPE_OPTIONS,
  PARTNER_OPTIONS,
} from '../../config/constants';
import type { CooperationFee, CpTier, EffectivePeriod, GameProjectRow, ShareConfig } from '../../types';
import { createEmptyFee, createEmptyPeriod, createEmptyTier } from '../../utils/factory';

interface Props {
  project: GameProjectRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// 字段标签
function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <Typography.Text type="secondary">
          {label}
          {tooltip ? (
            <Tooltip title={tooltip}>
              <QuestionCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          ) : null}
        </Typography.Text>
      </div>
      {children}
    </div>
  );
}

const yesNoOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];

const periodLabel = (period: EffectivePeriod, index: number) =>
  `周期 ${index + 1}：${
    period.startDate && period.endDate ? `${period.startDate} ~ ${period.endDate}` : '待填写'
  }`;

const isOverlapping = (a: EffectivePeriod, b: EffectivePeriod) =>
  Boolean(a.startDate && a.endDate && b.startDate && b.endDate) &&
  a.startDate! <= b.endDate! &&
  b.startDate! <= a.endDate!;

export default function ShareConfigDrawer({ project, open, onClose, onSaved }: Props) {
  const { message, modal } = App.useApp();

  const [periods, setPeriods] = useState<EffectivePeriod[]>([]);
  const [activePeriodId, setActivePeriodId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emptyCreated, setEmptyCreated] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !project) return;
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    fetchShareConfig(project.id)
      .then((config) => {
        if (cancelled) return;
        if (config && config.periods.length > 0) {
          setPeriods(config.periods);
          setActivePeriodId(config.periods[0].id);
          setEmptyCreated(false);
        } else {
          const period = createEmptyPeriod();
          setPeriods([period]);
          setActivePeriodId(period.id);
          setEmptyCreated(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, project]);

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === activePeriodId) ?? null,
    [periods, activePeriodId],
  );

  const patchPeriod = (id: string, updater: (period: EffectivePeriod) => EffectivePeriod) => {
    setErrors([]);
    setPeriods((prev) => prev.map((period) => (period.id === id ? updater(period) : period)));
  };

  const addPeriod = () => {
    const period = createEmptyPeriod();
    setErrors([]);
    setPeriods((prev) => [...prev, period]);
    setActivePeriodId(period.id);
    setEmptyCreated(false);
  };

  const deletePeriod = () => {
    if (!activePeriod) return;
    modal.confirm({
      title: '删除当前生效周期',
      content: `确认删除「${periodLabel(activePeriod, periods.indexOf(activePeriod))}」及其下的合作费用与 CP 分成方案？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const rest = periods.filter((period) => period.id !== activePeriod.id);
        setPeriods(rest);
        setActivePeriodId(rest[0]?.id ?? '');
        setErrors([]);
      },
    });
  };

  // ---- 合作费用 ----
  const patchFee = (feeId: string, patch: Partial<CooperationFee>) => {
    if (!activePeriod) return;
    patchPeriod(activePeriod.id, (period) => ({
      ...period,
      fees: period.fees.map((fee) => (fee.id === feeId ? { ...fee, ...patch } : fee)),
    }));
  };

  const addFee = () => {
    if (!activePeriod) return;
    patchPeriod(activePeriod.id, (period) => ({ ...period, fees: [...period.fees, createEmptyFee()] }));
  };

  const removeFee = (feeId: string) => {
    if (!activePeriod) return;
    patchPeriod(activePeriod.id, (period) => ({
      ...period,
      fees: period.fees.filter((fee) => fee.id !== feeId),
    }));
  };

  // ---- CP 分成方案 ----
  const patchCpPlan = (patch: Partial<EffectivePeriod['cpPlan']>) => {
    if (!activePeriod) return;
    patchPeriod(activePeriod.id, (period) => ({ ...period, cpPlan: { ...period.cpPlan, ...patch } }));
  };

  const patchTier = (tierId: string, patch: Partial<CpTier>) => {
    if (!activePeriod) return;
    patchCpPlan({
      tiers: activePeriod.cpPlan.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...patch } : tier)),
    });
  };

  // ---- 校验 ----
  const validate = (): string[] => {
    const list: string[] = [];
    if (periods.length === 0) {
      list.push('请至少新增一个生效周期');
      return list;
    }
    periods.forEach((period, index) => {
      const prefix = `第 ${index + 1} 个生效周期`;
      if (!period.startDate || !period.endDate) {
        list.push(`${prefix}：开始日期、结束日期均必填`);
      } else if (period.startDate > period.endDate) {
        list.push(`${prefix}：开始日期不得晚于结束日期`);
      }
      period.fees.forEach((fee, feeIndex) => {
        const feePrefix = `${prefix} 合作费用 ${feeIndex + 1}`;
        if (!fee.partner) list.push(`${feePrefix}：合作方必填`);
        if (!fee.billingBase) list.push(`${feePrefix}：计费基数必填`);
        if (fee.revenueRatio === null) list.push(`${feePrefix}：收入占比必填`);
        else if (fee.revenueRatio < 0 || fee.revenueRatio > 100)
          list.push(`${feePrefix}：收入占比需在 0~100%`);
        if (fee.rate === null) list.push(`${feePrefix}：费率必填`);
        else if (fee.rate < 0 || fee.rate > 100) list.push(`${feePrefix}：费率需在 0~100%`);
      });
      const plan = period.cpPlan;
      if (plan.enabled) {
        if (!plan.billingBase) list.push(`${prefix}：CP 分成方案的计费基数必填`);
        if (plan.profitSharing && (plan.fixedCost === null || plan.fixedCost <= 0))
          list.push(`${prefix}：利润分成时固定成本需大于 0`);
        if (plan.tiers.length === 0) list.push(`${prefix}：请至少配置一条我方比例阶梯`);
        plan.tiers.forEach((tier, tierIndex) => {
          const tierPrefix = `${prefix} 阶梯 ${tierIndex + 1}`;
          if (tier.threshold === null) list.push(`${tierPrefix}：阶梯系数必填`);
          else if (tierIndex > 0) {
            const prev = plan.tiers[tierIndex - 1].threshold;
            if (prev !== null && tier.threshold <= prev)
              list.push(`${tierPrefix}：阶梯系数需大于上一阶梯`);
          }
          if (tier.ratio === null) list.push(`${tierPrefix}：阶梯比例必填`);
          else if (tier.ratio < 0 || tier.ratio > 100) list.push(`${tierPrefix}：阶梯比例需在 0~100%`);
        });
      }
    });
    for (let i = 0; i < periods.length; i += 1) {
      for (let j = i + 1; j < periods.length; j += 1) {
        if (isOverlapping(periods[i], periods[j])) {
          list.push(`第 ${i + 1} 个与第 ${j + 1} 个生效周期的时间区间存在交集，请调整`);
        }
      }
    }
    return list;
  };

  const handleSave = async () => {
    if (!project) return;
    const result = validate();
    setErrors(result);
    if (result.length > 0) {
      message.error('校验未通过，请检查配置');
      return;
    }
    setSaving(true);
    try {
      const config: ShareConfig = { projectId: project.id, periods };
      await saveShareConfig(config);
      const feeCount = periods[0]?.fees.length ?? 0;
      const periodText = activePeriod ? periodLabel(activePeriod, periods.indexOf(activePeriod)) : '—';
      appendRuleChangeLog(
        `保存分成配置：共 ${periods.length} 个生效周期，合作费用 ${feeCount} 条，CP 分成${
          periods[0]?.cpPlan.enabled ? '开启' : '关闭'
        }`,
        periodText,
      );
      message.success('保存成功');
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const periodOptions = periods.map((period, index) => ({
    label: periodLabel(period, index),
    value: period.id,
  }));

  const renderFee = (fee: CooperationFee) => (
    <div key={fee.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
      <Row gutter={12} align="bottom">
        <Col span={6}>
          <Field label="合作类型">
            <Select
              style={{ width: '100%' }}
              value={fee.type}
              options={COOPERATION_TYPE_OPTIONS}
              onChange={(value) => patchFee(fee.id, { type: value, partner: '' })}
            />
          </Field>
        </Col>
        <Col span={6}>
          <Field label="合作方">
            <Select
              style={{ width: '100%' }}
              placeholder="请选择"
              value={fee.partner || undefined}
              options={PARTNER_OPTIONS[fee.type] ?? []}
              onChange={(value) => patchFee(fee.id, { partner: value })}
            />
          </Field>
        </Col>
        <Col span={5}>
          <Field label="计费基数（流水口径）">
            <Select
              style={{ width: '100%' }}
              placeholder="请选择"
              value={fee.billingBase || undefined}
              options={BILLING_BASE_OPTIONS}
              onChange={(value) => patchFee(fee.id, { billingBase: value })}
            />
          </Field>
        </Col>
        <Col span={5}>
          <Field label="收入占比（%）">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={2}
              value={fee.revenueRatio}
              onChange={(value) => patchFee(fee.id, { revenueRatio: value })}
            />
          </Field>
        </Col>
        <Col span={4}>
          <Field label="费率（%）">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={2}
              value={fee.rate}
              onChange={(value) => patchFee(fee.id, { rate: value })}
            />
          </Field>
        </Col>
        <Col span={4}>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFee(fee.id)}>
            删除
          </Button>
        </Col>
      </Row>
    </div>
  );

  const renderTier = (tier: CpTier, index: number) => {
    const prevThreshold = index > 0 ? activePeriod?.cpPlan.tiers[index - 1].threshold ?? null : null;
    const thresholdInvalid =
      tier.threshold !== null && prevThreshold !== null && tier.threshold <= prevThreshold;
    return (
      <Row key={tier.id} gutter={12} align="bottom">
        <Col span={9}>
          <Field label="阶梯系数 ≥（万元）">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              value={tier.threshold}
              status={thresholdInvalid ? 'error' : undefined}
              onChange={(value) => patchTier(tier.id, { threshold: value })}
            />
          </Field>
          {thresholdInvalid ? (
            <Typography.Text type="danger" style={{ fontSize: 12 }}>
              需大于上一阶梯
            </Typography.Text>
          ) : null}
        </Col>
        <Col span={9}>
          <Field label="阶梯比例（%）">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={2}
              value={tier.ratio}
              onChange={(value) => patchTier(tier.id, { ratio: value })}
            />
          </Field>
        </Col>
        <Col span={6}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => patchCpPlan({ tiers: activePeriod!.cpPlan.tiers.filter((item) => item.id !== tier.id) })}
          >
            删除
          </Button>
        </Col>
      </Row>
    );
  };

  return (
    <Drawer
      title={project ? `分成配置 · ${project.projectName}` : '分成配置'}
      width={880}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {emptyCreated && (
            <Alert
              type="info"
              showIcon
              closable
              onClose={() => setEmptyCreated(false)}
              message="该项目尚未配置分成方案，已自动新增一个空的生效周期，请填写后保存。"
            />
          )}

          {errors.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="校验未通过"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              }
            />
          )}

          <div>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              生效周期
            </Divider>
            <Space wrap size={12}>
              <Select
                style={{ width: 300 }}
                placeholder="请选择生效周期"
                value={activePeriodId || undefined}
                options={periodOptions}
                onChange={setActivePeriodId}
              />
              <Button icon={<PlusOutlined />} onClick={addPeriod}>
                新增生效周期
              </Button>
              <Button danger icon={<DeleteOutlined />} disabled={!activePeriod} onClick={deletePeriod}>
                删除当前周期
              </Button>
            </Space>
            {activePeriod ? (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Field label="开始日期">
                    <DatePicker
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      value={activePeriod.startDate ? dayjs(activePeriod.startDate) : null}
                      onChange={(date: Dayjs | null) =>
                        patchPeriod(activePeriod.id, (period) => ({
                          ...period,
                          startDate: date ? date.format('YYYY-MM-DD') : null,
                        }))
                      }
                    />
                  </Field>
                </Col>
                <Col span={8}>
                  <Field label="结束日期">
                    <DatePicker
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      value={activePeriod.endDate ? dayjs(activePeriod.endDate) : null}
                      onChange={(date: Dayjs | null) =>
                        patchPeriod(activePeriod.id, (period) => ({
                          ...period,
                          endDate: date ? date.format('YYYY-MM-DD') : null,
                        }))
                      }
                    />
                  </Field>
                </Col>
                <Col span={8}>
                  {activePeriod.startDate &&
                  activePeriod.endDate &&
                  activePeriod.startDate > activePeriod.endDate ? (
                    <Typography.Text type="danger">开始日期不得晚于结束日期</Typography.Text>
                  ) : null}
                </Col>
              </Row>
            ) : (
              <Typography.Text type="secondary">暂无生效周期，请先新增。</Typography.Text>
            )}
          </div>

          {activePeriod && (
            <>
              <div>
                <Divider orientation="left">合作费用</Divider>
                <Typography.Text type="secondary">
                  合作费用 = 计费基数 × 收入占比 × 费率
                </Typography.Text>
                <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 12 }}>
                  {activePeriod.fees.map(renderFee)}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={addFee}>
                    增加合作费用
                  </Button>
                </Space>
              </div>

              <div>
                <Divider orientation="left">CP 分成方案</Divider>
                <Typography.Text type="secondary">
                  分成金额 = 计费基数 × 固定成本 − 应扣除合作费用 ×（1 − 所在阶梯的我方比例），仅当结果 &gt;
                  0 时有效
                </Typography.Text>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={6}>
                    <Field label="是否分成">
                      <Radio.Group
                        optionType="button"
                        buttonStyle="solid"
                        options={yesNoOptions}
                        value={activePeriod.cpPlan.enabled}
                        onChange={(event) => patchCpPlan({ enabled: event.target.value })}
                      />
                    </Field>
                  </Col>
                  {activePeriod.cpPlan.enabled && (
                    <Col span={6}>
                      <Field label="计费基数（流水口径）">
                        <Select
                          style={{ width: '100%' }}
                          placeholder="请选择"
                          value={activePeriod.cpPlan.billingBase ?? undefined}
                          options={BILLING_BASE_OPTIONS}
                          onChange={(value) => patchCpPlan({ billingBase: value })}
                        />
                      </Field>
                    </Col>
                  )}
                  {activePeriod.cpPlan.enabled && (
                    <Col span={6}>
                      <Field label="是否利润分成">
                        <Radio.Group
                          optionType="button"
                          buttonStyle="solid"
                          options={yesNoOptions}
                          value={activePeriod.cpPlan.profitSharing}
                          onChange={(event) => patchCpPlan({ profitSharing: event.target.value })}
                        />
                      </Field>
                    </Col>
                  )}
                  {activePeriod.cpPlan.enabled && activePeriod.cpPlan.profitSharing && (
                    <Col span={6}>
                      <Field label="固定成本（万元）">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          value={activePeriod.cpPlan.fixedCost}
                          onChange={(value) => patchCpPlan({ fixedCost: value })}
                        />
                      </Field>
                    </Col>
                  )}
                </Row>

                {activePeriod.cpPlan.enabled && (
                  <>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={12}>
                        <Field
                          label="是否先扣除合作费用"
                          tooltip="合作费用 = 渠道费用 + 支付通道费用"
                        >
                          <Radio.Group
                            optionType="button"
                            buttonStyle="solid"
                            options={yesNoOptions}
                            value={activePeriod.cpPlan.deductCooperationFee}
                            onChange={(event) =>
                              patchCpPlan({ deductCooperationFee: event.target.value })
                            }
                          />
                        </Field>
                      </Col>
                    </Row>

                    <Divider orientation="left">我方比例（阶梯）</Divider>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {activePeriod.cpPlan.tiers.map(renderTier)}
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => patchCpPlan({ tiers: [...activePeriod.cpPlan.tiers, createEmptyTier()] })}
                      >
                        增加阶梯
                      </Button>
                    </Space>
                  </>
                )}
              </div>
            </>
          )}
        </Space>
      </Spin>
    </Drawer>
  );
}
