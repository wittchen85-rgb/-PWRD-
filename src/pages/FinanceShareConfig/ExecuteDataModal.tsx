import { useEffect, useRef, useState } from 'react';
import { Alert, App, Button, DatePicker, Modal, Progress, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { commitExecutionLog, fetchExecutionTask, startDataExecution } from '../../api';
import type { GameProjectRow } from '../../types';

interface Props {
  open: boolean;
  projects: GameProjectRow[];
  onClose: () => void;
  onFinished: () => void;
}

export default function ExecuteDataModal({ open, projects, onClose, onFinished }: Props) {
  const { message } = App.useApp();
  const timerRef = useRef<number | null>(null);

  const [calcStartDate, setCalcStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');

  const stopPolling = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopPolling();
      setStatus('idle');
      setProgress(0);
      setResult('');
      setCalcStartDate(dayjs().format('YYYY-MM-DD'));
    }
  }, [open]);

  useEffect(() => () => stopPolling(), []);

  const handleStart = async () => {
    const { taskId } = await startDataExecution({
      projectIds: projects.map((project) => project.id),
      calcStartDate,
    });
    setStatus('running');
    setProgress(0);
    setResult('');
    stopPolling();
    timerRef.current = window.setInterval(async () => {
      const task = await fetchExecutionTask(taskId);
      setProgress(task.progress);
      if (task.status === 'done') {
        stopPolling();
        setStatus('done');
        setResult(task.result ?? '执行成功');
        commitExecutionLog(taskId);
        message.success('数据计算执行完成');
        onFinished();
      }
    }, 400);
  };

  const running = status === 'running';

  return (
    <Modal
      title="执行数据计算"
      open={open}
      onCancel={onClose}
      maskClosable={false}
      closable={!running}
      footer={
        <Space>
          <Button onClick={onClose} disabled={running}>
            关闭
          </Button>
          <Button type="primary" loading={running} onClick={handleStart}>
            发起执行
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">涉及项目清单（{projects.length}）</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Space wrap size={[8, 8]}>
              {projects.map((project) => (
                <Tag key={project.id}>{project.projectName}</Tag>
              ))}
            </Space>
          </div>
        </div>

        <div>
          <Typography.Text type="secondary">计算开始日期</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <DatePicker
              style={{ width: 240 }}
              format="YYYY-MM-DD"
              disabled={running}
              value={calcStartDate ? dayjs(calcStartDate) : null}
              onChange={(date: Dayjs | null) =>
                setCalcStartDate(date ? date.format('YYYY-MM-DD') : '')
              }
            />
          </div>
        </div>

        {running && <Progress percent={progress} status="active" />}

        {status === 'done' && (
          <Alert type="success" showIcon message={`执行完成：${result}`} />
        )}
      </Space>
    </Modal>
  );
}
