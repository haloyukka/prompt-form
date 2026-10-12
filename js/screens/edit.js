/**
 * 編集画面（F-02〜F-03, F-11〜F-15, 3.4）
 * 本文の編集と、変数ごとの入力欄の設定
 */
'use strict';

/** preset を渡すと、その本文・変数設定で新規作成を始める（プレイグラウンドからの保存 F-66） */
function openEditor(id, preset) {
  const base = id ? state.templates.find(t => t.id === id) : null;
  state.draft = base ? clone(base) : { id: null, name: '', body: '', variables: [] };
  if (!base && preset) {
    state.draft.body = preset.body;
    state.draft.variables = clone(preset.variables);
  }
  state.draft._renames = {};
  state.draftDirty = !base && !!preset;
  if (state.screen !== 'edit') state.returnTo = state.screen;
  showScreen('edit');
  renderEditor();
  if (!base) $('.title-input').focus();
}

const markDirty = () => { state.draftDirty = true; };
const varSignature = d => d.variables.map(v => `${v.name}:${v.unused}`).join('|');

function renderEditor() {
  const d = state.draft;
  const root = $('#editScreen');
  root.replaceChildren();

  const nameInput = h('input', {
    type: 'text', class: 'title-input', placeholder: 'テンプレート名', 'aria-label': 'テンプレート名',
    value: d.name, oninput: e => { d.name = e.target.value; markDirty(); },
  });
  const bar = h('div', { class: 'edit-bar' },
    h('button', { type: 'button', class: 'ghost', onclick: cancelEdit }, '← 戻る'),
    nameInput,
    h('div', { class: 'edit-bar-actions' },
      d.id ? h('button', { type: 'button', class: 'danger-ghost', onclick: deleteFromEditor }, '削除') : null,
      h('button', { type: 'button', class: 'primary', onclick: saveDraft }, '保存')));

  const bodyInput = h('textarea', {
    class: 'body-editor', spellcheck: 'false', 'aria-label': 'プロンプト本文', value: d.body,
    placeholder: 'プロンプト本文を入力します。\n入力欄にしたい箇所は {{変数名}} と書きます。\n例）- 日付: {{日付}}',
    oninput: e => {
      d.body = e.target.value;
      markDirty();
      const before = varSignature(d);
      syncVariables(d);
      renderWarnings();
      if (varSignature(d) !== before) renderVarPanel();
    },
  });

  const left = h('section', { class: 'panel' },
    h('h2', { text: '本文' }),
    h('p', { class: 'editor-help' },
      '入力欄にしたい箇所は ', h('code', { text: '{{変数名}}' }), ' と書きます。変数名には日本語・英数字・', h('code', { text: '_' }),
      ' が使えます。文字として ', h('code', { text: '{{' }), ' を出したいときは ', h('code', { text: '\\{{' }), ' と書きます。'),
    bodyInput,
    h('div', { id: 'bodyWarnings' }));

  const right = h('section', { class: 'panel' },
    h('h2', { text: '入力欄の設定' }),
    h('div', { class: 'var-panel-scroll', id: 'varPanel' }));

  root.append(bar, h('div', { class: 'edit-grid' }, left, right));
  syncVariables(d);
  renderWarnings();
  renderVarPanel();
}

function renderWarnings() {
  const box = $('#bodyWarnings');
  if (!box) return;
  const { invalid } = parseBody(state.draft.body);
  box.replaceChildren();
  if (!invalid.length) return;
  box.append(h('div', { class: 'warn-box', role: 'status' },
    '次の記述は変数名のルールに合わないため、変数として扱わず、そのまま出力します（記号やスペースは使えません）。',
    h('ul', {}, invalid.slice(0, 10).map(s => h('li', {}, h('code', { text: s })))),
    invalid.length > 10 ? `ほか${invalid.length - 10}件` : null));
}

