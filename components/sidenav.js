/* ═══════════════════════════════════════════════════════════════
   SIDENAV — menu réel DEFINET « Paramétrage & administration ».
   Seul « Prestations » est actif dans cette maquette ; les autres sont grisés.
   ═══════════════════════════════════════════════════════════════ */
const Sidenav = (() => {

  const PARAMS_CHILDREN = [
    { id: 'p-organisation',  icon: 'business',              label: 'Paramétrage de l\'organisation' },
    { id: 'p-etablissement', icon: 'apartment',             label: 'Paramétrage des établissements' },
    { id: 'p-regie-fact',    icon: 'receipt_long',          label: 'Régie de facturation' },
    { id: 'p-regie-enc',     icon: 'payments',              label: 'Régie d\'encaissement' },
    { id: 'p-prestations',   icon: 'category',              label: 'Prestations', route: '/prestations' },  // ACTIF
    { id: 'p-tarifs',        icon: 'sell',                  label: 'Tarifs' },
    { id: 'p-calendriers',   icon: 'calendar_today',        label: 'Calendriers' },
    { id: 'p-profils',       icon: 'manage_accounts',       label: 'Profils' },
    { id: 'p-utilisateurs',  icon: 'person',                label: 'Utilisateurs' },
    { id: 'p-tablettes',     icon: 'tablet',                label: 'Tablettes' },
    { id: 'p-referentiels',  icon: 'list',                  label: 'Référentiels' },
    { id: 'p-admins-prof',   icon: 'admin_panel_settings',  label: 'Administration des profils' },
    { id: 'p-infos-flash',   icon: 'flash_on',              label: 'Infos flash' },
    { id: 'p-perso-edit',    icon: 'brush',                 label: 'Personnalisation des éditions' },
    { id: 'p-perso-graph',   icon: 'palette',               label: 'Personnalisation graphique' },
    { id: 'p-archivage',     icon: 'archive',               label: 'Archivage' },
    { id: 'p-maj',           icon: 'system_update',         label: 'Mise à jour du logiciel' },
    { id: 'p-reglementation',icon: 'policy',                label: 'Réglementation' },
  ];

  const NAV_ITEMS = [
    { id: 'home', icon: 'dashboard', label: 'Accueil', route: '/' },
    null,
    { id: 'params', icon: 'settings', label: 'Paramétrage & administration', route: '/prestations', open: true, children: PARAMS_CHILDREN },
  ];

  function render() {
    const el = document.getElementById('sidenav'); if (!el) return;
    const openGroups = State.get('navOpenGroups') || { params: true };
    el.innerHTML = `
      <div class="snav-brand" onclick="Router.go('/')" title="Definet"><div class="sidenav-logo">D</div><span class="snav-name">Definet</span></div>
      ${NAV_ITEMS.map(item => {
        if (!item) return `<div class="nav-divider"></div>`;
        if (item.children) {
          const isOpen = openGroups[item.id] !== false;
          return `
            <div class="nav-item nav-group${isOpen ? ' open' : ''}" id="nav-${item.id}" data-route="${item.route}" data-tooltip="${item.label}" onclick="Sidenav.handleGroupClick('${item.id}')">
              <span class="material-icons-outlined">${item.icon}</span><span class="nav-label">${item.label}</span>
              <span class="nav-group-arrow material-icons-outlined">expand_more</span>
            </div>
            <div class="nav-sub-items${isOpen ? ' open' : ''}" id="nav-sub-${item.id}">
              ${item.children.map(child => {
                const active = !!child.route;
                const onclick = active ? `event.stopPropagation();Router.go('${child.route}')` : `event.stopPropagation();Utils.toast('Bientôt disponible','info')`;
                return `
                  <div class="nav-sub-item${active ? '' : ' disabled'}" id="nav-${child.id}" data-route="${child.route || ''}" title="${active ? '' : 'Bientôt disponible'}" onclick="${onclick}">
                    <span class="material-icons-outlined">${child.icon}</span><span class="nav-label">${child.label}</span>
                    ${active ? '' : '<span class="material-icons-outlined" style="font-size:13px;margin-left:auto;opacity:.5">lock</span>'}
                  </div>`;
              }).join('')}
            </div>`;
        }
        return `<div class="nav-item" id="nav-${item.id}" data-route="${item.route}" data-tooltip="${item.label}" onclick="Router.go('${item.route}')"><span class="material-icons-outlined">${item.icon}</span><span class="nav-label">${item.label}</span></div>`;
      }).join('')}
      <div class="nav-bottom"><button class="nav-toggle" onclick="Sidenav.toggle()" title="Réduire / Agrandir"><span class="material-icons-outlined">chevron_right</span></button></div>`;
    el.classList.toggle('expanded', State.get('navExpanded') ?? true);
    _updateActive();
  }

  function toggle() { const el = document.getElementById('sidenav'); if (!el) return; State.set('navExpanded', el.classList.toggle('expanded')); }
  function handleGroupClick(id) {
    const el = document.getElementById('sidenav');
    if (!el.classList.contains('expanded')) { el.classList.add('expanded'); State.set('navExpanded', true); }
    const groups = State.get('navOpenGroups') || {}; groups[id] = !groups[id]; State.set('navOpenGroups', groups); render();
  }
  function _updateActive() {
    const route = State.get('route') || '';
    Utils.qsa('.nav-item, .nav-sub-item').forEach(el => {
      const r = el.dataset.route;
      el.classList.toggle('active', r && (route === r || (r !== '/' && route.startsWith(r))));
    });
  }
  State.on('route', _updateActive);
  return { render, toggle, handleGroupClick };
})();
window.Sidenav = Sidenav;

(function injectNavStyle(){
  if (document.getElementById('nav-params-style')) return;
  const s = document.createElement('style'); s.id = 'nav-params-style';
  s.textContent = `.nav-sub-item.disabled{opacity:.5;cursor:not-allowed;}.nav-sub-item.disabled:hover{background:transparent!important;}`;
  document.head.appendChild(s);
})();
