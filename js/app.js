// ============================================================
// app.js - Main application logic, auto-save, helpers
// ============================================================
'use strict';

// Country options shared by Land_ZE, Land_ST, GeldinstitutLand, Land_ZK
const COUNTRY_OPTIONS = [
    'Deutschland',
    'Afghanistan, islamische Republik',
    'Albanien',
    'Algerien',
    'Andorra',
    'Angola',
    'Anguilla',
    'Antigua und Barbuda',
    'Argentinien',
    'Armenien',
    'Aserbaidschan',
    'Australien',
    'Bahamas',
    'Bahrain',
    'Bangladesch',
    'Barbados',
    'Belarus',
    'Belgien',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivien',
    'Bosnien-Herzegowina',
    'Botsuana',
    'Brasilien',
    'Brunei Darussalam',
    'Bulgarien',
    'Burkina Faso',
    'Burundi',
    'Cabo Verde',
    'Chile',
    'China',
    'Cookinseln',
    'Costa Rica',
    'Cote d\'Ivoire',
    'Dominica',
    'Dominikanische Republik',
    'Dschibuti',
    'Dänemark',
    'Ecuador',
    'El Salvador',
    'Eritrea',
    'Estland',
    'Eswatini',
    'Fidschi',
    'Finnland',
    'Frankreich',
    'Gabun',
    'Gambia',
    'Georgien',
    'Ghana',
    'Gibraltar',
    'Grenada',
    'Griechenland',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Indien',
    'Indonesien',
    'Irak',
    'Iran',
    'Irland',
    'Island',
    'Israel',
    'Italien',
    'Jamaika',
    'Japan',
    'Jemen',
    'Jordanien',
    'Kambodscha',
    'Kamerun',
    'Kanada',
    'Kasachstan',
    'Katar',
    'Kenia',
    'Kirgisistan',
    'Kiribati',
    'Kolumbien',
    'Komoren',
    'Kongo',
    'Kongo, Demokratische Republik',
    'Korea, Demokratische Volksrepublik (Nordkorea)',
    'Korea, Republik (Südkorea)',
    'Kosovo',
    'Kroatien',
    'Kuba',
    'Kuwait',
    'Laos',
    'Lesotho',
    'Lettland',
    'Libanon',
    'Liberia',
    'Libyen',
    'Liechtenstein',
    'Litauen',
    'Luxemburg',
    'Madagaskar',
    'Malawi',
    'Malaysia',
    'Malediven',
    'Mali',
    'Malta',
    'Marokko',
    'Marshallinseln',
    'Mauretanien',
    'Mauritius',
    'Mayotte',
    'Mexiko',
    'Mikronesien',
    'Moldau',
    'Monaco',
    'Mongolei',
    'Montenegro',
    'Montserrat',
    'Mosambik',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Neuseeland',
    'Nicaragua',
    'Niederlande',
    'Niger',
    'Nigeria',
    'Niue',
    'Nordmazedonien',
    'Norwegen',
    'ODA: Afrika na (nur EL)',
    'ODA: Afrika nördlich der Sahara na (nur EL)',
    'ODA: Afrika südlich der Sahara na (nur EL)',
    'ODA: Amerika na (nur EL)',
    'ODA: Asien na (nur EL)',
    'ODA: Entwicklungsländer na',
    'ODA: Europa na (nur EL)',
    'ODA: Karibik na (nur EL)',
    'ODA: Karibik, Zentralamerika, Mexiko na (nur EL)',
    'ODA: Melanesien na (nur EL)',
    'ODA: Mikronesien na (nur EL)',
    'ODA: Naher und Mittlerer Osten na (nur EL)',
    'ODA: Ostafrika na (nur EL)',
    'ODA: Ostasien na (nur EL)',
    'ODA: Ozeanien na (nur EL)',
    'ODA: Polynesien na (nur EL)',
    'ODA: Süd- und Zentralasien (nur EL)',
    'ODA: Südamerika na (nur EL)',
    'ODA: Südasien na (nur EL)',
    'ODA: Südliches Afrika na (nur EL)',
    'ODA: Westafrika na (nur EL)',
    'ODA: Zentralafrika na (nur EL)',
    'ODA: Zentralamerika und Mexico na (nur EL)',
    'ODA: Zentralasien na (nur EL)',
    'Oman',
    'Pakistan',
    'Palau',
    'Palästinensische Gebiete',
    'Panama',
    'Papua-Neuguinea',
    'Paraguay',
    'Peru',
    'Philippinen',
    'Polen',
    'Portugal',
    'Ruanda',
    'Rumänien',
    'Russland',
    'Salomonen',
    'Sambia',
    'Samoa',
    'San Marino',
    'Sao Tome und Principe',
    'Saudi-Arabien',
    'Schweden',
    'Schweiz',
    'Senegal',
    'Serbien',
    'Seychellen',
    'Sierra Leone',
    'Simbabwe',
    'Singapur',
    'Slowakei',
    'Slowenien',
    'Somalia',
    'Spanien',
    'Sri Lanka',
    'St. Helena',
    'St. Kitts und Nevis',
    'St. Lucia',
    'St. Vincent und die Grenadinen',
    'Sudan',
    'Suriname',
    'Syrien',
    'Südafrika',
    'Südsudan',
    'Tadschikistan',
    'Taiwan',
    'Tansania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tokelau-Inseln',
    'Tonga',
    'Trinidad und Tobago',
    'Tschad',
    'Tschechische Republik',
    'Tunesien',
    'Turkmenistan',
    'Turks- und Caicosinseln',
    'Tuvalu',
    'Türkei',
    'Uganda',
    'Ukraine',
    'Ungarn',
    'Uruguay',
    'Usbekistan',
    'Vanuatu',
    'Vatikanstadt (Heiliger Stuhl)',
    'Venezuela',
    'Vereinigte Arabische Emirate',
    'Vereinigte Staaten von Amerika',
    'Vereinigtes Königreich - Großbritannien',
    'Vietnam',
    'Wallis- und Futuna-Inseln',
    'Zentralafrikanische Republik',
    'Zypern',
    'nicht zuzuordnen',
    'Ägypten',
    'Äquatorialguinea',
    'Äthiopien',
    'Österreich',
    'Übergreifend, im einzelnen nicht zuzuordnen',
];

