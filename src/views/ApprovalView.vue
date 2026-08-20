<template>
  <div class="approval-page animate-in">
    <!-- Page Header & Tab Navigation -->
    <header class="page-header">
      <div>
        <div class="header-badge-row">
          <span class="header-subtag">Consejo Episcopal y de Comunicaciones</span>
        </div>
        <h1 class="page-title">Módulo de Aprobación</h1>
        <p class="page-subtitle">Previsualización fiel de Instagram y revisión editorial de contenido antes de ser publicado</p>
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
    </header>

    <!-- Feedback Notification Toast -->
    <transition name="toast">
      <div v-if="toastMessage" class="approval-toast" :class="toastType">
        <svg v-if="toastType === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- ── Queue Tab: Content Approval with Instagram Mockup ── -->
    <div v-if="tab === 'queue'">
      <div v-if="approvalStore.loading" class="loading-state card">
        <div class="loading-spinner"></div>
        <p>Cargando publicaciones pendientes de revisión...</p>
      </div>

      <div v-else-if="approvalStore.queue.length" class="queue-container">
        <article v-for="post in approvalStore.queue" :key="post.id" class="approval-review-card card">
          
          <!-- ── Left Column: Realistic Instagram Post/Reel Simulator ── -->
          <div class="ig-mockup-wrapper">
            <div class="ig-phone-frame">
              <!-- IG Top Header -->
              <div class="ig-header">
                <div class="ig-user-info">
                  <div class="ig-avatar-ring">
                    <div class="ig-avatar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                  </div>
                  <div class="ig-text-meta">
                    <div class="ig-username-row">
                      <span class="ig-username">estacalaserena</span>
                      <svg class="ig-verified-icon" width="12" height="12" viewBox="0 0 24 24" fill="#007da5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <span class="ig-location">La Serena, Chile &bull; Estaca SUD</span>
                  </div>
                </div>

                <div class="ig-header-actions">
                  <span class="ig-format-badge">{{ formatLabels[post.format] || 'Post' }}</span>
                  <button class="ig-more-btn" aria-label="Opciones">•••</button>
                </div>
              </div>

              <!-- IG Media Display Container -->
              <div class="ig-media-box" :class="`format-${post.format || 'static'}`">
                <img
                  v-if="resolvePostMedia(post)"
                  :src="resolvePostMedia(post)"
                  :alt="post.title"
                  class="ig-media-image"
                  @error="onMediaError(post.id)"
                  loading="lazy"
                />
                <div v-else class="ig-media-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Vista previa pendiente de archivo multimedia</span>
                </div>

                <!-- Subtle Overlay tags for Reel / Video -->
                <div v-if="post.format === 'reel'" class="ig-reel-watermark">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span>Reel @estacalaserena</span>
                </div>
              </div>

              <!-- IG Interaction Action Bar -->
              <div class="ig-actions-bar">
                <div class="ig-left-actions">
                  <button class="ig-act-btn heart" :class="{ liked: likedPosts[post.id] }" @click="toggleLike(post.id)">
                    <svg width="22" height="22" viewBox="0 0 24 24" :fill="likedPosts[post.id] ? '#e11d48' : 'none'" :stroke="likedPosts[post.id] ? '#e11d48' : 'currentColor'" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <button class="ig-act-btn" aria-label="Comentar">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </button>
                  <button class="ig-act-btn share-dm" aria-label="Compartir por DM">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
                <button class="ig-act-btn bookmark" aria-label="Guardar">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>

              <!-- IG Simulated Likes count -->
              <div class="ig-likes-count">
                <span>Le gusta a <strong>miembros_estaca</strong> y <strong>otros 42</strong></span>
              </div>

              <!-- IG Caption & Hashtags Block -->
              <div class="ig-caption-block">
                <p class="ig-caption-text">
                  <strong class="ig-caption-author">estacalaserena</strong>
                  <span :class="{ 'caption-truncated': !expandedCaptions[post.id] }">
                    {{ post.caption || 'Sin texto descriptivo' }}
                  </span>
                </p>
                <button
                  v-if="(post.caption || '').length > 100"
                  class="ig-more-toggle"
                  @click="expandedCaptions[post.id] = !expandedCaptions[post.id]"
                >
                  {{ expandedCaptions[post.id] ? 'menos' : 'más' }}
                </button>

                <p v-if="post.hashtags" class="ig-hashtags-text">
                  {{ post.hashtags }}
                </p>

                <div class="ig-timestamp-footer">
                  <span>{{ formatRelativeTime(post.scheduled_at || post.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Right Column: Editorial & Episcopal Approval Control Panel ── -->
          <div class="approval-panel">
            <!-- Strategic Pillar & Metadata Badge -->
            <div class="panel-header-row">
              <div class="post-pillar-pill" :style="{ background: (post.pillar_color || '#007da5') + '15', color: post.pillar_color || '#007da5', borderColor: (post.pillar_color || '#007da5') + '40' }">
                <span class="pillar-bullet" :style="{ background: post.pillar_color || '#007da5' }"></span>
                <span>{{ post.pillar_name || 'Inspiración Doctrinal' }}</span>
              </div>

              <div class="panel-creator-info">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Creado por: <strong>{{ post.creator_name || 'Comité' }}</strong></span>
              </div>
            </div>

            <!-- Title & Scheduling Info -->
            <div class="post-meta-details">
              <h2 class="post-review-title">{{ post.title }}</h2>
              <div class="schedule-callout" v-if="post.scheduled_at">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Programación sugerida: <strong>{{ formatDate(post.scheduled_at) }}</strong> (Ventana óptima 18:00 hrs)</span>
              </div>
            </div>

            <!-- Church Norms & Doctrinal Validation Checklist -->
            <div class="norms-checklist-card">
              <div class="checklist-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <span>Checklist de Normas de la Iglesia</span>
              </div>
              <div class="checklist-items">
                <label class="check-item">
                  <input type="checkbox" v-model="checklistState[post.id + '_doc']" checked />
                  <span>Doctrina Cristocéntrica y lenguaje reverente</span>
                </label>
                <label class="check-item">
                  <input type="checkbox" v-model="checklistState[post.id + '_logo']" checked />
                  <span>Cero publicidad invasiva ni logos saturados</span>
                </label>
                <label class="check-item">
                  <input type="checkbox" v-model="checklistState[post.id + '_rights']" checked />
                  <span>Derechos de imagen y calidad fotográfica verificada</span>
                </label>
                <label class="check-item">
                  <input type="checkbox" v-model="checklistState[post.id + '_tag']" checked />
                  <span>Uso exclusivo del identificador @estacalaserena</span>
                </label>
              </div>
            </div>

            <!-- Observations / Feedback Textarea with Quick Phrases -->
            <div class="feedback-control-section">
              <label class="feedback-label-header">
                <span>Observaciones del Aprobador:</span>
                <span class="required-tag" v-if="!reviewComments[post.id]">(Requerido para observar)</span>
              </label>

              <textarea
                v-model="reviewComments[post.id]"
                rows="3"
                placeholder="Escribe comentarios, correcciones o sugerencias para el creador..."
                class="form-control feedback-textarea"
              ></textarea>

              <!-- Quick Feedback Chips -->
              <div class="quick-chips-row">
                <button type="button" class="quick-chip" @click="insertQuickComment(post.id, '✅ Todo excelente, mensaje muy inspirador.')">
                  + Todo excelente
                </button>
                <button type="button" class="quick-chip" @click="insertQuickComment(post.id, '✏️ Revisar puntuación y ortografía en el texto.')">
                  + Ajustar ortografía
                </button>
                <button type="button" class="quick-chip" @click="insertQuickComment(post.id, '⏰ Programar para las 17:45 hrs en hora pico.')">
                  + Hora 17:45
                </button>
              </div>
            </div>

            <!-- Primary Decision Action Buttons with Active Physics -->
            <div class="approval-actions-bar">
              <button
                class="btn-approve"
                @click="approvePost(post.id)"
                :disabled="processing === post.id"
              >
                <svg v-if="processing !== post.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span v-else class="btn-spinner"></span>
                <span>{{ processing === post.id ? 'Aprobando...' : 'Aprobar para Publicar' }}</span>
              </button>

              <button
                class="btn-reject"
                @click="rejectPost(post.id)"
                :disabled="processing === post.id || !reviewComments[post.id]"
                :title="!reviewComments[post.id] ? 'Ingresa una observación para solicitar cambios' : 'Solicitar correcciones'"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Observar / Cambios</span>
              </button>
            </div>

          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state card">
        <div class="empty-icon-wrap empty-success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3>Cola de Aprobación al Día</h3>
        <p>No hay contenido pendiente de revisión episcopal en este momento. Todas las propuestas han sido evaluadas.</p>
      </div>
    </div>

    <!-- ── History Tab: Audit Trail of Approvals ── -->
    <div v-if="tab === 'history'">
      <div v-if="approvalStore.history.length" class="history-list">
        <div v-for="item in approvalStore.history" :key="item.id" class="history-card card">
          <div class="hi-status-icon" :class="item.action">
            <svg v-if="item.action === 'approved'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>

          <div class="hi-content">
            <div class="hi-title-row">
              <h4 class="hi-title">{{ item.post_title }}</h4>
              <span class="badge" :class="`badge-${item.action === 'approved' ? 'published' : 'rejected'}`">
                {{ item.action === 'approved' ? 'Aprobado para Publicación' : 'Observado / Requiere Cambios' }}
              </span>
            </div>
            <p class="hi-meta">
              Evaluado por <strong>{{ item.approver_name || 'Aprobador de Estaca' }}</strong> &bull; {{ formatDate(item.created_at) }}
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
const checklistState = reactive({})
const expandedCaptions = reactive({})
const likedPosts = reactive({})
const failedMedia = reactive(new Set())
const processing = ref(null)
const toastMessage = ref('')
const toastType = ref('success')

const formatLabels = {
  static: 'Post Estático',
  carousel: 'Carrusel',
  reel: 'Reel 9:16',
  story: 'Historia'
}

function resolvePostMedia(post) {
  if (failedMedia.has(post.id)) return null
  if (post.media_url && (post.media_url.startsWith('http') || post.media_url.startsWith('/'))) {
    return post.media_url
  }
  if (post.media_paths) {
    const first = post.media_paths.split(',')[0].trim()
    if (first.startsWith('http')) return first
    if (first.startsWith('docs/')) return `http://localhost:3001/${first}`
    return `http://localhost:3001/uploads/${first}`
  }
  return null
}

function onMediaError(postId) {
  failedMedia.add(postId)
}

function toggleLike(postId) {
  likedPosts[postId] = !likedPosts[postId]
}

function insertQuickComment(postId, text) {
  reviewComments[postId] = (reviewComments[postId] ? reviewComments[postId] + ' ' : '') + text
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} hrs`
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Próxima publicación'
  const d = new Date(dateStr)
  const now = new Date()
  if (d > now) {
    return `Programado: ${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return 'Listo para publicación'
}

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 4000)
}

async function approvePost(postId) {
  processing.value = postId
  try {
    await approvalStore.approvePost(postId, reviewComments[postId] || '')
    showToast('✅ Publicación aprobada con éxito para la agenda editorial', 'success')
  } catch (err) {
    showToast(err.message || 'Error al aprobar el contenido', 'error')
  } finally {
    processing.value = null
  }
}

async function rejectPost(postId) {
  if (!reviewComments[postId]) return
  processing.value = postId
  try {
    await approvalStore.rejectPost(postId, reviewComments[postId])
    showToast('📝 Publicación enviada con observaciones al Creador', 'error')
  } catch (err) {
    showToast(err.message || 'Error al observar la publicación', 'error')
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
  max-width: 1280px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-16);
}

.header-badge-row {
  margin-bottom: 4px;
}

.header-subtag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  background: #eef6f9;
  border: 1px solid #c7e3ed;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
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

/* ── Toast Notification ── */
.approval-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 2000;
}

