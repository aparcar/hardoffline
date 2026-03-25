// ============================================================
// finanzplan.js - Personnel tables, material tables, financing
// ============================================================
'use strict';

const FP = {
  // Personnel data: { tarif1: [ {id, bezeichnung, nn, tarifgruppe, artikelArt, vollzeit, stunden, entries: {2026: {basis,zuschlag,anzahl}, ...} } ], ... }
  personal: { tarif1: [], tarif2: [], tarif3: [] },
  // Material data: { Gegenstaende: [{id, bezeichnung, entries: {2026: amount, ...}}], ... }
  sach: {},
  // Reisen data: { Inlandreisen: { '2026': [{id, reiseziel, reisezweck, reisedauer, betrag}], ... }, ... }
  reisen: { Inlandreisen: {}, Auslandreisen: {} },
  // Investitionen: [{id, bezeichnung, entries: {2026: {preis, anzahl}, ...}}]
  invest: [],
  // Financing: { mittelDritter: {2026: 0, ...}, eigenmittel: {2026: 0, ...} }
  finanz: { mittelDritter: {}, eigenmittel: {} },
  // rpf_Begruendung per section
  // SonstigeEntgelte: [{id, bezeichnung, entries: {year: amount}}]
  sonstigeEntgelte: [],
  // Auftrag (contractor) rows: [{id, bezeichnung, istBekannt, nameAU, landAU, plzAU, ortAU, entries: {year: amount}}]
  auftrag: [],
  rpfBegruendung: { tarif1: '', tarif2: '', tarif3: '', SonstigeEntgelte: '',
    Gegenstaende: '', Mieten: '', Rechner: '', Auftrag: '', Verbrauchsmaterial: '',
    Geschaeftsbedarf: '', Literatur: '', ZusatzMaterial1: '', ZusatzMaterial2: '',
    Inlandreisen: '', Auslandreisen: '', GesamteInvestitionen: '' },

  sachSections: ['Gegenstaende','Mieten','Rechner','Verbrauchsmaterial','Geschaeftsbedarf','Literatur','ZusatzMaterial1','ZusatzMaterial2'],
  // MittelDritter rows (Quelle/Grund per row)
  mittelDritterRows: [],
  // Kooperationspartner: [{id, name, plz, ort, land, rolle}]
  kopiPartner: [],

  _nextId: 1,
  genId() { return this._nextId++; },

  init() {
    this.loadFromStorage();
    if (App.jahre.length > 0) this.rebuildAllTables();
  },

  // ============== PERSONNEL ==============
  addPersonRow(tarif, data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit (von/bis) eingeben.'); return; }
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      nn: data?.nn || 'Nein',
      tarifgruppe: data?.tarifgruppe || '',
      artikelArt: data?.artikelArt || '',
      vollzeit: data?.vollzeit || 40,
      stunden: data?.stunden || 40,
      entries: {}
    };
    jahre.forEach(j => {
      row.entries[j] = data?.entries?.[j] || { basis: 0, zuschlag: 0, anzahl: 0 };
    });
    this.personal[tarif].push(row);
    this.renderPersonTable(tarif);
    return row;
  },

  removePersonRow(tarif, id) {
    this.personal[tarif] = this.personal[tarif].filter(r => r.id !== id);
    this.renderPersonTable(tarif);
  },

  renderPersonTable(tarif) {
    const jahre = App.jahre;
    const thead = document.getElementById(`thead${this.tarifKey(tarif)}`);
    const tbody = document.getElementById(`tbody${this.tarifKey(tarif)}`);
    const tfoot = document.getElementById(`tfoot${this.tarifKey(tarif)}`);
    if (!thead) return;

    const isTarif3 = (tarif === 'tarif3');

    // Header
    let hdr = '<tr><th rowspan="2">Nr</th><th rowspan="2">Bezeichnung</th>';
    if (isTarif3) {
      hdr += '<th rowspan="2">Art</th>';
    } else {
      hdr += '<th rowspan="2">N.N.</th><th rowspan="2">Tarifgruppe</th>';
    }
    hdr += '<th rowspan="2">Vollzeit h/W</th><th rowspan="2">h/W</th>';
    if (isTarif3) {
      jahre.forEach(j => hdr += `<th colspan="2" class="text-center">${j}</th>`);
    } else {
      jahre.forEach(j => hdr += `<th colspan="4" class="text-center">${j}</th>`);
    }
    hdr += '<th colspan="2" class="text-center">Gesamt</th><th rowspan="2"></th></tr><tr>';
    if (isTarif3) {
      jahre.forEach(() => hdr += '<th>Preis/Monat</th><th>Monate</th>');
    } else {
      jahre.forEach(() => hdr += '<th>Basis</th><th>Zuschlag</th><th>Monate</th><th>Summe</th>');
    }
    hdr += '<th>PM</th><th>Summe</th></tr>';
    thead.innerHTML = hdr;

    // Body
    tbody.innerHTML = this.personal[tarif].map((row, idx) => {
      let html = `<tr data-rowid="${row.id}">`;
      html += `<td>${idx + 1}</td>`;
      html += `<td><input class="form-control fp-input-wide" maxlength="50" value="${this.esc(row.bezeichnung)}" onchange="FP.updatePersonField('${tarif}',${row.id},'bezeichnung',this.value)"></td>`;
      if (isTarif3) {
        html += `<td><input class="form-control fp-input-wide" value="${this.esc(row.artikelArt)}" onchange="FP.updatePersonField('${tarif}',${row.id},'artikelArt',this.value)" placeholder="z.B. Administrator"></td>`;
      } else {
        html += `<td><select class="form-select fp-input-narrow" onchange="FP.updatePersonField('${tarif}',${row.id},'nn',this.value)"><option ${row.nn==='Nein'?'selected':''}>Nein</option><option ${row.nn==='Ja'?'selected':''}>Ja</option></select></td>`;
        const tgOpts = tarif === 'tarif1' ? TARIF1_OPTIONS : TARIF2_OPTIONS;
        html += `<td><select class="form-select fp-input-wide" onchange="FP.updatePersonField('${tarif}',${row.id},'tarifgruppe',this.value)">`;
        html += `<option value="">--</option>`;
        for (const tg of tgOpts) {
          html += `<option${row.tarifgruppe === tg ? ' selected' : ''}>${this.esc(tg)}</option>`;
        }
        html += `</select></td>`;
      }
      html += `<td><input type="number" class="form-control fp-input-narrow" value="${row.vollzeit}" onchange="FP.updatePersonField('${tarif}',${row.id},'vollzeit',this.value)"></td>`;
      html += `<td><input type="number" class="form-control fp-input-narrow" value="${row.stunden}" onchange="FP.updatePersonField('${tarif}',${row.id},'stunden',this.value)"></td>`;

      let totalPM = 0, totalSum = 0;
      jahre.forEach(j => {
        const e = row.entries[j] || { basis: 0, zuschlag: 0, anzahl: 0 };
        const ppu = App.parseNum(e.basis) + App.parseNum(e.zuschlag);
        const sum = ppu * App.parseNum(e.anzahl);
        const pm = App.parseNum(e.anzahl) * (App.parseNum(row.stunden) / App.parseNum(row.vollzeit || 40));
        totalPM += pm;
        totalSum += sum;
        if (isTarif3) {
          // Tarif 3: PreisProEinheit is a single field, no separate basis/zuschlag
          html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${ppu}" onchange="FP.updatePersonEntry('${tarif}',${row.id},'${j}','basis',this.value)"></td>`;
          html += `<td><input type="number" class="form-control fp-input-narrow" value="${e.anzahl}" onchange="FP.updatePersonEntry('${tarif}',${row.id},'${j}','anzahl',this.value)"></td>`;
        } else {
          html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${e.basis}" onchange="FP.updatePersonEntry('${tarif}',${row.id},'${j}','basis',this.value)"></td>`;
          html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${e.zuschlag}" onchange="FP.updatePersonEntry('${tarif}',${row.id},'${j}','zuschlag',this.value)"></td>`;
          html += `<td><input type="number" class="form-control fp-input-narrow" value="${e.anzahl}" onchange="FP.updatePersonEntry('${tarif}',${row.id},'${j}','anzahl',this.value)"></td>`;
          html += `<td class="fp-calculated text-end">${App.fmt(sum)}</td>`;
        }
      });
      html += `<td class="fp-calculated text-end">${App.fmtNum(totalPM)}</td>`;
      html += `<td class="fp-calculated text-end">${App.fmt(totalSum)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removePersonRow('${tarif}',${row.id})"><i class="bi bi-x"></i></button></td>`;
      html += '</tr>';
      return html;
    }).join('');

    // Footer: subtotals per year
    const colsBefore = isTarif3 ? 4 : 6;
    let foot = `<tr class="fp-total"><td colspan="${colsBefore}" class="text-end"><strong>Summe</strong></td>`;
    let grandPM = 0, grandSum = 0;
    jahre.forEach(j => {
      const { pm, sum } = this.yearSubtotalPerson(tarif, j);
      grandPM += pm;
      grandSum += sum;
      if (isTarif3) {
        foot += `<td colspan="1"></td><td class="text-end"><strong>${App.fmt(sum)}</strong></td>`;
      } else {
        foot += `<td colspan="3"></td><td class="text-end"><strong>${App.fmt(sum)}</strong></td>`;
      }
    });
    foot += `<td class="text-end"><strong>${App.fmtNum(grandPM)}</strong></td>`;
    foot += `<td class="text-end"><strong>${App.fmt(grandSum)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Restore rpf textarea
    const rpfEl = document.getElementById(`rpf${this.tarifKey(tarif)}`);
    if (rpfEl && this.rpfBegruendung[tarif]) rpfEl.value = this.rpfBegruendung[tarif];

    this.renderPersonalGesamt();
    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updatePersonField(tarif, id, field, value) {
    const row = this.personal[tarif].find(r => r.id === id);
    if (row) { row[field] = value; this.renderPersonTable(tarif); }
  },

  updatePersonEntry(tarif, id, jahr, field, value) {
    const row = this.personal[tarif].find(r => r.id === id);
    if (row) {
      if (!row.entries[jahr]) row.entries[jahr] = { basis: 0, zuschlag: 0, anzahl: 0 };
      row.entries[jahr][field] = App.parseNum(value);
      this.renderPersonTable(tarif);
    }
  },

  yearSubtotalPerson(tarif, jahr) {
    let pm = 0, sum = 0;
    this.personal[tarif].forEach(row => {
      const e = row.entries[jahr] || { basis: 0, zuschlag: 0, anzahl: 0 };
      const ppu = App.parseNum(e.basis) + App.parseNum(e.zuschlag);
      sum += ppu * App.parseNum(e.anzahl);
      pm += App.parseNum(e.anzahl) * (App.parseNum(row.stunden) / App.parseNum(row.vollzeit || 40));
    });
    return { pm, sum };
  },

  totalPersonalPerYear(jahr) {
    let total = 0;
    ['tarif1','tarif2','tarif3'].forEach(t => { total += this.yearSubtotalPerson(t, jahr).sum; });
    total += this.yearSubtotalSE(jahr);
    return total;
  },

  renderPersonalGesamt() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadPersonalGesamt');
    const tbody = document.getElementById('tbodyPersonalGesamt');
    if (!thead) return;

    thead.innerHTML = '<th>Kategorie</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th>';

    const rows = [
      { label: 'Tarif 1 (E12-E15)', fn: j => this.yearSubtotalPerson('tarif1', j).sum },
      { label: 'Tarif 2 (E1-E11)', fn: j => this.yearSubtotalPerson('tarif2', j).sum },
      { label: 'Tarif 3 (Sonstige)', fn: j => this.yearSubtotalPerson('tarif3', j).sum },
      { label: 'Beschäftigungsentgelte', fn: j => this.yearSubtotalSE(j) },
    ];
    let html = '';
    let gesamtRow = '<tr class="fp-grand-total"><td><strong>Personal Gesamt</strong></td>';
    let gesamtTotal = 0;

    rows.forEach(r => {
      html += `<tr><td>${r.label}</td>`;
      let rowTotal = 0;
      jahre.forEach(j => {
        const s = r.fn(j);
        rowTotal += s;
        html += `<td class="text-end">${App.fmt(s)}</td>`;
      });
      html += `<td class="text-end fw-bold">${App.fmt(rowTotal)}</td></tr>`;
    });

    jahre.forEach(j => {
      const t = this.totalPersonalPerYear(j);
      gesamtTotal += t;
      gesamtRow += `<td class="text-end">${App.fmt(t)}</td>`;
    });
    gesamtRow += `<td class="text-end">${App.fmt(gesamtTotal)}</td></tr>`;

    tbody.innerHTML = html + gesamtRow;
  },

  tarifKey(tarif) {
    return { tarif1: 'Tarif1', tarif2: 'Tarif2', tarif3: 'Tarif3' }[tarif] || tarif;
  },

  // ============== SONSTIGE ENTGELTE (F0822) ==============
  addSonstigeEntgelteRow(data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      entries: {}
    };
    jahre.forEach(j => { row.entries[j] = data?.entries?.[j] || 0; });
    this.sonstigeEntgelte.push(row);
    this.renderSonstigeEntgelte();
    return row;
  },

  removeSonstigeEntgelteRow(id) {
    this.sonstigeEntgelte = this.sonstigeEntgelte.filter(r => r.id !== id);
    this.renderSonstigeEntgelte();
  },

  renderSonstigeEntgelte() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadSonstigeEntgelte');
    const tbody = document.getElementById('tbodySonstigeEntgelte');
    const tfoot = document.getElementById('tfootSonstigeEntgelte');
    if (!thead) return;

    thead.innerHTML = '<tr><th>Bezeichnung</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th><th></th></tr>';

    tbody.innerHTML = this.sonstigeEntgelte.map(row => {
      let html = `<tr><td><input class="form-control fp-input-wide" maxlength="50" value="${this.esc(row.bezeichnung)}" onchange="FP.updateSEField(${row.id},'bezeichnung',this.value)"></td>`;
      let total = 0;
      jahre.forEach(j => {
        const v = App.parseNum(row.entries[j]);
        total += v;
        html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${v}" onchange="FP.updateSEEntry(${row.id},'${j}',this.value)"></td>`;
      });
      html += `<td class="fp-calculated text-end">${App.fmt(total)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeSonstigeEntgelteRow(${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
      return html;
    }).join('');

    let foot = '<tr class="fp-total"><td class="text-end"><strong>Summe</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => {
      const s = this.yearSubtotalSE(j);
      grandTotal += s;
      foot += `<td class="text-end"><strong>${App.fmt(s)}</strong></td>`;
    });
    foot += `<td class="text-end"><strong>${App.fmt(grandTotal)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Restore rpf textarea
    const rpfEl = document.getElementById('rpfSonstigeEntgelte');
    if (rpfEl && this.rpfBegruendung.SonstigeEntgelte) rpfEl.value = this.rpfBegruendung.SonstigeEntgelte;

    this.renderPersonalGesamt();
    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updateSEField(id, field, value) {
    const row = this.sonstigeEntgelte.find(r => r.id === id);
    if (row) { row[field] = value; }
  },

  updateSEEntry(id, jahr, value) {
    const row = this.sonstigeEntgelte.find(r => r.id === id);
    if (row) { row.entries[jahr] = App.parseNum(value); this.renderSonstigeEntgelte(); }
  },

  yearSubtotalSE(jahr) {
    return this.sonstigeEntgelte.reduce((s, r) => s + App.parseNum(r.entries[jahr]), 0);
  },

  // ============== SACHMITTEL (Materials) ==============
  addSachRow(section, data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    if (!this.sach[section]) this.sach[section] = [];
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      entries: {}
    };
    jahre.forEach(j => { row.entries[j] = data?.entries?.[j] || 0; });
    this.sach[section].push(row);
    this.renderSachTable(section);
    return row;
  },

  removeSachRow(section, id) {
    if (!this.sach[section]) return;
    this.sach[section] = this.sach[section].filter(r => r.id !== id);
    this.renderSachTable(section);
  },

  renderSachTable(section) {
    const jahre = App.jahre;
    const thead = document.getElementById(`thead${section}`);
    const tbody = document.getElementById(`tbody${section}`);
    const tfoot = document.getElementById(`tfoot${section}`);
    if (!thead) return;

    thead.innerHTML = '<tr><th>Bezeichnung</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th><th></th></tr>';

    const rows = this.sach[section] || [];
    tbody.innerHTML = rows.map(row => {
      let html = `<tr><td><input class="form-control fp-input-wide" maxlength="50" value="${this.esc(row.bezeichnung)}" onchange="FP.updateSachField('${section}',${row.id},'bezeichnung',this.value)"></td>`;
      let total = 0;
      jahre.forEach(j => {
        const v = App.parseNum(row.entries[j]);
        total += v;
        html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${v}" onchange="FP.updateSachEntry('${section}',${row.id},'${j}',this.value)"></td>`;
      });
      html += `<td class="fp-calculated text-end">${App.fmt(total)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeSachRow('${section}',${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
      return html;
    }).join('');

    // Footer
    let foot = '<tr class="fp-total"><td class="text-end"><strong>Summe</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => {
      const s = this.yearSubtotalSach(section, j);
      grandTotal += s;
      foot += `<td class="text-end"><strong>${App.fmt(s)}</strong></td>`;
    });
    foot += `<td class="text-end"><strong>${App.fmt(grandTotal)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Restore rpf textarea
    const rpfEl = document.getElementById(`rpf${section}`);
    if (rpfEl && this.rpfBegruendung[section]) rpfEl.value = this.rpfBegruendung[section];

    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updateSachField(section, id, field, value) {
    const row = (this.sach[section] || []).find(r => r.id === id);
    if (row) { row[field] = value; }
  },

  updateSachEntry(section, id, jahr, value) {
    const row = (this.sach[section] || []).find(r => r.id === id);
    if (row) { row.entries[jahr] = App.parseNum(value); this.renderSachTable(section); }
  },

  yearSubtotalSach(section, jahr) {
    return (this.sach[section] || []).reduce((s, r) => s + App.parseNum(r.entries[jahr]), 0);
  },

  // ============== AUFTRAG (Contractors) ==============
  addAuftragRow(data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      istBekannt: data?.istBekannt || 'Ja',
      nameAU: data?.nameAU || '',
      landAU: data?.landAU || 'Deutschland',
      plzAU: data?.plzAU || '',
      ortAU: data?.ortAU || '',
      entries: {}
    };
    jahre.forEach(j => { row.entries[j] = data?.entries?.[j] || 0; });
    this.auftrag.push(row);
    this.renderAuftragTable();
    return row;
  },

  removeAuftragRow(id) {
    this.auftrag = this.auftrag.filter(r => r.id !== id);
    this.renderAuftragTable();
  },

  renderAuftragTable() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadAuftrag');
    const tbody = document.getElementById('tbodyAuftrag');
    const tfoot = document.getElementById('tfootAuftrag');
    if (!thead) return;

    thead.innerHTML = '<tr><th>Art der Leistung</th><th>Bekannt</th><th>Auftragnehmer</th><th>Land</th><th>PLZ</th><th>Ort</th>'
      + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th><th></th></tr>';

    tbody.innerHTML = this.auftrag.map(row => {
      let html = `<tr>`;
      html += `<td><input class="form-control fp-input-wide" maxlength="200" value="${this.esc(row.bezeichnung)}" onchange="FP.updateAuftragField(${row.id},'bezeichnung',this.value)"></td>`;
      html += `<td><select class="form-select fp-input-narrow" onchange="FP.updateAuftragField(${row.id},'istBekannt',this.value)"><option${row.istBekannt==='Ja'?' selected':''}>Ja</option><option${row.istBekannt==='Nein'?' selected':''}>Nein</option></select></td>`;
      html += `<td><input class="form-control fp-input-wide" maxlength="200" value="${this.esc(row.nameAU)}" onchange="FP.updateAuftragField(${row.id},'nameAU',this.value)"></td>`;
      html += `<td><input class="form-control" style="width:100px" value="${this.esc(row.landAU)}" onchange="FP.updateAuftragField(${row.id},'landAU',this.value)"></td>`;
      html += `<td><input class="form-control fp-input-narrow" maxlength="15" value="${this.esc(row.plzAU)}" onchange="FP.updateAuftragField(${row.id},'plzAU',this.value)"></td>`;
      html += `<td><input class="form-control" style="width:100px" maxlength="50" value="${this.esc(row.ortAU)}" onchange="FP.updateAuftragField(${row.id},'ortAU',this.value)"></td>`;
      let total = 0;
      jahre.forEach(j => {
        const v = App.parseNum(row.entries[j]);
        total += v;
        html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${v}" onchange="FP.updateAuftragEntry(${row.id},'${j}',this.value)"></td>`;
      });
      html += `<td class="fp-calculated text-end">${App.fmt(total)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeAuftragRow(${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
      return html;
    }).join('');

    let foot = '<tr class="fp-total"><td colspan="6" class="text-end"><strong>Summe</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => {
      const s = this.yearSubtotalAuftrag(j);
      grandTotal += s;
      foot += `<td class="text-end"><strong>${App.fmt(s)}</strong></td>`;
    });
    foot += `<td class="text-end"><strong>${App.fmt(grandTotal)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Restore rpf textarea
    const rpfEl = document.getElementById('rpfAuftrag');
    if (rpfEl && this.rpfBegruendung.Auftrag) rpfEl.value = this.rpfBegruendung.Auftrag;

    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updateAuftragField(id, field, value) {
    const row = this.auftrag.find(r => r.id === id);
    if (row) { row[field] = value; }
  },

  updateAuftragEntry(id, jahr, value) {
    const row = this.auftrag.find(r => r.id === id);
    if (row) { row.entries[jahr] = App.parseNum(value); this.renderAuftragTable(); }
  },

  yearSubtotalAuftrag(jahr) {
    return this.auftrag.reduce((s, r) => s + App.parseNum(r.entries[jahr]), 0);
  },

  // ============== REISEN (Travel) ==============
  addReisenRow(section, jahr, data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    if (!jahr) jahr = jahre[0];
    if (!this.reisen[section]) this.reisen[section] = {};
    if (!this.reisen[section][jahr]) this.reisen[section][jahr] = [];
    const row = {
      id: data?.id || this.genId(),
      reiseziel: data?.reiseziel || '',
      reisezweck: data?.reisezweck || '',
      reisedauer: data?.reisedauer || 1,
      betrag: data?.betrag || 0
    };
    this.reisen[section][jahr].push(row);
    this.renderReisenTable(section);
    this.saveToStorage();
    return row;
  },

  removeReisenRow(section, jahr, id) {
    if (this.reisen[section]?.[jahr]) {
      this.reisen[section][jahr] = this.reisen[section][jahr].filter(r => r.id !== id);
    }
    this.renderReisenTable(section);
    this.saveToStorage();
  },

  renderReisenTable(section) {
    const jahre = App.jahre;
    const container = document.getElementById(`reisen${section}`);
    if (!container) return;

    const sectionData = this.reisen[section] || {};
    let html = '';

    // Per-year tables
    jahre.forEach(j => {
      const rows = sectionData[j] || [];
      html += `<div class="mb-2">`;
      html += `<div class="d-flex justify-content-between align-items-center mb-1">`;
      html += `<strong class="small">${j}</strong>`;
      html += `<button class="btn btn-outline-success btn-sm" style="padding:0 5px;font-size:.7rem;" onclick="FP.addReisenRow('${section}','${j}')"><i class="bi bi-plus"></i></button>`;
      html += `</div>`;
      html += `<table class="table table-sm table-bordered mb-0"><thead class="table-light"><tr><th>Reiseziel</th><th>Zweck</th><th>Tage</th><th class="text-end">Betrag</th><th></th></tr></thead><tbody>`;
      if (rows.length === 0) {
        html += `<tr><td colspan="5" class="text-muted text-center small">Keine Eintr&auml;ge</td></tr>`;
      } else {
        rows.forEach(row => {
          html += `<tr>`;
          html += `<td><input class="form-control form-control-sm" maxlength="50" value="${this.esc(row.reiseziel)}" onchange="FP.updateReisenField('${section}','${j}',${row.id},'reiseziel',this.value)"></td>`;
          html += `<td><input class="form-control form-control-sm" maxlength="50" value="${this.esc(row.reisezweck)}" onchange="FP.updateReisenField('${section}','${j}',${row.id},'reisezweck',this.value)"></td>`;
          html += `<td><input type="number" class="form-control form-control-sm fp-input-narrow" value="${row.reisedauer}" onchange="FP.updateReisenField('${section}','${j}',${row.id},'reisedauer',this.value)"></td>`;
          html += `<td><input type="number" step="0.01" class="form-control form-control-sm fp-input" value="${App.parseNum(row.betrag)}" onchange="FP.updateReisenField('${section}','${j}',${row.id},'betrag',this.value)"></td>`;
          html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeReisenRow('${section}','${j}',${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
        });
      }
      const yearTotal = rows.reduce((s, r) => s + App.parseNum(r.betrag), 0);
      html += `</tbody><tfoot class="table-warning"><tr><td colspan="3" class="text-end"><strong>Summe ${j}</strong></td><td class="text-end"><strong>${App.fmt(yearTotal)}</strong></td><td></td></tr></tfoot></table>`;
      html += `</div>`;
    });

    // Grand total
    let grandTotal = 0;
    jahre.forEach(j => { grandTotal += this.yearSubtotalReisen(section, j); });
    html += `<div class="text-end fp-grand-total p-1 rounded small">Gesamt: ${App.fmt(grandTotal)}</div>`;

    container.innerHTML = html;

    // Restore rpf textarea
    const rpfEl = document.getElementById(`rpf${section}`);
    if (rpfEl && this.rpfBegruendung[section]) rpfEl.value = this.rpfBegruendung[section];

    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updateReisenField(section, jahr, id, field, value) {
    const rows = this.reisen[section]?.[jahr] || [];
    const row = rows.find(r => r.id === id);
    if (row) {
      row[field] = (field === 'reisedauer' || field === 'betrag') ? App.parseNum(value) : value;
      if (field === 'betrag') this.renderReisenTable(section);
      this.saveToStorage();
    }
  },

  yearSubtotalReisen(section, jahr) {
    return (this.reisen[section]?.[jahr] || []).reduce((s, r) => s + App.parseNum(r.betrag), 0);
  },

  // ============== INVESTITIONEN ==============
  addInvestRow(data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      entries: {}
    };
    jahre.forEach(j => {
      row.entries[j] = data?.entries?.[j] || { preis: 0, anzahl: 0 };
    });
    this.invest.push(row);
    this.renderInvestTable();
    return row;
  },

  removeInvestRow(id) {
    this.invest = this.invest.filter(r => r.id !== id);
    this.renderInvestTable();
  },

  renderInvestTable() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadGesamteInvestitionen');
    const tbody = document.getElementById('tbodyGesamteInvestitionen');
    const tfoot = document.getElementById('tfootGesamteInvestitionen');
    if (!thead) return;

    let hdr = '<tr><th rowspan="2">Bezeichnung</th>';
    jahre.forEach(j => hdr += `<th colspan="3" class="text-center">${j}</th>`);
    hdr += '<th rowspan="2" class="text-end">Gesamt</th><th rowspan="2"></th></tr><tr>';
    jahre.forEach(() => hdr += '<th>Preis</th><th>Anzahl</th><th>Summe</th>');
    hdr += '</tr>';
    thead.innerHTML = hdr;

    tbody.innerHTML = this.invest.map(row => {
      let html = `<tr>`;
      html += `<td><input class="form-control fp-input-wide" maxlength="50" value="${this.esc(row.bezeichnung)}" onchange="FP.updateInvestField(${row.id},'bezeichnung',this.value)"></td>`;
      let total = 0;
      jahre.forEach(j => {
        const e = row.entries[j] || { preis: 0, anzahl: 0 };
        const sum = App.parseNum(e.preis) * App.parseNum(e.anzahl);
        total += sum;
        html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${App.parseNum(e.preis)}" onchange="FP.updateInvestEntry(${row.id},'${j}','preis',this.value)"></td>`;
        html += `<td><input type="number" class="form-control fp-input-narrow" value="${App.parseNum(e.anzahl)}" onchange="FP.updateInvestEntry(${row.id},'${j}','anzahl',this.value)"></td>`;
        html += `<td class="fp-calculated text-end">${App.fmt(sum)}</td>`;
      });
      html += `<td class="fp-calculated text-end">${App.fmt(total)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeInvestRow(${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
      return html;
    }).join('');

    let foot = '<tr class="fp-total"><td class="text-end"><strong>Summe</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => {
      const s = this.yearSubtotalInvest(j);
      grandTotal += s;
      foot += `<td colspan="2"></td><td class="text-end"><strong>${App.fmt(s)}</strong></td>`;
    });
    foot += `<td class="text-end"><strong>${App.fmt(grandTotal)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Restore rpf textarea
    const rpfEl = document.getElementById('rpfGesamteInvestitionen');
    if (rpfEl && this.rpfBegruendung.GesamteInvestitionen) rpfEl.value = this.rpfBegruendung.GesamteInvestitionen;

    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  updateInvestField(id, field, value) {
    const row = this.invest.find(r => r.id === id);
    if (row) { row[field] = value; }
  },

  updateInvestEntry(id, jahr, field, value) {
    const row = this.invest.find(r => r.id === id);
    if (row) {
      if (!row.entries[jahr]) row.entries[jahr] = { preis: 0, anzahl: 0 };
      row.entries[jahr][field] = App.parseNum(value);
      this.renderInvestTable();
    }
  },

  yearSubtotalInvest(jahr) {
    return this.invest.reduce((s, r) => {
      const e = r.entries[jahr] || { preis: 0, anzahl: 0 };
      return s + App.parseNum(e.preis) * App.parseNum(e.anzahl);
    }, 0);
  },

  // ============== MITTEL DRITTER (Third-party funds table) ==============
  addMittelDritterRow(data) {
    const jahre = App.jahre;
    if (jahre.length === 0) { alert('Bitte zuerst Projektlaufzeit eingeben.'); return; }
    const row = {
      id: data?.id || this.genId(),
      bezeichnung: data?.bezeichnung || '',
      grund: data?.grund || '',
      entries: {}
    };
    jahre.forEach(j => { row.entries[j] = data?.entries?.[j] || 0; });
    this.mittelDritterRows.push(row);
    this.renderMittelDritterTable();
    return row;
  },

  removeMittelDritterRow(id) {
    this.mittelDritterRows = this.mittelDritterRows.filter(r => r.id !== id);
    this.renderMittelDritterTable();
  },

  renderMittelDritterTable() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadMittelDritter');
    const tbody = document.getElementById('tbodyMittelDritter');
    const tfoot = document.getElementById('tfootMittelDritter');
    if (!thead) return;

    thead.innerHTML = '<tr><th>Quelle</th><th>Grund</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th><th></th></tr>';

    tbody.innerHTML = this.mittelDritterRows.map(row => {
      let html = `<tr>`;
      html += `<td><input class="form-control fp-input-wide" value="${this.esc(row.bezeichnung)}" onchange="FP.updateMDField(${row.id},'bezeichnung',this.value)" maxlength="50"></td>`;
      html += `<td><input class="form-control fp-input-wide" value="${this.esc(row.grund)}" onchange="FP.updateMDField(${row.id},'grund',this.value)" maxlength="50"></td>`;
      let total = 0;
      jahre.forEach(j => {
        const v = App.parseNum(row.entries[j]);
        total += v;
        html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${v}" onchange="FP.updateMDEntry(${row.id},'${j}',this.value)"></td>`;
      });
      html += `<td class="fp-calculated text-end">${App.fmt(total)}</td>`;
      html += `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeMittelDritterRow(${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
      return html;
    }).join('');

    // Footer totals
    let foot = '<tr class="fp-total"><td colspan="2" class="text-end"><strong>Summe</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => {
      const s = this.yearSubtotalMittelDritter(j);
      grandTotal += s;
      foot += `<td class="text-end"><strong>${App.fmt(s)}</strong></td>`;
    });
    foot += `<td class="text-end"><strong>${App.fmt(grandTotal)}</strong></td><td></td></tr>`;
    tfoot.innerHTML = foot;

    // Sync into finanz.mittelDritter for financing calculation
    jahre.forEach(j => { this.finanz.mittelDritter[j] = this.yearSubtotalMittelDritter(j); });
    this.renderFinanzierung();
  },

  updateMDField(id, field, value) {
    const row = this.mittelDritterRows.find(r => r.id === id);
    if (row) row[field] = value;
  },

  updateMDEntry(id, jahr, value) {
    const row = this.mittelDritterRows.find(r => r.id === id);
    if (row) { row.entries[jahr] = App.parseNum(value); this.renderMittelDritterTable(); }
  },

  yearSubtotalMittelDritter(jahr) {
    return this.mittelDritterRows.reduce((s, r) => s + App.parseNum(r.entries[jahr]), 0);
  },

  // ============== KOOPERATIONSPARTNER ==============
  addKopiRow(data) {
    const row = {
      id: data?.id || this.genId(),
      name: data?.name || '',
      plz: data?.plz || '',
      ort: data?.ort || '',
      land: data?.land || 'Deutschland',
      rolle: data?.rolle || 'Mitglied der Arbeitsgemeinschaft',
      fkz: data?.fkz || ''
    };
    this.kopiPartner.push(row);
    this.renderKopiTable();
    this.saveToStorage();
    return row;
  },

  removeKopiRow(id) {
    this.kopiPartner = this.kopiPartner.filter(r => r.id !== id);
    this.renderKopiTable();
    this.saveToStorage();
  },

  updateKopiField(id, field, value) {
    const row = this.kopiPartner.find(r => r.id === id);
    if (row) { row[field] = value; this.saveToStorage(); }
  },

  renderKopiTable() {
    const tbody = document.getElementById('tbodyKopiPartner');
    if (!tbody) return;

    tbody.innerHTML = this.kopiPartner.map(row => {
      const selGF = row.rolle.startsWith('Gesch') ? ' selected' : '';
      const selMA = !selGF ? ' selected' : '';
      return `<tr>` +
        `<td><input class="form-control form-control-sm" value="${this.esc(row.name)}" onchange="FP.updateKopiField(${row.id},'name',this.value)"></td>` +
        `<td><input class="form-control form-control-sm" style="width:80px" value="${this.esc(row.plz)}" maxlength="15" onchange="FP.updateKopiField(${row.id},'plz',this.value)"></td>` +
        `<td><input class="form-control form-control-sm" value="${this.esc(row.ort)}" onchange="FP.updateKopiField(${row.id},'ort',this.value)"></td>` +
        `<td><input class="form-control form-control-sm" style="width:100px" value="${this.esc(row.land)}" onchange="FP.updateKopiField(${row.id},'land',this.value)"></td>` +
        `<td><select class="form-select form-select-sm" onchange="FP.updateKopiField(${row.id},'rolle',this.value)">` +
          `<option value="Geschäftsführung / Federführung der Arbeitsgemeinschaft"${selGF}>Federführung</option>` +
          `<option value="Mitglied der Arbeitsgemeinschaft"${selMA}>Mitglied</option>` +
        `</select></td>` +
        `<td><input class="form-control form-control-sm" style="width:130px" value="${this.esc(row.fkz)}" onchange="FP.updateKopiField(${row.id},'fkz',this.value)"></td>` +
        `<td><button class="btn btn-danger btn-del-row" onclick="FP.removeKopiRow(${row.id})"><i class="bi bi-x"></i></button></td></tr>`;
    }).join('');
  },

  // ============== TOTALS ==============
  totalSachPerYear(jahr) {
    let total = this.sachSections.reduce((s, sec) => s + this.yearSubtotalSach(sec, jahr), 0);
    total += this.yearSubtotalAuftrag(jahr);
    total += this.yearSubtotalReisen('Inlandreisen', jahr);
    total += this.yearSubtotalReisen('Auslandreisen', jahr);
    total += this.yearSubtotalInvest(jahr);
    return total;
  },

  totalAusgabenPerYear(jahr) {
    return this.totalPersonalPerYear(jahr) + this.totalSachPerYear(jahr);
  },

  renderAusgabenGesamt() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadAusgabenGesamt');
    const tbody = document.getElementById('tbodyAusgabenGesamt');
    if (!thead) return;

    thead.innerHTML = '<th>Position</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th>';

    const categories = [
      { label: 'Personal', fn: (j) => this.totalPersonalPerYear(j) },
      { label: 'Sachmittel', fn: (j) => this.totalSachPerYear(j) },
    ];

    let html = '';
    categories.forEach(cat => {
      html += `<tr><td>${cat.label}</td>`;
      let total = 0;
      jahre.forEach(j => { const v = cat.fn(j); total += v; html += `<td class="text-end">${App.fmt(v)}</td>`; });
      html += `<td class="text-end fw-bold">${App.fmt(total)}</td></tr>`;
    });

    html += '<tr class="fp-grand-total"><td><strong>Ausgaben Gesamt</strong></td>';
    let grandTotal = 0;
    jahre.forEach(j => { const v = this.totalAusgabenPerYear(j); grandTotal += v; html += `<td class="text-end">${App.fmt(v)}</td>`; });
    html += `<td class="text-end">${App.fmt(grandTotal)}</td></tr>`;

    tbody.innerHTML = html;
  },

  // ============== FINANZIERUNG ==============
  renderFinanzierung() {
    const jahre = App.jahre;
    const thead = document.getElementById('theadFinanzierung');
    const tbody = document.getElementById('tbodyFinanzierung');
    if (!thead) return;

    thead.innerHTML = '<tr><th>Position</th>' + jahre.map(j => `<th class="text-end">${j}</th>`).join('') + '<th class="text-end">Gesamt</th></tr>';

    const ppSatz = App.parseNum(document.getElementById('ppSatz')?.value) || 20;

    let html = '';

    // Row: Ausgaben
    html += '<tr><td>Ausgaben (Kosten)</td>';
    let totalKosten = 0;
    jahre.forEach(j => { const v = this.totalAusgabenPerYear(j); totalKosten += v; html += `<td class="text-end">${App.fmt(v)}</td>`; });
    html += `<td class="text-end fw-bold">${App.fmt(totalKosten)}</td></tr>`;

    // Row: Mittel Dritter (from MittelDritter rows table)
    html += '<tr><td>Mittel Dritter</td>';
    let totalMD = 0;
    jahre.forEach(j => {
      const v = App.parseNum(this.finanz.mittelDritter[j]);
      totalMD += v;
      html += `<td class="text-end">${App.fmt(v)}</td>`;
    });
    html += `<td class="text-end fw-bold">${App.fmt(totalMD)}</td></tr>`;

    // Row: Eigenmittel (editable)
    html += '<tr><td>Eigenmittel</td>';
    let totalEM = 0;
    jahre.forEach(j => {
      const v = App.parseNum(this.finanz.eigenmittel[j]);
      totalEM += v;
      html += `<td><input type="number" step="0.01" class="form-control fp-input" value="${v}" onchange="FP.updateFinanz('eigenmittel','${j}',this.value)"></td>`;
    });
    html += `<td class="text-end fw-bold">${App.fmt(totalEM)}</td></tr>`;

    // Row: Zuwendung (calculated)
    html += '<tr class="table-success"><td><strong>Zuwendung (berechnet)</strong></td>';
    let totalZuw = 0;
    jahre.forEach(j => {
      const kosten = this.totalAusgabenPerYear(j);
      const md = App.parseNum(this.finanz.mittelDritter[j]);
      const em = App.parseNum(this.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      totalZuw += zuw;
      html += `<td class="text-end fw-bold">${App.fmt(zuw)}</td>`;
    });
    html += `<td class="text-end fw-bold">${App.fmt(totalZuw)}</td></tr>`;

    // Row: Förderquote
    html += '<tr><td>Förderquote (%)</td>';
    jahre.forEach(j => {
      const kosten = this.totalAusgabenPerYear(j);
      const md = App.parseNum(this.finanz.mittelDritter[j]);
      const em = App.parseNum(this.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      const quote = kosten > 0 ? (zuw / kosten * 100) : 0;
      html += `<td class="text-end">${App.fmtPct(quote)}</td>`;
    });
    const totalQuote = totalKosten > 0 ? (totalZuw / totalKosten * 100) : 0;
    html += `<td class="text-end fw-bold">${App.fmtPct(totalQuote)}</td></tr>`;

    // Row: Projektpauschale
    html += `<tr class="table-warning"><td><strong>Projektpauschale (${ppSatz}%)</strong></td>`;
    let totalPP = 0;
    jahre.forEach(j => {
      const kosten = this.totalAusgabenPerYear(j);
      const md = App.parseNum(this.finanz.mittelDritter[j]);
      const em = App.parseNum(this.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      const pp = zuw * ppSatz / 100;
      totalPP += pp;
      html += `<td class="text-end fw-bold">${App.fmt(pp)}</td>`;
    });
    html += `<td class="text-end fw-bold">${App.fmt(totalPP)}</td></tr>`;

    // Row: Gesamtbetrag
    html += '<tr class="fp-grand-total"><td><strong>Gesamtbetrag (Zuwendung + PP)</strong></td>';
    let totalGesamt = 0;
    jahre.forEach(j => {
      const kosten = this.totalAusgabenPerYear(j);
      const md = App.parseNum(this.finanz.mittelDritter[j]);
      const em = App.parseNum(this.finanz.eigenmittel[j]);
      const zuw = kosten - md - em;
      const pp = zuw * ppSatz / 100;
      const gesamt = zuw + pp;
      totalGesamt += gesamt;
      html += `<td class="text-end">${App.fmt(gesamt)}</td>`;
    });
    html += `<td class="text-end">${App.fmt(totalGesamt)}</td></tr>`;

    tbody.innerHTML = html;
  },

  updateFinanz(type, jahr, value) {
    this.finanz[type][jahr] = App.parseNum(value);
    this.renderFinanzierung();
  },

  // ============== REBUILD ALL ==============
  rebuildAllTables() {
    ['tarif1','tarif2','tarif3'].forEach(t => {
      this.personal[t].forEach(row => {
        App.jahre.forEach(j => {
          if (!row.entries[j]) row.entries[j] = { basis: 0, zuschlag: 0, anzahl: 0 };
        });
      });
      this.renderPersonTable(t);
    });
    this.sonstigeEntgelte.forEach(row => {
      App.jahre.forEach(j => { if (row.entries[j] === undefined) row.entries[j] = 0; });
    });
    this.renderSonstigeEntgelte();
    this.sachSections.forEach(s => {
      (this.sach[s] || []).forEach(row => {
        App.jahre.forEach(j => { if (row.entries[j] === undefined) row.entries[j] = 0; });
      });
      this.renderSachTable(s);
    });
    this.auftrag.forEach(row => {
      App.jahre.forEach(j => { if (row.entries[j] === undefined) row.entries[j] = 0; });
    });
    this.renderAuftragTable();
    ['Inlandreisen','Auslandreisen'].forEach(s => {
      if (!this.reisen[s] || Array.isArray(this.reisen[s])) this.reisen[s] = {};
      this.renderReisenTable(s);
    });
    this.invest.forEach(row => {
      App.jahre.forEach(j => {
        if (!row.entries[j]) row.entries[j] = { preis: 0, anzahl: 0 };
      });
    });
    this.renderInvestTable();
    this.mittelDritterRows.forEach(row => {
      App.jahre.forEach(j => { if (row.entries[j] === undefined) row.entries[j] = 0; });
    });
    this.renderMittelDritterTable();
    this.renderKopiTable();
    this.renderAusgabenGesamt();
    this.renderFinanzierung();
  },

  // ============== STORAGE ==============
  saveToStorage() {
    const ppEl = document.getElementById('ppSatz');
    const swEl = document.getElementById('chkStrategieWaehlbar');
    localStorage.setItem('eoFinanzplan', JSON.stringify({
      personal: this.personal,
      sonstigeEntgelte: this.sonstigeEntgelte,
      sach: this.sach,
      auftrag: this.auftrag,
      reisen: this.reisen,
      invest: this.invest,
      finanz: this.finanz,
      rpfBegruendung: this.rpfBegruendung,
      mittelDritterRows: this.mittelDritterRows,
      kopiPartner: this.kopiPartner,
      _nextId: this._nextId,
      ppSatz: ppEl ? ppEl.value : '20',
      strategieWaehlbar: swEl ? swEl.checked : true
    }));
  },

  loadFromStorage() {
    const raw = localStorage.getItem('eoFinanzplan');
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.personal) this.personal = d.personal;
      if (d.sonstigeEntgelte) this.sonstigeEntgelte = d.sonstigeEntgelte;
      if (d.sach) this.sach = d.sach;
      if (d.auftrag) this.auftrag = d.auftrag;
      if (d.reisen) {
        // Migrate old array-based format to per-year format
        ['Inlandreisen', 'Auslandreisen'].forEach(s => {
          if (Array.isArray(d.reisen[s])) {
            const perYear = {};
            d.reisen[s].forEach(row => {
              Object.entries(row.entries || {}).forEach(([j, amt]) => {
                if (App.parseNum(amt) !== 0) {
                  if (!perYear[j]) perYear[j] = [];
                  perYear[j].push({ id: row.id || this.genId(), reiseziel: row.reiseziel || '', reisezweck: row.reisezweck || '', reisedauer: row.reisedauer || 1, betrag: App.parseNum(amt) });
                }
              });
            });
            d.reisen[s] = perYear;
          }
        });
        this.reisen = d.reisen;
      }
      if (d.invest) this.invest = d.invest;
      if (d.finanz) this.finanz = d.finanz;
      if (d.rpfBegruendung) this.rpfBegruendung = d.rpfBegruendung;
      if (d.mittelDritterRows) this.mittelDritterRows = d.mittelDritterRows;
      if (d.kopiPartner) this.kopiPartner = d.kopiPartner;
      if (d._nextId) this._nextId = d._nextId;
      if (d.ppSatz !== undefined) {
        const ppEl = document.getElementById('ppSatz');
        if (ppEl) ppEl.value = d.ppSatz;
      }
      if (d.strategieWaehlbar !== undefined) {
        const swEl = document.getElementById('chkStrategieWaehlbar');
        if (swEl) swEl.checked = d.strategieWaehlbar;
      }
    } catch (e) { /* ignore */ }
  },

  // Escape HTML
  esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
};

if (typeof module !== 'undefined' && module.exports) module.exports = FP;
