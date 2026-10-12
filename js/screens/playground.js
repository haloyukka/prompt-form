/**
 * プレイグラウンド（3.8 / F-61〜F-68）
 * 貼り付けたプロンプトからその場でフォームを作る体験用の画面
 * 内容は localStorage に保存しない
 */
'use strict';

function loadPlaySample() {
  const p = state.play;
  p.body = PLAY_SAMPLE_BODY;
  p.variables = playSampleVariables();
  p.values = {};
  for (const v of p.variables) p.values[v.name] = initialValue(v, {});
  state.playSig = '';
}

/** 本文から変数を検出し直す。本文から消えた変数は残さない（F-62） */
function syncPlay() {
  const p = state.play;
  syncVariables(p);
  p.variables = p.variables.filter(v => !v.unused);
  p.variables.forEach(v => { delete v._auto; });
  const names = new Set(p.variables.map(v => v.name));
  for (const v of p.variables) {
    if (!hasOwn(p.values, v.name)) p.values[v.name] = initialValue(v, {});
  }
  for (const k of Object.keys(p.values)) if (!names.has(k)) delete p.values[k];
}

const playSignature = () => state.play.variables.slice().sort(byOrder).map(v => `${v.name}:${v.type}`).join('|');

function renderPlay(force = false) {
  const p = state.play;
  const src = $('#playSrc');
  if (src.value !== p.body) src.value = p.body;
  syncPlay();
  renderPlayWarnings();
  const sig = playSignature();
  if (force || sig !== state.playSig) {
    state.playSig = sig;
    renderPlayForm();
  }
  renderPlayPreview();
  applyPlayTab();
}

function renderPlayWarnings() {
  const box = $('#playWarnings');
  const { invalid } = parseBody(state.play.body);
  box.replaceChildren();
  if (!invalid.length) return;
  box.append(h('div', { class: 'warn-box', role: 'status' },
    '次の記述は変数名のルールに合わないため、入力欄にしていません（使えるのは日本語・英数字・_ です）。',
    h('ul', {}, invalid.slice(0, 5).map(s => h('li', {}, h('code', { text: s })))),
    invalid.length > 5 ? `ほか${invalid.length - 5}件` : null));
}

function changePlayType(v, type) {
  const p = state.play;
  // 直前に入力していた文字は、なるべく新しい型に引き継ぐ（日付・チェックボックスの値は引き継がない）
  const raw = p.values[v.name];
  const prev = (v.type === 'date' || v.type === 'checkbox' || typeof raw !== 'string') ? '' : raw.trim();
  v.type = type;
  v.default = '';
  v.options = {};
  switch (type) {
    case 'date':
      v.default = 'today';
      v.options.format = DEFAULT_DATE_FORMAT;
      break;
    case 'select':
      v.options.choices = prev ? [prev] : [];
      break;
    case 'checkbox':
      v.default = true;
      v.options.onText = prev || v.name;
      v.options.offText = '';
      break;
    default:
      break;
  }
  // 入力値は値として引き継ぎ、初期値（テンプレート保存時に残る設定）にはしない（F-66）
  let next = initialValue(v, {});
  if (type === 'select' || type === 'text' || type === 'textarea') next = prev;
  if (type === 'number' && /^-?\d+(\.\d+)?$/.test(prev)) next = prev;
  p.values[v.name] = next;
  renderPlay(true);
}

function playExtra(v) {
  const o = v.options || {};
  if (v.type === 'select') {
    return h('label', { class: 'field-extra' },
      h('span', { class: 'vlabel', text: '候補（1行に1つ）' }),
      h('textarea', {
        rows: 2, value: (Array.isArray(o.choices) ? o.choices : []).join('\n'),
        onchange: e => {
          v.options = { ...v.options, choices: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) };
          const cur = str(state.play.values[v.name]);
          if (!v.options.choices.includes(cur)) state.play.values[v.name] = v.options.choices[0] || '';
          renderPlay(true);
        },
      }));
  }
  if (v.type === 'checkbox') {
    return h('label', { class: 'field-extra' },
      h('span', { class: 'vlabel', text: 'ONのときに入る文' }),
      h('input', {
        type: 'text', value: str(o.onText),
        oninput: e => { v.options = { ...v.options, onText: e.target.value }; renderPlayPreview(); },
      }));
  }
  return null;
}

function renderPlayForm() {
  const p = state.play;
  const form = $('#playForm');
  form.replaceChildren();
  const vars = p.variables.slice().sort(byOrder);
  const tab = document.querySelector('#playTabs [data-ptab="form"]');
  tab.textContent = vars.length ? `入力（${vars.length}）` : '入力';
  if (!vars.length) {
    form.append(h('p', { class: 'muted small', text: 'まだ入力欄がありません。貼り付けたプロンプトの中で、入力欄にしたい箇所を {{変数名}} と書いてみてください。' }));
    return;
  }
  vars.forEach((v, i) => {
    const typeSel = h('select', {
      class: 'type-select', 'aria-label': `「${v.name}」の入力欄の種類`, value: v.type,
      onchange: e => changePlayType(v, e.target.value),
    }, TYPES.map(([val, lab]) => h('option', { value: val, text: lab })));
    form.append(fieldFor(v, `p${i}`, {
      values: p.values,
      onChange: renderPlayPreview,
      head: typeSel,
      extra: playExtra(v),
    }));
  });
}

function playOutputSegs() {
  return generate(state.play, state.play.values);
}

function renderPlayPreview() {
  const segs = playOutputSegs();
  const out = $('#playPreview');
  if (!state.play.body.trim()) {
    out.replaceChildren(h('span', { class: 'muted', text: '左の欄にプロンプトを貼り付けると、ここにできあがりが表示されます。' }));
  } else {
    out.replaceChildren(...segs.map(s => (s.t === 'var' && !s.filled
      ? h('mark', { class: 'unfilled', text: s.v })
      : document.createTextNode(s.v))));
  }
  const text = segsToText(segs);
  $('#playCharCount').textContent = `${countChars(text).toLocaleString()}文字`;
  const missing = [...new Set(segs.filter(s => s.t === 'var' && !s.filled).map(s => s.name))];
  const empty = !state.play.body.trim();
  $('#btnPlayCopy').disabled = empty;
  $('#btnPlaySave').disabled = empty;
  $('#playMissing').textContent = empty
    ? ''
    : missing.length
      ? `未入力：${missing.join('、')}（このままコピーすると {{…}} のまま残ります）`
      : 'すべて入力されました。コピーしてAIに貼り付けてみましょう。';
}

function applyPlayTab() {
  const g = $('#playGrid');
  for (const t of ['src', 'form', 'preview']) g.classList.toggle(`tab-${t}`, state.playTab === t);
  for (const b of document.querySelectorAll('#playTabs [data-ptab]')) {
    b.setAttribute('aria-selected', String(b.dataset.ptab === state.playTab));
  }
}

async function doPlayCopy() {
  if ($('#btnPlayCopy').disabled) return;
  const text = segsToText(playOutputSegs());
  // F-65：コピー履歴には記録しない
  if (await writeClipboard(text)) toast('コピーしました');
  else showManualCopy(text);
}

function saveFromPlay() {
  const p = state.play;
  if (!p.body.trim()) return;
  syncPlay();
  const vars = clone(p.variables).sort(byOrder).map((v, i) => ({ ...v, order: i + 1 }));
  openEditor(null, { body: p.body, variables: vars });
  toast('名前を付けて保存すると、マイテンプレートに追加されます', 'ok', 3500);
}