.approval-toast.success {
  background: #166534;
  color: #ffffff;
}

.approval-toast.error {
  background: #991b1b;
  color: #ffffff;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ── Queue Container ── */
.queue-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.approval-review-card {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 28px;
  padding: 24px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  align-items: start;
}

/* ── Left Column: Instagram Phone / Card Simulator ── */
.ig-mockup-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.ig-phone-frame {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ig-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.ig-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ig-avatar-ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ig-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #007da5;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ig-text-meta {
  display: flex;
  flex-direction: column;
}

.ig-username-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ig-username {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #262626;
}

.ig-location {
  font-size: 0.6875rem;
  color: #8e8e8e;
}

.ig-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ig-format-badge {
  font-size: 0.65rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #007da5;
  border: 1px solid #cbd5e1;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
}

.ig-more-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: #262626;
  cursor: pointer;
  padding: 2px;
}

.ig-media-box {
  position: relative;
  width: 100%;
  background: #111827;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ig-media-box.format-static,
.ig-media-box.format-carousel {
  aspect-ratio: 4/5;
  max-height: 420px;
}

.ig-media-box.format-reel,
.ig-media-box.format-story {
  aspect-ratio: 9/16;
  max-height: 460px;
}

.ig-media-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ig-media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
  padding: 24px;
  text-align: center;
  font-size: 0.78rem;
}

