/* ═══════════════════════════════════════════════════════════════
   MODALS — Confirm pop-ups (namespaced to avoid layout.css clashes)
   ═══════════════════════════════════════════════════════════════ */

const Modals = (() => {

  function confirm({ title, message, confirmText = 'Confirmer', cancelText = 'Annuler', danger = false, onConfirm, extraHtml = '' }) {
    close();
    const layer = document.createElement('div');
    layer.id = 'pm-modal-layer';
    layer.innerHTML = `
      <div class="pm-modal-backdrop" onclick="Modals.close()"></div>
      <div class="pm-modal" role="dialog" aria-modal="true">
        <div class="pm-modal-head">
          <div class="bloc-icon ${danger ? 'error' : 'warn'}">
            <span class="material-icons-outlined">${danger ? 'delete' : 'warning'}</span>
          </div>
          <div class="pm-modal-title">${title}</div>
          <button class="pm-modal-close" type="button" onclick="Modals.close()" aria-label="Fermer">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="pm-modal-body">
          ${message}
          ${extraHtml ? `<div class="pm-modal-extra">${extraHtml}</div>` : ''}
        </div>
        <div class="pm-modal-foot">
          <button class="btn btn-ghost" type="button" onclick="Modals.close()">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="pm-modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(layer);
    document.getElementById('pm-modal-confirm-btn').onclick = () => {
      const modalBody = document.querySelector('#pm-modal-layer .pm-modal-body');
      const snapshot = {};
      if (modalBody) {
        modalBody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          if (cb.id) snapshot[cb.id] = cb.checked;
        });
        modalBody.querySelectorAll('input[type="text"],input[type="number"],input[type="date"],textarea,select').forEach(el => {
          if (el.id) snapshot[el.id] = el.value;
        });
      }
      close();
      if (onConfirm) onConfirm(snapshot);
    };
    document.addEventListener('keydown', _esc);
  }

  function close() {
    document.removeEventListener('keydown', _esc);
    const el = document.getElementById('pm-modal-layer');
    if (el) el.remove();
  }

  function _esc(e) { if (e.key === 'Escape') close(); }

  return { confirm, close };
})();
window.Modals = Modals;

(function injectModalsStyle(){
  if (document.getElementById('pm-modals-style')) return;
  const s = document.createElement('style');
  s.id = 'pm-modals-style';
  s.textContent = `
    #pm-modal-layer {
      position: fixed !important;
      top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
      width: 100% !important; height: 100% !important;
      z-index: 9999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px;
    }
    #pm-modal-layer .pm-modal-backdrop {
      position: fixed !important;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      background: rgba(17,24,39,.48) !important;
      z-index: 0;
      animation: pmFadeIn .15s forwards;
    }
    #pm-modal-layer .pm-modal {
      position: relative;
      z-index: 1;
      background: var(--c-surface);
      border-radius: var(--r-lg);
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 50px rgba(0,0,0,.25);
      animation: pmScaleIn .18s forwards;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .pm-modal-head {
      padding: 16px 20px 12px;
      display: flex; align-items: center; gap: 12px;
    }
    .pm-modal-title {
      flex: 1; font-size: 15px; font-weight: 600; color: var(--c-text-1);
      line-height: 1.3;
    }
    .pm-modal-close {
      width: 28px; height: 28px; border: none; background: transparent;
      cursor: pointer; color: var(--c-text-3); border-radius: var(--r-sm);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pm-modal-close:hover { background: var(--c-bg); color: var(--c-text-1); }
    .pm-modal-close .material-icons-outlined { font-size: 18px; }
    .pm-modal-body {
      padding: 0 20px 18px;
      font-size: 13px; color: var(--c-text-2); line-height: 1.6;
    }
    .pm-modal-extra { margin-top: 10px; }
    .pm-modal-foot {
      padding: 12px 20px;
      border-top: 1px solid var(--c-border);
      display: flex; justify-content: flex-end; gap: 8px;
      background: var(--c-bg);
    }
    @keyframes pmFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pmScaleIn {
      from { transform: scale(.94); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
  `;
  document.head.appendChild(s);
})();
