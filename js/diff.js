// ============================================================
// diff.js - Snapshot & diff view for form and Finanzplan data
// ============================================================
'use strict';

const Diff = {
  baseline: null,
  comparison: null,
  mode: 'baseline', // 'baseline' or 'comparison'

  // Tab pane IDs → display labels
  tabLabels: {
    tabKerndaten: '1. Kerndaten',
    tabInstitutionen: '2. Institutionen',
    tabAnsprechpartner: '3. Ansprechpartner',
    tabPersonal: '4. Personal',
    tabSachmittel: '5. Sachmittel',
    tabFinanzierung: '6. Finanzierung',
    tabErklaerungen: '7. Erkl\u00e4rungen'
  },

  // ---- Snapshot ----
  captureSnapshot() {
    // Form fields
    const fields = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      const key = el.getAttribute('data-field');
      if (el.type === 'checkbox') fields[key] = el.checked ? 'Ja' : 'Nein';
      else fields[key] = el.value || '';
    });

    // FP data (deep clone)
    const fp = JSON.parse(JSON.stringify({
      personal: FP.personal,
      sonstigeEntgelte: FP.sonstigeEntgelte,
      sach: FP.sach,
      auftrag: FP.auftrag,
      reisen: FP.reisen,
      invest: FP.invest,
      finanz: FP.finanz,
      rpfBegruendung: FP.rpfBegruendung,
      mittelDritterRows: FP.mittelDritterRows,
      kopiPartner: FP.kopiPartner
    }));

    return { fields, fp };
  },

  setBaseline(snapshot) {
    this.baseline = snapshot;
    try { localStorage.setItem('eoDiffBaseline', JSON.stringify(snapshot)); } catch (e) { /* ignore */ }
  },

  setComparison(snapshot) {
    this.comparison = snapshot;
  },

  clearBaseline() {
    this.baseline = null;
    localStorage.removeItem('eoDiffBaseline');
  },

  loadBaseline() {
    const raw = localStorage.getItem('eoDiffBaseline');
    if (raw) {
      try { this.baseline = JSON.parse(raw); } catch (e) { /* ignore */ }
    }
  },

  // ---- Field → tab mapping ----
  buildFieldTabMap() {
    const map = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      const pane = el.closest('.tab-pane');
      if (pane) map[el.getAttribute('data-field')] = pane.id;
    });
    return map;
  },

  // ---- Field → label mapping ----
  buildFieldLabelMap() {
    const map = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      const key = el.getAttribute('data-field');
      let label = '';
      const lbl = el.closest('.col-md-12, .col-md-4, .col-md-6, .col-md-8, .col-lg-6, .col-lg-8, .col-lg-4, .col-md-3, .col-lg-3, .col-md-2')?.querySelector('.form-label');
      if (lbl) label = lbl.textContent.trim();
      if (!label) {
        const p = el.closest('label');
        if (p) label = p.textContent.trim();
      }
      map[key] = label || key;
    });
    return map;
  },

  // ---- Compute diff ----
  computeDiff(oldSnap, newSnap) {
    const result = { fields: [], fp: [] };

    // 1. Form fields
    const allKeys = new Set([...Object.keys(oldSnap.fields), ...Object.keys(newSnap.fields)]);
    allKeys.forEach(key => {
      const oldVal = oldSnap.fields[key] ?? '';
      const newVal = newSnap.fields[key] ?? '';
      if (oldVal !== newVal) {
        result.fields.push({ key, oldVal, newVal });
      }
    });

    // 2. FP sections
    this.diffPersonal(oldSnap.fp, newSnap.fp, result);
    this.diffArraySection(oldSnap.fp.sonstigeEntgelte, newSnap.fp.sonstigeEntgelte, 'Sonstige Entgelte', result, this.describeSimpleRow);
    this.diffSach(oldSnap.fp, newSnap.fp, result);
    this.diffArraySection(oldSnap.fp.auftrag, newSnap.fp.auftrag, 'Auftr\u00e4ge', result, this.describeAuftragRow);
    this.diffReisen(oldSnap.fp, newSnap.fp, result);
    this.diffArraySection(oldSnap.fp.invest, newSnap.fp.invest, 'Investitionen', result, this.describeInvestRow);
    this.diffFinanz(oldSnap.fp, newSnap.fp, result);
    this.diffRpfBegruendung(oldSnap.fp, newSnap.fp, result);
    this.diffArraySection(oldSnap.fp.mittelDritterRows, newSnap.fp.mittelDritterRows, 'Mittel Dritter', result, this.describeMittelDritterRow);
    this.diffKopiPartner(oldSnap.fp, newSnap.fp, result);

    return result;
  },

  // ---- Personal diff ----
  diffPersonal(oldFp, newFp, result) {
    ['tarif1', 'tarif2', 'tarif3'].forEach(tarif => {
      const label = tarif === 'tarif1' ? 'Tarif 1' : tarif === 'tarif2' ? 'Tarif 2' : 'Tarif 3';
      const isTarif3 = tarif === 'tarif3';
      this.diffArraySection(
        oldFp.personal[tarif] || [], newFp.personal[tarif] || [],
        label, result,
        (row) => this.describePersonRow(row, isTarif3)
      );
    });
  },

  describePersonRow(row, isTarif3) {
    const parts = [row.bezeichnung || '(ohne Bezeichnung)'];
    if (!isTarif3) {
      if (row.nn) parts.push('N.N.: ' + row.nn);
      if (row.tarifgruppe) parts.push(row.tarifgruppe);
    } else {
      if (row.artikelArt) parts.push(row.artikelArt);
    }
    return parts.join(' \u2013 ');
  },

  describeSimpleRow(row) {
    return row.bezeichnung || '(ohne Bezeichnung)';
  },

  describeAuftragRow(row) {
    return row.bezeichnung || '(ohne Bezeichnung)';
  },

  describeInvestRow(row) {
    return row.bezeichnung || '(ohne Bezeichnung)';
  },

  describeMittelDritterRow(row) {
    return row.bezeichnung || '(ohne Bezeichnung)';
  },

  // ---- Generic array section diff (by row id) ----
  diffArraySection(oldArr, newArr, sectionLabel, result, descFn) {
    oldArr = oldArr || [];
    newArr = newArr || [];
    const oldMap = new Map(oldArr.map(r => [r.id, r]));
    const newMap = new Map(newArr.map(r => [r.id, r]));
    const changes = [];

    // Removed rows
    oldArr.forEach(row => {
      if (!newMap.has(row.id)) {
        changes.push({ type: 'removed', desc: descFn(row), details: [] });
      }
    });

    // Added rows
    newArr.forEach(row => {
      if (!oldMap.has(row.id)) {
        changes.push({ type: 'added', desc: descFn(row), details: [] });
      }
    });

    // Changed rows
    newArr.forEach(row => {
      if (oldMap.has(row.id)) {
        const oldRow = oldMap.get(row.id);
        const diffs = this.diffRowFields(oldRow, row);
        if (diffs.length > 0) {
          changes.push({ type: 'changed', desc: descFn(row), details: diffs });
        }
      }
    });

    if (changes.length > 0) {
      result.fp.push({ section: sectionLabel, tab: 'tabPersonal', changes });
    }
  },

  // ---- Compare two row objects field by field ----
  diffRowFields(oldRow, newRow) {
    const diffs = [];
    const skip = new Set(['id']);
    const allKeys = new Set([...Object.keys(oldRow), ...Object.keys(newRow)]);

    allKeys.forEach(key => {
      if (skip.has(key)) return;
      const oldVal = oldRow[key];
      const newVal = newRow[key];

      if (key === 'entries') {
        // Compare entries (year-keyed objects)
        this.diffEntries(oldVal || {}, newVal || {}, diffs);
      } else if (typeof oldVal === 'object' || typeof newVal === 'object') {
        // Skip nested objects other than entries
      } else {
        const o = String(oldVal ?? '');
        const n = String(newVal ?? '');
        if (o !== n) diffs.push({ field: key, oldVal: o, newVal: n });
      }
    });
    return diffs;
  },

  // ---- Compare entries objects ----
  diffEntries(oldEntries, newEntries, diffs) {
    const years = new Set([...Object.keys(oldEntries), ...Object.keys(newEntries)]);
    years.forEach(year => {
      const oldE = oldEntries[year];
      const newE = newEntries[year];
      if (oldE === undefined && newE !== undefined) {
        if (typeof newE === 'object') {
          Object.entries(newE).forEach(([k, v]) => {
            if (v) diffs.push({ field: year + ' ' + k, oldVal: '', newVal: String(v) });
          });
        } else if (newE) {
          diffs.push({ field: year, oldVal: '', newVal: String(newE) });
        }
      } else if (oldE !== undefined && newE === undefined) {
        if (typeof oldE === 'object') {
          Object.entries(oldE).forEach(([k, v]) => {
            if (v) diffs.push({ field: year + ' ' + k, oldVal: String(v), newVal: '' });
          });
        } else if (oldE) {
          diffs.push({ field: year, oldVal: String(oldE), newVal: '' });
        }
      } else if (typeof oldE === 'object' && typeof newE === 'object') {
        const subKeys = new Set([...Object.keys(oldE), ...Object.keys(newE)]);
        subKeys.forEach(sk => {
          const o = String(oldE[sk] ?? '');
          const n = String(newE[sk] ?? '');
          if (o !== n) diffs.push({ field: year + ' ' + sk, oldVal: o, newVal: n });
        });
      } else {
        const o = String(oldE ?? '');
        const n = String(newE ?? '');
        if (o !== n) diffs.push({ field: year, oldVal: o, newVal: n });
      }
    });
  },

  // ---- Sach diff ----
  diffSach(oldFp, newFp, result) {
    const sections = new Set([
      ...Object.keys(oldFp.sach || {}),
      ...Object.keys(newFp.sach || {})
    ]);
    sections.forEach(sec => {
      this.diffArraySection(
        (oldFp.sach || {})[sec] || [], (newFp.sach || {})[sec] || [],
        'Sachmittel: ' + sec, result, this.describeSimpleRow
      );
    });
  },

  // ---- Reisen diff (per-year structure) ----
  diffReisen(oldFp, newFp, result) {
    ['Inlandreisen', 'Auslandreisen'].forEach(sec => {
      const oldData = (oldFp.reisen || {})[sec] || {};
      const newData = (newFp.reisen || {})[sec] || {};
      const allYears = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      allYears.forEach(jahr => {
        const oldArr = oldData[jahr] || [];
        const newArr = newData[jahr] || [];
        this.diffArraySection(oldArr, newArr, sec + ' ' + jahr, result, (row) => {
          return [row.reiseziel, row.reisezweck].filter(Boolean).join(' \u2013 ') || '(ohne Bezeichnung)';
        });
      });
    });
  },

  // ---- Finanz diff ----
  diffFinanz(oldFp, newFp, result) {
    const changes = [];
    ['mittelDritter', 'eigenmittel'].forEach(key => {
      const label = key === 'mittelDritter' ? 'Mittel Dritter (Summen)' : 'Eigenmittel';
      const oldObj = (oldFp.finanz || {})[key] || {};
      const newObj = (newFp.finanz || {})[key] || {};
      const years = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      years.forEach(year => {
        const o = String(oldObj[year] ?? '');
        const n = String(newObj[year] ?? '');
        if (o !== n) {
          changes.push({ type: 'changed', desc: label, details: [{ field: year, oldVal: o, newVal: n }] });
        }
      });
    });
    if (changes.length > 0) {
      result.fp.push({ section: 'Finanzierung', tab: 'tabFinanzierung', changes });
    }
  },

  // ---- rpfBegruendung diff ----
  diffRpfBegruendung(oldFp, newFp, result) {
    const oldRpf = oldFp.rpfBegruendung || {};
    const newRpf = newFp.rpfBegruendung || {};
    const allKeys = new Set([...Object.keys(oldRpf), ...Object.keys(newRpf)]);
    const changes = [];
    allKeys.forEach(key => {
      const o = oldRpf[key] || '';
      const n = newRpf[key] || '';
      if (o !== n) {
        changes.push({ type: 'changed', desc: key, details: [{ field: 'Begr\u00fcndung', oldVal: o, newVal: n }] });
      }
    });
    if (changes.length > 0) {
      result.fp.push({ section: 'Begr\u00fcndungen (rpf)', tab: 'tabSachmittel', changes });
    }
  },

  // ---- KopiPartner diff ----
  diffKopiPartner(oldFp, newFp, result) {
    const oldArr = oldFp.kopiPartner || [];
    const newArr = newFp.kopiPartner || [];
    this.diffArraySection(oldArr, newArr, 'Kooperationspartner', result, (row) => {
      return row.name || '(ohne Name)';
    });
  },

  // ---- Rendering ----
  renderDiff() {
    const container = document.getElementById('diffOutput');
    if (!container) return;

    const refSnap = this.mode === 'comparison' && this.comparison ? this.comparison : this.baseline;
    if (!refSnap) {
      container.innerHTML = '<div class="alert alert-info">Kein Referenzstand vorhanden. Bitte zuerst eine XML-Datei importieren.</div>';
      return;
    }

    const current = this.captureSnapshot();
    const diff = this.computeDiff(refSnap, current);
    const fieldTabMap = this.buildFieldTabMap();
    const fieldLabelMap = this.buildFieldLabelMap();

    // Group field changes by tab
    const fieldsByTab = {};
    diff.fields.forEach(f => {
      const tab = fieldTabMap[f.key] || 'unknown';
      if (!fieldsByTab[tab]) fieldsByTab[tab] = [];
      fieldsByTab[tab].push(f);
    });

    const totalFieldChanges = diff.fields.length;
    let totalRowAdded = 0, totalRowRemoved = 0, totalRowChanged = 0;
    diff.fp.forEach(sec => {
      sec.changes.forEach(c => {
        if (c.type === 'added') totalRowAdded++;
        else if (c.type === 'removed') totalRowRemoved++;
        else if (c.type === 'changed') totalRowChanged++;
      });
    });

    const totalChanges = totalFieldChanges + totalRowAdded + totalRowRemoved + totalRowChanged;
    if (totalChanges === 0) {
      container.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle"></i> Keine \u00c4nderungen seit dem Referenzstand.</div>';
      return;
    }

    let html = '<div class="alert alert-warning mb-3">';
    html += '<strong>Zusammenfassung:</strong> ';
    const parts = [];
    if (totalFieldChanges) parts.push(totalFieldChanges + ' Feld' + (totalFieldChanges > 1 ? 'er' : '') + ' ge\u00e4ndert');
    if (totalRowAdded) parts.push(totalRowAdded + ' Zeile' + (totalRowAdded > 1 ? 'n' : '') + ' hinzugef\u00fcgt');
    if (totalRowRemoved) parts.push(totalRowRemoved + ' Zeile' + (totalRowRemoved > 1 ? 'n' : '') + ' entfernt');
    if (totalRowChanged) parts.push(totalRowChanged + ' Zeile' + (totalRowChanged > 1 ? 'n' : '') + ' ge\u00e4ndert');
    html += parts.join(', ');
    html += '</div>';

    // Field changes grouped by tab
    const tabOrder = ['tabKerndaten', 'tabInstitutionen', 'tabAnsprechpartner', 'tabPersonal', 'tabSachmittel', 'tabFinanzierung', 'tabErklaerungen'];
    tabOrder.forEach(tabId => {
      const fields = fieldsByTab[tabId];
      if (!fields || fields.length === 0) return;
      html += '<h6 class="diff-section-header">' + this.esc(this.tabLabels[tabId] || tabId) + '</h6>';
      html += '<table class="table table-sm table-bordered diff-table mb-3"><tbody>';
      fields.forEach(f => {
        const label = fieldLabelMap[f.key] || f.key;
        html += '<tr>';
        html += '<td class="diff-label">' + this.esc(label) + ' <small class="text-muted">(' + this.esc(f.key) + ')</small></td>';
        html += '<td class="diff-old">' + this.esc(f.oldVal || '(leer)') + '</td>';
        html += '<td class="diff-arrow">\u2192</td>';
        html += '<td class="diff-new">' + this.esc(f.newVal || '(leer)') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    });

    // FP changes
    diff.fp.forEach(sec => {
      html += '<h6 class="diff-section-header">' + this.esc(sec.section) + '</h6>';
      sec.changes.forEach(c => {
        if (c.type === 'added') {
          html += '<div class="diff-row diff-row-added"><i class="bi bi-plus-circle"></i> ' + this.esc(c.desc) + ' <span class="badge bg-success">neu</span></div>';
        } else if (c.type === 'removed') {
          html += '<div class="diff-row diff-row-removed"><i class="bi bi-dash-circle"></i> ' + this.esc(c.desc) + ' <span class="badge bg-danger">entfernt</span></div>';
        } else if (c.type === 'changed') {
          html += '<div class="diff-row diff-row-changed"><i class="bi bi-pencil"></i> ' + this.esc(c.desc) + '</div>';
          if (c.details.length > 0) {
            html += '<table class="table table-sm table-bordered diff-table ms-4 mb-2" style="width:auto;"><tbody>';
            c.details.forEach(d => {
              html += '<tr>';
              html += '<td class="diff-label">' + this.esc(d.field) + '</td>';
              html += '<td class="diff-old">' + this.esc(d.oldVal || '(leer)') + '</td>';
              html += '<td class="diff-arrow">\u2192</td>';
              html += '<td class="diff-new">' + this.esc(d.newVal || '(leer)') + '</td>';
              html += '</tr>';
            });
            html += '</tbody></table>';
          }
        }
      });
    });

    container.innerHTML = html;
  },

  esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
};
