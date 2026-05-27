'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { numberFormat } from '../format';
import type { DashboardChartPoint } from '../types';

type TrendChartProps = Readonly<{
  chartPoints: DashboardChartPoint[];
  rangeLabel: string;
  selectedPoint: DashboardChartPoint | undefined;
  onSelectDate: (dateKey: string) => void;
}>;

type SeriesKey = 'searches' | 'clicks' | 'forms';

type SeriesConfig = Readonly<{
  key: SeriesKey;
  label: string;
  color: string;
}>;

const SERIES: ReadonlyArray<SeriesConfig> = [
  { color: '#176da6', key: 'searches', label: '搜索' },
  { color: '#c77a12', key: 'clicks', label: '点击' },
  { color: '#ef3b49', key: 'forms', label: '询盘' },
];

const FALLBACK_VIEW_WIDTH = 1000;
const FALLBACK_VIEW_HEIGHT = 282;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 18;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 34;
const GRID_LINES = 4;

type ChartSize = Readonly<{
  height: number;
  width: number;
}>;

const FALLBACK_CHART_SIZE: ChartSize = {
  height: FALLBACK_VIEW_HEIGHT,
  width: FALLBACK_VIEW_WIDTH,
};

function niceCeiling(value: number) {
  if (value <= 4) return 4;
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let nice: number;
  if (normalized <= 1.5) nice = 1.5;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 3) nice = 3;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

function buildSmoothPath(coords: ReadonlyArray<readonly [number, number]>) {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    const [x, y] = coords[0]!;
    return `M ${x} ${y}`;
  }

  let path = `M ${coords[0]![0]} ${coords[0]![1]}`;
  for (let index = 1; index < coords.length; index += 1) {
    const [px, py] = coords[index - 1]!;
    const [cx, cy] = coords[index]!;
    const midX = (px + cx) / 2;
    path += ` C ${midX} ${py}, ${midX} ${cy}, ${cx} ${cy}`;
  }
  return path;
}

