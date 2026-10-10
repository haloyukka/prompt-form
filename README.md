# Prompt Form

可変式のプロンプトをテンプレートとして登録し、`{{変数名}}` の箇所から入力フォームを自動で作って、コピーできるプロンプトを生成するツールです。サーバー不要で、データはブラウザ内（localStorage）にだけ保存します。

## 構成

| パス | 内容 |
| --- | --- |
| `index.html` | ツール本体（HTML・CSS・JavaScriptを1ファイルにまとめたもの） |
| `docs/rrd.md` | 要件定義書 |
| `.nojekyll` | GitHub PagesのJekyll処理を止める（`{{ }}` がLiquid構文として解釈されないように） |

## GitHub Pagesでの公開

1. このフォルダの内容をGitHubリポジトリの `main` ブランチにpushする
2. リポジトリの **Settings → Pages** を開く
3. **Source** を「Deploy from a branch」、**Branch** を `main` / `/ (root)` にして保存する
4. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で開ける

`/docs` フォルダには要件定義書しかないため、公開元は `/ (root)` を選んでください。

## データについて

- テンプレートとコピー履歴は、開いたブラウザの中にだけ保存されます
- ローカルで開いた `index.html` とGitHub Pages版では保存先が別になります。移行は「設定 → すべて書き出し／読み込み」で行います
