
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Network from './pages/Network'
import Diagnostics from './pages/Diagnostics'
import Reports from './pages/Reports'

export type Page =
  | 'overview'
  | 'history'
  | 'network'
  | 'diagnostics'
  | 'reports'

function App() {
  const [page, setPage] = useState<Page>('overview')

  switch (page) {
    case 'overview':
      return <Dashboard onNavigate={setPage} />

    case 'history':
      return <History onNavigate={setPage} />

    case 'network':
      return <Network onNavigate={setPage} />

    case 'diagnostics':
      return <Diagnostics onNavigate={setPage} />

    case 'reports':
      return <Reports onNavigate={setPage} />

    default:
      return <Dashboard onNavigate={setPage} />
  }
}

export default App
