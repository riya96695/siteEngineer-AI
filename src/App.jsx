import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Chat from './components/chat'
import Sidebar from './components/Sidebar'
import ISCodeLibrary from './components/ISCodeLibrary'
import Calculator from './components/Calculator'
import ProjectSpace from './components/ProjectSpace'
import Auth from './components/Auth'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentConvId, setCurrentConvId] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--accent)', fontSize: '16px', gap: '10px' }}>
      <span>🏗️</span> Loading SiteEngineer AI...
    </div>
  )

  if (!user) return <Auth />

  const chatElement = (
    <Chat
      user={user}
      currentConvId={currentConvId}
      setCurrentConvId={setCurrentConvId}
    />
  )

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          user={user}
          currentConvId={currentConvId}
          setCurrentConvId={setCurrentConvId}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <Routes>
          <Route path="/" element={chatElement} />
          <Route path="/chat" element={chatElement} />
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