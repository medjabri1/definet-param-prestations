/* ═══════════════════════════════════════════════════════════════
   FICHE PRESTATION — 5 onglets :
   Propriétés · Calendrier (héritage D2-B + multi-créneaux + jours fermés)
   · Sections · Établissements (rattachement N-N) · Tarifs (rattachement)
   ═══════════════════════════════════════════════════════════════ */
const PrestationFichePage = (() => {

  let _el = null, _id = null, _tab = 'proprietes', _editProps = false, _pDraft = null, _agPer = null;

  const TABS = [
    ['proprietes',    'Propriétés',    'tune'],
    ['calendrier',    'Calendrier',    'event'],
    ['sections',      'Sections',      'grid_view'],
    ['etablissements','Établissements','apartment'],
    ['tarifs',        'Tarifs',        'sell'],
  ];

  // Agenda mensuel — année scolaire par défaut (utilisée pour l'aperçu en mode hérité)
  const SCHOOL_YEAR = { debut: '2026-09-01', fin: '2027-07-06' };
  const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const DOW  = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

  /* ───────── entrée ───────── */
  function render(el, params) {
    _el = el;
    if (params.id === 'nouveau') { _editProps = true; return _renderCreate(); }
    _id = +params.id;
    if (!Data.prestation(_id)) { el.innerHTML = `<div class="params-shell"><div class="empty-state"><span class="material-icons-outlined">search_off</span><div class="title">Prestation introuvable</div></div></div>`; return; }
    _renderFiche();
  }
  function _rerender() { _renderFiche(); }

  /* ───────── création ───────── */
  function _renderCreate() {
    const etabOpts = PrestaData.etablissements.map(e => `<option value="${e.id}">${Utils.esc(e.nom)}</option>`).join('');
    _el.innerHTML = `
      <div class="params-shell">
        <div class="params-header">
          <button class="icon-btn" onclick="Router.go('/prestations')" title="Retour"><span class="material-icons-outlined">arrow_back</span></button>
          <div class="params-header-icon"><span class="material-icons-outlined">add</span></div>
          <div><h1>Nouvelle prestation</h1><div class="subtitle">Renseignez les propriétés ; le calendrier, les sections et les tarifs se configurent ensuite.</div></div>
        </div>
        <div class="bloc">
          <div class="bloc-header"><div class="bloc-icon"><span class="material-icons-outlined">tune</span></div><div class="bloc-title">Propriétés de la prestation</div></div>
          <div class="form-grid fg-2">
            <div class="form-field"><label class="req">Nom</label><input class="input" id="c-nom" placeholder="Ex : Cantine maternelle"></div>
            <div class="form-field"><label>Sigle</label><input class="input" id="c-sigle" placeholder="Ex : CANT-MAT"></div>
            <div class="form-field"><label class="req">Typologie (type d'activité)</label><select class="input" id="c-typo">${PrestaData.typologies.map(t => `<option value="${t.id}">${t.nom}</option>`).join('')}</select></div>
            <div class="form-field"><label>Mode d'accueil</label><select class="input" id="c-mode">${PrestaData.modes.map(m => `<option value="${m.id}">${m.nom}</option>`).join('')}</select></div>
            <div class="form-field"><label class="req">Régie de facturation</label><select class="input" id="c-regie"><option value="">— Choisir —</option>${PrestaData.regies.map(r => `<option value="${r.id}">${r.nom}</option>`).join('')}</select></div>
            <div class="form-field"><label class="req">Établissement principal</label><select class="input" id="c-etab">${etabOpts}</select></div>
            <div class="form-field"><label>Nombre de places</label><input class="input" type="number" id="c-places" min="0" value="0"></div>
            <div class="form-field"><label>Couleur</label><input class="input" type="color" id="c-couleur" value="#0D5BBE" style="height:36px;padding:3px"></div>
            <div class="form-field full"><label>Description</label><textarea class="input" id="c-desc" placeholder="Description courte…"></textarea></div>
          </div>
          <div class="infobanner info" style="margin:0 18px 16px">
            <span class="material-icons-outlined">link</span>
            La prestation sera rattachée à l'établissement principal sélectionné. D'autres établissements pourront être ajoutés ensuite (relation N-N).
          </div>
        </div>
        <div class="flex gap-2" style="justify-content:flex-end;margin-top:14px">
          <button class="btn btn-ghost" onclick="Router.go('/prestations')">Annuler</button>
          <button class="btn btn-primary" onclick="PrestationFichePage.doCreate()"><span class="material-icons-outlined">check</span>Créer la prestation</button>
        </div>
      </div>`;
  }

  function doCreate() {
    const nom = Utils.qs('#c-nom').value.trim();
    const regie = Utils.qs('#c-regie').value;
    if (!nom) { Utils.toast('Le nom est obligatoire', 'error'); return; }
    if (!regie) { Utils.toast('La régie de facturation est obligatoire', 'error'); return; }
    const etab = +Utils.qs('#c-etab').value;
    const p = {
      id: Data.nextId(PrestaData.prestations),
      nom, sigle: Utils.qs('#c-sigle').value.trim(),
      description: Utils.qs('#c-desc').value.trim(),
      libellePortail: '', couleur: Utils.qs('#c-couleur').value,
      idTypologie: +Utils.qs('#c-typo').value, idMode: +Utils.qs('#c-mode').value,
      idRegie: +regie, idService: null,
      nbrPlace: +Utils.qs('#c-places').value || 0, nbrPlaceJour: +Utils.qs('#c-places').value || 0,
      demandable: true, publique: false, portailVisible: false, portailActif: false, portailOrdre: null,
      actif: true, utilisee: false,
      etablissements: [etab], etablissementPrincipal: etab,
      calendrierMode: 'HERITE', periodes: [], joursFermes: [], sections: [], tarifs: [],
    };
    PrestaData.prestations.push(p);
    Utils.toast('Prestation créée', 'success');
    Router.go('/prestations/' + p.id);
  }

  /* ───────── fiche (consultation) ───────── */
  function _renderFiche() {
    const p = Data.prestation(_id);
    const typo = Data.typologie(p.idTypologie);
    _el.innerHTML = `
      <div class="params-shell">
        <div class="params-header">
          <button class="icon-btn" onclick="Router.go('/prestations')" title="Retour à la liste"><span class="material-icons-outlined">arrow_back</span></button>
          <div class="params-header-icon" style="background:${(p.couleur||'#0D5BBE')}22"><span class="material-icons-outlined" style="color:${p.couleur||'#0D5BBE'}">category</span></div>
          <div>
            <h1>${Utils.esc(p.nom)} ${p.actif ? Utils.badge('Active','active') : Utils.badge('Inactive','closed')}</h1>
            <div class="subtitle">${typo ? typo.nom : ''} · ${Utils.esc((Data.regie(p.idRegie)||{}).nom||'')} · ${(p.etablissements||[]).length} établissement(s)</div>
          </div>
          <div style="margin-left:auto" class="flex gap-2">
            <button class="btn btn-ghost" onclick="PrestationFichePage.toggleActif()"><span class="material-icons-outlined">${p.actif?'toggle_on':'toggle_off'}</span>${p.actif?'Désactiver':'Réactiver'}</button>
          </div>
        </div>

        <div class="params-tabs">
          ${TABS.map(([id,lbl,ic]) => `<div class="params-tab ${_tab===id?'active':''}" onclick="PrestationFichePage.switchTab('${id}')"><span class="material-icons-outlined">${ic}</span>${lbl}${_tabCount(p,id)}</div>`).join('')}
        </div>

        <div id="panel"></div>
      </div>`;
    _renderPanel();
  }

  function _tabCount(p, id) {
    const n = id==='sections' ? (p.sections||[]).length
            : id==='etablissements' ? (p.etablissements||[]).length
            : id==='tarifs' ? (p.tarifs||[]).length : null;
    return n ? ` <span class="sli-count" style="margin-left:4px">${n}</span>` : '';
  }

  function switchTab(t) { _tab = t; _editProps = false; _renderFiche(); }

  function _renderPanel() {
    const host = Utils.qs('#panel'); if (!host) return;
    const p = Data.prestation(_id);
    if (_tab === 'proprietes')     host.innerHTML = _panelProps(p);
    else if (_tab === 'calendrier')host.innerHTML = _panelCalendrier(p);
    else if (_tab === 'sections')  host.innerHTML = _panelSections(p);
    else if (_tab === 'etablissements') host.innerHTML = _panelEtabs(p);
    else if (_tab === 'tarifs')    host.innerHTML = _panelTarifs(p);
  }

  /* ───────── Onglet 1 : Propriétés ───────── */
  function _panelProps(p) {
    const ed = _editProps, dis = ed ? '' : 'disabled';
    const principal = Data.etab(p.etablissementPrincipal) || { services: [] };
    const svcOpts = (principal.services||[]).map(s => `<option value="${s.id}" ${p.idService===s.id?'selected':''}>${Utils.esc(s.nom)}</option>`).join('');
    const sel = (cond) => cond ? 'selected' : '';
    const chk = (cond) => cond ? 'checked' : '';
    return `
      <div class="bloc">
        <div class="bloc-header">
          <div class="bloc-icon"><span class="material-icons-outlined">tune</span></div>
          <div class="bloc-title">Propriétés de la prestation</div>
          ${ed
            ? `<button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.cancelProps()">Annuler</button>
               <button class="btn btn-primary btn-sm" onclick="PrestationFichePage.saveProps()"><span class="material-icons-outlined">check</span>Enregistrer</button>`
            : `<button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.editProps()"><span class="material-icons-outlined">edit</span>Modifier</button>`}
        </div>
        <div class="form-grid fg-2">
          <div class="form-field"><label class="req">Nom</label><input class="input" id="f-nom" value="${Utils.esc(p.nom)}" ${dis}></div>
          <div class="form-field"><label>Sigle</label><input class="input" id="f-sigle" value="${Utils.esc(p.sigle||'')}" ${dis}></div>
          <div class="form-field"><label>Typologie (type d'activité)</label><select class="input" id="f-typo" ${dis}>${PrestaData.typologies.map(t=>`<option value="${t.id}" ${sel(t.id===p.idTypologie)}>${t.nom}</option>`).join('')}</select></div>
          <div class="form-field"><label>Mode d'accueil</label><select class="input" id="f-mode" ${dis}>${PrestaData.modes.map(m=>`<option value="${m.id}" ${sel(m.id===p.idMode)}>${m.nom}</option>`).join('')}</select></div>
          <div class="form-field"><label class="req">Régie de facturation</label><select class="input" id="f-regie" ${dis}>${PrestaData.regies.map(r=>`<option value="${r.id}" ${sel(r.id===p.idRegie)}>${r.nom}</option>`).join('')}</select></div>
          <div class="form-field"><label>Service de rattachement</label><select class="input" id="f-service" ${dis}><option value="">—</option>${svcOpts}</select></div>
          <div class="form-field"><label>Nombre de places (total)</label><input class="input" type="number" id="f-places" min="0" value="${p.nbrPlace??''}" ${dis}></div>
          <div class="form-field"><label>Places par jour</label><input class="input" type="number" id="f-placesj" min="0" value="${p.nbrPlaceJour??''}" ${dis}></div>
          <div class="form-field"><label>Libellé portail</label><input class="input" id="f-libportail" value="${Utils.esc(p.libellePortail||'')}" ${dis}></div>
          <div class="form-field"><label>Couleur</label><input class="input" type="color" id="f-couleur" value="${p.couleur||'#0D5BBE'}" style="height:36px;padding:3px" ${dis}></div>
          <div class="form-field full"><label>Description</label><textarea class="input" id="f-desc" ${dis}>${Utils.esc(p.description||'')}</textarea></div>
        </div>
        <div class="section-divider"><span class="section-divider-label"><span class="material-icons-outlined">public</span>Portail familles</span><div class="section-divider-line"></div></div>
        <div class="form-grid fg-4">
          <label class="check-row"><input type="checkbox" id="f-demandable" ${chk(p.demandable)} ${dis}> Demandable</label>
          <label class="check-row"><input type="checkbox" id="f-publique" ${chk(p.publique)} ${dis}> Publique</label>
          <label class="check-row"><input type="checkbox" id="f-pvisible" ${chk(p.portailVisible)} ${dis}> Visible portail</label>
          <label class="check-row"><input type="checkbox" id="f-pactif" ${chk(p.portailActif)} ${dis}> Inscriptions en ligne</label>
        </div>
        <div class="tracability"><span class="material-icons-outlined">history</span> Dernière modification le 04/06/2026 à 10:24 par Admin Démo</div>
      </div>`;
  }
  function editProps() { _editProps = true; _renderPanel(); }
  function cancelProps() { _editProps = false; _renderPanel(); }
  function saveProps() {
    const p = Data.prestation(_id);
    const nom = Utils.qs('#f-nom').value.trim();
    if (!nom) { Utils.toast('Le nom est obligatoire', 'error'); return; }
    if (!Utils.qs('#f-regie').value) { Utils.toast('La régie de facturation est obligatoire', 'error'); return; }
    p.nom = nom; p.sigle = Utils.qs('#f-sigle').value.trim();
    p.idTypologie = +Utils.qs('#f-typo').value; p.idMode = +Utils.qs('#f-mode').value;
    p.idRegie = +Utils.qs('#f-regie').value; p.idService = +Utils.qs('#f-service').value || null;
    p.nbrPlace = +Utils.qs('#f-places').value || 0; p.nbrPlaceJour = +Utils.qs('#f-placesj').value || 0;
    p.libellePortail = Utils.qs('#f-libportail').value.trim(); p.couleur = Utils.qs('#f-couleur').value;
    p.description = Utils.qs('#f-desc').value.trim();
    p.demandable = Utils.qs('#f-demandable').checked; p.publique = Utils.qs('#f-publique').checked;
    p.portailVisible = Utils.qs('#f-pvisible').checked; p.portailActif = Utils.qs('#f-pactif').checked;
    _editProps = false; Utils.toast('Propriétés enregistrées', 'success'); _renderFiche();
  }
  function toggleActif() {
    const p = Data.prestation(_id);
    if (p.actif && p.utilisee) {
      Modals.confirm({ title: 'Désactiver la prestation', confirmText: 'Désactiver',
        message: `« <b>${Utils.esc(p.nom)}</b> » est utilisée. Elle sera <b>désactivée</b> (non supprimée).`,
        onConfirm: () => { p.actif = false; Utils.toast('Prestation désactivée', 'success'); _renderFiche(); } });
    } else { p.actif = !p.actif; Utils.toast(p.actif?'Réactivée':'Désactivée','success'); _renderFiche(); }
  }

  /* ───────── Onglet 2 : Calendrier (héritage + créneaux + jours fermés) ───────── */
  function _daysChips(selected, editable) {
    return `<div class="days-row">${Data.DAYS.map(([n,lbl]) => {
      const act = selected.includes(n) ? ' active' : '';
      const cls = editable ? '' : ' readonly';
      const onclick = editable ? `onclick="PrestationFichePage.togglePeriodDay(${n})"` : '';
      return `<span class="day-chip${act}${cls}" data-day="${n}" ${onclick}>${lbl}</span>`;
    }).join('')}</div>`;
  }

  /* — Agenda mensuel : grille des jours ouverts / fermés / fériés sur la période — */
  function _agendaMonths(periodes, joursFermes) {
    const ps = (periodes || []).filter(x => x.debut && x.fin);
    if (!ps.length) {
      return `<div class="empty-state" style="padding:24px"><span class="material-icons-outlined">calendar_month</span>
        <div class="title">Aucune période à afficher</div>
        <div class="desc">Ajoutez une période d'ouverture pour visualiser l'agenda des jours ouverts et fermés.</div></div>`;
    }
    const fermes = joursFermes || [];
    const minStr = ps.reduce((a, x) => x.debut < a ? x.debut : a, ps[0].debut);
    const maxStr = ps.reduce((a, x) => x.fin   > a ? x.fin   : a, ps[0].fin);
    const [sy, sm] = minStr.split('-').map(Number);
    const [ey, em] = maxStr.split('-').map(Number);

    const months = []; let y = sy, m = sm, guard = 0;
    while ((y < ey || (y === ey && m <= em)) && guard++ < 24) { months.push([y, m]); m++; if (m > 12) { m = 1; y++; } }

    const pad2 = n => (n < 10 ? '0' : '') + n;
    const isoWd = (yy, mm, dd) => { const w = new Date(yy, mm - 1, dd).getDay(); return w === 0 ? 7 : w; };
    const statusOf = (iso, wd) => {
      for (const f of fermes) { if (iso >= f.debut && iso <= (f.fin || f.debut)) return { cls: 'holiday', motif: f.motif || 'Fermeture' }; }
      let within = false;
      for (const per of ps) { if (iso >= per.debut && iso <= per.fin) { within = true; if ((per.jours || []).includes(wd)) return { cls: 'open' }; } }
      return within ? { cls: 'closed' } : { cls: 'outside' };
    };

    const monthHtml = ([yy, mm]) => {
      const nbDays = new Date(yy, mm, 0).getDate();
      const first = isoWd(yy, mm, 1);
      const cells = [];
      for (let i = 1; i < first; i++) cells.push(`<div class="agenda-day blank"></div>`);
      for (let d = 1; d <= nbDays; d++) {
        const iso = `${yy}-${pad2(mm)}-${pad2(d)}`;
        const st = statusOf(iso, isoWd(yy, mm, d));
        const title = st.cls === 'holiday' ? Utils.esc(st.motif)
                    : st.cls === 'open' ? 'Ouvert'
                    : st.cls === 'closed' ? 'Fermé' : '';
        cells.push(`<div class="agenda-day ${st.cls}"${title ? ` title="${title}"` : ''}>${d}</div>`);
      }
      return `<div class="agenda-month">
        <div class="agenda-month-title">${MOIS[mm - 1]} ${yy}</div>
        <div class="agenda-grid">${DOW.map(d => `<div class="agenda-dow">${d}</div>`).join('')}${cells.join('')}</div>
      </div>`;
    };

    return `
      <div class="agenda-legend">
        <span class="agenda-legend-item"><span class="agenda-legend-swatch open"></span>Ouvert</span>
        <span class="agenda-legend-item"><span class="agenda-legend-swatch closed"></span>Fermé</span>
        <span class="agenda-legend-item"><span class="agenda-legend-swatch holiday"></span>Férié / fermeture</span>
      </div>
      <div class="agenda-months">${months.map(monthHtml).join('')}</div>`;
  }

  function _agendaBloc(periodes, joursFermes, caption, selectorHtml) {
    return `
      <div class="bloc">
        <div class="bloc-header"><div class="bloc-icon"><span class="material-icons-outlined">calendar_month</span></div>
          <div class="bloc-title">Agenda d'ouverture</div></div>
        <div style="padding:14px 16px">
          ${caption ? `<div class="hint" style="margin-bottom:12px">${caption}</div>` : ''}
          ${selectorHtml || ''}
          ${_agendaMonths(periodes, joursFermes)}
        </div>
      </div>`;
  }

  function _panelCalendrier(p) {
    if (p.calendrierMode === 'HERITE') {
      const h = Data.calendrierHerite(p);
      const pseudo = (h.jours && h.jours.length)
        ? [{ debut: SCHOOL_YEAR.debut, fin: SCHOOL_YEAR.fin, jours: h.jours, creneaux: [] }] : [];
      return `
        <div class="bloc" style="margin-bottom:16px">
          <div class="bloc-header"><div class="bloc-icon"><span class="material-icons-outlined">event</span></div>
            <div class="bloc-title">Calendrier d'ouverture</div></div>
          <div style="padding:18px">
            <div class="infobanner info" style="margin-bottom:16px">
              <span class="material-icons-outlined">link</span>
              Horaires et jours <b>hérités de l'établissement principal</b> « ${Utils.esc(h.etab.nom||'—')} ». Personnalisez pour définir des périodes et des créneaux propres à la prestation.
            </div>
            <div class="field-label" style="margin-bottom:6px">Jours d'ouverture (hérités)</div>
            ${_daysChips(h.jours || [], false)}
            <div class="field-label" style="margin:16px 0 6px">Amplitude (héritée)</div>
            <div class="flex gap-2 items-center">${Utils.chip(`${h.debut||'—'} → ${h.fin||'—'}`,'blue','schedule')}</div>
          </div>
          <div class="drawer-foot" style="border-top:1px solid var(--c-border)">
            <button class="btn btn-primary" onclick="PrestationFichePage.setCalMode('PERSO')"><span class="material-icons-outlined">tune</span>Personnaliser le calendrier</button>
          </div>
        </div>
        ${_agendaBloc(pseudo, p.joursFermes, `Aperçu sur l'année scolaire 2026–2027 (par défaut). Jours hérités de l'établissement principal ; personnalisez le calendrier pour définir des périodes propres et leurs jours fermés.`)}`;
    }
    // PERSO
    const periodes = p.periodes || [], fermes = p.joursFermes || [];
    // Période affichée dans l'agenda (sélectionnable)
    let agSel = periodes.find(x => x.id === _agPer);
    if (!agSel) { agSel = periodes[0]; _agPer = agSel ? agSel.id : null; }
    const agSelector = periodes.length > 1 ? `
      <div class="flex items-center gap-2" style="margin-bottom:12px">
        <label class="field-label" style="margin:0;white-space:nowrap">Période de validité</label>
        <select class="input" style="max-width:280px" onchange="PrestationFichePage.selectAgendaPeriode(this.value)">
          ${periodes.map(per => `<option value="${per.id}" ${per.id === _agPer ? 'selected' : ''}>Du ${Utils.formatDate(per.debut)} au ${Utils.formatDate(per.fin)}</option>`).join('')}
        </select>
      </div>` : '';
    return `
      <div class="banner info"><span class="material-icons-outlined">tune</span>
        Calendrier <b>personnalisé</b> — n'hérite plus de l'établissement.
        <button class="btn btn-text btn-sm" style="margin-left:auto" onclick="PrestationFichePage.setCalMode('HERITE')">Revenir à l'héritage</button>
      </div>

      <div class="bloc" style="margin-bottom:16px">
        <div class="bloc-header"><div class="bloc-icon"><span class="material-icons-outlined">date_range</span></div>
          <div class="bloc-title">Périodes &amp; amplitude</div>
          <button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.openPeriode()"><span class="material-icons-outlined">add</span>Ajouter une période</button></div>
        <div style="padding:14px 16px">
          ${periodes.length ? periodes.map(per => _periodCard(per)).join('') :
            `<div class="empty-state" style="padding:24px"><span class="material-icons-outlined">date_range</span><div class="title">Aucune période</div><div class="desc">Ajoutez une période d'ouverture avec ses créneaux horaires.</div></div>`}
        </div>
      </div>

      <div class="bloc" style="margin-bottom:16px">
        <div class="bloc-header"><div class="bloc-icon error"><span class="material-icons-outlined">event_busy</span></div>
          <div class="bloc-title">Jours fermés (fériés &amp; fermetures)</div>
          <button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.openFerme()"><span class="material-icons-outlined">add</span>Ajouter</button></div>
        <div style="padding:6px 0">
          ${fermes.length ? fermes.map(f => `
            <div class="doc-item">
              <div class="doc-icon pdf"><span class="material-icons-outlined">event_busy</span></div>
              <div style="flex:1"><div class="doc-name">${Utils.esc(f.motif||'Fermeture')}</div>
                <div class="doc-meta">${Utils.formatDate(f.debut)}${f.fin && f.fin!==f.debut ? ' → ' + Utils.formatDate(f.fin) : ''}</div></div>
              <button class="icon-btn" title="Modifier" onclick="PrestationFichePage.openFerme(${f.id})"><span class="material-icons-outlined">edit</span></button>
              <button class="icon-btn danger" title="Supprimer" onclick="PrestationFichePage.deleteFerme(${f.id})"><span class="material-icons-outlined">delete</span></button>
            </div>`).join('') :
            `<div class="empty-state" style="padding:20px"><span class="material-icons-outlined">event_available</span><div class="desc">Aucun jour fermé déclaré.</div></div>`}
        </div>
      </div>

      ${_agendaBloc(agSel ? [agSel] : [], fermes, `Agenda des jours <b>ouverts</b> et <b>fermés</b> de la <b>période sélectionnée</b>. Les fériés / fermetures déclarés ci-dessus y apparaissent en rouge.`, agSelector)}`;
  }

  function _periodCard(per) {
    const creneaux = (per.creneaux||[]).slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0));
    return `
      <div class="section-card" style="flex-direction:column;align-items:stretch;gap:10px">
        <div class="flex items-center gap-2">
          <span class="material-icons-outlined" style="color:var(--c-primary)">date_range</span>
          <b>Du ${Utils.formatDate(per.debut)} au ${Utils.formatDate(per.fin)}</b>
          <div style="margin-left:auto" class="flex gap-1">
            <button class="icon-btn" title="Modifier" onclick="PrestationFichePage.openPeriode(${per.id})"><span class="material-icons-outlined">edit</span></button>
            <button class="icon-btn danger" title="Supprimer" onclick="PrestationFichePage.deletePeriode(${per.id})"><span class="material-icons-outlined">delete</span></button>
          </div>
        </div>
        <div>${_daysChips(per.jours||[], false)}</div>
        <div class="flex gap-2" style="flex-wrap:wrap">
          ${creneaux.length ? creneaux.map(c => Utils.chip(`${c.jour?Data.dayShort(c.jour):'Tous'} · ${c.debut}–${c.fin}`,'teal','schedule')).join('')
            : '<span class="text-4 fs-sm">Aucun créneau</span>'}
        </div>
      </div>`;
  }

  function selectAgendaPeriode(id) { _agPer = +id; _renderPanel(); }

  function setCalMode(mode) {
    const p = Data.prestation(_id);
    if (mode === 'PERSO' && !(p.periodes||[]).length) {
      // amorcer une première période depuis l'héritage
      const h = Data.calendrierHerite(p);
      p.periodes = [{ id: 1, debut: '2026-09-01', fin: '2027-07-06', jours: (h.jours||[]).slice(),
        creneaux: (h.debut && h.fin) ? [{ id: 1, jour: null, debut: h.debut, fin: h.fin, ordre: 1 }] : [] }];
    }
    p.calendrierMode = mode;
    Utils.toast(mode==='PERSO' ? 'Calendrier personnalisé' : 'Retour à l\'héritage établissement', 'info');
    _renderPanel();
  }

  /* — Période drawer (avec éditeur de créneaux multi) — */
  function openPeriode(perId) {
    const p = Data.prestation(_id);
    const per = perId ? (p.periodes||[]).find(x => x.id === +perId) : null;
    _pDraft = per ? JSON.parse(JSON.stringify(per))
                  : { id: null, debut: '', fin: '', jours: [], creneaux: [] };
    Drawer.open({
      title: per ? 'Modifier la période' : 'Nouvelle période', icon: 'date_range', wide: true,
      body: `
        <div class="form-grid fg-2" style="padding:0 0 12px">
          <div class="form-field"><label class="req">Début</label><input class="input" type="date" id="pd-debut" value="${_pDraft.debut}"></div>
          <div class="form-field"><label class="req">Fin</label><input class="input" type="date" id="pd-fin" value="${_pDraft.fin}"></div>
        </div>
        <div class="field-label" style="margin-bottom:6px">Jours d'ouverture</div>
        ${_daysChips(_pDraft.jours, true)}
        <div class="flex-between" style="margin:18px 0 6px">
          <div class="field-label">Créneaux horaires</div>
          <button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.creneauAdd()"><span class="material-icons-outlined">add</span>Ajouter un créneau</button>
        </div>
        <div id="cr-list"></div>
        <div class="hint" style="margin-top:8px">Plusieurs créneaux possibles par jour (matin / midi / soir). Astuce : « Tous » applique le créneau à tous les jours ouverts.</div>`,
      footer: `<button class="btn btn-ghost" onclick="Drawer.close()">Annuler</button>
               <button class="btn btn-primary" onclick="PrestationFichePage.savePeriode()">Enregistrer</button>`
    });
    _renderCreneaux();
  }
  function togglePeriodDay(n) {
    const i = _pDraft.jours.indexOf(n);
    if (i >= 0) _pDraft.jours.splice(i,1); else _pDraft.jours.push(n);
    Utils.qsa('#drawer-layer .day-chip').forEach(ch => ch.classList.toggle('active', _pDraft.jours.includes(+ch.dataset.day)));
  }
  function _renderCreneaux() {
    const host = Utils.qs('#cr-list'); if (!host) return;
    if (!_pDraft.creneaux.length) { host.innerHTML = `<div class="text-muted" style="padding:8px 0">Aucun créneau. Cliquez « Ajouter un créneau ».</div>`; return; }
    host.innerHTML = _pDraft.creneaux.map((c, i) => `
      <div class="flex gap-2 items-center" style="margin-bottom:8px">
        <select class="input" style="max-width:140px" onchange="PrestationFichePage.creneauChange(${i},'jour',this.value)">
          <option value="" ${c.jour?'':'selected'}>Tous les jours</option>
          ${Data.DAYS.map(([n,l]) => `<option value="${n}" ${c.jour===n?'selected':''}>${l}</option>`).join('')}
        </select>
        <input class="input" type="time" style="max-width:120px" value="${c.debut||''}" onchange="PrestationFichePage.creneauChange(${i},'debut',this.value)">
        <span class="text-4">→</span>
        <input class="input" type="time" style="max-width:120px" value="${c.fin||''}" onchange="PrestationFichePage.creneauChange(${i},'fin',this.value)">
        <button class="icon-btn danger" title="Retirer" onclick="PrestationFichePage.creneauRemove(${i})"><span class="material-icons-outlined">close</span></button>
      </div>`).join('');
  }
  function creneauAdd() { _pDraft.creneaux.push({ jour: null, debut: '', fin: '', ordre: _pDraft.creneaux.length+1 }); _renderCreneaux(); }
  function creneauRemove(i) { _pDraft.creneaux.splice(i,1); _renderCreneaux(); }
  function creneauChange(i, field, val) {
    if (field === 'jour') _pDraft.creneaux[i].jour = val ? +val : null;
    else _pDraft.creneaux[i][field] = val;
  }
  function savePeriode() {
    const p = Data.prestation(_id);
    _pDraft.debut = Utils.qs('#pd-debut').value; _pDraft.fin = Utils.qs('#pd-fin').value;
    if (!_pDraft.debut || !_pDraft.fin) { Utils.toast('Les dates de période sont obligatoires', 'error'); return; }
    if (_pDraft.fin < _pDraft.debut) { Utils.toast('La date de fin doit suivre la date de début', 'error'); return; }
    for (const c of _pDraft.creneaux) {
      if (!c.debut || !c.fin) { Utils.toast('Chaque créneau doit avoir une heure de début et de fin', 'error'); return; }
      if (c.fin <= c.debut) { Utils.toast('Heure de fin du créneau ≤ heure de début', 'error'); return; }
    }
    // chevauchement par jour
    const byDay = {};
    _pDraft.creneaux.forEach((c,idx) => c.ordre = idx+1);
    for (const c of _pDraft.creneaux) {
      const keys = c.jour ? [c.jour] : (_pDraft.jours.length ? _pDraft.jours : [0]);
      for (const k of keys) {
        (byDay[k] = byDay[k] || []).push(c);
      }
    }
    for (const k in byDay) {
      const list = byDay[k].slice().sort((a,b)=>a.debut.localeCompare(b.debut));
      for (let i=1;i<list.length;i++) if (list[i].debut < list[i-1].fin) { Utils.toast('Chevauchement de créneaux le même jour', 'error'); return; }
    }
    if (!_pDraft.id) { _pDraft.id = Data.nextId(p.periodes.length ? p.periodes : [{id:0}]); p.periodes.push(_pDraft); }
    else { const idx = p.periodes.findIndex(x => x.id === _pDraft.id); p.periodes[idx] = _pDraft; }
    Drawer.close(); Utils.toast('Période enregistrée', 'success'); _renderPanel();
  }
  function deletePeriode(perId) {
    const p = Data.prestation(_id);
    Modals.confirm({ title: 'Supprimer la période', danger: true, confirmText: 'Supprimer',
      message: 'La période et ses créneaux seront supprimés.',
      onConfirm: () => { p.periodes = p.periodes.filter(x => x.id !== +perId); Utils.toast('Période supprimée','success'); _renderPanel(); } });
  }

  /* — Jours fermés drawer — */
  function openFerme(fId) {
    const p = Data.prestation(_id);
    const f = fId ? (p.joursFermes||[]).find(x => x.id === +fId) : null;
    Drawer.open({
      title: f ? 'Modifier le jour fermé' : 'Nouveau jour fermé', icon: 'event_busy', iconClass: 'error',
      body: `
        <div class="form-grid fg-2" style="padding:0">
          <div class="form-field"><label class="req">Du</label><input class="input" type="date" id="jf-debut" value="${f?f.debut:''}"></div>
          <div class="form-field"><label>Au (optionnel)</label><input class="input" type="date" id="jf-fin" value="${f?(f.fin||''):''}"></div>
          <div class="form-field full"><label class="req">Motif</label><input class="input" id="jf-motif" value="${f?Utils.esc(f.motif||''):''}" placeholder="Ex : Vacances de Noël, jour férié…"></div>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="Drawer.close()">Annuler</button>
               <button class="btn btn-primary" onclick="PrestationFichePage.saveFerme(${f?f.id:'null'})">Enregistrer</button>`
    });
  }
  function saveFerme(fId) {
    const p = Data.prestation(_id);
    const debut = Utils.qs('#jf-debut').value, fin = Utils.qs('#jf-fin').value, motif = Utils.qs('#jf-motif').value.trim();
    if (!debut) { Utils.toast('La date est obligatoire', 'error'); return; }
    if (!motif) { Utils.toast('Le motif est obligatoire', 'error'); return; }
    if (fin && fin < debut) { Utils.toast('La date de fin doit suivre la date de début', 'error'); return; }
    p.joursFermes = p.joursFermes || [];
    if (fId) { const f = p.joursFermes.find(x => x.id === +fId); Object.assign(f, { debut, fin: fin||debut, motif }); }
    else p.joursFermes.push({ id: Data.nextId(p.joursFermes.length?p.joursFermes:[{id:0}]), debut, fin: fin||debut, motif });
    Drawer.close(); Utils.toast('Jour fermé enregistré', 'success'); _renderPanel();
  }
  function deleteFerme(fId) {
    const p = Data.prestation(_id);
    p.joursFermes = p.joursFermes.filter(x => x.id !== +fId);
    Utils.toast('Jour fermé supprimé','success'); _renderPanel();
  }

  /* ───────── Onglet 3 : Sections ───────── */
  function _panelSections(p) {
    const somme = Data.sommePlacesSections(p);
    const over = p.nbrPlace && somme > p.nbrPlace;
    return `
      <div class="bloc">
        <div class="bloc-header"><div class="bloc-icon teal"><span class="material-icons-outlined">grid_view</span></div>
          <div class="bloc-title">Sections — ${Utils.esc(p.nom)}</div>
          <span class="text-4 fs-sm">${somme} / ${p.nbrPlace??'∞'} places</span>
          <button class="btn btn-ghost btn-sm" style="margin-left:10px" onclick="PrestationFichePage.openSection()"><span class="material-icons-outlined">add</span>Ajouter une section</button></div>
        <div style="padding:14px 16px">
          ${over ? `<div class="banner warn"><span class="material-icons-outlined">warning</span>La capacité cumulée des sections (${somme}) dépasse la capacité de la prestation (${p.nbrPlace}).</div>` : ''}
          ${(p.sections||[]).length ? p.sections.map(s => `
            <div class="section-card">
              <div class="section-name">${Utils.esc(s.nom)}</div>
              <div class="section-badges">
                ${Utils.chip(`${s.nbrPlace} places`,'blue','event_seat')}
                ${(s.ageMin!=null&&s.ageMax!=null)?Utils.chip(`${s.ageMin}–${s.ageMax} mois`,'purple','child_care'):''}
                ${(s.heureDebut&&s.heureFin)?Utils.chip(`${s.heureDebut}–${s.heureFin}`,'teal','schedule'):''}
              </div>
              <div class="section-actions">
                <button class="icon-btn" title="Modifier" onclick="PrestationFichePage.openSection(${s.id})"><span class="material-icons-outlined">edit</span></button>
                <button class="icon-btn danger" title="Supprimer" onclick="PrestationFichePage.deleteSection(${s.id})"><span class="material-icons-outlined">delete</span></button>
              </div>
            </div>`).join('') :
            `<div class="empty-state" style="padding:24px"><span class="material-icons-outlined">grid_view</span><div class="title">Aucune section</div><div class="desc">Découpez la prestation en sections (capacité, tranche d'âge, créneau).</div></div>`}
        </div>
      </div>`;
  }
  function openSection(sId) {
    const p = Data.prestation(_id);
    const s = sId ? p.sections.find(x => x.id === +sId) : null;
    Drawer.open({
      title: s ? 'Modifier la section' : 'Nouvelle section', icon: 'grid_view', iconClass: 'teal',
      body: `
        <div class="form-grid fg-2" style="padding:0">
          <div class="form-field full"><label class="req">Nom</label><input class="input" id="s-nom" value="${s?Utils.esc(s.nom):''}" placeholder="Ex : Petite section"></div>
          <div class="form-field"><label class="req">Nombre de places</label><input class="input" type="number" min="0" id="s-places" value="${s?s.nbrPlace:''}"></div>
          <div class="form-field"></div>
          <div class="form-field"><label>Âge min (mois)</label><input class="input" type="number" min="0" id="s-amin" value="${s&&s.ageMin!=null?s.ageMin:''}"></div>
          <div class="form-field"><label>Âge max (mois)</label><input class="input" type="number" min="0" id="s-amax" value="${s&&s.ageMax!=null?s.ageMax:''}"></div>
          <div class="form-field"><label>Heure de début</label><input class="input" type="time" id="s-hd" value="${s?(s.heureDebut||''):''}"></div>
          <div class="form-field"><label>Heure de fin</label><input class="input" type="time" id="s-hf" value="${s?(s.heureFin||''):''}"></div>
        </div>`,
      footer: `<button class="btn btn-ghost" onclick="Drawer.close()">Annuler</button>
               <button class="btn btn-primary" onclick="PrestationFichePage.saveSection(${s?s.id:'null'})">Enregistrer</button>`
    });
  }
  function saveSection(sId) {
    const p = Data.prestation(_id);
    const nom = Utils.qs('#s-nom').value.trim(); const places = Utils.qs('#s-places').value;
    if (!nom) { Utils.toast('Le nom est obligatoire', 'error'); return; }
    if (places === '') { Utils.toast('Le nombre de places est obligatoire', 'error'); return; }
    const amin = Utils.qs('#s-amin').value, amax = Utils.qs('#s-amax').value;
    if (amin !== '' && amax !== '' && +amin >= +amax) { Utils.toast('Âge min doit être inférieur à l\'âge max', 'error'); return; }
    const data = { nom, nbrPlace: +places, ageMin: amin===''?null:+amin, ageMax: amax===''?null:+amax,
      heureDebut: Utils.qs('#s-hd').value||null, heureFin: Utils.qs('#s-hf').value||null };
    if (sId) Object.assign(p.sections.find(x => x.id === +sId), data);
    else { p.sections = p.sections||[]; p.sections.push({ id: Data.nextId(p.sections.length?p.sections:[{id:0}]), ...data }); }
    Drawer.close(); Utils.toast('Section enregistrée', 'success'); _renderPanel();
  }
  function deleteSection(sId) {
    const p = Data.prestation(_id);
    Modals.confirm({ title: 'Supprimer la section', danger: true, confirmText: 'Supprimer',
      message: 'La section sera supprimée définitivement.',
      onConfirm: () => { p.sections = p.sections.filter(x => x.id !== +sId); Utils.toast('Section supprimée','success'); _renderPanel(); } });
  }

  /* ───────── Onglet 4 : Établissements (rattachement N-N) ───────── */
  function _panelEtabs(p) {
    return `
      <div class="bloc">
        <div class="bloc-header"><div class="bloc-icon"><span class="material-icons-outlined">apartment</span></div>
          <div class="bloc-title">Établissements rattachés</div>
          <button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.openAttachEtab()"><span class="material-icons-outlined">add</span>Rattacher un établissement</button></div>
        <div style="padding:6px 0">
          ${(p.etablissements||[]).map(eid => { const e = Data.etab(eid)||{}; const principal = eid===p.etablissementPrincipal;
            return `<div class="orga-list-item" style="cursor:default">
              <div class="orga-avatar">${Utils.esc((e.sigle||'?').slice(0,3))}</div>
              <div class="orga-main"><div class="orga-name">${Utils.esc(e.nom||'?')} ${principal?Utils.badge('Principal','info'):''}</div>
                <div class="orga-sub">${Utils.esc(e.sigle||'')} · ${(e.services||[]).length} service(s)</div></div>
              <div class="flex gap-1">
                ${principal?'':`<button class="btn btn-text btn-sm" onclick="PrestationFichePage.setPrincipal(${eid})">Définir principal</button>`}
                <button class="icon-btn danger" title="Détacher" onclick="PrestationFichePage.detachEtab(${eid})"><span class="material-icons-outlined">link_off</span></button>
              </div>
            </div>`; }).join('')}
        </div>
        <div class="infobanner info" style="margin:12px 16px">
          <span class="material-icons-outlined">info</span>
          L'<b>établissement principal</b> sert de source d'héritage pour le calendrier (horaires &amp; jours) lorsque le mode « hérité » est actif.
        </div>
      </div>`;
  }
  function openAttachEtab() {
    const p = Data.prestation(_id);
    const dispo = PrestaData.etablissements.filter(e => !(p.etablissements||[]).includes(e.id));
    if (!dispo.length) { Utils.toast('Tous les établissements sont déjà rattachés', 'info'); return; }
    Drawer.open({ title: 'Rattacher un établissement', icon: 'apartment',
      body: `<div class="form-field"><label class="req">Établissement</label>
        <select class="input" id="at-etab">${dispo.map(e => `<option value="${e.id}">${Utils.esc(e.nom)}</option>`).join('')}</select></div>
        <div class="hint" style="margin-top:8px">Une même prestation peut être proposée par plusieurs établissements.</div>`,
      footer: `<button class="btn btn-ghost" onclick="Drawer.close()">Annuler</button>
               <button class="btn btn-primary" onclick="PrestationFichePage.doAttachEtab()">Rattacher</button>` });
  }
  function doAttachEtab() {
    const p = Data.prestation(_id); const id = +Utils.qs('#at-etab').value;
    if (!(p.etablissements||[]).includes(id)) p.etablissements.push(id);
    Drawer.close(); Utils.toast('Établissement rattaché', 'success'); _renderFiche();
  }
  function detachEtab(eid) {
    const p = Data.prestation(_id);
    if ((p.etablissements||[]).length <= 1) { Utils.toast('Une prestation doit rester rattachée à au moins un établissement', 'error'); return; }
    if (eid === p.etablissementPrincipal) { Utils.toast('Définissez d\'abord un autre établissement principal', 'error'); return; }
    Modals.confirm({ title: 'Détacher l\'établissement', confirmText: 'Détacher',
      message: 'Le lien sera retiré. La prestation n\'est pas supprimée.',
      onConfirm: () => { p.etablissements = p.etablissements.filter(x => x !== eid); Utils.toast('Établissement détaché','success'); _renderFiche(); } });
  }
  function setPrincipal(eid) { const p = Data.prestation(_id); p.etablissementPrincipal = eid; Utils.toast('Établissement principal mis à jour','success'); _renderPanel(); }

  /* ───────── Onglet 5 : Tarifs (rattachement) ───────── */
  function _panelTarifs(p) {
    return `
      <div class="bloc">
        <div class="bloc-header"><div class="bloc-icon" style="background:var(--c-orange-light)"><span class="material-icons-outlined" style="color:var(--c-orange)">sell</span></div>
          <div class="bloc-title">Tarifs rattachés</div>
          <button class="btn btn-ghost btn-sm" onclick="PrestationFichePage.openLinkTarif()"><span class="material-icons-outlined">add</span>Lier un tarif</button></div>
        <div class="infobanner info" style="margin:12px 16px">
          <span class="material-icons-outlined">open_in_new</span>
          Rattachement uniquement. La création/édition des barèmes se fait dans le module <b>Tarifs</b> (carte « Paramétrage des tarifs »).
        </div>
        <table class="data-table">
          <thead><tr><th>Tarif</th><th>Sigle</th><th>Mode de calcul</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            ${(p.tarifs||[]).length ? p.tarifs.map(tid => { const t = Data.tarif(tid)||{}; return `
              <tr><td class="strong">${Utils.esc(t.nom||'?')}</td><td><code>${Utils.esc(t.sigle||'')}</code></td>
                <td>${Utils.chip(t.mode||'—','blue')}</td>
                <td style="text-align:right"><button class="icon-btn danger" title="Délier" onclick="PrestationFichePage.unlinkTarif(${tid})"><span class="material-icons-outlined">link_off</span></button></td></tr>`; }).join('')
              : `<tr><td colspan="4"><div class="empty-state" style="padding:20px"><span class="material-icons-outlined">sell</span><div class="desc">Aucun tarif rattaché.</div></div></td></tr>`}
          </tbody>
        </table>
      </div>`;
  }
  function openLinkTarif() {
    const p = Data.prestation(_id);
    const dispo = PrestaData.tarifsCatalog.filter(t => !(p.tarifs||[]).includes(t.id));
    if (!dispo.length) { Utils.toast('Tous les tarifs sont déjà rattachés', 'info'); return; }
    Drawer.open({ title: 'Lier un tarif existant', icon: 'sell',
      body: `<div class="form-field"><label class="req">Tarif</label>
        <select class="input" id="lt-tarif">${dispo.map(t => `<option value="${t.id}">${Utils.esc(t.nom)} (${t.sigle})</option>`).join('')}</select></div>`,
      footer: `<button class="btn btn-ghost" onclick="Drawer.close()">Annuler</button>
               <button class="btn btn-primary" onclick="PrestationFichePage.doLinkTarif()">Lier</button>` });
  }
  function doLinkTarif() {
    const p = Data.prestation(_id); const id = +Utils.qs('#lt-tarif').value;
    p.tarifs = p.tarifs || []; if (!p.tarifs.includes(id)) p.tarifs.push(id);
    Drawer.close(); Utils.toast('Tarif rattaché', 'success'); _renderFiche();
  }
  function unlinkTarif(tid) {
    const p = Data.prestation(_id);
    p.tarifs = p.tarifs.filter(x => x !== tid); Utils.toast('Tarif délié','success'); _renderFiche();
  }

  return {
    render, switchTab, doCreate,
    editProps, cancelProps, saveProps, toggleActif,
    setCalMode, selectAgendaPeriode, openPeriode, togglePeriodDay, creneauAdd, creneauRemove, creneauChange, savePeriode, deletePeriode,
    openFerme, saveFerme, deleteFerme,
    openSection, saveSection, deleteSection,
    openAttachEtab, doAttachEtab, detachEtab, setPrincipal,
    openLinkTarif, doLinkTarif, unlinkTarif,
  };
})();
window.PrestationFichePage = PrestationFichePage;
