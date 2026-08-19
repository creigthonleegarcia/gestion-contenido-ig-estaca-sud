<template>
  <div class="post-form-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Editar Publicación' : 'Nueva Publicación' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Modifica el contenido antes de someterlo al proceso de revisión' : 'Crea contenido alineado a la estrategia editorial y doctrina oficial' }}</p>
      </div>
      <router-link to="/content" class="btn btn-secondary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Volver a Contenido</span>
      </router-link>
    </div>

    <div class="form-layout">
      <!-- Main Form Column -->
      <div class="form-main card">
        <div class="form-group">
          <label class="form-label">Título de la Publicación *</label>
          <input v-model="form.title" placeholder="Ej: Paz en el Salvador — Conferencia General" class="form-control" required />
        </div>

        <div class="form-group">
          <label class="form-label">Texto / Caption de Instagram</label>
          <textarea
            v-model="form.caption"
            rows="6"
            placeholder="Escribe el mensaje doctrinal o informativo para acompañar la imagen..."
            class="form-control textarea-field"
          ></textarea>
          <div class="caption-footer">
            <span class="char-count" :class="{ 'char-warning': (form.caption || '').length > 2000 }">
              {{ (form.caption || '').length }} / 2,200 caracteres
            </span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Hashtags Recomendados</label>
          <div class="input-icon-wrap">
            <span class="input-icon">#</span>
            <input v-model="form.hashtags" placeholder="EstacaLaSerena VenSigueme SudChile IglesiaDeJesucristo" class="form-control with-icon" />
          </div>
        </div>

        <!-- Dynamic Logo & Branding Guidance Banner -->
        <div v-if="logoGuidance.show" class="logo-guidance" :class="logoGuidance.type">
          <div class="lg-header">
            <svg v-if="logoGuidance.type === 'warning'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span class="lg-title">{{ logoGuidance.title }}</span>
          </div>
          <p class="lg-text">{{ logoGuidance.text }}</p>
          <details class="lg-details">
            <summary>Datos clave del algoritmo de Instagram (2026)</summary>
            <ul>
              <li><strong>Adam Mosseri (CEO Instagram):</strong> Tu propio logo no es penalizado algorítmicamente.</li>
              <li><strong>Comportamiento de la audiencia:</strong> Logotipos prominentes generan "ceguera publicitaria" en publicaciones espirituales e inspiracionales.</li>
              <li><strong>Señal #1 de distribución:</strong> Los envíos por mensaje directo (DM) impulsan más el alcance que los me gusta.</li>
              <li><strong>Regla de oro:</strong> Prioriza identidad visual estética (colores institucionales y tipografía legible) sin sobrecargar de logos.</li>
            </ul>
          </details>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Pilar Estratégico</label>
            <select v-model="form.pillar_id" class="form-control">
              <option value="">Seleccionar pilar doctrinal</option>
              <option v-for="p in pillars" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Formato de Contenido</label>
            <select v-model="form.format" class="form-control">
              <option value="static">Imagen Estática (1:1 o 4:5)</option>
              <option value="carousel">Carrusel Deslizable</option>
              <option value="reel">Reel de Video (9:16)</option>
              <option value="story">Historia (24 hrs)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Fecha y Hora de Publicación Sugerida</label>
          <input type="datetime-local" v-model="form.scheduled_at" class="form-control" />
          <span class="hint-text">Horario recomendado según audiencia activa: 18:00 hrs.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Material Multimedia (Imagen / Video)</label>
          <div class="media-uploader" @dragover.prevent @drop.prevent="handleDrop">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept="image/*,video/*"
              style="display:none"
            />
            <div v-if="preview" class="media-preview-box">
              <img v-if="isImage" :src="preview" alt="Preview" class="preview-img" />
              <video v-else :src="preview" controls class="preview-video" />
              <button class="remove-media-btn" @click="removeMedia" title="Quitar archivo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div v-else class="upload-dropzone" @click="$refs.fileInput.click()">
              <div class="upload-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p class="upload-primary-text">Arrastra un archivo o haz clic para examinar</p>
              <p class="upload-subtext">JPG, PNG, MP4, MOV — Hasta 50 MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Norms Checklist & Instagram Preview -->
      <aside class="form-sidebar">
        <!-- Norms Checklist -->
        <div class="card checklist-card">
          <div class="sidebar-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <h3 class="sidebar-card-title">Checklist Normativo</h3>
          </div>

          <div class="checklist-items">
            <label v-for="(item, i) in checklist" :key="i" class="check-row">
              <input type="checkbox" v-model="item.checked" class="check-box" />
              <span class="check-text">{{ item.label }}</span>
            </label>
          </div>

          <div class="checklist-footer">
            <div class="progress-track">
              <div class="progress-bar-fill" :style="{ width: `${checklistProgress}%` }"></div>
            </div>
            <span class="progress-label">{{ checklistChecked }}/{{ checklist.length }} completados</span>
          </div>
        </div>

        <!-- Instagram Device Preview -->
        <div class="card preview-card">
          <div class="sidebar-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <h3 class="sidebar-card-title">Vista Previa Instagram</h3>
          </div>

          <div class="ig-mockup">
            <!-- IG Header -->
            <div class="ig-mockup-header">
              <div class="ig-user-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l7-4 7 4v14"/>
                  <path d="M9 21v-6h6v6"/>
                </svg>
              </div>
              <div class="ig-user-meta">
                <span class="ig-user-name">estacalaserena</span>
                <span class="ig-user-sub">La Serena, Chile</span>
              </div>
              <div class="ig-dots">•••</div>
            </div>

            <!-- IG Media -->
            <div class="ig-mockup-media">
              <img v-if="preview && isImage" :src="preview" alt="Preview" class="ig-img" />
              <div v-else class="ig-media-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            </div>

            <!-- IG Action Icons Bar -->
            <div class="ig-actions-bar">
              <div class="ig-left-actions">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>

            <!-- IG Caption -->
            <div class="ig-caption-block">
              <span class="ig-caption-author">estacalaserena </span>
              <span class="ig-caption-content">{{ truncate(form.caption || 'Escribe una descripción para ver cómo se verá en el feed de Instagram.', 110) }}</span>
            </div>

            <div class="ig-tags-block" v-if="form.hashtags">
              {{ form.hashtags }}
            </div>
          </div>
        </div>

        <!-- Form Submission Actions -->
        <div class="sidebar-actions">
          <button class="btn btn-secondary btn-full" @click="saveDraft" :disabled="saving">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Guardar como Borrador</span>
          </button>

          <button class="btn btn-primary btn-full" @click="saveAndSubmit" :disabled="saving">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Enviar a Revisión</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePostsStore, usePillarsStore } from '../stores/index'

