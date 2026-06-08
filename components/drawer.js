/* ═══════════════════════════════════════════════════════════════
   DRAWER — Right-side sliding panel for forms
   ═══════════════════════════════════════════════════════════════ */

const Drawer = (() => {

  function open({ title, icon = 'edit', iconClass = '', body, footer, wide = false }) {
    close();
    const layer = document.createElement('div');
    layer.id = 'drawer-layer';
    layer.innerHTML = `
      <div class="drawer-backdrop" onclick="Drawer.close()"></div>
      <aside class="drawer${wide ? ' wide' : ''}" role="dialog">
        <div class="drawer-head">
          <div class="bloc-icon ${iconClass}">
            <span class="material-icons-outlined">${icon}</span>
          </div>
          <div class="drawer-title">${title}</div>
          <button class="drawer-close" onclick="Drawer.close()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="drawer-body">${body}</div>
        ${footer ? `<div class="drawer-foot">${footer}</div>` : ''}
      </aside>
    `;
    document.body.appendChild(layer);
    document.addEventListener('keydown', _esc);
  }

  function close() {
    document.removeEventListener('keydown', _esc);
    const el = document.getElementById('drawer-layer');
    if (el) el.remove();
  }

  function _esc(e) {
    if (e.key === 'Escape') close();
  }

  return { open, close };
})();
window.Drawer = Drawer;
