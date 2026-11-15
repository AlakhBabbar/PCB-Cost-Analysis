export const isEmail = (v = '') => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

// 10 digit mobile number, or null. A leading 91 is dropped.
export function phoneDigits(v = '') {
  let d = v.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  return d.length === 10 ? d : null
}

export const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v))
