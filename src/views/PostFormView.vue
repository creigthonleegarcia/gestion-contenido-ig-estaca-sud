<template>
  <div class="post-form-page animate-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Editar Publicación' : 'Nueva Publicación' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Modifica el contenido antes de enviarlo' : 'Crea contenido alineado a la estrategia editorial' }}</p>
      </div>
      <router-link to="/content" class="btn btn-ghost">← Volver</router-link>
    </div>

    <div class="form-layout">
      <div class="form-main card">
        <div class="form-group">
          <label>Título *</label>
          <input v-model="form.title" placeholder="Ej: Paz en el Salvador" required />
        </div>

        <div class="form-group">
          <label>Caption / Descripción</label>
          <textarea v-model="form.caption" rows="5"
            placeholder="Escribe el texto de la publicación..."></textarea>
          <span class="char-count">{{ (form.caption || '').length }} / 2,200</span>
        </div>

        <div class="form-group">
          <label>Hashtags</label>
          <input v-model="form.hashtags" placeholder="#EstacaLaSerena #VenSígueme #SUD" />
        </div>

        <!-- Logo/Branding Guidance Banner -->
        <div v-if="logoGuidance.show" class="logo-guidance" :class="logoGuidance.type">
          <div class="lg-title">{{ logoGuidance.title }}</div>
          <p class="lg-text">{{ logoGuidance.text }}</p>
          <details class="lg-details">
            <summary>📊 Datos clave de la investigación</summary>
            <ul>
              <li><strong>Adam Mosseri (CEO Instagram):</strong> Tu propio logo NO es penalizado por el algoritmo</li>
              <li><strong>Pero:</strong> la audiencia scrollea más rápido si percibe "publicidad" → menos engagement → menos alcance</li>
              <li><strong>Señal #1 del algoritmo en 2026:</strong> Envíos por DM (compartidos), no likes</li>
              <li><strong>Mejor estrategia:</strong> Identidad visual (colores + tipografía) sin estampar logo</li>
              <li><strong>Sí penalizado:</strong> Marcas de agua de TikTok, YouTube o CapCut</li>
            </ul>
          </details>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Pilar Estratégico</label>
            <select v-model="form.pillar_id">
              <option value="">Seleccionar pilar</option>
              <option v-for="p in pillars" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Formato</label>
            <select v-model="form.format">
              <option value="static">📷 Imagen estática</option>
              <option value="carousel">🎠 Carrusel</option>
              <option value="reel">🎬 Reel (video)</option>
              <option value="story">📱 Story</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Fecha y hora programada</label>
          <input type="datetime-local" v-model="form.scheduled_at" />
        </div>

        <div class="form-group">
          <label>Imagen / Video</label>
          <div class="media-uploader" @dragover.prevent @drop.prevent="handleDrop">
            <input type="file" ref="fileInput" @change="handleFileSelect"
                   accept="image/*,video/*" style="display:none" />
            <div v-if="preview" class="media-preview">
              <img v-if="isImage" :src="preview" alt="Preview" />
              <video v-else :src="preview" controls />
              <button class="remove-media" @click="removeMedia">✕</button>
            </div>
            <div v-else class="upload-placeholder" @click="$refs.fileInput.click()">
              <span class="upload-icon">📤</span>
              <p>Arrastra un archivo o haz clic para seleccionar</p>
              <p class="upload-hint">JPG, PNG, GIF, MP4, MOV — Máx 50MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Checklist + Preview -->
      <div class="form-sidebar">
        <div class="card norms-card">
          <h3 class="card-title">📋 Checklist Normativo</h3>
          <div class="checklist">
            <label v-for="(item, i) in checklist" :key="i" class="check-item">
              <input type="checkbox" v-model="item.checked" />
              <span>{{ item.label }}</span>
            </label>
          </div>
          <div class="checklist-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: checklistProgress + '%' }"></div>
            </div>
            <span>{{ checklistChecked }}/{{ checklist.length }}</span>
          </div>
        </div>

        <div class="card preview-card">
          <h3 class="card-title">👁️ Vista Previa</h3>
          <div class="ig-preview">
            <div class="ig-header">
              <div class="ig-avatar">⛪</div>
              <div class="ig-handle">
                <span class="ig-name">estaca_laserena</span>
                <span class="ig-loc">La Serena, Chile</span>
              </div>
            </div>
            <div class="ig-media">
              <img v-if="preview && isImage" :src="preview" alt="" />
              <div v-else class="ig-placeholder">{{ form.format === 'reel' ? '🎬' : '📷' }}</div>
            </div>
            <div class="ig-caption">
              <span class="ig-caption-user">estaca_laserena </span>
              <span>{{ truncate(form.caption, 120) }}</span>
            </div>
            <div class="ig-hashtags" v-if="form.hashtags">{{ form.hashtags }}</div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-ghost" @click="saveDraft" :disabled="saving">
            💾 Guardar borrador
          </button>
          <button class="btn btn-primary" @click="saveAndSubmit" :disabled="saving">
            📤 Guardar y enviar a revisión
          </button>
        </div>
      </div>
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
  title: '', caption: '', hashtags: '', pillar_id: '',
  format: 'static', scheduled_at: '', media: null
})

