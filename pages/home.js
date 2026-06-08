/* ═══════════════════════════════════════════════════════════════
   HOME — point d'entrée du module Paramétrage (démo)
   ═══════════════════════════════════════════════════════════════ */
const HomePage = (() => {
  function render(el) {
    const cards = [
      { icon: 'category', title: 'Prestations', sub: 'Activités liées aux établissements : propriétés, calendrier, sections, tarifs.', route: '/prestations', ready: true },
      { icon: 'apartment', title: 'Établissements', sub: 'Fiche, capacités, services des organismes.', ready: false },
      { icon: 'sell', title: 'Tarifs', sub: 'Barèmes et grilles tarifaires de la collectivité.', ready: false },
      { icon: 'receipt_long', title: 'Régies de facturation', sub: 'Régisseurs et règles de facturation.', ready: false },
      { icon: 'list', title: 'Référentiels', sub: 'Types d\'activité, modes d\'accueil, motifs…', ready: false },
      { icon: 'calendar_today', title: 'Calendriers', sub: 'Calendriers et jours fériés partagés.', ready: false },
    ];
    el.innerHTML = `
      <div class="params-shell">
        <div class="params-header">
          <div class="params-header-icon"><span class="material-icons-outlined">settings</span></div>
          <div><h1>Paramétrage &amp; administration</h1>
            <div class="subtitle">Maquette interactive — carte « Paramétrage des prestations liées à un établissement »</div></div>
        </div>
        <div class="infobanner info" style="margin-bottom:16px">
          <span class="material-icons-outlined">info</span>
          Démo cliquable. Seul le module <b>Prestations</b> est actif ; les autres entrées sont illustratives.
        </div>
        <div class="entry-grid">
          ${cards.map(c => `
            <div class="entry-card${c.ready ? '' : ' disabled'}" ${c.ready ? `onclick="Router.go('${c.route}')"` : `onclick="Utils.toast('Bientôt disponible','info')"`}>
              <span class="entry-badge ${c.ready ? 'ready' : ''}">${c.ready ? 'Actif' : 'Bientôt'}</span>
              <div class="entry-icon"><span class="material-icons-outlined">${c.icon}</span></div>
              <div class="entry-title">${c.title}</div>
              <div class="entry-sub">${c.sub}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }
  return { render };
})();
window.HomePage = HomePage;
