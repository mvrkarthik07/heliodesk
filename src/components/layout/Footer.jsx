import { useState, useEffect } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 640

  return (
    <footer
      style={{
        padding: isMobile ? '1rem 1rem' : '1.5rem 2rem',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.02em',
          textAlign: 'center',
        }}
      >
        © {currentYear} HelioDesk. All rights reserved.
      </div>
    </footer>
  )
}
