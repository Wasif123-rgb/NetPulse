
import { useEffect, useState } from 'react'
import {
  Activity,
  Globe,
  RefreshCw,
  Router,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import type { Page } from '../App'

interface NetworkProps {
  onNavigate: (page: Page) => void
}

interface ConnectionDetails {
  effectiveType: string
  downlink: number | null
  rtt: number | null
  saveData: boolean
  type: string
}

interface BrowserConnection {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
  type?: string
  addEventListener?: (event: string, callback: () => void) => void
  removeEventListener?: (event: string, callback: () => void) => void
}

function Network({ onNavigate }: NetworkProps) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [connection, setConnection] = useState<ConnectionDetails>({
    effectiveType: 'Not available',
    downlink: null,
    rtt: null,
    saveData: false,
    type: 'Not available',
  })
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshNetwork = () => {
    setOnline(navigator.onLine)

    const browserConnection = (
      navigator as Navigator & { connection?: BrowserConnection }
    ).connection

    setConnection({
      effectiveType: browserConnection?.effectiveType || 'Not available',
      downlink: browserConnection?.downlink ?? null,
      rtt: browserConnection?.rtt ?? null,
      saveData: browserConnection?.saveData ?? false,
      type: browserConnection?.type || 'Not available',
    })

    setLastUpdated(new Date())
  }

  useEffect(() => {
    refreshNetwork()

    const handleOnline = () => refreshNetwork()
    const handleOffline = () => refreshNetwork()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const browserConnection = (
      navigator as Navigator & { connection?: BrowserConnection }
    ).connection

    browserConnection?.addEventListener?.('change', refreshNetwork)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      browserConnection?.removeEventListener?.('change', refreshNetwork)
    }
  }, [])

  const cardStyle: React.CSSProperties = {
    background: '#111a22',
    border: '1px solid #26343d',
    borderRadius: '12px',
    padding: '22px',
    minWidth: 0,
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginTop: '12px',
    color: '#e7edf1',
  }

  return (
    <div className="app-shell">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        notify={() => {}}
        activePage="network"
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
            <span className="nav-label">WORKSPACE / NETWORK</span>
          </div>

          <button className="refresh-button" onClick={refreshNetwork}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </header>

        <section className="content">
          <div className="welcome-row">
            <div>
              <h1>Network Information</h1>
              <p>View your current internet connection details.</p>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: online
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(239,68,68,0.12)',
                color: online ? '#4ade80' : '#f87171',
              }}
            >
              {online ? <Wifi size={27} /> : <WifiOff size={27} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#93a4ae' }}>
                CONNECTION STATUS
              </div>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  marginTop: '5px',
                  color: online ? '#4ade80' : '#f87171',
                }}
              >
                {online ? 'Browser reports online' : 'Browser reports offline'}
              </div>

              <div style={{ color: '#93a4ae', fontSize: '12px', marginTop: 5 }}>
                This indicates browser connectivity, not guaranteed internet access.
              </div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">
                <Router size={17} />
                Connection Type
              </div>
              <div style={valueStyle}>{connection.type}</div>
              <small>Reported by your browser</small>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <Activity size={17} />
                Effective Network
              </div>
              <div style={valueStyle}>{connection.effectiveType}</div>
              <small>Browser-estimated connection quality</small>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <Zap size={17} />
                Estimated Downlink
              </div>
              <div style={valueStyle}>
                {connection.downlink !== null
                  ? `${connection.downlink} Mbps`
                  : '--'}
              </div>
              <small>Browser estimate, not a speed test</small>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <Activity size={17} />
                Estimated RTT
              </div>
              <div style={valueStyle}>
                {connection.rtt !== null ? `${connection.rtt} ms` : '--'}
              </div>
              <small>Browser-reported round-trip estimate</small>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              marginTop: '22px',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ShieldCheck size={22} color="#4ade80" />
              <h3 style={{ margin: 0 }}>Connection Details</h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginTop: '22px',
              }}
            >
              <div>
                <small style={{ color: '#93a4ae' }}>Data Saver</small>
                <div style={{ marginTop: 7, fontWeight: 600 }}>
                  {connection.saveData ? 'Enabled' : 'Not enabled / unavailable'}
                </div>
              </div>

              <div>
                <small style={{ color: '#93a4ae' }}>Internet API Status</small>
                <div style={{ marginTop: 7, fontWeight: 600 }}>
                  {online ? 'Online' : 'Offline'}
                </div>
              </div>

              <div>
                <small style={{ color: '#93a4ae' }}>Last Refreshed</small>
                <div style={{ marginTop: 7, fontWeight: 600 }}>
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              marginTop: '22px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Globe size={20} color="#4ade80" />
            <div>
              <b>About this information</b>
              <p style={{ color: '#93a4ae', lineHeight: 1.7, marginBottom: 0 }}>
                Your browser does not expose every network detail. Public IP,
                router address, DNS servers and Wi-Fi signal strength are not
                available through this page's standard browser APIs.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Network
