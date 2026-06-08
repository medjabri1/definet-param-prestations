/* ═══════════════════════════════════════════════════════════════
   ROUTER — Paramétrage des prestations (démo)
   ═══════════════════════════════════════════════════════════════ */
const Router = (() => {

  const ROUTES = [
    { pattern: /^\/$/,                            page: 'HomePage' },
    { pattern: /^\/prestations$/,                 page: 'PrestationsPage' },
    { pattern: /^\/prestations\/nouveau$/,        page: 'PrestationFichePage', param: 'id', value: 'nouveau' },
    { pattern: /^\/prestations\/([^/?]+)(?:\?.*)?$/, page: 'PrestationFichePage', param: 'id' },
  ];

  function _getRoute() { return decodeURIComponent(location.hash.slice(1)) || '/'; }

  function _resolve(path) {
    for (const route of ROUTES) {
      const m = path.match(route.pattern);
      if (m) {
        const params = {};
        if (route.param) params[route.param] = route.value || m[1];
        return { page: route.page, params };
      }
    }
    return { page: null, params: { path } };
  }

  function navigate(path) {
    State.set('route', path);
    document.body.className = 'is-app';
    if (window.Topbar) Topbar.render();
    const outlet = document.getElementById('router-outlet');
    if (!outlet) return;
    const { page, params } = _resolve(path);
    let handler = null;
    if (page) { try { handler = (new Function(`return typeof ${page} !== 'undefined' ? ${page} : null;`))(); } catch (e) { handler = null; } }
    if (handler && typeof handler.render === 'function') { outlet.innerHTML = ''; handler.render(outlet, params); }
    else {
      outlet.innerHTML = `<div class="params-shell"><div class="empty-state">
        <span class="material-icons-outlined">construction</span>
        <div class="title">Page introuvable</div><div class="desc">Route : <code>${path}</code></div></div></div>`;
    }
  }

  function go(path) {
    if (path === (location.hash.slice(1) || '/')) { navigate(path); return; }
    location.hash = '#' + path;
  }

  function init() {
    window.addEventListener('hashchange', () => navigate(_getRoute()));
    navigate(_getRoute());
  }

  return { go, init };
})();
window.Router = Router;
