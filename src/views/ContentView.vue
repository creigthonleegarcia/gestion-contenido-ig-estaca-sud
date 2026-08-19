<template>
  <div class="content-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Contenido</h1>
        <p class="page-subtitle">Crea, edita y gestiona las publicaciones de Instagram</p>
      </div>
      <router-link to="/content/new" class="btn btn-primary">
        ✨ Nueva Publicación
      </router-link>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <select v-model="filterStatus" @change="loadPosts">
        <option value="">Todos los estados</option>
        <option value="draft">Borradores</option>
        <option value="in_review">En revisión</option>
        <option value="approved">Aprobados</option>
        <option value="scheduled">Programados</option>
        <option value="published">Publicados</option>
        <option value="rejected">Rechazados</option>
      </select>

      <select v-model="filterPillar" @change="loadPosts">
        <option value="">Todos los pilares</option>
        <option v-for="p in pillars" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>

      <select v-model="filterFormat" @change="loadPosts">
        <option value="">Todos los formatos</option>
        <option value="static">📷 Estático</option>
        <option value="carousel">🎠 Carrusel</option>
        <option value="reel">🎬 Reel</option>
        <option value="story">📱 Story</option>
      </select>
    </div>

    <!-- Posts Grid -->
    <div v-if="postsStore.loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando contenido...</p>
    </div>

    <div v-else-if="postsStore.posts.length" class="posts-grid">
      <div v-for="post in postsStore.posts" :key="post.id" class="post-card card">
        <div class="post-card-header">
          <div class="post-pillar-tag" :style="{ background: post.pillar_color + '22', color: post.pillar_color }">
            {{ post.pillar_icon }} {{ post.pillar_name }}
          </div>
          <span class="badge" :class="`badge-${post.status}`">{{ statusLabels[post.status] }}</span>
        </div>

        <div class="post-card-media" v-if="post.media_paths">
          <img :src="`http://localhost:3001/uploads/${post.media_paths.split(',')[0]}`" alt="" />
        </div>
        <div v-else class="post-card-media placeholder">
          <span>{{ formatIcons[post.format] || '📷' }}</span>
        </div>

        <div class="post-card-body">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-caption">{{ truncate(post.caption, 100) }}</p>

          <div class="post-meta">
            <span v-if="post.scheduled_at">📅 {{ formatDate(post.scheduled_at) }}</span>
            <span>{{ formatIcons[post.format] }} {{ formatLabels[post.format] }}</span>
          </div>
        </div>

        <div class="post-card-actions">
          <router-link v-if="post.status === 'draft' || post.status === 'rejected'"
                       :to="`/content/${post.id}/edit`" class="btn btn-ghost btn-sm">
            ✏️ Editar
          </router-link>
          <button v-if="post.status === 'draft' || post.status === 'rejected'"
                  class="btn btn-primary btn-sm" @click="submitForReview(post.id)">
            📤 Enviar a revisión
          </button>
          <button v-if="post.status === 'draft'"
                  class="btn btn-danger btn-sm" @click="deletePost(post.id)">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p class="empty-state-icon">📝</p>
      <p>No hay publicaciones. ¡Crea tu primera!</p>
      <router-link to="/content/new" class="btn btn-primary" style="margin-top: 16px">
        ✨ Nueva Publicación
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePostsStore, usePillarsStore } from '../stores/index'

const postsStore = usePostsStore()
const pillarsStore = usePillarsStore()

const pillars = ref([])
const filterStatus = ref('')
const filterPillar = ref('')
const filterFormat = ref('')

const statusLabels = {
  draft: 'Borrador', in_review: 'En revisión', approved: 'Aprobado',
  scheduled: 'Programado', published: 'Publicado', rejected: 'Rechazado'
}

const formatLabels = { static: 'Estático', carousel: 'Carrusel', reel: 'Reel', story: 'Story' }
const formatIcons = { static: '📷', carousel: '🎠', reel: '🎬', story: '📱' }

function truncate(text, len) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadPosts() {
  const filters = {}
  if (filterStatus.value) filters.status = filterStatus.value
  if (filterPillar.value) filters.pillar_id = filterPillar.value
  if (filterFormat.value) filters.format = filterFormat.value
  await postsStore.fetchPosts(filters)
}

async function submitForReview(id) {
  await postsStore.submitForReview(id)
  await loadPosts()
}

async function deletePost(id) {
  if (confirm('¿Eliminar esta publicación?')) {
    await postsStore.deletePost(id)
  }
}

onMounted(async () => {
  await pillarsStore.fetchPillars()
  pillars.value = pillarsStore.pillars
  await loadPosts()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filters-bar select {
  flex: 1;
  max-width: 220px;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-default);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.post-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.post-pillar-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
}

.post-card-media {
  height: 180px;
  overflow: hidden;
  background: var(--bg-input);
}

.post-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-card-media.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  opacity: 0.3;
}

.post-card-body {
  padding: 16px;
  flex: 1;
}

.post-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.post-caption {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.post-card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