// Tarifgruppe options for Tarif 1 (E12-E15) and Tarif 2 (E1-E11)
const TARIF1_OPTIONS = [
    'TVöD - E 15 Ü',
    'TVöD - E 15',
    'TVöD - E 14',
    'TVöD - E 13',
    'TVöD - E 12',
    'TV Ärzte - Ä 4/IV',
    'TV Ärzte - Ä 3/III',
    'TV Ärzte - Ä 2/II',
    'TV Ärzte - Ä 1/I',
    'TV-L - E 15 Ü',
    'TV-L - E 15 Ü (Ost)',
    'TV-L - E 15',
    'TV-L - E 15 (Ost)',
    'TV-L - E 14',
    'TV-L - E 14 (Ost)',
    'TV-L - E 13',
    'TV-L - E 13 (Ost)',
    'TV-L - E 12',
    'TV-L - E 12 (Ost)',
    'Hausvertrag',
    'Sonstige',
];

const TARIF2_OPTIONS = [
    'TVöD - E 11',
    'TVöD - E 10',
    'TVöD - E 9a',
    'TVöD - E 9b',
    'TVöD - E 9c',
    'TVöD - E 8',
    'TVöD - E 7',
    'TVöD - E 6',
    'TVöD - E 5',
    'TVöD - E 4',
    'TVöD - E 3',
    'TVöD - E 2',
    'TVöD - E 1',
    'TV-L - E 11',
    'TV-L - E 11 (Ost)',
    'TV-L - E 10',
    'TV-L - E 10 (Ost)',
    'TV-L - E 9',
    'TV-L - E 9 (Ost)',
    'TV-L - E 8',
    'TV-L - E 8 (Ost)',
    'TV-L - E 7',
    'TV-L - E 7 (Ost)',
    'TV-L - E 6',
    'TV-L - E 6 (Ost)',
    'TV-L - E 5',
    'TV-L - E 5 (Ost)',
    'TV-L - E 4',
    'TV-L - E 4 (Ost)',
    'TV-L - E 3',
    'TV-L - E 3 (Ost)',
    'TV-L - E 2',
    'TV-L - E 2 (Ost)',
    'TV-L - E 1',
    'TV-L - E 1 (Ost)',
    'Sonstige',
    'Hausvertrag',
];

