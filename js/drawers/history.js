/**
 * コピー履歴ドロワー（F-43〜F-45）
 */
'use strict';

function renderHistoryDrawer(body) {
  if (!state.history.length) {
    body.append(h('p', { class: 'muted', text: 'コピー履歴はまだありません。コピーすると、ここに直近50件まで残ります。' }));
    return;
  }
  body.append(h('div', { class: 'toolbar' },
    h('span', { class: 'muted small', style: 'align-self:center;flex:1', text: `${state.history.length} / ${HISTORY_LIMIT}件` }),
    h('button', {
      type: 'button', class: 'small danger-ghost',
      onclick: async () => {
        if (!await confirmDialog('コピー履歴をすべて削除します。元に戻せません。', { ok: 'すべて削除', danger: true })) return;
        state.history = [];
        saveHistory();
        refreshDrawer();
      },
    }, 'すべて削除')));

  body.append(h('ul', { class: 'item-list' }, state.history.map(item => {
    const exists = state.templates.some(t => t.id === item.templateId);
    return h('li', { class: 'item' },
      h('div', { class: 'item-title' }, item.templateName, item.edited ? h('span', { class: 'badge', text: '手直しあり' }) : null),
      h('div', { class: 'item-meta', text: `${formatDateTime(item.copiedAt)} ・ ${countChars(item.output).toLocaleString()}文字` }),
      h('pre', { class: 'snippet', text: item.output.split('\n').filter(l => l.trim()).slice(0, 3).join('\n') }),
      h('div', { class: 'item-actions' },
        h('button', {
          type: 'button', class: 'small ghost',
          onclick: async () => {
            if (await writeClipboard(item.output)) toast('コピーしました');
            else showManualCopy(item.output);
          },
        }, '再コピー'),
        h('button', {
          type: 'button', class: 'small ghost', disabled: !exists,
          title: exists ? null : 'テンプレートが削除されているため復元できません',
          onclick: () => restoreValues(item),
        }, '入力値を復元'),
        h('button', {
          type: 'button', class: 'small danger-ghost',
          onclick: () => {
            state.history = state.history.filter(x => x.id !== item.id);
            saveHistory();
            refreshDrawer();
          },
        }, '削除')));
  })));
}

async function restoreValues(item) {
  if (state.locked && item.templateId === state.currentId) {
    const ok = await confirmDialog('手直ししたプレビューの内容は破棄されます。入力値を復元しますか？', { ok: '復元' });
    if (!ok) return;
  }
  goScreen('use');
  openTemplate(item.templateId, item.values);
  state.mobileTab = 'form';
  applyMobileTab();
  closeDrawer();
  toast('入力値を復元しました');
}