.ig-reel-watermark {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 600;
}

.ig-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 4px 12px;
}

.ig-left-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ig-act-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #262626;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms ease;
}

.ig-act-btn:hover {
  transform: scale(1.15);
}

.ig-act-btn:active {
  transform: scale(0.9);
}

.ig-act-btn.heart.liked svg {
  animation: heartPulse 250ms ease-out;
}

@keyframes heartPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.ig-likes-count {
  padding: 0 12px;
  font-size: 0.75rem;
  color: #262626;
  margin-bottom: 6px;
}

.ig-caption-block {
  padding: 0 12px 14px 12px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #262626;
}

.ig-caption-text {
  margin: 0;
  word-break: break-word;
}

.caption-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ig-caption-author {
  font-weight: 700;
  margin-right: 6px;
}

.ig-more-toggle {
  background: none;
  border: none;
  color: #8e8e8e;
  padding: 0;
  font-size: 0.75rem;
  cursor: pointer;
  margin-top: 2px;
}

.ig-hashtags-text {
  margin: 6px 0 0 0;
  color: #00376b;
  font-size: 0.75rem;
  word-break: break-word;
}

.ig-timestamp-footer {
  margin-top: 6px;
  font-size: 0.6875rem;
  color: #8e8e8e;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* ── Right Column: Decision & Editorial Panel ── */
.approval-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.post-pillar-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
}