// Rechtsform options
const RECHTSFORM_OPTIONS = [
    'gGmbH (haftungsbeschränkt)',
    'AG',
    'AG & Co. KG',
    'AG & Co. KGaA',
    'AG & Co. OHG',
    'AG (schweizer Recht)',
    'AG in Gründung',
    'Aktiengesellschaft (AG), gemeinnützig',
    'Anstalt des öffentlichen Rechts',
    'Arbeitsgemeinschaft',
    'B.V.',
    'B.V. & Co. KG',
    'BGB-Gesellschaft',
    'Behörde',
    'Bundesoberbehörde',
    'Bundesverband',
    'Eigenbetrieb',
    'Einrichtung des öffentlichen Rechts',
    'Einzelunternehmen',
    'Europäische Aktiengesellschaft (SE)',
    'Europäisches Konsortium für Forschungsinfrastruktur (ERIC)',
    'Freiberufliches Einzelunternehmen',
    'GbR',
    'Gebietskörperschaft',
    'Genossenschaft',
    'Gesamthandsgemeinschaft',
    'Gesellschaft des öffentlichen Rechts',
    'Gesellschaft mit beschränkter Haftung (GmbH) i. G.',
    'Gesetzliche Krankenkasse',
    'Gewerkschaft',
    'GmbH',
    'GmbH & Cie KG',
    'GmbH & Co. KG',
    'GmbH & Co. KGaA',
    'GmbH & Co. OHG',
    'GmbH & Co.AG',
    'GmbH KG',
    'Internationale Organisation',
    'Jobcenter gE',
    'Juristische Person',
    'Juristische Person des privaten Rechts',
    'Juristische Person des öffentlichen Rechts',
    'KG',
    'KGaA',
    'Kommunaler Eigenbetrieb',
    'Kommune',
    'Körperschaft des bürgerlichen Rechts',
    'Körperschaft des englischen Rechts',
    'Körperschaft des französischen Rechts',
    'Körperschaft des luxemburgischen Rechts',
    'Körperschaft des privaten Rechts',
    'Körperschaft des spanischen Rechts',
    'Körperschaft des öffentlichen Rechts',
    'Körperschaft des öffentlichen Rechts - staatl. Einrichtung',
    'Körperschaft öR und staatliche Einrichtung',
    'Landesbehörde',
    'Landesoberbehörde',
    'Ltd.',
    'Ltd. & Co. KG',
    'Natürliche Person',
    'Nichteingetragener Verein',
    'Nichtrechtsfähige Anstalt des öffentlichen Rechts',
    'Nichtrechtsfähiger Verein',
    'OHG',
    'Oberste Bundesbehörde',
    'Oberste Landesbehörde',
    'Offene Handelsgesellschaft (OHG)',
    'PLC & Co. KG',
    'Partnerschaftsgesellschaft',
    'Personengesellschaft',
    'Rechtsfähiger Verein des Bürgerlichen Rechts',
    'Rechtsfähiger Verein kraft staatlicher Verleihung',
    'S.A.S. & Co. KG',
    'SA',
    'SA & Co. KG',
    'SE',
    'SE & Co. KG',
    'SE & Co. KGaA',
    'Stiftung',
    'Stiftung & Co. KG',
    'Stiftung des bürgerlichen Rechts',
    'Stiftung des privaten Rechts',
    'Stiftung des öffentlichen Rechts',
    'Teilkörperschaft des öffentlichen Rechts',
    'UG & Co. KG',
    'UG (haftungsbeschränkt)',
    'amerikanische Kommanditgesellschaft',
    'e.G.',
    'e.K.',
    'e.V.',
    'e.V. & Co. KG',
    'e.V. gemeinnützig',
    'e.V. in Gründung',
    'entfällt, da ausführende Stelle oder Untereinheit des ZE',
    'gGmbH',
    'gUG (haftungsbeschränkt)',
    'gemeinnützige Aktiengesellschaft (gAG)',
    'gemeinnützige Stiftung',
    'gemeinnützige Stiftung des bürgerlichen Rechts',
    'gemeinnützige Stiftung des privaten Rechts',
    'gemeinnützige Unternehmensgesellschaft',
    'privatrechtlicher Verein',
];

