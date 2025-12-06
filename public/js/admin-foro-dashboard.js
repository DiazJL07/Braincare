const ForoAdminDashboard = {
  config: { refreshInterval: 30000 },
  state: { currentForoId: null },
  init() {
    this.bindHeaderButtons();
    this.bindTableActions();
    this.bindDeleteModal();
    this.initializeNewPostModal();
    this.updateStatistics();
    setInterval(() => this.updateStatistics(), this.config.refreshInterval);
    renderForoPagination();
    applyForoPage();
  },
  bindHeaderButtons() {
    document.querySelectorAll('.foro-action-btn').forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action === 'new-topic') {
        btn.addEventListener('click', e => { e.preventDefault(); this.openNewPostModal(); });
      }
    });
  },
  bindTableActions() {
    const tbody = document.querySelector('.foro-posts-table tbody');
    if (!tbody) return;
    tbody.addEventListener('click', e => {
      const del = e.target.closest('.foro-btn-delete, .gen-action-btn-sm.delete');
      if (del) {
        const id = del.getAttribute('data-post-id');
        const title = del.getAttribute('data-post-title') || '';
        this.confirmDeleteForo(id, title);
      }
    });
  },
  bindDeleteModal() {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const closeBtn = document.getElementById('closeDeleteModal');
    if (confirmBtn) confirmBtn.addEventListener('click', () => this.executeDeleteForo());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeDeleteModal());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDeleteModal());
    const modal = document.getElementById('deleteForoModal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) this.closeDeleteModal(); });
  },
  confirmDeleteForo(id, title) {
    this.state.currentForoId = id;
    const modal = document.getElementById('deleteForoModal');
    const titleEl = document.getElementById('foroTitle');
    if (titleEl) titleEl.textContent = title;
    if (modal) { modal.classList.add('show'); modal.style.display = 'flex'; }
  },
  closeDeleteModal() {
    const modal = document.getElementById('deleteForoModal');
    if (modal) { modal.classList.remove('show'); setTimeout(() => { modal.style.display = 'none'; }, 300); }
    this.state.currentForoId = null;
  },
  async executeDeleteForo() {
    if (!this.state.currentForoId) return;
    try {
      const res = await fetch(`/foro/admin/${this.state.currentForoId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin'
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        this.closeDeleteModal();
        if (data && data.redirectTo) { window.location.href = data.redirectTo; } else { window.location.reload(); }
      } else {
        this.closeDeleteModal();
        window.location.reload();
      }
    } catch (_) {
      this.closeDeleteModal();
    }
  },
  openNewPostModal() {
    const modal = document.getElementById('newPostModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const form = document.getElementById('newForoForm');
    if (form) form.reset();
    const alertBox = document.getElementById('foroAlert');
    if (alertBox) alertBox.innerHTML = '';
    this.loadTopics();
  },
  closeNewPostModal() {
    const modal = document.getElementById('newPostModal');
    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
  },
  async loadTopics() {
    const select = document.getElementById('modalTopic');
    if (!select) return;
    try {
      const r = await fetch('/admin/topics/api');
      if (!r.ok) throw new Error();
      const topics = await r.json();
      select.innerHTML = '<option value="">Selecciona una categoría</option>';
      topics.forEach(t => {
        if (t.isActive) {
          const opt = document.createElement('option');
          opt.value = t._id; opt.textContent = t.name;
          select.appendChild(opt);
        }
      });
    } catch (_) {
      select.innerHTML = '<option value="">Error al cargar temas</option>';
    }
  },
  initializeNewPostModal() {
    const overlay = document.getElementById('newPostModal');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) this.closeNewPostModal(); });
    const form = document.getElementById('newForoForm');
    if (form) form.addEventListener('submit', e => this.handleNewForoSubmit(e));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = document.getElementById('newPostModal'); if (m && m.style.display === 'flex') this.closeNewPostModal(); } });
  },
  async handleNewForoSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('submitForoBtn');
    const spinner = document.getElementById('submitSpinner');
    const alertBox = document.getElementById('foroAlert');
    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.remove('d-none');
    try {
      const fd = new FormData(form);
      const res = await fetch('/foro/admin', { method: 'POST', body: fd });
      if (res.ok) {
        if (alertBox) alertBox.innerHTML = '<div class="alert-pastel alert-pastel-success"><i class="fas fa-check-circle"></i> ¡Publicación creada exitosamente!</div>';
        setTimeout(() => { this.closeNewPostModal(); window.location.reload(); }, 1000);
      } else {
        if (alertBox) alertBox.innerHTML = '<div class="alert-pastel alert-pastel-danger"><i class="fas fa-exclamación-circle"></i> Error al crear la publicación.</div>';
      }
    } catch (_) {
      if (alertBox) alertBox.innerHTML = '<div class="alert-pastel alert-pastel-danger"><i class="fas fa-exclamation-circle"></i> Error de conexión.</div>';
    } finally {
      if (btn) btn.disabled = false;
      if (spinner) spinner.classList.add('d-none');
    }
  },
  updateStatistics() {}
};

document.addEventListener('DOMContentLoaded', () => { ForoAdminDashboard.init(); });
window.ForoAdminDashboard = ForoAdminDashboard;
window.openNewPostModal = function() { ForoAdminDashboard.openNewPostModal(); };
window.toggleForumAdvancedFilters = function() {
  const panel = document.getElementById('foroAdvancedFilters');
  const btn = document.querySelector('.articles-filters-toggle');
  if (!panel) return;
  const visible = panel.style.display === 'block' || panel.style.display === '' && panel.classList.contains('show');
  if (visible) {
    panel.style.display = 'none';
    if (btn) btn.innerHTML = '<i class="fas fa-cog"></i> Filtros Avanzados';
  } else {
    panel.style.display = 'block';
    if (btn) btn.innerHTML = '<i class="fas fa-times"></i> Ocultar Filtros';
  }
};
window.filterForum = function() {
  const search = (document.getElementById('foroSearchInput')?.value || '').trim().toLowerCase();
  const topic = (document.getElementById('foroTopicFilter')?.value || 'all').toLowerCase();
  const author = (document.getElementById('foroAuthorFilter')?.value || 'all').toLowerCase();
  const dateFrom = document.getElementById('foroDateFrom')?.value || '';
  const dateTo = document.getElementById('foroDateTo')?.value || '';
  const viewsMin = parseInt(document.getElementById('foroViewsMin')?.value || '', 10);
  const viewsMax = parseInt(document.getElementById('foroViewsMax')?.value || '', 10);
  const rows = document.querySelectorAll('.foro-posts-table tbody tr');
  rows.forEach(row => {
    const titleEl = row.querySelector('.foro-post-title');
    const topicEl = row.querySelector('.foro-topic-badge');
    const authorEl = row.querySelector('.foro-author-name');
    const dateEl = row.querySelector('.foro-date-cell');
    const viewsEl = row.querySelector('.views-badge');
    const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
    const topicText = topicEl ? topicEl.textContent.trim().toLowerCase() : '';
    const authorText = authorEl ? authorEl.textContent.trim().toLowerCase() : '';
    const dateText = dateEl ? dateEl.textContent.trim() : '';
    const views = viewsEl ? parseInt(viewsEl.textContent.trim(), 10) || 0 : 0;
    let ok = true;
    if (search) {
      ok = ok && (title.includes(search) || authorText.includes(search));
    }
    if (topic && topic !== 'all') {
      ok = ok && topicText === topic;
    }
    if (author && author !== 'all') {
      ok = ok && authorText === author;
    }
    if (dateFrom) {
      const d = new Date(dateText);
      const f = new Date(dateFrom);
      ok = ok && d >= f;
    }
    if (dateTo) {
      const d = new Date(dateText);
      const t = new Date(dateTo);
      ok = ok && d <= t;
    }
    if (!Number.isNaN(viewsMin)) {
      ok = ok && views >= viewsMin;
    }
    if (!Number.isNaN(viewsMax)) {
      ok = ok && views <= viewsMax;
    }
    row.dataset.filtered = ok ? '0' : '1';
    row.style.display = ok ? '' : 'none';
  });
  foroCurrentPage = 1;
  renderForoPagination();
  applyForoPage();
};

let foroCurrentPage = 1;
const foroPageSize = 15;
function getFilteredForoRows(){
  const rows = Array.from(document.querySelectorAll('.foro-posts-table tbody tr[data-foro-id]'));
  return rows.filter(r => r.dataset.filtered !== '1');
}
function applyForoPage(){
  const rows = Array.from(document.querySelectorAll('.foro-posts-table tbody tr[data-foro-id]'));
  const visible = getFilteredForoRows();
  rows.forEach(r => { r.style.display = (r.dataset.filtered === '1') ? 'none' : r.style.display; });
  const start = (foroCurrentPage-1)*foroPageSize;
  const end = start + foroPageSize;
  visible.forEach((r, idx) => { r.style.display = (idx>=start && idx<end) ? '' : 'none'; });
}
function renderForoPagination(){
  const container = document.getElementById('foroPagination');
  if (!container) return;
  const total = getFilteredForoRows().length;
  const pages = Math.max(1, Math.ceil(total / foroPageSize));
  if (foroCurrentPage > pages) foroCurrentPage = pages;
  container.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const btn = document.createElement('button');
    btn.className = 'gen-page-btn'+(i===foroCurrentPage?' active':'');
    btn.textContent = i;
    btn.onclick = function(){ foroCurrentPage = i; applyForoPage(); renderForoPagination(); };
    container.appendChild(btn);
  }
}

// Exponer funciones de paginación en el ámbito global
window.renderForoPagination = renderForoPagination;
window.applyForoPage = applyForoPage;
document.addEventListener('DOMContentLoaded', function(){ try{ window.filterForum(); }catch(e){} });
