/**
 * 定数
 * 保存キー・形式バージョン・変数名のルール・入力欄の型など、全体で使う値
 */
'use strict';

const KEYS = {
  templates: 'pf.templates',
  history: 'pf.history',
  lastValues: 'pf.lastValues',
  settings: 'pf.settings',
};
const HISTORY_LIMIT = 50;
const FORMAT_ID = 'prompt-form';
const FORMAT_VERSION = 1;
const QUOTA_WARN_BYTES = 4.5 * 1024 * 1024;
const NAME_RE = /^[\p{L}\p{N}_]+$/u;
const TOKEN_SOURCE = String.raw`\\\{\{|\{\{([^{}\n]*?)\}\}`;
const DEFAULT_DATE_FORMAT = 'YYYY年MM月DD日';
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const TYPES = [
  ['text', '1行テキスト'],
  ['textarea', '複数行テキスト'],
  ['date', '日付'],
  ['select', '選択肢'],
  ['number', '数値'],
  ['checkbox', 'チェックボックス'],
];
const TYPE_KEYS = TYPES.map(t => t[0]);
