import { applyStaticTranslations, bindLangSelect, getLang, intlLocale, t } from "./i18n.js";

const $ = (sel, root = document) => root.querySelector(sel);

function formatMoney(value, currency) {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function parseNum(input) {
  const v = parseFloat(String(input).replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

function clampPct(n) {
  return Math.min(Math.max(n, 0), 100);
}

function getCurrency() {
  return $("#currency")?.value || "USD";
}

function finalAfterDiscount(price, pct) {
  return price * (1 - clampPct(pct) / 100);
}

function renderAffiliates() {
  const list = $("#affiliate-list");
  if (!list) return;

  list.innerHTML = "";
  const items = window.SITE_CONFIG?.affiliates ?? [];
  for (const item of items) {
    if (!item.url || item.url.includes("YOUR_")) continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.url;
    a.rel = "noopener sponsored";
    a.target = "_blank";
    a.textContent = item.title;
    if (item.subtitle) {
      const sub = document.createElement("span");
      sub.textContent = item.subtitle;
      a.appendChild(sub);
    }
    li.appendChild(a);
    list.appendChild(li);
  }

  const section = $(".affiliate");
  if (section) section.hidden = list.children.length === 0;
}

function setResult(panelId, main, subHtml = "") {
  const out = document.getElementById(panelId);
  if (!out) return;
  out.querySelector(".result-main").textContent = main;
  const sub = out.querySelector(".result-sub");
  sub.innerHTML = subHtml;
  out.dataset.summary = `${main}\n${sub.textContent}`;
}

function calcSimple() {
  const price = parseNum($("#price")?.value);
  const pct = parseNum($("#discount")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(price) || price < 0) {
    setResult("result-simple", "—");
    return;
  }
  const final = finalAfterDiscount(price, pct);
  const saved = price - final;
  setResult(
    "result-simple",
    formatMoney(final, cur),
    `${t("labelOriginal")}: ${formatMoney(price, cur)} · −${clampPct(pct).toFixed(1)}% · save ${formatMoney(saved, cur)}`
  );
}

function calcStack() {
  const price = parseNum($("#stack-price")?.value);
  const d1 = parseNum($("#stack-d1")?.value) || 0;
  const d2 = parseNum($("#stack-d2")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(price) || price < 0) {
    setResult("result-stack", "—");
    return;
  }
  const after1 = finalAfterDiscount(price, d1);
  const final = finalAfterDiscount(after1, d2);
  const effective = price > 0 ? (1 - final / price) * 100 : 0;
  const saved = price - final;
  setResult(
    "result-stack",
    formatMoney(final, cur),
    `~${effective.toFixed(1)}% total · save ${formatMoney(saved, cur)}`
  );
}

function calcReverse() {
  const original = parseNum($("#rev-original")?.value);
  const sale = parseNum($("#rev-sale")?.value);
  if (!Number.isFinite(original) || !Number.isFinite(sale) || original <= 0 || sale < 0) {
    setResult("result-reverse", "—");
    return;
  }
  const pct = sale <= original ? (1 - sale / original) * 100 : 0;
  const cur = getCurrency();
  const saved = original - sale;
  setResult(
    "result-reverse",
    `${pct.toFixed(1)}%`,
    `${formatMoney(original, cur)} → ${formatMoney(sale, cur)} · save ${formatMoney(saved, cur)}`
  );
}

function calcRestore() {
  const sale = parseNum($("#restore-sale")?.value);
  const pct = parseNum($("#restore-disc")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(sale) || sale < 0 || pct >= 100) {
    setResult("result-restore", "—");
    return;
  }
  const factor = 1 - clampPct(pct) / 100;
  const original = factor > 0 ? sale / factor : NaN;
  if (!Number.isFinite(original)) {
    setResult("result-restore", "—");
    return;
  }
  setResult(
    "result-restore",
    formatMoney(original, cur),
    `${t("labelNow")}: ${formatMoney(sale, cur)} · ${clampPct(pct).toFixed(1)}% off`
  );
}

function calcVat() {
  const price = parseNum($("#vat-price")?.value);
  const disc = parseNum($("#vat-disc")?.value) || 0;
  const vat = parseNum($("#vat-rate")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(price) || price < 0) {
    setResult("result-vat", "—");
    return;
  }
  const afterDisc = finalAfterDiscount(price, disc);
  const withVat = afterDisc * (1 + clampPct(vat) / 100);
  const taxAmt = withVat - afterDisc;
  setResult(
    "result-vat",
    formatMoney(withVat, cur),
    `${t("labelFinalAfterDisc")}: ${formatMoney(afterDisc, cur)} · tax ${formatMoney(taxAmt, cur)}`
  );
}

function calcQty() {
  const unit = parseNum($("#qty-unit")?.value);
  const qty = parseNum($("#qty-count")?.value);
  const disc = parseNum($("#qty-disc")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(unit) || unit < 0 || !Number.isFinite(qty) || qty <= 0) {
    setResult("result-qty", "—");
    return;
  }
  const line = unit * qty;
  const final = finalAfterDiscount(line, disc);
  const per = final / qty;
  setResult(
    "result-qty",
    formatMoney(final, cur),
    `${qty} × ${formatMoney(unit, cur)} · ${formatMoney(per, cur)} / item`
  );
}

function calcCompare() {
  const pA = parseNum($("#cmp-price-a")?.value);
  const dA = parseNum($("#cmp-disc-a")?.value) || 0;
  const pB = parseNum($("#cmp-price-b")?.value);
  const dB = parseNum($("#cmp-disc-b")?.value) || 0;
  const cur = getCurrency();
  if (!Number.isFinite(pA) || !Number.isFinite(pB) || pA < 0 || pB < 0) {
    setResult("result-compare", "—");
    return;
  }
  const tA = finalAfterDiscount(pA, dA);
  const tB = finalAfterDiscount(pB, dB);
  const diff = Math.abs(tA - tB);
  let verdict = t("compareTie");
  if (tA < tB - 1e-9) verdict = t("compareWinnerA");
  else if (tB < tA - 1e-9) verdict = t("compareWinnerB");

  setResult(
    "result-compare",
    verdict,
    `A: ${formatMoney(tA, cur)} · B: ${formatMoney(tB, cur)} · ${t("compareDiff")}: ${formatMoney(diff, cur)}`
  );
}

function recalcAll() {
  calcSimple();
  calcStack();
  calcReverse();
  calcRestore();
  calcVat();
  calcQty();
  calcCompare();
}

function bindTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.panel;
      tabs.forEach((tb) => tb.setAttribute("aria-selected", tb === tab ? "true" : "false"));
      panels.forEach((p) => {
        p.hidden = p.id !== id;
      });
      const url = new URL(location.href);
      url.searchParams.set("tab", id.replace("panel-", ""));
      history.replaceState(null, "", url);
    });
  });

  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  if (tab) {
    const btn = document.querySelector(`.tab[data-panel="panel-${tab}"]`);
    btn?.click();
  }
}

