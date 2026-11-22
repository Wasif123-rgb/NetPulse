import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type Point = {
  time: string
  latency: number
}

interface LatencyChartProps {
  points: Point[]
  latency: number
  average: number
  selectedRange: string
  setSelectedRange: (range: string) => void
}

function LatencyChart({
  points,
  latency,
  average,
  selectedRange,
  setSelectedRange,
}: LatencyChartProps) {
  return (
    <section className="chart-card">
      <div className="chart-head">
        <div>
          <h2>Latency Overview</h2>
          <p>Monitor your internet response time</p>
        </div>

        <select
          value={selectedRange}
          onChange={e => setSelectedRange(e.target.value)}
        >
          <option value="24 hours">24 hours</option>
          <option value="7 days">7 days</option>
          <option value="30 days">30 days</option>
        </select>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot" />
          Latency
        </span>

        <span className="chart-average">
          Current: <b>{latency} ms</b> &nbsp; Average: <b>{average} ms</b>
        </span>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="netpulseLatencyGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#3bd29e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3bd29e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#25323a"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#75838e', fontSize: 10 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#75838e', fontSize: 10 }}
              width={40}
            />

            <Tooltip
              contentStyle={{
                background: '#16222a',
                border: '1px solid #2a3942',
                borderRadius: 9,
                color: '#dce6eb',
              }}
              labelStyle={{ color: '#8b9aa4' }}
              formatter={value => [`${value} ms`, 'Latency']}
            />

            <Area
              type="monotone"
              dataKey="latency"
              stroke="#3bd29e"
              strokeWidth={2}
              fill="url(#netpulseLatencyGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#3bd29e',
                stroke: '#0f171d',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <span>
          <i className="legend-line" />
          <b>Current latency: {latency} ms</b>
        </span>

        <span>
          <i className="legend-line" />
          <b>Average: {average} ms</b>
        </span>

        <span>
          <i className="status-dot live" />
          {points.length} measurements
        </span>
      </div>
    </section>
  )
}

export default LatencyChart