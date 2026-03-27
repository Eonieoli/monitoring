import { useState, useEffect, useCallback, useRef } from 'react'
import { Todo, FilterType } from './types'
import { fetchTodos, createTodo, updateTodo, deleteTodo, deleteCompletedTodos } from './api'

// ── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="check-icon w-3 h-3" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex-1 rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)' }}>
      <span className="text-3xl font-bold tracking-tight" style={{ color: accent }}>{value}</span>
      <span className="text-xs font-medium" style={{ color: 'rgba(100,80,160,0.55)' }}>{label}</span>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos]           = useState<Todo[]>([])
  const [filter, setFilter]         = useState<FilterType>('all')
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadTodos = useCallback(async () => {
    try {
      setError(null)
      const completed = filter === 'active' ? false : filter === 'completed' ? true : undefined
      setTodos(await fetchTodos(completed))
    } catch {
      setError('목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { setLoading(true); loadTodos() }, [loadTodos])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    try { await createTodo(title); setInput(''); loadTodos() }
    catch { setError('추가하지 못했습니다.') }
  }

  const handleToggle = async (todo: Todo) => {
    try { await updateTodo(todo.id, { completed: !todo.completed }); loadTodos() }
    catch { setError('상태를 변경하지 못했습니다.') }
  }

  const handleDelete = async (id: number) => {
    try { await deleteTodo(id); loadTodos() }
    catch { setError('삭제하지 못했습니다.') }
  }

  const handleEditSave = async (id: number) => {
    const title = editingText.trim()
    if (!title) return
    try { await updateTodo(id, { title }); setEditingId(null); loadTodos() }
    catch { setError('수정하지 못했습니다.') }
  }

  const allTodos     = todos
  const activeCount  = allTodos.filter(t => !t.completed).length
  const doneCount    = allTodos.filter(t => t.completed).length
  const totalCount   = allTodos.length
  const progress     = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const filters: { label: string; value: FilterType }[] = [
    { label: '전체', value: 'all' },
    { label: '진행 중', value: 'active' },
    { label: '완료', value: 'completed' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f8f7ff' }}>

      {/* ── Hero gradient header ─────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4f46e5 100%)', paddingBottom: '80px' }}>

        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute bottom-[-40px] left-[-30px] w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute top-[30px] left-[20%] w-24 h-24 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.04)' }} />

        <div className="relative z-10 max-w-md mx-auto px-6 pt-12 pb-4">
          {/* Date badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            <span className="text-xs text-white/80 font-medium">{today}</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">My Todos</h1>
          <p className="text-white/50 text-sm mb-8">오늘도 하나씩 해치워봐요</p>

          {/* Stats row */}
          <div className="flex gap-3">
            <StatCard value={totalCount}  label="전체"    accent="#f0abfc" />
            <StatCard value={activeCount} label="진행 중" accent="#fde68a" />
            <StatCard value={doneCount}   label="완료"    accent="#6ee7b7" />
          </div>
        </div>
      </div>

      {/* ── Content card (overlaps hero) ─────────────────────────── */}
      <div className="max-w-md mx-auto px-4 relative z-10" style={{ marginTop: '-48px' }}>
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 20px 60px rgba(109,40,217,0.12), 0 4px 16px rgba(109,40,217,0.06)' }}>

          {/* Progress bar */}
          <div className="h-1 w-full" style={{ background: '#ede9fe' }}>
            <div className="h-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #60a5fa)' }} />
          </div>

          {/* Input form */}
          <form onSubmit={handleAdd} className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f3f0ff' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="새로운 할 일을 입력하세요"
              className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent"
              style={{ caretColor: '#7c3aed' }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : '#e5e7eb',
                color: input.trim() ? 'white' : '#9ca3af',
                boxShadow: input.trim() ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              <PlusIcon />
              추가
            </button>
          </form>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: '1px solid #f3f0ff' }}>
            {filters.map(({ label, value }) => {
              const active = filter === value
              return (
                <button key={value} onClick={() => setFilter(value)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: active ? '#7c3aed' : 'transparent',
                    color: active ? 'white' : '#9ca3af',
                    boxShadow: active ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-3 flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Todo list */}
          <ul className="min-h-[200px] max-h-[380px] overflow-y-auto px-3 py-2">
            {loading ? (
              /* Skeleton loader */
              <li className="py-3 px-2 space-y-3">
                {[80, 60, 90].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#ede9fe' }} />
                    <div className="h-3.5 rounded-full animate-pulse" style={{ width: `${w}%`, background: '#f3f0ff' }} />
                  </div>
                ))}
              </li>
            ) : todos.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: '#f5f3ff' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: '#c4b5fd' }}>
                  {filter === 'all' ? '할 일이 없어요' : '해당하는 항목이 없어요'}
                </p>
                {filter === 'all' && (
                  <p className="text-xs" style={{ color: '#ddd6fe' }}>위에서 새 할 일을 추가해보세요</p>
                )}
              </li>
            ) : (
              todos.map((todo, i) => (
                <li key={todo.id}
                  className="item-enter group flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-colors duration-150"
                  style={{ animationDelay: `${i * 35}ms`, opacity: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#faf8ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Custom checkbox */}
                  <button
                    onClick={() => handleToggle(todo)}
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
                    style={todo.completed ? {
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
                      border: 'none',
                    } : {
                      border: '2px solid #ddd6fe',
                      background: 'white',
                    }}
                  >
                    {todo.completed && <CheckIcon />}
                  </button>

                  {/* Title */}
                  {editingId === todo.id ? (
                    <input
                      autoFocus
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onBlur={() => handleEditSave(todo.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEditSave(todo.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 text-sm font-medium bg-transparent outline-none"
                      style={{ color: '#374151', borderBottom: '1.5px solid #a78bfa', caretColor: '#7c3aed', paddingBottom: '2px' }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm font-medium select-none transition-all duration-200"
                      style={{ color: todo.completed ? '#c4b5fd' : '#374151', textDecoration: todo.completed ? 'line-through' : 'none' }}
                      onDoubleClick={() => { setEditingId(todo.id); setEditingText(todo.title) }}
                      title="더블클릭으로 수정"
                    >
                      {todo.title}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{ color: '#d1d5db' }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = '#ef4444'
                      el.style.background = '#fef2f2'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = '#d1d5db'
                      el.style.background = 'transparent'
                    }}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {doneCount > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid #f3f0ff' }}>
              <span className="text-xs" style={{ color: '#c4b5fd' }}>{doneCount}개 완료</span>
              <button
                onClick={async () => { try { await deleteCompletedTodos(); loadTodos() } catch { setError('삭제 실패') } }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{ color: '#f87171' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <TrashIcon />
                완료 항목 삭제
              </button>
            </div>
          )}

        </div>

        {/* Bottom caption */}
        <p className="text-center text-xs mt-5 mb-8" style={{ color: '#c4b5fd' }}>
          항목을 더블클릭하면 수정할 수 있어요
        </p>
      </div>
    </div>
  )
}