function bindInputs() {
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", recalcAll);
  });
}

function readStateFromUrl() {
  const p = new URLSearchParams(location.search);
  const map = {
    price: "price",
    discount: "discount",
    currency: "currency",
    sp: "stack-price",
    d1: "stack-d1",
    d2: "stack-d2",
  };
  for (const [param, id] of Object.entries(map)) {
    const v = p.get(param);
    if (v != null && document.getElementById(id)) document.getElementById(id).value = v;
  }
}

function buildShareUrl() {
  const url = new URL(location.href);
  url.searchParams.set("lang", getLang());
  const tab = document.querySelector('.tab[aria-selected="true"]')?.dataset.panel?.replace("panel-", "");
  if (tab) url.searchParams.set("tab", tab);
  const price = $("#price")?.value;
  const discount = $("#discount")?.value;
  const currency = $("#currency")?.value;
  if (price) url.searchParams.set("price", price);
  if (discount) url.searchParams.set("discount", discount);
  if (currency) url.searchParams.set("currency", currency);
  return url.toString();
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const prev = btn.textContent;
    btn.textContent = t("copied");
    setTimeout(() => {
      btn.textContent = prev;
    }, 1500);
  } catch {
    /* ignore */
  }
}

function bindActions() {
  $("#btn-share")?.addEventListener("click", () => {
    copyText(buildShareUrl(), $("#btn-share"));
  });
  $("#btn-copy")?.addEventListener("click", () => {
    const panel = document.querySelector(".panel:not([hidden]) .result");
    const text = panel?.dataset.summary || panel?.querySelector(".result-main")?.textContent || "";
    copyText(text, $("#btn-copy"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticTranslations();
  bindLangSelect();
  bindTabs();
  bindInputs();
  bindActions();
  readStateFromUrl();
  renderAffiliates();
  recalcAll();
});

document.addEventListener("dealmath:lang", () => {
  applyStaticTranslations();
  recalcAll();
});
