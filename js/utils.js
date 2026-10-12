/**
 * 汎用ヘルパー
 * DOM操作（$・h）、日付の整形、文字数などの小さな関数
 */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const hasOwn = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);
const clone = obj => JSON.parse(JSON.stringify(obj));
const str = v => (v == null ? '' : String(v));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  let value;
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'value') { value = v; continue; }
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'readOnly') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  if (value !== undefined) el.value = value;
  return el;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDate(iso, fmt) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const [, y, mo, d] = m;
  const wd = WEEKDAYS[new Date(Number(y), Number(mo) - 1, Number(d)).getDay()];
  const map = { YYYY: y, MM: mo, M: String(Number(mo)), DD: d, D: String(Number(d)), ddd: wd };
  return (fmt || DEFAULT_DATE_FORMAT).replace(/YYYY|MM|M|DD|D|ddd/g, t => map[t]);
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function compactDate() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function countChars(s) { return [...s].length; }