const preview = ref(null)
const isImage = ref(true)
const saving = ref(false)
const fileInput = ref(null)

// Detect if selected pillar is "Inspiración" (pillar 1)
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
    show: true, type: 'warning',
    title: '⚠️ Evitar logo prominente — Pilar Inspiración',
    text: 'La investigación muestra que el contenido inspiracional funciona mejor sin logo visible. Un logo grande activa el "filtro anti-publicidad" del usuario, reduciendo engagement. Usa identidad visual (colores/tipografía) en su lugar. El nombre de usuario y foto de perfil ya identifican la cuenta.'
  }
  if (isServicePillar.value) return {
    show: true, type: 'tip',
    title: '💡 Logo sutil recomendado — Pilar Servicio',
    text: 'Para contenido de SirveAhora, un logo pequeño como "firma" es aceptable, especialmente si será reposteado por municipalidades u ONG. Prioriza que las personas sean protagonistas de la imagen.'
  }
  if (isInfoPillar.value) return {
    show: true, type: 'tip',
    title: '📋 Logo aceptable — Pilar Informativo',
    text: 'En infografías, calendarios y carteleras el logo aporta credibilidad institucional. Úsalo de forma discreta, sin dominar la composición visual.'
  }
  return { show: false }
})

const checklist = reactive([
  { label: 'Citas doctrinales provienen de fuentes oficiales', checked: false },
  { label: 'Nombres correctamente escritos', checked: false },
  { label: 'Permiso de imagen obtenido (menores de edad)', checked: false },
  { label: 'Sin promoción de empresas ni causas políticas', checked: false },
  { label: 'Lenguaje inclusivo y comprensible', checked: false },
  { label: 'Formato técnico correcto (9:16 para Reels)', checked: false },
  { label: 'Subtítulos incluidos (si es video)', checked: false },
  { label: 'Sin marcas de agua de TikTok/YouTube/CapCut', checked: false },
  { label: 'Logo: ausente o sutil según pilar (ver guía)', checked: false },
  { label: 'Identidad visual consistente (colores y tipografía institucionales)', checked: false },
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
  } finally { saving.value = false }
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
  } finally { saving.value = false }
}

onMounted(async () => {
  await pillarsStore.fetchPillars()
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

.form-main { padding: 28px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group { margin-bottom: 18px; }

.char-count {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: right;
  display: block;
  margin-top: 4px;
}

.media-uploader {
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.media-uploader:hover { border-color: var(--accent-primary); }

.upload-placeholder {
  padding: 40px;
  text-align: center;
  cursor: pointer;
  color: var(--text-muted);
}

.upload-icon { font-size: 2.5rem; display: block; margin-bottom: 12px; }
.upload-hint { font-size: 0.72rem; margin-top: 8px; }

.media-preview {
  position: relative;
  max-height: 300px;
}

.media-preview img, .media-preview video {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.remove-media {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 32px;
}

.norms-card { padding: 20px; }

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 14px;
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1.4;
}

.check-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--accent-success);
  flex-shrink: 0;
}

.checklist-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-success);
  border-radius: 2px;
  transition: width var(--transition-normal);
}

/* Instagram Preview */
.preview-card { padding: 20px; }

.ig-preview {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-primary);
}

.ig-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.ig-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), #3a7bc8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.ig-handle { display: flex; flex-direction: column; }
.ig-name { font-size: 0.8rem; font-weight: 700; }
.ig-loc { font-size: 0.65rem; color: var(--text-muted); }

.ig-media {
  width: 100%;
  aspect-ratio: 1;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ig-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ig-placeholder {
  font-size: 3rem;
  opacity: 0.2;
}

.ig-caption {
  padding: 10px 12px 4px;
  font-size: 0.78rem;
  line-height: 1.5;
}

.ig-caption-user { font-weight: 700; }

.ig-hashtags {
  padding: 2px 12px 10px;
  font-size: 0.72rem;
  color: var(--accent-primary);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions .btn {
  justify-content: center;
}

/* Logo/Branding Guidance Banner */
.logo-guidance {
  padding: 16px 18px;
  border-radius: var(--radius-sm);
  margin-bottom: 18px;
  border-left: 4px solid;
  animation: fadeIn 0.3s ease;
}

.logo-guidance.warning {
  background: rgba(245, 166, 35, 0.08);
  border-color: var(--accent-warning);
}

.logo-guidance.tip {
  background: rgba(74, 144, 217, 0.06);
  border-color: var(--accent-primary);
}

.lg-title {
  font-size: 0.88rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.logo-guidance.warning .lg-title { color: var(--accent-warning); }
.logo-guidance.tip .lg-title { color: var(--accent-primary); }

.lg-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.lg-details {
  margin-top: 8px;
}

.lg-details summary {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 0;
  transition: color var(--transition-fast);
}

.lg-details summary:hover {
  color: var(--text-primary);
}

.lg-details ul {
  list-style: none;
  padding: 8px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lg-details li {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
}

.lg-details li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--accent-primary);
  font-weight: 600;
}
</style>
