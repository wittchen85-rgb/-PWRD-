import { useEffect, useState } from 'react';
import { Alert, Drawer, Space, Table, Tabs, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { fetchExecutionLogs, fetchRuleChangeLogs } from '../../api';
import { MOCK_NOTICE_TEXT, SHOW_MOCK_NOTICE } from '../../config/constants';
import type { ExecutionLog, GameProjectRow, RuleChangeLog } from '../../types';

interface Props {
  project: GameProjectRow | null;
  open: boolean;
  onClose: () => void;
}

const ruleColumns: TableColumnsType<RuleChangeLog> = [
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '修改时间', dataIndex: 'time', width: 180 },
  { title: '修改内容', dataIndex: 'content' },
  { title: '关联生效周期', dataIndex: 'period', width: 220 },
];

const executionColumns: TableColumnsType<ExecutionLog> = [
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '发起时间', dataIndex: 'startTime', width: 180 },
  { title: '计算开始日期', dataIndex: 'calcStartDate', width: 140 },
  { title: '涉及项目', dataIndex: 'projects' },
  { title: '执行结果', dataIndex: 'result', width: 120 },
];

export default function LogDrawer({ project, open, onClose }: Props) {
  const [ruleLogs, setRuleLogs] = useState<RuleChangeLog[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !project) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchRuleChangeLogs(project.id), fetchExecutionLogs(project.id)])
      .then(([rules, executions]) => {
        if (cancelled) return;
        setRuleLogs(rules);
        setExecutionLogs(executions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, project]);

  return (
    <Drawer
      title={project ? `日志 · ${project.projectName}` : '日志'}
      width={880}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {SHOW_MOCK_NOTICE && <Alert type="info" showIcon message={MOCK_NOTICE_TEXT} />}
        <Typography.Text type="secondary">{project?.gameName}</Typography.Text>
        <Tabs
          items={[
            {
              key: 'rule',
              label: '规则变更记录',
              children: (
                <Table<RuleChangeLog>
                  rowKey="id"
                  size="small"
                  loading={loading}
                  columns={ruleColumns}
                  dataSource={ruleLogs}
                  pagination={false}
                  scroll={{ x: 760 }}
                />
              ),
            },
            {
              key: 'execution',
              label: '数据执行日志',
              children: (
                <Table<ExecutionLog>
                  rowKey="id"
                  size="small"
                  loading={loading}
                  columns={executionColumns}
                  dataSource={executionLogs}
                  pagination={false}
                  scroll={{ x: 760 }}
                />
              ),
            },
          ]}
        />
      </Space>
    </Drawer>
  );
}
