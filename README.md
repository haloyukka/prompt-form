# Prompt Form

可変式のプロンプトをテンプレートとして登録し、`{{変数名}}` の箇所から入力フォームを自動で作って、コピーできるプロンプトを生成するツールです。サーバー不要で、データはブラウザ内（localStorage）にだけ保存します。

開くと最初に **プレイグラウンド** が表示されます。手持ちの `{{変数}}` 付きプロンプトを貼り付けると入力フォームがその場ででき、入力すると完成したプロンプトをコピーできます。気に入ったら「テンプレートとして保存」で **マイテンプレート** に登録できます。

## 構成

ビルド工程はありません。`index.html` をブラウザで開くか、GitHub Pagesに置くだけで動きます。

```
index.html              画面の骨組み（HTML）
css/style.css           スタイル（色は :root の変数で定義、ダークテーマも同じ変数で切り替え）
assets/favicon.svg      アイコン
js/
  constants.js          定数（保存キー、入力欄の型など）
  utils.js              汎用ヘルパー（DOM操作、日付の整形など）
  storage.js            localStorage の読み書き
  template.js           {{変数}} の解析とプロンプトの生成、読み込み時の正規化
  state.js              画面全体で共有する状態
  ui.js                 トースト・ダイアログ・ドロワー・テーマ
  samples.js            サンプルデータ（X日記、プレイグラウンドのメール返信）
  screens/
    use.js              利用画面（マイテンプレート）
    playground.js       プレイグラウンド
    edit.js             編集画面
  drawers/
    templates.js        テンプレート一覧
    history.js          コピー履歴
    settings.js         設定・バックアップ
  navigation.js         画面の切り替え
  main.js               イベント登録と起動（最後に読み込む）
docs/
  rrd.md                要件定義書
  basic-design.md       基本設計書
  detailed-design.md    詳細設計書（処理の流れ）
  function-reference.md 関数一覧
CLAUDE.md               AIで改修するときのルール
.nojekyll               GitHub PagesのJekyll処理を止める（{{ }} がLiquid構文として解釈されないように）
```

スクリプトは ES Modules ではなく通常の `<script>` で順番に読み込んでいます。ローカルで `index.html` を直接開いた（file://）ときにも動かすためです。そのため `index.html` の `<script>` の順番は変えないでください。

## ドキュメント

| 文書 | 内容 |
| --- | --- |
| [要件定義書](docs/rrd.md) | 何を作るか（機能一覧・画面・データ） |
| [基本設計書](docs/basic-design.md) | どう組み立てているか（ファイル構成・層・画面遷移・データ・設計判断） |
| [詳細設計書](docs/detailed-design.md) | 処理の流れ（起動・解析・描画・コピー・保存・読み込み）と改修ガイド |
| [関数一覧](docs/function-reference.md) | 全関数・定数の役割・引数・戻り値・呼び出し元 |

コードを変えたら設計書も合わせて更新します（ルールは [CLAUDE.md](CLAUDE.md)）。

## GitHub Pagesでの公開

1. このフォルダの内容をGitHubリポジトリの `main` ブランチにpushする
2. リポジトリの **Settings → Pages** を開く
3. **Source** を「Deploy from a branch」、**Branch** を `main` / `/ (root)` にして保存する
4. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で開ける

`/docs` フォルダには要件定義書しかないため、公開元は `/ (root)` を選んでください。

## データについて

- テンプレートとコピー履歴は、開いたブラウザの中にだけ保存されます
- ローカルで開いた `index.html` とGitHub Pages版では保存先が別になります。移行は「設定 → すべて書き出し／読み込み」で行います
