
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  Download,
  Globe2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Upload,
  Wifi,
  WifiOff,
  Zap,
  Gauge,
} from 'lucide-react'

import MetricCard from '../components/MetricCard'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import LatencyChart, { type Point } from '../components/LatencyChart'
import NetworkAlerts from '../components/NetworkAlerts'
import { testInternet, testSpeed } from '../utils/networkTest'
import type { Page } from '../App'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export interface TestHistoryItem {
  id: string
  testedAt: string
  latency: number | null
  jitter: number | null
  packetLoss: number | null
  downloadSpeed: number | null
  uploadSpeed: number | null
  qualityScore: number | null
}

const HISTORY_KEY = 'netpulse_test_history'

function calculateQualityScore(
  latency: number | null,
  jitter: number | null,
  packetLoss: number | null,
  downloadSpeed: number | null,
  uploadSpeed: number | null,
) {
  if (
    latency === null ||
    jitter === null ||
    packetLoss === null ||
    downloadSpeed === null ||
    uploadSpeed === null
  ) {
    return null
  }

  const latencyScore =
    latency <= 20 ? 100 :
    latency <= 50 ? 85 :
    latency <= 100 ? 65 :
    latency <= 150 ? 40 : 20

  const jitterScore =
    jitter <= 5 ? 100 :
    jitter <= 10 ? 85 :
    jitter <= 20 ? 65 :
    jitter <= 30 ? 45 : 20

  const packetLossScore =
    packetLoss <= 0 ? 100 :
    packetLoss <= 1 ? 85 :
    packetLoss <= 2 ? 65 :
    packetLoss <= 5 ? 40 : 10

  const downloadScore =
    downloadSpeed >= 100 ? 100 :
    downloadSpeed >= 50 ? 85 :
    downloadSpeed >= 25 ? 70 :
    downloadSpeed >= 10 ? 50 : 25

  const uploadScore =
    uploadSpeed >= 100 ? 100 :
    uploadSpeed >= 50 ? 85 :
    uploadSpeed >= 25 ? 70 :
    uploadSpeed >= 10 ? 50 : 25

  return Math.round(
    latencyScore * 0.30 +
    jitterScore * 0.20 +
    packetLossScore * 0.20 +
    downloadScore * 0.15 +
    uploadScore * 0.15,
  )
}

