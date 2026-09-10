import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store'
import BottomNav from './components/BottomNav'
import Onboarding from './components/Onboarding'
import Timeline from './pages/Timeline'
import Vaccines from './pages/Vaccines'
import Records from './pages/Records'
import Policy from './pages/Policy'
import Profile from './pages/Profile'

export default function App() {
  const { child, hydrated, hydrate } = useApp()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [hydrate])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-orange-300 text-sm">
        加载中…
      </div>
    )
  }

  if (!child) {
    return <Onboarding />
  }

  return (
    <div className="min-h-screen safe-bottom">
      <Routes>
        <Route path="/" element={<Timeline />} />
        <Route path="/vaccines" element={<Vaccines />} />
        <Route path="/records" element={<Records />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/me" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
