/**
 * テンプレートの解析と生成
 * 本文から {{変数}} を検出し、入力値を差し込んだプロンプトを作る（F-11〜F-15）
 * 読み込み時の正規化もここで行う
 */
'use strict';

function parseBody(body) {
  const segs = [];
  const invalid = [];
  const re = new RegExp(TOKEN_SOURCE, 'g');
  let last = 0;
  let m;
  while ((m = re.exec(body))) {
    if (m.index > last) segs.push({ t: 'text', v: body.slice(last, m.index) });
    if (m[0] === '\\{{') {
      segs.push({ t: 'text', v: '{{' });
    } else if (NAME_RE.test(m[1])) {
      segs.push({ t: 'var', name: m[1] });
    } else {
      segs.push({ t: 'text', v: m[0] });
      invalid.push(m[0]);
    }
    last = re.lastIndex;
  }
  if (last < body.length) segs.push({ t: 'text', v: body.slice(last) });
  const names = [...new Set(segs.filter(s => s.t === 'var').map(s => s.name))];
  return { segs, invalid: [...new Set(invalid)], names };
}

function newVar(name, order) {
  return {
    name, label: '', type: 'text', required: false, default: '',
    placeholder: '', help: '', keepLast: false, order, unused: false, options: {},
  };
}

function isPristine(v) {
  return !v.label && v.type === 'text' && !v.required && !v.default &&
    !v.placeholder && !v.help && !v.keepLast;
}

/** 本文と変数設定を連動させる（F-11〜F-13） */
function syncVariables(t) {
  const { names } = parseBody(t.body);
  const used = new Set(names);
  let maxOrder = t.variables.reduce((m, v) => Math.max(m, v.order || 0), 0);
  for (const n of names) {
    if (!t.variables.some(v => v.name === n)) {
      const v = newVar(n, ++maxOrder);
      v._auto = true;
      t.variables.push(v);
    }
  }
  // 編集中に自動で追加され、まだ何も設定していない変数は、本文から消えたら取り除く（打ちかけの名前が残らないように）
  t.variables = t.variables.filter(v => used.has(v.name) || !(v._auto && isPristine(v)));
  for (const v of t.variables) v.unused = !used.has(v.name);
  return t;
}

function varText(v, raw) {
  switch (v.type) {
    case 'date': return formatDate(raw, v.options && v.options.format);
    case 'checkbox': return raw ? str(v.options && v.options.onText) : str(v.options && v.options.offText);
    default: return str(raw);
  }
}

function isFilled(v, raw) {
  if (v.type === 'checkbox') return true;
  return varText(v, raw).trim() !== '';
}

function generate(t, values) {
  const vmap = Object.fromEntries(t.variables.map(v => [v.name, v]));
  return parseBody(t.body).segs.map(s => {
    if (s.t === 'text') return s;
    const v = vmap[s.name] || newVar(s.name, 0);
    const raw = values[s.name];
    const filled = isFilled(v, raw);
    return { t: 'var', name: s.name, v: filled ? varText(v, raw) : `{{${s.name}}}`, filled };
  });
}

const segsToText = segs => segs.map(s => s.v).join('');

function coerceValue(v, raw) {
  if (v.type === 'checkbox') return raw === true || raw === 'true';
  return str(raw);
}

function initialValue(v, last) {
  if (v.keepLast && hasOwn(last, v.name)) return coerceValue(v, last[v.name]);
  const d = v.default;
  switch (v.type) {
    case 'date':
      if (d === 'today') return isoDate(0);
      if (d === 'yesterday') return isoDate(-1);
      return /^\d{4}-\d{2}-\d{2}$/.test(str(d)) ? d : '';
    case 'checkbox':
      return d === true || d === 'true';
    default:
      return str(d);
  }
}

/* ---------------------------------------------------------
 * 正規化（読み込み時）
 * ------------------------------------------------------- */
function normalizeVar(v) {
  const type = TYPE_KEYS.includes(v.type) ? v.type : 'text';
  return {
    name: v.name,
    label: str(v.label),
    type,
    required: !!v.required,
    default: type === 'checkbox' ? (v.default === true || v.default === 'true') : str(v.default),
    placeholder: str(v.placeholder),
    help: str(v.help),
    keepLast: !!v.keepLast,
    order: Number.isFinite(v.order) ? v.order : 0,
    unused: !!v.unused,
    options: v.options && typeof v.options === 'object' && !Array.isArray(v.options) ? { ...v.options } : {},
  };
}

function normalizeTemplate(raw, newId = false) {
  if (!raw || typeof raw !== 'object' || typeof raw.body !== 'string') return null;
  const now = new Date().toISOString();
  const seen = new Set();
  const vars = (Array.isArray(raw.variables) ? raw.variables : [])
    .filter(v => v && typeof v.name === 'string' && NAME_RE.test(v.name))
    .filter(v => (seen.has(v.name) ? false : (seen.add(v.name), true)))
    .map(normalizeVar);
  const t = {
    id: !newId && typeof raw.id === 'string' && raw.id ? raw.id : uuid(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : '無題のテンプレート',
    body: raw.body,
    variables: vars,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
  syncVariables(t);
  t.variables.forEach(v => delete v._auto);
  return t;
}

function normalizeHistoryItem(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.output !== 'string') return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : uuid(),
    templateId: str(raw.templateId),
    templateName: str(raw.templateName) || '（名前なし）',
    values: raw.values && typeof raw.values === 'object' ? raw.values : {},
    output: raw.output,
    edited: !!raw.edited,
    copiedAt: typeof raw.copiedAt === 'string' ? raw.copiedAt : new Date().toISOString(),
  };
}
