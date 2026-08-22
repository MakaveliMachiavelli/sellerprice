/* SellerPrice — marketplace fee & pricing calculator. Vanilla JS, no deps. */
'use strict';

/* PRO unlock codes. OWNER: change before promoting (see PAYMENTS.md). */
const PRO_CODES = ['SELLERPRICE-99', 'SP-DEMO'];
const LS = { draft: 'sp_draft', pro: 'sp_pro', items: 'sp_items' };

const PLATFORMS = {
  shopee:  { name: 'Shopee PH',   comm: 6, txn: 2, svc: 0 },
  lazada:  { name: 'Lazada PH',   comm: 4, txn: 2, svc: 0 },
  tiktok:  { name: 'TikTok Shop PH', comm: 6, txn: 2, svc: 0 },
  custom:  { name: 'Custom',      comm: 6, txn: 2, svc: 0 }
};

let pro = localStorage.getItem(LS.pro) === '1';
let items = [];   // batch list {name, cost}

const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + (Math.round(n * 100) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (n * 100).toFixed(2) + '%';
const num = (id) => Number($(id).value) || 0;

/* fee stack: fees(p) = p·(comm%+txn%)/100 + svc + fixed + ship − voucher
   profit(p) = p − fees − cost = p(1 − f) − F   where F = svc+fixed+ship−voucher+cost
   target margin m: p·m = profit → p = (F − svc…) careful: p(1−f−m) = svc+fixed+ship−voucher+cost */
function compute(cost, marginPct, commPct, txnPct, svc, fixed, ship, voucher) {
  const f = (commPct + txnPct) / 100;
  const F = svc + fixed + ship - voucher + cost;   // non-%-of-price costs incl COGS
  const m = marginPct / 100;
  const denom = 1 - f - m;
  const price = denom > 0 ? F / denom : NaN;
  const fees = price * f + svc;
  const profit = price - fees - fixed - ship + voucher - cost;
  const beDenom = 1 - f;
  const breakEven = beDenom > 0 ? F / beDenom : NaN;
  return { price, fees, profit, breakEven, f };
}

function inputs() {
  return { cost: num('cost'), margin: num('margin'), ship: num('ship'), voucher: num('voucher'),
    fixed: num('fixed'), comm: num('comm'), txn: num('txn'), svc: num('svcfee') };
}

function render() {
  const i = inputs();
  const platKey = $('platform').value;
  const plat = PLATFORMS[platKey];
  $('platName').textContent = plat.name;
  const r = compute(i.cost, i.margin, i.comm, i.txn, i.svc, i.fixed, i.ship, i.voucher);

  const ok = Number.isFinite(r.price);
  $('oPrice').textContent = ok ? peso(r.price) : 'impossible fees!';
  $('oProfit').textContent = ok ? peso(r.profit) : '—';
  $('oBe').textContent = ok ? peso(r.breakEven) : '—';
  $('oFees').textContent = ok ? peso(r.fees + i.fixed + i.ship - i.voucher) : '—';

  $('p_plat').textContent = plat.name;
  $('p_price').textContent = ok ? peso(r.price) : '—';
  $('p_cost').textContent = peso(i.cost);
  $('p_pct').textContent = ok ? peso(r.price * r.f) : '—';
  $('p_fix').textContent = peso(i.svc + i.fixed + i.ship - i.voucher);
  $('p_net').textContent = ok ? peso(r.profit) : '—';
  $('p_margin').textContent = ok && r.price > 0 ? pct(r.profit / r.price) : '—';
  $('p_be').textContent = ok ? peso(r.breakEven) : '—';

  // all-platforms table
  const rows = Object.entries(PLATFORMS).filter(([k]) => k !== 'custom').map(([k, p]) => {
    const rr = compute(i.cost, i.margin, p.comm, p.txn, p.svc, i.fixed, i.ship, i.voucher);
    return `<tr><td>${p.name}</td><td class="r">${p.comm + p.txn}%</td>` +
      `<td class="r"><strong>${peso(rr.price)}</strong></td><td class="r">${peso(rr.profit)}</td></tr>`;
  });
  $('platRows').innerHTML = rows.join('');

  saveDraft();
}

function saveDraft() {
  try {
    localStorage.setItem(LS.draft, JSON.stringify({
      f: ['cost','margin','ship','voucher','fixed','comm','txn','svcfee'].map(id => $(id).value),
      platform: $('platform').value
    }));
  } catch (e) {}
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
    if (!d) return;
    ['cost','margin','ship','voucher','fixed','comm','txn','svcfee'].forEach((id, x) => $(id).value = d.f[x] ?? $(id).value);
    $('platform').value = d.platform ?? 'shopee';
  } catch (e) {}
}

