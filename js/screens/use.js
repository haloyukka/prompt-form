/**
 * 利用画面（マイテンプレート）
 * フォーム生成・プレビュー・コピー・履歴への記録（F-31〜F-37, F-41〜F-42）
 */
'use strict';

function openTemplate(id, values) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return;
  state.currentId = id;
  state.settings.lastTemplateId = id;
  saveSettings();
  state.locked = false;
  state.lockedText = '';
  const last = state.lastValues[id];
  state.values = {};
  for (const v of t.variables) {
    state.values[v.name] = values && hasOwn(values, v.name)
      ? coerceValue(v, values[v.name])
      : initialValue(v, last);
  }
  renderUse();
}

function renderUse() {
  const has = state.templates.length > 0;
  if (has && !current()) {
    openTemplate(sortedTemplates()[0].id);
    return;
  }
  $('#emptyState').hidden = has;
  $('#useGrid').hidden = !has;
  $('#mobileTabs').hidden = !has;
  $('#headerMain').hidden = !has || state.screen !== 'use';
  $('#btnEdit').disabled = !has;
  renderTemplateSelect();
  if (has) {
    renderForm();
    renderPreview();
  }
  applyMobileTab();
}

function renderTemplateSelect() {
  const sel = $('#templateSelect');
  sel.replaceChildren(...sortedTemplates().map(t => h('option', { value: t.id, text: t.name })));
  if (state.currentId) sel.value = state.currentId;
}

function applyMobileTab() {
  const g = $('#useGrid');
  g.classList.toggle('tab-form', state.mobileTab === 'form');
  g.classList.toggle('tab-preview', state.mobileTab === 'preview');
  for (const b of document.querySelectorAll('#mobileTabs [data-tab]')) {
    b.setAttribute('aria-selected', String(b.dataset.tab === state.mobileTab));
  }
}

function renderForm() {
  const t = current();
  const form = $('#form');
  form.replaceChildren();
  const vars = t.variables.filter(v => !v.unused).sort(byOrder);
  if (!vars.length) {
    form.append(h('p', { class: 'muted small', text: 'このテンプレートには入力欄がありません。編集画面で本文に {{変数名}} を書くと、入力欄が追加されます。' }));
    return;
  }
  vars.forEach((v, i) => form.append(fieldFor(v, `f${i}`)));
}

/**
 * 入力欄を1つ作る。ctx を渡すとプレイグラウンド用（値の置き場所・更新処理・見出し横の部品・欄の下の部品を差し替え）
 */
function fieldFor(v, id, ctx) {
  const label = v.label || v.name;
  const values = ctx ? ctx.values : state.values;
  const val = values[v.name];
  const set = x => {
    values[v.name] = x;
    if (ctx) ctx.onChange(); else renderPreview();
  };
  const ph = v.placeholder || null;
  let control;
  switch (v.type) {
    case 'textarea':
      control = h('textarea', { id, rows: 3, placeholder: ph, value: str(val), oninput: e => set(e.target.value) });
      break;
    case 'number': {
      const o = v.options || {};
      control = h('input', {
        type: 'number', id, placeholder: ph, value: str(val), inputmode: 'decimal', step: 'any',
        min: str(o.min) !== '' ? o.min : null, max: str(o.max) !== '' ? o.max : null,
        oninput: e => set(e.target.value),
      });
      break;
    }
    case 'date': {
      const input = h('input', { type: 'date', id, value: str(val), oninput: e => set(e.target.value), onchange: e => set(e.target.value) });
      const quick = (labelText, offset) => h('button', {
        type: 'button', class: 'small',
        onclick: () => { input.value = isoDate(offset); set(input.value); },
      }, labelText);
      control = h('div', { class: 'date-row' }, input, quick('昨日', -1), quick('今日', 0));
      break;
    }
    case 'select': {
      const choices = (v.options && Array.isArray(v.options.choices)) ? v.options.choices : [];
      const opts = [h('option', { value: '', text: '選択してください' }), ...choices.map(c => h('option', { value: c, text: c }))];
      control = h('select', { id, value: str(val), onchange: e => set(e.target.value) }, opts);
      break;
    }
    case 'checkbox':
      control = h('label', { class: 'check-row' },
        h('input', { type: 'checkbox', id, checked: !!val, onchange: e => set(e.target.checked) }),
        h('span', { text: label }));
      break;
    default:
      control = h('input', { type: 'text', id, placeholder: ph, value: str(val), oninput: e => set(e.target.value) });
  }
  const showReq = v.required && v.type !== 'checkbox';
  let head;
  if (ctx && ctx.head) {
    head = h('div', { class: 'field-label' },
      v.type === 'checkbox'
        ? h('span', { class: 'field-name', text: label })
        : h('label', { class: 'field-name', for: id, text: label }),
      ctx.head);
  } else {
    head = v.type === 'checkbox'
      ? h('div', { class: 'field-label', text: label })
      : h('label', { class: 'field-label', for: id }, label, showReq ? h('span', { class: 'req', text: '必須' }) : null);
  }
  return h('div', { class: 'field', 'data-var': v.name },
    head,
    control,
    ctx && ctx.extra ? ctx.extra : null,
    v.help ? h('p', { class: 'help', text: v.help }) : null);
}

