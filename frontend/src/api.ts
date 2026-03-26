import { Todo } from './types'

const BASE = '/api'

export async function fetchTodos(completed?: boolean): Promise<Todo[]> {
  const url = completed !== undefined ? `${BASE}/todos?completed=${completed}` : `${BASE}/todos`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to create todo')
  return res.json()
}

export async function updateTodo(id: number, data: { title?: string; completed?: boolean }): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update todo')
  return res.json()
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BASE}/todos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete todo')
}

export async function deleteCompletedTodos(): Promise<void> {
  const res = await fetch(`${BASE}/todos`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete completed todos')
}
