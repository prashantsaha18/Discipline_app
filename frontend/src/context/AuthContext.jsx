import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Axios 401 interceptor — auto-logout on expired token
let _logout = null
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && _logout) {
      _logout()
    }
    return Promise.reject(err)
  }
)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('bToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  useEffect(() => {
    _logout = logout
  }, [logout])

  useEffect(() => {
    const token = localStorage.getItem('bToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [logout])

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    localStorage.setItem('bToken', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data
  }

  const register = async (username, email, password) => {
    const { data } = await axios.post('/api/auth/register', {
      username, email, password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    localStorage.setItem('bToken', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