function applyPro() {
  $('proBadge').classList.toggle('hidden', !pro);
  $('batchBtn').classList.toggle('hidden', !pro);
}

/* batch (PRO) */
function getItems() { return items; }
function renderBatch() {
  const i = inputs();
  $('batchBody').innerHTML = items.length ? items.map((it, x) => {
    const cells = ['shopee','lazada','tiktok'].map(k => {
      const p = PLATFORMS[k];
      const rr = compute(it.cost, i.margin, p.comm, p.txn, p.svc, i.fixed, i.ship, i.voucher);
      return `<td class="r">${Number.isFinite(rr.price) ? peso(rr.price) : '—'}</td>`;
    }).join('');
    return `<tr><td>${it.name}</td><td class="r">${peso(it.cost)}</td>${cells}<td><button class="x-btn" data-ii="${x}">✕</button></td></tr>`;
  }).join('') : '<tr><td colspan="6" style="color:#667085">No items yet — add above.</td></tr>';
}
function batchCsv() {
  const i = inputs();
  const rows = [['Item', 'Cost']].concat([['', ''], ...items.map(it => [it.name, it.cost.toFixed(2)])]);
  // cleaner: per platform columns
  const out = [['Item', 'Cost', 'Shopee', 'Lazada', 'TikTok']];
  items.forEach(it => {
    const prices = ['shopee','lazada','tiktok'].map(k => {
      const p = PLATFORMS[k];
      const rr = compute(it.cost, i.margin, p.comm, p.txn, p.svc, i.fixed, i.ship, i.voucher);
      return Number.isFinite(rr.price) ? rr.price.toFixed(2) : '';
    });
    out.push([it.name, it.cost.toFixed(2), ...prices]);
  });
  const csv = out.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'sellerprice-pricelist.csv';
  a.click();
}

document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  applyPro();

  ['cost','margin','ship','voucher','fixed','comm','txn','svcfee','platform'].forEach(id => $(id).addEventListener('input', render));

  // platform switch reloads default fees (unless customizing)
  $('platform').addEventListener('change', () => {
    const p = PLATFORMS[$('platform').value];
    if ($('platform').value !== 'custom') {
      $('comm').value = p.comm; $('txn').value = p.txn; $('svcfee').value = p.svc;
    }
    render();
  });

  $('printBtn').addEventListener('click', () => window.print());

  const openPay = () => { $('payModal').classList.remove('hidden'); $('codeMsg').textContent = ''; };
  $('proBtn').addEventListener('click', openPay);
  $('proBtn2').addEventListener('click', openPay);
  $('payClose').addEventListener('click', () => $('payModal').classList.add('hidden'));
  $('codeBtn').addEventListener('click', () => {
    const code = $('codeInput').value.trim().toUpperCase();
    if (PRO_CODES.map(c => c.toUpperCase()).includes(code)) {
      pro = true; localStorage.setItem(LS.pro, '1'); applyPro();
      $('codeMsg').textContent = '✓ PRO unlocked — batch price-list active.';
      $('codeMsg').className = 'code-msg ok';
      setTimeout(() => $('payModal').classList.add('hidden'), 1500);
    } else {
      $('codeMsg').textContent = 'Invalid code — check your GCash confirmation.';
      $('codeMsg').className = 'code-msg bad';
    }
  });
  $('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeBtn').click(); });

  $('batchBtn').addEventListener('click', () => { renderBatch(); $('batchModal').classList.remove('hidden'); });
  $('batchClose').addEventListener('click', () => $('batchModal').classList.add('hidden'));
  $('bAdd').addEventListener('click', () => {
    const name = $('bItem').value.trim() || 'Item ' + (items.length + 1);
    items.push({ name, cost: Number($('bCost').value) || 0 });
    $('bItem').value = ''; $('bCost').value = '';
    renderBatch();
  });
  $('batchBody').addEventListener('click', e => {
    const btn = e.target.closest('button[data-ii]'); if (!btn) return;
    items.splice(+btn.dataset.ii, 1); renderBatch();
  });
  $('batchCsv').addEventListener('click', batchCsv);

  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));

  render();
});
