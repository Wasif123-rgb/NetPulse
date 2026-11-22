
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Activity,
  ArrowDownToLine,
  FileText,
  Gauge,
  Download,
  Upload,
  Clock3,
  RefreshCw,
  Printer,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Sidebar from '../components/Sidebar'
import type { Page } from '../App'
import type { TestHistoryItem } from './Dashboard'

interface ReportsProps {
  onNavigate: (page: Page) => void
}

type TimeRange = '1h' | '24h' | '7d'

const HISTORY_KEY = 'netpulse_test_history'

const cardStyle: CSSProperties = {
  background: '#111a22',
  border: '1px solid #26343d',
  borderRadius: 12,
  padding: 20,
}

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 15px',
  borderRadius: 8,
  border: '1px solid #34434d',
  background: '#17232b',
  color: '#e7edf1',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
}

const chartTooltipStyle = {
  background: '#17232b',
  border: '1px solid #34434d',
  borderRadius: 8,
  color: '#e7edf1',
  fontSize: 12,
}

function readHistory(): TestHistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)

    if (!saved) return []

    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function average(values: (number | null)[]): number | null {
  const valid = values.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  )

  if (valid.length === 0) return null

  return valid.reduce((total, value) => total + value, 0) / valid.length
}

function formatNumber(value: number | null, suffix = ''): string {
  return value === null ? '—' : `${value.toFixed(2)}${suffix}`
}

