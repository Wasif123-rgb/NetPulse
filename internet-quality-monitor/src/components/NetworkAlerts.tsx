
import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Settings2,
} from 'lucide-react'

import type { CSSProperties } from 'react'

interface NetworkAlertsProps {
  status: 'Online' | 'Offline' | 'Checking'
  latency: number | null
  jitter: number | null
  packetLoss: number | null
}

interface AlertItem {
  id: string
  title: string
  message: string
  severity: 'warning' | 'critical'
  createdAt: string
  read: boolean
}

const ALERTS_KEY = 'netpulse_network_alerts'
const SETTINGS_KEY = 'netpulse_alert_settings'

const cardStyle: CSSProperties = {
  background: '#111a22',
  border: '1px solid #26343d',
  borderRadius: '12px',
  padding: '20px',
}

function readAlerts(): AlertItem[] {
  try {
    const saved = localStorage.getItem(ALERTS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function NetworkAlerts({
  status,
  latency,
  jitter,
  packetLoss,
}: NetworkAlertsProps) {
  const [enabled, setEnabled] = useState(true)
  const [latencyLimit, setLatencyLimit] = useState(100)
  const [jitterLimit, setJitterLimit] = useState(30)
  const [packetLossLimit, setPacketLossLimit] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>(readAlerts)

  const activeConditions = useRef<Set<string>>(new Set())

  // Load saved settings before running alert detection.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)

      if (saved) {
        const settings = JSON.parse(saved)

        if (typeof settings.enabled === 'boolean') {
          setEnabled(settings.enabled)
        }

        if (
          typeof settings.latencyLimit === 'number' &&
          Number.isFinite(settings.latencyLimit)
        ) {
          setLatencyLimit(settings.latencyLimit)
        }

        if (
          typeof settings.jitterLimit === 'number' &&
          Number.isFinite(settings.jitterLimit)
        ) {
          setJitterLimit(settings.jitterLimit)
        }

        if (
          typeof settings.packetLossLimit === 'number' &&
          Number.isFinite(settings.packetLossLimit)
        ) {
          setPacketLossLimit(settings.packetLossLimit)
        }
      }
    } catch {
      // Use default settings if saved settings cannot be read.
    } finally {
      setSettingsLoaded(true)
    }
  }, [])

  // Save alert history.
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
    } catch {
      // Alert history remains available in memory.
    }
  }, [alerts])

  // Save settings only after the initial settings have loaded.
  useEffect(() => {
    if (!settingsLoaded) return

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          enabled,
          latencyLimit,
          jitterLimit,
          packetLossLimit,
        }),
      )
    } catch {
      // Settings remain available in memory.
    }
  }, [
    settingsLoaded,
    enabled,
    latencyLimit,
    jitterLimit,
    packetLossLimit,
  ])

  // Detect network problems.
  useEffect(() => {
    if (!settingsLoaded) return

    if (!enabled) {
      activeConditions.current.clear()
      return
    }

    const conditions: {
      key: string
      title: string
      message: string
      severity: 'warning' | 'critical'
      active: boolean
    }[] = [
      {
        key: 'offline',
        title: 'Internet connection lost',
        message: 'NetPulse cannot reach the internet test server.',
        severity: 'critical',
        active: status === 'Offline',
      },
      {
        key: 'high-latency',
        title: 'High latency detected',
        message:
          latency !== null
            ? `Current latency is ${latency} ms. Your limit is ${latencyLimit} ms.`
            : '',
        severity: 'warning',
        active:
          status === 'Online' &&
          latency !== null &&
          latency > latencyLimit,
      },
      {
        key: 'high-jitter',
        title: 'High jitter detected',
        message:
          jitter !== null
            ? `Current jitter is ${jitter} ms. Your limit is ${jitterLimit} ms.`
            : '',
        severity: 'warning',
        active:
          status === 'Online' &&
          jitter !== null &&
          jitter > jitterLimit,
      },
      {
        key: 'packet-loss',
        title: 'Packet loss detected',
        message:
          packetLoss !== null
            ? `Failed request rate is ${packetLoss}%. Your limit is ${packetLossLimit}%.`
            : '',
        severity: 'warning',
        active:
          status === 'Online' &&
          packetLoss !== null &&
          packetLoss > packetLossLimit,
      },
    ]

    conditions.forEach(condition => {
      if (!condition.active) {
        activeConditions.current.delete(condition.key)
        return
      }

      // Avoid generating the same alert repeatedly.
      if (activeConditions.current.has(condition.key)) return

      activeConditions.current.add(condition.key)

      const newAlert: AlertItem = {
        id: `${Date.now()}-${condition.key}`,
        title: condition.title,
        message: condition.message,
        severity: condition.severity,
        createdAt: new Date().toISOString(),
        read: false,
      }

      setAlerts(previous =>
        [newAlert, ...previous].slice(0, 50),
      )

      // Send a browser notification if permission was granted.
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(`NetPulse: ${condition.title}`, {
          body: condition.message,
        })
      }
    })
  }, [
    settingsLoaded,
    enabled,
    status,
    latency,
    jitter,
    packetLoss,
    latencyLimit,
    jitterLimit,
    packetLossLimit,
  ])

  const unreadCount = alerts.filter(alert => !alert.read).length

  // Request browser notification permission.
  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      window.alert('Your browser does not support desktop notifications.')
      return
    }

    if (Notification.permission === 'granted') {
      window.alert('Browser notifications are already enabled.')
      return
    }

    if (Notification.permission === 'denied') {
      window.alert(
        'Notifications are blocked in your browser settings. You can enable them there.',
      )
      return
    }

    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      window.alert('Browser notifications enabled!')
    }
  }

  // Mark every alert as read.
  const markAllRead = () => {
    setAlerts(previous =>
      previous.map(alert => ({ ...alert, read: true })),
    )
  }

  // Clear alert history.
  const clearAlerts = () => {
    setAlerts([])
  }

  // Update threshold values safely.
  const updateNumber = (
    value: string,
    setter: (value: number) => void,
    minimum: number,
    maximum: number,
  ) => {
    if (value.trim() === '') return

    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      setter(Math.min(maximum, Math.max(minimum, parsed)))
    }
  }

  return (
    <section style={{ ...cardStyle, marginBottom: '22px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              background: 'rgba(34,197,94,0.12)',
              color: '#4ade80',
            }}
          >
            <Bell size={20} />
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>Network Alerts</h2>
            <p style={{ color: '#93a4ae', margin: '5px 0 0', fontSize: 12 }}>
              {enabled
                ? 'Automatic issue detection is active'
                : 'Alerts are disabled'}
            </p>
          </div>

          <span
            style={{
              background:
                unreadCount > 0 ? 'rgba(239,68,68,0.15)' : '#1b2a32',
              color: unreadCount > 0 ? '#fca5a5' : '#a9bac4',
              borderRadius: 20,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {unreadCount} unread
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="subtle-btn"
            onClick={() => setEnabled(value => !value)}
          >
            {enabled ? <Bell size={14} /> : <BellOff size={14} />}
            {enabled ? 'Disable alerts' : 'Enable alerts'}
          </button>

          <button
            className="subtle-btn"
            onClick={() => setShowSettings(value => !value)}
          >
            <Settings2 size={14} />
            Thresholds
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 10,
            background: '#17232b',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
          }}
        >
          <label style={{ color: '#cbd5dc', fontSize: 12 }}>
            Latency limit (ms)
            <input
              type="number"
              min="1"
              max="5000"
              value={latencyLimit}
              onChange={event =>
                updateNumber(event.target.value, setLatencyLimit, 1, 5000)
              }
              style={inputStyle}
            />
          </label>

          <label style={{ color: '#cbd5dc', fontSize: 12 }}>
            Jitter limit (ms)
            <input
              type="number"
              min="1"
              max="1000"
              value={jitterLimit}
              onChange={event =>
                updateNumber(event.target.value, setJitterLimit, 1, 1000)
              }
              style={inputStyle}
            />
          </label>

          <label style={{ color: '#cbd5dc', fontSize: 12 }}>
            Failed request limit (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={packetLossLimit}
              onChange={event =>
                updateNumber(event.target.value, setPacketLossLimit, 0, 100)
              }
              style={inputStyle}
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="subtle-btn" onClick={requestNotifications}>
              <Bell size={14} />
              Enable browser notifications
            </button>

            <p style={{ color: '#93a4ae', fontSize: 11, marginBottom: 0 }}>
              Browser notifications are optional. Your browser will ask for
              permission when you click this button.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <b style={{ fontSize: 13 }}>Alert history</b>

          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button className="subtle-btn" onClick={markAllRead}>
                <CheckCircle2 size={13} />
                Mark all read
              </button>
            )}

            {alerts.length > 0 && (
              <button className="subtle-btn" onClick={clearAlerts}>
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {alerts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 12px',
              background: '#17232b',
              borderRadius: 9,
              color: '#93a4ae',
            }}
          >
            <CheckCircle2
              size={25}
              color="#4ade80"
              style={{ marginBottom: 8 }}
            />

            <div style={{ color: '#e7edf1', fontWeight: 600 }}>
              No alerts yet
            </div>

            <small>
              NetPulse will show an alert when a problem is detected.
            </small>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 9 }}>
            {alerts.slice(0, 8).map(alert => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 13,
                  borderRadius: 9,
                  background: '#17232b',
                  border: `1px solid ${
                    alert.severity === 'critical' ? '#713b3b' : '#55482b'
                  }`,
                  opacity: alert.read ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    color:
                      alert.severity === 'critical' ? '#f87171' : '#fbbf24',
                    paddingTop: 2,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <b style={{ fontSize: 13 }}>{alert.title}</b>

                    {!alert.read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#4ade80',
                        }}
                      />
                    )}
                  </div>

                  <p
                    style={{
                      color: '#a9bac4',
                      fontSize: 12,
                      margin: '5px 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {alert.message}
                  </p>

                  <small style={{ color: '#728691' }}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </small>
                </div>

                <button
                  aria-label="Mark alert as read"
                  title="Mark as read"
                  onClick={() =>
                    setAlerts(previous =>
                      previous.map(item =>
                        item.id === alert.id
                          ? { ...item, read: true }
                          : item,
                      ),
                    )
                  }
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: '#93a4ae',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 8,
  padding: '10px',
  borderRadius: 7,
  border: '1px solid #34434d',
  background: '#0b1117',
  color: '#e7edf1',
  outline: 'none',
}

export default NetworkAlerts