function renderVarPanel() {
  const d = state.draft;
  const p = $('#varPanel');
  if (!p) return;
  const scroll = p.scrollTop;
  p.replaceChildren();
  const used = d.variables.filter(v => !v.unused).sort(byOrder);
  const unused = d.variables.filter(v => v.unused).sort(byOrder);
  if (!used.length && !unused.length) {
    p.append(h('p', { class: 'muted small', text: '本文に {{変数名}} を書くと、ここに入力欄の設定が自動で追加されます。' }));
  }
  used.forEach((v, i) => p.append(varCard(v, { index: i, list: used })));
  if (unused.length) {
    p.append(
      h('h3', { class: 'sub', text: '未使用の変数' }),
      h('p', { class: 'muted small', text: '本文から消えた変数です。設定は残しています。本文に戻すと再び使われます。不要なら削除してください。' }));
    unused.forEach(v => p.append(varCard(v, { unused: true })));
  }
  p.scrollTop = scroll;
}

function moveVar(list, index, dir) {
  const j = index + dir;
  if (j < 0 || j >= list.length) return;
  list.forEach((v, k) => { v.order = k + 1; });
  [list[index].order, list[j].order] = [list[j].order, list[index].order];
  markDirty();
  renderVarPanel();
}

function changeType(v, type) {
  v.type = type;
  v.default = type === 'checkbox' ? false : '';
  if (type === 'checkbox') v.required = false;
  const o = v.options || {};
  if (type === 'date' && !o.format) o.format = DEFAULT_DATE_FORMAT;
  if (type === 'select' && !Array.isArray(o.choices)) o.choices = [];
  v.options = o;
  markDirty();
  renderVarPanel();
}

async function renameVar(v) {
  const d = state.draft;
  const next = await promptDialog('変数名を変更', `{{${v.name}}} の新しい名前（本文中の箇所もまとめて変わります）`, v.name, val => {
    if (!NAME_RE.test(val)) return '日本語・英数字・_ だけで入力してください';
    if (val !== v.name && d.variables.some(x => x.name === val)) return '同じ名前の変数がすでにあります';
    return '';
  }, '変更');
  if (next == null || next === v.name) return;
  const re = new RegExp(String.raw`(?<!\\)\{\{` + escRe(v.name) + String.raw`\}\}`, 'gu');
  d.body = d.body.replace(re, `{{${next}}}`);
  const orig = Object.keys(d._renames).find(k => d._renames[k] === v.name) || v.name;
  d._renames[orig] = next;
  v.name = next;
  v._auto = false;
  markDirty();
  $('.body-editor').value = d.body;
  syncVariables(d);
  renderWarnings();
  renderVarPanel();
}

function vfield(label, control, wide = false) {
  return h('label', { class: 'vfield' + (wide ? ' wide' : '') }, h('span', { class: 'vlabel', text: label }), control);
}
function vgroup(label, control, wide = false) {
  return h('div', { class: 'vfield' + (wide ? ' wide' : '') }, h('span', { class: 'vlabel', text: label }), control);
}

function defaultEditor(v) {
  const set = val => { v.default = val; markDirty(); };
  switch (v.type) {
    case 'textarea':
      return vfield('初期値', h('textarea', { rows: 2, value: str(v.default), oninput: e => set(e.target.value) }), true);
    case 'number':
      return vfield('初期値', h('input', { type: 'number', step: 'any', value: str(v.default), oninput: e => set(e.target.value) }));
    case 'checkbox':
      return vfield('初期値', h('select', { value: v.default ? 'true' : 'false', onchange: e => set(e.target.value === 'true') },
        h('option', { value: 'false', text: 'OFF' }), h('option', { value: 'true', text: 'ON' })));
    case 'select': {
      const choices = Array.isArray(v.options.choices) ? v.options.choices : [];
      return vfield('初期値', h('select', { value: str(v.default), onchange: e => set(e.target.value) },
        h('option', { value: '', text: 'なし' }), choices.map(c => h('option', { value: c, text: c }))));
    }
    case 'date': {
      const d = str(v.default);
      const mode = d === 'today' || d === 'yesterday' ? d : (/^\d{4}-\d{2}-\d{2}$/.test(d) ? 'fixed' : '');
      const sel = h('select', {
        value: mode,
        onchange: e => {
          const m = e.target.value;
          set(m === 'fixed' ? isoDate(0) : m);
          renderVarPanel();
        },
      },
        h('option', { value: '', text: 'なし' }),
        h('option', { value: 'today', text: '今日' }),
        h('option', { value: 'yesterday', text: '昨日' }),
        h('option', { value: 'fixed', text: '日付を指定' }));
      const fixed = mode === 'fixed'
        ? h('input', { type: 'date', value: d, onchange: e => set(e.target.value) })
        : null;
      return vgroup('初期値', h('div', { class: 'date-row' }, sel, fixed));
    }
    default:
      return vfield('初期値', h('input', { type: 'text', value: str(v.default), oninput: e => set(e.target.value) }));
  }
}

