import { useState, useEffect } from 'react'

export default function WelcomeMessage({ user }) {
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
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const getUserName = () => {
    if (!user) return null
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'User'
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const userName = getUserName()
  const greeting = getGreeting()
  const fullMessage = userName ? `${greeting}, ${userName}!` : ''

  useEffect(() => {
    if (!fullMessage) return

    setDisplayedText('')
    let currentIndex = 0

    const typingInterval = setInterval(() => {
      if (currentIndex < fullMessage.length) {
        setDisplayedText(fullMessage.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        // Blink cursor after typing is complete
        const cursorInterval = setInterval(() => {
          setShowCursor((prev) => !prev)
        }, 2000)
        return () => clearInterval(cursorInterval)
      }
    }, 50)

    return () => clearInterval(typingInterval)
  }, [fullMessage])

  useEffect(() => {
    // Use a precise timing mechanism that aligns with second boundaries
    let timeoutId = null
    let intervalId = null
    
    const updateTime = () => {
      // Get current time and floor to exact second boundary
      const now = Date.now()
      const exactSecond = Math.floor(now / 1000) * 1000
      setCurrentTime(new Date(exactSecond))
    }
    
    const scheduleNextUpdate = () => {
      const now = Date.now()
      // Calculate milliseconds until next second boundary
      const msUntilNextSecond = 1000 - (now % 1000)
      
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId)
      
      // Schedule update at the exact second boundary
      timeoutId = setTimeout(() => {
        updateTime()
        
        // After first aligned update, use regular interval for subsequent seconds
        if (intervalId) clearInterval(intervalId)
        intervalId = setInterval(() => {
          updateTime()
        }, 1000)
      }, msUntilNextSecond)
    }
    
    // Initial update
    updateTime()
    
    // Schedule first aligned update to sync with second boundaries
    scheduleNextUpdate()
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDay = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
    })
  }

  if (!userName) return null

  return (
    <div
      style={{
        padding: isMobile 
          ? '0.75rem 1rem 0.5rem 1rem' 
          : isSmallRectangleScreen
          ? '0.5rem 1.5rem 0.375rem 1.5rem'
          : isTablet 
          ? '1rem 1.5rem 0.5rem 1.5rem' 
          : '1rem 2rem 0.5rem 2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.6s ease-out',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: isMobile 
            ? '0.625rem 0.875rem' 
            : isSmallRectangleScreen
            ? '0.5rem 1rem'
            : isTablet 
            ? '0.75rem 1.25rem' 
            : '0.75rem 1.5rem',
          borderRadius: isMobile ? '16px' : isSmallRectangleScreen ? '12px' : '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : isSmallRectangleScreen ? '0.875rem' : '1.25rem',
          flexWrap: 'nowrap',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: isMobile 
              ? '1rem' 
              : isSmallRectangleScreen
              ? '1rem'
              : isTablet 
              ? '1.15rem' 
              : '1.25rem',
            color: 'var(--text-primary)',
            fontWeight: 500,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
              marginRight: '0.25rem',
            }}
          >
            •
          </span>
          <span>
            {displayedText}
            <span
              style={{
                opacity: showCursor ? 1 : 0,
                transition: 'opacity 0.1s',
                marginLeft: '2px',
              }}
            >
              |
            </span>
          </span>
        </div>
        <div
          style={{
            fontSize: isMobile 
              ? '0.7rem' 
              : isSmallRectangleScreen
              ? '0.75rem'
              : isTablet 
              ? '0.8rem' 
              : '0.85rem',
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: isSmallRectangleScreen ? '0.375rem' : '0.5rem',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{formatDay()}</span>
          <span>•</span>
          <span>{formatDate()}</span>
          <span>•</span>
          <span>{formatTime()}</span>
        </div>
      </div>
    </div>
  )
}
