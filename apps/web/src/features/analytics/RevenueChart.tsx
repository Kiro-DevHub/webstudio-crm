import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatMoney,
  formatMoneyCompact,
  formatMonthLong,
  formatMonthShort,
  formatNumber,
} from '@/lib/labels';
import type { RevenueByMonthPoint } from './analytics.types';

interface RevenueChartProps {
  data: RevenueByMonthPoint[];
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: { payload: RevenueByMonthPoint }[];
}

/** Values lead, month follows — the reader already has the month and wants the number. */
function RevenueTooltip({ active, payload }: RevenueTooltipProps) {
  if (!active || payload === undefined || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <p className="font-mono text-sm font-semibold tabular">{formatMoney(point.revenue)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatMonthLong(point.month)}</p>
      <p className="text-xs text-muted-foreground">
        Выиграно сделок:{' '}
        <span className="tabular font-mono text-foreground">{formatNumber(point.dealsWon)}</span>
      </p>
    </div>
  );
}

/**
 * WON revenue per month — the dashboard's hero. One cobalt series (the only accent), a soft
 * gradient wash, a 2px line and a ringed active dot. Every colour is a theme CSS variable, so
 * the chart is redrawn correctly the moment the `.dark` class flips. An sr-only table mirrors
 * the series so the values never live in the tooltip alone.
 */
export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="flex flex-col">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              minTickGap={8}
              dy={4}
            />
            <YAxis
              tickFormatter={(value: number) => formatMoneyCompact(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              width={64}
            />
            <Tooltip
              content={<RevenueTooltip />}
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#revenueFill)"
              dot={false}
              activeDot={{
                r: 4,
                fill: 'var(--primary)',
                stroke: 'var(--card)',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Screen-reader twin so the values never live in the tooltip alone. Wrapped in an
          sr-only div — a bare `sr-only` <table> keeps display:table and sizes to its content,
          overflowing the viewport; the clipping div contains it. */}
      <div className="sr-only">
        <table>
          <caption>Выручка по месяцам</caption>
          <thead>
            <tr>
              <th scope="col">Месяц</th>
              <th scope="col">Выручка</th>
              <th scope="col">Выиграно сделок</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.month}>
                <td>{formatMonthLong(point.month)}</td>
                <td>{formatMoney(point.revenue)}</td>
                <td>{formatNumber(point.dealsWon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