.pillar-bullet {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.panel-creator-info {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.post-meta-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.post-review-title {
  font: 700 1.25rem/1.3 var(--font-serif);
  color: var(--text-primary);
  margin: 0;
}

.schedule-callout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* ── Church Norms Checklist ── */
.norms-checklist-card {
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checklist-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
}

.checklist-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #334155;
  cursor: pointer;
}

.check-item input[type="checkbox"] {
  accent-color: var(--accent-primary);
  width: 15px;
  height: 15px;
  cursor: pointer;
}

/* ── Feedback & Observation Box ── */
.feedback-control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-label-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.required-tag {
  font-size: 0.7rem;
  color: var(--accent-danger);
  font-weight: 500;
}

.feedback-textarea {
  resize: vertical;
  min-height: 75px;
  font-size: 0.8125rem;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  background: #ffffff;
  transition: all var(--transition-fast);
}

.feedback-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 125, 165, 0.12);
  outline: none;
}

.quick-chips-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-chip:hover {
  background: #007da5;
  border-color: #006184;
  color: #ffffff;
  transform: translateY(-1px);
}

.quick-chip:active {
  transform: scale(0.96);
}

/* ── Primary Action Buttons ── */
.approval-actions-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 4px;
}

.btn-approve {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background: #166534;
  color: #ffffff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(22, 101, 52, 0.25);
  transition: all 140ms ease;
}

.btn-approve:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.35);
  transform: translateY(-1px);
}

.btn-approve:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 1px 3px rgba(22, 101, 52, 0.2);
}

.btn-reject {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background: #ffffff;
  color: #b91c1c;
  border: 1.5px solid #f87171;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 140ms ease;
}

.btn-reject:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
  transform: translateY(-1px);
}

.btn-reject:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e2e8f0;
  color: #94a3b8;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── History Audit List ── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-raised);
}

.hi-status-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hi-status-icon.approved {
  background: #e8f5e9;
  color: #166534;
}

.hi-status-icon.rejected {
  background: #fde8e8;
  color: #991b1b;
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
  font: 700 1rem/1.2 var(--font-serif);
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
  color: #166534;
}

.empty-state h3 {
  font: 700 1.15rem/1.2 var(--font-serif);
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.empty-state p {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 900px) {
  .approval-review-card {
    grid-template-columns: 1fr;
  }
  .ig-phone-frame {
    max-width: 100%;
  }
  .checklist-items {
    grid-template-columns: 1fr;
  }
}
</style>
