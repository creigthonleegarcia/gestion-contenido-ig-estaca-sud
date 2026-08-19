<template>
  <div class="content-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Contenido</h1>
        <p class="page-subtitle">Planifica, edita y administra publicaciones para Instagram</p>
      </div>
      <router-link to="/content/new" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Nueva Publicación</span>
      </router-link>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="toolbar-card card">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por título o descripción..."
          class="search-input"
        />
      </div>

      <div class="filters-group">
        <select v-model="filterStatus" @change="loadPosts" class="filter-select">
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="in_review">En revisión</option>
          <option value="approved">Aprobado</option>
          <option value="scheduled">Programado</option>
          <option value="published">Publicado</option>
          <option value="rejected">Observado</option>
        </select>

        <select v-model="filterPillar" @change="loadPosts" class="filter-select">
          <option value="">Todos los pilares</option>
          <option v-for="p in pillars" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>

        <select v-model="filterFormat" @change="loadPosts" class="filter-select">
          <option value="">Todos los formatos</option>
          <option value="static">Imagen Estática</option>
          <option value="carousel">Carrusel</option>
          <option value="reel">Reel (9:16)</option>
          <option value="story">Historia</option>
        </select>
      </div>
    </div>

    <!-- Posts Grid -->
    <div v-if="postsStore.loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando publicaciones...</p>
    </div>

    <div v-else-if="filteredPosts.length" class="posts-grid">
      <div v-for="post in filteredPosts" :key="post.id" class="post-card card">
        <div class="post-card-header">
          <div class="post-pillar-tag" :style="{ background: post.pillar_color + '18', color: post.pillar_color, borderColor: post.pillar_color + '40' }">
            <span class="pillar-dot" :style="{ background: post.pillar_color }"></span>
            {{ post.pillar_name || 'Sin pilar' }}
          </div>
          <span class="badge" :class="`badge-${post.status}`">{{ statusLabels[post.status] }}</span>
        </div>

        <div class="post-card-media" v-if="post.media_paths">
          <img :src="`http://localhost:3001/uploads/${post.media_paths.split(',')[0]}`" :alt="post.title" loading="lazy" />
          <span class="media-format-badge">
            <component :is="getFormatIcon(post.format)" />
            {{ formatLabels[post.format] }}
          </span>
        </div>
        <div v-else class="post-card-media placeholder">
          <component :is="getFormatIcon(post.format)" class="placeholder-icon" />
          <span class="media-format-badge">{{ formatLabels[post.format] }}</span>
        </div>

        <div class="post-card-body">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-caption">{{ truncate(post.caption, 110) }}</p>

          <div class="post-meta-row">
            <span class="meta-item" v-if="post.scheduled_at">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDate(post.scheduled_at) }}
            </span>
            <span class="meta-item" v-else>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Sin programar
            </span>
          </div>
        </div>

        <div class="post-card-actions">
          <router-link
            v-if="post.status === 'draft' || post.status === 'rejected'"
            :to="`/content/${post.id}/edit`"
            class="btn btn-secondary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Editar</span>
          </router-link>

          <button
            v-if="post.status === 'draft' || post.status === 'rejected'"
            class="btn btn-primary btn-sm"
            @click="submitForReview(post.id)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Enviar a revisión</span>
          </button>

          <button
            v-if="post.status === 'draft'"
            class="btn btn-ghost btn-sm btn-icon-only"
            @click="deletePost(post.id)"
            title="Eliminar borrador"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state card">
      <div class="empty-icon-wrap">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <h3>No se encontraron publicaciones</h3>
      <p>Crea una nueva publicación para iniciar el flujo editorial de la Estaca.</p>
      <router-link to="/content/new" class="btn btn-primary" style="margin-top: 12px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Nueva Publicación</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { usePostsStore, usePillarsStore } from '../stores/index'

const postsStore = usePostsStore()
const pillarsStore = usePillarsStore()

const pillars = ref([])
const filterStatus = ref('')
const filterPillar = ref('')
const filterFormat = ref('')
const searchQuery = ref('')

const statusLabels = {
  draft: 'Borrador',
  in_review: 'En revisión',
  approved: 'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  rejected: 'Observado'
}

const formatLabels = {
  static: 'Estático',
  carousel: 'Carrusel',
  reel: 'Reel',
  story: 'Historia'
}

// Vector Format Icons
const IconStatic = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
  h('circle', { cx: 8.5, cy: 8.5, r: 1.5 }),
  h('polyline', { points: '21 15 16 10 5 21' })
])

const IconCarousel = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 2, y: 4, width: 14, height: 16, rx: 2 }),
  h('path', { d: 'M18 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-12' })
])

const IconReel = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 2, y: 2, width: 20, height: 20, rx: 2.18 }),
  h('polygon', { points: '10 8 16 12 10 16 10 8', fill: 'currentColor' })
])

const IconStory = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('circle', { cx: 12, cy: 12, r: 10 }),
  h('polygon', { points: '10 8 16 12 10 16 10 8' })
])

function getFormatIcon(format) {
  if (format === 'carousel') return IconCarousel
  if (format === 'reel') return IconReel
  if (format === 'story') return IconStory
  return IconStatic
}

const filteredPosts = computed(() => {
  let list = postsStore.posts || []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.caption && p.caption.toLowerCase().includes(q))
    )
  }
  return list
})

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
.content-page {
  display: flex;
  flex-direction: column;
  gap: var(--sp-20);
  max-width: 1320px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-16);
}

/* ── Toolbar ── */
.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  gap: var(--sp-16);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--gray-2);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  flex: 1;
  min-width: 260px;
  color: var(--text-muted);
}

.search-box:focus-within {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(0, 125, 165, 0.1);
  color: var(--accent-primary);
}

.search-input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.84rem;
  color: var(--text-primary);
  outline: none;
}

.filters-group {
  display: flex;
  gap: var(--sp-8);
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  background: var(--bg-level1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  outline: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-select:hover {
  border-color: var(--accent-primary);
}

/* ── Posts Grid ── */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--sp-16);
}

.post-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-detached);
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-tertiary);
}

.post-pillar-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
}

.pillar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.post-card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: var(--gray-3);
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
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  opacity: 0.35;
}

.media-format-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: rgba(33, 34, 37, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: var(--radius-pill);
}

.post-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.post-title {
  font: 700 0.95rem/1.3 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.post-caption {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0 0 12px 0;
  flex: 1;
}

.post-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
  border-top: 1px dashed var(--border-tertiary);
  padding-top: 10px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.post-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--gray-2);
  border-top: 1px solid var(--border-tertiary);
}

.btn-icon-only {
  padding: 6px 8px;
  margin-left: auto;
  color: var(--accent-danger);
}

.btn-icon-only:hover {
  background: #fde8e8;
}

/* ── Empty & Loading ── */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--gray-3);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-state h3 {
  font: 700 1.1rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.empty-state p {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-secondary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
