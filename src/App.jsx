import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Chat from './components/Chat'
import Sidebar from './components/Sidebar'
import ISCodeLibrary from './components/ISCodeLibrary'
import Calculator from './components/Calculator'
import ProjectSpace from './components/ProjectSpace'
import Auth from './components/Auth'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // User already logged in hai check karo
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth changes listen karo
    // Jab login/logout hoga tab automatically update hoga
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Loading state
  if (loading) return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a1a',
      color: '#ff7a20',
      fontSize: '16px',
      gap: '10px'
    }}>
      <span>🏗️</span> Loading SiteEngineer AI...
    </div>
  )

  // User logged in nahi → Auth page
  if (!user) return <Auth />

  // User logged in → Full app
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar user={user} />
        <Routes>
          <Route path="/" element={<Chat user={user} />} />
          <Route path="/library" element={<ISCodeLibrary />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/projects" element={<ProjectSpace user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
