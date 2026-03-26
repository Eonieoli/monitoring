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

  const allTodos = todos
  const activeCount = allTodos.filter((t) => !t.completed).length
  const completedCount = allTodos.filter((t) => t.completed).length
  const totalCount = allTodos.length

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: '전체', value: 'all' },
    { label: '진행중', value: 'active' },
    { label: '완료', value: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">
          ✅ TODO App
        </h1>
        <p className="mt-1 text-gray-500 text-sm">할 일을 관리하세요</p>
      </div>

      {/* Stats */}
      <div className="w-full max-w-lg grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '전체', value: totalCount, color: 'bg-indigo-100 text-indigo-700' },
          { label: '진행중', value: activeCount, color: 'bg-yellow-100 text-yellow-700' },
          { label: '완료', value: completedCount, color: 'bg-green-100 text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs font-medium mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Add Todo Form */}
        <form onSubmit={handleAdd} className="flex p-4 border-b border-gray-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="새 할 일을 입력하세요..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="ml-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            추가
          </button>
        </form>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-100">
          {filterButtons.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                filter === value
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Todo List */}
        <ul className="divide-y divide-gray-50 min-h-[200px]">
          {loading ? (
            <li className="flex items-center justify-center h-32 text-gray-400 text-sm">
              불러오는 중...
            </li>
          ) : todos.length === 0 ? (
            <li className="flex items-center justify-center h-32 text-gray-400 text-sm">
              {filter === 'all' ? '할 일이 없습니다.' : '해당하는 항목이 없습니다.'}
            </li>
          ) : (
            todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(todo)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="flex-1 text-sm text-gray-700 outline-none border-b border-indigo-400 bg-transparent"
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleEditStart(todo)}
                    className={`flex-1 text-sm cursor-pointer select-none ${
                      todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                    title="더블클릭으로 수정"
                  >
                    {todo.title}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        {completedCount > 0 && (
          <div className="flex justify-end px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleClearCompleted}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              완료된 항목 삭제 ({completedCount})
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        더블클릭으로 할 일을 수정할 수 있습니다
      </p>
    </div>
  )
}
