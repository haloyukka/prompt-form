/**
 * 共通UI
 * トースト・ダイアログ・ドロワー・テーマ
 */
'use strict';

function toast(msg, kind = 'ok', ms = 2200) {
  const el = h('div', { class: `toast toast-${kind}`, role: 'status', text: msg });
  $('#toasts').append(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

function modal({ title, content, actions, onOpen }) {
  return new Promise(resolve => {
    const dlg = $('#modal');
    if (dlg.open) dlg.close();
    let result = null;
    const footer = h('div', { class: 'modal-actions' },
      actions.map(a => h('button', {
        type: 'button',
        class: a.class || '',
        onclick: () => {
          if (a.validate && !a.validate()) return;
          result = a.value;
          dlg.close();
        },
      }, a.label)));
    dlg.replaceChildren(h('div', { class: 'modal-inner' },
      h('h2', { class: 'modal-title', text: title }), content || null, footer));
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      resolve(result);
    };
    dlg.addEventListener('close', onClose);
    dlg.showModal();
    if (onOpen) onOpen(dlg, footer);
  });
}

async function confirmDialog(message, { title = '確認', ok = 'OK', danger = false } = {}) {
  const r = await modal({
    title,
    content: h('p', { class: 'modal-message', text: message }),
    actions: [
      { label: 'キャンセル', value: null, class: 'ghost' },
      { label: ok, value: true, class: danger ? 'danger' : 'primary' },
    ],
  });
  return r === true;
}

async function promptDialog(title, label, initial, validate, okLabel = '決定') {
  const input = h('input', { type: 'text', value: initial });
  const err = h('p', { class: 'error-text' });
  const check = () => {
    const msg = validate(input.value);
    err.textContent = msg;
    return !msg;
  };
  const r = await modal({
    title,
    content: h('div', { class: 'modal-body' }, h('span', { class: 'vlabel', text: label }), input, err),
    actions: [
      { label: 'キャンセル', value: null, class: 'ghost' },
      { label: okLabel, value: 'ok', class: 'primary', validate: check },
    ],
    onOpen: (dlg, footer) => {
      input.focus();
      input.select();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          footer.lastChild.click();
        }
      });
    },
  });
  return r === 'ok' ? input.value : null;
}

let drawerRender = null;
function openDrawer(title, render) {
  drawerRender = render;
  $('#drawerTitle').textContent = title;
  refreshDrawer();
  const d = $('#drawer');
  d.hidden = false;
  $('#overlay').hidden = false;
  requestAnimationFrame(() => d.classList.add('open'));
  $('#drawerClose').focus();
}
function refreshDrawer() {
  if (!drawerRender) return;
  const body = $('#drawerBody');
  const scroll = body.scrollTop;
  body.replaceChildren();
  drawerRender(body);
  body.scrollTop = scroll;
}
function closeDrawer() {
  const d = $('#drawer');
  d.classList.remove('open');
  $('#overlay').hidden = true;
  drawerRender = null;
  setTimeout(() => { if (!drawerRender) d.hidden = true; }, 220);
}
const drawerOpen = () => !$('#drawer').hidden && drawerRender != null;

/* ---------------------------------------------------------
 * テーマ
 * ------------------------------------------------------- */
function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
