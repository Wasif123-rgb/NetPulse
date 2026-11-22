
import {
  Activity,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  Router,
  Settings,
} from 'lucide-react'

import type { Page } from '../App'

interface SidebarProps {
  mobileMenu: boolean
  setMobileMenu: (value: boolean) => void
  notify: (message: string) => void
  activePage: Page
  onNavigate: (page: Page) => void
}

function Sidebar({
  mobileMenu,
  setMobileMenu,
  notify,
  activePage,
  onNavigate,
}: SidebarProps) {
  const navigate = (page: Page) => {
    onNavigate(page)
    setMobileMenu(false)
  }

  return (
    <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <Activity size={20} />
        </div>

        <div>
          <strong>netpulse</strong>
          <span>NETWORK MONITOR</span>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav>
        <a
          href="#overview"
          className={activePage === 'overview' ? 'active' : ''}
          onClick={e => {
            e.preventDefault()
            navigate('overview')
          }}
        >
          <LayoutDashboard size={18} />
          Overview
        </a>

        <a
          href="#network"
          className={activePage === 'network' ? 'active' : ''}
          onClick={e => {
            e.preventDefault()
            navigate('network')
          }}
        >
          <Router size={18} />
          Network
        </a>

        <a
          href="#history"
          className={activePage === 'history' ? 'active' : ''}
          onClick={e => {
            e.preventDefault()
            navigate('history')
          }}
        >
          <Clock3 size={18} />
          History
        </a>
      </nav>

      <div className="nav-label tools-label">TOOLS</div>

      <nav>
        <a
          href="#diagnostics"
          className={activePage === 'diagnostics' ? 'active' : ''}
          onClick={e => {
            e.preventDefault()
            navigate('diagnostics')
          }}
        >
          <Gauge size={18} />
          Diagnostics
        </a>

        <a
          href="#reports"
          className={activePage === 'reports' ? 'active' : ''}
          onClick={e => {
            e.preventDefault()
            navigate('reports')
          }}
        >
          <FileText size={18} />
          Reports
        </a>

        <a
          href="#settings"
          onClick={e => {
            e.preventDefault()
            notify('Settings are coming soon')
          }}
        >
          <Settings size={18} />
          Settings
        </a>
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <CircleHelp size={18} />

          <div>
            <b>Need a hand?</b>
            <small>Learn about your network</small>
          </div>

          <ChevronDown size={14} />
        </div>

        <div className="profile">
          <div className="avatar">W</div>

          <div className="profile-text">
            <b>Workspace</b>
            <small>Personal monitor</small>
          </div>

          <button
            className="dots"
            aria-label="More options"
            onClick={() => notify('Workspace menu coming soon')}
          >
            ···
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