const router = useRouter()
const route = useRoute()
const postsStore = usePostsStore()
const pillarsStore = usePillarsStore()

const isEdit = computed(() => !!route.params.id)
const pillars = computed(() => pillarsStore.pillars)

const form = reactive({
  title: '',
  caption: '',
  hashtags: '',
  pillar_id: '',
  format: 'static',
  scheduled_at: '',
  media: null
})

const preview = ref(null)
const isImage = ref(true)
const saving = ref(false)
const fileInput = ref(null)

const isInspirationPillar = computed(() => {
  const p = pillars.value.find(pl => pl.id === Number(form.pillar_id))
  return p?.slug === 'inspiracion' || p?.name?.toLowerCase().includes('inspiraci')
})

const isServicePillar = computed(() => {
  const p = pillars.value.find(pl => pl.id === Number(form.pillar_id))
  return p?.slug === 'servicio' || p?.name?.toLowerCase().includes('sirve')
})

const isInfoPillar = computed(() => {
  const p = pillars.value.find(pl => pl.id === Number(form.pillar_id))
  return p?.slug === 'informacion' || p?.name?.toLowerCase().includes('informaci')
})

const logoGuidance = computed(() => {
  if (isInspirationPillar.value) return {
    show: true,
    type: 'warning',
    title: 'Pilar Inspiración — Evitar logotipo prominente',
    text: 'El contenido espiritual funciona significativamente mejor sin logotipo estampado. Un logo visible activa la percepción de anuncio en el espectador, reduciendo envíos por mensaje directo y engagement. La cuenta ya queda identificada por la foto de perfil.'
  }
  if (isServicePillar.value) return {
    show: true,
    type: 'tip',
    title: 'Pilar Servicio — Logotipo sutil permitido',
    text: 'Para actividades comunitarias y proyectos SirveAhora, se permite un logo pequeño o discreto como firma institucional para compartir con organizaciones o municipalidades.'
  }
  if (isInfoPillar.value) return {
    show: true,
    type: 'tip',
    title: 'Pilar Informativo — Logotipo institucional aceptado',
    text: 'En infografías, carteleras oficiales y anuncios de conferencias, el logotipo otorga respaldo institucional.'
  }
  return { show: false }
})

