const TOKEN = /\s+|"[^"]*"|\d+(?:\.\d+)?|[A-Za-z_]\w*|<=|>=|==|!=|[-+*/()<>,]|./g
const WORDS = { and: 'and', or: 'or', not: 'not' }
const SYMBOLS = { '*': '×', '/': '÷', '-': '−', '<=': '≤', '>=': '≥', '!=': '≠', '==': '=' }
export const FUNC_WORDS = new Set(['min', 'max', 'floor', 'ceil', 'round', 'if', 'picked', 'num'])

export function tokens(text = '') {
  return (text.match(TOKEN) ?? []).filter((t) => t.trim()).map((t) => {
    if (t.startsWith('"')) return { kind: 'text', text: t.slice(1, -1) }
    if (/^\d/.test(t)) return { kind: 'num', text: t }
    if (WORDS[t]) return { kind: 'word', text: WORDS[t] }
    if (/^[A-Za-z_]/.test(t)) return { kind: FUNC_WORDS.has(t) ? 'func' : 'name', text: t }
    return { kind: 'op', text: SYMBOLS[t] ?? t }
  })
}
