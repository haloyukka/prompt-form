/**
 * 起動とイベント登録
 * 他のスクリプトをすべて読み込んだあとに最後に読み込む
 */
'use strict';

/* ---------------------------------------------------------
 * イベント
 * ------------------------------------------------------- */
function bindEvents() {
  $('#templateSelect').addEventListener('change', e => switchTemplate(e.target.value));
  $('#btnList').addEventListener('click', () => openDrawer('テンプレート一覧', renderListDrawer));
  $('#btnHistory').addEventListener('click', () => openDrawer('コピー履歴', renderHistoryDrawer));
  $('#btnSettings').addEventListener('click', () => openDrawer('設定', renderSettingsDrawer));
  $('#btnEdit').addEventListener('click', () => { if (current()) openEditor(state.currentId); });
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);

  $('#emptyNew').addEventListener('click', () => openEditor(null));
  $('#emptySample').addEventListener('click', addSample);
  $('#emptyImport').addEventListener('click', importFromFile);

  for (const b of document.querySelectorAll('#mobileTabs [data-tab]')) {
    b.addEventListener('click', () => { state.mobileTab = b.dataset.tab; applyMobileTab(); });
  }

  for (const b of document.querySelectorAll('#screenTabs [data-screen]')) {
    b.addEventListener('click', () => goScreen(b.dataset.screen));
  }

  // プレイグラウンド
  $('#playSrc').addEventListener('input', e => { state.play.body = e.target.value; renderPlay(); });
  $('#playForm').addEventListener('submit', e => e.preventDefault());
  $('#btnPlayCopy').addEventListener('click', doPlayCopy);
  $('#btnPlaySave').addEventListener('click', saveFromPlay);
  $('#btnPlaySample').addEventListener('click', async () => {
    if (state.play.body !== PLAY_SAMPLE_BODY && state.play.body.trim()
      && !await confirmDialog('貼り付けた内容を消して、サンプルに戻します。', { ok: 'サンプルに戻す' })) return;
    loadPlaySample();
    renderPlay(true);
  });
  $('#btnPlayClear').addEventListener('click', () => {
    state.play.body = '';
    renderPlay();
    $('#playSrc').focus();
  });
  for (const b of document.querySelectorAll('#playTabs [data-ptab]')) {
    b.addEventListener('click', () => { state.playTab = b.dataset.ptab; applyPlayTab(); });
  }

  $('#form').addEventListener('submit', e => e.preventDefault());
  $('#btnCopy').addEventListener('click', doCopy);
  $('#btnReset').addEventListener('click', resetLock);

  const preview = $('#preview');
  preview.setAttribute('contenteditable', 'plaintext-only');
  const plainOnly = preview.contentEditable === 'plaintext-only';
  if (!plainOnly) {
    preview.setAttribute('contenteditable', 'true');
    preview.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }
  preview.addEventListener('input', () => {
    state.locked = true;
    state.lockedText = preview.innerText;
    updateMeta();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerOpen() && !$('#modal').open) {
      closeDrawer();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.screen !== 'edit' && !$('#modal').open && !drawerOpen()) {
      e.preventDefault();
      if (state.screen === 'play') doPlayCopy(); else doCopy();
    }
  });

  window.addEventListener('beforeunload', e => {
    if (state.screen === 'edit' && state.draftDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  window.addEventListener('storage', e => {
    // 別タブでの変更を取り込む（編集中は上書きしない）
    if (!Object.values(KEYS).includes(e.key) || state.screen === 'edit') return;
    const keepId = state.currentId;
    const keepValues = { ...state.values };
    const wasLocked = state.locked;
    loadState();
    if (keepId && state.templates.some(t => t.id === keepId) && !wasLocked) {
      openTemplate(keepId, keepValues);
    } else if (!wasLocked) {
      state.currentId = null;
      renderUse();
    }
    refreshDrawer();
  });
}

/* ---------------------------------------------------------
 * 起動（4.3）
 * ------------------------------------------------------- */
function init() {
  loadState();
  applyTheme();
  bindEvents();
  // マイテンプレート側は前回のテンプレートを開いておく（タブを切り替えたときにすぐ使えるように）
  const lastId = state.settings.lastTemplateId;
  const id = state.templates.some(t => t.id === lastId)
    ? lastId
    : (sortedTemplates()[0] ? sortedTemplates()[0].id : null);
  if (id) openTemplate(id); else renderUse();
  // 起動時は毎回プレイグラウンド（4.3）。サンプル入りで開く
  loadPlaySample();
  showScreen('play');
  renderPlay(true);
}

// テスト用に純粋関数を公開
window.PromptForm = { parseBody, formatDate, generate, syncVariables, normalizeTemplate, segsToText, initialValue, sampleTemplate };

init();
