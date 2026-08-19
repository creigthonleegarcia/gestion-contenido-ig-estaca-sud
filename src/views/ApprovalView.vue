<template>
  <div class="approval-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Módulo de Aprobación</h1>
        <p class="page-subtitle">Revisión episcopal y editorial de contenido antes de ser publicado en Instagram</p>
      </div>

      <div class="tab-buttons card">
        <button class="tab-btn" :class="{ active: tab === 'queue' }" @click="tab = 'queue'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <span>Pendientes de Revisión</span>
          <span v-if="approvalStore.queue.length" class="tab-count-badge">{{ approvalStore.queue.length }}</span>
        </button>

        <button class="tab-btn" :class="{ active: tab === 'history' }" @click="tab = 'history'; loadHistory()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 14 14"/>
          </svg>
          <span>Historial de Decisiones</span>
        </button>
      </div>
    </div>

    <!-- Queue Tab -->
    <div v-if="tab === 'queue'">
      <div v-if="approvalStore.loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando publicaciones pendientes...</p>
      </div>

      <div v-else-if="approvalStore.queue.length" class="queue-list">
        <article v-for="post in approvalStore.queue" :key="post.id" class="approval-card card">
          <!-- Left: Media Preview -->
          <div class="approval-card-media">
            <img
              v-if="post.media_paths"
              :src="`http://localhost:3001/uploads/${post.media_paths.split(',')[0]}`"
              :alt="post.title"
              class="ac-img"
              loading="lazy"
            />
            <div v-else class="ac-media-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <span class="media-type-tag">{{ formatLabels[post.format] }}</span>
          </div>

          <!-- Center: Post Information -->
          <div class="approval-card-content">
            <div class="ac-top-meta">
              <div class="post-pillar-tag" :style="{ background: post.pillar_color + '18', color: post.pillar_color, borderColor: post.pillar_color + '40' }">
                <span class="pillar-dot" :style="{ background: post.pillar_color }"></span>
                {{ post.pillar_name || 'General' }}
              </div>
              <span class="ac-creator-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Creado por: {{ post.creator_name || 'Comité' }}
              </span>
            </div>

            <h3 class="ac-title">{{ post.title }}</h3>
            <p class="ac-caption">{{ post.caption || 'Sin descripción' }}</p>

            <div class="ac-submeta">
              <span class="ac-meta-item" v-if="post.scheduled_at">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Programado: {{ formatDate(post.scheduled_at) }}
              </span>
              <span class="ac-hashtags" v-if="post.hashtags">{{ post.hashtags }}</span>
            </div>
          </div>

          <!-- Right: Action & Feedback Form -->
          <div class="approval-card-actions">
            <div class="feedback-group">
              <label class="feedback-label">Observaciones o correcciones:</label>
              <textarea
                v-model="reviewComments[post.id]"
                rows="3"
                placeholder="Obligatorio en caso de solicitar cambios o rechazar..."
                class="form-control feedback-input"
              ></textarea>
            </div>

            <div class="ac-buttons-row">
              <button
                class="btn btn-success btn-full"
                @click="approvePost(post.id)"
                :disabled="processing === post.id"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Aprobar</span>
              </button>

              <button
                class="btn btn-danger btn-full"
                @click="rejectPost(post.id)"
                :disabled="processing === post.id || !reviewComments[post.id]"
                :title="!reviewComments[post.id] ? 'Ingresa una observación para rechazar' : 'Rechazar publicación'"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Observar</span>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state card">
        <div class="empty-icon-wrap empty-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3>Cola de Aprobación al Día</h3>
        <p>No hay contenido pendiente de revisión. Todo el material ha sido evaluado por el Aprobador.</p>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="tab === 'history'">
      <div v-if="approvalStore.history.length" class="history-list">
        <div v-for="item in approvalStore.history" :key="item.id" class="history-card card">
          <div class="hi-status-icon" :class="item.action">
            <svg v-if="item.action === 'approved'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>

          <div class="hi-content">
            <div class="hi-title-row">
              <h4 class="hi-title">{{ item.post_title }}</h4>
              <span class="badge" :class="`badge-${item.action === 'approved' ? 'published' : 'rejected'}`">
                {{ item.action === 'approved' ? 'Aprobado' : 'Observado' }}
              </span>
            </div>
            <p class="hi-meta">
              Revisado por <strong>{{ item.approver_name }}</strong> &bull; {{ formatDate(item.created_at) }}
            </p>
            <p v-if="item.comments" class="hi-comments">
              "{{ item.comments }}"
            </p>
          </div>

          <div class="hi-pillar-tag" v-if="item.pillar_color">
            <span class="pillar-dot" :style="{ background: item.pillar_color }"></span>
            <span>{{ item.pillar_name }}</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state card">
        <div class="empty-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 14 14"/>
          </svg>
        </div>
        <h3>Sin Registro Histórico</h3>
        <p>Aún no se han completado revisiones en el sistema.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useApprovalStore } from '../stores/index'

