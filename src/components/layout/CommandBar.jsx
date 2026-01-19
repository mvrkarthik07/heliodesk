import { useState, useEffect, useRef, useCallback } from 'react'
import { FaGithub, FaLinkedin, FaEnvelope, FaMicrosoft } from 'react-icons/fa'
import { SiGmail } from 'react-icons/si'
import { HiOutlineGlobeAlt } from 'react-icons/hi'
import { IoSettingsOutline } from 'react-icons/io5'

const COMMANDS = [
  {
    id: 'gmail',
    label: 'Open Gmail',
    icon: SiGmail,
    action: () => window.open('https://mail.google.com', '_blank'),
    category: 'Mail',
  },
  {
    id: 'outlook',
    label: 'Open Outlook',
    icon: FaMicrosoft,
    action: () => window.open('https://outlook.live.com', '_blank'),
    category: 'Mail',
  },
  {
    id: 'github',
    label: 'Open GitHub Profile',
    icon: FaGithub,
    action: (githubUrl) => {
      window.open(githubUrl || 'https://github.com', '_blank')
    },
    category: 'Social',
    requiresData: false,
  },
  {
    id: 'linkedin',
    label: 'Open LinkedIn Profile',
    icon: FaLinkedin,
    action: () => window.open('https://linkedin.com', '_blank'),
    category: 'Social',
  },
  {
    id: 'portfolio',
    label: 'Open Portfolio',
    icon: HiOutlineGlobeAlt,
    action: (portfolioUrl) => {
      if (portfolioUrl && portfolioUrl !== '#') {
        window.open(portfolioUrl, '_blank')
      }
    },
    category: 'Social',
    requiresData: false,
  },
  {
    id: 'new-task',
    label: 'Create New Task',
    icon: null,
    action: (onCreateTask) => {
      if (onCreateTask) {
        onCreateTask()
      }
    },
    category: 'Actions',
    requiresData: true,
  },
  {
    id: 'focus-mode',
    label: 'Toggle Focus Mode',
    icon: null,
    action: (onToggleFocus) => {
      if (onToggleFocus) {
        onToggleFocus()
      }
    },
    category: 'Actions',
    requiresData: true,
  },
  {
    id: 'settings',
    label: 'Navigate to Settings',
    icon: IoSettingsOutline,
    action: (onOpenSettings) => {
      if (onOpenSettings) {
        onOpenSettings()
      }
    },
    category: 'Navigation',
    requiresData: true,
  },
]

export default function CommandBar({
  isOpen,
  onClose,
  onOpenSettings,
  onToggleFocus,
  onCreateTask,
  githubUrl,
  portfolioUrl,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter commands based on search query
  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    )
  })

  // Execute command function
  const executeCommand = useCallback((command) => {
    // Get data for commands that need it
    let commandData = null
    if (command.id === 'github') {
      commandData = githubUrl
    } else if (command.id === 'portfolio') {
      commandData = portfolioUrl
    } else if (command.id === 'new-task') {
      commandData = onCreateTask
    } else if (command.id === 'focus-mode') {
      commandData = onToggleFocus
    } else if (command.id === 'settings') {
      commandData = onOpenSettings
    }

    command.action(commandData)
    onClose()
  }, [githubUrl, portfolioUrl, onCreateTask, onToggleFocus, onOpenSettings, onClose])

  // Reset selected index when search changes
  // Using useEffect is necessary here to reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Focus input when opened and reset state
  // Using useEffect is necessary here to reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setSearchQuery('')
      setSelectedIndex(0)
      // Focus input after state reset
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose, executeCommand])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [selectedIndex, filteredCommands.length])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="glass"
        style={{
          width: '90%',
          maxWidth: '600px',
          borderRadius: '12px',
          padding: '0',
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          animation: 'slideIn 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
              }
            }}
          />
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.5rem 0',
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon
              const isSelected = index === selectedIndex
              
              return (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1.25rem',
                    background: isSelected
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'transparent',
                    border: 'none',
                    borderLeft: isSelected
                      ? '3px solid var(--accent)'
                      : '3px solid transparent',
                    color: isSelected
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {Icon && (
                    <Icon
                      size={18}
                      style={{
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isSelected ? 500 : 400 }}>
                      {command.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.6,
                        marginTop: '0.125rem',
                      }}
                    >
                      {command.category}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <span>↑ ↓ to navigate • Enter to select • Esc to close</span>
        </div>
      </div>
    </div>
  )
}
