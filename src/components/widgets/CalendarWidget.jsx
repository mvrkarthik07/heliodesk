import { useState, useEffect } from 'react'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'

export default function CalendarWidget({ compact = false, layout = 'auto', disableScroll = false, showSubtitle = true } = {}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
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
  const isShortRectangle = windowWidth > windowHeight && windowHeight < 800
  const isCompact = (isShortRectangle && !isMobile) || compact
  const isOverlayLayout = layout === 'full'

  const gridGap =
    isOverlayLayout && !isMobile
      ? 'clamp(0.25rem, 0.6vw, 0.5rem)'
      : isCompact
      ? '0.2rem'
      : '0.25rem'

  const dayMinSize =
    isOverlayLayout && !isMobile
      ? 'clamp(34px, 3.8vw, 54px)'
      : isCompact
      ? (isMobile ? '24px' : '26px')
      : (isMobile ? '28px' : '32px')

  const dayFontSize =
    isOverlayLayout && !isMobile
      ? 'clamp(0.8rem, 1.05vw, 1rem)'
      : isCompact
      ? (isMobile ? '0.65rem' : '0.7rem')
      : (isMobile ? '0.7rem' : '0.75rem')

  const headerMarginBottom = isCompact ? (isMobile ? '0.5rem' : '0.625rem') : (isMobile ? '0.75rem' : '0.875rem')
  const dayNameMarginBottom = isCompact ? (isMobile ? '0.4rem' : '0.5rem') : (isMobile ? '0.5rem' : '0.625rem')
  const todayMarginTop = isCompact ? (isMobile ? '0.5rem' : '0.625rem') : (isMobile ? '0.625rem' : '0.75rem')
  const todayPadding = isCompact ? (isMobile ? '0.45rem' : '0.55rem') : (isMobile ? '0.5rem' : '0.625rem')
  const todayFontSize = isCompact ? (isMobile ? '0.65rem' : '0.7rem') : (isMobile ? '0.7rem' : '0.75rem')

  // Get first day of month and number of days
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 6 = Saturday

  // Get today's date for highlighting
  const today = new Date()
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  // Check if a date is selected
  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    )
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Day names (abbreviated)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToPreviousYear = () => {
    setCurrentDate(new Date(year - 1, month, 1))
  }

  const goToNextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(new Date(today))
  }

  // Handle date selection
  const handleDateClick = (day) => {
    setSelectedDate(new Date(year, month, day))
  }

  // Generate calendar days array
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const useRectLayout = layout === 'full' ? false : layout === 'ios' ? true : !isMobile

  const renderCalendarGrid = (size = 'normal') => {
    const compactGrid = size === 'compact'
    const localGap = compactGrid ? (isCompact ? '0.2rem' : '0.22rem') : gridGap
    const localDayMin = compactGrid ? (isCompact ? '20px' : '23px') : dayMinSize
    const localFont = compactGrid ? (isCompact ? '0.6rem' : '0.68rem') : dayFontSize

    return (
      <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: localGap,
          marginBottom: compactGrid ? (isCompact ? '0.25rem' : '0.35rem') : dayNameMarginBottom,
          flexShrink: 0,
        }}>
          {dayNames.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: compactGrid ? (isCompact ? '0.54rem' : '0.6rem') : (isMobile ? '0.65rem' : '0.7rem'),
                color: 'var(--text-secondary)',
                fontWeight: 500,
                padding: compactGrid ? (isCompact ? '0.08rem 0' : '0.16rem 0') : '0.25rem 0',
              }}
            >
              {day}
            </div>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: localGap,
          alignContent: 'start',
        }}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{
                    aspectRatio: '1',
                    minHeight: localDayMin,
                  }}
                />
              )
            }

            const dayIsToday = isToday(day)
            const dayIsSelected = isSelected(day)

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                  aspectRatio: '1',
                  minHeight: localDayMin,
                  background: dayIsSelected
                    ? 'rgba(255, 255, 255, 0.2)'
                    : dayIsToday
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  border: dayIsToday
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : dayIsSelected
                    ? '1px solid rgba(255, 255, 255, 0.4)'
                    : '1px solid transparent',
                  borderRadius: '6px',
                  color: dayIsSelected || dayIsToday
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontSize: localFont,
                  fontWeight: dayIsToday ? 600 : dayIsSelected ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!dayIsSelected && !dayIsToday) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dayIsSelected && !dayIsToday) {
                    e.target.style.background = 'transparent'
                    e.target.style.borderColor = 'transparent'
                    e.target.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  if (useRectLayout) {
    // iOS-style rectangular widget layout (reference)
    if (layout === 'ios') {
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const selectedDayName = weekdayNames[selectedDate.getDay()]
      const isSelectedToday = isToday(selectedDate.getDate())
      const iosDayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

      // For compact widgets we want a stable 6-row grid (42 cells) so the last week is never clipped.
      const calendarDaysPadded = [...calendarDays]
      while (calendarDaysPadded.length % 7 !== 0) calendarDaysPadded.push(null)
      while (calendarDaysPadded.length < 42) calendarDaysPadded.push(null)

      const cardGap = isCompact ? '0.55rem' : '0.75rem'
      const leftTitleSize = isCompact ? '0.85rem' : '0.95rem'
      const leftDateSize = isCompact ? 'clamp(1.9rem, 3.6vw, 2.6rem)' : 'clamp(2.2rem, 4vw, 3rem)'
      const monthTitleSize = isCompact ? '0.85rem' : '0.95rem'
      const dayFont = isCompact ? '0.7rem' : '0.78rem'

      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.9fr',
            gap: cardGap,
            height: '100%',
            minHeight: 0,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingTop: isCompact ? '0.1rem' : '0.2rem',
            }}
          >
            <div
              style={{
                fontSize: leftTitleSize,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: isCompact ? '0.2rem' : '0.3rem',
              }}
            >
              {selectedDayName}
            </div>
            <div
              style={{
                fontSize: leftDateSize,
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--text-primary)',
                marginBottom: showSubtitle ? (isCompact ? '0.3rem' : '0.45rem') : 0,
              }}
            >
              {selectedDate.getDate()}
            </div>
            {showSubtitle && (
              <div
                style={{
                  fontSize: isCompact ? '0.9rem' : '1rem',
                  color: 'var(--text-secondary)',
                  opacity: 0.85,
                  fontWeight: 500,
                }}
              >
                {isSelectedToday ? 'No Events Today' : 'No Events'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isCompact ? '0.2rem' : '0.3rem',
                paddingTop: isCompact ? '0.1rem' : '0.2rem',
              }}
            >
              <div
                style={{
                  fontSize: monthTitleSize,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                {monthNames[month]}
              </div>
              <div style={{ display: 'flex', gap: isCompact ? '0.12rem' : '0.2rem', alignItems: 'center' }}>
                <button
                  onClick={goToPreviousMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  title="Previous month"
                >
                  <IoChevronBack size={isCompact ? 12 : 14} />
                </button>
                <button
                  onClick={goToNextMonth}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  title="Next month"
                >
                  <IoChevronForward size={isCompact ? 12 : 14} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: isCompact ? '0.2rem' : '0.3rem',
                marginBottom: isCompact ? '0.2rem' : '0.3rem',
              }}
            >
              {iosDayLetters.map((d, idx) => (
                <div
                  key={`${d}-${idx}`}
                  style={{
                    textAlign: 'center',
                    fontSize: isCompact ? '0.6rem' : '0.68rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.9,
                    fontWeight: 600,
                    padding: isCompact ? '0.06rem 0' : '0.1rem 0',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: isCompact ? '0.2rem' : '0.3rem',
                alignContent: 'stretch',
              }}
            >
              {calendarDaysPadded.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} style={{ width: '100%', height: '100%' }} />
                }

                const dayIsToday = isToday(day)
                const dayIsSelected = isSelected(day)

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: dayIsSelected
                        ? 'rgba(255, 255, 255, 0.2)'
                        : dayIsToday
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'transparent',
                      border: dayIsToday
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : dayIsSelected
                        ? '1px solid rgba(255, 255, 255, 0.35)'
                        : '1px solid transparent',
                      borderRadius: '999px',
                      color: dayIsSelected || dayIsToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: dayFont,
                      fontWeight: dayIsSelected || dayIsToday ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    const rectGridSize = layout === 'ios' ? 'compact' : 'normal'
    const headerFontSize = layout === 'ios' ? (isCompact ? '0.8rem' : '0.9rem') : (isCompact ? '0.9rem' : '1rem')
    const chevronSize = layout === 'ios' ? (isCompact ? 12 : 16) : (isCompact ? 14 : 18)

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isCompact ? '0.3rem' : '0.45rem',
            gap: '0.5rem',
          }}>
            <div style={{
              fontSize: headerFontSize,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {monthNames[month]}
            </div>
            <div style={{ display: 'flex', gap: isCompact ? '0.15rem' : '0.25rem', alignItems: 'center' }}>
              <button
                onClick={goToPreviousMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--text-primary)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--text-secondary)'
                  e.target.style.background = 'transparent'
                }}
                title="Previous month"
              >
                <IoChevronBack size={chevronSize} />
              </button>
              <button
                onClick={goToNextMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--text-primary)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--text-secondary)'
                  e.target.style.background = 'transparent'
                }}
                title="Next month"
              >
                <IoChevronForward size={chevronSize} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%' }}>
              {renderCalendarGrid(rectGridSize)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      minHeight: 0,
    }}>
      {/* Navigation Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: headerMarginBottom,
        gap: '0.5rem',
        flexShrink: 0,
      }}>
        {/* Previous Month/Year */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <button
            onClick={goToPreviousYear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.background = 'transparent'
            }}
            title="Previous year"
          >
            <IoChevronBack size={isMobile ? 14 : 16} />
            <IoChevronBack size={isMobile ? 14 : 16} style={{ marginLeft: '-8px' }} />
          </button>
          <button
            onClick={goToPreviousMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.background = 'transparent'
            }}
            title="Previous month"
          >
            <IoChevronBack size={isMobile ? 16 : 18} />
          </button>
        </div>

        {/* Month/Year Display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.125rem',
          flex: 1,
        }}>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}>
            {monthNames[month]}
          </div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'var(--text-secondary)',
            fontWeight: 400,
          }}>
            {year}
          </div>
        </div>

        {/* Next Month/Year */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <button
            onClick={goToNextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.background = 'transparent'
            }}
            title="Next month"
          >
            <IoChevronForward size={isMobile ? 16 : 18} />
          </button>
          <button
            onClick={goToNextYear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-primary)'
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)'
              e.target.style.background = 'transparent'
            }}
            title="Next year"
          >
            <IoChevronForward size={isMobile ? 14 : 16} />
            <IoChevronForward size={isMobile ? 14 : 16} style={{ marginLeft: '-8px' }} />
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: disableScroll ? 'hidden' : 'auto',
        overflowX: 'hidden',
        paddingRight: '0.25rem',
      }}>
        {renderCalendarGrid('normal')}
      </div>

      {/* Today Button */}
      <button
        onClick={goToToday}
        style={{
          marginTop: todayMarginTop,
          padding: todayPadding,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          color: 'var(--text-secondary)',
          fontSize: todayFontSize,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontWeight: 500,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)'
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)'
          e.target.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.05)'
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          e.target.style.color = 'var(--text-secondary)'
        }}
      >
        Today
      </button>
    </div>
  )
}
