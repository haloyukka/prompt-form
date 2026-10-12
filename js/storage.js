/**
 * 保存（localStorage）
 * 読み書きと容量チェック。保存キーは constants.js の KEYS
 */
'use strict';

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch (e) {
    return fallback;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    checkQuota();
    return true;
  } catch (e) {
    toast('保存できませんでした。容量が不足している可能性があります。設定から書き出してください。', 'error', 5000);
    return false;
  }
}

function storageBytes() {
  let total = 0;
  try {
    for (const k of Object.values(KEYS)) {
      const v = localStorage.getItem(k);
      if (v) total += (k.length + v.length) * 2;
    }
  } catch (e) { /* ignore */ }
  return total;
}

function checkQuota() {
  if (state.quotaWarned) return;
  if (storageBytes() > QUOTA_WARN_BYTES) {
    state.quotaWarned = true;
    toast('保存データが上限に近づいています。設定からバックアップを書き出してください。', 'warn', 6000);
  }
}

const saveTemplates = () => persist(KEYS.templates, state.templates);
const saveHistory = () => persist(KEYS.history, state.history);
const saveLastValues = () => persist(KEYS.lastValues, state.lastValues);
const saveSettings = () => persist(KEYS.settings, state.settings);
