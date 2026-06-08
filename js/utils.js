/* ═══════════════════════════════════════════════════════════════
   UTILS — Helpers used across all pages
   ═══════════════════════════════════════════════════════════════ */

const Utils = {

  // ── DOM ──────────────────────────────────────────────────────
  qs:  (sel, ctx = document) => ctx.querySelector(sel),
  qsa: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],

  el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class')       e.className = v;
      else if (k === 'html')   e.innerHTML = v;
      else if (k === 'text')   e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (!c && c !== 0) return;
      e.append(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  },

  render(container, html) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = html;
  },

  mount(container, node) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = '';
    if (node) container.appendChild(node);
  },

  // ── Strings ──────────────────────────────────────────────────
  initials(prenom = '', nom = '') {
    return [(prenom[0] || ''), (nom[0] || '')].join('').toUpperCase();
  },

  avatarColor(str = '') {
    const colors = ['blue', 'purple', 'orange', 'green', 'teal'];
    let hash = 0;
    for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  },

  capitalize(str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // ── Dates ────────────────────────────────────────────────────
  formatDate(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  age(dateStr) {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  },

  // ── Number ───────────────────────────────────────────────────
  formatEuro(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  },

  // ── Toast notifications ──────────────────────────────────────
  toast(message, type = 'info', duration = 3000) {
    const icons = { info: 'info', success: 'check_circle', error: 'error', warning: 'warning' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="material-icons-outlined">${icons[type] || 'info'}</span>${message}`;
    const container = document.getElementById('toast-container');
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
  },

  // ── Modal ────────────────────────────────────────────────────
  openModal(html) {
    const layer = document.getElementById('modal-layer');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    layer.removeAttribute('hidden');
    // Close on backdrop click
    layer.querySelector('.modal-backdrop').onclick = () => Utils.closeModal();
    // Close on ESC
    const onKey = e => { if (e.key === 'Escape') { Utils.closeModal(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  },

  closeModal() {
    const layer = document.getElementById('modal-layer');
    layer.setAttribute('hidden', '');
    document.getElementById('modal-container').innerHTML = '';
  },

  // ── Confirm dialog ───────────────────────────────────────────
  confirm(message, onConfirm, options = {}) {
    const { title = 'Confirmer', confirmLabel = 'Confirmer', danger = false } = options;
    Utils.openModal(`
      <div class="modal-header">
        <span class="material-icons-outlined" style="color:var(--c-warning)">warning_amber</span>
        <span class="modal-title">${title}</span>
      </div>
      <div class="modal-body">
        <p style="font-size:var(--fs-md);color:var(--c-text-2);line-height:1.6">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="modal-cancel">Annuler</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmLabel}</button>
      </div>
    `);
    Utils.qs('#modal-cancel').onclick = Utils.closeModal;
    Utils.qs('#modal-confirm').onclick = () => { Utils.closeModal(); onConfirm(); };
  },

  // ── Chip builder ─────────────────────────────────────────────
  chip(label, color = 'blue', icon = null) {
    const ic = icon ? `<span class="material-icons-outlined">${icon}</span>` : '';
    return `<span class="chip ${color}">${ic}${label}</span>`;
  },

  // ── Badge builder ─────────────────────────────────────────────
  badge(label, type = 'active') {
    return `<span class="badge ${type}">${label}</span>`;
  },

  // ── Avatar builder ───────────────────────────────────────────
  avatar(prenom, nom, size = 'md', photo = null) {
    const initials = Utils.initials(prenom, nom);
    const color    = Utils.avatarColor(prenom + nom);
    if (photo) return `<div class="avatar ${size}"><img src="${photo}" alt="${initials}"></div>`;
    return `<div class="avatar ${size} ${color}">${initials}</div>`;
  },

  // ── Status badge (famille) ───────────────────────────────────
  statutBadge(statut) {
    const map = { actif: ['active', 'Actif'], inactif: ['closed', 'Inactif'], attente: ['pending', 'En attente'] };
    const [cls, label] = map[statut] || ['info', statut];
    return Utils.badge(label, cls);
  },

  // ── HTML escape ──────────────────────────────────────────────
  esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── Icon helper ──────────────────────────────────────────────
  icon(name, cls = '') {
    return `<span class="material-icons-outlined${cls ? ' ' + cls : ''}">${name}</span>`;
  },

  // ── Debounce ─────────────────────────────────────────────────
  debounce(fn, ms = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  // ── Event delegation ─────────────────────────────────────────
  delegate(parent, selector, event, handler) {
    parent.addEventListener(event, e => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) handler(e, target);
    });
  },

  // ── Tabs (in-page) ───────────────────────────────────────────
  initTabs(container, onChange) {
    Utils.delegate(container, '[data-tab]', 'click', (e, el) => {
      const tab = el.dataset.tab;
      Utils.qsa('[data-tab]', container).forEach(t => t.classList.toggle('active', t === el));
      Utils.qsa('[data-panel]', container).forEach(p => {
        p.hidden = p.dataset.panel !== tab;
      });
      if (onChange) onChange(tab);
    });
  },

  // ── Accordion ────────────────────────────────────────────────
  initAccordions(container) {
    Utils.delegate(container, '[data-accordion-toggle]', 'click', (e, el) => {
      const id = el.dataset.accordionToggle;
      const panel = Utils.qs(`[data-accordion-panel="${id}"]`, container);
      const icon  = Utils.qs('[data-accordion-icon]', el);
      const open  = el.classList.toggle('open');
      if (panel) panel.hidden = !open;
      if (icon) icon.textContent = open ? 'expand_less' : 'expand_more';
    });
  },
};
window.Utils = Utils;
