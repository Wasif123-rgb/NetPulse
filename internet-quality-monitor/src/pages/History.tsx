import { useEffect, useState } from 'react'
import {
  Activity,
  Clock3,
  Download,
  Gauge,
  Trash2,
  Upload,
  Wifi,
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import type { Page } from '../App'
import type { TestHistoryItem } from './Dashboard'

interface HistoryProps {
  onNavigate: (page: Page) => void
}

const HISTORY_KEY = 'netpulse_test_history'

function History({ onNavigate }: HistoryProps) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [records, setRecords] = useState<TestHistoryItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)

      if (stored) {
        setRecords(JSON.parse(stored))
      }
    } catch {
      setRecords([])
    }
  }, [])

  const notify = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setRecords([])
    notify('Test history cleared')
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const averageLatency = records.length
    ? Math.round(
        records.reduce((total, item) => total + (item.latency ?? 0), 0) /
          records.filter(item => item.latency !== null).length || 0,
      )
    : 0

  const bestDownload = records.reduce(
    (best, item) => Math.max(best, item.downloadSpeed ?? 0),
    0,
  )

  return (
    <div className="app-shell">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        notify={notify}
        activePage="history"
        onNavigate={onNavigate}
      />

      <main className="main-area">
        <Topbar
          lastCheck={records.length ? formatDate(records[0].testedAt) : 'No tests yet'}
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
          notify={notify}
        />

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">NETWORK MONITORING</div>
              <h1>Network Test History</h1>
              <p>Review your previous internet performance tests.</p>
            </div>

            <button
              className="subtle-btn"
              onClick={clearHistory}
              disabled={!records.length}
            >
              <Trash2 size={15} />
              Clear history
            </button>
          </section>

          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-top">
                <span>Total Tests</span>
                <div className="metric-icon mint"><Activity size={18} /></div>
              </div>
              <div className="metric-value">{records.length}</div>
              <div className="metric-foot">Saved speed tests</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span>Average Latency</span>
                <div className="metric-icon blue"><Wifi size={18} /></div>
              </div>
              <div className="metric-value">
                {records.some(item => item.latency !== null) ? averageLatency : '--'}
                <small> ms</small>
              </div>
              <div className="metric-foot">Across saved tests</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span>Best Download</span>
                <div className="metric-icon purple"><Download size={18} /></div>
              </div>
              <div className="metric-value">
                {bestDownload || '--'}
                <small> Mbps</small>
              </div>
              <div className="metric-foot">Highest recorded speed</div>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span>Latest Score</span>
                <div className="metric-icon orange"><Gauge size={18} /></div>
              </div>
              <div className="metric-value">
                {records[0]?.qualityScore ?? '--'}
                <small>{records[0]?.qualityScore !== null && records[0]?.qualityScore !== undefined ? '/100' : ''}</small>
              </div>
              <div className="metric-foot">Latest network quality</div>
            </div>
          </section>

          <section className="servers-card" style={{ marginTop: '24px' }}>
            <div className="section-head">
              <div>
                <h2>Test Records</h2>
                <p>Your saved speed test results</p>
              </div>

              <span>{records.length} records</span>
            </div>

            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '55px 20px' }}>
                <Clock3 size={38} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <h2>No test history yet</h2>
                <p>Run a speed test from your dashboard to save your first record.</p>
                <button
                  className="monitor-btn"
                  style={{ margin: '18px auto 0' }}
                  onClick={() => onNavigate('overview')}
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '760px',
                  textAlign: 'left',
                }}>
                  <thead>
                    <tr>
                      {[
                        'DATE & TIME',
                        'LATENCY',
                        'JITTER',
                        'PACKET LOSS',
                        'DOWNLOAD',
                        'UPLOAD',
                        'QUALITY',
                      ].map(label => (
                        <th
                          key={label}
                          style={{
                            padding: '16px 12px',
                            fontSize: '11px',
                            color: '#8c9aa5',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {records.map(record => (
                      <tr key={record.id}>
                        <td style={cellStyle}>{formatDate(record.testedAt)}</td>
                        <td style={cellStyle}>{record.latency !== null ? `${record.latency} ms` : '--'}</td>
                        <td style={cellStyle}>{record.jitter !== null ? `${record.jitter} ms` : '--'}</td>
                        <td style={cellStyle}>{record.packetLoss !== null ? `${record.packetLoss}%` : '--'}</td>
                        <td style={cellStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Download size={13} />
                            {record.downloadSpeed !== null ? `${record.downloadSpeed} Mbps` : '--'}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={13} />
                            {record.uploadSpeed !== null ? `${record.uploadSpeed} Mbps` : '--'}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span style={{
                            fontWeight: 700,
                            color:
                              record.qualityScore === null
                                ? '#8c9aa5'
                                : record.qualityScore >= 75
                                  ? '#50d9ad'
                                  : record.qualityScore >= 60
                                    ? '#e5a64b'
                                    : '#d97878',
                          }}>
                            {record.qualityScore !== null
                              ? `${record.qualityScore}/100`
                              : '--'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer>
            <Activity size={13} />
            NetPulse Network Monitor
            <span className="footer-right">Test history</span>
          </footer>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '17px 12px',
  fontSize: '13px',
  color: '#d5dee4',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  whiteSpace: 'nowrap',
}

export default History