import { useState, useEffect } from 'react'
import { IoDownloadOutline } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'

export default function ResumeWidget() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResumes(data || [])
    } catch (error) {
      console.error('Error loading resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || resumes.length >= 3) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      const { data, error } = await supabase
        .from('resumes')
        .insert([
          {
            user_id: user.id,
            file_name: file.name,
            file_path: fileName,
            file_url: urlData.publicUrl,
            label: file.name.replace(/\.[^/.]+$/, ''),
          },
        ])
        .select()
        .single()

      if (error) throw error
      setResumes([...resumes, data])
    } catch (error) {
      console.error('Error uploading resume:', error)
    }
  }

  const handleLabelChange = async (resumeId, newLabel) => {
    try {
      const { error } = await supabase
        .from('resumes')
        .update({ label: newLabel })
        .eq('id', resumeId)

      if (error) throw error
      setResumes(
        resumes.map((r) => (r.id === resumeId ? { ...r, label: newLabel } : r))
      )
    } catch (error) {
      console.error('Error updating label:', error)
    }
  }

  const handleDelete = async (resumeId, filePath) => {
    try {
      await supabase.storage.from('resumes').remove([filePath])

      const { error } = await supabase.from('resumes').delete().eq('id', resumeId)

      if (error) throw error
      setResumes(resumes.filter((r) => r.id !== resumeId))
    } catch (error) {
      console.error('Error deleting resume:', error)
    }
  }

  const handleDownload = async (resume) => {
    try {
      // Prefer downloading directly from Supabase Storage (works in browser + Tauri webview)
      if (resume?.file_path) {
        const { data, error } = await supabase.storage.from('resumes').download(resume.file_path)
        if (error) throw error

        const blobUrl = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = resume.file_name || 'resume.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
        return
      }

      // Fallback: open public URL
      if (resume?.file_url) {
        window.open(resume.file_url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error downloading resume:', error)

      // Last resort: try opening public URL in browser / external handler
      if (resume?.file_url) {
        try {
          const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined
          if (isTauri && window.__TAURI__?.core?.invoke) {
            await window.__TAURI__.core.invoke('plugin:shell|open', { path: resume.file_url })
          } else {
            window.open(resume.file_url, '_blank', 'noopener,noreferrer')
          }
        } catch (err) {
          console.error('Fallback open failed:', err)
        }
      }
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label
          className="hover-glow"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: resumes.length >= 3 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid',
            borderColor: resumes.length >= 3 
              ? 'var(--glass-border)' 
              : 'var(--accent)',
            borderRadius: '8px',
            cursor: resumes.length >= 3 ? 'not-allowed' : 'pointer',
            opacity: resumes.length >= 3 ? 0.5 : 1,
            fontSize: '0.875rem',
            color: resumes.length >= 3 
              ? 'var(--text-secondary)' 
              : 'var(--accent)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
          onMouseEnter={(e) => {
            if (resumes.length < 3) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = resumes.length >= 3 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {resumes.length >= 3 ? 'Max 3 resumes' : 'Upload Resume'}
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={resumes.length >= 3}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {resumes.length === 0 ? (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontStyle: 'italic',
            }}
          >
            No resumes uploaded
          </div>
        ) : (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="hover-glow"
              style={{
                padding: '0.9rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                animation: 'slideIn 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <input
                  type="text"
                  value={resume.label}
                  onChange={(e) => handleLabelChange(resume.id, e.target.value)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.55rem',
                    width: '100%',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--glass-border)'
                    handleLabelChange(resume.id, e.target.value)
                  }}
                />
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all',
                    whiteSpace: 'normal',
                  }}
                  title={resume.file_name}
                >
                  {resume.file_name}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  minWidth: '140px',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => handleDownload(resume)}
                  className="hover-glow"
                  aria-label={`Download ${resume.file_name}`}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                    minWidth: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--accent)'
                    e.target.style.borderColor = 'var(--accent)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--text-secondary)'
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <IoDownloadOutline size={16} />
                </button>
                <button
                  onClick={() => handleDelete(resume.id, resume.file_path)}
                  style={{
                    padding: '0.45rem 0.7rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.6,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    minWidth: '38px',
                    height: '38px',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '1'
                    e.target.style.color = '#ff4444'
                    e.target.style.background = 'rgba(255, 68, 68, 0.1)'
                    e.target.style.transform = 'scale(1.2) rotate(90deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '0.6'
                    e.target.style.color = 'var(--text-secondary)'
                    e.target.style.background = 'transparent'
                    e.target.style.transform = 'scale(1) rotate(0deg)'
                  }}
                  aria-label={`Delete ${resume.file_name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
