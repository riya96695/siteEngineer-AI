import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Mic, Plus, X, FileText, Camera } from 'lucide-react'
import { supabase } from '../supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API = 'https://siteengineer-ai.onrender.com'

export default function Chat({ user, currentConvId, setCurrentConvId }) {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! Main SiteEngineer AI hoon. IS codes, blueprints, calculations — kuch bhi poochho!\n\n⚠️ *Ye AI suggestions hain — critical decisions ke liye qualified engineer se verify karo.*' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConv, setLoadingConv] = useState(false)
  const [recording, setRecording] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    if (currentConvId) {
      loadConversationMessages(currentConvId)
    } else {
      setMessages([{ role: 'assistant', content: 'Namaste! Main SiteEngineer AI hoon. IS codes, blueprints, calculations — kuch bhi poochho!\n\n⚠️ *Ye AI suggestions hain — critical decisions ke liye qualified engineer se verify karo.*' }])
    }
  }, [currentConvId])

  useEffect(() => {
    if (projectId && user) {
      findProjectConversation(projectId)
    }
  }, [projectId])

  const findProjectConversation = async (pid) => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', pid)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      setCurrentConvId(data[0].id)
    } else {
      setCurrentConvId(null)
    }
  }

  const loadConversationMessages = async (convId) => {
    setLoadingConv(true)
    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role, content: m.content })))
    } else {
      setMessages([{ role: 'assistant', content: 'Namaste! Main SiteEngineer AI hoon. IS codes, blueprints, calculations — kuch bhi poochho!\n\n⚠️ *Ye AI suggestions hain — critical decisions ke liye qualified engineer se verify karo.*' }])
    }
    setLoadingConv(false)
  }

  const ensureConversation = async () => {
    if (currentConvId) return currentConvId

    const { data } = await supabase
      .from('conversations')
      .insert([{
        user_id: user.id,
        title: projectId ? 'Project Chat' : 'New Chat',
        project_id: projectId || null
      }])
      .select()
      .single()

    if (data) {
      setCurrentConvId(data.id)
      return data.id
    }
    return null
  }

  const saveToSupabase = async (role, content, convId) => {
    if (!user || !convId) return
    await supabase.from('chat_history').insert([{
      user_id: user.id,
      role,
      content,
      conversation_id: convId
    }])

    if (role === 'user') {
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '')
      await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', convId)
    }
  }

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || loading) return

    const convId = await ensureConversation()
    if (!convId) return

    const userContent = attachedFile ? `📎 ${attachedFile.name}\n${input}` : input
    const currentInput = input
    const currentFile = attachedFile

    setMessages(prev => [...prev, { role: 'user', content: userContent }])
    await saveToSupabase('user', userContent, convId)
    setInput('')
    setAttachedFile(null)
    setLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      if (currentFile) {
        const formData = new FormData()
        formData.append('message', currentInput || 'Is image ko dekh ke batao.')
        formData.append('chat_history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))))
        if (projectId) formData.append('project_id', projectId)
        formData.append('file', currentFile)

        const res = await fetch(`${API}/api/chat/multimodal`, {
          method: 'POST',
          body: formData
        })

        const data = await res.json()
        const aiResponse = data.response || 'Kuch issue hua — dobara try karo!'

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: aiResponse }
          return updated
        })

        await saveToSupabase('assistant', aiResponse, convId)

      } else {
        const res = await fetch(`${API}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            chat_history: messages.map(m => ({ role: m.role, content: m.content })),
            project_id: projectId
          })
        })

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let aiResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.token) {
                  aiResponse += data.token
                  setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: aiResponse }
                    return updated
                  })
                  scrollToBottom()
                }
                if (data.done) {
                  await saveToSupabase('assistant', aiResponse, convId)
                }
              } catch { }
            }
          }
        }
      }

    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: '❌ Backend connect nahi ho raha!' }
        return updated
      })
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const formData = new FormData()
        formData.append('file', blob, 'voice.wav')
        try {
          const res = await fetch(`${API}/api/voice`, { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text) {
            const voiceText = data.text
            const convId = await ensureConversation()
            if (!convId) return

            setMessages(prev => [...prev, { role: 'user', content: '🎤 Voice message' }])
            await saveToSupabase('user', '🎤 Voice message', convId)
            setLoading(true)
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            const chatRes = await fetch(`${API}/api/chat/stream`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: voiceText,
                chat_history: messages.map(m => ({ role: m.role, content: m.content })),
                project_id: projectId
              })
            })

            const reader = chatRes.body.getReader()
            const decoder = new TextDecoder()
            let aiResponse = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const d = JSON.parse(line.slice(6))
                    if (d.token) {
                      aiResponse += d.token
                      setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = { role: 'assistant', content: aiResponse }
                        return updated
                      })
                    }
                    if (d.done) await saveToSupabase('assistant', aiResponse, convId)
                  } catch { }
                }
              }
            }
            setLoading(false)
          }
        } catch { setLoading(false) }
      }
      mediaRecorder.start()
      setRecording(true)
    } catch { alert('Microphone access do!') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleFileSelect = e => {
    const file = e.target.files[0]
    if (file) { setAttachedFile(file); setShowAttachMenu(false) }
  }

  const handleCamera = async () => {
    setShowAttachMenu(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      stream.getTracks().forEach(t => t.stop())
      canvas.toBlob(blob => {
        const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' })
        setAttachedFile(file)
      }, 'image/jpeg')
    } catch { alert('Camera access do!') }
  }

  const clearChat = async () => {
    if (!user || !currentConvId) return
    await supabase.from('chat_history').delete().eq('conversation_id', currentConvId)
    setMessages([{ role: 'assistant', content: 'Namaste! Main SiteEngineer AI hoon. IS codes, blueprints, calculations — kuch bhi poochho!\n\n⚠️ *Ye AI suggestions hain — critical decisions ke liye qualified engineer se verify karo.*' }])
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', height: '100vh', minWidth: 0 }}>

      <div style={{
        padding: isMobile ? '20px 20px 20px 64px' : '20px 32px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '17px', fontWeight: 600 }}>AI</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Site Engineer Assistant</p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', margin: '2px 0 0' }}>
              ● Online — {projectId ? 'Project Mode' : 'Powered by LLM + RAG'}
            </p>
          </div>
        </div>
        <button onClick={clearChat} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-color-light)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>
          🗑️{!isMobile && ' Clear'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 0' : '32px 0' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', padding: isMobile ? '0 14px' : '0 24px' }}>
          {loadingConv ? (
            <>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    width: `${180 + i * 40}px`, height: '52px', borderRadius: '18px',
                    background: 'var(--bg-tertiary)',
                    backgroundImage: 'linear-gradient(90deg, var(--bg-tertiary) 0%, var(--bg-hover) 50%, var(--bg-tertiary) 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s ease-in-out infinite'
                  }} />
                </div>
              ))}
              <style>{`
                @keyframes shimmer {
                  0% { background-position: 200% 0; }
                  100% { background-position: -200% 0; }
                }
              `}</style>
            </>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: isMobile ? '88%' : '75%', padding: isMobile ? '12px 15px' : '14px 18px', borderRadius: '18px',
                    fontSize: isMobile ? '14.5px' : '15.5px', lineHeight: '1.7', whiteSpace: 'pre-wrap',
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'assistant' ? '1px solid var(--border-color-light)' : 'none',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
                  }}>
                    {msg.content ? (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : loading && i === messages.length - 1 && msg.role === 'assistant' ? (
                      <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                        {[0, 1, 2].map(d => (
                          <span key={d} style={{
                            width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)',
                            animation: `typingDot 1.2s ease-in-out ${d * 0.2}s infinite`
                          }} />
                        ))}
                        <style>{`
                          @keyframes typingDot {
                            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                            30% { opacity: 1; transform: translateY(-4px); }
                          }
                        `}</style>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Koi response nahi mila, dobara try karo.</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div style={{ padding: isMobile ? '14px 14px 20px' : '20px 24px 28px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {attachedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '24px', width: 'fit-content', marginBottom: '10px' }}>
              <FileText size={14} color='var(--accent)' />
              <span style={{ fontSize: '13px', color: 'var(--accent)' }}>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          )}

          {recording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '8px 16px', marginBottom: '10px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '20px', width: 'fit-content' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} style={{
                  display: 'inline-block', width: '3px', borderRadius: '2px', background: 'var(--accent)',
                  height: '14px', animation: `voiceBar 0.8s ease-in-out ${i * 0.12}s infinite`
                }} />
              ))}
              <span style={{ fontSize: '13px', color: 'var(--accent)', marginLeft: '8px' }}>Recording...</span>
              <style>{`
                @keyframes voiceBar {
                  0%, 100% { height: 6px; }
                  50% { height: 18px; }
                }
              `}</style>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color-light)', borderRadius: '32px', padding: isMobile ? '6px 6px 6px 12px' : '10px 10px 10px 16px' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', borderRadius: '50%', background: showAttachMenu ? 'var(--accent)' : 'var(--bg-hover)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={isMobile ? 17 : 20} />
              </button>

              {showAttachMenu && (
                <div style={{ position: 'absolute', bottom: '52px', left: 0, background: 'var(--bg-hover)', border: '1px solid var(--border-color-light)', borderRadius: '14px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '170px', zIndex: 10 }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14.5px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <FileText size={16} color='var(--accent)' /> PDF / Image
                  </button>
                  <button onClick={handleCamera} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14.5px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Camera size={16} color='var(--accent)' /> Camera
                  </button>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleFileSelect} />

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              onPaste={e => {
                const items = e.clipboardData.items
                for (let item of items) {
                  if (item.type.startsWith('image/')) {
                    const file = item.getAsFile()
                    if (file) {
                      setAttachedFile(file)
                      e.preventDefault()
                    }
                    break
                  }
                }
              }}
              placeholder={attachedFile ? `${attachedFile.name} — sawaal poochho...` : (isMobile ? 'Sawaal poochho...' : 'Site pe koi sawaal poochho...')}
              disabled={loading}
              style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: isMobile ? '15px' : '16px', outline: 'none', padding: '6px 0' }}
            />

            <button
              onClick={recording ? stopRecording : startRecording}
              style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', borderRadius: '50%', background: recording ? 'var(--accent)' : 'none', border: 'none', color: recording ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Mic size={isMobile ? 16 : 19} />
            </button>

            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !attachedFile)}
              style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', borderRadius: '50%', background: (input.trim() || attachedFile) && !loading ? 'var(--accent)' : 'var(--bg-hover)', border: 'none', color: '#fff', cursor: (input.trim() || attachedFile) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseDown={e => (input.trim() || attachedFile) && (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={isMobile ? 15 : 17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

