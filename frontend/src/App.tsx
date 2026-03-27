import { useState, useEffect, useCallback } from 'react'
import { Todo, FilterType } from './types'
import { fetchTodos, createTodo, updateTodo, deleteTodo, deleteCompletedTodos } from './api'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  const loadTodos = useCallback(async () => {
    try {
      setError(null)
      const completed =
        filter === 'active' ? false : filter === 'completed' ? true : undefined
      const data = await fetchTodos(completed)
      setTodos(data)
    } catch {
      setError('할 일 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    loadTodos()
  }, [loadTodos])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    try {
      await createTodo(title)
      setInput('')
      loadTodos()
    } catch {
      setError('할 일을 추가하지 못했습니다.')
    }
  }

  const handleToggle = async (todo: Todo) => {
    try {
      await updateTodo(todo.id, { completed: !todo.completed })
      loadTodos()
    } catch {
      setError('상태를 변경하지 못했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id)
      loadTodos()
    } catch {
      setError('삭제하지 못했습니다.')
    }
  }

  const handleEditStart = (todo: Todo) => {
    setEditingId(todo.id)
    setEditingText(todo.title)
  }

  const handleEditSave = async (id: number) => {
    const title = editingText.trim()
    if (!title) return
    try {
      await updateTodo(id, { title })
      setEditingId(null)
      loadTodos()
    } catch {
      setError('수정하지 못했습니다.')
    }
  }

  const handleClearCompleted = async () => {
    try {
      await deleteCompletedTodos()
      loadTodos()
    } catch {
      setError('완료된 항목을 삭제하지 못했습니다.')
    }
  }

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const filterButtons: { label: string; value: FilterType; count: number }[] = [
    { label: '전체', value: 'all', count: totalCount },
    { label: '진행 중', value: 'active', count: activeCount },
    { label: '완료', value: 'completed', count: completedCount },
  ]

  return (
    <div className="noise min-h-screen flex flex-col items-center justify-start py-16 px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(79,70,229,0.06) 0%, transparent 50%), #0a0a0f' }}>

      {/* Background orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full glass text-xs font-medium tracking-widest uppercase"
            style={{ color: 'rgba(167,139,250,0.8)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" style={{ boxShadow: '0 0 6px rgba(167,139,250,0.8)' }} />
            Task Manager
          </div>
          <h1 className="text-5xl font-800 tracking-tighter leading-none mb-2" style={{ fontWeight: 800 }}>
            <span className="gradient-text">My Todos</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>오늘 할 일을 정리하고 집중하세요</p>
        </div>

        {/* Progress Card */}
        <div className="glass rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>전체 진행률</span>
            <span className="text-xs font-bold" style={{ color: 'rgba(167,139,250,0.9)' }}>{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full progress-bar transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex gap-4 mt-4">
            {[
              { label: '전체', value: totalCount, color: 'rgba(167,139,250,1)' },
              { label: '진행 중', value: activeCount, color: 'rgba(251,191,36,1)' },
              { label: '완료', value: completedCount, color: 'rgba(52,211,153,1)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 text-center">
                <div className="text-xl font-bold" style={{ color }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-strong rounded-2xl overflow-hidden">

          {/* Add Form */}
          <form onSubmit={handleAdd} className="flex items-center gap-3 p-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(167,139,250,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="새로운 할 일 추가..."
                className="input-field flex-1 text-sm"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn-primary flex-shrink-0 px-5 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              추가
            </button>
          </form>

          {/* Filter Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {filterButtons.map(({ label, value, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`filter-tab flex-1 relative py-3.5 text-xs font-semibold tracking-wide transition-all duration-200 ${filter === value ? 'active' : ''}`}
                style={{
                  color: filter === value ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: filter === value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                      color: filter === value ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.3)',
                    }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-xs animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(252,165,165,1)' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Todo List */}
          <ul className="min-h-[220px] max-h-[400px] overflow-y-auto py-2">
            {loading ? (
              <li className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="loading-spinner w-7 h-7 rounded-full" />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>불러오는 중...</span>
              </li>
            ) : todos.length === 0 ? (
              <li className="flex flex-col items-center justify-center h-48 gap-3 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {filter === 'all' ? '할 일이 없습니다' : '해당하는 항목이 없습니다'}
                </span>
              </li>
            ) : (
              todos.map((todo, index) => (
                <li
                  key={todo.id}
                  className="todo-row flex items-center gap-3 px-4 py-3.5 mx-2 my-0.5 rounded-xl group transition-all duration-200 cursor-default"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    opacity: 0,
                    animation: `fadeInUp 0.3s ease ${index * 40}ms forwards`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => handleToggle(todo)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed ? 'checkbox-done' : ''
                    }`}
                    style={!todo.completed ? {
                      borderColor: 'rgba(255,255,255,0.2)',
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!todo.completed)
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.7)'
                    }}
                    onMouseLeave={(e) => {
                      if (!todo.completed)
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'
                    }}
                  >
                    {todo.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Title */}
                  {editingId === todo.id ? (
                    <input
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleEditSave(todo.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(todo.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 text-sm bg-transparent outline-none"
                      style={{
                        color: 'rgba(255,255,255,0.85)',
                        borderBottom: '1px solid rgba(167,139,250,0.5)',
                        caretColor: '#a78bfa',
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => handleEditStart(todo)}
                      className="flex-1 text-sm select-none transition-all duration-200"
                      style={{
                        color: todo.completed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                      }}
                      title="더블클릭으로 수정"
                    >
                      {todo.title}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="delete-btn opacity-0 transition-all duration-200 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(239,68,68,0.15)'
                      el.style.color = 'rgba(252,165,165,1)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'transparent'
                      el.style.color = 'rgba(255,255,255,0.3)'
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {completedCount > 0 && (
            <div className="flex items-center justify-between px-4 py-3 animate-fade-in"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {completedCount}개 완료됨
              </span>
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-3 py-1.5 rounded-lg"
                style={{ color: 'rgba(252,165,165,0.7)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(239,68,68,0.1)'
                  el.style.color = 'rgba(252,165,165,1)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'rgba(252,165,165,0.7)'
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                완료 항목 삭제
              </button>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <p className="mt-5 text-center text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
          더블클릭으로 할 일을 수정할 수 있습니다
        </p>
      </div>
    </div>
  )
}
