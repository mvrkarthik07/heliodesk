import { useState, useEffect } from 'react'
import { FaGithub } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'

export default function GitHubWidget() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [githubUsername, setGithubUsername] = useState(null)

  useEffect(() => {
    loadGitHubUsername()

    // Reload when GitHub username is updated in settings
    const handleGitHubUsernameUpdate = () => {
      loadGitHubUsername()
    }

    window.addEventListener('githubUsernameUpdated', handleGitHubUsernameUpdate)

    return () => {
      window.removeEventListener('githubUsernameUpdated', handleGitHubUsernameUpdate)
    }
  }, [])

  useEffect(() => {
    if (githubUsername) {
      fetchGitHubStats()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubUsername])

  const loadGitHubUsername = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('github_username')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data?.github_username) {
        setGithubUsername(data.github_username)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading GitHub username:', error)
      setLoading(false)
    }
  }

  const fetchGitHubStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`https://api.github.com/users/${githubUsername}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GitHub user not found')
        } else if (response.status >= 500) {
          throw new Error('GitHub service unavailable. Please try again later.')
        } else {
          throw new Error(`Unable to load GitHub profile (${response.status})`)
        }
      }

      const data = await response.json()

      // Fetch recent repos
      let recentRepos = []
      try {
        const reposResponse = await fetch(
          `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (reposResponse.ok) {
          const reposData = await reposResponse.json()
          recentRepos = reposData.map((repo) => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            updated: repo.updated_at,
          }))
        }
      } catch (reposError) {
        // Continue without repos if this fails
        console.error('Error fetching repos:', reposError)
      }

      setStats({
        username: data.login,
        name: data.name,
        bio: data.bio,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        avatar: data.avatar_url,
        profileUrl: data.html_url,
        recentRepos,
      })
    } catch (error) {
      console.error('Error fetching GitHub stats:', error)
      // Provide user-friendly error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Unable to connect. Please check your internet connection.')
      } else {
        setError(error.message || 'Failed to load GitHub stats')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (!githubUsername) {
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
        <FaGithub size={24} style={{ opacity: 0.5 }} />
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          Add your GitHub username in Settings
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        <div>Error loading GitHub stats</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{error}</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No stats available
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <FaGithub size={20} style={{ color: 'var(--text-primary)' }} />
        <a
          href={stats.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--accent)'
            e.target.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'var(--text-primary)'
            e.target.style.textDecoration = 'none'
          }}
        >
          {stats.name || stats.username}
        </a>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {stats.publicRepos}
          </span>{' '}
          repos
        </div>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {stats.followers}
          </span>{' '}
          followers
        </div>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {stats.following}
          </span>{' '}
          following
        </div>
      </div>

      {stats.recentRepos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem',
            }}
          >
            Recent Repositories
          </div>
          {stats.recentRepos.slice(0, 3).map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.65rem',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 500 }}>{repo.name}</span>
                {repo.stars > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ⭐ {repo.stars}
                  </span>
                )}
              </div>
              {repo.description && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {repo.description}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