function Dashboard({ onNavigate }: DashboardProps) {
  const [running, setRunning] = useState(true)
  const [latency, setLatency] = useState<number | null>(null)
  const [packetLoss, setPacketLoss] = useState<number | null>(null)
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null)
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null)
  const [jitter, setJitter] = useState<number | null>(null)

  const previousLatency = useRef<number | null>(null)

  const [status, setStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking')
  const [points, setPoints] = useState<Point[]>([])
  const [mobileMenu, setMobileMenu] = useState(false)
  const [lastCheck, setLastCheck] = useState('Checking...')
  const [selectedRange, setSelectedRange] = useState('24 hours')
  const [toast, setToast] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSpeedTesting, setIsSpeedTesting] = useState(false)

  const average = useMemo(() => {
    if (!points.length) return 0

    return Math.round(
      points.reduce((total, point) => total + point.latency, 0) /
        points.length,
    )
  }, [points])

  const qualityScore = useMemo(
    () =>
      calculateQualityScore(
        latency,
        jitter,
        packetLoss,
        downloadSpeed,
        uploadSpeed,
      ),
    [latency, jitter, packetLoss, downloadSpeed, uploadSpeed],
  )

  const qualityLabel =
    qualityScore === null
      ? 'Not tested'
      : qualityScore >= 90
        ? 'Excellent'
        : qualityScore >= 75
          ? 'Good'
          : qualityScore >= 60
            ? 'Fair'
            : 'Poor'

  const qualityTone =
    qualityScore === null
      ? 'blue'
      : qualityScore >= 75
        ? 'mint'
        : qualityScore >= 60
          ? 'orange'
          : 'purple'

  const notify = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const recordResult = (result: Awaited<ReturnType<typeof testInternet>>) => {
    setStatus(result.status)
    setLatency(result.latency)
    setPacketLoss(result.packetLoss)

    if (result.status === 'Online' && result.latency !== null) {
      if (previousLatency.current !== null) {
        const difference = Math.abs(
          result.latency - previousLatency.current,
        )

        setJitter(Math.round(difference * 100) / 100)
      }

      previousLatency.current = result.latency
    } else {
      previousLatency.current = null
      setJitter(null)
    }

    setLastCheck(
      new Date(result.testedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    )

    if (result.status === 'Online' && result.latency !== null) {
      const point: Point = {
        time: new Date(result.testedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        latency: result.latency,
      }

      setPoints(previous => [...previous.slice(-23), point])
    }
  }

  useEffect(() => {
    if (!running) return

    let active = true
    let testing = false

    const runTest = async () => {
      if (!active || testing) return

      testing = true

      try {
        const result = await testInternet()
        if (active) recordResult(result)
      } catch {
        if (active) {
          setStatus('Offline')
          setLatency(null)
          setPacketLoss(100)
          previousLatency.current = null
          setJitter(null)
        }
      } finally {
        testing = false
      }
    }

    runTest()

    const interval = setInterval(runTest, 4000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [running])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    try {
      const result = await testInternet()
      recordResult(result)

      notify(
        result.status === 'Online'
          ? `Test completed: ${result.latency} ms | Packet loss: ${result.packetLoss}%`
          : 'Internet connection could not be reached',
      )
    } catch {
      setStatus('Offline')
      setLatency(null)
      setPacketLoss(100)
      previousLatency.current = null
      setJitter(null)
      notify('Network test failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSpeedTest = async () => {
    if (isSpeedTesting) return

    setIsSpeedTesting(true)
    notify('Speed test started. Please wait...')

    try {
      const result = await testSpeed()

      setDownloadSpeed(result.downloadMbps)
      setUploadSpeed(result.uploadMbps)

      if (result.downloadMbps !== null || result.uploadMbps !== null) {
        const savedLatency = latency
        const savedJitter = jitter
        const savedPacketLoss = packetLoss

        const score = calculateQualityScore(
          savedLatency,
          savedJitter,
          savedPacketLoss,
          result.downloadMbps,
          result.uploadMbps,
        )

        const newRecord: TestHistoryItem = {
          id: `${Date.now()}`,
          testedAt: new Date().toISOString(),
          latency: savedLatency,
          jitter: savedJitter,
          packetLoss: savedPacketLoss,
          downloadSpeed: result.downloadMbps,
          uploadSpeed: result.uploadMbps,
          qualityScore: score,
        }

        let historySaved = true

        try {
          const stored = localStorage.getItem(HISTORY_KEY)
          const existing: TestHistoryItem[] = stored
            ? JSON.parse(stored)
            : []

          const updated = [newRecord, ...existing].slice(0, 100)

          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        } catch {
          historySaved = false
        }

        notify(
          historySaved
            ? `Speed test completed! Download: ${result.downloadMbps ?? '--'} Mbps | Upload: ${result.uploadMbps ?? '--'} Mbps`
            : 'Speed test completed, but history could not be saved.',
        )
      } else {
        notify('Speed test failed. Please check your connection and try again.')
      }
    } catch {
      notify('Speed test failed. Please try again.')
    } finally {
      setIsSpeedTesting(false)
    }
  }

  const isOnline = status === 'Online'

  return (
    <div className="app-shell">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        notify={notify}
        activePage="overview"
        onNavigate={onNavigate}
      />

      <main className="main-area">
        <Topbar
          lastCheck={lastCheck}
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
          notify={notify}
        />

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">NETWORK MONITORING</div>
              <h1>Good afternoon 👋</h1>
              <p>Here's what's happening with your internet connection today.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="subtle-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
                {isRefreshing ? 'Testing...' : 'Refresh'}
              </button>

              <button
                className={`monitor-btn ${running ? '' : 'stop'}`}
                onClick={() => setRunning(value => !value)}
              >
                {running ? <Pause size={15} /> : <Play size={15} />}
                {running ? 'Pause monitoring' : 'Resume monitoring'}
              </button>
            </div>
          </section>

          <section className="connection-banner">
            <div className="connection-left">
              <div className="pulse-icon">
                {status === 'Offline' ? <WifiOff size={20} /> : <Wifi size={20} />}
                <span />
              </div>

              <div>
                <div className="connection-title">
                  <span className={`online-dot ${status === 'Offline' ? 'offline' : ''}`} />
                  {status === 'Online'
                    ? 'Your connection is healthy'
                    : status === 'Offline'
                      ? 'Internet connection unavailable'
                      : 'Checking your connection...'}
                </div>

                <p>
                  {status === 'Online'
                    ? 'Internet connectivity confirmed'
                    : status === 'Offline'
                      ? 'Unable to reach the test server'
                      : 'Running your network test'}
                </p>
              </div>
            </div>

            <div className="connection-right">
              <div>
                <small>LATENCY</small>
                <b>
                  <Zap size={14} />
                  {latency !== null ? `${latency} ms` : '--'}
                </b>
              </div>

              <div className="banner-divider" />

              <div>
                <small>STATUS</small>
                <b>
                  <span className={`status-dot ${running ? 'live' : 'paused'}`} />
                  {status}
                </b>
              </div>
            </div>
          </section>

          <NetworkAlerts
            status={status}
            latency={latency}
            jitter={jitter}
            packetLoss={packetLoss}
          />

          <section className="metrics-grid">
            <MetricCard title="Current Latency" value={latency !== null ? `${latency}` : '--'} unit="ms" note="Request response time" icon={Activity} trend={status} tone="mint" />
            <MetricCard title="Average Latency" value={points.length ? `${average}` : '--'} unit="ms" note="Successful test average" icon={Zap} trend={`${points.length} samples`} tone="blue" />
            <MetricCard title="Packet Loss" value={packetLoss !== null ? `${packetLoss}` : '--'} unit="%" note="Failed requests" icon={Globe2} trend={packetLoss !== null ? `${packetLoss}% loss` : 'Waiting'} tone="purple" />
            <MetricCard title="Download Speed" value={downloadSpeed !== null ? `${downloadSpeed}` : '--'} unit="Mbps" note="Download bandwidth" icon={Download} trend={downloadSpeed !== null ? 'Measured' : 'Not tested'} tone="blue" />
            <MetricCard title="Upload Speed" value={uploadSpeed !== null ? `${uploadSpeed}` : '--'} unit="Mbps" note="Upload bandwidth" icon={Upload} trend={uploadSpeed !== null ? 'Measured' : 'Not tested'} tone="orange" />
            <MetricCard title="Jitter" value={jitter !== null ? `${jitter}` : '--'} unit="ms" note="Latency variation" icon={Activity} trend={jitter !== null ? 'Measured' : 'Collecting'} tone="purple" />
            <MetricCard title="Network Quality" value={qualityScore !== null ? `${qualityScore}` : '--'} unit="/100" note={qualityLabel} icon={Gauge} trend={qualityLabel} tone={qualityTone} />
            <MetricCard title="Monitoring" value={running ? 'Active' : 'Paused'} unit="" note="Automatic testing" icon={ShieldCheck} trend={running ? 'Running' : 'Stopped'} tone="mint" />
          </section>

          <LatencyChart
            points={points}
            latency={latency ?? 0}
            average={average}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
          />

          <section className="bottom-grid">
            <div className="servers-card">
              <div className="section-head">
                <div>
                  <h2>Connection Details</h2>
                  <p>Your current network information</p>
                </div>

                <button className="subtle-btn" onClick={handleRefresh}>
                  <RefreshCw size={13} />
                  Test
                </button>
              </div>

              <div className="server-row">
                <div className="server-icon"><Wifi size={16} /></div>
                <div className="server-info">
                  <b>Internet Connection</b>
                  <small>Connectivity test</small>
                </div>
                <div className="server-latency">
                  <b>{latency !== null ? `${latency} ms` : '--'}</b>
                  <small>Response time</small>
                </div>
                <div className="server-online"><i />{status}</div>
              </div>

              <div className="server-row">
                <div className="server-icon google"><Globe2 size={16} /></div>
                <div className="server-info">
                  <b>Monitoring Status</b>
                  <small>Automatic network monitoring</small>
                </div>
                <div className="server-latency">
                  <b>{running ? 'Active' : 'Paused'}</b>
                  <small>4 second interval</small>
                </div>
                <div className="server-online"><i />{running ? 'Running' : 'Paused'}</div>
              </div>

              <div className="server-row">
                <div className="server-icon cloud"><Activity size={16} /></div>
                <div className="server-info">
                  <b>Latency History</b>
                  <small>Current monitoring session</small>
                </div>
                <div className="server-latency">
                  <b>{points.length}</b>
                  <small>Samples</small>
                </div>
                <div className="server-online"><i />Tracking</div>
              </div>

              <div className="server-row">
                <div className="server-icon cloud"><Activity size={16} /></div>
                <div className="server-info">
                  <b>Jitter</b>
                  <small>Latency variation</small>
                </div>
                <div className="server-latency">
                  <b>{jitter !== null ? `${jitter} ms` : '--'}</b>
                  <small>Current jitter</small>
                </div>
                <div className="server-online"><i />{jitter !== null ? 'Tracking' : 'Waiting'}</div>
              </div>

              <div className="server-row">
                <div className="server-icon google"><Gauge size={16} /></div>
                <div className="server-info">
                  <b>Network Quality</b>
                  <small>Overall connection score</small>
                </div>
                <div className="server-latency">
                  <b>{qualityScore !== null ? `${qualityScore}/100` : '--'}</b>
                  <small>{qualityLabel}</small>
                </div>
                <div className="server-online"><i />{qualityScore !== null ? 'Calculated' : 'Waiting'}</div>
              </div>
            </div>

            <div className="servers-card">
              <div className="section-head">
                <div>
                  <h2>Speed Test</h2>
                  <p>Measure your download and upload speeds</p>
                </div>
              </div>

              <div style={{ padding: '12px 0' }}>
                <div className="server-row">
                  <div className="server-icon google"><Download size={16} /></div>
                  <div className="server-info">
                    <b>Download</b>
                    <small>Receiving data</small>
                  </div>
                  <div className="server-latency">
                    <b>{downloadSpeed !== null ? `${downloadSpeed} Mbps` : '--'}</b>
                    <small>Download speed</small>
                  </div>
                </div>

                <div className="server-row">
                  <div className="server-icon cloud"><Upload size={16} /></div>
                  <div className="server-info">
                    <b>Upload</b>
                    <small>Sending data</small>
                  </div>
                  <div className="server-latency">
                    <b>{uploadSpeed !== null ? `${uploadSpeed} Mbps` : '--'}</b>
                    <small>Upload speed</small>
                  </div>
                </div>
              </div>

              <button
                className="monitor-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSpeedTest}
                disabled={isSpeedTesting}
              >
                {isSpeedTesting ? <RefreshCw size={15} className="spin" /> : <Zap size={15} />}
                {isSpeedTesting ? 'Testing speed...' : 'Run Speed Test'}
              </button>
            </div>

            <div className="activity-card">
              <div className="section-head">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Your latest network events</p>
                </div>

                <button className="subtle-btn" onClick={() => onNavigate('history')}>
                  View history
                </button>
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <div className={`activity-symbol ${isOnline ? 'green' : 'orange'}`}>
                    {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
                  </div>
                  <div>
                    <b>{isOnline ? 'Connection active' : 'Connection check'}</b>
                    <small>{isOnline ? 'Internet connection reachable' : 'Waiting for connection'}</small>
                  </div>
                  <time>{lastCheck}</time>
                </div>

                <div className="activity-item">
                  <div className="activity-symbol blue"><Activity size={15} /></div>
                  <div>
                    <b>Latency measured</b>
                    <small>{latency !== null ? `${latency} ms response time` : 'Waiting for measurement'}</small>
                  </div>
                  <time>{lastCheck}</time>
                </div>

                <div className="activity-item">
                  <div className="activity-symbol purple"><ShieldCheck size={15} /></div>
                  <div>
                    <b>Monitoring {running ? 'active' : 'paused'}</b>
                    <small>Automatic network testing</small>
                  </div>
                  <time>{running ? 'Live' : 'Paused'}</time>
                </div>

                <div className="activity-item">
                  <div className="activity-symbol green"><ArrowDownRight size={15} /></div>
                  <div>
                    <b>Test history</b>
                    <small>Saved speed tests are available</small>
                  </div>
                  <button className="subtle-btn" onClick={() => onNavigate('history')}>Open</button>
                </div>
              </div>
            </div>
          </section>

          <footer>
            <Activity size={13} />
            NetPulse Network Monitor
            <span className="footer-right">
              Monitoring {running ? 'active' : 'paused'}
            </span>
          </footer>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default Dashboard
