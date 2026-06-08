/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS — Bell panel (sidenav + topbar)
   ═══════════════════════════════════════════════════════════════ */

;(function injectNotifCSS() {
  if (document.getElementById('notif-css')) return;
  const s = document.createElement('style');
  s.id = 'notif-css';
  s.textContent = `
    #notif-panel {
      position: fixed;
      width: 340px;
      background: #fff;
      border: 1px solid #E4E7EF;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.06);
      z-index: 5000;
      overflow: hidden;
      animation: notif-in .15s ease;
    }
    @keyframes notif-in {
      from { opacity: 0; transform: translateY(-6px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1);   }
    }
    .notif-hdr {
      display: flex; align-items: center;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #E4E7EF;
      gap: 8px;
    }
    .notif-hdr-title {
      font-size: 14px; font-weight: 700; color: #111827; flex: 1;
    }
    .notif-hdr-badge {
      background: #0D5BBE; color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 7px; border-radius: 9999px;
      line-height: 1.4;
    }
    .notif-mark-all {
      font-size: 12px; color: #0D5BBE; font-weight: 600;
      cursor: pointer; border: none; background: none;
      font-family: inherit; padding: 0;
    }
    .notif-mark-all:hover { text-decoration: underline; }
    .notif-list {
      max-height: 360px; overflow-y: auto;
    }
    .notif-list::-webkit-scrollbar { width: 4px; }
    .notif-list::-webkit-scrollbar-thumb { background: #E4E7EF; border-radius: 2px; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #F0F2F7;
      cursor: pointer; transition: background .12s;
      position: relative;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: #F8FAFF; }
    .notif-item.unread { background: #F5F8FF; }
    .notif-item.unread:hover { background: #EEF4FF; }
    .notif-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon .material-icons-outlined { font-size: 18px; }
    .notif-icon.ni-info    { background: #E0F4FA; color: #0091C2; }
    .notif-icon.ni-success { background: #ECFDF5; color: #1A9E5C; }
    .notif-icon.ni-warning { background: #FFFBEB; color: #E88C00; }
    .notif-icon.ni-error   { background: #FEF2F2; color: #D93025; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-title {
      font-size: 13px; font-weight: 600; color: #111827;
      margin-bottom: 2px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .notif-body {
      font-size: 12px; color: #6B7280; line-height: 1.4;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-time {
      font-size: 11px; color: #9CA3AF; margin-top: 4px; display: block;
    }
    .notif-unread-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #0D5BBE; flex-shrink: 0; margin-top: 5px;
    }
    .notif-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 16px; gap: 8px; color: #9CA3AF;
    }
    .notif-empty .material-icons-outlined { font-size: 36px; color: #C2D8F7; }
    .notif-empty-text { font-size: 13px; }
    .notif-footer {
      padding: 10px 16px;
      border-top: 1px solid #E4E7EF;
      text-align: center;
    }
    .notif-footer a {
      font-size: 12px; color: #0D5BBE; font-weight: 600;
      cursor: pointer; text-decoration: none;
    }
    .notif-footer a:hover { text-decoration: underline; }
    /* Badge on bell icons */
    .nav-notif { position: relative; }
    .nav-notif-badge, .topbar-notif-badge {
      position: absolute; top: -2px; right: -2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #D93025; color: #fff;
      font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid var(--c-nav-bg);
      pointer-events: none;
      line-height: 1;
    }
    .topbar-notif-badge {
      border-color: #fff;
      top: 3px; right: 3px;
      width: 14px; height: 14px;
      font-size: 8px;
    }
  `;
  document.head.appendChild(s);
})();