function typeOptionsEditor(v) {
  const setOpt = (k, val) => { v.options = { ...v.options, [k]: val }; markDirty(); };
  const o = v.options || {};
  switch (v.type) {
    case 'date': {
      const example = h('span', { class: 'format-example', text: `例：${formatDate(isoDate(0), o.format)}` });
      return [
        vfield('出力形式', h('input', {
          type: 'text', value: str(o.format || DEFAULT_DATE_FORMAT),
          oninput: e => {
            setOpt('format', e.target.value);
            example.textContent = `例：${formatDate(isoDate(0), e.target.value)}`;
          },
        })),
        vgroup('', example),
        h('div', { class: 'vfield wide token-list' },
          '使える記号：', h('code', { text: 'YYYY' }), ' 年　', h('code', { text: 'MM' }), ' 月（2桁）　', h('code', { text: 'M' }),
          ' 月　', h('code', { text: 'DD' }), ' 日（2桁）　', h('code', { text: 'D' }), ' 日　', h('code', { text: 'ddd' }), ' 曜日'),
      ];
    }
    case 'select':
      return [vfield('候補（1行に1つ）', h('textarea', {
        rows: 3, value: (Array.isArray(o.choices) ? o.choices : []).join('\n'),
        oninput: e => setOpt('choices', e.target.value.split('\n').map(s => s.trim()).filter(Boolean)),
        onchange: () => renderVarPanel(),
      }), true)];
    case 'number':
      return [
        vfield('最小値', h('input', { type: 'number', step: 'any', value: str(o.min), oninput: e => setOpt('min', e.target.value) })),
        vfield('最大値', h('input', { type: 'number', step: 'any', value: str(o.max), oninput: e => setOpt('max', e.target.value) })),
      ];
    case 'checkbox':
      return [
        vfield('ONのときに入る文', h('textarea', { rows: 2, value: str(o.onText), oninput: e => setOpt('onText', e.target.value) }), true),
        vfield('OFFのときに入る文（空欄可）', h('textarea', { rows: 2, value: str(o.offText), oninput: e => setOpt('offText', e.target.value) }), true),
      ];
    default:
      return [];
  }
}

