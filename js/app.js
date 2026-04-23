/* ============================================================
   Albion Invoice · app.js
   ============================================================ */
(function () {
  'use strict';

  /* ── Utilities ── */
  let _uid = 0;
  const uid = () => String(++_uid);

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function todayYear() {
    return new Date().getFullYear();
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  function fmtAmount(val) {
    const raw = String(val ?? '').replace(/[^\d.]/g, '');
    const n = parseFloat(raw);
    if (isNaN(n)) return String(val ?? '');
    return n.toLocaleString('es-ES');
  }

  function toNum(val) {
    const n = parseFloat(String(val ?? '').replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function autoInvNum() {
    const y = todayYear();
    return `INV-${y}-001`;
  }

  /* ── i18n ── */
  const T = {
    es: {
      s_emisor:   'Emisor',
      s_receptor: 'Receptor',
      s_meta:     'Datos de Factura',
      s_items:    'Conceptos',
      s_payments: 'Pagos / Vencimientos',
      s_notes:    'Notas al pie',
      s_footer:   'Pie de página',
      l_tag:         'Tag / Tipo',
      l_custom_tag:  'Tag personalizado',
      l_name:        'Nombre',
      l_subtitle:    'Subtítulo',
      l_num:         'Nº Factura',
      l_date:        'Fecha emisión',
      l_status:      'Estado',
      l_footer_text: 'Texto del pie',
      l_show_total:  'Mostrar total automático',
      l_total_label: 'Etiqueta del total',
      l_highlight:   'Destacar',
      opt_custom:  'Personalizado…',
      opt_none:    '— Ninguno —',
      opt_player:  'Jugador',
      opt_pending: 'Pendiente',
      opt_paid:    'Pagado',
      btn_add_cat:  '+ Añadir categoría',
      btn_add_item: '+ Añadir ítem',
      btn_add_pay:  '+ Añadir pago',
      btn_export:   '⬇ Imprimir',
      btn_copy_code: '📋 Código',
      btn_copy_url:  '🔗 URL',
      btn_import:    '📥 Cargar',
      import_title:        'Cargar factura desde código',
      import_placeholder:  'Pega aquí el código AINV1-… que te hayan enviado',
      import_confirm:      'Cargar',
      import_cancel:       'Cancelar',
      msg_copied_code:     'Código copiado al portapapeles',
      msg_copied_url:      'URL copiada al portapapeles',
      msg_invalid_code:    'Código no válido',
      msg_loaded:          'Factura cargada desde código',
      msg_copy_failed:     'No se pudo copiar — usa Ctrl+C',
      ph_cat:        'Ej: Alquiler de Islas',
      ph_item_name:  'Nombre del concepto',
      ph_item_note:  'Nota adicional',
      ph_badge:      'T6, MAX TIER…',
      ph_pay_label:  'Ej: Pago de abril',
      ph_total_label:'Total conceptos',
      col_concept:  'Concepto',
      col_amount:   'Importe',
      lbl_total:    'Total conceptos',
      currency:     'plata',
      currency_sym: '♦',
      pay_default:  'Pago',
      tag_clan:    '⚔ Clan ⚔',
      tag_player:  '⚔ Jugador ⚔',
      tag_clan_r:  'Clan',
      tag_player_r:'Jugador',
      family_label: 'De la misma familia',
    },
    en: {
      s_emisor:   'Issuer',
      s_receptor: 'Recipient',
      s_meta:     'Invoice Details',
      s_items:    'Line Items',
      s_payments: 'Payments / Due Dates',
      s_notes:    'Footer Notes',
      s_footer:   'Page Footer',
      l_tag:         'Tag / Type',
      l_custom_tag:  'Custom tag',
      l_name:        'Name',
      l_subtitle:    'Subtitle',
      l_num:         'Invoice No.',
      l_date:        'Issue Date',
      l_status:      'Status',
      l_footer_text: 'Footer text',
      l_show_total:  'Show auto total',
      l_total_label: 'Total label',
      l_highlight:   'Highlight',
      opt_custom:  'Custom…',
      opt_none:    '— None —',
      opt_player:  'Player',
      opt_pending: 'Pending',
      opt_paid:    'Paid',
      btn_add_cat:  '+ Add Category',
      btn_add_item: '+ Add Item',
      btn_add_pay:  '+ Add Payment',
      btn_export:   '⬇ Print',
      btn_copy_code: '📋 Code',
      btn_copy_url:  '🔗 URL',
      btn_import:    '📥 Load',
      import_title:        'Load invoice from code',
      import_placeholder:  'Paste the AINV1-… code you received',
      import_confirm:      'Load',
      import_cancel:       'Cancel',
      msg_copied_code:     'Code copied to clipboard',
      msg_copied_url:      'URL copied to clipboard',
      msg_invalid_code:    'Invalid code',
      msg_loaded:          'Invoice loaded from code',
      msg_copy_failed:     'Copy failed — use Ctrl+C',
      ph_cat:        'E.g. Island Rentals',
      ph_item_name:  'Item / service name',
      ph_item_note:  'Additional note',
      ph_badge:      'T6, MAX TIER…',
      ph_pay_label:  'E.g. April payment',
      ph_total_label:'Total items',
      col_concept:  'Description',
      col_amount:   'Amount',
      lbl_total:    'Total items',
      currency:     'silver',
      currency_sym: '♦',
      pay_default:  'Payment',
      tag_clan:    '⚔ Clan ⚔',
      tag_player:  '⚔ Player ⚔',
      family_label: 'From the same family',
      tag_clan_r:  'Clan',
      tag_player_r:'Player',
    },
  };

  /* ── State ── */
  const S = {
    lang: 'es',
    emisor: { tagSel: 'clan', tagCustom: '', name: '', subtitle: '' },
    receptor: { tagSel: '', tagCustom: '', name: '' },
    inv: { number: autoInvNum(), date: todayISO(), status: 'pending' },
    categories: [],
    payments: [],
    notes: '',
    footer: { text: '', showTotal: true, totalLabel: '' },
  };

  const t = key => T[S.lang][key] ?? key;

  /* ── Category / Item helpers ── */
  function addCat() {
    const cat = { id: uid(), name: '', items: [] };
    S.categories.push(cat);
    addItem(cat.id, true);
  }

  function delCat(cid) {
    S.categories = S.categories.filter(c => c.id !== cid);
    renderCatList();
    renderInvoice();
  }

  function addItem(cid, skipRender) {
    const cat = S.categories.find(c => c.id === cid);
    if (!cat) return;
    cat.items.push({ id: uid(), name: '', note: '', badge: '', amount: '' });
    if (!skipRender) { renderCatList(); renderInvoice(); }
  }

  function delItem(cid, iid) {
    const cat = S.categories.find(c => c.id === cid);
    if (!cat) return;
    cat.items = cat.items.filter(i => i.id !== iid);
    renderCatList();
    renderInvoice();
  }

  /* ── Payment helpers ── */
  function addPayment() {
    S.payments.push({ id: uid(), label: '', date: '', amount: '', highlight: true });
    renderPayList();
    renderInvoice();
  }

  function delPayment(pid) {
    S.payments = S.payments.filter(p => p.id !== pid);
    renderPayList();
    renderInvoice();
  }

  /* ── Render: Category list ── */
  function renderCatList() {
    const el = document.getElementById('cat-list');
    if (!el) return;

    el.innerHTML = S.categories.map(cat => `
      <div class="cat-block">
        <div class="cat-header">
          <input class="cat-name-in" type="text"
            value="${esc(cat.name)}"
            placeholder="${esc(t('ph_cat'))}"
            data-cid="${cat.id}" data-field="catname">
          <button class="btn-del" data-action="del-cat" data-cid="${cat.id}" title="Eliminar categoría">✕</button>
        </div>
        <div class="item-list">
          ${cat.items.map(item => `
            <div class="item-block">
              <div class="item-row-a">
                <input type="text"
                  value="${esc(item.name)}"
                  placeholder="${esc(t('ph_item_name'))}"
                  data-cid="${cat.id}" data-iid="${item.id}" data-field="name">
                <input type="text"
                  value="${esc(item.badge)}"
                  placeholder="${esc(t('ph_badge'))}"
                  data-cid="${cat.id}" data-iid="${item.id}" data-field="badge">
                <button class="btn-del-sm" data-action="del-item"
                  data-cid="${cat.id}" data-iid="${item.id}" title="Eliminar ítem">✕</button>
              </div>
              <div class="item-row-b">
                <input type="text"
                  value="${esc(item.note)}"
                  placeholder="${esc(t('ph_item_note'))}"
                  data-cid="${cat.id}" data-iid="${item.id}" data-field="note">
                <input type="text"
                  value="${esc(item.amount)}"
                  placeholder="1,000,000"
                  data-cid="${cat.id}" data-iid="${item.id}" data-field="amount"
                  inputmode="numeric">
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn-add-item" data-action="add-item" data-cid="${cat.id}">
          ${t('btn_add_item')}
        </button>
      </div>
    `).join('');
  }

  /* ── Render: Payment list ── */
  function renderPayList() {
    const el = document.getElementById('pay-list');
    if (!el) return;

    el.innerHTML = S.payments.map(pay => `
      <div class="pay-block">
        <div class="pay-row-a">
          <input type="text"
            value="${esc(pay.label)}"
            placeholder="${esc(t('ph_pay_label'))}"
            data-pid="${pay.id}" data-field="label">
          <label class="hl-toggle ${pay.highlight ? 'on' : ''}" title="${t('l_highlight')}">
            <input type="checkbox" ${pay.highlight ? 'checked' : ''}
              data-pid="${pay.id}" data-field="highlight">
            ★
          </label>
          <button class="btn-del" data-action="del-pay" data-pid="${pay.id}">✕</button>
        </div>
        <div class="pay-row-b">
          <input type="date"
            value="${esc(pay.date)}"
            data-pid="${pay.id}" data-field="date">
          <input type="text"
            value="${esc(pay.amount)}"
            placeholder="10,000,000"
            data-pid="${pay.id}" data-field="amount"
            inputmode="numeric">
        </div>
      </div>
    `).join('');
  }

  /* ── Render: Invoice ── */
  function renderInvoice() {
    const emisorTag =
      S.emisor.tagSel === 'custom'  ? S.emisor.tagCustom :
      S.emisor.tagSel === 'player'  ? t('tag_player') :
      /* clan default */               t('tag_clan');

    const receptorTag =
      S.receptor.tagSel === 'custom' ? S.receptor.tagCustom :
      S.receptor.tagSel === 'player' ? t('tag_player_r') :
      S.receptor.tagSel === 'clan'   ? t('tag_clan_r') : '';

    const statusText  = S.inv.status === 'paid' ? t('opt_paid') : t('opt_pending');
    const statusClass = S.inv.status === 'paid' ? 'status-paid' : 'status-pending';

    // Auto total
    const autoTotal = S.categories.reduce((sum, cat) =>
      sum + cat.items.reduce((s2, item) => s2 + toNum(item.amount), 0), 0);

    const hasEmisorName = S.emisor.name.trim() !== '';

    let h = `<div class="invoice">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>

      <div class="inv-header">
        ${emisorTag ? `<div class="inv-tag">${esc(emisorTag)}</div>` : ''}
        <div class="inv-name${hasEmisorName ? '' : ' placeholder'}">
          ${esc(S.emisor.name) || esc(t('l_name'))}
        </div>
        ${S.emisor.subtitle ? `<div class="inv-subtitle">${esc(S.emisor.subtitle)}</div>` : ''}
      </div>`;

    /* Receptor */
    if (S.receptor.name || receptorTag) {
      h += `<div class="inv-receptor">
        ${receptorTag ? `<div class="inv-receptor-tag">${esc(receptorTag)}</div>` : ''}
        ${S.receptor.name ? `<div class="inv-receptor-name">${esc(S.receptor.name)}</div>` : ''}
      </div>`;
    }

    /* Meta */
    h += `<div class="inv-meta">
      <div>
        <div class="inv-meta-label">${t('l_num')}</div>
        <div class="inv-meta-val">${esc(S.inv.number) || '—'}</div>
      </div>
      <div style="text-align:center">
        <div class="inv-meta-label">${t('l_date')}</div>
        <div class="inv-meta-val">${fmtDate(S.inv.date) || '—'}</div>
      </div>
      <div style="text-align:right">
        <div class="inv-meta-label">${t('l_status')}</div>
        <div class="inv-meta-val ${statusClass}">${statusText}</div>
      </div>
    </div>`;

    /* Categories */
    S.categories.forEach(cat => {
      const hasContent = cat.name || cat.items.some(i => i.name || i.amount);
      if (!hasContent) return;

      h += `<div class="inv-divider"><span>${esc(cat.name) || '…'}</span></div>
        <div class="inv-table-wrap">
          <table>
            <thead><tr>
              <th>${t('col_concept')}</th>
              <th style="text-align:right">${t('col_amount')}</th>
            </tr></thead>
            <tbody>
              ${cat.items.map(item => `
                <tr>
                  <td>
                    <div class="inv-item-name">
                      ${esc(item.name) || '&mdash;'}
                      ${item.badge ? `<span class="inv-badge">${esc(item.badge)}</span>` : ''}
                    </div>
                    ${item.note ? `<div class="inv-item-note">${esc(item.note)}</div>` : ''}
                  </td>
                  <td class="inv-item-amount">
                    ${item.amount ? fmtAmount(item.amount) : '—'}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    });

    /* Totals block */
    const hasPayments = S.payments.length > 0;
    const showTotal   = S.footer.showTotal && autoTotal > 0;

    if (showTotal || hasPayments) {
      h += `<div class="inv-totals">`;

      if (showTotal) {
        const lbl = S.footer.totalLabel || t('lbl_total');
        h += `<div class="inv-total-row">
          <span class="inv-total-label">${esc(lbl)}</span>
          <span class="inv-total-val inv-total-silver">${fmtAmount(autoTotal)} <span class="inv-currency">${t('currency')}</span></span>
        </div>`;
        if (hasPayments) h += `<div class="inv-sword">⚔</div>`;
      }

      S.payments.forEach(pay => {
        const cls = pay.highlight ? 'inv-total-row highlight' : 'inv-total-row';
        const label = pay.label ||
          (pay.date ? `${t('pay_default')} ${fmtDate(pay.date)}` : t('pay_default'));
        h += `<div class="${cls}">
          <span class="inv-total-label">${esc(label)}</span>
          <span class="inv-total-val">
            ${pay.amount ? fmtAmount(pay.amount) : '—'}
            <span class="inv-currency">${t('currency_sym')}</span>
          </span>
        </div>`;
      });

      h += `</div>`;
    }

    /* Notes */
    if (S.notes.trim()) {
      h += `<div class="inv-notes">
        <p>${esc(S.notes).replace(/\n/g, '<br>')}</p>
      </div>`;
    }

    /* Footer */
    const footerLine = S.footer.text ||
      `${S.emisor.name ? esc(S.emisor.name) + ' · ' : ''}Albion Online`;
    h += `<div class="inv-footer">
      <div class="inv-sword">⚔</div>
      <div class="inv-footer-brand">${footerLine}</div>
    </div>
    </div>`;

    document.getElementById('invoice-root').innerHTML = h;
  }

  /* ── i18n update (on lang switch) ── */
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (T[S.lang][k] !== undefined) el.textContent = T[S.lang][k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.dataset.i18nPlaceholder;
      if (T[S.lang][k] !== undefined) el.placeholder = T[S.lang][k];
    });

    // Update select option texts
    const eTagSel = document.getElementById('emisor-tag-sel');
    if (eTagSel) {
      eTagSel.options[0].textContent = t('tag_clan');
      eTagSel.options[1].textContent = t('tag_player');
      eTagSel.options[2].textContent = t('opt_custom');
    }
    const rTagSel = document.getElementById('receptor-tag-sel');
    if (rTagSel) {
      rTagSel.options[0].textContent = t('opt_none');
      rTagSel.options[1].textContent = t('opt_player');
      rTagSel.options[3].textContent = t('opt_custom');
    }
    const statusSel = document.getElementById('inv-status');
    if (statusSel) {
      statusSel.options[0].textContent = t('opt_pending');
      statusSel.options[1].textContent = t('opt_paid');
    }

    // Update dynamic lists (placeholders change with lang)
    renderCatList();
    renderPayList();
    renderInvoice();
  }

  /* ── Event delegation: cat-list ── */
  function bindCatList() {
    const el = document.getElementById('cat-list');

    el.addEventListener('input', e => {
      const target = e.target;
      const { cid, iid, field } = target.dataset;
      if (!cid || !field) return;
      const cat = S.categories.find(c => c.id === cid);
      if (!cat) return;
      if (field === 'catname') {
        cat.name = target.value;
      } else if (iid) {
        const item = cat.items.find(i => i.id === iid);
        if (item && field in item) item[field] = target.value;
      }
      renderInvoice();
    });

    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, cid, iid } = btn.dataset;
      if (action === 'del-cat')  delCat(cid);
      if (action === 'add-item') addItem(cid);
      if (action === 'del-item') delItem(cid, iid);
    });
  }

  /* ── Event delegation: pay-list ── */
  function bindPayList() {
    const el = document.getElementById('pay-list');

    el.addEventListener('input', e => {
      const target = e.target;
      const { pid, field } = target.dataset;
      if (!pid || !field) return;
      const pay = S.payments.find(p => p.id === pid);
      if (!pay) return;
      if (field === 'highlight') {
        pay.highlight = target.checked;
        const lbl = target.closest('.hl-toggle');
        if (lbl) lbl.classList.toggle('on', target.checked);
      } else {
        pay[field] = target.value;
      }
      renderInvoice();
    });

    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'del-pay') delPayment(btn.dataset.pid);
    });
  }

  /* ── Share codec: AINV1-<base64url(deflate-raw(JSON(S)))> ──
     Entirely client-side, no backend, no storage. A sender encodes
     the current invoice state into a single long string they paste
     to the receiver (or shares as a URL with ?inv=…). The receiver
     pastes it into "Cargar código" (or clicks the URL) and their
     browser reconstructs the form exactly. Nothing leaves either
     device through our infrastructure. */

  const CODE_PREFIX = 'AINV1-';

  function bytesToBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(str) {
    const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function encodeInvoice(state) {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return CODE_PREFIX + bytesToBase64Url(compressed);
  }

  async function decodeInvoice(code) {
    const trimmed = String(code || '').trim();
    if (!trimmed.startsWith(CODE_PREFIX)) throw new Error('bad prefix');
    const bytes = base64UrlToBytes(trimmed.slice(CODE_PREFIX.length));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const text = await new Response(stream).text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.emisor) throw new Error('bad shape');
    return parsed;
  }

  /* Take a decoded state object and reflect it into the live form. */
  function applyState(newS) {
    if (newS.lang && T[newS.lang]) S.lang = newS.lang;
    Object.assign(S.emisor,   newS.emisor   || {});
    Object.assign(S.receptor, newS.receptor || {});
    Object.assign(S.inv,      newS.inv      || {});
    Object.assign(S.footer,   newS.footer   || {});
    S.categories = Array.isArray(newS.categories) ? newS.categories : [];
    S.payments   = Array.isArray(newS.payments)   ? newS.payments   : [];
    S.notes      = typeof newS.notes === 'string' ? newS.notes      : '';

    // Push _uid past every id already assigned so new rows don't collide.
    let maxId = 0;
    S.categories.forEach(c => {
      maxId = Math.max(maxId, +c.id || 0);
      (c.items || []).forEach(i => { maxId = Math.max(maxId, +i.id || 0); });
    });
    S.payments.forEach(p => { maxId = Math.max(maxId, +p.id || 0); });
    _uid = maxId;

    // Static inputs — mirror state into the DOM.
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    setVal('emisor-name',         S.emisor.name);
    setVal('emisor-subtitle',     S.emisor.subtitle);
    setVal('emisor-tag-sel',      S.emisor.tagSel);
    setVal('emisor-tag-custom',   S.emisor.tagCustom);
    setVal('receptor-name',       S.receptor.name);
    setVal('receptor-tag-sel',    S.receptor.tagSel);
    setVal('receptor-tag-custom', S.receptor.tagCustom);
    setVal('inv-num',             S.inv.number);
    setVal('inv-date',            S.inv.date);
    setVal('inv-status',          S.inv.status);
    setVal('inv-notes',           S.notes);
    setVal('footer-text',         S.footer.text);
    setVal('total-label',         S.footer.totalLabel);

    const showTotal = document.getElementById('show-total');
    if (showTotal) showTotal.checked = !!S.footer.showTotal;
    const frEmisorCustom   = document.getElementById('fr-emisor-custom');
    const frReceptorCustom = document.getElementById('fr-receptor-custom');
    const frTotalLabel     = document.getElementById('fr-total-label');
    if (frEmisorCustom)   frEmisorCustom.style.display   = S.emisor.tagSel === 'custom' ? '' : 'none';
    if (frReceptorCustom) frReceptorCustom.style.display = S.receptor.tagSel === 'custom' ? '' : 'none';
    if (frTotalLabel)     frTotalLabel.style.display     = S.footer.showTotal ? '' : 'none';

    const btnES = document.getElementById('btn-es');
    const btnEN = document.getElementById('btn-en');
    if (btnES) btnES.classList.toggle('active', S.lang === 'es');
    if (btnEN) btnEN.classList.toggle('active', S.lang === 'en');

    // applyI18n re-renders cat list, pay list and the invoice itself.
    applyI18n();
  }

  /* Minimal toast for share-action feedback — auto-hides after 1.8s. */
  let _toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    // force reflow so the transition re-triggers on consecutive toasts
    void el.offsetWidth;
    el.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => { el.hidden = true; }, 300);
    }, 1800);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback: temp textarea + execCommand.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      return ok;
    }
  }

  function openImportModal() {
    const modal = document.getElementById('import-modal');
    if (!modal) return;
    const ta = document.getElementById('import-textarea');
    if (ta) ta.value = '';
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('visible'));
    if (ta) setTimeout(() => ta.focus(), 30);
  }

  function closeImportModal() {
    const modal = document.getElementById('import-modal');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => { modal.hidden = true; }, 200);
  }

  /* ── Layout: split form into two panels on wide desktops ──
     At ≥1500px the invoice form is split across two asides, one on
     each side of the preview. The "right group" sections (Conceptos /
     Pagos / Notas / Pie) move to the right panel. Below the
     breakpoint everything collapses back into the left. The Export
     action lives in the footer now, so it doesn't need moving. */
  const RIGHT_GROUP_KEYS = ['s_items', 's_payments', 's_notes', 's_footer'];

  function adjustFormLayout() {
    const wide = window.matchMedia('(min-width: 1500px)').matches;
    const left = document.querySelector('.form-panel-left');
    const right = document.querySelector('.form-panel-right');
    if (!left || !right) return;
    const leftScroll = left.querySelector('.form-scroll');
    const rightScroll = right.querySelector('.form-scroll');
    if (!leftScroll || !rightScroll) return;

    if (wide) {
      leftScroll.querySelectorAll('section.fs').forEach(s => {
        const title = s.querySelector('.fs-title');
        const key = title && title.getAttribute('data-i18n');
        if (RIGHT_GROUP_KEYS.includes(key)) rightScroll.appendChild(s);
      });
    } else {
      rightScroll.querySelectorAll('section.fs').forEach(s => {
        leftScroll.appendChild(s);
      });
    }
  }

  let _layoutTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_layoutTimer);
    _layoutTimer = setTimeout(adjustFormLayout, 120);
  });

  /* ── Init ── */
  async function init() {
    /* Set initial values */
    document.getElementById('inv-date').value  = S.inv.date;
    document.getElementById('inv-num').value   = S.inv.number;

    /* Static input bindings */
    [
      ['emisor-name',     v => { S.emisor.name = v; }],
      ['emisor-subtitle', v => { S.emisor.subtitle = v; }],
      ['emisor-tag-custom', v => { S.emisor.tagCustom = v; }],
      ['receptor-name',   v => { S.receptor.name = v; }],
      ['receptor-tag-custom', v => { S.receptor.tagCustom = v; }],
      ['inv-num',         v => { S.inv.number = v; }],
      ['inv-date',        v => { S.inv.date = v; }],
      ['inv-notes',       v => { S.notes = v; }],
      ['footer-text',     v => { S.footer.text = v; }],
      ['total-label',     v => { S.footer.totalLabel = v; }],
    ].forEach(([id, setter]) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('input', () => { setter(input.value); renderInvoice(); });
    });

    /* Select: emisor tag */
    document.getElementById('emisor-tag-sel').addEventListener('change', function () {
      S.emisor.tagSel = this.value;
      document.getElementById('fr-emisor-custom').style.display =
        this.value === 'custom' ? '' : 'none';
      renderInvoice();
    });

    /* Select: receptor tag */
    document.getElementById('receptor-tag-sel').addEventListener('change', function () {
      S.receptor.tagSel = this.value;
      document.getElementById('fr-receptor-custom').style.display =
        this.value === 'custom' ? '' : 'none';
      renderInvoice();
    });

    /* Select: status */
    document.getElementById('inv-status').addEventListener('change', function () {
      S.inv.status = this.value;
      renderInvoice();
    });

    /* Checkbox: show total */
    document.getElementById('show-total').addEventListener('change', function () {
      S.footer.showTotal = this.checked;
      document.getElementById('fr-total-label').style.display = this.checked ? '' : 'none';
      renderInvoice();
    });

    /* Dynamic lists */
    bindCatList();
    bindPayList();
    document.getElementById('btn-add-cat').addEventListener('click', () => {
      addCat();
      renderCatList();
      renderInvoice();
    });
    document.getElementById('btn-add-pay').addEventListener('click', addPayment);

    /* Language buttons */
    document.getElementById('btn-es').addEventListener('click', () => {
      S.lang = 'es';
      document.getElementById('btn-es').classList.add('active');
      document.getElementById('btn-en').classList.remove('active');
      applyI18n();
    });
    document.getElementById('btn-en').addEventListener('click', () => {
      S.lang = 'en';
      document.getElementById('btn-en').classList.add('active');
      document.getElementById('btn-es').classList.remove('active');
      applyI18n();
    });

    /* Export (print) */
    document.getElementById('btn-export').addEventListener('click', () => window.print());

    /* Share: copy code to clipboard */
    document.getElementById('btn-copy-code').addEventListener('click', async () => {
      try {
        const code = await encodeInvoice(S);
        const ok = await copyToClipboard(code);
        toast(ok ? t('msg_copied_code') : t('msg_copy_failed'));
      } catch (_) {
        toast(t('msg_copy_failed'));
      }
    });

    /* Share: copy a ?inv=<code> URL to clipboard */
    document.getElementById('btn-copy-url').addEventListener('click', async () => {
      try {
        const code = await encodeInvoice(S);
        const url = `${location.origin}${location.pathname}?inv=${encodeURIComponent(code)}`;
        const ok = await copyToClipboard(url);
        toast(ok ? t('msg_copied_url') : t('msg_copy_failed'));
      } catch (_) {
        toast(t('msg_copy_failed'));
      }
    });

    /* Import: open modal */
    document.getElementById('btn-import-code').addEventListener('click', openImportModal);
    document.getElementById('btn-import-cancel').addEventListener('click', closeImportModal);
    document.getElementById('import-modal').addEventListener('click', e => {
      if (e.target.id === 'import-modal') closeImportModal();
    });
    document.getElementById('btn-import-confirm').addEventListener('click', async () => {
      const ta = document.getElementById('import-textarea');
      const raw = ta ? ta.value : '';
      try {
        const newS = await decodeInvoice(raw);
        applyState(newS);
        closeImportModal();
        toast(t('msg_loaded'));
      } catch (_) {
        toast(t('msg_invalid_code'));
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('import-modal');
        if (modal && !modal.hidden) closeImportModal();
      }
    });

    /* Auto-load invoice from ?inv=<code> so shared URLs open pre-filled. */
    let urlLoaded = false;
    const params = new URLSearchParams(location.search);
    const invCode = params.get('inv');
    if (invCode) {
      try {
        const newS = await decodeInvoice(invCode);
        applyState(newS);
        urlLoaded = true;
        toast(t('msg_loaded'));
        // Clean the URL so refreshing doesn't re-toast and so the
        // user can edit without the code staying sticky in the bar.
        const clean = location.pathname + location.hash;
        history.replaceState(null, '', clean);
      } catch (_) {
        toast(t('msg_invalid_code'));
      }
    }

    /* Seed initial content only if the URL didn't populate state. */
    if (!urlLoaded) {
      addCat();
      renderCatList();
      addPayment();
      renderPayList();
    }
    renderInvoice();

    /* Place form sections into left/right panel for current viewport. */
    adjustFormLayout();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