export function TrendChart({
  chartPoints,
  onSelectDate,
  rangeLabel,
  selectedPoint,
}: TrendChartProps) {
  const gradientPrefix = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartSize, setChartSize] = useState<ChartSize>(FALLBACK_CHART_SIZE);
  const [hiddenSeries, setHiddenSeries] = useState<ReadonlyArray<SeriesKey>>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const updateSize = (width: number, height: number) => {
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);

      if (nextWidth <= 0 || nextHeight <= 0) return;

      setChartSize((previous) => {
        if (previous.width === nextWidth && previous.height === nextHeight) {
          return previous;
        }

        return { height: nextHeight, width: nextWidth };
      });
    };

    const rect = svg.getBoundingClientRect();
    updateSize(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(svg);

    return () => observer.disconnect();
  }, []);

  const visibleSeries = useMemo(
    () => SERIES.filter((series) => !hiddenSeries.includes(series.key)),
    [hiddenSeries],
  );

  const maxValue = useMemo(() => {
    if (chartPoints.length === 0 || visibleSeries.length === 0) {
      return 4;
    }

    let peak = 0;
    for (const point of chartPoints) {
      for (const series of visibleSeries) {
        const value = point[series.key];
        if (value > peak) peak = value;
      }
    }

    return niceCeiling(Math.max(peak, 1));
  }, [chartPoints, visibleSeries]);

  const viewWidth = chartSize.width;
  const viewHeight = chartSize.height;
  const innerWidth = Math.max(1, viewWidth - PADDING_LEFT - PADDING_RIGHT);
  const innerHeight = Math.max(1, viewHeight - PADDING_TOP - PADDING_BOTTOM);
  const stepX = chartPoints.length > 1 ? innerWidth / (chartPoints.length - 1) : 0;

  const xFor = useCallback((index: number) => PADDING_LEFT + stepX * index, [stepX]);

  const yFor = useCallback(
    (value: number) => PADDING_TOP + innerHeight - (value / maxValue) * innerHeight,
    [innerHeight, maxValue],
  );

  const seriesPaths = useMemo(() => {
    return SERIES.map((series) => {
      const coords = chartPoints.map(
        (point, index) => [xFor(index), yFor(point[series.key])] as const,
      );
      const linePath = buildSmoothPath(coords);
      const baseline = PADDING_TOP + innerHeight;
      const areaPath =
        coords.length > 0
          ? `${linePath} L ${coords[coords.length - 1]![0]} ${baseline} L ${coords[0]![0]} ${baseline} Z`
          : '';
      return { ...series, areaPath, coords, linePath };
    });
  }, [chartPoints, innerHeight, xFor, yFor]);

  const gridValues = useMemo(() => {
    return Array.from({ length: GRID_LINES + 1 }, (_, index) => {
      const ratio = index / GRID_LINES;
      return Math.round(maxValue * (1 - ratio));
    });
  }, [maxValue]);

  const xAxisIndices = useMemo(() => {
    if (chartPoints.length === 0) return [];
    if (chartPoints.length <= 2) {
      return chartPoints.map((_, index) => index);
    }
    return [0, Math.floor((chartPoints.length - 1) / 2), chartPoints.length - 1];
  }, [chartPoints]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (chartPoints.length === 0) return;
      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
      const viewX = ratio * viewWidth;
      if (viewX < PADDING_LEFT || viewX > viewWidth - PADDING_RIGHT) {
        setHoverIndex(null);
        return;
      }
      const relative = (viewX - PADDING_LEFT) / Math.max(1, innerWidth);
      const index = Math.min(
        chartPoints.length - 1,
        Math.max(0, Math.round(relative * (chartPoints.length - 1))),
      );
      setHoverIndex(index);
    },
    [chartPoints.length, innerWidth, viewWidth],
  );

  const onPointerLeave = useCallback(() => setHoverIndex(null), []);

  const onPointerClick = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (chartPoints.length === 0) return;
      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
      const viewX = ratio * viewWidth;
      const relative = (viewX - PADDING_LEFT) / Math.max(1, innerWidth);
      const index = Math.min(
        chartPoints.length - 1,
        Math.max(0, Math.round(relative * (chartPoints.length - 1))),
      );
      const point = chartPoints[index];
      if (point) {
        onSelectDate(point.dateKey);
      }
    },
    [chartPoints, innerWidth, onSelectDate, viewWidth],
  );

  const toggleSeries = useCallback((key: SeriesKey) => {
    setHiddenSeries((previous) => {
      if (previous.includes(key)) {
        return previous.filter((item) => item !== key);
      }
      if (previous.length >= SERIES.length - 1) {
        return previous;
      }
      return [...previous, key];
    });
  }, []);

  const activeIndex =
    hoverIndex !== null
      ? hoverIndex
      : selectedPoint
        ? chartPoints.findIndex((point) => point.dateKey === selectedPoint.dateKey)
        : -1;
  const activePoint = activeIndex >= 0 ? chartPoints[activeIndex] : undefined;
  const activeX = activeIndex >= 0 ? xFor(activeIndex) : 0;
  const activePercent = ((activeX / viewWidth) * 100).toFixed(2);

  return (
    <article className="yourfield-ops-panel yourfield-ops-panel--chart">
      <div className="yourfield-ops-panel__head">
        <div>
          <h3>{rangeLabel}互动趋势</h3>
          <p>按天展示搜索、点击与询盘的变化曲线。</p>
        </div>
        <div className="yourfield-ops-trend__legend" role="group" aria-label="切换显示的指标">
          {SERIES.map((series) => {
            const isHidden = hiddenSeries.includes(series.key);
            return (
              <button
                key={series.key}
                type="button"
                className={`yourfield-ops-trend__chip${isHidden ? ' is-hidden' : ''}`}
                onClick={() => toggleSeries(series.key)}
                aria-pressed={!isHidden}
                style={{ '--series-color': series.color } as React.CSSProperties}
              >
                <span aria-hidden="true" />
                {series.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="yourfield-ops-trend">
        <svg
          className="yourfield-ops-trend__svg"
          ref={svgRef}
          role="img"
          aria-label={`${rangeLabel}互动趋势折线图`}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onClick={onPointerClick}
        >
          <defs>
            {SERIES.map((series) => (
              <linearGradient
                key={series.key}
                id={`trend-${gradientPrefix}-${series.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={series.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {gridValues.map((value, index) => {
            const y = PADDING_TOP + (innerHeight * index) / GRID_LINES;
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={PADDING_LEFT}
                  x2={viewWidth - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="rgba(24,56,92,0.12)"
                  strokeDasharray={index === GRID_LINES ? '0' : '4 4'}
                  strokeWidth={index === GRID_LINES ? 1 : 1}
                />
                <text
                  x={PADDING_LEFT - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="rgba(24,56,92,0.56)"
                  fontWeight={700}
                >
                  {numberFormat(value)}
                </text>
              </g>
            );
          })}

          {seriesPaths.map((series) => {
            if (hiddenSeries.includes(series.key)) return null;
            return (
              <g key={`area-${series.key}`}>
                <path d={series.areaPath} fill={`url(#trend-${gradientPrefix}-${series.key})`} />
                <path
                  d={series.linePath}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {xAxisIndices.map((index) => {
            const point = chartPoints[index];
            if (!point) return null;
            return (
              <text
                key={`xaxis-${index}`}
                x={xFor(index)}
                y={viewHeight - 16}
                textAnchor={
                  index === 0 ? 'start' : index === chartPoints.length - 1 ? 'end' : 'middle'
                }
                dominantBaseline="hanging"
                fontSize="11"
                fill="rgba(24,56,92,0.62)"
                fontWeight={700}
              >
                {point.label}
              </text>
            );
          })}

          {activePoint ? (
            <g>
              <line
                x1={activeX}
                x2={activeX}
                y1={PADDING_TOP}
                y2={PADDING_TOP + innerHeight}
                stroke="rgba(24,56,92,0.28)"
                strokeDasharray="3 4"
                strokeWidth={1}
              />
              {seriesPaths
                .filter((series) => !hiddenSeries.includes(series.key))
                .map((series) => (
                  <circle
                    key={`marker-${series.key}`}
                    cx={activeX}
                    cy={yFor(activePoint[series.key])}
                    r={4.5}
                    fill="#ffffff"
                    stroke={series.color}
                    strokeWidth={2}
                  />
                ))}
            </g>
          ) : null}
        </svg>

        {activePoint ? (
          <div
            className="yourfield-ops-trend__tooltip"
            style={{
              left: `clamp(var(--trend-tooltip-center-edge), ${activePercent}%, calc(100% - var(--trend-tooltip-center-edge)))`,
            }}
            role="status"
          >
            <p className="yourfield-ops-trend__tooltip-date">{activePoint.label}</p>
            <dl>
              {visibleSeries.map((series) => (
                <div
                  key={series.key}
                  style={{ '--series-color': series.color } as React.CSSProperties}
                >
                  <dt>
                    <span aria-hidden="true" />
                    {series.label}
                  </dt>
                  <dd>{numberFormat(activePoint[series.key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </article>
  );
}
