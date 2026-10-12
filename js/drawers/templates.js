/**
 * テンプレート一覧ドロワー（F-01〜F-06, F-53〜F-54）
 */
'use strict';

function renderListDrawer(body) {
  body.append(h('div', { class: 'toolbar' },
    h('button', { type: 'button', class: 'primary', onclick: () => { closeDrawer(); openEditor(null); } }, '新規作成'),
    h('button', { type: 'button', onclick: importFromFile }, '読み込み（JSON）'),
    h('button', { type: 'button', onclick: addSample }, 'サンプルを追加')));

  const list = sortedTemplates();
  if (!list.length) {
    body.append(h('p', { class: 'muted', text: 'テンプレートはまだありません。' }));
    return;
  }
  body.append(h('ul', { class: 'item-list' }, list.map(t => {
    const usedCount = t.variables.filter(v => !v.unused).length;
    return h('li', { class: 'item' + (t.id === state.currentId ? ' active' : '') },
      h('button', {
        type: 'button', class: 'item-main',
        onclick: async () => {
          if (!await switchTemplate(t.id)) return;
          goScreen('use');
          closeDrawer();
        },
      },
        h('div', { class: 'item-title' }, t.name, t.id === state.currentId ? h('span', { class: 'badge badge-muted', text: '使用中' }) : null),
        h('div', { class: 'item-meta', text: `入力欄 ${usedCount}個 ・ 更新 ${formatDateTime(t.updatedAt)}` })),
      h('div', { class: 'item-actions' },
        h('button', { type: 'button', class: 'small ghost', onclick: () => { closeDrawer(); openEditor(t.id); } }, '編集'),
        h('button', { type: 'button', class: 'small ghost', onclick: () => duplicateTemplate(t.id) }, '複製'),
        h('button', { type: 'button', class: 'small ghost', onclick: () => exportTemplate(t.id) }, '書き出し'),
        h('button', { type: 'button', class: 'small danger-ghost', onclick: () => deleteTemplate(t.id) }, '削除')));
  })));
}

function duplicateTemplate(id) {
  const src = state.templates.find(t => t.id === id);
  if (!src) return;
  const now = new Date().toISOString();
  const t = clone(src);
  t.id = uuid();
  t.name = uniqueName(`${src.name} のコピー`);
  t.createdAt = now;
  t.updatedAt = now;
  state.templates.push(t);
  saveTemplates();
  renderTemplateSelect();
  refreshDrawer();
  toast('複製しました');
}

async function deleteTemplate(id) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return false;
  const ok = await confirmDialog(`「${t.name}」を削除します。元に戻せません。\nコピー履歴は残ります。`, { ok: '削除', danger: true });
  if (!ok) return false;
  state.templates = state.templates.filter(x => x.id !== id);
  delete state.lastValues[id];
  saveTemplates();
  saveLastValues();
  if (state.currentId === id) {
    state.currentId = null;
    state.locked = false;
  }
  renderUse();
  refreshDrawer();
  toast('削除しました');
  return true;
}
