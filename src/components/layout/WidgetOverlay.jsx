import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import TaskWidget from '../widgets/TaskWidget'
import NotesWidget from '../widgets/NotesWidget'
import GitHubWidget from '../widgets/GitHubWidget'
import ResumeWidget from '../widgets/ResumeWidget'
import ShortcutsWidget from '../widgets/ShortcutsWidget'
import MailShortcutsWidget from '../widgets/MailShortcutsWidget'
import ExternalAppsWidget from '../widgets/ExternalAppsWidget'
import PomodoroWidget from '../widgets/PomodoroWidget'
import CalendarWidget from '../widgets/CalendarWidget'

const formatTitle = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

const renderWidget = (widgetId) => {
  switch (widgetId) {
    case 'tasks':
      return <TaskWidget />
    case 'notes':
      return <NotesWidget />
    case 'github':
      return <GitHubWidget />
    case 'resume':
      return <ResumeWidget />
    case 'shortcuts':
      return <ShortcutsWidget />
    case 'mail':
      return <MailShortcutsWidget />
    case 'externalapps':
      return <ExternalAppsWidget />
    case 'pomodoro':
      return <PomodoroWidget />
    case 'calendar':
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            height: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarWidget layout="full" disableScroll />
        </div>
      )
    default:
      return null
  }
}

export default function WidgetOverlay({ isOpen, onClose, widgetId, windowWidth, windowHeight }) {
  const isMobile = windowWidth <= 640
  const isSmallRectangleScreen = windowHeight < 800 && windowWidth > windowHeight && windowWidth >= 1024

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !widgetId) return null

  const stop = (e) => {
    e.stopPropagation()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={stop}
        className="glass"
        style={{
          width: isMobile ? '100%' : isSmallRectangleScreen ? '92%' : '85%',
          maxWidth: '1200px',
          height: widgetId === 'calendar'
            ? (isMobile ? '92%' : '86%')
            : isMobile
            ? '90%'
            : isSmallRectangleScreen
            ? '85%'
            : '80%',
          maxHeight: widgetId === 'calendar' ? 'none' : '900px',
          borderRadius: '16px',
          padding: widgetId === 'calendar'
            ? (isMobile ? '0.75rem' : '1rem')
            : isMobile
            ? '1rem'
            : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: widgetId === 'calendar' ? '0.5rem' : '1rem',
            paddingBottom: widgetId === 'calendar' ? '0.5rem' : '1rem',
            borderBottom: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              color: 'var(--text-primary)',
            }}
          >
            {formatTitle(widgetId)}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              e.target.style.color = 'var(--text-primary)'
              e.target.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.borderColor = 'var(--glass-border)'
            }}
          >
            <IoClose size={20} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: widgetId === 'calendar' ? 'hidden' : 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            display: 'flex',
            alignItems: widgetId === 'calendar' ? 'center' : 'stretch',
            justifyContent: widgetId === 'calendar' ? 'center' : 'stretch',
          }}
        >
          {renderWidget(widgetId)}
        </div>
      </div>
    </div>
  )
}
