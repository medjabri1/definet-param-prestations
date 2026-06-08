/* ═══════════════════════════════════════════════════════════════
   STATE — store léger (identique aux autres prototypes Paramétrage)
   ═══════════════════════════════════════════════════════════════ */
const State = (() => {
  let _state = { route: null, theme: 'azur', navExpanded: true, navOpenGroups: { params: true } };
  const _listeners = {};
  function get(key) { return key ? _state[key] : { ..._state }; }
  function set(key, value) { const prev = _state[key]; _state[key] = value; _emit(key, value, prev); }
  function _emit(key, value, prev) {
    (_listeners[key] || []).forEach(fn => fn(value, prev));
    (_listeners['*'] || []).forEach(fn => fn(key, value, prev));
  }
  function on(key, fn) { (_listeners[key] = _listeners[key] || []).push(fn); return () => { _listeners[key] = _listeners[key].filter(f => f !== fn); }; }
  return { get, set, on };
})();
window.State = State;

/* ═══════════════════════════════════════════════════════════════
   DONNÉES MOCK — domaine « Paramétrage des prestations »
   Reflète les décisions client :
   - prestation = activité liée aux établissements (N-N) ;
   - accès GLOBAL à toutes les prestations (sans sélectionner d'établissement) ;
   - regroupées par TYPOLOGIE (= référentiel type d'activité) ;
   - rattachées à UNE régie de facturation (obligatoire) ;
   - D2 = Option B : horaires/jours HÉRITÉS de l'établissement, surchargeables ;
   - amplitude MULTI-CRÉNEAUX par jour (matin/midi/soir) ;
   - calendrier intégrant les JOURS FERMÉS ;
   - écran TARIFS = rattachement (lier/délier) en lien avec la carte parametrage-tarifs.
   Jours : 1=Lundi … 7=Dimanche.
   ═══════════════════════════════════════════════════════════════ */
