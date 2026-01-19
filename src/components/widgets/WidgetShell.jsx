import { useState, useEffect } from 'react'
import { IoExpandOutline } from 'react-icons/io5'

export default function WidgetShell({ title, children, isDesktop = false, noScroll = false, useOverlay = false, onOpenOverlay, headerActions }) {
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
  const isRectangleScreen = windowWidth > windowHeight && isDesktop
  const isSmallRectangleScreen = isRectangleScreen && windowHeight < 800

  const formatTitle = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  // Natural sizing - let widgets size based on content
  const widgetHeight = 'auto'

  // Calculate padding - reduce padding on smaller rectangle screens
  const basePadding = noScroll && isDesktop 
    ? (isMobile ? '0.625rem' : isSmallRectangleScreen ? '0.625rem' : '0.75rem')
    : (isMobile ? '0.875rem' : isSmallRectangleScreen ? '0.75rem' : '1rem')
  
  const paddingStyle = isRectangleScreen && !noScroll && isDesktop
    ? { 
        paddingTop: basePadding,
        paddingBottom: basePadding,
        paddingLeft: basePadding,
        paddingRight: '0.25rem' // Minimal right padding for scrollbar edge alignment
      }
    : { padding: basePadding }

  return (
    <div
      className="glass slide-in"
      style={{
        borderRadius: '12px',
        ...paddingStyle,
        display: 'flex',
        flexDirection: 'column',
        height: widgetHeight,
        minHeight: isMobile ? '180px' : isDesktop ? 0 : '200px',
        maxHeight: 'none',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        cursor: useOverlay ? 'pointer' : 'default',
        isolation: 'isolate',
      }}
      onClick={useOverlay && onOpenOverlay ? (e) => {
        // Only open overlay if clicking on the shell container itself or non-interactive areas
        // Allow interactive elements (buttons, links, inputs) to work normally
        const target = e.target
        const isInteractive = target.tagName === 'BUTTON' || 
                              target.tagName === 'A' || 
                              target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' ||
                              target.closest('button') ||
                              target.closest('a') ||
                              target.closest('input') ||
                              target.closest('textarea')
        
        if (!isInteractive) {
          onOpenOverlay()
        }
      } : undefined}
      onMouseEnter={(e) => {
        if (useOverlay) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)'
        } else {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: noScroll && isDesktop 
          ? (isMobile ? '0.4rem' : isSmallRectangleScreen ? '0.375rem' : '0.5rem')
          : (isMobile ? '0.625rem' : isSmallRectangleScreen ? '0.5rem' : '0.75rem'), flexShrink: 0, gap: '0.5rem' }}>
        <h2
          style={{
          fontSize: noScroll && isDesktop 
            ? (isMobile ? '0.7rem' : isSmallRectangleScreen ? '0.7rem' : '0.75rem')
            : (isMobile ? '0.75rem' : isSmallRectangleScreen ? '0.75rem' : '0.8rem'),
          fontWeight: 600,
          textTransform: 'capitalize',
          color: 'var(--text-secondary)',
          letterSpacing: '0.02em',
          transition: 'color 0.3s ease',
          flex: 1,
          }}
        >
          {formatTitle(title)}
        </h2>
        {headerActions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {headerActions}
          </div>
        )}
        {useOverlay && (
          <IoExpandOutline 
            size={18} 
            style={{
              color: 'var(--text-secondary)',
              opacity: 0.6,
            }}
          />
        )}
      </div>
      <div 
        className={`widget-content-scroll ${isRectangleScreen && !noScroll && isDesktop ? 'scrollbar-edge' : ''}`}
        style={{ 
          flex: 1,
          minHeight: 0, // Critical for flex child to shrink
          overflowY: noScroll ? 'hidden' : 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
