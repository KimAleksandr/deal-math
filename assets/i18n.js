import { LOCALES, LANG_OPTIONS, DEFAULT_LANG } from "./locales.js";

const STORAGE_KEY = "dealmath-lang";

export function resolveLang() {
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get("lang");
  if (fromUrl && LOCALES[fromUrl]) return fromUrl;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES[stored]) return stored;
  const nav = navigator.language?.slice(0, 2);
  if (nav && LOCALES[nav]) return nav;
  return DEFAULT_LANG;
}

let currentLang = resolveLang();

export function getLang() {
  return currentLang;
}

export function getLocale() {
  return LOCALES[currentLang] ?? LOCALES[DEFAULT_LANG];
}

function t(key) {
  const bundle = getLocale();
  const val = bundle[key];
  return typeof val === "string" ? val : "";
}

export function intlLocale() {
  const map = { en: "en-US", ru: "ru-RU", ky: "ky-KG", kk: "kk-KZ", uz: "uz-UZ" };
  return map[currentLang] ?? "en-US";
}

export function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const val = t(key);
    if (val) el.textContent = val;
  });

  document.title = t("metaTitle");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t("metaDescription"));
  document.documentElement.lang = getLocale()._hreflang || currentLang;

  renderFaq();
  renderLangSelect();
}

function renderLangSelect() {
  const sel = document.getElementById("lang");
  if (!sel) return;
  sel.innerHTML = "";
  for (const { code, label } of LANG_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    if (code === currentLang) opt.selected = true;
    sel.appendChild(opt);
  }
}

function renderFaq() {
  const root = document.getElementById("faq-root");
  if (!root) return;
  const faq = getLocale().faq;
  if (!Array.isArray(faq)) return;
  root.innerHTML = "";
  for (const item of faq) {
    if (!item || typeof item !== "object" || !item.q) continue;
    const d = document.createElement("details");
    const s = document.createElement("summary");
    s.textContent = item.q;
    const p = document.createElement("p");
    p.textContent = item.a;
    d.appendChild(s);
    d.appendChild(p);
    root.appendChild(d);
  }
}

export function setLang(code) {
  if (!LOCALES[code]) return;
  currentLang = code;
  localStorage.setItem(STORAGE_KEY, code);
  const url = new URL(location.href);
  url.searchParams.set("lang", code);
  history.replaceState(null, "", url);
  applyStaticTranslations();
  document.dispatchEvent(new CustomEvent("dealmath:lang"));
}

export function bindLangSelect() {
  document.getElementById("lang")?.addEventListener("change", (e) => {
    setLang(e.target.value);
  });
}

export { t };