const Notifications = (() => {

  let _items = [
    { id:1, type:'success', title:'Paiement reçu',        body:'Règlement de 240 € — famille DUPONT',              time:'Il y a 5 min',   read: false },
    { id:2, type:'warning', title:'Dossier incomplet',    body:'La famille BERNARD manque de documents',           time:'Il y a 1h',      read: false },
    { id:3, type:'info',    title:'Nouvelle inscription', body:'Lucas PETIT inscrit en activité natation',         time:'Il y a 2h',      read: false },
    { id:4, type:'error',   title:'Impayé signalé',       body:'Famille ROUX — solde débiteur 180 €',              time:'Hier 14:32',     read: true  },
    { id:5, type:'info',    title:'Nouveau dossier',      body:'La famille MARTIN a été ajoutée',                  time:'Hier 09:15',     read: true  },
    { id:6, type:'success', title:'Dossier complété',     body:'Tous les documents de la famille LEROY sont OK',   time:'Lun. 11:00',     read: true  },
  ];

  const _icons = { info:'info', success:'check_circle', warning:'warning', error:'error' };

  let _panel = null;

  function toggle(event) {
    if (_panel) { close(); return; }
    _show(event.currentTarget);
  }

  function _show(anchor) {
    _panel = document.createElement('div');
    _panel.id = 'notif-panel';
    _panel.innerHTML = _renderPanel();
    document.body.appendChild(_panel);
    _position(anchor);
    _updateBadges();
    setTimeout(() => document.addEventListener('click', _onOutside), 0);
  }

  function _position(anchor) {
    const rect   = anchor.getBoundingClientRect();
    const sidenav = document.getElementById('sidenav');
    const inSidenav = sidenav && sidenav.contains(anchor);
    const panelH = 460;
    const top    = Math.min(rect.top, window.innerHeight - panelH - 16);

    if (inSidenav) {
      _panel.style.left = (rect.right + 10) + 'px';
      _panel.style.top  = Math.max(8, top) + 'px';
    } else {
      // topbar — align right edge with button
      _panel.style.right = (window.innerWidth - rect.right) + 'px';
      _panel.style.top   = (rect.bottom + 8) + 'px';
    }
  }

  function _onOutside(e) {
    if (_panel && !_panel.contains(e.target)) close();
  }

  function close() {
    if (_panel) { _panel.remove(); _panel = null; }
    document.removeEventListener('click', _onOutside);
  }

  function markAllRead() {
    _items.forEach(n => n.read = true);
    if (_panel) _panel.innerHTML = _renderPanel();
    _updateBadges();
  }

  function _unreadCount() {
    return _items.filter(n => !n.read).length;
  }

  function _updateBadges() {
    const count = _unreadCount();
    document.querySelectorAll('.nav-notif-badge, .topbar-notif-badge').forEach(el => {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function _renderPanel() {
    const unread = _unreadCount();
    return `
      <div class="notif-hdr">
        <span class="notif-hdr-title">Notifications</span>
        ${unread > 0 ? `<span class="notif-hdr-badge">${unread}</span>` : ''}
        ${unread > 0 ? `<button class="notif-mark-all" onclick="Notifications.markAllRead()">Tout marquer lu</button>` : ''}
      </div>
      <div class="notif-list">
        ${_items.length === 0 ? `
          <div class="notif-empty">
            <span class="material-icons-outlined">notifications_none</span>
            <span class="notif-empty-text">Aucune notification</span>
          </div>` :
          _items.map(n => `
            <div class="notif-item${n.read ? '' : ' unread'}">
              <div class="notif-icon ni-${n.type}">
                <span class="material-icons-outlined">${_icons[n.type]}</span>
              </div>
              <div class="notif-content">
                <div class="notif-title">${n.title}</div>
                <div class="notif-body">${n.body}</div>
                <span class="notif-time">${n.time}</span>
              </div>
              ${n.read ? '' : '<div class="notif-unread-dot"></div>'}
            </div>`).join('')
        }
      </div>
      <div class="notif-footer">
        <a onclick="Notifications.close()">Voir toutes les notifications</a>
      </div>
    `;
  }

  function init() {
    _updateBadges();
  }

  return { toggle, close, markAllRead, init };
})();
