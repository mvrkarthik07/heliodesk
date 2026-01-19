import { useState, useEffect } from 'react'
import { FaMicrosoft, FaApple } from 'react-icons/fa'
import { SiGmail } from 'react-icons/si'
import { supabase } from '../../lib/supabase'

// Icon mapping for mail services
const MAIL_ICON_MAP = {
  gmail: SiGmail,
  outlook: FaMicrosoft,
  icloud: FaApple,
}

// Default mail shortcuts configuration
const DEFAULT_MAIL_SHORTCUTS = [
  { name: 'Gmail', url: 'https://mail.google.com', icon_key: 'gmail' },
  { name: 'Outlook', url: 'https://outlook.live.com', icon_key: 'outlook' },
  { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', icon_key: 'icloud' },
]

export default function MailShortcutsWidget() {
  const [shortcuts, setShortcuts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMailShortcuts()

    // Reload when settings panel saves changes
    const handleShortcutsUpdate = () => {
      loadMailShortcuts()
    }

    window.addEventListener('shortcutsUpdated', handleShortcutsUpdate)

    return () => {
      window.removeEventListener('shortcutsUpdated', handleShortcutsUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMailShortcuts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Load only mail-related shortcuts (gmail, outlook, and icloud)
      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', user.id)
        .in('icon_key', ['gmail', 'outlook', 'icloud'])
        .order('display_order', { ascending: true })

      if (error) throw error

      const existingIconKeys = (data || []).map((s) => s.icon_key)
      const missingDefaults = DEFAULT_MAIL_SHORTCUTS.filter(
        (defaultShortcut) => !existingIconKeys.includes(defaultShortcut.icon_key)
      )

      // If any default mail shortcuts are missing, add them
      if (missingDefaults.length > 0) {
        await addMissingDefaults(user.id, missingDefaults, data || [])
        // Reload after adding missing defaults
        const { data: updatedData } = await supabase
          .from('shortcuts')
          .select('*')
          .eq('user_id', user.id)
          .in('icon_key', ['gmail', 'outlook', 'icloud'])
          .order('display_order', { ascending: true })
        
        const allShortcuts = updatedData || data || []
        setShortcuts(
          allShortcuts.map((s) => ({
            ...s,
            icon: MAIL_ICON_MAP[s.icon_key] || FaApple,
          }))
        )
      } else if (data && data.length > 0) {
        // Use saved mail shortcuts
        setShortcuts(
          data.map((s) => ({
            ...s,
            icon: MAIL_ICON_MAP[s.icon_key] || FaApple,
          }))
        )
      } else {
        // Initialize with defaults if no mail shortcuts exist
        const defaultShortcutsWithIcons = DEFAULT_MAIL_SHORTCUTS.map((s) => ({
          ...s,
          icon: MAIL_ICON_MAP[s.icon_key] || FaApple,
        }))
        setShortcuts(defaultShortcutsWithIcons)

        // Save defaults to database
        await saveDefaults(user.id)
      }
    } catch (error) {
      console.error('Error loading mail shortcuts:', error)
      // Fallback to defaults on error
      const defaultShortcutsWithIcons = DEFAULT_MAIL_SHORTCUTS.map((s) => ({
        ...s,
        icon: MAIL_ICON_MAP[s.icon_key] || FaApple,
      }))
      setShortcuts(defaultShortcutsWithIcons)
    } finally {
      setLoading(false)
    }
  }

  const saveDefaults = async (userId) => {
    try {
      // Get current max display_order for shortcuts to append mail shortcuts
      const { data: existingShortcuts } = await supabase
        .from('shortcuts')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1)

      const maxOrder = existingShortcuts && existingShortcuts.length > 0 
        ? existingShortcuts[0].display_order + 1 
        : 0

      const shortcutsToInsert = DEFAULT_MAIL_SHORTCUTS.map((s, index) => ({
        user_id: userId,
        name: s.name,
        url: s.url,
        icon_key: s.icon_key,
        display_order: maxOrder + index,
      }))

      const { error } = await supabase.from('shortcuts').insert(shortcutsToInsert)
      if (error) throw error
    } catch (error) {
      console.error('Error saving default mail shortcuts:', error)
    }
  }

  const addMissingDefaults = async (userId, missingDefaults, existingMailShortcuts) => {
    try {
      // Get the max display_order from existing mail shortcuts, or from all shortcuts
      let maxOrder = 0
      if (existingMailShortcuts.length > 0) {
        maxOrder = Math.max(...existingMailShortcuts.map((s) => s.display_order || 0)) + 1
      } else {
        const { data: allShortcuts } = await supabase
          .from('shortcuts')
          .select('display_order')
          .eq('user_id', userId)
          .order('display_order', { ascending: false })
          .limit(1)
        maxOrder = allShortcuts && allShortcuts.length > 0 
          ? allShortcuts[0].display_order + 1 
          : 0
      }

      const shortcutsToInsert = missingDefaults.map((s, index) => ({
        user_id: userId,
        name: s.name,
        url: s.url,
        icon_key: s.icon_key,
        display_order: maxOrder + index,
      }))

      const { error } = await supabase.from('shortcuts').insert(shortcutsToInsert)
      if (error) throw error
    } catch (error) {
      console.error('Error adding missing mail shortcuts:', error)
    }
  }

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 640
  const isRectangleScreen = windowWidth > windowHeight // Rectangle screens (wider than tall)

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (shortcuts.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No mail shortcuts added. Add some in Settings.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isRectangleScreen ? 'row' : 'column',
        gap: '0.75rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: isRectangleScreen ? 'wrap' : 'nowrap',
        height: '100%',
      }}
    >
      {shortcuts.map((shortcut, index) => {
        const Icon = shortcut.icon
        return (
          <a
            key={shortcut.id || shortcut.icon_key || index}
            href={shortcut.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-glow"
            title={isRectangleScreen ? shortcut.name : undefined}
            style={{
              padding: isRectangleScreen 
                ? (isMobile ? '0.75rem' : '0.875rem')
                : (isMobile ? '0.75rem' : '0.875rem'),
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: isRectangleScreen ? '10px' : '8px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isRectangleScreen ? 'center' : 'flex-start',
              gap: isRectangleScreen ? 0 : '0.75rem',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
              width: isRectangleScreen ? 'auto' : '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.transform = isRectangleScreen ? 'translateY(-4px) scale(1.1)' : 'translateX(8px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.transform = 'translateX(0) translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Icon size={isRectangleScreen ? (isMobile ? 20 : 24) : 18} />
            {!isRectangleScreen && <span style={{ fontSize: '0.875rem' }}>{shortcut.name}</span>}
          </a>
        )
      })}
    </div>
  )
}
