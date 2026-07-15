import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile } from '../api/auth'

export default function Dashboard() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    getProfile(token)
      .then(res => setUser(res.data))
      .catch(() => {
        logout()
        navigate('/login')
      })
  }, [token])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCreateTask = (e) => {
    e.preventDefault()
    if (!newTask.title.trim() || newTask.title.length < 3) {
      setError('El título debe tener al menos 3 caracteres.')
      return
    }
    setTasks([...tasks, { ...newTask, status: 'PENDING', id: Date.now() }])
    setNewTask({ title: '', description: '' })
    setShowModal(false)
    setError('')
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Task Manager</h1>
        <div style={styles.headerRight}>
          {user && <span style={styles.username}>Hola, {user.username}</span>}
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <h2 style={styles.sectionTitle}>Mis tareas</h2>
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            + Crear tarea
          </button>
        </div>

        {tasks.length === 0 ? (
          <p style={styles.empty}>No tienes tareas aún. ¡Crea una!</p>
        ) : (
          <ul style={styles.taskList}>
            {tasks.map(task => (
              <li key={task.id} style={styles.taskItem}>
                <div>
                  <strong>{task.title}</strong>
                  {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: task.status === 'COMPLETED' ? '#22c55e' : '#f59e0b'
                }}>
                  {task.status === 'COMPLETED' ? 'Completada' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Nueva tarea</h3>
            {error && <p style={styles.error}>{error}</p>}
            <form onSubmit={handleCreateTask}>
              <div style={styles.field}>
                <label>Título *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Mínimo 3 caracteres"
                />
              </div>
              <div style={styles.field}>
                <label>Descripción (opcional)</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => {
                  setShowModal(false)
                  setError('')
                }} style={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" style={styles.createBtn}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#4f46e5', padding: '1rem 2rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  headerTitle: { color: 'white', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  username: { color: 'white', fontSize: '0.9rem' },
  logoutBtn: {
    backgroundColor: 'transparent', border: '1px solid white',
    color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer'
  },
  main: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { margin: 0, color: '#333' },
  createBtn: {
    backgroundColor: '#4f46e5', color: 'white', border: 'none',
    padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'
  },
  empty: { color: '#888', textAlign: 'center', marginTop: '3rem' },
  taskList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  taskItem: {
    backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
  },
  taskDesc: { margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' },
  badge: { color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
    width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  modalTitle: { margin: '0 0 1rem', color: '#333' },
  field: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' },
  cancelBtn: {
    backgroundColor: 'white', border: '1px solid #ccc',
    padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer'
  },
  error: { color: 'red', fontSize: '0.9rem', marginBottom: '1rem' }
}