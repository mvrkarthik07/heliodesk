import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function TaskWidget() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    loadTasks()
    
    // Listen for focus event from CommandBar
    const handleFocusTaskInput = () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
    
    window.addEventListener('focusTaskInput', handleFocusTaskInput)
    return () => window.removeEventListener('focusTaskInput', handleFocusTaskInput)
  }, [])

  const loadTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ user_id: user.id, text: newTask.trim(), completed: false }])
        .select()
        .single()

      if (error) throw error
      setTasks([data, ...tasks])
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const toggleTask = async (taskId, completed) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', taskId)

      if (error) throw error
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      )
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) throw error
      setTasks(tasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
  }

  return (
    <div>
      <form onSubmit={addTask} style={{ marginBottom: '1rem' }}>
        <input
          ref={inputRef}
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          style={{
            width: '100%',
            padding: window.innerWidth <= 640 ? '0.875rem' : '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: window.innerWidth <= 640 ? '16px' : '0.875rem', // Prevent zoom on iOS
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.background = 'rgba(255, 255, 255, 0.06)'
            e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--glass-border)'
            e.target.style.background = 'rgba(255, 255, 255, 0.03)'
            e.target.style.boxShadow = 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTask(e)
            }
          }}
        />
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.length === 0 ? (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontStyle: 'italic',
            }}
          >
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background:
                  task.completed
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                transition: 'all 0.3s ease',
                animation: 'slideIn 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                if (!task.completed) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = task.completed
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                style={{
                  cursor: 'pointer',
                  accentColor: 'var(--accent)',
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed
                    ? 'var(--text-secondary)'
                    : 'var(--text-primary)',
                }}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                  e.target.style.color = '#ff4444'
                  e.target.style.background = 'rgba(255, 68, 68, 0.1)'
                  e.target.style.transform = 'scale(1.2) rotate(90deg)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.6'
                  e.target.style.color = 'var(--text-secondary)'
                  e.target.style.background = 'transparent'
                  e.target.style.transform = 'scale(1) rotate(0deg)'
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
