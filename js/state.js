/**
 * 状態
 * 画面全体で共有する状態と、その読み込み
 */
'use strict';

const state = {
  templates: [],
  history: [],
  lastValues: {},
  settings: { theme: 'auto', lastTemplateId: null },
  currentId: null,
  values: {},
  locked: false,
  lockedText: '',
  mobileTab: 'form',
  screen: 'play',
  returnTo: 'use',
  play: { body: '', variables: [], values: {} },
  playTab: 'src',
  playSig: '',
  draft: null,
  draftDirty: false,
  quotaWarned: false,
};

function loadState() {
  const tpl = load(KEYS.templates, []);
  state.templates = (Array.isArray(tpl) ? tpl : []).map(t => normalizeTemplate(t)).filter(Boolean);
  const hist = load(KEYS.history, []);
  state.history = (Array.isArray(hist) ? hist : []).map(normalizeHistoryItem).filter(Boolean).slice(0, HISTORY_LIMIT);
  const lv = load(KEYS.lastValues, {});
  state.lastValues = lv && typeof lv === 'object' && !Array.isArray(lv) ? lv : {};
  const st = load(KEYS.settings, {});
  state.settings = Object.assign({ theme: 'auto', lastTemplateId: null }, st && typeof st === 'object' ? st : {});
}

const current = () => state.templates.find(t => t.id === state.currentId) || null;
const sortedTemplates = () => [...state.templates].sort((a, b) => str(b.updatedAt).localeCompare(str(a.updatedAt)));

function uniqueName(name, exceptId) {
  const names = new Set(state.templates.filter(t => t.id !== exceptId).map(t => t.name));
  if (!names.has(name)) return name;
  let i = 2;
  while (names.has(`${name} (${i})`)) i++;
  return `${name} (${i})`;
}
