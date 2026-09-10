import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VACCINES } from '../data/vaccines'
import { useApp, vaccineStatusOf } from '../store'
import { ageInMonths } from '../lib/age'
import type { AgeBand, HealthIssue } from '../types'

/** 取该月龄段内应接种的全部剂次（仅覆盖 0-36 月龄数据） */
function bandVaccines(band: AgeBand) {
  const items: { code: string; name: string; doseNo: number; month: number; free: boolean }[] = []
  for (const v of VACCINES) {
    for (const d of v.doses) {
      if (d.month >= band.start && d.month <= band.end && d.month <= 36) {
        items.push({ code: v.code, name: v.name, doseNo: d.doseNo, month: d.month, free: v.free })
      }
    }
  }
  return items.sort((a, b) => a.month - b.month)
}

function IssueCard({ issue }: { issue: HealthIssue }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-amber-50/60 border border-amber-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-stone-700">{issue.name}</span>
        <span className={`text-orange-400 text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-stone-500 leading-relaxed">{issue.desc}</p>
          <ul className="space-y-1">
            {issue.care.map((c, i) => (
              <li key={i} className="text-xs text-stone-600 leading-relaxed flex gap-1.5">
                <span className="text-emerald-500 shrink-0">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface Props {
  band: AgeBand
  /** 未到龄的周期：只读，禁止打卡 */
  readOnly: boolean
  /** 政策待办剩余天数（全局最近一项，无则 null） */
  urgentDays: number | null
}

export default function PeriodModule({ band, readOnly, urgentDays }: Props) {
  const { child, vaccineRecords, milestoneChecks, setMilestone } = useApp()
  if (!child) return null

  const nowMonth = ageInMonths(child.birthDate)
  const vaccines = bandVaccines(band)

  // 本周期内最早一剂未接种的疫苗，作为提醒条
  const reminder = readOnly
    ? undefined
    : vaccines.find((v) => !vaccineStatusOf(vaccineRecords, v.code, v.doseNo))

  return (
    <div
      className={`rounded-3xl bg-white border p-4 transition-all ${
        readOnly ? 'border-stone-200' : 'border-orange-300 shadow-orange-100 shadow-lg'
      }`}
    >
      {/* 疫苗提醒条 */}
      {reminder && (
        <Link
          to="/vaccines"
          className="block mb-4 rounded-2xl bg-orange-50/70 border border-orange-100 px-3 py-2.5 active:scale-[0.99] transition-transform"
        >
          <p className="text-[11px] text-stone-400">💉 本阶段疫苗提醒</p>
          <p className="text-xs font-medium text-stone-700 mt-0.5">
            {reminder.name} 第 {reminder.doseNo} 剂 · 建议 {reminder.month} 月龄接种
            {nowMonth >= reminder.month && (
              <span className="text-rose-500 ml-1">（已到龄，尽快安排）</span>
            )}
          </p>
        </Link>
      )}

      <div className="space-y-4">
        {/* 疫苗 */}
        {vaccines.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-stone-400 mb-1.5">💉 本阶段疫苗</h4>
            <div className="flex flex-wrap gap-1.5">
              {vaccines.map((v) => {
                const done = vaccineStatusOf(vaccineRecords, v.code, v.doseNo)
                const overdue = !done && nowMonth > v.month
                return (
                  <span
                    key={`${v.code}${v.doseNo}`}
                    className={`text-xs rounded-full px-2.5 py-1 border ${
                      done
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : overdue
                          ? 'bg-rose-50 text-rose-500 border-rose-200'
                          : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}
                  >
                    {done ? '✓ ' : ''}
                    {v.month}月龄 · {v.name}第{v.doseNo}剂{v.free ? '' : ' · 自费'}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* 健康问题 */}
        <div>
          <h4 className="text-xs font-medium text-stone-400 mb-1.5">🩺 本阶段高发健康问题</h4>
          <div className="space-y-1.5">
            {band.health.issues.map((issue) => (
              <IssueCard key={issue.name} issue={issue} />
            ))}
          </div>
          {band.health.redFlags.length > 0 && (
            <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
              <p className="text-xs font-bold text-rose-600 mb-1">🚨 出现以下情况建议尽快就医</p>
              <ul className="space-y-0.5">
                {band.health.redFlags.map((f, i) => (
                  <li key={i} className="text-[11px] text-rose-500 leading-relaxed">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 里程碑 */}
        <div>
          <h4 className="text-xs font-medium text-stone-400 mb-1.5">
            🌱 发育里程碑（勾选打卡）
            {readOnly && <span className="ml-1 text-stone-300">· 未到龄，暂不可打卡</span>}
          </h4>
          <div className="space-y-1">
            {band.milestones.map((m) => {
              const achieved = milestoneChecks.some(
                (c) => c.bandId === band.id && c.milestoneId === m.id && c.achieved,
              )
              return (
                <button
                  key={m.id}
                  disabled={readOnly}
                  onClick={() => !readOnly && setMilestone(band.id, m.id, !achieved)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left border transition-colors ${
                    achieved ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50/60 border-stone-100'
                  } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center text-[10px] shrink-0 ${
                      achieved
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-stone-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-xs leading-relaxed ${
                      achieved ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-stone-600'
                    }`}
                  >
                    {m.desc}
                    {m.key && !achieved && (
                      <span className="ml-1 text-[10px] text-amber-500">★关键</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 护理要点 */}
        <div>
          <h4 className="text-xs font-medium text-stone-400 mb-1.5">💡 本阶段护理要点</h4>
          <ul className="space-y-1">
            {band.health.tips.map((t, i) => (
              <li key={i} className="text-xs text-stone-500 leading-relaxed flex gap-1.5">
                <span className="shrink-0">·</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* 政策入口（唯一一条） */}
        <Link
          to="/policy"
          className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2.5 active:scale-[0.99] transition-transform"
        >
          <span>📋</span>
          <span className="text-xs text-sky-700 flex-1 font-medium">政策福利与保障</span>
          {urgentDays !== null && (
            <span className="text-[10px] text-rose-500 font-medium">⏰ 剩余 {urgentDays} 天</span>
          )}
          <span className="text-sky-300 text-xs">›</span>
        </Link>
      </div>
    </div>
  )
}