function varCard(v, ctx) {
  const d = state.draft;
  const set = (k, val) => { v[k] = val; markDirty(); };

  const actions = ctx.unused
    ? [h('button', {
      type: 'button', class: 'small danger-ghost',
      onclick: () => { d.variables = d.variables.filter(x => x !== v); markDirty(); renderVarPanel(); },
    }, '削除')]
    : [
      h('button', { type: 'button', class: 'small ghost', 'aria-label': '上へ移動', disabled: ctx.index === 0, onclick: () => moveVar(ctx.list, ctx.index, -1) }, '↑'),
      h('button', { type: 'button', class: 'small ghost', 'aria-label': '下へ移動', disabled: ctx.index === ctx.list.length - 1, onclick: () => moveVar(ctx.list, ctx.index, 1) }, '↓'),
      h('button', { type: 'button', class: 'small ghost', onclick: () => renameVar(v) }, '名前変更'),
    ];

  const head = h('div', { class: 'var-head' },
    h('code', { class: 'var-name', text: `{{${v.name}}}` }),
    ctx.unused ? h('span', { class: 'badge badge-muted', text: '未使用' }) : null,
    v.label && !ctx.unused ? h('span', { class: 'muted small', text: v.label }) : null,
    h('div', { class: 'var-head-actions' }, actions));

  if (ctx.unused) return h('div', { class: 'var-card unused' }, head);

  const fields = [
    vfield('表示名', h('input', { type: 'text', value: v.label, placeholder: v.name, oninput: e => set('label', e.target.value) })),
    vfield('型', h('select', { value: v.type, onchange: e => changeType(v, e.target.value) },
      TYPES.map(([val, lab]) => h('option', { value: val, text: lab })))),
    defaultEditor(v),
  ];
  if (v.type === 'text' || v.type === 'textarea' || v.type === 'number') {
    fields.push(vfield('プレースホルダー', h('input', { type: 'text', value: v.placeholder, oninput: e => set('placeholder', e.target.value) })));
  }
  fields.push(vfield('説明文', h('input', { type: 'text', value: v.help, oninput: e => set('help', e.target.value) }), v.type !== 'text' && v.type !== 'textarea' && v.type !== 'number'));
  fields.push(...typeOptionsEditor(v));

  const flags = h('div', { class: 'vflags' },
    v.type !== 'checkbox'
      ? h('label', {}, h('input', { type: 'checkbox', checked: v.required, onchange: e => set('required', e.target.checked) }), '必須')
      : null,
    h('label', {}, h('input', { type: 'checkbox', checked: v.keepLast, onchange: e => set('keepLast', e.target.checked) }), '前回の値を引き継ぐ'));

  return h('div', { class: 'var-card' }, head, h('div', { class: 'var-grid' }, fields), flags);
}

function finalizeDraft(d) {
  const t = clone(d);
  delete t._renames;
  syncVariables(t);
  t.variables.forEach(v => delete v._auto);
  t.variables.filter(v => !v.unused).sort(byOrder).forEach((v, i) => { v.order = i + 1; });
  return t;
}

function saveDraft() {
  const d = state.draft;
  if (!d.name.trim()) {
    toast('テンプレート名を入力してください', 'error');
    $('.title-input').focus();
    return;
  }
  const now = new Date().toISOString();
  const t = finalizeDraft(d);
  t.name = t.name.trim();
  t.updatedAt = now;
  if (!t.id) {
    t.id = uuid();
    t.createdAt = now;
    state.templates.push(t);
  } else {
    const i = state.templates.findIndex(x => x.id === t.id);
    if (i >= 0) state.templates[i] = t; else state.templates.push(t);
  }

  const renameKeys = (obj) => {
    if (!obj) return;
    for (const [from, to] of Object.entries(d._renames)) {
      if (from !== to && hasOwn(obj, from)) { obj[to] = obj[from]; delete obj[from]; }
    }
  };
  renameKeys(state.lastValues[t.id]);
  const keepValues = state.currentId === t.id ? { ...state.values } : null;
  renameKeys(keepValues);

  if (!saveTemplates()) return;
  saveLastValues();
  state.draftDirty = false;
  state.draft = null;
  showScreen('use');
  openTemplate(t.id, keepValues || undefined);
  toast('保存しました');
}

async function cancelEdit() {
  if (state.draftDirty) {
    const ok = await confirmDialog('保存していない変更は破棄されます。編集を終了しますか？', { ok: '破棄して戻る', danger: true });
    if (!ok) return;
  }
  state.draftDirty = false;
  state.draft = null;
  const back = state.returnTo === 'play' ? 'play' : 'use';
  showScreen(back);
  if (back === 'play') renderPlay(); else renderUse();
}

async function deleteFromEditor() {
  const id = state.draft && state.draft.id;
  if (!id) return;
  if (await deleteTemplate(id)) {
    state.draftDirty = false;
    state.draft = null;
    showScreen('use');
    renderUse();
  }
}
