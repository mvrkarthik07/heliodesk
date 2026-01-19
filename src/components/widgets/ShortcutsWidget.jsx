import { useState, useEffect } from 'react'
import { FaLinkedin, FaGithub, FaEnvelope, FaMicrosoft } from 'react-icons/fa'
import { SiPerplexity, SiOpenai, SiGmail } from 'react-icons/si'
import { HiOutlineGlobeAlt } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

// Icon mapping
const ICON_MAP = {
  linkedin: FaLinkedin,
  portfolio: HiOutlineGlobeAlt,
  chatgpt: SiOpenai,
  perplexity: SiPerplexity,
  github: FaGithub,
  email: FaEnvelope,
  gmail: SiGmail,
  outlook: FaMicrosoft,
}

// Default shortcuts configuration (excluding mail shortcuts - they have their own widget)
const DEFAULT_SHORTCUTS = [
  { name: 'LinkedIn', url: 'https://linkedin.com', icon_key: 'linkedin' },
  { name: 'Portfolio', url: '#', icon_key: 'portfolio' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon_key: 'chatgpt' },
  { name: 'Perplexity', url: 'https://perplexity.ai', icon_key: 'perplexity' },
]

export default function ShortcutsWidget() {
  const [shortcuts, setShortcuts] = useState([])
  const [loading, setLoading] = useState(true)
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

  const loadShortcuts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Filter out mail shortcuts and external apps shortcuts (they have their own widgets)
      const nonMailShortcuts = (data || []).filter(
        (s) => s.icon_key !== 'gmail' && s.icon_key !== 'outlook' && s.icon_key !== 'icloud' && s.icon_key !== 'googledocs' && s.icon_key !== 'figma' && s.icon_key !== 'whatsapp' && s.icon_key !== 'telegram'
      )

      if (nonMailShortcuts.length > 0) {
        // Use saved shortcuts
        setShortcuts(
          nonMailShortcuts.map((s) => ({
            ...s,
            icon: ICON_MAP[s.icon_key] || HiOutlineGlobeAlt,
          }))
        )
      } else {
        // Initialize with defaults if no shortcuts exist
        const defaultShortcutsWithIcons = DEFAULT_SHORTCUTS.map((s) => ({
          ...s,
          icon: ICON_MAP[s.icon_key] || HiOutlineGlobeAlt,
        }))
        setShortcuts(defaultShortcutsWithIcons)

        // Save defaults to database
        await saveDefaults(user.id)
      }
    } catch (error) {
      console.error('Error loading shortcuts:', error)
      // Fallback to defaults on error
      const defaultShortcutsWithIcons = DEFAULT_SHORTCUTS.map((s) => ({
        ...s,
        icon: ICON_MAP[s.icon_key] || HiOutlineGlobeAlt,
      }))
      setShortcuts(defaultShortcutsWithIcons)
    } finally {
      setLoading(false)
    }
  }

  const saveDefaults = async (userId) => {
    try {
      const shortcutsToInsert = DEFAULT_SHORTCUTS.map((s, index) => ({
        user_id: userId,
        name: s.name,
        url: s.url,
        icon_key: s.icon_key,
        display_order: index,
      }))

      const { error } = await supabase.from('shortcuts').insert(shortcutsToInsert)
      if (error) throw error
    } catch (error) {
      console.error('Error saving default shortcuts:', error)
    }
  }

  useEffect(() => {
    loadShortcuts()
    
    // Reload shortcuts when settings panel saves changes
    const handleShortcutsUpdate = () => {
      loadShortcuts()
    }
    
    // Listen for custom event that Settings panel dispatches
    window.addEventListener('shortcutsUpdated', handleShortcutsUpdate)
    
    return () => {
      window.removeEventListener('shortcutsUpdated', handleShortcutsUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (shortcuts.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No shortcuts added. Add some in Settings.
      </div>
    )
  }

  const isMobile = windowWidth <= 640
  const isRectangleScreen = windowWidth > windowHeight // Rectangle screens (wider than tall)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isRectangleScreen ? 'row' : 'column',
        gap: isRectangleScreen ? '0.75rem' : '0.75rem',
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
