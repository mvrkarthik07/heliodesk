import { useState, useEffect } from 'react'
import WidgetShell from '../widgets/WidgetShell'
import TaskWidget from '../widgets/TaskWidget'
import NotesWidget from '../widgets/NotesWidget'
import GitHubWidget from '../widgets/GitHubWidget'
import ResumeWidget from '../widgets/ResumeWidget'
import ShortcutsWidget from '../widgets/ShortcutsWidget'
import MailShortcutsWidget from '../widgets/MailShortcutsWidget'
import ExternalAppsWidget from '../widgets/ExternalAppsWidget'
import PomodoroWidget from '../widgets/PomodoroWidget'
import CalendarWidget from '../widgets/CalendarWidget'
import PinnedLinksWidget from '../widgets/PinnedLinksWidget'
import CoordinatesBackground from './CoordinatesBackground'

export default function DashboardGrid({ widgetConfig = [], onOpenWidgetOverlay, windowWidth: propWindowWidth, windowHeight: propWindowHeight, focusMode = false }) {
  // Use props if provided (from App.jsx), otherwise use local state
  const [localWindowWidth, setLocalWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [localWindowHeight, setLocalWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768)
  
  const [notesHeaderActions, setNotesHeaderActions] = useState(null)

  const windowWidth = propWindowWidth !== undefined ? propWindowWidth : localWindowWidth
  const windowHeight = propWindowHeight !== undefined ? propWindowHeight : localWindowHeight

  useEffect(() => {
    if (propWindowWidth === undefined || propWindowHeight === undefined) {
      const handleResize = () => {
        setLocalWindowWidth(window.innerWidth)
        setLocalWindowHeight(window.innerHeight)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [propWindowWidth, propWindowHeight])

  const isMobile = windowWidth <= 640
  const isTablet = windowWidth > 640 && windowWidth <= 1024
  const isNarrowDesktop = windowWidth > 1024 && windowWidth <= 1400
  const isDesktop = windowWidth >= 1024
  
  // Core widgets that are always shown in focus mode
  const CORE_WIDGETS = ['tasks', 'notes', 'pomodoro']
  
  // Get enabled widgets
  let enabledWidgets =
    widgetConfig.length > 0
      ? widgetConfig.filter((w) => w.enabled)
      : [
          { id: 'tasks', enabled: true },
          { id: 'notes', enabled: true },
          { id: 'github', enabled: true },
          { id: 'resume', enabled: true },
          { id: 'shortcuts', enabled: true },
          { id: 'mail', enabled: true },
          { id: 'externalapps', enabled: true },
          { id: 'pomodoro', enabled: true },
          { id: 'calendar', enabled: true },
        ]

  // Filter widgets in focus mode - only show core widgets
  if (focusMode) {
    enabledWidgets = enabledWidgets.filter((w) => CORE_WIDGETS.includes(w.id))
  }

  const widgetTitles = {
    externalapps: 'External Apps',
    pinnedlinks: 'Pinned Links',
  }

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'tasks':
        return <TaskWidget />
      case 'notes':
        return <NotesWidget setHeaderActions={setNotesHeaderActions} />
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
        return <CalendarWidget layout="ios" compact showSubtitle={false} />
      case 'pinnedlinks':
        return <PinnedLinksWidget />
      default:
        return null
    }
  }

  // Calculate available height for dashboard on desktop
  const isRectangleScreen = windowWidth > windowHeight && isDesktop
  const isSmallRectangleScreen = isRectangleScreen && windowHeight < 800
  const headerHeight = isMobile ? 70 : isSmallRectangleScreen ? 64 : 72
  const welcomeHeight = isMobile ? 85 : isSmallRectangleScreen ? 50 : 60
  const gridPaddingTop = isDesktop ? (isSmallRectangleScreen ? 12 : 20) : 0
  const gridPaddingBottom = isDesktop ? (isSmallRectangleScreen ? 12 : 20) : 0
  const gridPadding = gridPaddingTop + gridPaddingBottom
  const availableHeight = isDesktop 
    ? Math.max(350, windowHeight - headerHeight - welcomeHeight - gridPadding)
    : null
  
  // Widgets that should use overlay on small rectangle screens
  const overlayWidgets = ['tasks', 'notes', 'github', 'resume', 'calendar']
  const shouldUseOverlay = isSmallRectangleScreen && onOpenWidgetOverlay

  // Dynamic grid - fully responsive with auto-sizing
  // In focus mode, keep a stable 2-column dashboard feel on larger screens and center it.
  const gridStyle = {
    gridTemplateColumns: isMobile
      ? '1fr'
      : focusMode
      ? (isTablet
          ? 'repeat(2, minmax(280px, 1fr))'
          : 'repeat(2, minmax(300px, 1fr))')
      : isTablet
      ? 'repeat(auto-fit, minmax(280px, 1fr))'
      : 'repeat(auto-fit, minmax(300px, 1fr))',
    gridAutoRows: 'minmax(200px, auto)',
    height: isDesktop && availableHeight ? `${availableHeight}px` : 'auto',
    overflow: isDesktop && availableHeight ? 'auto' : 'visible',
    justifyContent: focusMode && !isMobile ? 'center' : 'stretch',
    maxWidth: focusMode && !isMobile ? (isTablet ? '900px' : '1100px') : '1600px',
  }

  return (
    <>
      <CoordinatesBackground />
      <div
        style={{
          padding: isMobile 
            ? '1rem' 
            : isTablet 
            ? '1rem' 
            : isRectangleScreen && windowHeight < 800
            ? '0.75rem'
            : isNarrowDesktop 
            ? '1rem' 
            : '1rem',
          display: 'grid',
          gap: isMobile 
            ? '0.75rem' 
            : isTablet 
            ? '0.875rem' 
            : isRectangleScreen && windowHeight < 800
            ? '0.625rem'
            : '0.75rem',
          maxWidth: gridStyle.maxWidth,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          width: '100%',
          boxSizing: 'border-box',
          flex: isDesktop ? '1 1 auto' : 'none',
          minHeight: 0, // Important for grid overflow
          ...gridStyle,
        }}
      >
        {enabledWidgets.map((widget) => (
          <WidgetShell 
            key={widget.id} 
            title={widgetTitles[widget.id] || widget.id}
            isDesktop={isDesktop}
            noScroll={widget.id === 'pomodoro' || widget.id === 'calendar'}
            useOverlay={shouldUseOverlay && overlayWidgets.includes(widget.id)}
            onOpenOverlay={shouldUseOverlay && overlayWidgets.includes(widget.id) ? () => onOpenWidgetOverlay(widget.id) : undefined}
            headerActions={widget.id === 'notes' ? notesHeaderActions : undefined}
          >
            {renderWidget(widget.id)}
          </WidgetShell>
        ))}
      </div>
    </>
  )
}
