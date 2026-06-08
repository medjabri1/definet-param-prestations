/* ═══════════════════════════════════════════════════════════════
   PRESTATIONS — Liste GLOBALE (toutes prestations, sans sélectionner
   d'établissement), regroupées par TYPOLOGIE. Filtres : recherche,
   typologie, établissement, actives/inactives.
   ═══════════════════════════════════════════════════════════════ */
const PrestationsPage = (() => {

  let _search = '', _typo = '', _etab = '', _showInactives = false, _group = true;

  function _rows() {
    return PrestaData.prestations.filter(p => {
      if (!_showInactives && !p.actif) return false;
      if (_typo && p.idTypologie !== +_typo) return false;
      if (_etab && !(p.etablissements || []).includes(+_etab)) return false;
      if (_search) {
        const s = _search.toLowerCase();
        if (!(p.nom.toLowerCase().includes(s) || (p.sigle || '').toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }

  function render(el) {
    el.innerHTML = `
      <div class="params-shell">
        <div class="params-header">
          <div class="params-header-icon"><span class="material-icons-outlined">category</span></div>
          <div><h1>Prestations</h1><div class="subtitle">Activités proposées par les établissements — vue globale</div></div>
          <div style="margin-left:auto"><button class="btn btn-primary" onclick="Router.go('/prestations/nouveau')"><span class="material-icons-outlined">add</span>Nouvelle prestation</button></div>
        </div>

        <div class="filter-bar">
          <div class="input-wrap search-input">
            <input class="input" id="p-search" placeholder="Rechercher (nom ou sigle)…" value="${Utils.esc(_search)}">
            <span class="material-icons-outlined input-icon">search</span>
          </div>
          <select class="input select-filter" id="p-typo">
            <option value="">Toutes les typologies</option>
            ${PrestaData.typologies.map(t => `<option value="${t.id}">${t.nom}</option>`).join('')}
          </select>
          <select class="input select-filter" id="p-etab">
            <option value="">Tous les établissements</option>
            ${PrestaData.etablissements.map(e => `<option value="${e.id}">${e.nom}</option>`).join('')}
          </select>
          <label class="check-row" style="margin-left:auto"><input type="checkbox" id="p-group" ${_group ? 'checked' : ''}> Grouper par typologie</label>
          <label class="check-row"><input type="checkbox" id="p-inactives" ${_showInactives ? 'checked' : ''}> Afficher les inactives</label>
        </div>

        <div id="p-table"></div>
      </div>`;

    Utils.qs('#p-search').addEventListener('input', Utils.debounce(e => { _search = e.target.value; _renderTable(); }, 200));
    Utils.qs('#p-typo').value = _typo; Utils.qs('#p-typo').addEventListener('change', e => { _typo = e.target.value; _renderTable(); });
    Utils.qs('#p-etab').value = _etab; Utils.qs('#p-etab').addEventListener('change', e => { _etab = e.target.value; _renderTable(); });
    Utils.qs('#p-group').addEventListener('change', e => { _group = e.target.checked; _renderTable(); });
    Utils.qs('#p-inactives').addEventListener('change', e => { _showInactives = e.target.checked; _renderTable(); });
    _renderTable();
  }

  function _etabNames(p) {
    const names = (p.etablissements || []).map(id => (Data.etab(id) || {}).sigle || '?');
    if (!names.length) return '<span class="text-4">—</span>';
    const first = names.slice(0, 2).join(', ');
    const extra = names.length > 2 ? ` <span class="text-4">+${names.length - 2}</span>` : '';
    return `${first}${extra}`;
  }

  function _rowHtml(p) {
    const typo = Data.typologie(p.idTypologie);
    return `
      <tr style="${p.actif ? '' : 'opacity:.55'}" onclick="Router.go('/prestations/${p.id}')">
        <td class="strong">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.couleur || '#ccc'};margin-right:8px;vertical-align:middle"></span>
          ${Utils.esc(p.nom)}
        </td>
        <td><code>${Utils.esc(p.sigle || '')}</code></td>
        <td>${typo ? Utils.chip(typo.nom, typo.couleur) : '—'}</td>
        <td>${Utils.esc((Data.regie(p.idRegie) || {}).nom || '—')}</td>
        <td>${_etabNames(p)}</td>
        <td style="text-align:center">${p.nbrPlace ?? '—'}</td>
        <td>${p.actif ? Utils.badge('Active', 'active') : Utils.badge('Inactive', 'closed')}</td>
        <td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()">
          <button class="icon-btn" title="Ouvrir" onclick="Router.go('/prestations/${p.id}')"><span class="material-icons-outlined">edit</span></button>
          <button class="icon-btn" title="${p.actif ? 'Désactiver' : 'Réactiver'}" onclick="PrestationsPage.toggle(${p.id})"><span class="material-icons-outlined">${p.actif ? 'toggle_on' : 'toggle_off'}</span></button>
        </td>
      </tr>`;
  }

  function _tableWrap(bodyRows) {
    return `<div class="bloc"><table class="data-table">
      <thead><tr>
        <th>Prestation</th><th>Sigle</th><th>Typologie</th><th>Régie de facturation</th>
        <th>Établissements</th><th style="text-align:center">Places</th><th>Statut</th><th style="text-align:right">Actions</th>
      </tr></thead>
      <tbody>${bodyRows}</tbody></table></div>`;
  }

  function _renderTable() {
    const rows = _rows();
    const host = Utils.qs('#p-table'); if (!host) return;
    if (!rows.length) {
      host.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">category</span>
        <div class="title">Aucune prestation</div><div class="desc">Aucune prestation ne correspond aux filtres. Créez-en une avec « Nouvelle prestation ».</div></div>`;
      return;
    }
    if (!_group) { host.innerHTML = _tableWrap(rows.map(_rowHtml).join('')); return; }
    // Regroupement par typologie
    const groups = PrestaData.typologies
      .map(t => ({ t, items: rows.filter(p => p.idTypologie === t.id) }))
      .filter(g => g.items.length);
    host.innerHTML = groups.map(g => `
      <div class="flex items-center gap-2" style="margin:14px 2px 6px">
        ${Utils.chip(g.t.nom, g.t.couleur, 'category')}
        <span class="text-4 fs-sm">${g.items.length} prestation(s)</span>
      </div>
      ${_tableWrap(g.items.map(_rowHtml).join(''))}`).join('');
  }

  function toggle(id) {
    const p = Data.prestation(id); if (!p) return;
    event && event.stopPropagation && event.stopPropagation();
    if (p.actif && p.utilisee) {
      Modals.confirm({ title: 'Désactiver la prestation', confirmText: 'Désactiver',
        message: `La prestation « <b>${Utils.esc(p.nom)}</b> » est utilisée (inscriptions / tarifs). Elle sera <b>désactivée</b> (et non supprimée) : consultable mais plus proposée aux inscriptions.`,
        onConfirm: () => { p.actif = false; Utils.toast('Prestation désactivée', 'success'); _renderTable(); } });
    } else {
      p.actif = !p.actif; Utils.toast(p.actif ? 'Prestation réactivée' : 'Prestation désactivée', 'success'); _renderTable();
    }
  }

  return { render, toggle };
})();
window.PrestationsPage = PrestationsPage;
