import { defineStore } from 'pinia'

const API = '/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isApprover: (state) => state.user?.role === 'approver',
    isCreator: (state) => state.user?.role === 'creator',
  },

  actions: {
    async login(email, password) {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error de autenticación')
      }
      const data = await res.json()
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    getHeaders() {
      return {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    },

    getAuthHeader() {
      return { 'Authorization': `Bearer ${this.token}` }
    }
  }
})
