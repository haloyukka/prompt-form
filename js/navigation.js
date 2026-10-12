/**
 * 画面の切り替え
 * プレイグラウンド／マイテンプレート／編集画面の表示を切り替える
 */
'use strict';

function showScreen(name) {
  state.screen = name;
  $('#playScreen').hidden = name !== 'play';
  $('#useScreen').hidden = name !== 'use';
  $('#editScreen').hidden = name !== 'edit';
  $('#screenTabs').hidden = name === 'edit';
  for (const b of document.querySelectorAll('#screenTabs [data-screen]')) {
    b.setAttribute('aria-selected', String(b.dataset.screen === name));
  }
  $('#headerEdit').hidden = name !== 'edit';
  $('#headerActions').hidden = name === 'edit';
  $('#headerMain').hidden = name !== 'use' || state.templates.length === 0;
  $('#btnEdit').hidden = name !== 'use';
  $('#main').classList.toggle('editing', name === 'edit');
  $('#main').classList.toggle('playing', name === 'play');
  window.scrollTo(0, 0);
}

function goScreen(name) {
  if (name === state.screen) return;
  showScreen(name);
  if (name === 'use') renderUse();
  if (name === 'play') renderPlay();
}
