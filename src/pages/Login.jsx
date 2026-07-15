import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      saveToken(res.data.accessToken)
      navigate('/dashboard')
    } catch (err) {
      setError('Credenciales incorrectas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
        <p style={styles.link}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5'
  },
  card: {
    backgroundColor: 'white', padding: '2rem',
    borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: '360px'
  },
  title: { textAlign: 'center', marginBottom: '1.5rem', color: '#333' },
  field: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  input: {
    padding: '0.5rem', borderRadius: '4px',
    border: '1px solid #ccc', fontSize: '1rem'
  },
  button: {
    width: '100%', padding: '0.75rem', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '4px',
    fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem'
  },
  error: { color: 'red', fontSize: '0.9rem', marginBottom: '1rem' },
  link: { textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }
}