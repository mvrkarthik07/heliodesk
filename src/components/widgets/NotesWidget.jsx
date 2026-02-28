import { useState, useEffect, useRef } from 'react'
import { IoTrashOutline, IoSaveOutline } from 'react-icons/io5'
import { supabase } from '../../lib/supabase'

export default function NotesWidget({ setHeaderActions }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef(null)
  const isDeletingRef = useRef(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      // Don't reload if we just deleted
      if (isDeletingRef.current) {
        setLoading(false)
        isDeletingRef.current = false
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('notes')
        .select('content, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setNotes(data?.content || '')
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async (content) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('notes')
        .upsert(
          {
            user_id: user.id,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const handleChange = (e) => {
    // Reset deleting flag if user starts typing again
    if (isDeletingRef.current) {
      isDeletingRef.current = false
    }

    const newContent = e.target.value
    setNotes(newContent)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Skip auto-save when empty; require user to type something
    if (newContent.trim().length === 0) return

    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(newContent)
    }, 1000)
  }

  const handleBlur = () => {
    // Don't save if we just deleted
    if (isDeletingRef.current) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    // Only save on blur if there is content
    if (notes.trim().length > 0) {
      saveNotes(notes)
    }
  }

  const handleSave = async () => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    // Save immediately
    await saveNotes(notes)
  }

  const handleDelete = async () => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Mark that we're deleting to prevent reload
    isDeletingRef.current = true

    // Immediately clear the UI
    setNotes('')

    // Save empty string immediately and wait for it to complete
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from('notes').delete().eq('user_id', user.id)

        if (error) throw error
        
        // Reset deleting flag after a short delay to allow delete to complete
        setTimeout(() => {
          isDeletingRef.current = false
        }, 300)
      }
    } catch (error) {
      console.error('Error deleting notes:', error)
      isDeletingRef.current = false
    }
  }

  const handleKeyDown = (e) => {
    // Save on Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    // Note: Enter in textarea should create new line, so we don't prevent it here
    // Users can use the save button or Ctrl+S/Cmd+S to save
  }

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 640

  // Header actions (Save/Delete) to render in WidgetShell title row
  const NotesActions = () => (
    <>
      <button
        onClick={handleSave}
        className="hover-glow"
        title="Save note"
        aria-label="Save note"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.borderColor = 'var(--glass-border)'
        }}
      >
        <IoSaveOutline size={14} />
      </button>
      <button
        onClick={handleDelete}
        className="hover-glow"
        title="Delete note"
        aria-label="Delete note"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 0, 0, 0.15)'
          e.currentTarget.style.color = '#ff4444'
          e.currentTarget.style.borderColor = '#ff4444'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.borderColor = 'var(--glass-border)'
        }}
      >
        <IoTrashOutline size={14} />
      </button>
    </>
  )

  // Provide header actions to the WidgetShell (same row as title)
  useEffect(() => {
    if (!setHeaderActions) return
    setHeaderActions(<NotesActions />)
    return () => setHeaderActions(null)
  }, [setHeaderActions, notes])

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <textarea
        value={notes}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type Here..."
        style={{
          width: '100%',
          minHeight: isMobile ? '250px' : '300px',
          padding: isMobile ? '0.875rem' : '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: isMobile ? '16px' : '0.875rem', // Prevent zoom on iOS
          lineHeight: '1.6',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.background = 'rgba(255, 255, 255, 0.06)'
          e.target.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--glass-border)'
          e.target.style.background = 'rgba(255, 255, 255, 0.03)'
          e.target.style.boxShadow = 'none'
          handleBlur()
        }}
      />
    </div>
  )
}
