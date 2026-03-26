// ============================================================
// xml-import.js - Parse XFoerder XML and populate form
// ============================================================
'use strict';

const XmlImport = {
  NS: 'http://ip.kp.dlr.de/Xfoerder',

  importXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    if (doc.querySelector('parsererror')) {
      alert('XML-Datei konnte nicht gelesen werden (Parse-Fehler).');
      return;
    }

    this.importBasisdaten(doc);
    this.importInstitutionen(doc);
    this.importAnsprechpartner(doc);
    this.importFinanzplan(doc);
    this.importReiter1(doc);

    // Recalculate years and rebuild tables
    App.updateJahre();
    App.updateProfiOnlineTable();
    App.saveToStorage();

    // Snapshot baseline for diff view
    if (!Diff._suppressBaseline) {
      Diff.setBaseline(Diff.captureSnapshot());
    }
  },

  // --- Helper: get text content of an xf: element ---
  xfText(parent, name) {
    if (!parent) return '';
    const el = parent.getElementsByTagNameNS(this.NS, name)[0];
    return el ? (el.textContent || '') : '';
  },

  // --- Helper: get all elements by xf: name ---
  xfAll(parent, name) {
    if (!parent) return [];
    return Array.from(parent.getElementsByTagNameNS(this.NS, name));
  },

  // --- Helper: get first element by xf: name ---
  xfFirst(parent, name) {
    if (!parent) return null;
    return parent.getElementsByTagNameNS(this.NS, name)[0] || null;
  },

  // --- Set a form field value ---
  setField(name, value) {
    if (value !== '' && value !== undefined) {
      App.setFieldValue(name, value);
    }
  },

  // === Basisdaten ===
  importBasisdaten(doc) {
    // KerndatenFinanzplan
    const mkf = this.xfFirst(doc, 'Maske_KerndatenFinanzplan');
    if (mkf) {
      const ep = this.xfFirst(mkf, 'Einzelposition');
      if (ep) {
        ['Mandant','Foerdermassnahme','Foerderbereich','FoerdermassnahmeLang','FoerderbereichLang',
          'Formulartyp','Summarisches_Vorhaben','KennungAntragsverfahren','KennungAntragsverfahrenLang',
          'kng_neu_aufst_anschl','istAnschluss','Foerderkennzeichen_Anschlussauftrag',
          'Vorhaben_nicht_begonnen','Kennzeichen_Datenschutzerklaerung',
          'Antragsdatum','Antragsort'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
        // von/bis dates
        const von = this.xfText(ep, 'von');
        const bis = this.xfText(ep, 'bis');
        if (von) { const el = document.getElementById('projektVon'); if (el) { if (el._flatpickr) el._flatpickr.setDate(von, false); else el.value = von; } }
        if (bis) { const el = document.getElementById('projektBis'); if (el) { if (el._flatpickr) el._flatpickr.setDate(bis, false); else el.value = bis; } }
      }
    }

    // Vorhabenbeschreibung
    const mvb = this.xfFirst(doc, 'Maske_Vorhabenbeschreibung');
    if (mvb) {
      const ep = this.xfFirst(mvb, 'Einzelposition');
      if (ep) {
        ['Akronym','Thema','fremd_Thema','Beschreibung1','Beschreibung2','Ergebnisverwertung',
          'fremd_Beschreibung1','fremd_Beschreibung2'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // Zusatzinformationen_2
    const mz2 = this.xfFirst(doc, 'Maske_Zusatzinformationen_2');
    if (mz2) {
      const ep = this.xfFirst(mz2, 'Einzelposition');
      if (ep) {
        ['TF1','TF2','TF3','Zeitpunkt','TF4','TF5','TF6','TF7','TF8','TF9'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }
  },

  // === Institutionen ===
  importInstitutionen(doc) {
    // ZE
    const mze = this.xfFirst(doc, 'Maske_Institution_ZE');
    if (mze) {
      const ep = this.xfFirst(mze, 'Einzelposition');
      if (ep) {
        ['Name_ZE','Adresssuche_ZE','Strasse_ZE','PLZ_Strasse_ZE','Ort_Strasse_ZE','Land_ZE',
          'TelefonNr_ZE','FaxNr_ZE','E_Mail_Adresse_ZE','Web_Adresse_ZE','Postfach_ZE',
          'PLZ_Postfach_ZE','Ort_Postfach_ZE','PLZ_Grosskunde_ZE','Ort_Grosskunde_ZE',
          'Pruef_ID_Adresse_ZE','Pruef_ID_Name_ZE',
          'Rechtsform','oeffentlich_finanziert','Besserstellungsverbot','Buchfuehrung',
          'eigene_Pruefungseinrichtung','Anzahl_Auszubildende','Ausbildungsbetrieb',
          'Bezugsjahr','Vor_Umsatzsteuerabzugsberechtigt_JNT'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // UnternehmensVertraege
    const muv = this.xfFirst(doc, 'Maske_UnternehmensVertraege');
    if (muv) {
      const tp = this.xfFirst(muv, 'Tabellenposition');
      if (tp) {
        this.setField('VertragsArt_Unternehmen', this.xfText(tp, 'VertragsArt_Unternehmen'));
        this.setField('Vertragspartner_Unternehmen', this.xfText(tp, 'Vertragspartner_Unternehmen'));
      }
    }

    // ST
    const mst = this.xfFirst(doc, 'Maske_Institution_ST');
    if (mst) {
      const ep = this.xfFirst(mst, 'Einzelposition');
      if (ep) {
        const sameAsZe = this.xfText(ep, 'Institution_ST') === 'Ja';
        const cb = document.getElementById('stSameAsZe');
        if (cb) cb.checked = sameAsZe;
        ['Name_ST','Adresssuche_ST','Strasse_ST','PLZ_Strasse_ST','Ort_Strasse_ST','Land_ST',
          'TelefonNr_ST','FaxNr_ST','E_Mail_Adresse_ST','Web_Adresse_ST','Postfach_ST',
          'PLZ_Postfach_ST','Ort_Postfach_ST','PLZ_Grosskunde_ST','Ort_Grosskunde_ST',
          'Pruef_ID_Adresse_ST','Pruef_ID_Name_ST'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // GE
    const mge = this.xfFirst(doc, 'Maske_Institution_GE');
    if (mge) {
      const ep = this.xfFirst(mge, 'Einzelposition');
      if (ep) {
        ['Institution_GE','Name_GE','GeldinstitutLand','IBAN','BIC','Geldinstitut','Verbuchungsstelle'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // ZK
    const mzk = this.xfFirst(doc, 'Maske_Institution_ZK');
    if (mzk) {
      const ep = this.xfFirst(mzk, 'Einzelposition');
      if (ep) {
        const instZK = this.xfText(ep, 'Institution_ZK');
        const zkSame = instZK === 'Antragsteller';
        const cb = document.getElementById('zkSameAsZe');
        if (cb) cb.checked = zkSame;
        ['Institution_ZK','Name_ZK','Strasse_ZK','PLZ_Strasse_ZK','Ort_Strasse_ZK','Land_ZK',
          'Postfach_ZK','PLZ_Postfach_ZK','Ort_Postfach_ZK','PLZ_Grosskunde_ZK','Ort_Grosskunde_ZK',
          'Geschaeftszeichen_ZK','Pruef_ID_Adresse_ZK','Pruef_ID_Name_ZK'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // KO
    const mko = this.xfFirst(doc, 'Maske_Institution_KO');
    if (mko) {
      FP.kopiPartner = [];
      const tabPos = this.xfAll(mko, 'Tabellenposition');
      tabPos.forEach(tp => {
        FP.addKopiRow({
          name: this.xfText(tp, 'Name_KO'),
          plz: this.xfText(tp, 'PLZ_Strasse_KO'),
          ort: this.xfText(tp, 'Ort_Strasse_KO'),
          land: this.xfText(tp, 'Land_KO') || 'Deutschland',
          rolle: this.xfText(tp, 'Rolle') || 'Mitglied der Arbeitsgemeinschaft',
          fkz: this.xfText(tp, 'Foerderkennzeichen_KO')
        });
      });
    }
  },

  // === Ansprechpartner ===
  importAnsprechpartner(doc) {
    // PL
    const mpl = this.xfFirst(doc, 'Maske_Ansprechpartner_PL');
    if (mpl) {
      const ep = this.xfFirst(mpl, 'Einzelposition');
      if (ep) {
        ['akad_Grad_PL','Vorname_PL','Name_PL','Telefon_PL','Fax_PL','Email_PL','EmailHatZugang_PL'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // PA
    const mpa = this.xfFirst(doc, 'Maske_Ansprechpartner_PA');
    if (mpa) {
      const ep = this.xfFirst(mpa, 'Einzelposition');
      if (ep) {
        this.setField('kopiere_in_PA', this.xfText(ep, 'kopiere_in_PA'));
        ['akad_Grad_PA','Vorname_PA','Name_PA','Telefon_PA','Fax_PA','Email_PA','EmailHatZugang_PA'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
        // Secondary contact A2
        ['akad_Grad_A2','Vorname_A2','Name_A2','Telefon_A2','Fax_A2','Email_A2'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }

    // UZ
    const muz = this.xfFirst(doc, 'Maske_Ansprechpartner_UZ');
    if (muz) {
      const ep = this.xfFirst(muz, 'Einzelposition');
      if (ep) {
        this.setField('kopiere_in_UZ', this.xfText(ep, 'kopiere_in_UZ'));
        ['akad_Grad_UZ','Vorname_UZ','Name_UZ','Telefon_UZ','Fax_UZ','Email_UZ','EmailHatZugang_UZ'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
        // Secondary signatory Z2
        ['akad_Grad_Z2','Vorname_Z2','Name_Z2','Telefon_Z2','Fax_Z2','Email_Z2'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
      }
    }
  },

  // === Finanzplan ===
  importFinanzplan(doc) {
    // First ensure years are set from the dates
    App.updateJahre();
    const jahre = App.jahre;

    // Clear existing data
    FP.personal = { tarif1: [], tarif2: [], tarif3: [] };
    FP.sonstigeEntgelte = [];
    FP.sach = {};
    FP.auftrag = [];
    FP.reisen = { Inlandreisen: [], Auslandreisen: [] };
    FP.invest = [];
    FP.finanz = { mittelDritter: {}, eigenmittel: {} };
    FP.mittelDritterRows = [];
    FP.rpfBegruendung = { tarif1: '', tarif2: '', tarif3: '', SonstigeEntgelte: '',
      Gegenstaende: '', Mieten: '', Rechner: '', Auftrag: '', Verbrauchsmaterial: '',
      Geschaeftsbedarf: '', Literatur: '', ZusatzMaterial1: '', ZusatzMaterial2: '',
      Inlandreisen: '', Auslandreisen: '', GesamteInvestitionen: '' };

    // Personnel
    this.importTarif(doc, 'Maske_Tarif_1', 'tarif1', jahre);
    this.importTarif(doc, 'Maske_Tarif_2', 'tarif2', jahre);
    this.importTarif(doc, 'Maske_Tarif_3', 'tarif3', jahre);

    // SonstigeEntgelte
    this.importSonstigeEntgelte(doc, jahre);

    // Sachmittel - material sections with Tabellenposition (year=TabID)
    ['Verbrauchsmaterial','Geschaeftsbedarf','Literatur','ZusatzMaterial1','ZusatzMaterial2'].forEach(sec => {
      this.importSachMaterial(doc, `Maske_${sec}`, sec, jahre);
    });

    // Sachmittel - sections with only Einzelposition/Zwischensumme
    ['Gegenstaende','Mieten','Rechner'].forEach(sec => {
      this.importSachSimple(doc, `Maske_${sec}`, sec, jahre);
    });

    // Auftrag (contractors) with detail fields
    this.importAuftrag(doc, jahre);

    // Reisen (Inlandreisen/Auslandreisen) with Tabellenposition rows
    this.importReisen(doc, 'Maske_Inlandreisen', 'Inlandreisen', jahre);
    this.importReisen(doc, 'Maske_Auslandreisen', 'Auslandreisen', jahre);

    // GesamteInvestitionen with multi-row Tabellenposition
    this.importInvest(doc, jahre);

    // Finanzierung
    this.importFinanzierung(doc, jahre);

    // Rebuild tables
    FP.rebuildAllTables();
    FP.saveToStorage();
  },

  importTarif(doc, maskeName, tarifKey, jahre) {
    const maske = this.xfFirst(doc, maskeName);
    if (!maske) return;

    const isTarif3 = (tarifKey === 'tarif3');

    // Collect Tabellenposition entries grouped by TabID (row number)
    const tabPos = this.xfAll(maske, 'Tabellenposition');
    const rowMap = {}; // tabID -> { meta, entries: { jahr: {...} } }

    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      const tabId = tp.getAttribute('xf:TabID');
      if (!tabId) return;

      if (!rowMap[tabId]) {
        rowMap[tabId] = {
          bezeichnung: this.xfText(tp, 'Bezeichnung'),
          nn: isTarif3 ? 'Nein' : (this.xfText(tp, 'N_N_Personal') || 'Nein'),
          tarifgruppe: isTarif3 ? '' : this.xfText(tp, 'Tarifgruppe'),
          artikelArt: isTarif3 ? this.xfText(tp, 'ArtikelArt') : '',
          vollzeit: App.parseNum(this.xfText(tp, 'Wochenarbeitszeit_Vollzeit')) || 40,
          stunden: App.parseNum(this.xfText(tp, 'Wochenarbeitsstunden')) || 40,
          entries: {}
        };
      }

      // Update stunden from the latest non-zero value (may vary by year)
      const stunden = App.parseNum(this.xfText(tp, 'Wochenarbeitsstunden'));
      if (stunden > 0) rowMap[tabId].stunden = stunden;

      if (isTarif3) {
        // Tarif_3: PreisProEinheit directly, no separate Basispreis/Zuschlag
        const ppu = App.parseNum(this.xfText(tp, 'PreisProEinheit'));
        rowMap[tabId].entries[jahr] = {
          basis: ppu,
          zuschlag: 0,
          anzahl: App.parseNum(this.xfText(tp, 'Anzahl'))
        };
      } else {
        rowMap[tabId].entries[jahr] = {
          basis: App.parseNum(this.xfText(tp, 'Basispreis')),
          zuschlag: App.parseNum(this.xfText(tp, 'Zuschlag')),
          anzahl: App.parseNum(this.xfText(tp, 'Anzahl'))
        };
      }
    });

    // Create rows sorted by TabID
    const sortedIds = Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b));
    sortedIds.forEach(tabId => {
      const data = rowMap[tabId];
      FP.addPersonRow(tarifKey, data);
    });

    // Import rpf_Begruendung from Einzelposition
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung[tarifKey] = rpf;
    }
  },

  importSonstigeEntgelte(doc, jahre) {
    const maske = this.xfFirst(doc, 'Maske_SonstigeEntgelte');
    if (!maske) return;

    const tabPos = this.xfAll(maske, 'Tabellenposition');
    const rowMap = {};
    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      const tabId = tp.getAttribute('xf:TabID');
      if (!tabId) return;
      if (!rowMap[tabId]) {
        rowMap[tabId] = { bezeichnung: this.xfText(tp, 'Bezeichnung'), entries: {} };
      }
      rowMap[tabId].entries[jahr] = App.parseNum(this.xfText(tp, 'BetragSumme'));
    });

    Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(tabId => {
      const data = rowMap[tabId];
      jahre.forEach(j => { if (data.entries[j] === undefined) data.entries[j] = 0; });
      FP.addSonstigeEntgelteRow(data);
    });

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung.SonstigeEntgelte = rpf;
    }
  },

  importSachMaterial(doc, maskeName, section, jahre) {
    const maske = this.xfFirst(doc, maskeName);
    if (!maske) return;

    // Check for Bezeichnung in Tabellenposition (ZusatzMaterial1/2)
    const tabPos = this.xfAll(maske, 'Tabellenposition');
    if (tabPos.length > 0) {
      const firstBez = this.xfText(tabPos[0], 'Bezeichnung');
      if (firstBez && (section === 'ZusatzMaterial1' || section === 'ZusatzMaterial2')) {
        App.setFieldValue(`Bezeichnung_${section}`, firstBez);
      }
    }

    const hasData = tabPos.some(tp => App.parseNum(this.xfText(tp, 'BetragSumme')) !== 0);

    if (!hasData && tabPos.length === 0) return;

    // Create a single row with entries from each year
    const entries = {};
    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      if (jahr) {
        entries[jahr] = App.parseNum(this.xfText(tp, 'BetragSumme'));
      }
    });

    // Ensure all years are present
    jahre.forEach(j => { if (entries[j] === undefined) entries[j] = 0; });

    if (!FP.sach[section]) FP.sach[section] = [];
    FP.sach[section].push({
      id: FP.genId(),
      bezeichnung: section,
      entries: entries
    });

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung[section] = rpf;
    }
  },

  importSachSimple(doc, maskeName, section, jahre) {
    const maske = this.xfFirst(doc, maskeName);
    if (!maske) return;

    // These sections use Zwischensumme for yearly totals
    // Check if there are any Tabellenposition entries first
    const tabPos = this.xfAll(maske, 'Tabellenposition');
    if (tabPos.length > 0) {
      // Has Tabellenposition - import per-row entries
      const rowMap = {};
      tabPos.forEach(tp => {
        const jahr = tp.getAttribute('xf:Jahr');
        const tabId = tp.getAttribute('xf:TabID');
        if (!tabId) return;
        if (!rowMap[tabId]) {
          rowMap[tabId] = {
            bezeichnung: this.xfText(tp, 'Bezeichnung') || section,
            entries: {}
          };
        }
        rowMap[tabId].entries[jahr] = App.parseNum(this.xfText(tp, 'BetragSumme'));
      });

      if (!FP.sach[section]) FP.sach[section] = [];
      Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(tabId => {
        const data = rowMap[tabId];
        jahre.forEach(j => { if (data.entries[j] === undefined) data.entries[j] = 0; });
        FP.sach[section].push({
          id: FP.genId(),
          bezeichnung: data.bezeichnung,
          entries: data.entries
        });
      });
    } else {

    // Fall back to Zwischensumme
    const zwi = this.xfAll(maske, 'Zwischensumme');
    const entries = {};
    let hasAny = false;
    zwi.forEach(z => {
      const jahr = z.getAttribute('xf:Jahr');
      if (jahr && jahr !== 'Gesamt') {
        const val = App.parseNum(this.xfText(z, 'BetragSumme'));
        entries[jahr] = val;
        if (val !== 0) hasAny = true;
      }
    });

    if (hasAny) {
      jahre.forEach(j => { if (entries[j] === undefined) entries[j] = 0; });
      if (!FP.sach[section]) FP.sach[section] = [];
      FP.sach[section].push({
        id: FP.genId(),
        bezeichnung: section,
        entries: entries
      });
    }
    } // end else (Zwischensumme fallback)

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung[section] = rpf;
    }
  },

  importAuftrag(doc, jahre) {
    const maske = this.xfFirst(doc, 'Maske_Auftrag');
    if (!maske) return;

    FP.auftrag = [];
    const tabPos = this.xfAll(maske, 'Tabellenposition');
    const rowMap = {};
    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      const tabId = tp.getAttribute('xf:TabID');
      if (!tabId) return;
      if (!rowMap[tabId]) {
        rowMap[tabId] = {
          bezeichnung: this.xfText(tp, 'Bezeichnung_AU') || this.xfText(tp, 'Bezeichnung'),
          istBekannt: this.xfText(tp, 'IstBekannt') || 'Ja',
          nameAU: this.xfText(tp, 'Name_AU'),
          landAU: this.xfText(tp, 'Land_AU') || 'Deutschland',
          plzAU: this.xfText(tp, 'PLZ_Strasse_AU'),
          ortAU: this.xfText(tp, 'Ort_Strasse_AU'),
          entries: {}
        };
      }
      rowMap[tabId].entries[jahr] = App.parseNum(this.xfText(tp, 'BetragSumme'));
    });

    Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(tabId => {
      const data = rowMap[tabId];
      jahre.forEach(j => { if (data.entries[j] === undefined) data.entries[j] = 0; });
      FP.addAuftragRow(data);
    });

    // Fall back to Zwischensumme if no Tabellenposition (legacy data)
    if (tabPos.length === 0) {
      const zwi = this.xfAll(maske, 'Zwischensumme');
      const entries = {};
      let hasAny = false;
      zwi.forEach(z => {
        const jahr = z.getAttribute('xf:Jahr');
        if (jahr && jahr !== 'Gesamt') {
          const val = App.parseNum(this.xfText(z, 'BetragSumme'));
          entries[jahr] = val;
          if (val !== 0) hasAny = true;
        }
      });
      if (hasAny) {
        jahre.forEach(j => { if (entries[j] === undefined) entries[j] = 0; });
        FP.addAuftragRow({ bezeichnung: 'Auftrag', entries });
      }
    }

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung.Auftrag = rpf;
    }
  },

  importReisen(doc, maskeName, section, jahre) {
    const maske = this.xfFirst(doc, maskeName);
    if (!maske) return;

    FP.reisen[section] = {};

    const tabPos = this.xfAll(maske, 'Tabellenposition');
    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      if (!jahr || jahr === 'Gesamt') return;

      const betrag = App.parseNum(this.xfText(tp, 'BetragSumme'));
      FP.addReisenRow(section, jahr, {
        reiseziel: this.xfText(tp, 'Reiseziel'),
        reisezweck: this.xfText(tp, 'Reisezweck'),
        reisedauer: App.parseNum(this.xfText(tp, 'Reisedauer')) || 1,
        betrag: betrag
      });
    });

    // If no Tabellenposition, fall back to Zwischensumme
    if (tabPos.length === 0) {
      const zwi = this.xfAll(maske, 'Zwischensumme');
      zwi.forEach(z => {
        const jahr = z.getAttribute('xf:Jahr');
        if (jahr && jahr !== 'Gesamt') {
          const val = App.parseNum(this.xfText(z, 'BetragSumme'));
          if (val !== 0) {
            FP.addReisenRow(section, jahr, { reiseziel: '', reisezweck: '', reisedauer: 1, betrag: val });
          }
        }
      });
    }

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung[section] = rpf;
    }
  },

  importInvest(doc, jahre) {
    const maske = this.xfFirst(doc, 'Maske_GesamteInvestitionen');
    if (!maske) return;

    const tabPos = this.xfAll(maske, 'Tabellenposition');
    const rowMap = {}; // tabID -> { bezeichnung, entries: { jahr: { preis, anzahl } } }

    tabPos.forEach(tp => {
      const jahr = tp.getAttribute('xf:Jahr');
      const tabId = tp.getAttribute('xf:TabID');
      if (!tabId) return;

      if (!rowMap[tabId]) {
        rowMap[tabId] = {
          bezeichnung: this.xfText(tp, 'Bezeichnung'),
          entries: {}
        };
      }
      rowMap[tabId].entries[jahr] = {
        preis: App.parseNum(this.xfText(tp, 'PreisProEinheit')),
        anzahl: App.parseNum(this.xfText(tp, 'Anzahl'))
      };
    });

    const sortedIds = Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b));
    sortedIds.forEach(tabId => {
      const data = rowMap[tabId];
      jahre.forEach(j => { if (!data.entries[j]) data.entries[j] = { preis: 0, anzahl: 0 }; });
      FP.addInvestRow(data);
    });

    // If no Tabellenposition, fall back to Zwischensumme
    if (tabPos.length === 0) {
      const zwi = this.xfAll(maske, 'Zwischensumme');
      const entries = {};
      let hasAny = false;
      zwi.forEach(z => {
        const jahr = z.getAttribute('xf:Jahr');
        if (jahr && jahr !== 'Gesamt') {
          const val = App.parseNum(this.xfText(z, 'BetragSumme'));
          entries[jahr] = { preis: val, anzahl: val > 0 ? 1 : 0 };
          if (val !== 0) hasAny = true;
        }
      });
      if (hasAny) {
        jahre.forEach(j => { if (!entries[j]) entries[j] = { preis: 0, anzahl: 0 }; });
        FP.addInvestRow({ bezeichnung: 'Investitionen', entries });
      }
    }

    // Import rpf_Begruendung
    const ep = this.xfFirst(maske, 'Einzelposition');
    if (ep) {
      const rpf = this.xfText(ep, 'rpf_Begruendung');
      if (rpf) FP.rpfBegruendung.GesamteInvestitionen = rpf;
    }
  },

  importFinanzierung(doc, jahre) {
    // MittelDritter - import rows
    const mmd = this.xfFirst(doc, 'Maske_MittelDritter');
    if (mmd) {
      const tabPos = this.xfAll(mmd, 'Tabellenposition');
      if (tabPos.length > 0) {
        // Import MittelDritter as row-based table
        const rowMap = {};
        tabPos.forEach(tp => {
          const jahr = tp.getAttribute('xf:Jahr');
          const tabId = tp.getAttribute('xf:TabID');
          if (!tabId) return;
          if (!rowMap[tabId]) {
            rowMap[tabId] = {
              bezeichnung: this.xfText(tp, 'Bezeichnung'),
              grund: this.xfText(tp, 'Grund'),
              entries: {}
            };
          }
          rowMap[tabId].entries[jahr] = App.parseNum(this.xfText(tp, 'FinanzierungSumme'));
        });
        Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(tabId => {
          const data = rowMap[tabId];
          jahre.forEach(j => { if (data.entries[j] === undefined) data.entries[j] = 0; });
          FP.addMittelDritterRow(data);
        });
      } else {
        // Fall back to Zwischensumme-based import
        const zwi = this.xfAll(mmd, 'Zwischensumme');
        const entries = {};
        let hasAny = false;
        zwi.forEach(z => {
          const jahr = z.getAttribute('xf:Jahr');
          if (jahr && jahr !== 'Gesamt') {
            const val = App.parseNum(this.xfText(z, 'FinanzierungSumme'));
            entries[jahr] = val;
            if (val !== 0) hasAny = true;
          }
        });
        if (hasAny) {
          // Create a single row with all yearly values
          jahre.forEach(j => { if (entries[j] === undefined) entries[j] = 0; });
          FP.addMittelDritterRow({ bezeichnung: 'Mittel Dritter', grund: '', entries });
        }
      }
      // Sync totals into finanz.mittelDritter
      jahre.forEach(j => {
        FP.finanz.mittelDritter[j] = FP.yearSubtotalMittelDritter(j);
      });
    }

    // Eigenmittel from Eigenmittel_Zuwendung Tabellenposition
    const mez = this.xfFirst(doc, 'Maske_Eigenmittel_Zuwendung');
    if (mez) {
      const tabPos = this.xfAll(mez, 'Tabellenposition');
      tabPos.forEach(tp => {
        const jahr = tp.getAttribute('xf:Jahr');
        if (jahr) {
          FP.finanz.eigenmittel[jahr] = App.parseNum(this.xfText(tp, 'Eigenmittel'));
        }
      });

      // ProjektPauschaleSatz
      const firstTP = tabPos[0];
      if (firstTP) {
        const ppSatz = this.xfText(firstTP, 'ProjektPauschaleSatz');
        if (ppSatz) {
          const ppEl = document.getElementById('ppSatz');
          if (ppEl) ppEl.value = ppSatz;
        }
      }

      // Strategie_EP from Einzelposition
      const ep = this.xfFirst(mez, 'Einzelposition');
      if (ep) {
        const strat = this.xfText(ep, 'Strategie_EP');
        if (strat) this.setField('Strategie_EP', strat);
        const stratWaehlbar = this.xfText(ep, 'Strategie_waehlbar');
        const chk = document.getElementById('chkStrategieWaehlbar');
        if (chk) chk.checked = (stratWaehlbar === 'Ja');
      }
    }
  },

  // === Reiter1 (Erklaerungen, Zusatzinfo) ===
  importReiter1(doc) {
    // Erklaerungen
    const mek = this.xfFirst(doc, 'Maske_Erklaerungen');
    if (mek) {
      const ep = this.xfFirst(mek, 'Einzelposition');
      if (ep) {
        ['Vorhabenbeschreibung','Balkenplan','Strukturplan','Netzplan','Vorkalkulationsdaten',
          'Geraeteliste','Bonitaetsnachweis','Zeichnungen','Mitfinanzierung','Eigenmittel_vorhanden',
          'Personal_investition','GeguInvest','Sonstige_Foerderung',
          'Traeger_sonstige_Foerderung','sonstige_Foerderung_Betrag',
          'Folgekosten','Folgekosten_Betrag','Folgekosten_Beschreibung',
          'wirtschaftlichen_Bereich_J_N_N','Grundfinanzierung','Einvernehmen_mit_Landesressort',
          'subventionserheblicheTatsachen','Einverstaendnis_Vollstaendigkeit'].forEach(f => {
          this.setField(f, this.xfText(ep, f));
        });
        App.toggleErklaerungen();
      }
    }

    // Zusatzinformationen_1
    const mz1 = this.xfFirst(doc, 'Maske_Zusatzinformationen_1');
    if (mz1) {
      const ep = this.xfFirst(mz1, 'Einzelposition');
      if (ep) {
        this.setField('KMU_Status', this.xfText(ep, 'KMU_Status'));
        this.setField('KeinUnternehmen', this.xfText(ep, 'KeinUnternehmen'));
        this.setField('Doktoranden', this.xfText(ep, 'Doktoranden'));
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = XmlImport;
