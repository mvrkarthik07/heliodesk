import { useState, useEffect } from 'react'
import { HiOutlineGlobeAlt } from 'react-icons/hi'
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5'

const STORAGE_KEY = 'heliodesk_pinned_links'

// Structure for easy migration to Supabase later
// {
//   id: string (UUID or timestamp),
//   name: string,
//   url: string,
//   icon: string (emoji or icon key),
//   createdAt: number (timestamp)
// }

export default function PinnedLinksWidget() {
  // Load initial links from localStorage
  const loadInitialLinks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('Error loading pinned links:', error)
    }
    return []
  }

  const [links, setLinks] = useState(loadInitialLinks)
  const [isAdding, setIsAdding] = useState(false)
  const [newLink, setNewLink] = useState({ name: '', url: '', icon: '' })
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

  // Save links to localStorage
  const saveLinks = (updatedLinks) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks))
      setLinks(updatedLinks)
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please remove some links.')
        // Could show a user-friendly notification here
      } else {
        console.error('Error saving pinned links:', error)
      }
    }
  }

  const handleAdd = () => {
    if (!newLink.name.trim() || !newLink.url.trim()) return

    const link = {
      id: Date.now().toString(),
      name: newLink.name.trim(),
      url: newLink.url.trim().startsWith('http') 
        ? newLink.url.trim() 
        : `https://${newLink.url.trim()}`,
      icon: newLink.icon.trim() || '🌐',
      createdAt: Date.now(),
    }

    const updated = [...links, link]
    saveLinks(updated)
    setNewLink({ name: '', url: '', icon: '' })
    setIsAdding(false)
  }

  const handleDelete = (id) => {
    const updated = links.filter((link) => link.id !== id)
    saveLinks(updated)
  }

  const isRectangleScreen = windowWidth > windowHeight

  if (links.length === 0 && !isAdding) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          height: '100%',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
          No pinned links yet
        </div>
        <button
          onClick={() => setIsAdding(true)}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--glass-border)'
          }}
        >
          <IoAddOutline size={16} />
          Add Link
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {isAdding && (
        <div
          style={{
            padding: '0.875rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          <input
            type="text"
            placeholder="Name"
            value={newLink.name}
            onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              } else if (e.key === 'Escape') {
                setIsAdding(false)
                setNewLink({ name: '', url: '', icon: '' })
              }
            }}
            autoFocus
          />
          <input
            type="text"
            placeholder="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <input
            type="text"
            placeholder="Icon (emoji or leave empty)"
            value={newLink.icon}
            onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                padding: '0.625rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--accent)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewLink({ name: '', url: '', icon: '' })
              }}
              style={{
                padding: '0.625rem',
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--glass-border)'
                e.target.style.color = 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: isRectangleScreen ? 'row' : 'column',
          gap: '0.75rem',
          flexWrap: isRectangleScreen ? 'wrap' : 'nowrap',
          flex: 1,
          overflowY: isRectangleScreen ? 'hidden' : 'auto',
          overflowX: 'hidden',
        }}
      >
        {links.map((link) => (
          <div
            key={link.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              width: isRectangleScreen ? 'auto' : '100%',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.borderColor = 'var(--glass-border)'
            }}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flex: 1,
                textDecoration: 'none',
                color: 'var(--text-primary)',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                {link.icon || '🌐'}
              </span>
              {!isRectangleScreen && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.url}
                  </div>
                </div>
              )}
            </a>
            <button
              onClick={() => handleDelete(link.id)}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ff4444'
                e.target.style.background = 'rgba(255, 68, 68, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-secondary)'
                e.target.style.background = 'transparent'
              }}
              title="Delete"
            >
              <IoTrashOutline size={16} />
            </button>
          </div>
        ))}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            padding: '0.625rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--glass-border)'
          }}
        >
          <IoAddOutline size={16} />
          Add Link
        </button>
      )}
    </div>
  )
}
