import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGE_BANDS } from '../data/bands'
import { useApp } from '../store'
import { ageDetail, ageInMonths, addMonths, daysUntil, monthsToBand } from '../lib/age'
import PeriodSwitcher from '../components/PeriodSwitcher'
import PeriodModule from '../components/PeriodModule'

// 首页：按宝宝当前月龄定位周期，一次只展示一个周期模块，可左右切换
export default function Timeline() {
  const { child, policies } = useApp()

  const nowMonth = child ? ageInMonths(child.birthDate) : 0
  const currentIndex = Math.max(
    0,
    AGE_BANDS.findIndex((b) => b.id === monthsToBand(nowMonth)),
  )

  // 进入首页 / 出生日期变化时，回到宝宝当前所处的周期
  const [viewIndex, setViewIndex] = useState(currentIndex)
  useEffect(() => {
    setViewIndex(currentIndex)
  }, [child?.birthDate, currentIndex])

  if (!child) return null

  const index = Math.min(Math.max(viewIndex, 0), AGE_BANDS.length - 1)
  const band = AGE_BANDS[index]
  const isCurrent = index === currentIndex
  const isFuture = index > currentIndex
  const detail = ageDetail(child.birthDate)
  const overflow = nowMonth > 36

  // 限时待办：最近一项未过期的政策截止
  const urgentDays =
    policies.filter(
      (p) =>
        p.deadlineMonthsFromBirth !== null &&
        p.city !== '其他' &&
        (p.city === 'ALL' || p.city === child.city),
    )
      .map((p) => daysUntil(addMonths(child.birthDate, p.deadlineMonthsFromBirth!)))
      .filter((d) => d > 0)
      .sort((a, b) => a - b)[0] ?? null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* 顶部信息 */}
      <header className="mb-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">{child.nickname} 的成长</h1>
            <p className="text-sm text-orange-600 mt-0.5">🌟 {detail}</p>
          </div>
          <Link to="/me" className="text-3xl">
            {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}
          </Link>
        </div>
      </header>

      {/* 周期切换器 */}
      <PeriodSwitcher
        band={band}
        index={index}
        total={AGE_BANDS.length}
        isCurrent={isCurrent}
        isFuture={isFuture}
        onPrev={() => setViewIndex(index - 1)}
        onNext={() => setViewIndex(index + 1)}
      />

      {overflow && (
        <p className="text-[11px] text-stone-400 mt-2 px-1 leading-relaxed">
          本内容覆盖 0-3 岁，宝宝已 {nowMonth} 个月，当前展示最后一个周期。
        </p>
      )}

      {/* 周期模块 */}
      <div className="mt-4">
        <PeriodModule band={band} readOnly={isFuture} urgentDays={urgentDays} />
      </div>

      <p className="text-[11px] text-stone-400 text-center pb-6 px-6 leading-relaxed mt-6">
        健康与政策内容仅供科普参考，均标注了来源；不能替代专业医疗建议与官方办理指引。
      </p>
    </div>
  )
}