const checklist = reactive([
  { label: 'Citas doctrinales provienen de fuentes oficiales de la Iglesia', checked: false },
  { label: 'Nombres de líderes y barrios correctamente escritos', checked: false },
  { label: 'Autorización de imagen obtenida (especialmente menores)', checked: false },
  { label: 'Sin publicidad comercial ni causas de terceros', checked: false },
  { label: 'Tono solemne, edificante e inclusivo', checked: false },
  { label: 'Formato técnico optimizado (4:5 para imagen, 9:16 para Reels)', checked: false },
  { label: 'Subtítulos incluidos en videos', checked: false },
  { label: 'Sin marcas de agua de apps externas (TikTok, CapCut)', checked: false },
  { label: 'Uso de logotipo apropiado según el pilar estratégico', checked: false },
  { label: 'Identidad visual y colores institucionales respetados', checked: false },
])

const checklistChecked = computed(() => checklist.filter(c => c.checked).length)
const checklistProgress = computed(() => (checklistChecked.value / checklist.length) * 100)

function truncate(text, len) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  form.media = file
  isImage.value = file.type.startsWith('image/')
  preview.value = URL.createObjectURL(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (!file) return
  form.media = file
  isImage.value = file.type.startsWith('image/')
  preview.value = URL.createObjectURL(file)
}

function removeMedia() {
  form.media = null
  preview.value = null
}

function buildFormData() {
  const fd = new FormData()
  fd.append('title', form.title)
  fd.append('caption', form.caption)
  fd.append('hashtags', form.hashtags)
  if (form.pillar_id) fd.append('pillar_id', form.pillar_id)
  fd.append('format', form.format)
  if (form.scheduled_at) fd.append('scheduled_at', form.scheduled_at)
  if (form.media) fd.append('media', form.media)
  fd.append('norms_checklist', JSON.stringify(checklist.map(c => ({ label: c.label, checked: c.checked }))))
  return fd
}

async function saveDraft() {
  saving.value = true
  try {
    const fd = buildFormData()
    if (isEdit.value) {
      await postsStore.updatePost(route.params.id, fd)
    } else {
      await postsStore.createPost(fd)
    }
    router.push('/content')
  } finally {
    saving.value = false
  }
}

