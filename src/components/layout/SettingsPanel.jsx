import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Hook for responsive design
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

export default function SettingsPanel({
  isOpen,
  onClose,
  widgets = [],
  onToggleWidget,
  user,
  onSignOut,
}) {
  const windowSize = useWindowSize()
  const isMobile = windowSize.width <= 640
  
  const [resumes, setResumes] = useState([])
  const [shortcuts, setShortcuts] = useState([])
  const [githubUsername, setGithubUsername] = useState('')

  useEffect(() => {
    const loadResumes = async () => {
      if (!supabase || !user) return
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('id, label, file_name, file_url, file_path')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setResumes(
          (data || []).map((r) => ({
            id: r.id,
            label: r.label,
            fileName: r.file_name,
            fileUrl: r.file_url,
            filePath: r.file_path,
          }))
        )
      } catch (err) {
        console.error('Error loading resumes in settings:', err)
      }
    }

    const loadShortcuts = async () => {
      if (!supabase || !user) return
      try {
        const { data, error } = await supabase
          .from('shortcuts')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true })
        if (error) throw error
        setShortcuts(data || [])
      } catch (err) {
        console.error('Error loading shortcuts in settings:', err)
      }
    }

    const loadUserSettings = async () => {
      if (!supabase || !user) return
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('github_username')
          .eq('user_id', user.id)
          .maybeSingle()
        if (error) throw error
        setGithubUsername(data?.github_username || '')
      } catch (err) {
        console.error('Error loading user settings:', err)
      }
    }

    if (isOpen) {
      loadResumes()
      loadShortcuts()
      loadUserSettings()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (!isOpen) return
  }, [isOpen])

  if (!isOpen) return null

  const widgetTitles = {
    externalapps: 'External Apps',
  }

  const handleRename = (id, newLabel) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, label: newLabel } : r))
    )

    if (!supabase || !user) return
    supabase
      .from('resumes')
      .update({ label: newLabel })
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) console.error('Error renaming resume:', error)
      })
  }

  const handleDelete = (id) => {
    const target = resumes.find((r) => r.id === id)
    setResumes((prev) => prev.filter((r) => r.id !== id))

    if (!supabase || !user) return

    const removeFromTable = async () => {
      try {
        if (target?.filePath) {
          await supabase.storage.from('resumes').remove([target.filePath])
        }
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
      } catch (err) {
        console.error('Error deleting resume:', err)
      }
    }
    removeFromTable()
  }

  const handleShortcutUpdate = async (id, field, value) => {
    // Optimistically update UI
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )

    if (!supabase || !user) return

    try {
      const { error } = await supabase
        .from('shortcuts')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      
      // Dispatch event to notify ShortcutsWidget to reload
      window.dispatchEvent(new CustomEvent('shortcutsUpdated'))
    } catch (error) {
      console.error('Error updating shortcut:', error)
      // Revert on error - reload shortcuts
      const { data } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
      if (data) setShortcuts(data)
    }
  }

  const handleGitHubUsernameUpdate = async (username) => {
    setGithubUsername(username)

    if (!supabase || !user) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          github_username: username.trim() || null,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      
      // Dispatch event to notify GitHubWidget to reload
      window.dispatchEvent(new CustomEvent('githubUsernameUpdated'))
    } catch (error) {
      console.error('Error updating GitHub username:', error)
    }
  }

  const stop = (e) => e.stopPropagation()

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 999,
        display: 'flex',
        justifyContent: isMobile ? 'center' : 'flex-end',
      }}
    >
      <aside
        onClick={stop}
        style={{
          width: isMobile ? '100%' : '420px',
          maxWidth: isMobile ? '100%' : '90vw',
          height: '100%',
          background: 'rgba(12,12,12,0.95)',
          borderLeft: isMobile ? 'none' : '1px solid var(--glass-border)',
          borderTop: isMobile ? '1px solid var(--glass-border)' : 'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: isMobile ? '1rem' : '1.5rem',
          overflowY: 'auto',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
                  <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 600 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              width: '32px',
              height: '32px',
            }}
          >
            ×
          </button>
        </div>

        <Section title="Dashboard Widgets">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {widgets.map((w) => (
              <label
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                  {widgetTitles[w.id] || w.id}
                </span>
                <input
                  type="checkbox"
                  checked={w.enabled}
                  onChange={() => onToggleWidget(w.id, w.enabled)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Connected Accounts (Read-only)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow label="Google" status="Connected" />
            <StatusRow label="GitHub" status="Public" />
          </div>
        </Section>

        <Section title="GitHub Configuration">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                }}
              >
                GitHub Username
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onBlur={(e) => handleGitHubUsernameUpdate(e.target.value)}
                placeholder="Your GitHub Username"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                }}
              />
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                }}
              >
                Enter your GitHub username to display your public stats
              </div>
            </div>
          </div>
        </Section>

        <Section title="Documents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resumes.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No resumes added.
              </div>
            )}
            {resumes.map((resume) => (
              <div
                key={resume.id}
                style={{
                  padding: '0.85rem',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <input
                    value={resume.label}
                    onChange={(e) => handleRename(resume.id, e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                    }}
                  />
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={resume.fileName}
                  >
                    {resume.fileName}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => window.open(resume.fileUrl || '#', '_blank')}
                    aria-label={`Download ${resume.fileName}`}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      minWidth: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    style={{
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.7rem',
                      minWidth: '38px',
                      height: '38px',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shortcuts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {shortcuts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No shortcuts added.
              </div>
            ) : (
              shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={shortcut.name || ''}
                      onChange={(e) => handleShortcutUpdate(shortcut.id, 'name', e.target.value)}
                      onBlur={(e) => handleShortcutUpdate(shortcut.id, 'name', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                      }}
                      placeholder="Link name"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      URL
                    </label>
                    <input
                      type="url"
                      value={shortcut.url || ''}
                      onChange={(e) => handleShortcutUpdate(shortcut.id, 'url', e.target.value)}
                      onBlur={(e) => {
                        let url = e.target.value.trim()
                        // Add https:// if no protocol
                        if (url && !url.match(/^https?:\/\//i)) {
                          url = 'https://' + url
                        }
                        handleShortcutUpdate(shortcut.id, 'url', url)
                        e.target.value = url
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                      }}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Account Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={onSignOut}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
              }}
            >
              Sign out
            </button>
            <button
              onClick={() => alert('Delete account requires confirmation.')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                background: 'rgba(255, 68, 68, 0.08)',
                color: '#ffdddd',
              }}
            >
              Delete account
            </button>
          </div>
        </Section>
      </aside>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.75rem',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function StatusRow({ label, status, actionLabel, onAction }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <div style={{ color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{status}</span>
        {actionLabel && (
          <button
            onClick={onAction}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
