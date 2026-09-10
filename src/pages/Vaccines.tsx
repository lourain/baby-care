import { useMemo, useState } from 'react'
import { VACCINES, VACCINE_NOTE } from '../data/vaccines'
import { useApp, vaccineStatusOf } from '../store'
import { addMonths, ageInMonths, fmtDate, todayStr } from '../lib/age'

type Filter = 'all' | 'due' | 'done'

export default function Vaccines() {
  const { child, vaccineRecords, markVaccine } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [showSelfPaid, setShowSelfPaid] = useState(true)
  if (!child) return null

  const nowMonth = ageInMonths(child.birthDate)

  // 全部剂次打平后按应种月龄分组
  const grouped = useMemo(() => {
    const list = VACCINES.filter((v) => showSelfPaid || v.free).flatMap((v) =>
      v.doses
        .filter((d) => d.month <= 36)
        .map((d) => ({ vaccine: v, dose: d })),
    )
    list.sort((a, b) => a.dose.month - b.dose.month)
    const map = new Map<number, typeof list>()
    for (const item of list) {
      const arr = map.get(item.dose.month) || []
      arr.push(item)
      map.set(item.dose.month, arr)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [showSelfPaid])

  const freeList = VACCINES.filter((v) => v.free).flatMap((v) => v.doses.filter((d) => d.month <= 36))
  const doneCount = VACCINES.filter((v) => v.free).reduce(
    (acc, v) => acc + v.doses.filter((d) => d.month <= 36 && vaccineStatusOf(vaccineRecords, v.code, d.doseNo)).length,
    0,
  )

  const totalCount = freeList.length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-stone-800">💉 疫苗接种</h1>

      {/* 进度 */}
      <div className="mt-3 rounded-3xl bg-white border border-orange-100 p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-stone-500">免费疫苗进度（0-3 岁）</p>
          <p className="text-lg font-bold text-orange-600">
            {doneCount}
            <span className="text-xs text-stone-400 font-normal"> / {totalCount} 剂</span>
          </p>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-orange-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
            style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 筛选 */}
      <div className="mt-4 flex gap-2">
        {(
          [
            ['all', '全部'],
            ['due', '待接种'],
            ['done', '已完成'],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs rounded-full px-3.5 py-1.5 border transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-stone-500 border-orange-100'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowSelfPaid(!showSelfPaid)}
          className={`ml-auto text-xs rounded-full px-3.5 py-1.5 border transition-colors ${
            showSelfPaid ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200'
          }`}
        >
          含自费苗
        </button>
      </div>

      {/* 分组列表 */}
      <div className="mt-4 space-y-5 pb-8">
        {grouped.map(([month, items]) => {
          const visible = items.filter((it) => {
            const done = vaccineStatusOf(vaccineRecords, it.vaccine.code, it.dose.doseNo)
            if (filter === 'done') return done
            if (filter === 'due') return !done && nowMonth >= month
            return true
          })
          if (visible.length === 0) return null

          const dueDate = fmtDate(addMonths(child.birthDate, month))
          const overdue = nowMonth >= month
          return (
            <div key={month}>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className={`text-sm font-bold ${
                    overdue ? 'text-orange-600' : 'text-stone-400'
                  }`}
                >
                  {month} 月龄
                </span>
                <span className="text-[11px] text-stone-400">（{dueDate} 前后）</span>
                {overdue && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">
                    已到龄
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {visible.map(({ vaccine: v, dose: d }) => {
                  const done = vaccineStatusOf(vaccineRecords, v.code, d.doseNo)
                  const rec = vaccineRecords.find(
                    (r) => r.vaccineCode === v.code && r.doseNo === d.doseNo && r.status === 'done',
                  )
                  return (
                    <div
                      key={`${v.code}-${d.doseNo}`}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-orange-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800">
                            {v.name}
                            <span className="text-stone-400 font-normal"> · 第 {d.doseNo} 剂</span>
                            {!v.free && (
                              <span className="ml-1.5 text-[10px] bg-stone-800 text-white rounded px-1.5 py-0.5 align-middle">
                                自费
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">预防：{v.prevent}</p>
                          {v.note && <p className="text-[11px] text-amber-600/80 mt-0.5">💡 {v.note}</p>}
                          {done && rec?.actualDate && (
                            <p className="text-xs text-emerald-600 mt-1">✓ 接种于 {rec.actualDate}</p>
                          )}
                        </div>
                        <button
                          onClick={() => markVaccine(v.code, d.doseNo, !done, todayStr())}
                          className={`shrink-0 text-xs rounded-full px-3.5 py-2 border transition-all active:scale-95 ${
                            done
                              ? 'bg-white text-stone-400 border-stone-200'
                              : 'bg-orange-500 text-white border-orange-500 shadow shadow-orange-200'
                          }`}
                        >
                          {done ? '取消' : '打卡'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {grouped.every(([month, items]) => {
          const visible = items.filter((it) => {
            const done = vaccineStatusOf(vaccineRecords, it.vaccine.code, it.dose.doseNo)
            if (filter === 'done') return done
            if (filter === 'due') return !done && nowMonth >= month
            return true
          })
          return visible.length === 0
        }) && (
          <div className="text-center py-16 text-stone-400 text-sm">
            {filter === 'due' ? '🎉 当前没有待接种的疫苗' : filter === 'done' ? '还没有接种记录' : ''}
          </div>
        )}
      </div>

      <p className="text-[11px] text-stone-400 text-center pb-6 px-4 leading-relaxed">{VACCINE_NOTE}</p>
    </div>
  )
}
