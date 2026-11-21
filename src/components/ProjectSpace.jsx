import { useState, useEffect } from 'react'
import { Plus, Save, FolderOpen, Calendar, FileText, Trash2, Upload, MessageSquare, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'

export default function ProjectSpace({ user }) {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [sharedProjects, setSharedProjects] = useState([])
  const [showShareForm, setShowShareForm] = useState(false)
  const [shareEmail, setShareEmail] = useState('')

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [logs, setLogs] = useState([])
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectLocation, setNewProjectLocation] = useState('')
  const [workDone, setWorkDone] = useState('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProjects()
      loadSharedProjects()
    }
  }, [user])

  useEffect(() => {
    if (selectedProject) {
      loadLogs(selectedProject.id)
      loadCollaborators(selectedProject.id)
    }
  }, [selectedProject])

  const loadSharedProjects = async () => {
    const { data } = await supabase
      .from('project_collaborators')
      .select('project_id, role, projects(*)')
      .eq('user_email', user.email)

    if (data) {
      setSharedProjects(data.filter(d => d.projects).map(d => ({ ...d.projects, myRole: d.role })))
    }
  }

  const loadCollaborators = async (projectId) => {
    const { data } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)

    if (data) setCollaborators(data)
  }

  const shareProject = async () => {
    if (!shareEmail.trim() || !selectedProject) return

    const { error } = await supabase
      .from('project_collaborators')
      .insert([{
        project_id: selectedProject.id,
        user_email: shareEmail.trim().toLowerCase(),
        role: 'viewer'
      }])

    if (!error) {
      loadCollaborators(selectedProject.id)
      setShareEmail('')
      setShowShareForm(false)
    } else {
      alert('Share nahi ho paya — email check karo ya already shared hai.')
    }
  }

  const removeCollaborator = async (collabId) => {
    await supabase.from('project_collaborators').delete().eq('id', collabId)
    setCollaborators(prev => prev.filter(c => c.id !== collabId))
  }

  const loadProjects = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setProjects(data)
    setLoading(false)
  }

  const loadLogs = async (projectId) => {
    const { data } = await supabase
      .from('project_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (data) setLogs(data)
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return

    const { data } = await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        name: newProjectName,
        location: newProjectLocation
      }])
      .select()
      .single()

    if (data) {
      setProjects(prev => [data, ...prev])
      setNewProjectName('')
      setNewProjectLocation('')
      setShowForm(false)
    }
  }

  const deleteProject = async (e, projectId) => {
    e.stopPropagation()
    await supabase.from('project_logs').delete().eq('project_id', projectId)
    await supabase.from('projects').delete().eq('id', projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
      setLogs([])
    }
  }

  const saveLog = async () => {
    if (!workDone.trim() || !selectedProject) return

    const { data } = await supabase
      .from('project_logs')
      .insert([{
        project_id: selectedProject.id,
        work: workDone,
        notes: notes
      }])
      .select()
      .single()

    if (data) {
      setLogs(prev => [data, ...prev])
      setWorkDone('')
      setNotes('')
    }
  }

  const isOwner = selectedProject && user && selectedProject.user_id === user.id

  const uploadDocument = async (file) => {
    if (!selectedProject) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', selectedProject.id)

    try {
      await fetch('https://siteengineer-ai.onrender.com/api/upload', {
        method: 'POST',
        body: formData
      })
      alert('Document uploaded! Ab is project ke chat me isse related sawaal poochh sakte ho.')
    } catch {
      alert('Upload fail hua.')
    }
    setUploading(false)
  }

  const exportReport = () => {
    if (!selectedProject) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    doc.setFontSize(18)
    doc.setTextColor(255, 122, 32)
    doc.text('Site Inspection Report', pageWidth / 2, y, { align: 'center' })
    y += 12

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Project: ${selectedProject.name}`, 14, y)
    y += 7
    doc.text(`Location: ${selectedProject.location || 'N/A'}`, 14, y)
    y += 7
    doc.text(`Created: ${new Date(selectedProject.created_at).toLocaleDateString()}`, 14, y)
    y += 7
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, y)
    y += 12

    doc.setDrawColor(255, 122, 32)
    doc.line(14, y, pageWidth - 14, y)
    y += 10

    doc.setFontSize(13)
    doc.setTextColor(0, 0, 0)
    doc.text('Daily Work Log', 14, y)
    y += 10

    if (logs.length === 0) {
      doc.setFontSize(11)
      doc.setTextColor(120, 120, 120)
      doc.text('Koi log entry nahi hai.', 14, y)
    } else {
      doc.setFontSize(10)
      logs.slice().reverse().forEach((log) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        doc.setTextColor(255, 122, 32)
        doc.setFont(undefined, 'bold')
        doc.text(new Date(log.created_at).toLocaleDateString(), 14, y)
        y += 6

        doc.setTextColor(30, 30, 30)
        doc.setFont(undefined, 'normal')
        const workLines = doc.splitTextToSize(log.work, pageWidth - 28)
        doc.text(workLines, 14, y)
        y += workLines.length * 5 + 2

        if (log.notes) {
          doc.setTextColor(100, 100, 100)
          const noteLines = doc.splitTextToSize(`Notes: ${log.notes}`, pageWidth - 28)
          doc.text(noteLines, 14, y)
          y += noteLines.length * 5 + 2
        }

        y += 5
      })
    }

    doc.save(`${selectedProject.name.replace(/\s+/g, '_')}_report.pdf`)
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color-light)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    marginTop: '6px'
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>

      <div style={{
        width: '280px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        gap: '12px',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>My Projects</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              width: '28px', height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color-light)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <input
              placeholder="Project name"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Site location"
              value={newProjectLocation}
              onChange={e => setNewProjectLocation(e.target.value)}
              style={inputStyle}
            />
            <button onClick={createProject} style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              Create Project
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Abhi koi project nahi — + se banao!
          </p>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${selectedProject?.id === project.id ? 'var(--accent)' : 'var(--border-color-light)'}`,
                background: selectedProject?.id === project.id ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={14} color='var(--accent)' />
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{project.name}</p>
                </div>
                <button
                  onClick={e => deleteProject(e, project.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                📍 {project.location || 'No location'}
              </p>
            </div>
          ))
        )}

        {sharedProjects.length > 0 && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px', fontWeight: 600 }}>
              Shared With Me
            </p>
            {sharedProjects.map(project => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${selectedProject?.id === project.id ? 'var(--accent)' : 'var(--border-color-light)'}`,
                  background: selectedProject?.id === project.id ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={14} color='var(--accent)' />
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{project.name}</p>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  👁️ {project.myRole} access
                </p>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflowY: 'auto' }}>
        {!selectedProject ? (
          <div style={{
            flex: 1, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px', color: 'var(--text-muted)'
          }}>
            <FolderOpen size={40} />
            <p>Koi project select karo ya naya banao</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  📋 {selectedProject.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  📍 {selectedProject.location} · Created: {new Date(selectedProject.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isOwner && (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid var(--border-color-light)',
                    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    fontSize: '12.5px', cursor: uploading ? 'not-allowed' : 'pointer'
                  }}>
                    <Upload size={14} color='var(--accent)' />
                    {uploading ? 'Uploading...' : 'Upload Doc'}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      disabled={uploading}
                      onChange={e => {
                        const file = e.target.files[0]
                        if (file) uploadDocument(file)
                      }}
                    />
                  </label>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowShareForm(!showShareForm)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      border: '1px solid var(--border-color-light)',
                      background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                      fontSize: '12.5px', cursor: 'pointer'
                    }}
                  >
                    <Users size={14} color='var(--accent)' />
                    Share
                  </button>
                )}
                {!isOwner && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                    fontSize: '12.5px'
                  }}>
                    👁️ View-only access
                  </span>
                )}
                <button
                  onClick={exportReport}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid var(--border-color-light)',
                    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    fontSize: '12.5px', cursor: 'pointer'
                  }}
                >
                  📄 Export Report
                </button>
                <button
                  onClick={() => navigate(`/chat?project=${selectedProject.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: '12.5px', cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={14} />
                  Chat about this project
                </button>
              </div>
            </div>

            {isOwner && showShareForm && (
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color-light)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Team member ka email daalo — wo is project aur uske documents/logs dekh sakega (view-only).
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="colleague@example.com"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  />
                  <button onClick={shareProject} style={{
                    padding: '10px 16px', borderRadius: '8px', border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap'
                  }}>
                    Share
                  </button>
                </div>
                {collaborators.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {collaborators.map(c => (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: '6px'
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{c.user_email}</span>
                        <button
                          onClick={() => removeCollaborator(c.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Abhi koi log nahi — pehla entry daalo!
                </p>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color-light)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '10px',
                    padding: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Calendar size={12} color='var(--accent)' />
                      <span style={{ fontSize: '11px', color: 'var(--accent)' }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>{log.work}</p>
                    {log.notes && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Notes: {log.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {isOwner && (
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color-light)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: 'auto'
              }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <FileText size={14} style={{ marginRight: '6px' }} />
                  Aaj Ka Kaam Log Karo
                </h4>
                <textarea
                  placeholder="Aaj kya kaam kiya..."
                  value={workDone}
                  onChange={e => setWorkDone(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
                <input
                  placeholder="Notes / Issues (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={saveLog} style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  padding: '10px',
                  borderRadius: '8px', border: 'none',
                  background: 'var(--accent)', color: '#fff',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}>
                  <Save size={14} />
                  Save Log
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}