import { useState, useEffect } from 'react'
import { IoSettingsOutline } from 'react-icons/io5'

export default function Header({ onSignOut, onOpenSettings, focusMode, onToggleFocus }) {
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
  const isTablet = windowWidth > 640 && windowWidth <= 1024
  const isSmallRectangleScreen = windowHeight < 800 && windowWidth > windowHeight && windowWidth >= 1024

  return (
    <header
      className="glass"
      style={{
        padding: isMobile 
          ? '1rem 1rem'
          : isSmallRectangleScreen
          ? '1rem 1.5rem'
          : '1.5rem 2rem',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        zIndex: 100,
        background: 'rgba(18, 18, 18, 0.4)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        animation: 'slideIn 0.5s ease-out',
        boxSizing: 'border-box',
        flexShrink: 0,
        height: isMobile 
          ? '70px' 
          : isSmallRectangleScreen
          ? '64px'
          : '72px',
      }}
    >
      <h1
        style={{
          fontSize: isMobile 
            ? '1.5rem' 
            : isSmallRectangleScreen
            ? '1.75rem'
            : isTablet 
            ? '1.75rem' 
            : '2rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        }}
      >
        HelioDesk
      </h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginLeft: 'auto',
        }}
      >
        {onToggleFocus && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'var(--text-secondary)',
              userSelect: 'none',
            }}
            onClick={(e) => {
              e.preventDefault()
              onToggleFocus()
            }}
            title="Focus Mode"
          >
            <span>Focus</span>
            <div
              style={{
                position: 'relative',
                width: '51px',
                height: '31px',
                borderRadius: '15.5px',
                background: focusMode ? '#34C759' : 'rgba(255, 255, 255, 0.25)',
                transition: 'background-color 0.25s ease',
                cursor: 'pointer',
                flexShrink: 0,
                border: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: focusMode ? '22px' : '2px',
                  width: '27px',
                  height: '27px',
                  borderRadius: '13.5px',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.15)',
                  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
              />
            </div>
          </label>
        )}
        <button
          className="hover-glow"
          style={{
            padding: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
          }}
          onClick={onOpenSettings}
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
          title="Settings"
        >
          <IoSettingsOutline size={18} />
        </button>
        <button
          onClick={onSignOut}
          className="hover-glow"
          style={{
            padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            transition: 'all 0.3s ease',
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
          Sign out
        </button>
      </div>
    </header>
  )
}
