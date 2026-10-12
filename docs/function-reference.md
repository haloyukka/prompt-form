# 可変プロンプトフォーム 関数一覧

作成日：2026-10-12
対象コード：`main` ブランチ

`js/` 配下でトップレベルに宣言している関数・定数・変数を、ファイルごと・宣言順にすべて載せる。全ファイルが1つのグローバルスコープを共有するため、ここにある名前はどのファイルからでも呼べる（基本設計 2章）。

- **種別**：関数／アロー関数（`const f = () => …`）／定数／変数。`async` は Promise を返す
- **引数**：コード上の宣言をそのまま載せる。`= 値` は既定値
- **呼び出し元**：その名前を参照している関数（コード上の参照を機械的に抽出）。イベントへの登録は `bindEvents`、画面の部品に付けたイベントはその部品を作る関数が呼び出し元になる
- 処理の流れは [`detailed-design.md`](detailed-design.md)、全体像は [`basic-design.md`](basic-design.md) を参照

## 目次

- [`js/constants.js`](#jsconstantsjs)（11件）
- [`js/utils.js`](#jsutilsjs)（14件）
- [`js/storage.js`](#jsstoragejs)（8件）
- [`js/template.js`](#jstemplatejs)（13件）
- [`js/state.js`](#jsstatejs)（5件）
- [`js/ui.js`](#jsuijs)（10件）
- [`js/samples.js`](#jssamplesjs)（5件）
- [`js/screens/use.js`](#jsscreensusejs)（16件）
- [`js/screens/playground.js`](#jsscreensplaygroundjs)（13件）
- [`js/screens/edit.js`](#jsscreenseditjs)（18件）
- [`js/drawers/templates.js`](#jsdrawerstemplatesjs)（3件）
- [`js/drawers/history.js`](#jsdrawershistoryjs)（2件）
- [`js/drawers/settings.js`](#jsdrawerssettingsjs)（8件）
- [`js/navigation.js`](#jsnavigationjs)（2件）
- [`js/main.js`](#jsmainjs)（2件）

合計 130 件

## `js/constants.js`

定数
保存キー・形式バージョン・変数名のルール・入力欄の型など、全体で使う値

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `KEYS` | 定数 | — | — | localStorage の保存キー（`templates`・`history`・`lastValues`・`settings` → `pf.*`） | `bindEvents`、`loadState`、`saveHistory`、`saveLastValues`、`saveSettings`、`saveTemplates`、`storageBytes` |
| `HISTORY_LIMIT` | 定数 | — | `50` | コピー履歴の上限件数（F-42） | `importFromFile`、`loadState`、`recordHistory`、`renderHistoryDrawer` |
| `FORMAT_ID` | 定数 | — | `'prompt-form'` | 書き出しファイルの形式名 | `exportAll`、`exportTemplate`、`importFromFile` |
| `FORMAT_VERSION` | 定数 | — | `1` | 書き出しファイルの形式バージョン | `exportAll`、`exportTemplate`、`importFromFile` |
| `QUOTA_WARN_BYTES` | 定数 | — | 約4.5MB | 容量警告を出すしきい値 | `checkQuota` |
| `NAME_RE` | 定数 | — | 正規表現 | 変数名に使える文字（`[\p{L}\p{N}_]+`） | `normalizeTemplate`、`parseBody`、`renameVar` |
| `TOKEN_SOURCE` | 定数 | — | 正規表現の文字列 | `\{{` または `{{…}}` を見つける正規表現（`parseBody` で使用） | `parseBody` |
| `DEFAULT_DATE_FORMAT` | 定数 | — | `'YYYY年MM月DD日'` | 日付型の出力形式の既定値 | `changePlayType`、`changeType`、`formatDate`、`sampleTemplate`、`typeOptionsEditor` |
| `WEEKDAYS` | 定数 | — | 配列 | 曜日（`ddd` トークン用） | `formatDate` |
| `TYPES` | 定数 | — | 配列 | 入力欄の型の `[キー, 表示名]` 一覧。型の選択肢の表示順 | `TYPE_KEYS`、`renderPlayForm`、`varCard` |
| `TYPE_KEYS` | 定数 | — | 配列 | `TYPES` のキーだけの配列 | `normalizeVar` |

## `js/utils.js`

汎用ヘルパー
DOM操作（$・h）、日付の整形、文字数などの小さな関数

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `$` | アロー関数 | `sel, root = document` | Element \| null | `document.querySelector` の短縮形（`root` を指定すると、その要素の中から探す） | `applyMobileTab`、`applyPlayTab`、`bindEvents`、`closeDrawer`、`doCopy`、`doPlayCopy`、`drawerOpen`、`modal`、`openDrawer`、`openEditor`、`pickFile`、`refreshDrawer`、`renameVar`、`renderEditor`、`renderForm`、`renderPlay`、`renderPlayForm`、`renderPlayPreview`、`renderPlayWarnings`、`renderPreview`、`renderTemplateSelect`、`renderUse`、`renderVarPanel`、`renderWarnings`、`saveDraft`、`showScreen`、`toast`、`updateMeta` |
| `hasOwn` | アロー関数 | `obj, key` | boolean | `obj` が `key` を自分のプロパティとして持つか（`null` 安全） | `initialValue`、`openTemplate`、`saveDraft`、`syncPlay` |
| `clone` | アロー関数 | `obj` | 複製 | JSON経由の深いコピー | `doCopy`、`duplicateTemplate`、`finalizeDraft`、`openEditor`、`recordHistory`、`saveFromPlay` |
| `str` | アロー関数 | `v` | string | `null`・`undefined` を空文字に、それ以外を文字列に | `coerceValue`、`defaultEditor`、`fieldFor`、`importFromFile`、`initialValue`、`normalizeHistoryItem`、`normalizeVar`、`playExtra`、`sortedTemplates`、`typeOptionsEditor`、`varText` |
| `escRe` | アロー関数 | `s` | string | 正規表現の特殊文字をエスケープ | `renameVar` |
| `byOrder` | アロー関数 | `a, b` | number | 変数を `order` で並べる比較関数 | `finalizeDraft`、`playSignature`、`renderForm`、`renderPlayForm`、`renderVarPanel`、`requiredMissing`、`saveFromPlay` |
| `uuid` | 関数 | なし | string | ID生成。`crypto.randomUUID` が無ければ時刻と乱数で代用 | `duplicateTemplate`、`importFromFile`、`normalizeHistoryItem`、`normalizeTemplate`、`recordHistory`、`sampleTemplate`、`saveDraft` |
| `h` | 関数 | `tag, props, ...kids` | Element | DOM要素を作る（詳細設計 10.1） | `confirmDialog`、`defaultEditor`、`download`、`fieldFor`、`importFromFile`、`modal`、`playExtra`、`promptDialog`、`renderEditor`、`renderForm`、`renderHistoryDrawer`、`renderListDrawer`、`renderPlayForm`、`renderPlayPreview`、`renderPlayWarnings`、`renderPreview`、`renderSettingsDrawer`、`renderTemplateSelect`、`renderVarPanel`、`renderWarnings`、`showManualCopy`、`toast`、`typeOptionsEditor`、`varCard`、`vfield`、`vgroup`、`writeClipboard` |
| `pad2` | 関数 | `n` | string | 2桁にゼロ埋め | `compactDate`、`formatDateTime`、`isoDate` |
| `isoDate` | 関数 | `offsetDays = 0` | `YYYY-MM-DD` | 今日から `offsetDays` 日ずらした日付 | `defaultEditor`、`fieldFor`、`initialValue`、`typeOptionsEditor` |
| `formatDate` | 関数 | `iso, fmt` | string | `YYYY-MM-DD` を出力形式で整形。不正な日付は空文字 | `window.PromptForm`（テスト用公開）、`typeOptionsEditor`、`varText` |
| `formatDateTime` | 関数 | `isoString` | string | ISO日時を `YYYY/MM/DD HH:mm` に（一覧・履歴の表示用） | `renderHistoryDrawer`、`renderListDrawer` |
| `compactDate` | 関数 | なし | `YYYYMMDD` | 今日の日付（書き出しファイル名用） | `exportAll` |
| `countChars` | 関数 | `s` | number | サロゲートペアを1文字と数えた文字数 | `renderHistoryDrawer`、`renderPlayPreview`、`updateMeta` |

## `js/storage.js`

保存（localStorage）
読み書きと容量チェック。保存キーは constants.js の KEYS

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `load` | 関数 | `key, fallback` | 値 | localStorage から読んで JSON.parse。失敗時は `fallback` | `loadState` |
| `persist` | 関数 | `key, value` | boolean | JSONで保存し容量を確認。失敗時はトーストを出して `false` | `saveHistory`、`saveLastValues`、`saveSettings`、`saveTemplates` |
| `storageBytes` | 関数 | なし | number | 保存データの概算バイト数 | `checkQuota`、`renderSettingsDrawer` |
| `checkQuota` | 関数 | なし | なし | しきい値を超えたら1回だけ警告のトースト | `persist` |
| `saveTemplates` | アロー関数 | なし | boolean | `state.templates` を保存 | `addTemplates`、`deleteTemplate`、`duplicateTemplate`、`importFromFile`、`saveDraft` |
| `saveHistory` | アロー関数 | なし | boolean | `state.history` を保存 | `importFromFile`、`recordHistory`、`renderHistoryDrawer` |
| `saveLastValues` | アロー関数 | なし | boolean | `state.lastValues` を保存 | `deleteTemplate`、`doCopy`、`importFromFile`、`saveDraft` |
| `saveSettings` | アロー関数 | なし | boolean | `state.settings` を保存 | `openTemplate`、`renderSettingsDrawer` |

## `js/template.js`

テンプレートの解析と生成
本文から {{変数}} を検出し、入力値を差し込んだプロンプトを作る（F-11〜F-15）
読み込み時の正規化もここで行う

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `parseBody` | 関数 | `body` | `{ segs, invalid, names }` | 本文を文字と変数の区切りに分け、ルール外の `{{…}}` と変数名の一覧を返す（詳細設計 2章） | `generate`、`window.PromptForm`（テスト用公開）、`renderPlayWarnings`、`renderWarnings`、`syncVariables` |
| `newVar` | 関数 | `name, order` | Variable | 既定値の変数設定（1行テキスト）を作る | `generate`、`playSampleVariables`、`sampleTemplate`、`syncVariables` |
| `isPristine` | 関数 | `v` | boolean | 変数設定が既定値から何も変わっていないか | `syncVariables` |
| `syncVariables` | 関数 | `t` | `t`（書き換え済み） | 本文と変数設定を同期する（詳細設計 3章） | `finalizeDraft`、`window.PromptForm`（テスト用公開）、`normalizeTemplate`、`renameVar`、`renderEditor`、`syncPlay` |
| `varText` | 関数 | `v, raw` | string | 型に応じて差し込む文字を作る | `generate`、`isFilled` |
| `isFilled` | 関数 | `v, raw` | boolean | 入力済みか（チェックボックスは常に `true`） | `generate`、`requiredMissing` |
| `generate` | 関数 | `t, values` | セグメント配列 | 入力値を差し込んだ区切りの配列を作る（詳細設計 4.1） | `currentOutput`、`window.PromptForm`（テスト用公開）、`playOutputSegs`、`renderPreview` |
| `segsToText` | アロー関数 | `segs` | string | 区切りの配列を1つの文字列に | `currentOutput`、`doPlayCopy`、`window.PromptForm`（テスト用公開）、`renderPlayPreview` |
| `coerceValue` | 関数 | `v, raw` | string \| boolean | 値を型に合わせてそろえる | `initialValue`、`openTemplate` |
| `initialValue` | 関数 | `v, last` | string \| boolean | 入力欄の最初の値を決める（詳細設計 4.2） | `changePlayType`、`window.PromptForm`（テスト用公開）、`loadPlaySample`、`openTemplate`、`syncPlay` |
| `normalizeVar` | 関数 | `v` | Variable | 読み込んだ変数設定の型・既定値を整える | `normalizeTemplate` |
| `normalizeTemplate` | 関数 | `raw, newId = false` | Template \| null | 読み込んだテンプレートを整える。本文が無ければ `null`。`newId` なら IDを振り直す | `importFromFile`、`window.PromptForm`（テスト用公開）、`loadState`、`sampleTemplate` |
| `normalizeHistoryItem` | 関数 | `raw` | HistoryItem \| null | 読み込んだ履歴を整える。`output` が無ければ `null` | `importFromFile`、`loadState` |

## `js/state.js`

状態
画面全体で共有する状態と、その読み込み

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `state` | 定数 | — | — | 画面全体で共有する状態（基本設計 6.2） | ほぼすべての画面処理（59件のため省略） |
| `loadState` | 関数 | なし | なし | localStorage の4キーを読み、正規化して `state` に入れる | `bindEvents`、`init` |
| `current` | アロー関数 | なし | Template \| null | 利用画面で開いているテンプレート | `bindEvents`、`currentOutput`、`doCopy`、`renderForm`、`renderPreview`、`renderUse`、`requiredMissing`、`updateMeta` |
| `sortedTemplates` | アロー関数 | なし | Template[] | 更新日時の新しい順に並べたテンプレート | `init`、`renderListDrawer`、`renderTemplateSelect`、`renderUse` |
| `uniqueName` | 関数 | `name, exceptId` | string | 他のテンプレートと重ならない名前（重なれば `名前 (2)` など） | `addTemplates`、`duplicateTemplate` |

## `js/ui.js`

共通UI
トースト・ダイアログ・ドロワー・テーマ

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `toast` | 関数 | `msg, kind = 'ok', ms = 2200` | なし | 画面下部に通知を出す | `addSample`、`checkQuota`、`deleteTemplate`、`doCopy`、`doPlayCopy`、`duplicateTemplate`、`exportAll`、`exportTemplate`、`importFromFile`、`persist`、`renderHistoryDrawer`、`restoreValues`、`saveDraft`、`saveFromPlay` |
| `modal` | 関数 | `{ title, content, actions, onOpen }` | Promise | ダイアログを開き、押したボタンの `value`（閉じたら `null`）で解決 | `confirmDialog`、`importFromFile`、`promptDialog`、`showManualCopy` |
| `confirmDialog` | async 関数 | `message, { title = '確認', ok = 'OK', danger = false } = {}` | Promise\<boolean\> | 確認ダイアログ | `bindEvents`、`cancelEdit`、`deleteTemplate`、`importFromFile`、`renderHistoryDrawer`、`resetLock`、`restoreValues`、`switchTemplate` |
| `promptDialog` | async 関数 | `title, label, initial, validate, okLabel = '決定'` | Promise\<string \| null\> | 1行入力ダイアログ。`validate` が返したエラー文を表示 | `renameVar` |
| `drawerRender` | 変数 | — | — | 開いているドロワーの中身を描く関数。閉じていれば `null` | `closeDrawer`、`drawerOpen`、`openDrawer`、`refreshDrawer` |
| `openDrawer` | 関数 | `title, render` | なし | ドロワーを開き、`render(body)` で中身を描く | `bindEvents` |
| `refreshDrawer` | 関数 | なし | なし | 開いているドロワーを描き直す（スクロール位置は保つ） | `addSample`、`bindEvents`、`deleteTemplate`、`duplicateTemplate`、`importFromFile`、`openDrawer`、`recordHistory`、`renderHistoryDrawer` |
| `closeDrawer` | 関数 | なし | なし | ドロワーを閉じる | `bindEvents`、`renderListDrawer`、`restoreValues` |
| `drawerOpen` | アロー関数 | なし | boolean | ドロワーが開いているか | `bindEvents`、`recordHistory` |
| `applyTheme` | 関数 | なし | なし | `settings.theme` を `<html data-theme>` に反映 | `init`、`renderSettingsDrawer` |

## `js/samples.js`

サンプルデータ
X日記（要件定義書 7章）と、プレイグラウンドのメール返信（7.4）

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `SAMPLE_BODY` | 定数 | — | string | X日記サンプルの本文（rrd 7章） | `sampleTemplate` |
| `sampleTemplate` | 関数 | なし | Template | X日記サンプルのテンプレート（新しいID） | `addSample`、`window.PromptForm`（テスト用公開） |
| `addSample` | 関数 | なし | なし | X日記サンプルを追加し、利用画面で開く | `bindEvents`、`renderListDrawer` |
| `PLAY_SAMPLE_BODY` | 定数 | — | string | プレイグラウンドのサンプル本文（メール返信。rrd 7.4） | `bindEvents`、`loadPlaySample` |
| `playSampleVariables` | 関数 | なし | Variable[] | プレイグラウンドのサンプルの変数設定 | `loadPlaySample` |

## `js/screens/use.js`

利用画面（マイテンプレート）
フォーム生成・プレビュー・コピー・履歴への記録（F-31〜F-37, F-41〜F-42）

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `openTemplate` | 関数 | `id, values` | なし | テンプレートを開き、入力値を決めて描画（詳細設計 5.1）。`values` を渡すとその値を使う | `addSample`、`bindEvents`、`importFromFile`、`init`、`renderUse`、`restoreValues`、`saveDraft`、`switchTemplate` |
| `renderUse` | 関数 | なし | なし | 利用画面全体を描き直す | `bindEvents`、`cancelEdit`、`deleteFromEditor`、`deleteTemplate`、`goScreen`、`importFromFile`、`init`、`openTemplate` |
| `renderTemplateSelect` | 関数 | なし | なし | ヘッダーのテンプレート選択欄を作り直す | `duplicateTemplate`、`renderUse`、`switchTemplate` |
| `applyMobileTab` | 関数 | なし | なし | スマホ用タブ（入力／プレビュー）の表示を反映 | `bindEvents`、`renderUse`、`restoreValues` |
| `renderForm` | 関数 | なし | なし | 利用画面の入力フォームを作り直す | `renderUse` |
| `fieldFor` | 関数 | `v, id, ctx` | Element | 変数1つ分の入力欄を作る。`ctx` でプレイグラウンド用に差し替え（詳細設計 5.2・7.2） | `renderForm`、`renderPlayForm` |
| `requiredMissing` | 関数 | なし | Variable[] | 必須で未入力の変数 | `updateMeta` |
| `currentOutput` | 関数 | なし | string | コピーする文字列（手直し中なら `lockedText`） | `doCopy`、`updateMeta` |
| `renderPreview` | 関数 | なし | なし | プレビューを作り直し、状態表示を更新 | `fieldFor`、`renderUse`、`resetLock` |
| `updateMeta` | 関数 | なし | なし | 文字数・編集中表示・必須の未入力・コピーボタンを更新 | `bindEvents`、`renderPreview` |
| `resetLock` | async 関数 | なし | Promise | 確認のうえ編集固定モードを解除 | `bindEvents` |
| `writeClipboard` | async 関数 | `text` | Promise\<boolean\> | クリップボードに書く（失敗時は `execCommand` で代用） | `doCopy`、`doPlayCopy`、`renderHistoryDrawer` |
| `showManualCopy` | 関数 | `text` | なし | 手動コピー用のダイアログを出す | `doCopy`、`doPlayCopy`、`renderHistoryDrawer` |
| `doCopy` | async 関数 | なし | Promise | 利用画面のコピー。履歴と前回値も記録（詳細設計 6.1） | `bindEvents` |
| `recordHistory` | 関数 | `t, text` | なし | コピー履歴の先頭に追加し、50件に切り詰めて保存 | `doCopy` |
| `switchTemplate` | async 関数 | `id` | Promise\<boolean\> | テンプレートを切り替える。手直し中は確認し、キャンセルなら `false` | `bindEvents`、`renderListDrawer` |

## `js/screens/playground.js`

プレイグラウンド（3.8 / F-61〜F-68）
貼り付けたプロンプトからその場でフォームを作る体験用の画面
内容は localStorage に保存しない

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `loadPlaySample` | 関数 | なし | なし | プレイグラウンドをサンプルの状態にする | `bindEvents`、`init` |
| `syncPlay` | 関数 | なし | なし | プレイグラウンドの変数と値を本文に同期（消えた変数は捨てる） | `renderPlay`、`saveFromPlay` |
| `playSignature` | アロー関数 | なし | string | 変数の「名前:型」の並び（フォームを作り直すかの判定用） | `renderPlay` |
| `renderPlay` | 関数 | `force = false` | なし | プレイグラウンドを描き直す。`force` でフォームも必ず作り直す（詳細設計 7.2） | `bindEvents`、`cancelEdit`、`changePlayType`、`goScreen`、`init`、`playExtra` |
| `renderPlayWarnings` | 関数 | なし | なし | ルール外の `{{…}}` の警告を表示 | `renderPlay` |
| `changePlayType` | 関数 | `v, type` | なし | プレイグラウンドで型を切り替え、値を引き継ぐ（詳細設計 7.3） | `renderPlayForm` |
| `playExtra` | 関数 | `v` | Element \| null | 選択肢の候補・チェックボックスのON文の入力欄 | `renderPlayForm` |
| `renderPlayForm` | 関数 | なし | なし | プレイグラウンドの入力フォームを作り直す | `renderPlay` |
| `playOutputSegs` | 関数 | なし | セグメント配列 | プレイグラウンドの生成結果 | `doPlayCopy`、`renderPlayPreview` |
| `renderPlayPreview` | 関数 | なし | なし | プレビュー・文字数・未入力の案内・ボタンの有効無効を更新 | `playExtra`、`renderPlay`、`renderPlayForm` |
| `applyPlayTab` | 関数 | なし | なし | スマホ用タブ（貼り付け／入力／プレビュー）の表示を反映 | `bindEvents`、`renderPlay` |
| `doPlayCopy` | async 関数 | なし | Promise | プレイグラウンドのコピー。履歴には記録しない | `bindEvents` |
| `saveFromPlay` | 関数 | なし | なし | 本文と変数設定を引き継いで編集画面を開く | `bindEvents` |

## `js/screens/edit.js`

編集画面（F-02〜F-03, F-11〜F-15, 3.4）
本文の編集と、変数ごとの入力欄の設定

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `openEditor` | 関数 | `id, preset` | なし | 編集画面を開く。`id` が `null` なら新規、`preset` で本文と変数を指定（詳細設計 8.1） | `bindEvents`、`renderListDrawer`、`saveFromPlay` |
| `markDirty` | アロー関数 | なし | なし | 未保存の変更ありにする | `changeType`、`defaultEditor`、`moveVar`、`renameVar`、`renderEditor`、`typeOptionsEditor`、`varCard` |
| `varSignature` | アロー関数 | `d` | string | 変数の「名前:未使用か」の並び（設定カードを作り直すかの判定用） | `renderEditor` |
| `renderEditor` | 関数 | なし | なし | 編集画面全体を作る | `openEditor` |
| `renderWarnings` | 関数 | なし | なし | 本文中のルール外の `{{…}}` を警告 | `renameVar`、`renderEditor` |
| `renderVarPanel` | 関数 | なし | なし | 入力欄の設定（変数カードの一覧）を作り直す | `changeType`、`defaultEditor`、`moveVar`、`renameVar`、`renderEditor`、`typeOptionsEditor`、`varCard` |
| `moveVar` | 関数 | `list, index, dir` | なし | 変数の並び順を1つ上下に入れ替える | `varCard` |
| `changeType` | 関数 | `v, type` | なし | 変数の型を変え、型ごとの初期設定を用意 | `varCard` |
| `renameVar` | async 関数 | `v` | Promise | 変数名を変え、本文中の箇所も置き換える（詳細設計 8.5） | `varCard` |
| `vfield` | 関数 | `label, control, wide = false` | Element | ラベル付きの設定欄（`<label>` で囲む） | `defaultEditor`、`typeOptionsEditor`、`varCard` |
| `vgroup` | 関数 | `label, control, wide = false` | Element | ラベル付きの設定欄（複数の部品を並べる `<div>`） | `defaultEditor`、`typeOptionsEditor` |
| `defaultEditor` | 関数 | `v` | Element | 型ごとの「初期値」の設定欄 | `varCard` |
| `typeOptionsEditor` | 関数 | `v` | Element[] | 型ごとの追加設定欄（出力形式・候補・最小最大・ON/OFFの文） | `varCard` |
| `varCard` | 関数 | `v, ctx` | Element | 変数1つ分の設定カード | `renderVarPanel` |
| `finalizeDraft` | 関数 | `d` | Template | 保存用に下書きを整える（一時的な印を除き、並び順を振り直す） | `saveDraft` |
| `saveDraft` | 関数 | なし | なし | 下書きを保存し、利用画面で開く（詳細設計 8.6） | `renderEditor` |
| `cancelEdit` | async 関数 | なし | Promise | 未保存なら確認し、開く前の画面に戻る | `renderEditor` |
| `deleteFromEditor` | async 関数 | なし | Promise | 編集中のテンプレートを削除し、利用画面に戻る | `renderEditor` |

## `js/drawers/templates.js`

テンプレート一覧ドロワー（F-01〜F-06, F-53〜F-54）

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `renderListDrawer` | 関数 | `body` | なし | テンプレート一覧ドロワーの中身を描く | `bindEvents` |
| `duplicateTemplate` | 関数 | `id` | なし | テンプレートを複製（名前は `… のコピー`） | `renderListDrawer` |
| `deleteTemplate` | async 関数 | `id` | Promise\<boolean\> | 確認のうえテンプレートと前回値を削除 | `deleteFromEditor`、`renderListDrawer` |

## `js/drawers/history.js`

コピー履歴ドロワー（F-43〜F-45）

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `renderHistoryDrawer` | 関数 | `body` | なし | コピー履歴ドロワーの中身を描く | `bindEvents` |
| `restoreValues` | async 関数 | `item` | Promise | 履歴の入力値でテンプレートを開く | `renderHistoryDrawer` |

## `js/drawers/settings.js`

設定ドロワーとバックアップ（F-51〜F-55）
テーマ切り替え、全体・テンプレート単位の書き出しと読み込み

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `renderSettingsDrawer` | 関数 | `body` | なし | 設定ドロワーの中身を描く | `bindEvents` |
| `download` | 関数 | `filename, obj` | なし | オブジェクトをJSONファイルとして保存させる | `exportAll`、`exportTemplate` |
| `safeFileName` | アロー関数 | `s` | string | ファイル名に使えない文字を `_` に置き換え、80文字までに | `exportTemplate` |
| `exportAll` | 関数 | なし | なし | 全テンプレートと履歴を書き出す | `renderSettingsDrawer` |
| `exportTemplate` | 関数 | `id` | なし | テンプレート1つを書き出す | `renderListDrawer` |
| `pickFile` | 関数 | なし | Promise\<string \| null\> | ファイル選択を開き、選んだファイルの中身を返す | `importFromFile` |
| `addTemplates` | 関数 | `list` | なし | 名前の重なりを避けてテンプレートを追加し保存 | `addSample`、`importFromFile` |
| `importFromFile` | async 関数 | なし | Promise | JSONを読み込む（詳細設計 12.2） | `bindEvents`、`renderListDrawer`、`renderSettingsDrawer` |

## `js/navigation.js`

画面の切り替え
プレイグラウンド／マイテンプレート／編集画面の表示を切り替える

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `showScreen` | 関数 | `name` | なし | 画面の表示を切り替える（描画はしない） | `cancelEdit`、`deleteFromEditor`、`goScreen`、`init`、`openEditor`、`saveDraft` |
| `goScreen` | 関数 | `name` | なし | 画面を切り替えて描き直す。利用者の操作による切り替え用 | `addSample`、`bindEvents`、`renderListDrawer`、`restoreValues` |

## `js/main.js`

起動とイベント登録
他のスクリプトをすべて読み込んだあとに最後に読み込む

| 名前 | 種別 | 引数 | 戻り値 | 役割 | 呼び出し元 |
| --- | --- | --- | --- | --- | --- |
| `bindEvents` | 関数 | なし | なし | 固定のDOMにイベントを登録（ボタン・タブ・プレビュー編集・キー・離脱確認・別タブ同期） | `init` |
| `init` | 関数 | なし | なし | 起動処理（詳細設計 1章） | 読み込み時に実行 |
