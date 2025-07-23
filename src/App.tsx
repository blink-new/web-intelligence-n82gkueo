import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import LandingPage from './components/LandingPage'
import ScrapingDashboard from './components/ScrapingDashboard'
import { Toaster } from './components/ui/toaster'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Show dashboard if user is authenticated, otherwise show landing page
  return (
    <>
      {user ? <ScrapingDashboard user={user} /> : <LandingPage user={user} />}
      <Toaster />
    </>
  )
}

export default App