function getRating(score: number | null): string {
  if (score === null) return 'No data'
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Poor'
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeCSV(value: unknown): string {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function Reports({ onNavigate }: ReportsProps) {
  const [history, setHistory] = useState<TestHistoryItem[]>([])
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  const notify = (message: string) => {
    setNotification(message)
    window.setTimeout(() => setNotification(''), 3000)
  }

  useEffect(() => {
    setHistory(readHistory())
  }, [])

  const stats = useMemo(() => {
    const latency = average(history.map(item => item.latency))
    const jitter = average(history.map(item => item.jitter))
    const packetLoss = average(history.map(item => item.packetLoss))
    const download = average(history.map(item => item.downloadSpeed))
    const upload = average(history.map(item => item.uploadSpeed))
    const score = average(history.map(item => item.qualityScore))

    const validDownloads = history.filter(
      item => typeof item.downloadSpeed === 'number',
    )

    const validLatencies = history.filter(
      item => typeof item.latency === 'number',
    )

    const bestDownload = validDownloads.length
      ? Math.max(...validDownloads.map(item => item.downloadSpeed!))
      : null

    const bestLatency = validLatencies.length
      ? Math.min(...validLatencies.map(item => item.latency!))
      : null

    const worstLatency = validLatencies.length
      ? Math.max(...validLatencies.map(item => item.latency!))
      : null

    const latest = history.length > 0 ? history[0] : null

    return {
      latency,
      jitter,
      packetLoss,
      download,
      upload,
      score,
      bestDownload,
      bestLatency,
      worstLatency,
      latest,
    }
  }, [history])

  const filteredHistory = useMemo(() => {
    const now = Date.now()

    const rangeMilliseconds: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }

    return history
      .filter(item => {
        const timestamp = new Date(item.testedAt).getTime()

        return (
          Number.isFinite(timestamp) &&
          timestamp >= now - rangeMilliseconds[timeRange] &&
          timestamp <= now
        )
      })
      .sort(
        (a, b) =>
          new Date(a.testedAt).getTime() -
          new Date(b.testedAt).getTime(),
      )
      .map(item => ({
        ...item,
        time: new Date(item.testedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        date: new Date(item.testedAt).toLocaleDateString(),
      }))
  }, [history, timeRange])

  const exportCSV = () => {
    if (history.length === 0) {
      notify('No test history available to export.')
      return
    }

    const headers = [
      'Date',
      'Latency (ms)',
      'Jitter (ms)',
      'Failed Request Rate (%)',
      'Download Speed (Mbps)',
      'Upload Speed (Mbps)',
      'Quality Score',
    ]

    const rows = history.map(item => [
      item.testedAt,
      item.latency,
      item.jitter,
      item.packetLoss,
      item.downloadSpeed,
      item.uploadSpeed,
      item.qualityScore,
    ])

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n')

    downloadFile(
      '\uFEFF' + csv,
      `netpulse-history-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;',
    )

    notify('CSV report downloaded successfully.')
  }

  const generateReport = () => {
    if (history.length === 0) {
      notify('Run some speed tests before generating a report.')
      return
    }

    const report = [
      'NETPULSE - NETWORK PERFORMANCE REPORT',
      '======================================',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Total recorded tests: ${history.length}`,
      '',
      'PERFORMANCE SUMMARY',
      '-------------------',
      `Average Latency: ${formatNumber(stats.latency, ' ms')}`,
      `Average Jitter: ${formatNumber(stats.jitter, ' ms')}`,
      `Average Failed Request Rate: ${formatNumber(stats.packetLoss, '%')}`,
      `Average Download Speed: ${formatNumber(stats.download, ' Mbps')}`,
      `Average Upload Speed: ${formatNumber(stats.upload, ' Mbps')}`,
      `Average Quality Score: ${formatNumber(stats.score, '/100')}`,
      `Network Rating: ${getRating(stats.score)}`,
      '',
      'BEST AND WORST RESULTS',
      '----------------------',
      `Best Download Speed: ${formatNumber(stats.bestDownload, ' Mbps')}`,
      `Best Latency: ${formatNumber(stats.bestLatency, ' ms')}`,
      `Worst Recorded Latency: ${formatNumber(stats.worstLatency, ' ms')}`,
      '',
      'LATEST TEST',
      '-----------',
      `Date: ${stats.latest ? new Date(stats.latest.testedAt).toLocaleString() : '—'}`,
      `Latency: ${formatNumber(stats.latest?.latency ?? null, ' ms')}`,
      `Download: ${formatNumber(stats.latest?.downloadSpeed ?? null, ' Mbps')}`,
      `Upload: ${formatNumber(stats.latest?.uploadSpeed ?? null, ' Mbps')}`,
      `Quality Score: ${formatNumber(stats.latest?.qualityScore ?? null, '/100')}`,
      '',
      'Note: Failed request rate is based on the application HTTP probes,',
      'not a direct ICMP packet-loss measurement.',
      '',
      'Generated by NetPulse Network Monitor',
    ].join('\n')

    downloadFile(
      report,
      `netpulse-report-${new Date().toISOString().slice(0, 10)}.txt`,
      'text/plain;charset=utf-8;',
    )

    notify('Performance report generated successfully.')
  }

  const refreshHistory = () => {
    setHistory(readHistory())
    notify('Report data refreshed.')
  }

  const metricCards = [
    {
      title: 'Average Latency',
      value: formatNumber(stats.latency, ' ms'),
      icon: Clock3,
      description: 'Average response time',
    },
    {
      title: 'Average Jitter',
      value: formatNumber(stats.jitter, ' ms'),
      icon: Activity,
      description: 'Variation in latency',
    },
    {
      title: 'Download Speed',
      value: formatNumber(stats.download, ' Mbps'),
      icon: Download,
      description: 'Average download performance',
    },
    {
      title: 'Upload Speed',
      value: formatNumber(stats.upload, ' Mbps'),
      icon: Upload,
      description: 'Average upload performance',
    },
    {
      title: 'Quality Score',
      value:
        stats.score === null
          ? '—'
          : `${Math.round(stats.score)}/100`,
      icon: Gauge,
      description: getRating(stats.score),
    },
    {
      title: 'Failed Request Rate',
      value: formatNumber(stats.packetLoss, '%'),
      icon: AlertCircle,
      description: 'Average failed probe rate',
    },
  ]

  const renderEmptyChart = () => (
    <div
      style={{
        height: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#728691',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <Activity size={25} />
      <strong style={{ color: '#e7edf1', fontSize: 13 }}>
        No trend data in this period
      </strong>
      <span style={{ fontSize: 11 }}>
        Run speed tests during this time range to build your chart.
      </span>
    </div>
  )

  const chartCardStyle: CSSProperties = {
    ...cardStyle,
    minWidth: 0,
  }

  const axisProps = {
    stroke: '#728691',
    tick: { fill: '#93a4ae', fontSize: 10 },
    tickLine: false,
    axisLine: false,
  }

  return (
    <div className="app-shell">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        notify={notify}
        activePage="reports"
        onNavigate={onNavigate}
      />

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-label">NETPULSE / TOOLS</div>
            <h2>Reports & Export</h2>
          </div>

          <button style={buttonStyle} onClick={refreshHistory}>
            <RefreshCw size={15} />
            Refresh data
          </button>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <h1>Network Performance Reports</h1>
              <p>
                Analyze your network performance and export your test results.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button style={buttonStyle} onClick={exportCSV}>
                <ArrowDownToLine size={15} />
                Export CSV
              </button>

              <button
                style={{
                  ...buttonStyle,
                  background: '#22c55e',
                  color: '#07140c',
                  borderColor: '#22c55e',
                }}
                onClick={generateReport}
              >
                <FileText size={15} />
                Generate report
              </button>
            </div>
          </div>

          <section style={{ ...cardStyle, marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  Report overview
                </h3>
                <p style={{ color: '#93a4ae', fontSize: 12 }}>
                  Summary based on your saved speed test records
                </p>
              </div>

              <div
                style={{
                  background: '#172d24',
                  color: '#4ade80',
                  padding: '9px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {history.length} recorded tests
              </div>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 12px',
                  background: '#17232b',
                  borderRadius: 9,
                  color: '#93a4ae',
                  marginTop: 15,
                }}
              >
                <AlertCircle size={28} />
                <p style={{ color: '#e7edf1', fontWeight: 600 }}>
                  No report data available yet
                </p>
                <p style={{ fontSize: 12 }}>
                  Run a speed test from your Overview dashboard to start
                  building your reports.
                </p>

                <button
                  style={buttonStyle}
                  onClick={() => onNavigate('overview')}
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 14,
                  marginTop: 18,
                }}
              >
                {metricCards.map(metric => {
                  const Icon = metric.icon

                  return (
                    <div
                      key={metric.title}
                      style={{
                        background: '#17232b',
                        border: '1px solid #26343d',
                        borderRadius: 10,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          color: '#93a4ae',
                          fontSize: 12,
                        }}
                      >
                        <Icon size={16} color="#4ade80" />
                        {metric.title}
                      </div>

                      <h2
                        style={{
                          fontSize: 25,
                          margin: '15px 0 5px',
                          color: '#e7edf1',
                        }}
                      >
                        {metric.value}
                      </h2>

                      <small style={{ color: '#728691' }}>
                        {metric.description}
                      </small>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <>
              <section style={{ ...cardStyle, marginBottom: 22 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 15,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>
                      Network Performance Trends
                    </h3>
                    <p style={{ color: '#93a4ae', fontSize: 12 }}>
                      Visualize how your internet connection performs over time
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 7 }}>
                    {([
                      ['1h', '1 Hour'],
                      ['24h', '24 Hours'],
                      ['7d', '7 Days'],
                    ] as [TimeRange, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setTimeRange(value)}
                        style={{
                          ...buttonStyle,
                          padding: '8px 11px',
                          background:
                            timeRange === value ? '#22c55e' : '#17232b',
                          color:
                            timeRange === value ? '#07140c' : '#e7edf1',
                          borderColor:
                            timeRange === value ? '#22c55e' : '#34434d',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    color: '#93a4ae',
                    fontSize: 11,
                    marginBottom: 18,
                  }}
                >
                  Showing {filteredHistory.length} saved tests in the selected
                  period
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  <div style={chartCardStyle}>
                    <h4 style={{ margin: '0 0 5px', fontSize: 13 }}>
                      Latency Trend
                    </h4>
                    <p style={{ color: '#93a4ae', fontSize: 11 }}>
                      Response time in milliseconds
                    </p>

                    {filteredHistory.some(item => item.latency !== null) ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={filteredHistory}>
                          <defs>
                            <linearGradient
                              id="latencyGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#26343d" strokeDasharray="3 3" />
                          <XAxis dataKey="time" {...axisProps} />
                          <YAxis {...axisProps} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Area
                            type="monotone"
                            dataKey="latency"
                            name="Latency"
                            stroke="#4ade80"
                            fill="url(#latencyGradient)"
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : renderEmptyChart()}
                  </div>

                  <div style={chartCardStyle}>
                    <h4 style={{ margin: '0 0 5px', fontSize: 13 }}>
                      Download & Upload
                    </h4>
                    <p style={{ color: '#93a4ae', fontSize: 11 }}>
                      Internet speed in Mbps
                    </p>

                    {filteredHistory.some(
                      item =>
                        item.downloadSpeed !== null ||
                        item.uploadSpeed !== null,
                    ) ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={filteredHistory}>
                          <CartesianGrid stroke="#26343d" strokeDasharray="3 3" />
                          <XAxis dataKey="time" {...axisProps} />
                          <YAxis {...axisProps} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="downloadSpeed"
                            name="Download"
                            stroke="#4ade80"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="uploadSpeed"
                            name="Upload"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : renderEmptyChart()}
                    <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                      <span style={{ color: '#4ade80' }}>● Download</span>
                      <span style={{ color: '#38bdf8' }}>● Upload</span>
                    </div>
                  </div>

                  <div style={chartCardStyle}>
                    <h4 style={{ margin: '0 0 5px', fontSize: 13 }}>
                      Jitter Trend
                    </h4>
                    <p style={{ color: '#93a4ae', fontSize: 11 }}>
                      Latency variation in milliseconds
                    </p>

                    {filteredHistory.some(item => item.jitter !== null) ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={filteredHistory}>
                          <CartesianGrid stroke="#26343d" strokeDasharray="3 3" />
                          <XAxis dataKey="time" {...axisProps} />
                          <YAxis {...axisProps} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="jitter"
                            name="Jitter"
                            stroke="#facc15"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : renderEmptyChart()}
                  </div>

                  <div style={chartCardStyle}>
                    <h4 style={{ margin: '0 0 5px', fontSize: 13 }}>
                      Network Quality Trend
                    </h4>
                    <p style={{ color: '#93a4ae', fontSize: 11 }}>
                      Overall network score out of 100
                    </p>

                    {filteredHistory.some(item => item.qualityScore !== null) ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={filteredHistory}>
                          <defs>
                            <linearGradient
                              id="qualityGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#26343d" strokeDasharray="3 3" />
                          <XAxis dataKey="time" {...axisProps} />
                          <YAxis domain={[0, 100]} {...axisProps} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Area
                            type="monotone"
                            dataKey="qualityScore"
                            name="Quality Score"
                            stroke="#38bdf8"
                            fill="url(#qualityGradient)"
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : renderEmptyChart()}
                  </div>
                </div>
              </section>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 15,
                  marginBottom: 22,
                }}
              >
                <div style={cardStyle}>
                  <div style={{ color: '#93a4ae', fontSize: 12 }}>
                    <TrendingUp size={16} style={{ verticalAlign: 'middle' }} />{' '}
                    Best Download Speed
                  </div>
                  <h2 style={{ fontSize: 27, margin: '12px 0 5px' }}>
                    {formatNumber(stats.bestDownload, ' Mbps')}
                  </h2>
                  <small style={{ color: '#728691' }}>
                    Highest recorded download result
                  </small>
                </div>

                <div style={cardStyle}>
                  <div style={{ color: '#93a4ae', fontSize: 12 }}>
                    <Gauge size={16} style={{ verticalAlign: 'middle' }} />{' '}
                    Best Latency
                  </div>
                  <h2 style={{ fontSize: 27, margin: '12px 0 5px' }}>
                    {formatNumber(stats.bestLatency, ' ms')}
                  </h2>
                  <small style={{ color: '#728691' }}>
                    Lowest recorded response time
                  </small>
                </div>

                <div style={cardStyle}>
                  <div style={{ color: '#93a4ae', fontSize: 12 }}>
                    <Activity size={16} style={{ verticalAlign: 'middle' }} />{' '}
                    Worst Latency
                  </div>
                  <h2 style={{ fontSize: 27, margin: '12px 0 5px' }}>
                    {formatNumber(stats.worstLatency, ' ms')}
                  </h2>
                  <small style={{ color: '#728691' }}>
                    Highest recorded response time
                  </small>
                </div>
              </div>

              <section style={cardStyle}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 15,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>
                      Recent report records
                    </h3>
                    <p style={{ color: '#93a4ae', fontSize: 12 }}>
                      Latest saved performance tests
                    </p>
                  </div>

                  <button style={buttonStyle} onClick={() => window.print()}>
                    <Printer size={15} />
                    Print report
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: 650,
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ color: '#93a4ae', textAlign: 'left' }}>
                        {[
                          'Date',
                          'Latency',
                          'Download',
                          'Upload',
                          'Quality',
                        ].map(label => (
                          <th
                            key={label}
                            style={{
                              padding: '12px 10px',
                              borderBottom: '1px solid #26343d',
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {history.slice(0, 10).map(item => (
                        <tr key={item.id}>
                          <td style={tableCellStyle}>
                            {new Date(item.testedAt).toLocaleString()}
                          </td>
                          <td style={tableCellStyle}>
                            {formatNumber(item.latency, ' ms')}
                          </td>
                          <td style={tableCellStyle}>
                            {formatNumber(item.downloadSpeed, ' Mbps')}
                          </td>
                          <td style={tableCellStyle}>
                            {formatNumber(item.uploadSpeed, ' Mbps')}
                          </td>
                          <td style={tableCellStyle}>
                            {item.qualityScore === null
                              ? '—'
                              : `${item.qualityScore}/100`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <p
            style={{
              color: '#728691',
              fontSize: 11,
              marginTop: 18,
              lineHeight: 1.6,
            }}
          >
            <AlertCircle size={12} style={{ verticalAlign: 'middle' }} />{' '}
            Reports use locally saved speed test history. Failed request rate
            represents failed HTTP probes, not direct ICMP packet loss.
          </p>
        </div>
      </main>

      {notification && (
        <div
          style={{
            position: 'fixed',
            right: 22,
            bottom: 22,
            zIndex: 1000,
            background: '#173d2b',
            color: '#e7edf1',
            padding: '13px 18px',
            borderRadius: 9,
            border: '1px solid #286341',
            fontSize: 13,
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          }}
        >
          {notification}
        </div>
      )}
    </div>
  )
}

const tableCellStyle: CSSProperties = {
  padding: '13px 10px',
  borderBottom: '1px solid #26343d',
  color: '#d1dce2',
  whiteSpace: 'nowrap',
}

export default Reports
