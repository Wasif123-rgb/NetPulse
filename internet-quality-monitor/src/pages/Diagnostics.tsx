
import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Gauge,
  Play,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import type { Page } from '../App'
import { testInternet, testSpeed } from '../utils/networkTest'

interface DiagnosticsProps {
  onNavigate: (page: Page) => void
}

interface DiagnosticResult {
  online: boolean
  averageLatency: number | null
  jitter: number | null
  packetLoss: number
  downloadSpeed: number | null
  uploadSpeed: number | null
  completedAt: string
}

function Diagnostics({ onNavigate }: DiagnosticsProps) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [error, setError] = useState('')

  const runDiagnostics = async () => {
    if (loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const samples: number[] = []
      let failedProbes = 0

      // Run five connection probes.
      for (let i = 0; i < 5; i++) {
        const response = await testInternet()

        if (response.status === 'Online' && response.latency !== null) {
          samples.push(response.latency)
        } else {
          failedProbes++
        }
      }

      const averageLatency =
        samples.length > 0
          ? Math.round(
              samples.reduce((total, value) => total + value, 0) /
                samples.length,
            )
          : null

      const differences: number[] = []

      for (let i = 1; i < samples.length; i++) {
        differences.push(Math.abs(samples[i] - samples[i - 1]))
      }

      const jitter =
        differences.length > 0
          ? Math.round(
              differences.reduce((total, value) => total + value, 0) /
                differences.length,
            )
          : null

      const packetLoss = Math.round((failedProbes / 5) * 100)

      let downloadSpeed: number | null = null
      let uploadSpeed: number | null = null

      // Run the existing speed test if at least one probe succeeded.
      if (samples.length > 0) {
        const speed = await testSpeed()
        downloadSpeed = speed.downloadMbps
        uploadSpeed = speed.uploadMbps
      }

      setResult({
        online: samples.length > 0,
        averageLatency,
        jitter,
        packetLoss,
        downloadSpeed,
        uploadSpeed,
        completedAt: new Date().toLocaleString(),
      })
    } catch {
      setError(
        'The diagnostic test could not be completed. Please check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const getLatencyStatus = (latency: number | null) => {
    if (latency === null) return 'Unavailable'
    if (latency <= 50) return 'Good'
    if (latency <= 100) return 'Fair'
    return 'High'
  }

  const getJitterStatus = (jitter: number | null) => {
    if (jitter === null) return 'Unavailable'
    if (jitter <= 10) return 'Good'
    if (jitter <= 20) return 'Fair'
    return 'High'
  }

  const getPacketLossStatus = (loss: number) => {
    if (loss === 0) return 'Good'
    if (loss <= 20) return 'Fair'
    return 'High'
  }

  const cardStyle: React.CSSProperties = {
    background: '#111a22',
    border: '1px solid #26343d',
    borderRadius: '12px',
    padding: '22px',
  }

  const resultItems = result
    ? [
        {
          label: 'Internet Connection',
          value: result.online ? 'Connected' : 'Unavailable',
          good: result.online,
        },
        {
          label: 'Average Latency',
          value:
            result.averageLatency !== null
              ? `${result.averageLatency} ms`
              : 'Unavailable',
          good:
            result.averageLatency !== null && result.averageLatency <= 100,
        },
        {
          label: 'Jitter Estimate',
          value: result.jitter !== null ? `${result.jitter} ms` : 'Unavailable',
          good: result.jitter !== null && result.jitter <= 20,
        },
        {
          label: 'Failed Probe Rate',
          value: `${result.packetLoss}%`,
          good: result.packetLoss === 0,
        },
        {
          label: 'Download Speed',
          value:
            result.downloadSpeed !== null
              ? `${result.downloadSpeed} Mbps`
              : 'Unavailable',
          good: result.downloadSpeed !== null,
        },
        {
          label: 'Upload Speed',
          value:
            result.uploadSpeed !== null
              ? `${result.uploadSpeed} Mbps`
              : 'Unavailable',
          good: result.uploadSpeed !== null,
        },
      ]
    : []

  return (
    <div className="app-shell">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        notify={() => {}}
        activePage="diagnostics"
        onNavigate={onNavigate}
      />

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Activity size={20} />
          </button>

          <div>
            <span className="nav-label">TOOLS / DIAGNOSTICS</span>
          </div>

          <span style={{ color: '#93a4ae', fontSize: '12px' }}>
            Manual testing
          </span>
        </header>

        <section className="content">
          <div className="welcome-row">
            <div>
              <h1>Network Diagnostics</h1>
              <p>Run tests to check your internet connection health.</p>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '22px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '55px',
                height: '55px',
                borderRadius: '12px',
                background: 'rgba(34,197,94,0.12)',
                color: '#4ade80',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Gauge size={28} />
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <h3 style={{ margin: 0 }}>Full Connection Check</h3>
              <p style={{ color: '#93a4ae', marginBottom: 0, lineHeight: 1.6 }}>
                Five connection probes, latency, jitter estimate, failed-probe
                rate and speed test.
              </p>
            </div>

            <button
              onClick={runDiagnostics}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                padding: '12px 18px',
                border: 0,
                borderRadius: '8px',
                background: loading ? '#315a43' : '#22c55e',
                color: '#07130c',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <RefreshCw size={17} />
              ) : (
                <Play size={17} />
              )}
              {loading ? 'Testing...' : 'Run Full Diagnostics'}
            </button>
          </div>

          {loading && (
            <div style={{ ...cardStyle, marginBottom: '22px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Activity size={19} color="#4ade80" />
                <b>Running network tests...</b>
              </div>
              <p style={{ color: '#93a4ae', marginBottom: 0 }}>
                Please wait while NetPulse checks your connection and speed.
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                ...cardStyle,
                borderColor: '#ef4444',
                color: '#fca5a5',
                marginBottom: '22px',
              }}
            >
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div
              style={{
                ...cardStyle,
                textAlign: 'center',
                padding: '45px 20px',
                marginBottom: '22px',
              }}
            >
              <ShieldCheck
                size={42}
                color="#4ade80"
                style={{ marginBottom: 12 }}
              />
              <h3>Ready to diagnose your network?</h3>
              <p style={{ color: '#93a4ae', marginBottom: 0 }}>
                Click Run Full Diagnostics to start your first test.
              </p>
            </div>
          )}

          {result && (
            <>
              <div
                style={{
                  ...cardStyle,
                  marginBottom: '22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                {result.online ? (
                  <CheckCircle2 size={28} color="#4ade80" />
                ) : (
                  <WifiOff size={28} color="#f87171" />
                )}

                <div>
                  <h3 style={{ margin: 0 }}>
                    {result.online
                      ? 'Connection test completed'
                      : 'Connection unavailable'}
                  </h3>
                  <p
                    style={{
                      color: '#93a4ae',
                      margin: '6px 0 0',
                      fontSize: '12px',
                    }}
                  >
                    Completed at {result.completedAt}
                  </p>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">
                    <Wifi size={17} />
                    Average Latency
                  </div>
                  <div className="metric-value">
                    {result.averageLatency !== null
                      ? `${result.averageLatency} ms`
                      : '--'}
                  </div>
                  <small>{getLatencyStatus(result.averageLatency)}</small>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    <Activity size={17} />
                    Jitter Estimate
                  </div>
                  <div className="metric-value">
                    {result.jitter !== null ? `${result.jitter} ms` : '--'}
                  </div>
                  <small>{getJitterStatus(result.jitter)}</small>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    <WifiOff size={17} />
                    Failed Probe Rate
                  </div>
                  <div className="metric-value">{result.packetLoss}%</div>
                  <small>{getPacketLossStatus(result.packetLoss)}</small>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    <Zap size={17} />
                    Download Speed
                  </div>
                  <div className="metric-value">
                    {result.downloadSpeed !== null
                      ? `${result.downloadSpeed} Mbps`
                      : '--'}
                  </div>
                  <small>Speed test result</small>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    <Zap size={17} />
                    Upload Speed
                  </div>
                  <div className="metric-value">
                    {result.uploadSpeed !== null
                      ? `${result.uploadSpeed} Mbps`
                      : '--'}
                  </div>
                  <small>Speed test result</small>
                </div>
              </div>

              <div style={{ ...cardStyle, marginTop: '22px' }}>
                <h3 style={{ marginTop: 0 }}>Diagnostic Report</h3>

                <div style={{ display: 'grid', gap: '16px', marginTop: 20 }}>
                  {resultItems.map(item => (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: '1px solid #26343d',
                        paddingBottom: 13,
                      }}
                    >
                      <span style={{ color: '#cbd5dc' }}>{item.label}</span>

                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          color: item.good ? '#4ade80' : '#fbbf24',
                          fontWeight: 600,
                        }}
                      >
                        {item.value}
                        {item.good ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Activity size={16} />
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    color: '#93a4ae',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    marginBottom: 0,
                    marginTop: 18,
                  }}
                >
                  Note: The failed probe rate is based on five HTTP connection
                  checks. Jitter is estimated from differences between
                  consecutive successful latency readings. These are browser
                  measurements, not standardized ICMP packet-loss or jitter
                  tests.
                </p>
              </div>

              <button
                onClick={runDiagnostics}
                disabled={loading}
                style={{
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '11px 16px',
                  border: '1px solid #34434d',
                  borderRadius: 8,
                  background: '#17232b',
                  color: '#e7edf1',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                Run Again
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default Diagnostics
