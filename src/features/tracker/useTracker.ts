import { useEffect, useRef, useState } from 'react';
import { emptyData, parseData, STORAGE_KEY, type TrackerData } from './model';

export function useTracker() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { data: raw ? parseData(raw) : emptyData(), raw, error: '' };
    } catch (error) {
      return {
        data: emptyData(),
        raw: null,
        error: `无法读取本地记录：${(error as Error).message}。原始数据未被覆盖，请先导出原始数据，再恢复备份。`,
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const rawRef = useRef(initial.raw);
  // 读取失败时锁住常规保存入口，不能让空白初始状态覆盖损坏的原始数据。
  const blocked = useRef(!!initial.error);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setData(raw ? parseData(raw) : emptyData());
        rawRef.current = raw;
        blocked.current = false;
        setError('另一个页面更新了记录，已同步最新数据；正在编辑的内容请重新打开。');
      } catch {
        blocked.current = true;
        setError('另一个页面写入的数据无法读取，请备份原始数据后恢复。');
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function save(next: TrackerData, recover = false): boolean {
    try {
      if (blocked.current && !recover)
        throw new Error('当前本地数据无法读取，请先导出原始数据，再导入备份或清空记录');
      // 保存前检查快照，防止另一标签页的新记录被当前页面的旧数据覆盖。
      if (!recover && localStorage.getItem(STORAGE_KEY) !== rawRef.current)
        throw new Error('记录已在其他页面更新，请刷新后重试');
      const checked = parseData(JSON.stringify(next));
      const raw = JSON.stringify(checked);
      // 一次写入公司、投递和模板；成功后才更新页面，避免部分保存或假成功。
      localStorage.setItem(STORAGE_KEY, raw);
      rawRef.current = raw;
      blocked.current = false;
      setData(checked);
      setError('');
      return true;
    } catch (cause) {
      const message =
        cause instanceof DOMException && cause.name === 'QuotaExceededError'
          ? '本地空间不足，请先备份，再删除不需要的记录'
          : (cause as Error).message;
      setError(`未保存：${message}`);
      return false;
    }
  }
  return { data, save, error };
}
