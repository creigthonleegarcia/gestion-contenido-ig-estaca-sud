import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API = '/api'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    currentPost: null,
    total: 0,
    loading: false,
    error: null
  }),

  actions: {
    async fetchPosts(filters = {}) {
      this.loading = true
      const auth = useAuthStore()
      const params = new URLSearchParams(filters).toString()
      try {
        const res = await fetch(`${API}/posts?${params}`, { headers: auth.getHeaders() })
        const data = await res.json()
        this.posts = data.posts
        this.total = data.total
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchPost(id) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/posts/${id}`, { headers: auth.getHeaders() })
      if (!res.ok) throw new Error('Post no encontrado')
      this.currentPost = await res.json()
      return this.currentPost
    },

    async createPost(formData) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: auth.getAuthHeader(),
        body: formData
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      return await res.json()
    },

    async updatePost(id, formData) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/posts/${id}`, {
        method: 'PUT',
        headers: auth.getAuthHeader(),
        body: formData
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      return await res.json()
    },

    async submitForReview(id) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/posts/${id}/submit`, {
        method: 'POST',
        headers: auth.getHeaders()
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      return await res.json()
    },

    async deletePost(id) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/posts/${id}`, {
        method: 'DELETE',
        headers: auth.getHeaders()
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      this.posts = this.posts.filter(p => p.id !== id)
    }
  }
})

export const useInsightsStore = defineStore('insights', {
  state: () => ({
    overview: null,
    recommendations: [],
    loading: false
  }),

  actions: {
    async fetchOverview() {
      this.loading = true
      const auth = useAuthStore()
      try {
        const res = await fetch(`${API}/insights/overview`, { headers: auth.getHeaders() })
        this.overview = await res.json()
      } finally {
        this.loading = false
      }
    },

    async fetchRecommendations() {
      const auth = useAuthStore()
      const res = await fetch(`${API}/insights/recommendations`, { headers: auth.getHeaders() })
      this.recommendations = await res.json()
    }
  }
})

export const usePillarsStore = defineStore('pillars', {
  state: () => ({
    pillars: [],
    loading: false
  }),

  actions: {
    async fetchPillars() {
      this.loading = true
      const auth = useAuthStore()
      try {
        const res = await fetch(`${API}/pillars`, { headers: auth.getHeaders() })
        this.pillars = await res.json()
      } finally {
        this.loading = false
      }
    },

    async createPillar(data) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/pillars`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error creando pilar')
      const pillar = await res.json()
      this.pillars.push(pillar)
      return pillar
    },

    async updatePillar(id, data) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/pillars/${id}`, {
        method: 'PUT',
        headers: auth.getHeaders(),
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error actualizando pilar')
      const updated = await res.json()
      const idx = this.pillars.findIndex(p => p.id === id)
      if (idx !== -1) this.pillars[idx] = updated
      return updated
    }
  }
})

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    posts: [],
    suggestions: [],
    loading: false
  }),

  actions: {
    async fetchMonth(year, month) {
      this.loading = true
      const auth = useAuthStore()
      try {
        const res = await fetch(`${API}/calendar?year=${year}&month=${month}`, {
          headers: auth.getHeaders()
        })
        this.posts = await res.json()
      } finally {
        this.loading = false
      }
    },

    async generateTemplate(year, month) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/calendar/generate`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ year, month })
      })
      const data = await res.json()
      this.suggestions = data.suggestions
      return data
    }
  }
})

export const useApprovalStore = defineStore('approval', {
  state: () => ({
    queue: [],
    history: [],
    loading: false
  }),

  actions: {
    async fetchQueue() {
      this.loading = true
      const auth = useAuthStore()
      try {
        const res = await fetch(`${API}/approval/queue`, { headers: auth.getHeaders() })
        this.queue = await res.json()
      } finally {
        this.loading = false
      }
    },

    async fetchHistory() {
      const auth = useAuthStore()
      const res = await fetch(`${API}/approval/history`, { headers: auth.getHeaders() })
      this.history = await res.json()
    },

    async approvePost(postId, comments) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/approval/${postId}/approve`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ comments })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      this.queue = this.queue.filter(p => p.id !== postId)
      return await res.json()
    },

    async rejectPost(postId, comments) {
      const auth = useAuthStore()
      const res = await fetch(`${API}/approval/${postId}/reject`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ comments })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      this.queue = this.queue.filter(p => p.id !== postId)
    }
  }
})
