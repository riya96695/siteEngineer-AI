import { MessageSquare, BookOpen, Calculator, FolderOpen } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { icon: <MessageSquare size={18} />, label: 'AI Chat', path: '/' },
  { icon: <BookOpen size={18} />, label: 'IS Code Library', path: '/library' },
  { icon: <Calculator size={18} />, label: 'Calculator', path: '/calculator' },
  { icon: <FolderOpen size={18} />, label: 'My Project Space', path: '/projects' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div style={{
      width: '220px',
      background: '#111',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 16px 20px' }}>
        <h2 style={{ color: '#ff7a20', fontSize: '16px' }}>🏗️ SiteEngineer AI</h2>
        <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>Powered by LLM + RAG</p>
      </div>

      <hr style={{ borderColor: '#2a2a2a', margin: '0 0 12px' }} />

      <nav style={{ flex: 1, padding: '0 8px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              textDecoration: 'none',
              fontSize: '13px',
              color: location.pathname === item.path ? '#ff7a20' : '#888',
              background: location.pathname === item.path ? '#ff7a2015' : 'transparent',
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <hr style={{ borderColor: '#2a2a2a', margin: '12px 0' }} />
      <div style={{ padding: '0 16px' }}>
        <p style={{ color: '#444', fontSize: '11px' }}>AI assistant for junior site engineers</p>
      </div>
    </div>
  )
}