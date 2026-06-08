/* ═══════════════════════════════════════════════════════════════
   APP BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */
(function init() {
  State.set('navExpanded', true);
  State.set('navOpenGroups', { params: true });
  State.set('theme', 'azur');
  Sidenav.render();
  Router.init();
})();