const App = {
  // Project years derived from von/bis dates
  jahre: [],

  init() {
    this.populateSelects();
    this.bindEvents();
    this.loadFromStorage();
    this.initDatePickers();
    this.updateJahre();
    FP.init();
    this.syncInstitution();
    this.toggleErklaerungen();
    this.updateProfiOnlineTable();
    this.initCharCounters();
    this.startAutoSave();
  },

  // ---- Populate select dropdowns from JS arrays ----
  populateSelects() {
    // Helper to fill a <select> with options
    const fill = (sel, options, defaultVal) => {
      for (const val of options) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        sel.appendChild(opt);
      }
      if (defaultVal) sel.value = defaultVal;
    };

    // Country selects
    for (const name of ['Land_ZE', 'Land_ST', 'GeldinstitutLand', 'Land_ZK']) {
      const sel = document.querySelector(`[data-field="${name}"]`);
      if (sel) fill(sel, COUNTRY_OPTIONS, 'Deutschland');
    }

    // Rechtsform
    const rf = document.querySelector('[data-field="Rechtsform"]');
    if (rf) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '-- bitte wählen --';
      rf.appendChild(placeholder);
      fill(rf, RECHTSFORM_OPTIONS);
    }
  },

  // ---- Project year calculation ----
  getJahre() {
    const von = document.getElementById('projektVon').value;
    const bis = document.getElementById('projektBis').value;
    if (!von || !bis) return [];
    const startYear = parseInt(von.substring(0, 4));
    const endYear = parseInt(bis.substring(0, 4));
    const years = [];
    for (let y = startYear; y <= endYear; y++) years.push(String(y));
    return years;
  },

  updateJahre() {
    const newJahre = this.getJahre();
    const changed = JSON.stringify(newJahre) !== JSON.stringify(this.jahre);
    this.jahre = newJahre;

    document.getElementById('vonJahrDisplay').textContent = this.jahre[0] || '-';
    document.getElementById('bisJahrDisplay').textContent = this.jahre[this.jahre.length - 1] || '-';
    document.getElementById('projektJahreDisplay').textContent = this.jahre.join(', ') || '-';

    if (changed && this.jahre.length > 0) {
      FP.rebuildAllTables();
    }
  },

  // ---- Date pickers ----
  initDatePickers() {
    const opts = {
      locale: 'de',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd.m.Y',
      allowInput: true,
    };
    document.querySelectorAll('.datepicker').forEach(el => {
      const fp = flatpickr(el, {
        ...opts,
        onChange: () => {
          if (el.id === 'projektVon' || el.id === 'projektBis') {
            this.updateJahre();
          }
        }
      });
      // If already has a value (from loadFromStorage), set it
      if (el.value) fp.setDate(el.value, false);
    });
  },

  // ---- Form field helpers ----
  getFieldValue(fieldName) {
    const el = document.querySelector(`[data-field="${fieldName}"]`);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'Ja' : 'Nein';
    return el.value;
  },

  setFieldValue(fieldName, value) {
    const el = document.querySelector(`[data-field="${fieldName}"]`);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = (value === 'Ja' || value === 'true' || value === true);
    } else if (el._flatpickr) {
      el._flatpickr.setDate(value || '', false);
    } else {
      el.value = value || '';
    }
  },

  // ---- Events ----
  bindEvents() {
    document.getElementById('btnImportXml').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          XmlImport.importXml(ev.target.result);
          this.updateCharCounters();
          this.showSaveStatus('Importiert');
        };
        reader.readAsText(file);
      }
      e.target.value = '';
    });
    document.getElementById('btnExportXml').addEventListener('click', () => {
      XmlExport.exportXml();
    });
    document.getElementById('btnClearAll').addEventListener('click', () => {
      if (confirm('Alle Daten löschen und neu beginnen?')) {
        localStorage.removeItem('eoFormData');
        localStorage.removeItem('eoFinanzplan');
        location.reload();
      }
    });

    // Copy contacts
    document.getElementById('kopierePa').addEventListener('change', (e) => {
      if (e.target.value === 'der Projektleitung') {
        this.setFieldValue('akad_Grad_PA', this.getFieldValue('akad_Grad_PL'));
        this.setFieldValue('Vorname_PA', this.getFieldValue('Vorname_PL'));
        this.setFieldValue('Name_PA', this.getFieldValue('Name_PL'));
        this.setFieldValue('Telefon_PA', this.getFieldValue('Telefon_PL'));
        this.setFieldValue('Fax_PA', this.getFieldValue('Fax_PL'));
        this.setFieldValue('Email_PA', this.getFieldValue('Email_PL'));
      }
    });
    document.getElementById('kopiereUz').addEventListener('change', (e) => {
      if (e.target.value === 'der Projektleitung') {
        this.setFieldValue('akad_Grad_UZ', this.getFieldValue('akad_Grad_PL'));
        this.setFieldValue('Vorname_UZ', this.getFieldValue('Vorname_PL'));
        this.setFieldValue('Name_UZ', this.getFieldValue('Name_PL'));
        this.setFieldValue('Telefon_UZ', this.getFieldValue('Telefon_PL'));
        this.setFieldValue('Fax_UZ', this.getFieldValue('Fax_PL'));
        this.setFieldValue('Email_UZ', this.getFieldValue('Email_PL'));
      } else if (e.target.value === 'der administrativen Ansprechperson') {
        this.setFieldValue('akad_Grad_UZ', this.getFieldValue('akad_Grad_PA'));
        this.setFieldValue('Vorname_UZ', this.getFieldValue('Vorname_PA'));
        this.setFieldValue('Name_UZ', this.getFieldValue('Name_PA'));
        this.setFieldValue('Telefon_UZ', this.getFieldValue('Telefon_PA'));
        this.setFieldValue('Fax_UZ', this.getFieldValue('Fax_PA'));
        this.setFieldValue('Email_UZ', this.getFieldValue('Email_PA'));
      }
    });

    // ST / ZK same-as toggles
    document.getElementById('stSameAsZe').addEventListener('change', () => this.syncInstitution());
    document.getElementById('zkSameAsZe').addEventListener('change', () => this.syncInstitution());

    // ppSatz change triggers Finanzierung re-render
    document.getElementById('ppSatz').addEventListener('input', () => FP.renderFinanzierung());

    // Erklaerungen conditional fields
    document.getElementById('selSonstFoerd').addEventListener('change', () => this.toggleErklaerungen());
    document.getElementById('chkFK').addEventListener('change', () => this.toggleErklaerungen());

    // Mark dirty on any input change, refresh profiOnline table for contact fields
    document.addEventListener('input', (e) => {
      this.showSaveStatus('Ungespeichert...', true);
      const field = e.target.getAttribute?.('data-field') || '';
      if (field.match(/_(PL|PA|UZ)$/) || field.match(/^Email/)) {
        this.updateProfiOnlineTable();
      }
    });
  },

  initCharCounters() {
    document.querySelectorAll('textarea[maxlength]').forEach(ta => {
      const max = parseInt(ta.getAttribute('maxlength'));
      const counter = document.createElement('div');
      counter.className = 'char-counter';
      ta.parentNode.insertBefore(counter, ta.nextSibling);
      ta._charCounter = counter;
      ta._charMax = max;
      ta.addEventListener('input', () => this.updateCharCounter(ta));
    });
    this.updateCharCounters();
  },

  updateCharCounter(ta) {
    const c = ta._charCounter;
    if (!c) return;
    const rem = ta._charMax - ta.value.length;
    c.textContent = `${ta.value.length} / ${ta._charMax}`;
    c.classList.toggle('warn', rem < ta._charMax * 0.1);
  },

  updateCharCounters() {
    document.querySelectorAll('textarea[maxlength]').forEach(ta => this.updateCharCounter(ta));
  },

  toggleErklaerungen() {
    const sf = document.getElementById('selSonstFoerd');
    const sfDetails = document.getElementById('sonstFoerdDetails');
    if (sf && sfDetails) sfDetails.style.display = sf.value.includes('anderweitig') ? '' : 'none';
    const fk = document.getElementById('chkFK');
    const fkDetails = document.getElementById('folgekostenDetails');
    if (fk && fkDetails) fkDetails.style.display = fk.checked ? '' : 'none';
  },

  syncInstitution() {
    const stSame = document.getElementById('stSameAsZe')?.checked;
    const zkSame = document.getElementById('zkSameAsZe')?.checked;
    const stFields = document.getElementById('stFields');
    const zkFields = document.getElementById('zkFields');
    if (stFields) stFields.style.display = stSame ? 'none' : '';
    if (zkFields) zkFields.style.display = zkSame ? 'none' : '';
  },

  // ---- profi-Online table (derived from contacts) ----
  updateProfiOnlineTable() {
    const tbody = document.getElementById('tbodyProfiOnline');
    const rows = [
      { role: 'Projektleitung', short: 'PL', nameFields: ['Vorname_PL', 'Name_PL'], emailField: 'Email_PL', zugangField: 'EmailHatZugang_PL' },
      { role: 'Admin. Ansprechperson', short: 'PA', nameFields: ['Vorname_PA', 'Name_PA'], emailField: 'Email_PA', zugangField: 'EmailHatZugang_PA' },
      { role: 'Bevollmächtigte/r', short: 'UZ', nameFields: ['Vorname_UZ', 'Name_UZ'], emailField: 'Email_UZ', zugangField: 'EmailHatZugang_UZ' },
    ];
    tbody.innerHTML = rows.map(r => {
      const name = `${this.getFieldValue(r.nameFields[0])} ${this.getFieldValue(r.nameFields[1])}`.trim() || '-';
      const email = this.getFieldValue(r.emailField) || '-';
      const zugang = this.getFieldValue(r.zugangField) === 'Ja' ? 'Ja' : 'Nein';
      return `<tr><td>${r.role}</td><td>${name}</td><td>${email}</td><td>${zugang}</td></tr>`;
    }).join('');
  },

  // ---- LocalStorage ----
  saveToStorage() {
    const data = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      const key = el.getAttribute('data-field');
      if (el.type === 'checkbox') data[key] = el.checked;
      else data[key] = el.value;
    });
    // Save UI-only checkboxes without data-field
    data._stSameAsZe = document.getElementById('stSameAsZe')?.checked ?? true;
    data._zkSameAsZe = document.getElementById('zkSameAsZe')?.checked ?? true;
    localStorage.setItem('eoFormData', JSON.stringify(data));
    FP.saveToStorage();
    this.showSaveStatus('Gespeichert');
  },

  loadFromStorage() {
    const raw = localStorage.getItem('eoFormData');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      Object.entries(data).forEach(([key, val]) => {
        const el = document.querySelector(`[data-field="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!val;
        else el.value = val || '';
      });
      // Restore UI-only checkboxes
      if (data._stSameAsZe !== undefined) {
        const cb = document.getElementById('stSameAsZe');
        if (cb) cb.checked = data._stSameAsZe;
      }
      if (data._zkSameAsZe !== undefined) {
        const cb = document.getElementById('zkSameAsZe');
        if (cb) cb.checked = data._zkSameAsZe;
      }
    } catch (e) { /* ignore corrupt data */ }
  },

  startAutoSave() {
    setInterval(() => this.saveToStorage(), 30000);
  },

  showSaveStatus(text, dirty) {
    const el = document.getElementById('saveStatus');
    if (dirty) {
      el.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${text}`;
      el.className = 'badge bg-danger align-self-center';
      el.style.cursor = 'pointer';
      el.title = 'Klicken zum Speichern';
      el.onclick = () => this.saveToStorage();
    } else {
      el.innerHTML = `<i class="bi bi-check-circle"></i> ${text}`;
      el.className = 'badge bg-light text-dark align-self-center';
      el.style.cursor = 'default';
      el.title = '';
      el.onclick = null;
    }
  },

  // ---- Number formatting ----
  // German euro: 1.234,56 €
  fmtEur(n) {
    return this.fmtNum(n) + ' \u20ac';
  },
  // German number: 1.234,56
  fmtNum(n) {
    const val = (Math.round(n * 100) / 100).toFixed(2);
    const [int, dec] = val.split('.');
    const intWithDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return intWithDots + ',' + dec;
  },
  // Shortcut used by finanzplan tables (euro display)
  fmt(n) {
    return this.fmtEur(n);
  },
  // Format as percentage: 12,34 %
  fmtPct(n) {
    return this.fmtNum(n) + ' %';
  },
  parseNum(s) {
    if (!s) return 0;
    // Handle German format: remove dots (thousands), replace comma with period
    let str = String(s).trim();
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(str) || 0;
  }
};

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => App.init());
if (typeof module !== 'undefined' && module.exports) module.exports = App;
