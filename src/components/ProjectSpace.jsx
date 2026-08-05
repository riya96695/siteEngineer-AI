import { useState } from 'react'
import { Plus, Save, FolderOpen, Calendar, FileText } from 'lucide-react'

export default function ProjectSpace() {

  // Projects ka state — JSON mein save hoga baad mein
  // Abhi local state mein rakh rahe hain
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectLocation, setNewProjectLocation] = useState('')
  const [workDone, setWorkDone] = useState('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Naya project create karne ki function
  const createProject = () => {
    if (!newProjectName.trim()) return
    const project = {
      id: Date.now(), // unique id ke liye timestamp
      name: newProjectName,
      location: newProjectLocation,
      created: new Date().toLocaleDateString(),
      logs: []
    }
    setProjects(prev => [...prev, project])
    setNewProjectName('')
    setNewProjectLocation('')
    setShowForm(false)
  }

  // Daily log save karne ki function
  const saveLog = () => {
    if (!workDone.trim() || !selectedProject) return
    const log = {
      date: new Date().toLocaleDateString(),
      work: workDone,
      notes: notes
    }
    // Selected project ke logs mein naya log add karo
    setProjects(prev => prev.map(p =>
      p.id === selectedProject.id
        ? { ...p, logs: [...p.logs, log] }
        : p
    ))
    // Selected project bhi update karo
    setSelectedProject(prev => ({
      ...prev,
      logs: [...prev.logs, log]
    }))
    setWorkDone('')
    setNotes('')
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ddd',
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
      background: '#1a1a1a'
    }}>

      {/* Left panel — Projects list */}
      <div style={{
        width: '280px',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600' }}>My Projects</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              width: '28px', height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: '#ff7a20',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* New project form — showForm true hone pe dikhega */}
        {showForm && (
          <div style={{
            background: '#242424',
            border: '1px solid #333',
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
              background: '#ff7a20',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              Create Project
            </button>
          </div>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <p style={{ color: '#444', fontSize: '13px' }}>
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
                border: `1px solid ${selectedProject?.id === project.id ? '#ff7a20' : '#333'}`,
                background: selectedProject?.id === project.id ? '#ff7a2010' : '#242424',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={14} color='#ff7a20' />
                <p style={{ fontSize: '13px', fontWeight: '500' }}>{project.name}</p>
              </div>
              <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                📍 {project.location || 'No location'}
              </p>
              <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                {project.logs.length} logs
              </p>
            </div>
          ))
        )}
      </div>

      {/* Right panel — Logs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflowY: 'auto' }}>
        {!selectedProject ? (
          <div style={{
            flex: 1, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px', color: '#444'
          }}>
            <FolderOpen size={40} />
            <p>Koi project select karo ya naya banao</p>
          </div>
        ) : (
          <>
            {/* Project header */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                📋 {selectedProject.name}
              </h2>
              <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                📍 {selectedProject.location} · Created: {selectedProject.created}
              </p>
            </div>

            {/* Logs list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedProject.logs.length === 0 ? (
                <p style={{ color: '#444', fontSize: '13px' }}>
                  Abhi koi log nahi — pehla entry daalo!
                </p>
              ) : (
                [...selectedProject.logs].reverse().map((log, i) => (
                  <div key={i} style={{
                    background: '#242424',
                    border: '1px solid #333',
                    borderLeft: '3px solid #ff7a20',
                    borderRadius: '10px',
                    padding: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Calendar size={12} color='#ff7a20' />
                      <span style={{ fontSize: '11px', color: '#ff7a20' }}>{log.date}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#ddd', marginBottom: '4px' }}>{log.work}</p>
                    {log.notes && (
                      <p style={{ fontSize: '12px', color: '#666' }}>Notes: {log.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add log form */}
            <div style={{
              background: '#242424',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: 'auto'
            }}>
              <h4 style={{ fontSize: '13px', color: '#aaa' }}>
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
                background: '#ff7a20', color: '#fff',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}>
                <Save size={14} />
                Save Log
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}