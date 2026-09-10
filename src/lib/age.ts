// ===== 月龄计算与日期工具 =====

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayStr(): string {
  return fmtDate(new Date())
}

/** 按月历计算整月龄：不考虑每月天数差异，日不满算未满月 */
export function ageInMonths(birthDate: string, at: Date = new Date()): number {
  const b = parseDate(birthDate)
  let months = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth())
  if (at.getDate() < b.getDate()) months -= 1
  return Math.max(0, months)
}

/** 精确月龄描述：X个月Y天 */
export function ageDetail(birthDate: string, at: Date = new Date()): string {
  const b = parseDate(birthDate)
  const months = ageInMonths(birthDate, at)
  // 月龄锚点日：出生日 + months 个月
  const anchor = new Date(b)
  anchor.setMonth(anchor.getMonth() + months)
  const days = Math.floor((at.getTime() - anchor.getTime()) / 86400000)
  if (months === 0) return `出生第 ${Math.max(1, days + 1)} 天`
  return `${months} 个月 ${days} 天`
}

/** 出生日期 + n 个月的日期（用于疫苗应种日期 / 政策截止倒计时） */
export function addMonths(birthDate: string, n: number): Date {
  const d = parseDate(birthDate)
  d.setMonth(d.getMonth() + n)
  return d
}

/** 距离截止日还剩多少天（相对今天） */
export function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - now.getTime()) / 86400000)
}

export function monthsToBand(month: number): string {
  if (month <= 1) return 'b0-1'
  if (month <= 3) return 'b1-3'
  if (month <= 6) return 'b4-6'
  if (month <= 9) return 'b7-9'
  if (month <= 12) return 'b10-12'
  if (month <= 18) return 'b13-18'
  if (month <= 24) return 'b19-24'
  return 'b25-36'
}