async function saveAndSubmit() {
  saving.value = true
  try {
    const fd = buildFormData()
    let post
    if (isEdit.value) {
      post = await postsStore.updatePost(route.params.id, fd)
    } else {
      post = await postsStore.createPost(fd)
    }
    await postsStore.submitForReview(post.id)
    router.push('/content')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await pillarsStore.fetchPillars()
  if (route.query.date) {
    form.scheduled_at = `${route.query.date}T18:00`
  }
  if (isEdit.value) {
    const post = await postsStore.fetchPost(route.params.id)
    form.title = post.title || ''
    form.caption = post.caption || ''
    form.hashtags = post.hashtags || ''
    form.pillar_id = post.pillar_id || ''
    form.format = post.format || 'static'
    form.scheduled_at = post.scheduled_at ? post.scheduled_at.replace(' ', 'T').slice(0, 16) : ''
    if (post.media_paths) {
      preview.value = `http://localhost:3001/uploads/${post.media_paths.split(',')[0]}`
      isImage.value = true
    }
    if (post.norms_checklist) {
      try {
        const saved = JSON.parse(post.norms_checklist)
        saved.forEach((s, i) => { if (checklist[i]) checklist[i].checked = s.checked })
      } catch (e) { /* ignore */ }
    }
  }
})
</script>

<style scoped>
.post-form-page {
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

.form-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--sp-24);
  align-items: start;
}

.form-main {
  padding: 28px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  background: var(--gray-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
}

.form-control:focus {
  background: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(0, 125, 165, 0.12);
}

.textarea-field {
  resize: vertical;
  line-height: 1.5;
}

.caption-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.char-warning {
  color: var(--accent-danger);
}

.input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.form-control.with-icon {
  padding-left: 28px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-16);
}

.hint-text {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

/* ── Logo Guidance ── */
.logo-guidance {
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  border-left: 4px solid;
}

.logo-guidance.warning {
  background: #fff8f0;
  border-color: var(--accent-warning);
}

.logo-guidance.tip {
  background: #f0f9fc;
  border-color: var(--accent-primary);
}

.lg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.logo-guidance.warning .lg-header { color: var(--accent-warning); }
.logo-guidance.tip .lg-header { color: var(--accent-primary); }

.lg-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.lg-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.lg-details summary {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}

.lg-details ul {
  margin: 8px 0 0 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lg-details li {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Media Uploader ── */
.media-uploader {
  border: 2px dashed var(--border-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--gray-2);
  transition: all var(--transition-fast);
}

.media-uploader:hover {
  border-color: var(--accent-primary);
  background: #f4fafd;
}

.upload-dropzone {
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gray-3);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.upload-primary-text {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.upload-subtext {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 0;
}

.media-preview-box {
  position: relative;
  max-height: 320px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img, .preview-video {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.remove-media-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-media-btn:hover {
  background: var(--accent-danger);
}

/* ── Sidebar Column ── */
.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
  position: sticky;
  top: 24px;
}

.checklist-card, .preview-card {
  padding: 18px 20px;
  background: var(--bg-level1);
  border: 1px solid var(--border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.sidebar-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.sidebar-card-title {
  font: 700 0.875rem/1.2 var(--font-serif);
  margin: 0;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1.35;
}

.check-box {
  margin-top: 2px;
  accent-color: var(--accent-success);
  flex-shrink: 0;
}

.checklist-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-tertiary);
  padding-top: 10px;
}

.progress-track {
  height: 4px;
  background: var(--gray-3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent-success);
  transition: width var(--transition-normal);
}

.progress-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: right;
}

/* ── IG Mockup ── */
.ig-mockup {
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #ffffff;
}

.ig-mockup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--gray-3);
}

.ig-user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ig-user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ig-user-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #212225;
}

.ig-user-sub {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.ig-dots {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.ig-mockup-media {
  width: 100%;
  aspect-ratio: 1;
  background: var(--gray-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ig-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ig-media-placeholder {
  color: var(--text-muted);
  opacity: 0.4;
}

.ig-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px 4px;
  color: #212225;
}

.ig-left-actions {
  display: flex;
  gap: 10px;
}

.ig-caption-block {
  padding: 4px 10px 6px;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #212225;
}

.ig-caption-author {
  font-weight: 700;
}

.ig-tags-block {
  padding: 0 10px 8px;
  font-size: 0.72rem;
  color: var(--accent-primary);
  word-break: break-word;
}

/* ── Sidebar Actions ── */
.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-full {
  width: 100%;
  justify-content: center;
}

@media (max-width: 980px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
