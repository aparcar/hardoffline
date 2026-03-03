// ============================================================
// xml-export.js - Generate XFoerder-compatible XML
// ============================================================
'use strict';

const XmlExport = {
  XF: 'http://ip.kp.dlr.de/Xfoerder',
  XHTML: 'http://www.w3.org/1999/xhtml',
  SPEZ: 'http://ip.kp.dlr.de/Xfoerder/Spezifikation',
  XSI: 'http://www.w3.org/2001/XMLSchema-instance',

  doc: null,    // XMLDocument, set during buildDocument()
  domImpl: null, // injectable DOMImplementation for testing

  // ============== DOM builder infrastructure ==============

  // Create a namespaced DOM element. Args can be:
  //   string/number  -> text content (empty string = no text node)
  //   plain object (no .nodeType) -> xf:-prefixed attributes
  //   Element (nodeType === 1) -> child
  //   array -> flattened as children
  //   null/undefined -> skipped
  xf(tag, ...args) {
    const el = this.doc.createElementNS(this.XF, 'xf:' + tag);
    for (const arg of args) {
      if (arg == null) continue;
      if (Array.isArray(arg)) {
        for (const item of arg) {
          if (item != null && item.nodeType === 1) el.appendChild(item);
        }
      } else if (typeof arg === 'object' && arg.nodeType === 1) {
        el.appendChild(arg);
      } else if (typeof arg === 'object' && !arg.nodeType) {
        for (const [k, v] of Object.entries(arg)) {
          el.setAttributeNS(this.XF, 'xf:' + k, String(v));
        }
      } else {
        const text = String(arg);
        if (text) el.appendChild(this.doc.createTextNode(text));
      }
    }
    return el;
  },

  // Node from a form field value (or override)
  xfField(name, override) {
    const val = override !== undefined ? override : App.getFieldValue(name);
    return this.xf(name, String(val || ''));
  },

  // Batch: array of xfField nodes
  xfFields(...names) {
    return names.map(n => this.xfField(n));
  },

  // Serialize a DOM element to an indented XML string
  serialize(el, indent) {
    indent = indent || 0;
    const pad = '  '.repeat(indent);
    const tag = el.tagName;

    // Build attribute string, skip xmlns declarations
    let attrStr = '';
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.name.startsWith('xmlns')) continue;
        attrStr += ` ${a.name}="${this.esc(a.value)}"`;
      }
    }

    // Self-closing: no child nodes
    if (!el.hasChildNodes()) {
      return `${pad}<${tag}${attrStr} />\n`;
    }

    // Text-only: single text child
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      return `${pad}<${tag}${attrStr}>${this.esc(el.childNodes[0].nodeValue)}</${tag}>\n`;
    }

    // Element with children
    let out = `${pad}<${tag}${attrStr}>\n`;
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 1) {
        out += this.serialize(el.childNodes[i], indent + 1);
      }
    }
    out += `${pad}</${tag}>\n`;
    return out;
  },

  // ============== Export entry point ==============

  exportXml() {
    const xml = this.buildXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const akronym = App.getFieldValue('Akronym') || 'antrag';
    a.href = url;
    a.download = `${akronym}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    App.showSaveStatus('XML exportiert');
  },

  buildXml() {
    this.buildDocument();
    const root = this.doc.documentElement;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<xf:Feldgruppe_Formular xmlns:xf="${this.XF}" xmlns="${this.XHTML}" xmlns:spez="${this.SPEZ}" xmlns:xsi="${this.XSI}">\n`;
    for (let i = 0; i < root.childNodes.length; i++) {
      if (root.childNodes[i].nodeType === 1) {
        xml += this.serialize(root.childNodes[i], 1);
      }
    }
    xml += '</xf:Feldgruppe_Formular>\n';
    return xml;
  },

  buildDocument() {
    const impl = this.domImpl || document.implementation;
    this.doc = impl.createDocument(this.XF, 'xf:Feldgruppe_Formular', null);
    const root = this.doc.documentElement;

    const jahre = App.jahre;
    const von = App.getFieldValue('von') || '';
    const bis = App.getFieldValue('bis') || '';
    const vonJahr = jahre[0] || '';
    const bisJahr = jahre[jahre.length - 1] || '';

    root.appendChild(this.buildEigenschaften());
    root.appendChild(this.buildBasisdaten(von, bis, vonJahr, bisJahr));
    root.appendChild(this.buildInstitutionen());
    root.appendChild(this.buildAnsprechpartner());
    root.appendChild(this.buildFinanzplan(jahre, von, bis));
    root.appendChild(this.buildReiter1(jahre));

    return this.doc;
  },

  // ============== Eigenschaften ==============

  buildEigenschaften() {
    return this.xf('Feldgruppe_Eigenschaften',
      this.xf('Maske_Eigenschaften',
        this.xf('Einzelposition',
          this.xf('Antragsteller', 'Standard'),
          this.xf('Haftungsausschluss', 'Die Inhalte dieses Dokuments werden mit größtmöglicher Sorgfalt recherchiert und implementiert. Fehler im Bearbeitungsvorgang sind dennoch nicht auszuschließen. Hinweise und Korrekturen senden Sie bitte an eine der unten aufgeführten Adressen von DLR-IP. Eine Haftung für die Richtigkeit, Vollstandigkeit und Aktualitat kann trotz sorgfaltiger Prüfung nicht übernommen werden. DLR-IP übernimmt insbesondere keinerlei Haftung für eventuelle Schaden oder Konsequenzen, die durch die direkte oder indirekte Nutzung der angebotenen Inhalte entstehen. Dieses Dokument ist ein technisches Hilfsmittel in der Formularerstellung. Es hat keine Relevanz im rechtlichen Sinne.'),
          this.xf('Hinweise', 'BITTE NICHT MANUELL BEARBEITEN! Dieses Formular wird elektronisch geprüft und verarbeitet. Eine manuelle Bearbeitung wird mit hoher Wahrscheinlichkeit dazu führen, a) dass das Dokument ungültig wird und nicht verarbeitet, insbesondere nicht eingereicht werden kann, oder b) dass manuelle Änderungen beim Einlesen überschrieben werden und unerwartete Ergebnisse verursachen.'),
          this.xf('IstAnhangPflicht', 'Ja'),
          this.xfField('Vorlage', App.getFieldValue('Vorlage') || 'AZA'),
          this.xf('XSD_Version', '3.15.0'),
          this.xf('easyOnlineKennung', 'ENTWURF'),
          this.xf('easyOnlineVersion_aktuell', 'easy-Online 3.4.3.0'),
          this.xf('easyOnlineVersion', 'easy-Online 3.4.3.0'),
          this.xf('letzte_Benutzung', new Date().toISOString().substring(0, 10)),
          this.xf('AnhangErlaubt', 'Ja')
        )
      )
    );
  },

  // ============== Basisdaten ==============

  buildBasisdaten(von, bis, vonJahr, bisJahr) {
    return this.xf('Feldgruppe_Basisdaten',
      // KerndatenFinanzplan
      this.xf('Feldgruppe_KerndatenFinanzplan',
        this.xf('Maske_KerndatenFinanzplan',
          this.xf('Einzelposition',
            ...this.xfFields('Mandant', 'Foerdermassnahme', 'Foerderbereich',
              'FoerdermassnahmeLang', 'FoerderbereichLang', 'Formulartyp'),
            this.xfField('Summarisches_Vorhaben', App.getFieldValue('Summarisches_Vorhaben') || 'Nein'),
            this.xfField('KennungAntragsverfahren', App.getFieldValue('KennungAntragsverfahren') || 'N'),
            this.xfField('KennungAntragsverfahrenLang', App.getFieldValue('KennungAntragsverfahrenLang') || 'Einfacher Antrag'),
            ...this.xfFields('kng_neu_aufst_anschl', 'istAnschluss', 'Foerderkennzeichen_Anschlussauftrag'),
            this.xf('von', von),
            this.xf('bis', bis),
            this.xf('von_Jahr', vonJahr),
            this.xf('bis_Jahr', bisJahr),
            this.xf('Waehrung', 'EUR'),
            ...this.xfFields('Vorhaben_nicht_begonnen', 'Kennzeichen_Datenschutzerklaerung',
              'Antragsdatum', 'Antragsort')
          )
        )
      ),
      // Vorhabenbeschreibung
      this.xf('Feldgruppe_Vorhabenbeschreibung',
        this.xf('Maske_Vorhabenbeschreibung',
          this.xf('Einzelposition',
            this.xfField('Akronym'),
            this.xfField('Thema'),
            this.xfField('fremd_Thema'),
            this.xfField('Beschreibung1'),
            this.xfField('Beschreibung2'),
            this.xfField('Ergebnisverwertung'),
            this.xfField('fremd_Beschreibung1'),
            this.xfField('fremd_Beschreibung2'),
            this.xf('Schreibschutz', 'Standard')
          )
        )
      ),
      // Zusatzinformationen_2 (Verwertungsplan)
      this.xf('Feldgruppe_Zusatzinformationen_2',
        this.xf('Maske_Zusatzinformationen_2',
          this.xf('Einzelposition',
            ...['TF1','TF2','TF3','Zeitpunkt','TF4','TF5','TF6','TF7','TF8','TF9'].map(f => this.xfField(f))
          )
        )
      )
    );
  },

  // ============== Institutionen ==============

  buildInstitutionen() {
    const stSameAsZe = document.getElementById('stSameAsZe')?.checked;
    const zkSameAsZe = document.getElementById('zkSameAsZe')?.checked;

    return this.xf('Feldgruppe_Institutionen',
      // ZE + UnternehmensVertraege
      this.xf('Feldgruppe_InstitutionVertraege_ZE',
        this.xf('Feldgruppe_Institution_ZE',
          this.xf('Maske_Institution_ZE',
            this.xf('Einzelposition',
              ...this.xfFields(
                'Name_ZE','Adresssuche_ZE','Strasse_ZE','PLZ_Strasse_ZE','Ort_Strasse_ZE','Land_ZE',
                'TelefonNr_ZE','FaxNr_ZE','E_Mail_Adresse_ZE','Web_Adresse_ZE','Postfach_ZE','PLZ_Postfach_ZE',
                'Ort_Postfach_ZE','PLZ_Grosskunde_ZE','Ort_Grosskunde_ZE',
                'Pruef_ID_Adresse_ZE','Pruef_ID_Name_ZE','Rechtsform','oeffentlich_finanziert',
                'Besserstellungsverbot','Buchfuehrung','eigene_Pruefungseinrichtung','Anzahl_Auszubildende',
                'Ausbildungsbetrieb','Bezugsjahr','Vor_Umsatzsteuerabzugsberechtigt_JNT'),
              this.xf('Schreibschutz', 'Standard')
            )
          )
        ),
        this.buildUnternehmensVertraege()
      ),
      // ST
      this.xf('Feldgruppe_Institution_ST',
        this.xf('Maske_Institution_ST',
          this.xf('Einzelposition',
            this.xf('Institution_ST', stSameAsZe ? 'Ja' : 'Nein'),
            ...(stSameAsZe ? this.stFieldsFromZE() : this.xfFields(
              'Name_ST','Adresssuche_ST','Strasse_ST','PLZ_Strasse_ST','Ort_Strasse_ST','Land_ST',
              'TelefonNr_ST','FaxNr_ST','E_Mail_Adresse_ST','Web_Adresse_ST','Postfach_ST',
              'PLZ_Postfach_ST','Ort_Postfach_ST','PLZ_Grosskunde_ST','Ort_Grosskunde_ST',
              'Pruef_ID_Adresse_ST','Pruef_ID_Name_ST')),
            this.xf('Schreibschutz', 'Standard')
          )
        )
      ),
      // GE
      this.xf('Feldgruppe_Institution_GE',
        this.xf('Maske_Institution_GE',
          this.xf('Einzelposition',
            ...this.xfFields('Institution_GE','Name_GE','GeldinstitutLand','IBAN','BIC','Geldinstitut','Verbuchungsstelle'),
            this.xf('Schreibschutz', 'Standard')
          )
        )
      ),
      // ZK
      this.xf('Feldgruppe_Institution_ZK',
        this.xf('Maske_Institution_ZK',
          this.xf('Einzelposition',
            ...(zkSameAsZe ? this.zkFieldsFromZE() : this.zkFieldsDirect()),
            this.xf('Schreibschutz', 'Standard')
          )
        )
      ),
      // KO
      this.buildKopiPartner(),
      // AU (empty)
      this.xf('Feldgruppe_Institution_AU', this.xf('Maske_Institution_AU'))
    );
  },

  buildUnternehmensVertraege() {
    const va = App.getFieldValue('VertragsArt_Unternehmen');
    const vp = App.getFieldValue('Vertragspartner_Unternehmen');
    if (va || vp) {
      return this.xf('Feldgruppe_UnternehmensVertraege',
        this.xf('Maske_UnternehmensVertraege',
          this.xf('Tabellenposition', { TabID: '1' },
            this.xf('ZeileNr', '1'),
            this.xf('VertragsArt_Unternehmen', va || ''),
            this.xf('Vertragspartner_Unternehmen', vp || '')
          )
        )
      );
    }
    return this.xf('Feldgruppe_UnternehmensVertraege', this.xf('Maske_UnternehmensVertraege'));
  },

  buildKopiPartner() {
    const rows = FP.kopiPartner || [];
    if (rows.length === 0) {
      return this.xf('Feldgruppe_Institution_KO', this.xf('Maske_Institution_KO'));
    }
    const tabPositions = rows.map((row, idx) => {
      const nr = idx + 1;
      return this.xf('Tabellenposition', { TabID: nr },
        this.xf('ZeileNr', nr),
        this.xf('Name_KO', row.name || ''),
        this.xf('PLZ_Strasse_KO', row.plz || ''),
        this.xf('Ort_Strasse_KO', row.ort || ''),
        this.xf('Land_KO', row.land || ''),
        this.xf('Rolle', row.rolle || '')
      );
    });
    return this.xf('Feldgruppe_Institution_KO',
      this.xf('Maske_Institution_KO', ...tabPositions)
    );
  },

  // ST fields copied from ZE
  stFieldsFromZE() {
    const map = {
      'Name_ST': 'Name_ZE', 'Adresssuche_ST': 'Adresssuche_ZE',
      'Strasse_ST': 'Strasse_ZE', 'PLZ_Strasse_ST': 'PLZ_Strasse_ZE',
      'Ort_Strasse_ST': 'Ort_Strasse_ZE', 'Land_ST': 'Land_ZE',
      'TelefonNr_ST': 'TelefonNr_ZE', 'FaxNr_ST': 'FaxNr_ZE',
      'E_Mail_Adresse_ST': 'E_Mail_Adresse_ZE', 'Web_Adresse_ST': 'Web_Adresse_ZE',
      'Postfach_ST': 'Postfach_ZE', 'PLZ_Postfach_ST': 'PLZ_Postfach_ZE',
      'Ort_Postfach_ST': 'Ort_Postfach_ZE', 'PLZ_Grosskunde_ST': 'PLZ_Grosskunde_ZE',
      'Ort_Grosskunde_ST': 'Ort_Grosskunde_ZE', 'Pruef_ID_Adresse_ST': 'Pruef_ID_Adresse_ZE',
      'Pruef_ID_Name_ST': 'Pruef_ID_Name_ZE'
    };
    // Use Adresssuche_ZE value, default to 'Ja' if empty
    const adressSuche = App.getFieldValue('Adresssuche_ZE') || 'Ja';
    return Object.entries(map).map(([stF, zeF]) =>
      this.xfField(stF, stF === 'Adresssuche_ST' ? adressSuche : App.getFieldValue(zeF))
    );
  },

  // ZK fields copied from ZE
  zkFieldsFromZE() {
    return [
      this.xf('Institution_ZK', 'Antragsteller'),
      this.xfField('Name_ZK', App.getFieldValue('Name_ZE')),
      this.xf('Adresssuche', 'Ja'),
      this.xfField('Strasse_ZK', App.getFieldValue('Strasse_ZE')),
      this.xfField('PLZ_Strasse_ZK', App.getFieldValue('PLZ_Strasse_ZE')),
      this.xfField('Ort_Strasse_ZK', App.getFieldValue('Ort_Strasse_ZE')),
      this.xfField('Land_ZK', App.getFieldValue('Land_ZE')),
      this.xfField('Postfach_ZK', App.getFieldValue('Postfach_ZE')),
      this.xfField('PLZ_Postfach_ZK', App.getFieldValue('PLZ_Postfach_ZE')),
      this.xfField('Ort_Postfach_ZK', App.getFieldValue('Ort_Postfach_ZE')),
      this.xfField('PLZ_Grosskunde_ZK', App.getFieldValue('PLZ_Grosskunde_ZE')),
      this.xfField('Ort_Grosskunde_ZK', App.getFieldValue('Ort_Grosskunde_ZE')),
      this.xfField('Geschaeftszeichen_ZK'),
      this.xfField('Pruef_ID_Adresse_ZK', App.getFieldValue('Pruef_ID_Adresse_ZE')),
      this.xfField('Pruef_ID_Name_ZK', App.getFieldValue('Pruef_ID_Name_ZE'))
    ];
  },

  // ZK fields entered directly
  zkFieldsDirect() {
    return [
      this.xfField('Institution_ZK'),
      this.xfField('Name_ZK'),
      this.xf('Adresssuche', App.getFieldValue('Adresssuche') || 'Ja'),
      ...this.xfFields('Strasse_ZK','PLZ_Strasse_ZK','Ort_Strasse_ZK','Land_ZK','Postfach_ZK','PLZ_Postfach_ZK',
        'Ort_Postfach_ZK','PLZ_Grosskunde_ZK','Ort_Grosskunde_ZK','Geschaeftszeichen_ZK',
        'Pruef_ID_Adresse_ZK','Pruef_ID_Name_ZK')
    ];
  },

  // ============== Ansprechpartner ==============

  buildAnsprechpartner() {
    return this.xf('Feldgruppe_Ansprechpartner',
      // PL
      this.xf('Feldgruppe_Ansprechpartner_PL',
        this.xf('Maske_Ansprechpartner_PL',
          this.xf('Einzelposition',
            ...this.xfFields('akad_Grad_PL','Vorname_PL','Name_PL','Telefon_PL','Fax_PL','Email_PL'),
            this.xfField('EmailZuvor_PL', App.getFieldValue('Email_PL')),
            this.xfField('EmailHatZugang_PL'),
            this.xf('Schreibschutz', 'Standard'),
            this.xf('online_antrag_PL', '2')
          )
        )
      ),
      // PA
      this.xf('Feldgruppe_Ansprechpartner_PA',
        this.xf('Maske_Ansprechpartner_PA',
          this.xf('Einzelposition',
            this.xfField('kopiere_in_PA'),
            ...this.xfFields('akad_Grad_PA','Vorname_PA','Name_PA','Telefon_PA','Fax_PA','Email_PA'),
            this.xfField('EmailZuvor_PA', App.getFieldValue('Email_PA')),
            this.xfField('EmailHatZugang_PA'),
            ...this.xfFields('akad_Grad_A2','Vorname_A2','Name_A2','Telefon_A2','Fax_A2','Email_A2'),
            this.xf('Schreibschutz', 'Standard')
          )
        )
      ),
      // UZ
      this.xf('Feldgruppe_Ansprechpartner_UZ',
        this.xf('Maske_Ansprechpartner_UZ',
          this.xf('Einzelposition',
            this.xfField('kopiere_in_UZ'),
            ...this.xfFields('akad_Grad_UZ','Vorname_UZ','Name_UZ','Telefon_UZ','Fax_UZ','Email_UZ'),
            this.xfField('EmailZuvor_UZ', App.getFieldValue('Email_UZ')),
            this.xfField('EmailHatZugang_UZ'),
            ...this.xfFields('akad_Grad_Z2','Vorname_Z2','Name_Z2','Telefon_Z2','Fax_Z2','Email_Z2'),
            this.xf('Schreibschutz', 'Standard'),
            this.xf('online_antrag_UZ', '2')
          )
        )
      )
    );
  },

  // ============== Finanzplan ==============

  buildFinanzplan(jahre, von, bis) {
    return this.xf('Feldgruppe_Finanzplan',
      this.xf('Feldgruppe_Ausgaben',
        // Personal
        this.xf('Feldgruppe_Personal',
          this.buildTarif('tarif1', 'Tarif_1', jahre, von, bis),
          this.buildTarif('tarif2', 'Tarif_2', jahre, von, bis),
          this.buildTarif('tarif3', 'Tarif_3', jahre, von, bis),
          this.buildSonstigeEntgelte(jahre),
          // Personal total
          ...this.zwischensummenBetrag(jahre, j => FP.totalPersonalPerYear(j))
        ),
        // Sachmittel
        this.xf('Feldgruppe_Sachmittel',
          this.buildSachFeldgruppe('Gegenstaende', jahre),
          // MieteRechner group
          this.xf('Feldgruppe_MieteRechner',
            this.buildSachFeldgruppe('Mieten', jahre),
            this.buildSachFeldgruppe('Rechner', jahre),
            ...this.zwischensummenBetrag(jahre, j =>
              FP.yearSubtotalSach('Mieten', j) + FP.yearSubtotalSach('Rechner', j))
          ),
          this.buildAuftrag(jahre),
          // Material group
          this.xf('Feldgruppe_Material',
            this.buildSachMaterial('Verbrauchsmaterial', jahre),
            this.buildSachMaterial('Geschaeftsbedarf', jahre),
            this.buildSachMaterial('Literatur', jahre),
            this.buildSachMaterial('ZusatzMaterial1', jahre),
            this.buildSachMaterial('ZusatzMaterial2', jahre),
            ...this.zwischensummenBetrag(jahre, j =>
              ['Verbrauchsmaterial','Geschaeftsbedarf','Literatur','ZusatzMaterial1','ZusatzMaterial2']
                .reduce((s, sec) => s + FP.yearSubtotalSach(sec, j), 0))
          ),
          // Reisen
          this.xf('Feldgruppe_Reisen',
            this.buildReisen('Inlandreisen', jahre),
            this.buildReisen('Auslandreisen', jahre),
            ...this.zwischensummenBetrag(jahre, j =>
              FP.yearSubtotalReisen('Inlandreisen', j) + FP.yearSubtotalReisen('Auslandreisen', j))
          ),
          // Sachmittel total (excl. investments)
          ...this.zwischensummenBetrag(jahre, j => {
            let t = FP.sachSections.reduce((s, sec) => s + FP.yearSubtotalSach(sec, j), 0);
            t += FP.yearSubtotalReisen('Inlandreisen', j) + FP.yearSubtotalReisen('Auslandreisen', j);
            return t;
          })
        ),
        // Investitionen
        this.buildInvest(jahre),
        // Ausgaben total
        ...this.zwischensummenBetrag(jahre, j => FP.totalAusgabenPerYear(j))
      ),
      // Finanzierung
      this.buildFinanzierung(jahre)
    );
  },

  // --- Personnel tarif ---
  buildTarif(tarifKey, xmlName, jahre, von, bis) {
    const rows = FP.personal[tarifKey];
    const isTarif3 = (tarifKey === 'tarif3');

    // Tabellenposition per row per year
    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j => {
        const e = row.entries[j] || { basis: 0, zuschlag: 0, anzahl: 0 };
        const ppu = App.parseNum(e.basis) + App.parseNum(e.zuschlag);
        const sum = ppu * App.parseNum(e.anzahl);
        const vollzeit = App.parseNum(row.vollzeit || 40);
        const stunden = App.parseNum(row.stunden);
        const pm = App.parseNum(e.anzahl) * (vollzeit > 0 ? stunden / vollzeit : 0);

        return this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
          this.xf('ZeileNr', zeileNr),
          this.xf('Bezeichnung', row.bezeichnung),
          isTarif3
            ? this.xf('ArtikelArt', row.artikelArt)
            : [this.xf('N_N_Personal', row.nn || 'Nein'), this.xf('Tarifgruppe', row.tarifgruppe)],
          this.xf('Wochenarbeitszeit_Vollzeit', vollzeit),
          this.xf('Wochenarbeitsstunden', stunden),
          !isTarif3 ? [this.xf('Basispreis', App.parseNum(e.basis)), this.xf('Zuschlag', App.parseNum(e.zuschlag))] : null,
          this.xf('PreisProEinheit', this.round2(ppu)),
          this.xf('Anzahl', App.parseNum(e.anzahl)),
          this.xf('Vollzeit_PM', this.round2(pm)),
          this.xf('BetragSumme', this.round2(sum))
        );
      });
    });

    // Gesamtansicht per row
    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let totalAnzahl = 0, totalPM = 0, totalSum = 0;
      jahre.forEach(j => {
        const e = row.entries[j] || { basis: 0, zuschlag: 0, anzahl: 0 };
        const ppu = App.parseNum(e.basis) + App.parseNum(e.zuschlag);
        const vollzeit = App.parseNum(row.vollzeit || 40);
        const stunden = App.parseNum(row.stunden);
        totalAnzahl += App.parseNum(e.anzahl);
        totalPM += App.parseNum(e.anzahl) * (vollzeit > 0 ? stunden / vollzeit : 0);
        totalSum += ppu * App.parseNum(e.anzahl);
      });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        isTarif3
          ? this.xf('ArtikelArt', row.artikelArt)
          : [this.xf('N_N_Personal', row.nn || 'Nein'), this.xf('Tarifgruppe', row.tarifgruppe)],
        this.xf('Anzahl', this.round2(totalAnzahl)),
        this.xf('Vollzeit_PM', this.round2(totalPM)),
        this.xf('BetragSumme', this.round2(totalSum))
      );
    });

    const rpf = FP.rpfBegruendung[tarifKey] || '';
    const einzelposition = this.xf('Einzelposition',
      rpf ? this.xf('rpf_Begruendung', rpf) : null,
      this.xf('kopiere_von', von),
      this.xf('kopiere_bis', bis)
    );

    const sumFn = j => FP.yearSubtotalPerson(tarifKey, j);

    return this.xf(`Feldgruppe_${xmlName}`,
      this.xf(`Maske_${xmlName}`,
        ...tabPositions,
        ...gesamtansichten,
        einzelposition,
        ...this.zwischensummenPersonal(jahre, sumFn)
      ),
      ...this.zwischensummenPersonal(jahre, sumFn)
    );
  },

  // --- Sachmittel: row-based sections (Gegenstaende, Mieten, Rechner, Auftrag) ---
  buildSonstigeEntgelte(jahre) {
    const rows = FP.sonstigeEntgelte || [];
    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j => this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('BetragSumme', this.round2(App.parseNum(row.entries[j])))
      ));
    });
    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let total = 0;
      jahre.forEach(j => { total += App.parseNum(row.entries[j]); });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('BetragSumme', this.round2(total))
      );
    });
    const sumFn = j => FP.yearSubtotalSE(j);
    const rpf = FP.rpfBegruendung.SonstigeEntgelte;
    return this.xf('Feldgruppe_SonstigeEntgelte',
      this.xf('Maske_SonstigeEntgelte',
        ...tabPositions,
        ...gesamtansichten,
        rpf ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf)) : this.xf('Einzelposition'),
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  buildSachFeldgruppe(section, jahre) {
    const rows = FP.sach[section] || [];

    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j => this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('BetragSumme', this.round2(App.parseNum(row.entries[j])))
      ));
    });

    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let total = 0;
      jahre.forEach(j => { total += App.parseNum(row.entries[j]); });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('BetragSumme', this.round2(total))
      );
    });

    const sumFn = j => FP.yearSubtotalSach(section, j);
    const rpf = FP.rpfBegruendung[section];
    return this.xf(`Feldgruppe_${section}`,
      this.xf(`Maske_${section}`,
        ...tabPositions,
        ...gesamtansichten,
        rpf ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf)) : this.xf('Einzelposition'),
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  // --- Auftrag (contractors) with per-row detail fields ---
  buildAuftrag(jahre) {
    const rows = FP.auftrag || [];

    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j => this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('IstBekannt', row.istBekannt || 'Ja'),
        this.xf('Name_AU', row.nameAU || ''),
        this.xf('Land_AU', row.landAU || 'Deutschland'),
        this.xf('PLZ_Strasse_AU', row.plzAU || ''),
        this.xf('Ort_Strasse_AU', row.ortAU || ''),
        this.xf('BetragSumme', this.round2(App.parseNum(row.entries[j])))
      ));
    });

    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let total = 0;
      jahre.forEach(j => { total += App.parseNum(row.entries[j]); });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('IstBekannt', row.istBekannt || 'Ja'),
        this.xf('Name_AU', row.nameAU || ''),
        this.xf('Land_AU', row.landAU || 'Deutschland'),
        this.xf('PLZ_Strasse_AU', row.plzAU || ''),
        this.xf('Ort_Strasse_AU', row.ortAU || ''),
        this.xf('BetragSumme', this.round2(total))
      );
    });

    const sumFn = j => FP.yearSubtotalAuftrag(j);
    const rpf = FP.rpfBegruendung.Auftrag;
    return this.xf('Feldgruppe_Auftrag',
      this.xf('Maske_Auftrag',
        ...tabPositions,
        ...gesamtansichten,
        rpf ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf)) : this.xf('Einzelposition'),
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  // --- Sachmittel: year-based material sections ---
  buildSachMaterial(section, jahre) {
    const bezeichnung = App.getFieldValue(`Bezeichnung_${section}`);
    const sumFn = j => FP.yearSubtotalSach(section, j);

    const tabPositions = jahre.map(j =>
      this.xf('Tabellenposition', { Jahr: j, TabID: j },
        bezeichnung ? this.xf('Bezeichnung', bezeichnung) : null,
        this.xf('BetragSumme', this.round2(sumFn(j)))
      )
    );

    let grandTotal = 0;
    jahre.forEach(j => { grandTotal += sumFn(j); });

    const rpf = FP.rpfBegruendung[section];
    return this.xf(`Feldgruppe_${section}`,
      this.xf(`Maske_${section}`,
        ...tabPositions,
        this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: '1' },
          bezeichnung ? this.xf('Bezeichnung', bezeichnung) : null,
          this.xf('BetragSumme', this.round2(grandTotal))
        ),
        rpf ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf)) : this.xf('Einzelposition'),
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  // --- Reisen ---
  buildReisen(section, jahre) {
    const rows = FP.reisen[section] || [];

    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j =>
        this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
          this.xf('ZeileNr', zeileNr),
          this.xf('Reiseziel', row.reiseziel),
          this.xf('Reisezweck', row.reisezweck),
          this.xf('Reisedauer', App.parseNum(row.reisedauer)),
          this.xf('BetragSumme', this.round2(App.parseNum(row.entries[j])))
        )
      );
    });

    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let totalSum = 0;
      jahre.forEach(j => { totalSum += App.parseNum(row.entries[j]); });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Reiseziel', row.reiseziel),
        this.xf('BetragSumme', this.round2(totalSum))
      );
    });

    const rpf = FP.rpfBegruendung[section] || '';
    const einzelposition = rpf
      ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf))
      : this.xf('Einzelposition');

    const sumFn = j => FP.yearSubtotalReisen(section, j);
    return this.xf(`Feldgruppe_${section}`,
      this.xf(`Maske_${section}`,
        ...tabPositions,
        ...gesamtansichten,
        einzelposition,
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  // --- Investitionen ---
  buildInvest(jahre) {
    const rows = FP.invest;

    const tabPositions = rows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j => {
        const e = row.entries[j] || { preis: 0, anzahl: 0 };
        const preis = App.parseNum(e.preis);
        const anzahl = App.parseNum(e.anzahl);
        return this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
          this.xf('ZeileNr', zeileNr),
          this.xf('Bezeichnung', row.bezeichnung),
          this.xf('PreisProEinheit', this.round2(preis)),
          this.xf('Anzahl', anzahl),
          this.xf('BetragSumme', this.round2(preis * anzahl))
        );
      });
    });

    const gesamtansichten = rows.map((row, idx) => {
      const zeileNr = idx + 1;
      let totalAnzahl = 0, totalSum = 0;
      jahre.forEach(j => {
        const e = row.entries[j] || { preis: 0, anzahl: 0 };
        totalAnzahl += App.parseNum(e.anzahl);
        totalSum += App.parseNum(e.preis) * App.parseNum(e.anzahl);
      });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('Anzahl', totalAnzahl),
        this.xf('BetragSumme', this.round2(totalSum))
      );
    });

    const rpf = FP.rpfBegruendung.GesamteInvestitionen || '';
    const einzelposition = rpf
      ? this.xf('Einzelposition', this.xf('rpf_Begruendung', rpf))
      : this.xf('Einzelposition');

    const sumFn = j => FP.yearSubtotalInvest(j);
    return this.xf('Feldgruppe_GesamteInvestitionen',
      this.xf('Maske_GesamteInvestitionen',
        ...tabPositions,
        ...gesamtansichten,
        einzelposition,
        ...this.zwischensummenBetrag(jahre, sumFn)
      ),
      ...this.zwischensummenBetrag(jahre, sumFn)
    );
  },

  // ============== Finanzierung ==============

  buildFinanzierung(jahre) {
    const ppSatz = App.parseNum(document.getElementById('ppSatz')?.value) || 20;

    return this.xf('Feldgruppe_Finanzierung',
      // MittelDritter
      this.buildMittelDritter(jahre),
      // Eigenmittel_Zuwendung
      this.buildEigenmittelZuwendung(jahre, ppSatz),
      // Finanzierung total
      ...this.zwischensummenFinanz(jahre, j => FP.totalAusgabenPerYear(j))
    );
  },

  buildMittelDritter(jahre) {
    const mdRows = FP.mittelDritterRows || [];

    const tabPositions = mdRows.flatMap((row, idx) => {
      const zeileNr = idx + 1;
      return jahre.map(j =>
        this.xf('Tabellenposition', { Jahr: j, TabID: zeileNr },
          this.xf('ZeileNr', zeileNr),
          this.xf('Bezeichnung', row.bezeichnung),
          this.xf('Grund', row.grund),
          this.xf('FinanzierungSumme', this.round2(App.parseNum(row.entries[j])))
        )
      );
    });

    const gesamtansichten = mdRows.map((row, idx) => {
      const zeileNr = idx + 1;
      let total = 0;
      jahre.forEach(j => { total += App.parseNum(row.entries[j]); });
      return this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: zeileNr },
        this.xf('ZeileNr', zeileNr),
        this.xf('Bezeichnung', row.bezeichnung),
        this.xf('FinanzierungSumme', this.round2(total))
      );
    });

    const sumFn = j => App.parseNum(FP.finanz.mittelDritter[j]);
    return this.xf('Feldgruppe_MittelDritter',
      this.xf('Maske_MittelDritter',
        ...tabPositions,
        ...gesamtansichten,
        this.xf('Einzelposition'),
        ...this.zwischensummenFinanz(jahre, sumFn)
      ),
      ...this.zwischensummenFinanz(jahre, sumFn)
    );
  },

  buildEigenmittelZuwendung(jahre, ppSatz) {
    const strategie = App.getFieldValue('Strategie_EP') || 'Förderquote';

    // Tabellenposition per year
    const tabPositions = jahre.map(j => {
      const kosten = FP.totalAusgabenPerYear(j);
      const md = App.parseNum(FP.finanz.mittelDritter[j]);
      const em = App.parseNum(FP.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      const fq = kosten > 0 ? (zuw / kosten * 100) : 0;
      const ppBetrag = zuw * ppSatz / 100;

      return this.xf('Tabellenposition', { Jahr: j, TabID: j },
        this.xf('Kosten', this.round2(kosten)),
        this.xf('MittelDritter', this.round2(md)),
        this.xf('Eigenmittel', this.round2(em)),
        this.xf('Eigenmittel_zuvor', this.round2(em)),
        this.xf('Zuwendung', this.round2(zuw)),
        this.xf('Zuwendung_zuvor', this.round2(zuw)),
        this.xf('FinanzierungSumme', this.round2(kosten)),
        this.xf('Foerderquote', this.round2(fq)),
        this.xf('Foerderquote_zuvor', this.round2(fq)),
        this.xf('Strategie', 'Gesperrt'),
        this.xf('ProjektPauschaleSatz', ppSatz),
        this.xf('ProjektPauschaleBetrag', this.round2(ppBetrag)),
        this.xf('ProjektPauschaleGesamtbetrag', this.round2(zuw + ppBetrag))
      );
    });

    // Gesamtansicht
    let gKosten = 0, gMD = 0, gEM = 0;
    jahre.forEach(j => {
      gKosten += FP.totalAusgabenPerYear(j);
      gMD += App.parseNum(FP.finanz.mittelDritter[j]);
      gEM += App.parseNum(FP.finanz.eigenmittel[j]);
    });
    const gZuw = gKosten - gMD - gEM;
    const gFQ = gKosten > 0 ? (gZuw / gKosten * 100) : 0;
    const gPPB = gZuw * ppSatz / 100;

    const gesamtansicht = this.xf('Gesamtansicht', { Jahr: 'Gesamt', TabID: '1' },
      this.xf('Kosten', this.round2(gKosten)),
      this.xf('MittelDritter', this.round2(gMD)),
      this.xf('Eigenmittel', this.round2(gEM)),
      this.xf('Eigenmittel_zuvor', this.round2(gEM)),
      this.xf('Zuwendung', this.round2(gZuw)),
      this.xf('Zuwendung_zuvor', this.round2(gZuw)),
      this.xf('FinanzierungSumme', this.round2(gKosten)),
      this.xf('Foerderquote', this.round2(gFQ)),
      this.xf('Foerderquote_zuvor', this.round2(gFQ)),
      this.xf('Strategie', 'Gesperrt'),
      this.xf('ProjektPauschaleSatz', ppSatz),
      this.xf('ProjektPauschaleBetrag', this.round2(gPPB)),
      this.xf('ProjektPauschaleGesamtbetrag', this.round2(gZuw + gPPB))
    );

    const einzelposition = this.xf('Einzelposition',
      this.xf('Strategie_waehlbar', document.getElementById('chkStrategieWaehlbar')?.checked ? 'Ja' : 'Nein'),
      this.xf('Strategie_EP', strategie)
    );

    return this.xf('Feldgruppe_Eigenmittel_Zuwendung',
      this.xf('Maske_Eigenmittel_Zuwendung',
        ...tabPositions,
        gesamtansicht,
        einzelposition,
        ...this.zwischensummenEZ(jahre)
      ),
      ...this.zwischensummenEZ(jahre)
    );
  },

  // ============== Reiter1 (Erklaerungen, Zusatzinfo, profiOnline) ==============

  buildReiter1(jahre) {
    const erklFields = ['Vorhabenbeschreibung','Balkenplan','Strukturplan','Netzplan','Vorkalkulationsdaten',
      'Geraeteliste','Bonitaetsnachweis','Zeichnungen','Mitfinanzierung','Eigenmittel_vorhanden',
      'Personal_investition','GeguInvest','Sonstige_Foerderung',
      'Traeger_sonstige_Foerderung','sonstige_Foerderung_Betrag',
      'Folgekosten','Folgekosten_Betrag','Folgekosten_Beschreibung',
      'wirtschaftlichen_Bereich_J_N_N','Grundfinanzierung','Einvernehmen_mit_Landesressort',
      'subventionserheblicheTatsachen','Einverstaendnis_Vollstaendigkeit'];

    const contacts = [
      { role: 'Projektleitung', short: 'PL', vf: 'Vorname_PL', nf: 'Name_PL', ef: 'Email_PL', zf: 'EmailHatZugang_PL' },
      { role: 'Ansprechperson für administrative Fragen', short: 'PA', vf: 'Vorname_PA', nf: 'Name_PA', ef: 'Email_PA', zf: 'EmailHatZugang_PA' },
      { role: 'Bevollmächtigte/r / Unterzeichner/in', short: 'UZ', vf: 'Vorname_UZ', nf: 'Name_UZ', ef: 'Email_UZ', zf: 'EmailHatZugang_UZ' },
    ];

    return this.xf('Feldgruppe_Reiter1',
      // Erklaerungen
      this.xf('Feldgruppe_Erklaerungen',
        this.xf('Maske_Erklaerungen',
          this.xf('Einzelposition', ...this.xfFields(...erklFields))
        )
      ),
      // Zusatzinformationen_1
      this.xf('Feldgruppe_Zusatzinformationen_1',
        this.xf('Maske_Zusatzinformationen_1',
          this.xf('Einzelposition',
            this.xfField('KMU_Status'),
            this.xfField('KeinUnternehmen')
          )
        )
      ),
      // profiOnlineZugang
      this.xf('Feldgruppe_profiOnlineZugang',
        this.xf('Maske_profiOnlineZugang',
          ...contacts.map((c, idx) => {
            const name = `${App.getFieldValue(c.vf)} ${App.getFieldValue(c.nf)}`.trim();
            const email = App.getFieldValue(c.ef);
            const hatZugang = App.getFieldValue(c.zf) === 'Ja';
            return this.xf('Tabellenposition', { TabID: idx + 1 },
              this.xf('Ansprechpartner', c.role),
              this.xf('Kurzform', c.short),
              this.xf('Name', name),
              this.xf('Zugangskennung', email),
              this.xf('hatOnlineZugang', hatZugang ? 'Ja' : 'Nein'),
              this.xf('beantragt', hatZugang ? 'vorhanden' : 'Nein'),
              this.xf('beantragt_BV', hatZugang ? 'Ja' : 'Nein'),
              this.xf('Postadresse', '--------'),
              this.xf('Status', hatZugang ? '2' : '0')
            );
          }),
          this.xf('Einzelposition',
            this.xf('beantragt_BV2', 'Nein'),
            this.xf('AntragOnlineZugang', 'Ja')
          )
        )
      )
    );
  },

  // ============== Zwischensumme helpers ==============

  // Returns array of Zwischensumme nodes with BetragSumme
  zwischensummenBetrag(jahre, sumFn) {
    let gesamt = 0;
    const nodes = jahre.map(j => {
      const v = sumFn(j);
      gesamt += v;
      return this.xf('Zwischensumme', { Jahr: j },
        this.xf('BetragSumme', this.round2(v))
      );
    });
    nodes.push(this.xf('Zwischensumme', { Jahr: 'Gesamt' },
      this.xf('BetragSumme', this.round2(gesamt))
    ));
    return nodes;
  },

  // Returns array of Zwischensumme nodes with BetragSumme + Vollzeit_PM
  zwischensummenPersonal(jahre, sumFn) {
    let gesamtSum = 0, gesamtPM = 0;
    const nodes = jahre.map(j => {
      const { pm, sum } = sumFn(j);
      gesamtSum += sum;
      gesamtPM += pm;
      return this.xf('Zwischensumme', { Jahr: j },
        this.xf('BetragSumme', this.round2(sum)),
        this.xf('Vollzeit_PM', this.round2(pm))
      );
    });
    nodes.push(this.xf('Zwischensumme', { Jahr: 'Gesamt' },
      this.xf('BetragSumme', this.round2(gesamtSum)),
      this.xf('Vollzeit_PM', this.round2(gesamtPM))
    ));
    return nodes;
  },

  // Returns array of Zwischensumme nodes with FinanzierungSumme
  zwischensummenFinanz(jahre, sumFn) {
    let gesamt = 0;
    const nodes = jahre.map(j => {
      const v = sumFn(j);
      gesamt += v;
      return this.xf('Zwischensumme', { Jahr: j },
        this.xf('FinanzierungSumme', this.round2(v))
      );
    });
    nodes.push(this.xf('Zwischensumme', { Jahr: 'Gesamt' },
      this.xf('FinanzierungSumme', this.round2(gesamt))
    ));
    return nodes;
  },

  // Returns array of Zwischensumme nodes for Eigenmittel/Zuwendung
  zwischensummenEZ(jahre) {
    let gFS = 0, gEM = 0, gK = 0, gZ = 0;
    const nodes = jahre.map(j => {
      const kosten = FP.totalAusgabenPerYear(j);
      const md = App.parseNum(FP.finanz.mittelDritter[j]);
      const em = App.parseNum(FP.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      gFS += kosten; gEM += em; gK += kosten; gZ += zuw;
      return this.xf('Zwischensumme', { Jahr: j },
        this.xf('FinanzierungSumme', this.round2(kosten)),
        this.xf('Eigenmittel', this.round2(em)),
        this.xf('Kosten', this.round2(kosten)),
        this.xf('Zuwendung', this.round2(zuw))
      );
    });
    nodes.push(this.xf('Zwischensumme', { Jahr: 'Gesamt' },
      this.xf('FinanzierungSumme', this.round2(gFS)),
      this.xf('Eigenmittel', this.round2(gEM)),
      this.xf('Kosten', this.round2(gK)),
      this.xf('Zuwendung', this.round2(gZ))
    ));
    return nodes;
  },

  // ============== Utilities ==============

  round2(n) {
    return (Math.round(n * 100) / 100);
  },

  esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = XmlExport;
