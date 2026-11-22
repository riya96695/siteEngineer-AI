import { useState, useEffect, useRef } from 'react'
import { MessageSquare, BookOpen, Calculator, FolderOpen, LogOut, Pin, Pencil, Trash2, Plus, Check, X, MoreHorizontal, Sun, Moon, Menu } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const navItems = [
  { icon: <BookOpen size={20} />, label: 'IS Code Library', path: '/library' },
  { icon: <Calculator size={20} />, label: 'Calculator', path: '/calculator' },
  { icon: <FolderOpen size={20} />, label: 'My Project Space', path: '/projects' },
]

export default function Sidebar({ user, currentConvId, setCurrentConvId, theme, toggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (data) setConversations(data)
  }

  const createNewChat = async () => {
    const { data } = await supabase
      .from('conversations')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single()
    if (data) {
      setConversations(prev => [data, ...prev.filter(c => !c.pinned)])
      setCurrentConvId(data.id)
      navigate('/chat')
      setMobileOpen(false)
    }
  }

  const deleteConversation = async (e, id) => {
    e.stopPropagation()
    setMenuOpenId(null)
    await supabase.from('chat_history').delete().eq('conversation_id', id)
    await supabase.from('conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConvId === id) {
      setCurrentConvId(null)
    }
  }

  const pinConversation = async (e, id, pinned) => {
    e.stopPropagation()
    setMenuOpenId(null)
    await supabase.from('conversations').update({ pinned: !pinned }).eq('id', id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned: !pinned } : c))
  }

  const startRename = (e, id, title) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setEditingId(id)
    setEditTitle(title)
  }

  const saveRename = async (id) => {
    await supabase.from('conversations').update({ title: editTitle }).eq('id', id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle } : c))
    setEditingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const pinnedConvs = conversations.filter(c => c.pinned)
  const recentConvs = conversations.filter(c => !c.pinned)

  const sidebarContent = (
    <>
      <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'var(--accent)', fontSize: '19px', fontWeight: '700', margin: 0 }}>🏗️ SiteEngineer AI</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '4px' }}>Powered by LLM + RAG</p>
        </div>
        <button
          onClick={toggleTheme}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <button
          onClick={createNewChat}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14.5px', fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color-light)' }}
        >
          <Plus size={17} /> New Chat
        </button>
      </div>

      <div style={{ padding: '0 12px' }}>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', marginBottom: '3px', textDecoration: 'none', fontSize: '14.5px', color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)', background: location.pathname === item.path ? 'var(--accent-light)' : 'transparent' }}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--border-color)', margin: '14px 0' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }} onClick={() => setMenuOpenId(null)}>

        {pinnedConvs.length > 0 && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>📌 Pinned</p>
            {pinnedConvs.map(conv => (
              <ConvItem key={conv.id} conv={conv} isActive={currentConvId === conv.id} menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} onSelect={() => { setCurrentConvId(conv.id); navigate('/chat'); setMobileOpen(false) }} onDelete={deleteConversation} onPin={pinConversation} onRename={startRename} onSaveRename={saveRename} onCancelRename={() => setEditingId(null)} />
            ))}
          </>
        )}

        {recentConvs.length > 0 && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Recent</p>
            {recentConvs.map(conv => (
              <ConvItem key={conv.id} conv={conv} isActive={currentConvId === conv.id} menuOpenId={menuOpenId} setMenuOpenId={setMenuOpenId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} onSelect={() => { setCurrentConvId(conv.id); navigate('/chat'); setMobileOpen(false) }} onDelete={deleteConversation} onPin={pinConversation} onRename={startRename} onSaveRename={saveRename} onCancelRename={() => setEditingId(null)} />
            ))}
          </>
        )}

        {conversations.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', padding: '10px 14px' }}>Abhi koi chat nahi!</p>
        )}
      </div>

      <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />

      <div style={{ padding: '16px' }}>
        {user && <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginBottom: '10px', wordBreak: 'break-all' }}>{user.email}</p>}
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border-color-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14.5px', fontWeight: 500 }} onMouseEnter={e => { e.currentTarget.style.background = '#ff000015'; e.currentTarget.style.color = '#ff6666'; e.currentTarget.style.borderColor = '#ff666640' }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color-light)' }}>
          <LogOut size={17} /> Logout
        </button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 50, width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border-color-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: mobileOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Menu size={20} />
        </button>

        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          />
        )}

        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: '280px',
          background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', zIndex: 70,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease'
        }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', top: '20px', right: '-44px', width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: mobileOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
          {sidebarContent}
        </div>
      </>
    )
  }

  return (
    <div style={{ width: '280px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {sidebarContent}
    </div>
  )
}

function ConvItem({ conv, isActive, menuOpenId, setMenuOpenId, editingId, editTitle, setEditTitle, onSelect, onDelete, onPin, onRename, onSaveRename, onCancelRename }) {
  const isMenuOpen = menuOpenId === conv.id
  const isEditing = editingId === conv.id

  return (
    <div
      onClick={onSelect}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', marginBottom: '3px', cursor: 'pointer', background: isActive ? 'var(--accent-light)' : 'transparent', border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <MessageSquare size={16} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />

      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSaveRename(conv.id); if (e.key === 'Escape') onCancelRename() }}
            autoFocus
            style={{ flex: 1, background: 'var(--bg-hover)', border: '1px solid var(--border-color-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13.5px', padding: '4px 8px', outline: 'none' }}
          />
          <button onClick={() => onSaveRename(conv.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}><Check size={14} /></button>
          <button onClick={onCancelRename} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: '13.5px', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conv.title}
          </span>

          <button
            onClick={e => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : conv.id) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', borderRadius: '6px', display: 'flex', alignItems: 'center', opacity: isActive || isMenuOpen ? 1 : 0 }}
            className="conv-menu-btn"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', right: '10px', top: '38px', background: 'var(--bg-hover)', border: '1px solid var(--border-color-light)', borderRadius: '10px', padding: '5px', zIndex: 100, minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              <button onClick={e => onPin(e, conv.id, conv.pinned)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13.5px', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Pin size={14} color='var(--accent)' /> {conv.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={e => onRename(e, conv.id, conv.title)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13.5px', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Pencil size={14} color='var(--text-secondary)' /> Rename
              </button>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color-light)', margin: '5px 0' }} />
              <button onClick={e => onDelete(e, conv.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', color: '#ff6666', cursor: 'pointer', fontSize: '13.5px', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.background = '#ff000015'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}