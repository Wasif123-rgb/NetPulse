
import { Bell, Clock3, Menu } from 'lucide-react'

interface TopbarProps {
  lastCheck: string
  mobileMenu: boolean
  setMobileMenu: (value: boolean) => void
  notify: (message: string) => void
}

function Topbar({
  lastCheck,
  mobileMenu,
  setMobileMenu,
  notify,
}: TopbarProps) {
  return (
    <header className="topbar">
      <button
        className="menu-btn"
        onClick={() => setMobileMenu(!mobileMenu)}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="breadcrumb">
        Workspace <span>/</span> <b>Overview</b>
      </div>

      <div className="top-actions">
        <span className="date-chip">
          <Clock3 size={15} />
          Updated {lastCheck}
        </span>

        <button
          className="icon-btn"
          onClick={() => notify('You are all caught up')}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <i />
        </button>

        <div className="mini-avatar">W</div>
      </div>
    </header>
  )
}

export default Topbar
