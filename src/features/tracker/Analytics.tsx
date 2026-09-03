import { useEffect, useMemo, useRef } from 'react';
import { init, use, type ComposeOption } from 'echarts/core';
import { BarChart, LineChart, type BarSeriesOption, type LineSeriesOption } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { currentStage, outcome, type Application } from './model';

use([BarChart, LineChart, AriaComponent, GridComponent, TooltipComponent, SVGRenderer]);
type ChartOption = ComposeOption<
  BarSeriesOption | LineSeriesOption | GridComponentOption | TooltipComponentOption
>;
function Chart({ option, label }: { option: ChartOption; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = init(ref.current, undefined, { renderer: 'svg' });
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);
  return <div className="tracker-chart" ref={ref} role="img" aria-label={label} />;
}

export default function Analytics({ applications }: { applications: Application[] }) {
  const charts = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const counts = new Map<string, number>();
    const stages = new Map<string, number>();
    for (const application of applications) {
      counts.set(application.appliedAt, (counts.get(application.appliedAt) ?? 0) + 1);
      if (outcome(application) === 'active') {
        const name = currentStage(application)?.name ?? '待更新';
        stages.set(name, (stages.get(name) ?? 0) + 1);
      }
    }
    const ranked = [...stages.entries()].sort((a, b) => b[1] - a[1]);
    const shown =
      ranked.length > 8
        ? [
            ...ranked.slice(0, 7),
            ['其他阶段', ranked.slice(7).reduce((total, entry) => total + entry[1], 0)] as [
              string,
              number,
            ],
          ]
        : ranked;
    const base = {
      animation: false,
      textStyle: {
        fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
        color: '#707782',
        fontSize: 11,
      },
      tooltip: { trigger: 'axis' as const, renderMode: 'richText' as const },
      grid: { top: 15, right: 15, bottom: 26, left: 34 },
    };
    const trend: ChartOption = {
      ...base,
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e8eb' } },
        axisTick: { show: false },
        axisLabel: { formatter: (value: string) => value.slice(5), interval: 6 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#eef0f2', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          name: '投递数量',
          data: dates.map((date) => counts.get(date) ?? 0),
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: false,
          lineStyle: { width: 2, color: '#4778a4' },
          itemStyle: { color: '#4778a4' },
        },
      ],
    };
    const distribution: ChartOption = {
      ...base,
      grid: { top: 6, right: 25, bottom: 24, left: 105 },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#eef0f2', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: shown.map(([name]) => name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { width: 90, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          name: '进行中的投递',
          data: shown.map(([, count]) => count),
          barMaxWidth: 14,
          itemStyle: { color: '#8299ad', borderRadius: 2 },
          label: { show: true, position: 'right', fontSize: 10, color: '#687484' },
        },
      ],
    };
    return {
      trend,
      distribution,
      ranked,
      trendTotal: dates.reduce((sum, date) => sum + (counts.get(date) ?? 0), 0),
      trendDescription: dates.map((date) => `${date}：${counts.get(date) ?? 0} 条`).join('；'),
    };
  }, [applications]);
  return (
    <div className="tracker-analytics">
      <section>
        <header>
          <h3>近 30 天投递</h3>
          <span>{charts.trendTotal} 条 · 当前筛选</span>
        </header>
        <Chart option={charts.trend} label={charts.trendDescription} />
      </section>
      <section>
        <header>
          <h3>进行中的阶段分布</h3>
          <span>当前筛选</span>
        </header>
        {charts.ranked.length ? (
          <Chart
            option={charts.distribution}
            label={charts.ranked.map(([name, count]) => `${name} ${count} 条`).join('，')}
          />
        ) : (
          <p className="tracker-chart-empty">当前没有进行中的投递</p>
        )}
      </section>
    </div>
  );
}
