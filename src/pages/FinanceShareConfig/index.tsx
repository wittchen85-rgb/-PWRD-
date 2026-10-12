import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import { App, Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CalculatorOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchGameProjectRows } from '../../api';
import { MOCK_NOTICE_TEXT, SHOW_MOCK_NOTICE, TODAY_STATUS_OPTIONS } from '../../config/constants';
import type { GameProjectRow, TodayStatus } from '../../types';
import ShareConfigDrawer from './ShareConfigDrawer';
import ExecuteDataModal from './ExecuteDataModal';
import LogDrawer from './LogDrawer';

type StatusFilter = 'all' | TodayStatus;

export default function FinanceShareConfig() {
  const { message } = App.useApp();

  const [rows, setRows] = useState<GameProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const [configTarget, setConfigTarget] = useState<GameProjectRow | null>(null);
  const [logTarget, setLogTarget] = useState<GameProjectRow | null>(null);
  const [executeOpen, setExecuteOpen] = useState(false);

  const loadRows = useCallback(
    async (nextKeyword = keyword) => {
      setLoading(true);
      try {
        const list = await fetchGameProjectRows({ keyword: nextKeyword });
        setRows(list);
      } finally {
        setLoading(false);
      }
    },
    [keyword],
  );

  useEffect(() => {
    void loadRows('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((row) => row.todayStatus === statusFilter)),
    [rows, statusFilter],
  );

  const selectedProjects = useMemo(
    () => rows.filter((row) => selectedRowKeys.includes(row.id)),
    [rows, selectedRowKeys],
  );

  const handleRefresh = async () => {
    setSelectedRowKeys([]);
    await loadRows();
    message.success('游戏项目主数据已刷新');
  };

  const handleBatchExecute = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选需要执行数据计算的项目');
      return;
    }
    setExecuteOpen(true);
  };

  const columns: TableColumnsType<GameProjectRow> = [
    {
      title: '游戏项目',
      dataIndex: 'projectName',
      width: 220,
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.projectName}</Typography.Text>
          <Typography.Text type="secondary">{record.gameName}</Typography.Text>
        </Space>
      ),
    },
    { title: '研发工作室', dataIndex: 'studio', width: 180 },
    { title: '发布地区', dataIndex: 'region', width: 120 },
    { title: '发布端口', dataIndex: 'platform', width: 120 },
    {
      title: '生效周期',
      dataIndex: 'effectivePeriod',
      width: 220,
      render: (value: string | null) => value ?? '-',
    },
    {
      title: '今日状态',
      dataIndex: 'todayStatus',
      width: 120,
      render: (value: TodayStatus) =>
        value === 'valid' ? <Tag color="success">有效</Tag> : <Tag color="warning">未配置</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_value, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => setConfigTarget(record)}>
            配置
          </Button>
          <Button type="link" size="small" onClick={() => setLogTarget(record)}>
            日志
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        财务分成配置
      </Typography.Title>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {SHOW_MOCK_NOTICE && <Alert type="info" showIcon message={MOCK_NOTICE_TEXT} />}

          <Space wrap size={12}>
            <Input.Search
              allowClear
              placeholder="搜索项目名 / 游戏名"
              style={{ width: 240 }}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={(value) => {
                setSelectedRowKeys([]);
                void loadRows(value);
              }}
            />
            <Select<StatusFilter>
              style={{ width: 140 }}
              value={statusFilter}
              options={TODAY_STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button type="primary" icon={<CalculatorOutlined />} onClick={handleBatchExecute}>
              执行数据计算
            </Button>
            <Typography.Text type="secondary">已选 {selectedRowKeys.length} 项</Typography.Text>
          </Space>

          <Table<GameProjectRow>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredRows}
            scroll={{ x: 1120 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
          />
        </Space>
      </Card>

      <ShareConfigDrawer
        project={configTarget}
        open={Boolean(configTarget)}
        onClose={() => setConfigTarget(null)}
        onSaved={() => void loadRows()}
      />

      <LogDrawer
        project={logTarget}
        open={Boolean(logTarget)}
        onClose={() => setLogTarget(null)}
      />

      <ExecuteDataModal
        open={executeOpen}
        projects={selectedProjects}
        onClose={() => setExecuteOpen(false)}
        onFinished={() => {
          setSelectedRowKeys([]);
          void loadRows();
        }}
      />
    </div>
  );
}
