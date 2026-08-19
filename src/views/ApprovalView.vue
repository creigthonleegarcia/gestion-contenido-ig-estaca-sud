<template>
  <div class="approval-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Módulo de Aprobación</h1>
        <p class="page-subtitle">Revisa, aprueba o rechaza el contenido antes de su publicación</p>
      </div>
      <div class="tab-buttons">
        <button class="tab-btn" :class="{ active: tab === 'queue' }" @click="tab = 'queue'">
          📥 Cola de aprobación
          <span v-if="approvalStore.queue.length" class="tab-count">{{ approvalStore.queue.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'history' }" @click="tab = 'history'; loadHistory()">
          📜 Historial
        </button>
      </div>
    </div>

    <!-- Queue Tab -->
    <div v-if="tab === 'queue'">
      <div v-if="approvalStore.loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="approvalStore.queue.length" class="queue-list">
        <div v-for="post in approvalStore.queue" :key="post.id" class="approval-card card">
          <div class="approval-card-left">
            <div class="ac-media" v-if="post.media_paths">
              <img :src="`http://localhost:3001/uploads/${post.media_paths.split(',')[0]}`" alt="" />
            </div>
            <div v-else class="ac-media placeholder">📷</div>
          </div>

          <div class="approval-card-center">
            <div class="ac-header">
              <span class="post-pillar-tag" :style="{ background: post.pillar_color + '22', color: post.pillar_color }">
                {{ post.pillar_icon }} {{ post.pillar_name }}
              </span>
              <span class="ac-creator">Por: {{ post.creator_name }}</span>
            </div>
            <h3 class="ac-title">{{ post.title }}</h3>
            <p class="ac-caption">{{ post.caption }}</p>
            <div class="ac-meta">
              <span v-if="post.scheduled_at">📅 {{ formatDate(post.scheduled_at) }}</span>
              <span>{{ formatLabels[post.format] }}</span>
            </div>
            <div class="ac-hashtags" v-if="post.hashtags">{{ post.hashtags }}</div>
          </div>

          <div class="approval-card-right">
            <div class="form-group">
              <label>Comentarios</label>
              <textarea v-model="reviewComments[post.id]" rows="3"
                placeholder="Observaciones (requerido si rechaza)"></textarea>
            </div>
            <div class="ac-actions">
              <button class="btn btn-success" @click="approvePost(post.id)"
                      :disabled="processing === post.id">
                ✅ Aprobar
              </button>
              <button class="btn btn-danger" @click="rejectPost(post.id)"
                      :disabled="processing === post.id || !reviewComments[post.id]">
                ❌ Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-state-icon">✅</p>
        <p>¡No hay contenido pendiente de aprobación!</p>
        <p class="page-subtitle">Todo el contenido ha sido revisado</p>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="tab === 'history'">
      <div v-if="approvalStore.history.length" class="history-list">
        <div v-for="item in approvalStore.history" :key="item.id" class="history-item">
          <div class="hi-icon" :class="item.action">
            {{ item.action === 'approved' ? '✅' : '❌' }}
          </div>
          <div class="hi-content">
            <div class="hi-title">
              <strong>{{ item.post_title }}</strong>
              <span class="badge" :class="`badge-${item.action === 'approved' ? 'approved' : 'rejected'}`">
                {{ item.action === 'approved' ? 'Aprobado' : 'Rechazado' }}
              </span>
            </div>
            <p class="hi-meta">
              Por {{ item.approver_name }} • {{ formatDate(item.created_at) }}
            </p>
            <p v-if="item.comments" class="hi-comments">"{{ item.comments }}"</p>
          </div>
          <div class="hi-pillar" v-if="item.pillar_color">
            <span class="legend-dot" :style="{ background: item.pillar_color }"></span>
            {{ item.pillar_name }}
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-state-icon">📜</p>
        <p>No hay historial de aprobaciones</p>
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

const formatLabels = { static: '📷 Estático', carousel: '🎠 Carrusel', reel: '🎬 Reel', story: '📱 Story' }

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function approvePost(postId) {
  processing.value = postId
  try {
    await approvalStore.approvePost(postId, reviewComments[postId] || '')
  } finally { processing.value = null }
}

async function rejectPost(postId) {
  processing.value = postId
  try {
    await approvalStore.rejectPost(postId, reviewComments[postId])
  } finally { processing.value = null }
}

async function loadHistory() {
  await approvalStore.fetchHistory()
}

onMounted(() => {
  approvalStore.fetchQueue()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.tab-buttons {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 18px;
  background: var(--bg-card);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover { background: var(--bg-card-hover); }

.tab-btn.active {
  background: rgba(74, 144, 217, 0.1);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.tab-count {
  background: var(--accent-danger);
  color: white;
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 100px;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-default);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.approval-card {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: 20px;
  padding: 20px;
}

.ac-media {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-input);
}

.ac-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ac-media.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  opacity: 0.3;
}

.ac-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.post-pillar-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
}

.ac-creator {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.ac-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.ac-caption {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 10px;
  max-height: 100px;
  overflow-y: auto;
}

.ac-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.ac-hashtags {
  font-size: 0.72rem;
  color: var(--accent-primary);
}

.approval-card-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.approval-card-right textarea {
  font-size: 0.82rem;
}

.ac-actions {
  display: flex;
  gap: 8px;
}

.ac-actions .btn { flex: 1; justify-content: center; }

/* History */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.hi-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.hi-icon.approved { background: rgba(52, 199, 89, 0.15); }
.hi-icon.rejected { background: rgba(231, 76, 60, 0.15); }

.hi-content { flex: 1; }

.hi-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.hi-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.hi-comments {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 6px 10px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  margin-top: 6px;
}

.hi-pillar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
