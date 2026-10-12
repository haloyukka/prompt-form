/**
 * 設定ドロワーとバックアップ（F-51〜F-55）
 * テーマ切り替え、全体・テンプレート単位の書き出しと読み込み
 */
'use strict';

function renderSettingsDrawer(body) {
  const themeOpt = (value, label) => h('label', {},
    h('input', {
      type: 'radio', name: 'theme', value, checked: state.settings.theme === value,
      onchange: () => { state.settings.theme = value; saveSettings(); applyTheme(); },
    }), label);

  body.append(
    h('section', { class: 'settings-section' },
      h('h3', { text: 'テーマ' }),
      h('div', { class: 'radio-row' }, themeOpt('auto', '自動（OSに合わせる）'), themeOpt('light', 'ライト'), themeOpt('dark', 'ダーク'))),
    h('section', { class: 'settings-section' },
      h('h3', { text: 'バックアップ' }),
      h('p', { class: 'muted small', text: 'データはこのブラウザの中にだけ保存されています。ブラウザのデータ消去や端末の移行に備えて、定期的に書き出してください。' }),
      h('div', { class: 'toolbar' },
        h('button', { type: 'button', class: 'primary', onclick: exportAll }, 'すべて書き出し'),
        h('button', { type: 'button', onclick: importFromFile }, '読み込み')),
      h('p', { class: 'muted small', text: `テンプレート ${state.templates.length}件 ・ コピー履歴 ${state.history.length}件 ・ 使用量 約${Math.ceil(storageBytes() / 1024).toLocaleString()}KB` })),
    h('section', { class: 'settings-section' },
      h('h3', { text: 'ショートカット' }),
      h('p', { class: 'muted small', text: 'Ctrl + Enter（Macは ⌘ + Enter）でコピーします。' })));
}

function download(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

const safeFileName = s => s.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80) || 'template';

function exportAll() {
  download(`prompt-form-backup-${compactDate()}.json`, {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    kind: 'backup',
    exportedAt: new Date().toISOString(),
    templates: state.templates,
    history: state.history,
  });
  toast('書き出しました');
}

function exportTemplate(id) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return;
  download(`template-${safeFileName(t.name)}.json`, {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    kind: 'template',
    exportedAt: new Date().toISOString(),
    template: t,
  });
  toast('書き出しました');
}

function pickFile() {
  return new Promise(resolve => {
    const input = $('#fileInput');
    input.value = '';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) { resolve(null); return; }
      f.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

function addTemplates(list) {
  for (const t of list) {
    t.name = uniqueName(t.name);
    state.templates.push(t);
  }
  saveTemplates();
}

async function importFromFile() {
  const text = await pickFile();
  if (text == null) return;
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    toast('JSONとして読み込めませんでした', 'error', 4000);
    return;
  }
  if (!data || data.format !== FORMAT_ID) {
    toast('このツールで書き出したファイルではありません', 'error', 4000);
    return;
  }
  if (data.version !== FORMAT_VERSION) {
    toast(`対応していない形式のバージョンです（${str(data.version)}）`, 'error', 4000);
    return;
  }

  if (data.kind === 'template') {
    const t = normalizeTemplate(data.template, true);
    if (!t) {
      toast('テンプレートの内容が正しくありません', 'error', 4000);
      return;
    }
    addTemplates([t]);
    toast(`「${t.name}」を追加しました`);
    if (!state.currentId) openTemplate(t.id); else renderUse();
    refreshDrawer();
    return;
  }

  if (data.kind !== 'backup' || !Array.isArray(data.templates)) {
    toast('ファイルの内容が正しくありません', 'error', 4000);
    return;
  }

  const idMap = {};
  const templates = [];
  for (const raw of data.templates) {
    const t = normalizeTemplate(raw, true);
    if (!t) continue;
    if (raw && typeof raw.id === 'string') idMap[raw.id] = t.id;
    templates.push(t);
  }
  const history = (Array.isArray(data.history) ? data.history : [])
    .map(normalizeHistoryItem).filter(Boolean)
    .map(x => ({ ...x, id: uuid(), templateId: idMap[x.templateId] || x.templateId }));

  const mode = await modal({
    title: 'バックアップの読み込み',
    content: h('p', { class: 'modal-message', text: `テンプレート ${templates.length}件、コピー履歴 ${history.length}件を読み込みます。\n\n追加：今のデータを残したまま加えます。\n全置換：今のデータをすべて削除し、ファイルの内容に置き換えます。` }),
    actions: [
      { label: 'キャンセル', value: null, class: 'ghost' },
      { label: '全置換', value: 'replace', class: 'danger-ghost' },
      { label: '追加', value: 'add', class: 'primary' },
    ],
  });
  if (!mode) return;

  if (mode === 'replace') {
    const ok = await confirmDialog('今のテンプレートとコピー履歴はすべて削除され、元に戻せません。続けますか？', { ok: '全置換する', danger: true });
    if (!ok) return;
    state.templates = templates;
    state.history = history.sort((a, b) => b.copiedAt.localeCompare(a.copiedAt)).slice(0, HISTORY_LIMIT);
    state.lastValues = {};
    state.currentId = null;
    saveTemplates();
    saveLastValues();
  } else {
    addTemplates(templates);
    state.history = [...state.history, ...history]
      .sort((a, b) => b.copiedAt.localeCompare(a.copiedAt))
      .slice(0, HISTORY_LIMIT);
  }
  saveHistory();
  state.locked = false;
  renderUse();
  refreshDrawer();
  toast(mode === 'replace' ? '置き換えました' : '追加しました');
}