const approvalStore = useApprovalStore()
const tab = ref('queue')
const reviewComments = reactive({})
const processing = ref(null)

const formatLabels = {
  static: 'Estático',
  carousel: 'Carrusel',
  reel: 'Reel',
  story: 'Historia'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function approvePost(postId) {
  processing.value = postId
  try {
    await approvalStore.approvePost(postId, reviewComments[postId] || '')
  } finally {
    processing.value = null
  }
}

async function rejectPost(postId) {
  processing.value = postId
  try {
    await approvalStore.rejectPost(postId, reviewComments[postId])
  } finally {
    processing.value = null
  }
}

async function loadHistory() {
  await approvalStore.fetchHistory()
}

onMounted(() => {
  approvalStore.fetchQueue()
})
</script>

<style scoped>
.approval-page {
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

.tab-buttons {
  display: flex;
  padding: 4px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  gap: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: var(--gray-2);
  color: var(--text-primary);
}

.tab-btn.active {
  background: #ffffff;
  color: var(--accent-primary);
  border-color: var(--border-tertiary);
  box-shadow: var(--shadow-raised);
  font-weight: 600;
}

.tab-count-badge {
  background: var(--accent-danger);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  line-height: 1.2;
}

/* ── Queue List ── */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
}

.approval-card {
  display: grid;
  grid-template-columns: 210px 1fr 300px;
  gap: var(--sp-20);
  padding: 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  align-items: start;
}

.approval-card-media {
  position: relative;
  width: 210px;
  height: 210px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--gray-3);
  flex-shrink: 0;
}

.ac-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ac-media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  opacity: 0.4;
}

.media-type-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 3px 8px;
  background: rgba(33, 34, 37, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: var(--radius-pill);
}

.approval-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ac-top-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.ac-creator-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.ac-title {
  font: 700 1.1rem/1.3 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.ac-caption {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  max-height: 90px;
  overflow-y: auto;
}

.ac-submeta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.ac-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.ac-hashtags {
  font-size: 0.75rem;
  color: var(--accent-primary);
}

/* ── Approval Actions Column ── */
.approval-card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
  background: var(--gray-2);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-tertiary);
}

.feedback-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feedback-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.feedback-input {
  resize: vertical;
  font-size: 0.8125rem;
}

.ac-buttons-row {
  display: flex;
  gap: 8px;
}

.btn-full {
  flex: 1;
  justify-content: center;
}

/* ── History List ── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
}

.history-card {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-16);
  padding: 16px 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-raised);
}

.hi-status-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hi-status-icon.approved {
  background: #e8f5e9;
  color: var(--accent-success);
}

.hi-status-icon.rejected {
  background: #fde8e8;
  color: var(--accent-danger);
}

.hi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hi-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hi-title {
  font: 700 0.95rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.hi-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.hi-comments {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 8px 12px;
  background: var(--gray-2);
  border-left: 3px solid var(--border-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin: 4px 0 0 0;
}

.hi-pillar-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
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

.empty-success {
  background: #e8f5e9;
  color: var(--accent-success);
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

@media (max-width: 980px) {
  .approval-card {
    grid-template-columns: 1fr;
  }
  .approval-card-media {
    width: 100%;
    height: 240px;
  }
}
</style>
