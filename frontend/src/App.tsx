import { useState, useEffect, useCallback, useRef } from 'react'
import { Todo, FilterType } from './types'
import { fetchTodos, createTodo, updateTodo, deleteTodo, deleteCompletedTodos } from './api'

// ── Viridian color tokens ─────────────────────────────────────────────────────
const V = {
  deep:      '#0D4D38',   // 가장 깊은 비리디안
  mid:       '#1A6B52',   // 주 비리디안
  bright:    '#2D8A6C',   // 밝은 비리디안
  glow:      '#4DBFA0',   // 영롱한 틸 하이라이트
  pageBg:    '#F2FAF7',   // 페이지 배경 (극연한 민트)
  cardBord:  '#E0F5ED',   // 카드 내부 구분선
  hoverBg:   '#F5FBF8',   // 리스트 hover
  skeleA:    '#C8EDE3',   // skeleton circle
  skeleB:    '#E3F7F0',   // skeleton bar
  emptyBg:   '#EAF7F2',   // 빈 상태 아이콘 배경
  mutedGreen:'#85C4AE',   // 완료 텍스트 / 서브 텍스트
  softGreen: '#A8DDD0',   // 더 연한 힌트
  checkBord: '#9DD4C4',   // 미완료 체크박스 테두리
}

// ── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="check-icon w-3 h-3" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
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
      style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.75)',
      }}>
      <span className="text-3xl font-bold tracking-tight" style={{ color: accent }}>{value}</span>
      <span className="text-xs font-medium" style={{ color: 'rgba(20,80,55,0.5)' }}>{label}</span>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos]             = useState<Todo[]>([])
  const [filter, setFilter]           = useState<FilterType>('all')
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [editingId, setEditingId]     = useState<number | null>(null)
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

  const activeCount = todos.filter(t => !t.completed).length
  const doneCount   = todos.filter(t => t.completed).length
  const totalCount  = todos.length
  const progress    = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const filters: { label: string; value: FilterType }[] = [
    { label: '전체',   value: 'all' },
    { label: '진행 중', value: 'active' },
    { label: '완료',   value: 'completed' },
  ]

  return (
    <div className="min-h-screen" style={{ background: V.pageBg }}>

      {/* ── Hero gradient header ─────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${V.deep} 0%, ${V.mid} 45%, ${V.bright} 100%)`,
          paddingBottom: '80px',
        }}>

        {/* Decorative blurred circles — 영롱한 빛 표현 */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(77,191,160,0.18)', filter: 'blur(1px)' }} />
        <div className="absolute bottom-[-30px] left-[-40px] w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute top-[20px] left-[30%] w-28 h-28 rounded-full pointer-events-none"
          style={{ background: 'rgba(77,191,160,0.10)' }} />
        {/* Bottom shimmer line */}
        <div className="absolute bottom-[76px] left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(77,191,160,0.4), transparent)' }} />

        <div className="relative z-10 max-w-md mx-auto px-6 pt-12 pb-4">
          {/* Date badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: V.glow, boxShadow: `0 0 6px ${V.glow}` }} />
            <span className="text-xs text-white/80 font-medium">{today}</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">My Todos</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(200,240,225,0.6)' }}>오늘도 하나씩 해치워봐요</p>

          {/* Stats row */}
          <div className="flex gap-3">
            {/* 전체 — 영롱한 민트 */}
            <StatCard value={totalCount}  label="전체"    accent="#A8EDD5" />
            {/* 진행 중 — 따뜻한 앰버 (비리디안과 보색 대비로 영롱함 강조) */}
            <StatCard value={activeCount} label="진행 중" accent="#FFD87A" />
            {/* 완료 — 밝은 틸 */}
            <StatCard value={doneCount}   label="완료"    accent={V.glow} />
          </div>
        </div>
      </div>

      {/* ── Content card (overlaps hero) ─────────────────────────── */}
      <div className="max-w-md mx-auto px-4 relative z-10" style={{ marginTop: '-48px' }}>
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'white',
            boxShadow: `0 24px 64px rgba(13,77,56,0.13), 0 4px 16px rgba(13,77,56,0.07)`,
          }}>

          {/* Progress bar */}
          <div className="h-1 w-full" style={{ background: V.skeleA }}>
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${V.mid}, ${V.glow})`,
              }}
            />
          </div>

          {/* Input form */}
          <form onSubmit={handleAdd} className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: `1px solid ${V.cardBord}` }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="새로운 할 일을 입력하세요"
              className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
              style={{ caretColor: V.mid }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{
                background: input.trim()
                  ? `linear-gradient(135deg, ${V.mid}, ${V.bright})`
                  : '#e5e7eb',
                color: input.trim() ? 'white' : '#9ca3af',
                boxShadow: input.trim() ? `0 4px 14px rgba(26,107,82,0.38)` : 'none',
              }}
            >
              <PlusIcon />
              추가
            </button>
          </form>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 px-5 py-3"
            style={{ borderBottom: `1px solid ${V.cardBord}` }}>
            {filters.map(({ label, value }) => {
              const active = filter === value
              return (
                <button key={value} onClick={() => setFilter(value)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: active ? V.mid : 'transparent',
                    color: active ? 'white' : '#9ca3af',
                    boxShadow: active ? `0 2px 10px rgba(26,107,82,0.32)` : 'none',
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Todo list */}
          <ul className="min-h-[200px] max-h-[380px] overflow-y-auto px-3 py-2">
            {loading ? (
              <li className="py-3 px-2 space-y-3.5">
                {[80, 55, 90, 65].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: V.skeleA }} />
                    <div className="h-3 rounded-full animate-pulse"
                      style={{ width: `${w}%`, background: V.skeleB }} />
                  </div>
                ))}
              </li>
            ) : todos.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: V.emptyBg }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={V.mutedGreen} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="13" y2="16" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: V.mutedGreen }}>
                  {filter === 'all' ? '할 일이 없어요' : '해당하는 항목이 없어요'}
                </p>
                {filter === 'all' && (
                  <p className="text-xs" style={{ color: V.softGreen }}>위에서 새 할 일을 추가해보세요</p>
                )}
              </li>
            ) : (
              todos.map((todo, i) => (
                <li
                  key={todo.id}
                  className="item-enter group flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-colors duration-150"
                  style={{ animationDelay: `${i * 35}ms`, opacity: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.background = V.hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Custom checkbox */}
                  <button
                    onClick={() => handleToggle(todo)}
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
                    style={todo.completed ? {
                      background: `linear-gradient(135deg, ${V.mid}, ${V.bright})`,
                      boxShadow: `0 2px 10px rgba(26,107,82,0.45)`,
                      border: 'none',
                    } : {
                      border: `2px solid ${V.checkBord}`,
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
                      style={{
                        color: '#374151',
                        borderBottom: `1.5px solid ${V.glow}`,
                        caretColor: V.mid,
                        paddingBottom: '2px',
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm font-medium select-none transition-all duration-200"
                      style={{
                        color: todo.completed ? V.mutedGreen : '#374151',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                      }}
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
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: `1px solid ${V.cardBord}` }}>
              <span className="text-xs" style={{ color: V.mutedGreen }}>{doneCount}개 완료</span>
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
        <p className="text-center text-xs mt-5 mb-8" style={{ color: V.mutedGreen }}>
          항목을 더블클릭하면 수정할 수 있어요
        </p>
      </div>
    </div>
  )
}
