import { useState, useRef } from 'react'
import { Send, Mic, Plus, X, FileText, Camera } from 'lucide-react'

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! Main SiteEngineer AI hoon. IS codes, blueprints, calculations — kuch bhi poochho!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  // -------- Send --------
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userContent = attachedFile
      ? `📎 ${attachedFile.name}\n${input}`
      : input

    setMessages(prev => [...prev, { role: 'user', content: userContent }])
    setInput('')
    setLoading(true)

    try {
      if (attachedFile) {
        const formData = new FormData()
        formData.append('file', attachedFile)
        await fetch('http://localhost:8000/api/upload', { method: 'POST', body: formData })
        setAttachedFile(null)
      }

      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          chat_history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Backend connect nahi ho raha!' }])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  // -------- Voice --------
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
          const res = await fetch('http://localhost:8000/api/voice', {
            method: 'POST',
            body: formData
          })
          const data = await res.json()
          if (data.text) {
            const voiceText = data.text
            setMessages(prev => [...prev, { role: 'user', content: `🎤 ${voiceText}` }])
            setLoading(true)
            const chatRes = await fetch('http://localhost:8000/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: voiceText,
                chat_history: messages.map(m => ({ role: m.role, content: m.content }))
              })
            })
            const chatData = await chatRes.json()
            setMessages(prev => [...prev, { role: 'assistant', content: chatData.response }])
            setLoading(false)
          }
        } catch {
          setLoading(false)
        }
      }
      mediaRecorder.start()
      setRecording(true)
    } catch { alert('Microphone access do!') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  // -------- File --------
  const handleFileSelect = e => {
    const file = e.target.files[0]
    if (file) { setAttachedFile(file); setShowAttachMenu(false) }
  }

  // -------- Camera --------
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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1a1a1a', height: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff7a2020', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a20', fontSize: '14px' }}>AI</div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '500' }}>Site Engineer Assistant</p>
          <p style={{ fontSize: '11px', color: '#ff7a20' }}>● Online — Powered by LLM + RAG</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
              fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
              background: msg.role === 'user' ? '#ff7a20' : '#242424',
              color: msg.role === 'user' ? '#fff' : '#ddd',
              border: msg.role === 'assistant' ? '1px solid #333' : 'none',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: '#242424', border: '1px solid #333', color: '#ff7a20', fontSize: '20px', letterSpacing: '4px' }}>···</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — Claude style */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #2a2a2a' }}>

        {/* Attached file chip */}
        {attachedFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#ff7a2015', border: '1px solid #ff7a2040', borderRadius: '20px', width: 'fit-content', marginBottom: '8px' }}>
            <FileText size={12} color='#ff7a20' />
            <span style={{ fontSize: '12px', color: '#ff7a20' }}>{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#ff7a20', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Main input bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#242424', border: '1px solid #333',
          borderRadius: '28px', padding: '8px 8px 8px 12px',
          transition: 'border 0.2s'
        }}
          onFocus={() => { }}
        >
          {/* + button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: showAttachMenu ? '#ff7a20' : '#333',
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={16} />
            </button>

            {/* Attach menu popup */}
            {showAttachMenu && (
              <div style={{
                position: 'absolute', bottom: '44px', left: 0,
                background: '#2a2a2a', border: '1px solid #333',
                borderRadius: '12px', padding: '6px',
                display: 'flex', flexDirection: 'column', gap: '2px',
                minWidth: '140px', zIndex: 10
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'none', color: '#ddd', cursor: 'pointer', fontSize: '13px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <FileText size={14} color='#ff7a20' /> PDF / Image
                </button>
                <button
                  onClick={handleCamera}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'none', color: '#ddd', cursor: 'pointer', fontSize: '13px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Camera size={14} color='#ff7a20' /> Camera
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={attachedFile ? `${attachedFile.name} — sawaal poochho...` : 'Site pe koi sawaal poochho...'}
            disabled={loading}
            style={{
              flex: 1, background: 'none', border: 'none',
              color: '#ddd', fontSize: '14px', outline: 'none',
            }}
          />

          {/* Mic button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: recording ? '#ff7a20' : 'none',
              border: 'none', color: recording ? '#fff' : '#888',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Mic size={16} />
          </button>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: input.trim() && !loading ? '#ff7a20' : '#333',
              border: 'none', color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseDown={e => input.trim() && (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

