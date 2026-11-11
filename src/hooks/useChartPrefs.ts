import { useCallback, useState } from 'react';
import { CHART_PREFS_KEY, type ChartPrefs, parseChartPrefs, readDevice, writeDevice } from '@/lib/prefs';

/** The chart filters of this device. Each change is saved at once. */
export function useChartPrefs(): [ChartPrefs, (change: Partial<ChartPrefs>) => void] {
  const [prefs, setPrefs] = useState<ChartPrefs>(() => parseChartPrefs(readDevice(CHART_PREFS_KEY)));
  const update = useCallback((change: Partial<ChartPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...change };
      writeDevice(CHART_PREFS_KEY, next);
      return next;
    });
  }, []);
  return [prefs, update];
}
