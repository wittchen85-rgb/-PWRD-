let seed = 0;

// 生成本地临时 ID（提交真实接口后由后端返回）
export const uid = (prefix: string): string => {
  seed += 1;
  return `${prefix}-${Date.now()}-${seed}`;
};
