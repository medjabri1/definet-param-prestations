/* ═══════════════════════════════════════════════════════════════
   TOPBAR — Breadcrumb + utilisateur
   ═══════════════════════════════════════════════════════════════ */
const Topbar = (() => {

  function _crumbs(path) {
    if (path === '/' || path === '') return [{ label: 'Accueil' }];
    const base = [{ label: 'Accueil', route: '/' }, { label: 'Paramétrage & administration' }];
    if (path.startsWith('/prestations/nouveau')) return [...base, { label: 'Prestations', route: '/prestations' }, { label: 'Nouvelle prestation' }];
    if (path.startsWith('/prestations/')) {
      const p = Data.prestation(path.split('/')[2]);
      return [...base, { label: 'Prestations', route: '/prestations' }, { label: p ? p.nom : 'Fiche prestation' }];
    }
    if (path.startsWith('/prestations')) return [...base, { label: 'Prestations' }];
    return [...base, { label: 'Section' }];
  }

  function render() {
    const el = document.getElementById('topbar');
    if (!el) return;
    const route = State.get('route') || '/';
    const crumbs = _crumbs(route.split('?')[0]);
    el.innerHTML = `
      <div class="topbar-left">
        <nav class="breadcrumb">
          ${crumbs.map((c, i) => `
            ${i > 0 ? '<span class="bc-sep material-icons-outlined">chevron_right</span>' : ''}
            ${c.route
              ? `<a class="bc-item" href="javascript:Router.go('${c.route}')">${c.label}</a>`
              : `<span class="bc-item current">${c.label}</span>`}
          `).join('')}
        </nav>
      </div>
      <div class="topbar-right">
        <button class="icon-btn" title="Notifications"><span class="material-icons-outlined">notifications_none</span></button>
        <button class="icon-btn" title="Aide"><span class="material-icons-outlined">help_outline</span></button>
        <div class="topbar-user">
          <div class="user-avatar">AD</div>
          <div class="user-info"><div class="user-name">Admin Démo</div><div class="user-role">Administrateur</div></div>
        </div>
      </div>`;
  }
  State.on('route', render);
  return { render };
})();
window.Topbar = Topbar;

(function injectTopbarStyle(){
  if (document.getElementById('topbar-style')) return;
  const s = document.createElement('style'); s.id = 'topbar-style';
  s.textContent = `
    .topbar { height: var(--topbar-height); background: var(--c-surface); border-bottom: 1px solid var(--c-border);
      display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
    .topbar-left, .topbar-right { display: flex; align-items: center; gap: 12px; }
    .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .bc-item { color: var(--c-text-3); text-decoration: none; transition: color .15s; }
    .bc-item:hover { color: var(--c-primary); }
    .bc-item.current { color: var(--c-text-1); font-weight: 600; }
    .bc-sep { font-size: 14px !important; color: var(--c-text-4); }
    .topbar-user { display: flex; align-items: center; gap: 10px; padding-left: 12px; border-left: 1px solid var(--c-border); margin-left: 4px; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--c-primary); color: white;
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
    .user-info { line-height: 1.2; }
    .user-name { font-size: 12px; font-weight: 600; color: var(--c-text-1); }
    .user-role { font-size: 10px; color: var(--c-text-3); }`;
  document.head.appendChild(s);
})();