const PrestaData = {

  // Référentiel "type d'activité" (REFACTIVITE) servant d'axe de regroupement (typologie)
  typologies: [
    { id: 1, nom: 'Restauration scolaire', couleur: 'orange' },
    { id: 2, nom: 'Accueil périscolaire',  couleur: 'blue' },
    { id: 3, nom: 'Accueil extrascolaire (ALSH)', couleur: 'purple' },
    { id: 4, nom: 'Petite enfance',         couleur: 'teal' },
    { id: 5, nom: 'Activités & loisirs',    couleur: 'green' },
  ],

  // Modes d'accueil (REFMODE)
  modes: [
    { id: 1, nom: 'Repas' }, { id: 2, nom: 'Accueil' }, { id: 3, nom: 'Journée' },
    { id: 4, nom: 'Demi-journée' }, { id: 5, nom: 'À l\'heure' },
  ],

  // Régies de facturation (REGIE_ORDONNATEUR)
  regies: [
    { id: 1, nom: 'Régie Scolaire' },
    { id: 2, nom: 'Régie Enfance-Jeunesse' },
    { id: 3, nom: 'Régie Petite Enfance' },
  ],

  // Établissements (ORGANISME) — porteurs des horaires/jours par défaut (héritage D2 B)
  etablissements: [
    { id: 1, nom: 'Mairie de Demoville', sigle: 'MAIRIE',
      heureOuverture: '07:30', heureFermeture: '18:30', joursOuverture: [1,2,3,4,5],
      services: [ { id: 11, nom: 'Service Restauration' }, { id: 12, nom: 'Service Périscolaire' } ] },
    { id: 2, nom: 'École Jean-Jaurès', sigle: 'EJJ',
      heureOuverture: '07:30', heureFermeture: '18:00', joursOuverture: [1,2,4,5],
      services: [ { id: 21, nom: 'Restauration' }, { id: 22, nom: 'Étude surveillée' } ] },
    { id: 3, nom: 'Crèche Les Lutins', sigle: 'LUTINS',
      heureOuverture: '07:00', heureFermeture: '19:00', joursOuverture: [1,2,3,4,5],
      services: [ { id: 31, nom: 'Multi-accueil' } ] },
    { id: 4, nom: 'Centre de loisirs La Clairière', sigle: 'CLAIR',
      heureOuverture: '08:00', heureFermeture: '18:00', joursOuverture: [3,6],
      services: [ { id: 41, nom: 'ALSH' } ] },
  ],

  // Catalogue de tarifs (réf. carte parametrage-tarifs) — pour le rattachement
  tarifsCatalog: [
    { id: 1, nom: 'Cantine maternelle', sigle: 'CANT-MAT', mode: 'À l\'unité' },
    { id: 2, nom: 'Cantine élémentaire', sigle: 'CANT-ELEM', mode: 'À l\'unité' },
    { id: 3, nom: 'Accueil du matin', sigle: 'ACM', mode: 'À l\'heure' },
    { id: 4, nom: 'ALSH journée', sigle: 'ALSH-J', mode: 'Forfait' },
    { id: 5, nom: 'Crèche — taux d\'effort', sigle: 'CRECHE-TE', mode: 'Forfait' },
  ],

  prestations: [
    {
      id: 1, nom: 'Cantine — Maternelle', sigle: 'CANT-MAT',
      description: 'Restauration scolaire pour les classes de maternelle.',
      libellePortail: 'Restauration maternelle', couleur: '#E88C00',
      idTypologie: 1, idMode: 1, idRegie: 1, idService: 21,
      nbrPlace: 120, nbrPlaceJour: 120,
      demandable: true, publique: true, portailVisible: true, portailActif: true, portailOrdre: 1,
      actif: true, utilisee: true,
      etablissements: [2, 1], etablissementPrincipal: 2,
      calendrierMode: 'PERSO',
      periodes: [
        { id: 1, debut: '2026-09-01', fin: '2027-07-06', jours: [1,2,4,5],
          creneaux: [ { id: 1, jour: null, debut: '11:30', fin: '13:30', ordre: 1 } ] },
      ],
      joursFermes: [
        { id: 1, debut: '2026-12-21', fin: '2027-01-04', motif: 'Vacances de Noël' },
        { id: 2, debut: '2026-11-11', fin: '2026-11-11', motif: 'Armistice' },
      ],
      sections: [
        { id: 1, nom: 'Petite section', nbrPlace: 40, ageMin: 36, ageMax: 60, heureDebut: '11:30', heureFin: '13:30' },
        { id: 2, nom: 'Moyenne/Grande section', nbrPlace: 60, ageMin: 60, ageMax: 84, heureDebut: '11:30', heureFin: '13:30' },
      ],
      tarifs: [1],
    },
    {
      id: 2, nom: 'Accueil périscolaire du matin', sigle: 'PERI-MAT',
      description: 'Accueil avant la classe, facturé à l\'heure.',
      libellePortail: 'Périscolaire matin', couleur: '#0D5BBE',
      idTypologie: 2, idMode: 5, idRegie: 2, idService: 12,
      nbrPlace: 60, nbrPlaceJour: 60,
      demandable: true, publique: true, portailVisible: true, portailActif: false, portailOrdre: 2,
      actif: true, utilisee: false,
      etablissements: [1], etablissementPrincipal: 1,
      calendrierMode: 'HERITE',
      periodes: [],
      joursFermes: [],
      sections: [],
      tarifs: [3],
    },
    {
      id: 3, nom: 'ALSH mercredi', sigle: 'ALSH-MER',
      description: 'Accueil de loisirs sans hébergement, journée du mercredi.',
      libellePortail: 'ALSH mercredi', couleur: '#7C3AED',
      idTypologie: 3, idMode: 3, idRegie: 2, idService: 41,
      nbrPlace: 80, nbrPlaceJour: 80,
      demandable: true, publique: true, portailVisible: true, portailActif: true, portailOrdre: 3,
      actif: true, utilisee: false,
      etablissements: [4], etablissementPrincipal: 4,
      calendrierMode: 'PERSO',
      periodes: [
        { id: 1, debut: '2026-09-02', fin: '2027-07-08', jours: [3],
          creneaux: [
            { id: 1, jour: 3, debut: '08:00', fin: '12:00', ordre: 1 },
            { id: 2, jour: 3, debut: '13:30', fin: '18:00', ordre: 2 },
          ] },
      ],
      joursFermes: [],
      sections: [
        { id: 1, nom: 'Les Petits (3-6 ans)', nbrPlace: 40, ageMin: 36, ageMax: 72, heureDebut: '08:00', heureFin: '18:00' },
        { id: 2, nom: 'Les Grands (6-11 ans)', nbrPlace: 40, ageMin: 72, ageMax: 132, heureDebut: '08:00', heureFin: '18:00' },
      ],
      tarifs: [4],
    },
    {
      id: 4, nom: 'Multi-accueil Les Lutins', sigle: 'CRECHE',
      description: 'Accueil régulier et occasionnel des 0-3 ans.',
      libellePortail: 'Crèche Les Lutins', couleur: '#0D9488',
      idTypologie: 4, idMode: 3, idRegie: 3, idService: 31,
      nbrPlace: 30, nbrPlaceJour: 30,
      demandable: true, publique: false, portailVisible: false, portailActif: false, portailOrdre: null,
      actif: true, utilisee: true,
      etablissements: [3], etablissementPrincipal: 3,
      calendrierMode: 'HERITE',
      periodes: [],
      joursFermes: [ { id: 1, debut: '2026-08-01', fin: '2026-08-23', motif: 'Fermeture estivale' } ],
      sections: [
        { id: 1, nom: 'Les Bébés', nbrPlace: 10, ageMin: 2, ageMax: 12, heureDebut: '07:00', heureFin: '19:00' },
        { id: 2, nom: 'Les Moyens', nbrPlace: 10, ageMin: 12, ageMax: 24, heureDebut: '07:00', heureFin: '19:00' },
        { id: 3, nom: 'Les Grands', nbrPlace: 10, ageMin: 24, ageMax: 36, heureDebut: '07:00', heureFin: '19:00' },
      ],
      tarifs: [5],
    },
    {
      id: 5, nom: 'Étude surveillée (ancienne formule)', sigle: 'ETUDE-OLD',
      description: 'Remplacée par l\'accompagnement à la scolarité — conservée pour l\'historique.',
      libellePortail: '', couleur: '#9CA3AF',
      idTypologie: 2, idMode: 2, idRegie: 1, idService: 22,
      nbrPlace: 30, nbrPlaceJour: 30,
      demandable: false, publique: false, portailVisible: false, portailActif: false, portailOrdre: null,
      actif: false, utilisee: false,
      etablissements: [2], etablissementPrincipal: 2,
      calendrierMode: 'HERITE',
      periodes: [], joursFermes: [], sections: [], tarifs: [],
    },
  ],
};
window.PrestaData = PrestaData;

