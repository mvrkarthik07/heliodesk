import { useState, useEffect } from 'react'
import { FaEnvelope } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'

export default function EmailWidget() {
  const [emails, setEmails] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    checkGmailConnection()
  }, [])

  useEffect(() => {
    if (connected) {
      fetchGmailData()
    }
  }, [connected])

  const checkGmailConnection = async () => {
    try {
      setLoading(true)
      
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.provider_token) {
        setConnected(false)
        setLoading(false)
        return
      }

      // Verify the token actually has Gmail API access by making a lightweight test call
      const testRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        }
      )

      if (testRes.ok) {
        // Token works and has Gmail access
        setConnected(true)
      } else if (testRes.status === 401 || testRes.status === 403) {
        // Token is invalid or doesn't have Gmail scopes
        setConnected(false)
      } else {
        // Other error - assume not connected
        setConnected(false)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error checking Gmail connection:', error)
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        // Network issue - don't mark as disconnected, just set loading to false
        setLoading(false)
      } else {
        setConnected(false)
        setLoading(false)
      }
    }
  }

  const fetchGmailData = async () => {
    try {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.provider_token) {
        setConnected(false)
        setLoading(false)
        return
      }

      const token = session.provider_token

      /* ---------- UNREAD COUNT (RELIABLE) ---------- */
      const unreadRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!unreadRes.ok) {
        if (unreadRes.status === 401 || unreadRes.status === 403) {
          // Token expired or invalid - mark as disconnected
          setConnected(false)
          setLoading(false)
          return
        }
        throw new Error(`Gmail API error: ${unreadRes.status}`)
      }

      const unreadData = await unreadRes.json()
      setUnreadCount(unreadData.messagesUnread || 0)

      /* ---------- FETCH UNREAD EMAILS (INBOX ONLY) ---------- */
      const messagesRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread in:inbox&maxResults=5',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!messagesRes.ok) {
        if (messagesRes.status === 401 || messagesRes.status === 403) {
          setConnected(false)
          setLoading(false)
          return
        }
        throw new Error(`Gmail API error: ${messagesRes.status}`)
      }

      const messagesData = await messagesRes.json()

      if (!messagesData.messages) {
        setEmails([])
        setLoading(false)
        return
      }

      const details = await Promise.all(
        messagesData.messages.map(async (msg) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const d = await r.json()
          const headers = d.payload?.headers || []

          return {
            id: msg.id,
            subject:
              headers.find((h) => h.name === 'Subject')?.value ||
              '(No subject)',
            from:
              headers.find((h) => h.name === 'From')?.value ||
              'Unknown sender',
          }
        })
      )

      setEmails(details)
      setLoading(false)
    } catch (error) {
      console.error('Gmail fetch error:', error)
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        // Network issue - keep existing data, just stop loading
        setLoading(false)
      } else {
        // Other errors - clear emails and stop loading
        setEmails([])
        setLoading(false)
      }
      // If it's an auth error, mark as disconnected
      if (error.message?.includes('401') || error.message?.includes('403')) {
        setConnected(false)
      }
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Loading…
      </div>
    )
  }

  if (!connected) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '1rem 0',
        }}
      >
        <FaEnvelope size={24} style={{ opacity: 0.5 }} />
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          Gmail not connected
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          Connect in Settings
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaEnvelope size={18} />
          <span style={{ fontSize: '0.875rem' }}>Gmail</span>
        </div>

        {unreadCount > 0 && (
          <div
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {unreadCount}
          </div>
        )}
      </div>

      {emails.length === 0 ? (
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '1rem 0',
          }}
        >
          No unread emails
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {emails.map((email) => (
            <div
              key={email.id}
              style={{
                padding: '0.65rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: '0.25rem',
                }}
              >
                {email.subject}
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {email.from}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
