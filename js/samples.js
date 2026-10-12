/**
 * サンプルデータ
 * X日記（要件定義書 7章）と、プレイグラウンドのメール返信（7.4）
 */
'use strict';

const SAMPLE_BODY = `# 固定部分

あなたは、指定Xアカウントの指定日投稿を一次情報として読み、見返し用の日記を作る。推測で生活や感情を埋めない。投稿にない事実は書かない。

## 取得

- 対象は指定アカウントの指定日（JST 0:00–23:59）。Xの時刻はGMTなので、前日15:00 GMT以降を当日分に含める。取得時点が当日中なら、その時刻までと明記する。
- 本文、自リプ、引用、画像、動画、リンク先のタイトルが判定に必要ならそこまで見る。いいね数・再生数は取得時点の値で、増減しうると書く。
- アカウントの表示名・bio・関連アカウントは、日記の口調やログ用途の判断にだけ使う。

## 分析

- 時系列で束ねる。テーマが同じなら深夜／昼／夜のようにまとめてよい。
- 残すのは、後から検索できる固有名詞（曲名、イベント名、作品名、人物、ハッシュタグ）と、投稿者自身の判定（「イメージ通り」「リスト入り」「まだ結論を書いていない」など）。
- 生活記述がない日は「外出ではない」と書く。名前が本文にないものは特定しない。
- 数値・事実には取得日と出典を併記する。検索結果の取得日が当日とずれていれば、古い可能性を明記する。

## 日記

- 1日{{日記の長さ}}。見返しを優先し、気分だけの文は書かない。
- 一人称は投稿者。各行に「いつ・何を・どう判定したか」を入れる。
- 未記載の名前、行っていない行動、投稿にない結論は書かない。
- 出力順は「読み取れた流れ」のあと「日記」。日記本文に引用カードは入れない。

# 可変部分

- アカウント: {{アカウント}}
- 日付: {{日付}}（JST）
- 日記の長さ: {{日記の長さ}}
- 優先: {{優先}}
- 追加ルール: {{追加ルール}}
- 出力: {{出力}}
`;

function sampleTemplate() {
  const now = new Date().toISOString();
  const v = (name, o) => Object.assign(newVar(name, 0), o);
  return normalizeTemplate({
    id: uuid(),
    name: 'X日記',
    body: SAMPLE_BODY,
    createdAt: now,
    updatedAt: now,
    variables: [
      v('アカウント', { order: 1, label: 'Xアカウント', required: true, placeholder: '@なしで入力', keepLast: true }),
      v('日付', { order: 2, type: 'date', required: true, default: 'yesterday', options: { format: DEFAULT_DATE_FORMAT } }),
      v('日記の長さ', { order: 3, type: 'select', required: true, default: '1〜5行', options: { choices: ['1〜3行', '1〜5行'] } }),
      v('優先', { order: 4, type: 'textarea', default: 'あとで見返せること（曲名・イベント名・手元の物と画面の対応・自分の判定）' }),
      v('追加ルール', { order: 5, type: 'textarea', default: '数値と事実には取得日と出典を併記し、古い可能性があれば明記する' }),
      v('出力', {
        order: 6, type: 'select', required: true, default: '分析（時系列の束ね）＋見返し用日記',
        options: { choices: ['分析（時系列の束ね）＋見返し用日記', '分析（時系列の束ね）のみ'] },
      }),
    ],
  }, true);
}

function addSample() {
  const t = sampleTemplate();
  addTemplates([t]);
  goScreen('use');
  openTemplate(t.id);
  refreshDrawer();
  toast(`「${t.name}」を追加しました`);
}

/* ---------------------------------------------------------
 * プレイグラウンドのサンプル（7.4）
 * ------------------------------------------------------- */
const PLAY_SAMPLE_BODY = `あなたはメールの返信を手伝うアシスタントです。
次の条件で、{{相手}}さんへの返信メールの下書きを書いてください。

## 受け取ったメール
{{受け取ったメール}}

## 伝えたいこと
{{伝えたいこと}}

## 条件
- 口調: {{口調}}
- 長さ: {{文字数}}字程度
- 返信日: {{返信日}}
- 冒頭は「{{相手}}さん」で始め、最後に署名「{{自分の名前}}」を入れる
`;

function playSampleVariables() {
  const v = (name, order, o) => Object.assign(newVar(name, order), o || {});
  return [
    v('相手', 1, { placeholder: '例：山田' }),
    v('受け取ったメール', 2, { type: 'textarea', placeholder: '返信したいメールを貼り付け' }),
    v('伝えたいこと', 3, { type: 'textarea', placeholder: '例：日程はOK、資料は金曜までに送る' }),
    v('口調', 4, { type: 'select', default: '丁寧', options: { choices: ['丁寧', 'やわらかめ', 'カジュアル'] } }),
    v('文字数', 5, { type: 'number', default: '300', options: { min: '50', max: '2000' } }),
    v('返信日', 6, { type: 'date', default: 'today', options: { format: 'YYYY年M月D日（ddd）' } }),
    v('自分の名前', 7),
  ];
}