const Data = {
  prestation:  (id) => PrestaData.prestations.find(p => p.id === +id),
  typologie:   (id) => PrestaData.typologies.find(t => t.id === +id),
  mode:        (id) => PrestaData.modes.find(m => m.id === +id),
  regie:       (id) => PrestaData.regies.find(r => r.id === +id),
  etab:        (id) => PrestaData.etablissements.find(e => e.id === +id),
  service:     (id) => { for (const e of PrestaData.etablissements) { const s = (e.services||[]).find(x => x.id === +id); if (s) return s; } return null; },
  tarif:       (id) => PrestaData.tarifsCatalog.find(t => t.id === +id),
  nextId:      (arr) => Math.max(0, ...arr.map(x => x.id)) + 1,
  typoColor:   (id) => (Data.typologie(id) || {}).couleur || 'gray',
  // Jours fériés/ouverture helpers
  DAYS: [ [1,'Lun'],[2,'Mar'],[3,'Mer'],[4,'Jeu'],[5,'Ven'],[6,'Sam'],[7,'Dim'] ],
  dayShort: (n) => (Data.DAYS.find(d => d[0] === n) || [,'?'])[1],
  joursLabel: (arr) => (arr && arr.length) ? arr.slice().sort((a,b)=>a-b).map(Data.dayShort).join(' · ') : '—',
  // Pour l'héritage (D2 B) : source = établissement principal
  calendrierHerite: (p) => {
    const e = Data.etab(p.etablissementPrincipal) || {};
    return { jours: e.joursOuverture || [], debut: e.heureOuverture, fin: e.heureFermeture, etab: e };
  },
  sommePlacesSections: (p) => (p.sections || []).reduce((s, x) => s + (+x.nbrPlace || 0), 0),
};
window.Data = Data;