function requiredMissing() {
  const t = current();
  if (!t) return [];
  return t.variables
    .filter(v => !v.unused && v.required && v.type !== 'checkbox')
    .filter(v => !isFilled(v, state.values[v.name]))
    .sort(byOrder);
}

function currentOutput() {
  const t = current();
  if (!t) return '';
  return state.locked ? state.lockedText : segsToText(generate(t, state.values));
}

function renderPreview() {
  const t = current();
  if (!t) return;
  const out = $('#preview');
  if (!state.locked) {
    const segs = generate(t, state.values);
    out.replaceChildren(...segs.map(s => (s.t === 'var' && !s.filled
      ? h('mark', { class: 'unfilled', text: s.v })
      : document.createTextNode(s.v))));
  }
  updateMeta();
}

function updateMeta() {
  const text = currentOutput();
  $('#charCount').textContent = `${countChars(text).toLocaleString()}文字`;
  $('#lockBadge').hidden = !state.locked;
  $('#btnReset').hidden = !state.locked;
  $('#preview').classList.toggle('locked', state.locked);
  $('#previewNote').textContent = state.locked
    ? '手直し中のため、フォームの変更は反映されません。「リセット」でフォームの内容に戻します。'
    : 'プレビューは直接手直しできます。手直しすると、フォームの変更は反映されなくなります。';

  const missing = state.locked ? [] : requiredMissing();
  const names = new Set(missing.map(v => v.name));
  for (const f of document.querySelectorAll('#form .field')) {
    f.classList.toggle('missing', names.has(f.dataset.var));
  }
  const btn = $('#btnCopy');
  const msg = $('#missingMsg');
  btn.disabled = !current() || missing.length > 0;
  msg.classList.toggle('warn', missing.length > 0);
  msg.textContent = missing.length
    ? `未入力の必須項目：${missing.map(v => v.label || v.name).join('、')}`
    : (state.locked ? '手直しした内容をコピーします' : '');
}

async function resetLock() {
  const ok = await confirmDialog('手直しした内容を破棄して、フォームの内容から作り直します。', { ok: 'リセット', danger: true });
  if (!ok) return;
  state.locked = false;
  state.lockedText = '';
  renderPreview();
}

/* ----- コピー（F-37）と履歴（F-41〜F-42） ----- */
async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* フォールバックへ */ }
  try {
    const ta = h('textarea', { value: text, readonly: true, style: 'position:fixed;top:-1000px;left:0;opacity:0' });
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

function showManualCopy(text) {
  const ta = h('textarea', { class: 'manual-copy', value: text, readonly: true });
  modal({
    title: '手動でコピーしてください',
    content: h('div', { class: 'modal-body' },
      h('p', { class: 'modal-message', text: 'この環境では自動でコピーできませんでした。下の文章を選択してコピーしてください。' }), ta),
    actions: [{ label: '閉じる', value: null, class: 'primary' }],
    onOpen: () => { ta.focus(); ta.select(); },
  });
}

async function doCopy() {
  const t = current();
  if (!t || $('#btnCopy').disabled) return;
  const text = currentOutput();
  const ok = await writeClipboard(text);
  recordHistory(t, text);
  state.lastValues[t.id] = clone(state.values);
  saveLastValues();
  if (ok) toast('コピーしました');
  else showManualCopy(text);
}

function recordHistory(t, text) {
  state.history.unshift({
    id: uuid(),
    templateId: t.id,
    templateName: t.name,
    values: clone(state.values),
    output: text,
    edited: state.locked,
    copiedAt: new Date().toISOString(),
  });
  if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
  saveHistory();
  if (drawerOpen()) refreshDrawer();
}

async function switchTemplate(id) {
  if (id === state.currentId) return true;
  if (state.locked) {
    const ok = await confirmDialog('手直ししたプレビューの内容は破棄されます。テンプレートを切り替えますか？', { ok: '切り替える' });
    if (!ok) {
      renderTemplateSelect();
      return false;
    }
  }
  openTemplate(id);
  return true;
}
