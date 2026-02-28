import { useState, useEffect, useRef } from 'react'
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes
const LONG_BREAK = 15 * 60 // 15 minutes

export default function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState('work') // 'work', 'shortBreak', 'longBreak'
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const intervalRef = useRef(null)

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
  const isRectangleScreen = windowWidth > windowHeight // Rectangle screens (desktop)

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          // Use setTimeout to ensure state updates complete before handling completion
          setTimeout(() => {
            handleTimerComplete()
          }, 100)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning])

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Play notification sound (optional - browser beep)
    if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') {
      new Notification(mode === 'work' ? 'Pomodoro Complete!' : 'Break Complete!', {
        body: mode === 'work' ? 'Time for a break!' : 'Time to get back to work!',
        icon: '/vite.svg',
      })
    }

    if (mode === 'work') {
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)

      // After 4 pomodoros, take a long break, otherwise short break
      if (newCompleted % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
      } else {
        setMode('shortBreak')
        setTimeLeft(SHORT_BREAK)
      }
    } else {
      // Break finished, start work session
      setMode('work')
      setTimeLeft(WORK_DURATION)
    }
  }

  const handleStartPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    clearInterval(intervalRef.current)
    if (mode === 'work') {
      setTimeLeft(WORK_DURATION)
    } else if (mode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK)
    } else {
      setTimeLeft(LONG_BREAK)
    }
  }

  const handleModeChange = (newMode) => {
    if (isRunning) return // Don't allow mode change while running

    setIsRunning(false)
    clearInterval(intervalRef.current)

    if (newMode === 'work') {
      setTimeLeft(WORK_DURATION)
      setMode('work')
    } else if (newMode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK)
      setMode('shortBreak')
    } else if (newMode === 'longBreak') {
      setTimeLeft(LONG_BREAK)
      setMode('longBreak')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    let total = WORK_DURATION
    if (mode === 'shortBreak') total = SHORT_BREAK
    if (mode === 'longBreak') total = LONG_BREAK
    return ((total - timeLeft) / total) * 100
  }


  useEffect(() => {
    // Request notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      // Only request if not already granted/denied
    }
  }, [])

  // Calculate responsive sizes based on viewport - Apple-style compact design
  // Use clamp() for fluid typography and sizing that adapts to available space
  const timerSize = isMobile 
    ? 'clamp(80px, 25vh, 120px)' 
    : isRectangleScreen 
    ? 'clamp(100px, 30vw, 140px)'
    : 'clamp(100px, 25vh, 140px)'
  
  const timerFontSize = isMobile 
    ? 'clamp(1rem, 4vw, 1.25rem)' 
    : isRectangleScreen 
    ? 'clamp(1.25rem, 3vw, 1.75rem)'
    : 'clamp(1.1rem, 3.5vw, 1.5rem)'

  const buttonFontSize = isMobile ? '0.625rem' : '0.7rem'
  const controlButtonSize = isMobile ? '0.7rem' : '0.8rem'
  const iconSize = isMobile ? 10 : 12

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Mode selector - top, compact */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          justifyContent: 'center',
          flexWrap: 'nowrap',
          flexShrink: 0,
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => handleModeChange('work')}
          disabled={isRunning}
          style={{
            padding: isMobile ? '0.25rem 0.4rem' : '0.3rem 0.5rem',
            fontSize: buttonFontSize,
            fontWeight: mode === 'work' ? 600 : 400,
            background: mode === 'work' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${mode === 'work' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isRunning ? 0.5 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 1,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              mode === 'work' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          Work
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          disabled={isRunning}
          style={{
            padding: isMobile ? '0.25rem 0.4rem' : '0.3rem 0.5rem',
            fontSize: buttonFontSize,
            fontWeight: mode === 'shortBreak' ? 600 : 400,
            background: mode === 'shortBreak' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${mode === 'shortBreak' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isRunning ? 0.5 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 1,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              mode === 'shortBreak' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          Short
        </button>
        <button
          onClick={() => handleModeChange('longBreak')}
          disabled={isRunning}
          style={{
            padding: isMobile ? '0.25rem 0.4rem' : '0.3rem 0.5rem',
            fontSize: buttonFontSize,
            fontWeight: mode === 'longBreak' ? 600 : 400,
            background: mode === 'longBreak' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${mode === 'longBreak' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isRunning ? 0.5 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 1,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              mode === 'longBreak' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          Long
        </button>
      </div>

      {/* Timer display - center, takes available space */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          flex: 1,
          minHeight: 0,
          padding: '0.25rem 0',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: timerSize,
            height: timerSize,
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Progress circle background - hidden on rectangle screens */}
          {!isRectangleScreen && (
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', transform: 'rotate(-90deg)', top: 0, left: 0 }}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={mode === 'work' ? 'rgba(255, 107, 107, 0.8)' : 'rgba(107, 255, 107, 0.8)'}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
          )}
          {/* Time text */}
          <div
            style={{
              fontSize: timerFontSize,
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.05em',
              zIndex: 1,
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Controls - bottom, compact */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          paddingTop: '0.5rem',
        }}
      >
        <button
          onClick={handleStartPause}
          style={{
            padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
            fontSize: controlButtonSize,
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {isRunning ? <FaPause size={iconSize} /> : <FaPlay size={iconSize} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: isMobile ? '0.4rem' : '0.5rem',
            fontSize: controlButtonSize,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <FaRedo size={iconSize} />
        </button>
      </div>
    </div>
  )
}
