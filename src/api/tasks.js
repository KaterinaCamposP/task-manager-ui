import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
})

export const getTasks = (token) =>
  api.get('/tasks', authHeader(token))

export const createTask = (token, data) =>
  api.post('/tasks', data, authHeader(token))

export const updateTask = (token, id, data) =>
  api.put(`/tasks/${id}`, data, authHeader(token))

export const deleteTask = (token, id) =>
  api.delete(`/tasks/${id}`, authHeader(token))

export const toggleTaskStatus = (token, id) =>
  api.patch(`/tasks/${id}/status`, {}, authHeader(token))