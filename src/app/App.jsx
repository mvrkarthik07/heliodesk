import { useState, useEffect, useRef } from 'react'
import { getCurrent as getDeepLinkCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { listen } from '@tauri-apps/api/event'
import { supabase } from '../lib/supabase'

// Custom hook for responsive design
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

import Header from '../components/layout/Header'
import DashboardGrid from '../components/layout/DashboardGrid'
import WelcomeMessage from '../components/layout/WelcomeMessage'
import CoordinatesBackground from '../components/layout/CoordinatesBackground'
import Footer from '../components/layout/Footer'
import SettingsPanel from '../components/layout/SettingsPanel'
import WidgetOverlay from '../components/layout/WidgetOverlay'
import CommandBar from '../components/layout/CommandBar'
import { FaGoogle } from 'react-icons/fa'
import '../styles/globals.css'

const DEFAULT_WIDGET_CONFIG = [
  { id: 'tasks', enabled: true },
  { id: 'notes', enabled: true },
  { id: 'github', enabled: true },
  { id: 'resume', enabled: true },
  { id: 'shortcuts', enabled: true },
  { id: 'mail', enabled: true },
  { id: 'externalapps', enabled: true },
          { id: 'pomodoro', enabled: true },
          { id: 'calendar', enabled: true },
          { id: 'pinnedlinks', enabled: true },
        ]

function App() {
  const windowSize = useWindowSize()
  const isMobile = windowSize.width <= 640
  const isTablet = windowSize.width > 640 && windowSize.width <= 1024
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('heliodesk_signing_in') === 'true'
    }
    return false
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [widgetConfig, setWidgetConfig] = useState(DEFAULT_WIDGET_CONFIG)
  const [overlayWidgetId, setOverlayWidgetId] = useState(null)
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('heliodesk_remember_me') === 'true'
    }
    return false
  })
  // About section is always visible on the login page (no scroll-triggered reveal)
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('heliodesk_focus_mode') === 'true'
    }
    return false
  })
  const [githubUrl, setGithubUrl] = useState(null)
  const [portfolioUrl, setPortfolioUrl] = useState(null)
  const loginContainerRef = useRef(null)
  const isTauri = typeof window !== 'undefined' && window.__TAURI__
  const processingAuthCallback = useRef(false)
  const lastCallbackTime = useRef(0)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    checkUser()

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email || 'no user')
        setUser(session?.user ?? null)
        // Ensure loading is false when we have a session state change
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED') {
          setLoading(false)
        }
        
        // Clear signing flags when signed in
        if (_event === 'SIGNED_IN' && session?.user) {
          localStorage.removeItem('heliodesk_signing_in')
          setIsSigningIn(false)
        }
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
    }
  }, [])

  // Single instance is enforced by tauri-plugin-single-instance.

  // Handle OAuth callback from deep link (Tauri) or URL hash/query (browser)
  useEffect(() => {
    if (!supabase) return

    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

    const clearSigningState = () => {
      localStorage.removeItem('heliodesk_signing_in')
      setIsSigningIn(false)
    }

    const extractAuthParams = (url) => {
      const urlString = String(url || '')
      let hash = ''
      let searchParams = new URLSearchParams()

      try {
        const urlObj = new URL(urlString)
        hash = urlObj.hash.substring(1)
        searchParams = urlObj.searchParams
      } catch {
        const hashMatch = urlString.match(/#(.+)/)
        if (hashMatch) hash = hashMatch[1]
        const queryMatch = urlString.match(/\?(.+?)(?:#|$)/)
        if (queryMatch) searchParams = new URLSearchParams(queryMatch[1])
      }

      const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams()
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
      const code = hashParams.get('code') || searchParams.get('code')
      const error = hashParams.get('error') || searchParams.get('error')

      return { accessToken, refreshToken, code, error }
    }

    const cleanupBrowserUrl = () => {
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    const processAuthUrl = async (url, source) => {
      const now = Date.now()
      if (now - lastCallbackTime.current < 1500) {
        return
      }
      lastCallbackTime.current = now

      const { accessToken, refreshToken, code, error } = extractAuthParams(url)
      const hasAuthParams = !!(code || accessToken || error)
      if (!hasAuthParams) return

      if (processingAuthCallback.current) return
      processingAuthCallback.current = true

      try {
        console.log(`=== PROCESSING AUTH CALLBACK (${source}) ===`)

        const { data: sessionCheck } = await supabase.auth.getSession()
        if (sessionCheck?.session) {
          setUser(sessionCheck.session.user)
          setLoading(false)
          clearSigningState()
          if (url === window.location.href) cleanupBrowserUrl()
          return
        }

        if (error) {
          throw new Error(error)
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          if (data?.user) {
            setUser(data.user)
            setLoading(false)
            clearSigningState()
            if (url === window.location.href) cleanupBrowserUrl()
            return
          }
          throw new Error('No user data returned from code exchange')
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) throw sessionError
          if (data?.user) {
            setUser(data.user)
            setLoading(false)
            clearSigningState()
            if (url === window.location.href) cleanupBrowserUrl()
            return
          }
        }

        throw new Error('No tokens or authorization code received.')
      } catch (err) {
        console.error('Auth callback error:', err)
        alert(`Authentication failed: ${err.message || 'Please try again.'}`)
        clearSigningState()
      } finally {
        processingAuthCallback.current = false
      }
    }

    const checkUrlForOAuth = () => {
      processAuthUrl(window.location.href, 'browser')
    }

    checkUrlForOAuth()

    const handleHashChange = () => {
      checkUrlForOAuth()
    }
    window.addEventListener('hashchange', handleHashChange)

    if (isTauri) {
      let unlistenOpenUrl = null
      let unlistenAppEvent = null

      const setupListener = async () => {
        try {
          const initialUrls = await getDeepLinkCurrent()
          if (initialUrls?.length) {
            await processAuthUrl(initialUrls[0], 'tauri:startup')
          }
        } catch (err) {
          console.log('No initial deep link or getCurrent not available:', err)
        }

        unlistenOpenUrl = await onOpenUrl((urls) => {
          const url = Array.isArray(urls) ? urls[0] : urls
          processAuthUrl(url, 'tauri:open-url')
        })

        // Also listen for deep-link events forwarded by single-instance plugin
        unlistenAppEvent = await listen('deep-link', (event) => {
          const payload = event?.payload
          const url = Array.isArray(payload) ? payload[0] : payload
          processAuthUrl(url, 'tauri:app-event')
        })
      }

      setupListener()

      return () => {
        window.removeEventListener('hashchange', handleHashChange)
        if (typeof unlistenOpenUrl === 'function') {
          unlistenOpenUrl()
        }
        if (typeof unlistenAppEvent === 'function') {
          unlistenAppEvent()
        }
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const checkUser = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      
      // CRITICAL: If no user but signing_in flag is set, clear it
      // This prevents button from being disabled when app restarts
      if (!user) {
        const signingInFlag = localStorage.getItem('heliodesk_signing_in')
        if (signingInFlag === 'true') {
          console.log('No user found but signing_in flag exists, clearing flag')
          localStorage.removeItem('heliodesk_signing_in')
          setIsSigningIn(false)
        }
      } else {
        // User exists, ensure signing_in flag is cleared
        localStorage.removeItem('heliodesk_signing_in')
        setIsSigningIn(false)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      // On error, also clear signing_in flag to prevent stuck state
      localStorage.removeItem('heliodesk_signing_in')
      setIsSigningIn(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!supabase) {
      alert('Supabase is not configured. Please check your .env file.')
      return
    }

    // Prevent multiple sign-in attempts
    if (isSigningIn) {
      console.log('Sign-in already in progress, ignoring duplicate request')
      return
    }

    // Check if already authenticated
    const { data: sessionCheck } = await supabase.auth.getSession()
    if (sessionCheck?.session) {
      console.log('Already authenticated, setting user state')
      setUser(sessionCheck.session.user)
      return
    }

    // TODO: Save remember me preference
    localStorage.setItem('heliodesk_remember_me', rememberMe.toString())
    // Set flag to indicate we're starting sign-in
    localStorage.setItem('heliodesk_signing_in', 'true')
    setIsSigningIn(true)

    try {
      // Redirect back to *this* app origin.
      // - Web dev/prod: http(s)://...
      // - Tauri dev: http://localhost:5173/5174/... (whatever Vite is using)
      // - Tauri build: tauri://localhost (no external localhost server required)
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })
      
      if (error) throw error
      } catch (error) {
        console.error('Error signing in:', error)
        localStorage.removeItem('heliodesk_signing_in')
        setIsSigningIn(false)
        alert(`Failed to sign in: ${error.message || 'Please check your configuration and try again.'}`)
      }
    }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Load GitHub and Portfolio URLs for CommandBar
  const loadUserLinks = async () => {
    if (!supabase || !user) return

    try {
      // Load GitHub username from user_settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('github_username')
        .eq('user_id', user.id)
        .maybeSingle()

      if (settingsData?.github_username) {
        setGithubUrl(`https://github.com/${settingsData.github_username}`)
      }

      // Load Portfolio URL from shortcuts
      const { data: shortcutsData } = await supabase
        .from('shortcuts')
        .select('url')
        .eq('user_id', user.id)
        .eq('icon_key', 'portfolio')
        .maybeSingle()

      if (shortcutsData?.url && shortcutsData.url !== '#') {
        setPortfolioUrl(shortcutsData.url)
      }
    } catch (error) {
      console.error('Error loading user links:', error)
    }
  }

  const loadWidgets = async () => {
    if (!supabase || !user) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('widgets')
        .select('widget_key, enabled')
        .eq('user_id', user.id)

      if (error) throw error

      if (!data || data.length === 0) {
        const defaultsToInsert = DEFAULT_WIDGET_CONFIG.map((w) => ({
          user_id: user.id,
          widget_key: w.id,
          enabled: w.enabled,
        }))
        await supabase.from('widgets').upsert(defaultsToInsert)
        setWidgetConfig(DEFAULT_WIDGET_CONFIG)
      } else {
        const mapped = DEFAULT_WIDGET_CONFIG.map((w) => {
          const row = data.find((d) => d.widget_key === w.id)
          return row ? { id: row.widget_key, enabled: row.enabled } : w
        })
        setWidgetConfig(mapped)
      }
    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }

  const toggleWidget = async (widgetId, currentlyEnabled) => {
    setWidgetConfig((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, enabled: !currentlyEnabled } : w
      )
    )

    if (!supabase || !user) return

    try {
      const { error } = await supabase.from('widgets').upsert({
        user_id: user.id,
        widget_key: widgetId,
        enabled: !currentlyEnabled,
      })
      if (error) throw error
    } catch (error) {
      console.error('Error updating widget toggle:', error)
    }
  }

  // Clear signing in state when user is authenticated
  useEffect(() => {
    if (user && isSigningIn) {
      console.log('User authenticated, clearing signing in state')
      setIsSigningIn(false)
      localStorage.removeItem('heliodesk_signing_in')
    }
  }, [user, isSigningIn])

  useEffect(() => {
    if (user) {
      loadWidgets()
      loadUserLinks()
    } else {
      setWidgetConfig(DEFAULT_WIDGET_CONFIG)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Keyboard shortcut for CommandBar (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandBarOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save focus mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heliodesk_focus_mode', focusMode.toString())
    }
  }, [focusMode])

  const handleCreateTask = () => {
    // Focus the task input in TaskWidget
    // We'll use a custom event to trigger this
    window.dispatchEvent(new CustomEvent('focusTaskInput'))
  }

  // (Removed) scroll + intersection observer logic for About section

  if (!supabase) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Configuration Error
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Missing Supabase environment variables.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Please create a <code style={{ color: 'var(--accent)' }}>.env</code> file in the project root with:
        </p>
        <pre
          style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            textAlign: 'left',
          }}
        >
          {`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
        </pre>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div
        ref={loginContainerRef}
        style={{
          minHeight: '100vh',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
        className="slide-in"
      >
        <CoordinatesBackground />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: isMobile ? '1.5rem' : '2rem',
            padding: isMobile ? '1rem' : '2rem',
            position: 'relative',
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
              animation: 'float 3s ease-in-out infinite',
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
            }}
          >
            HelioDesk
          </h1>
          <p
            style={{
              fontSize: isMobile ? '0.875rem' : isTablet ? '0.95rem' : '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginTop: isMobile ? '-0.5rem' : '-1rem',
              marginBottom: '0.5rem',
              position: 'relative',
              zIndex: 1,
              padding: isMobile ? '0 1rem' : '0',
            }}
          >
            Your dark-first, space-inspired career command center.
          </p>
          <div
            className="glass"
            style={{
              padding: isMobile ? '1.5rem' : isTablet ? '2rem' : '2.5rem',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              minWidth: isMobile ? '280px' : '320px',
              width: isMobile ? '90%' : 'auto',
              maxWidth: isMobile ? '100%' : 'none',
              animation: 'slideIn 0.6s ease-out',
              position: 'relative',
              zIndex: 1,
            }}
          >
                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="hover-glow"
                      style={{
                        padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
                        paddingRight: isMobile ? '2.5rem' : '3rem',
                        background: isSigningIn 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--accent)',
                        borderRadius: '8px',
                        color: isSigningIn
                          ? 'rgba(255, 255, 255, 0.4)'
                          : 'var(--accent)',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: 500,
                        cursor: isSigningIn ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        width: isMobile ? '100%' : 'auto',
                        opacity: isSigningIn ? 0.6 : 1,
                      }}
              onMouseEnter={(e) => {
                if (!isSigningIn) {
                  e.target.style.transform = 'translateY(-2px) scale(1.02)'
                  e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSigningIn) {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              <FaGoogle 
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.75rem' : '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  opacity: 0.8,
                }}
              />
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                userSelect: 'none',
                width: 'fit-content',
              }}
              onClick={(e) => {
                e.preventDefault()
                setRememberMe(!rememberMe)
              }}
            >
              <span>Remember me</span>
              <div
                style={{
                  position: 'relative',
                  width: '51px',
                  height: '31px',
                  borderRadius: '15.5px',
                  background: rememberMe ? '#34C759' : 'rgba(255, 255, 255, 0.25)',
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
                    left: rememberMe ? '22px' : '2px',
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
          </div>
        </div>
        {/* About section */}
        <div
          style={{
            marginTop: isMobile ? '2rem' : '4rem',
            paddingTop: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem',
            paddingLeft: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
            paddingRight: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
            paddingBottom: isMobile ? '2.5rem' : '4rem',
            color: 'var(--text-secondary)',
            fontSize: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
            lineHeight: 1.8,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            minHeight: '200px',
            background: 'rgba(10, 10, 10, 0.6)', // Semi-transparent dark background
            backdropFilter: 'blur(0px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '16px',
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: '1200px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: isMobile ? '1rem' : '1.5rem',
              fontSize: isMobile ? '2rem' : isTablet ? '3rem' : '4rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            About HelioDesk
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.25rem', alignItems: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
                padding: isMobile ? '0 0.5rem' : '0',
                maxWidth: '800px',
              }}
            >
              HelioDesk is a personal career command center designed to reduce context
              switching by bringing essential work signals into a single, focused workspace.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
                maxWidth: '800px',
                padding: isMobile ? '0 0.5rem' : '0',
              }}
            >
              It centralizes tasks, notes, developer activity, and read-only email snapshots
              in a calm, dark-first interface built for clarity and daily use.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
                maxWidth: '800px',
                padding: isMobile ? '0 0.5rem' : '0',
              }}
            >
              HelioDesk prioritizes function over customization, helping you stay oriented
              around what matters without turning productivity into configuration.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        widgets={widgetConfig}
        onToggleWidget={toggleWidget}
        user={user}
        onSignOut={handleSignOut}
      />
      <WidgetOverlay
        isOpen={!!overlayWidgetId}
        onClose={() => setOverlayWidgetId(null)}
        widgetId={overlayWidgetId}
        windowWidth={windowSize.width}
        windowHeight={windowSize.height}
      />
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onOpenSettings={() => {
          setCommandBarOpen(false)
          setSettingsOpen(true)
        }}
        onToggleFocus={() => {
          setFocusMode((prev) => !prev)
        }}
        onCreateTask={handleCreateTask}
        githubUrl={githubUrl}
        portfolioUrl={portfolioUrl}
      />
      <div
        style={{
          height: windowSize.width >= 1024 ? '100vh' : 'auto',
          minHeight: windowSize.width >= 1024 ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
          overflow: windowSize.width >= 1024 ? 'hidden' : 'visible',
          boxSizing: 'border-box',
        }}
      >
        <Header
          onSignOut={handleSignOut}
          onOpenSettings={() => setSettingsOpen(true)}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((prev) => !prev)}
        />
        <WelcomeMessage user={user} />
        <DashboardGrid 
          widgetConfig={widgetConfig} 
          onOpenWidgetOverlay={setOverlayWidgetId}
          windowWidth={windowSize.width}
          windowHeight={windowSize.height}
          focusMode={focusMode}
        />
        {windowSize.width <= 640 && <Footer />}
      </div>
    </>
  )
}

export default App
