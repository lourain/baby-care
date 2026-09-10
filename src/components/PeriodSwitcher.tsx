import type { AgeBand } from '../types'

interface Props {
  band: AgeBand
  index: number
  total: number
  /** 是否为宝宝真实所处的周期 */
  isCurrent: boolean
  /** 是否为尚未到来的周期 */
  isFuture: boolean
  onPrev: () => void
  onNext: () => void
}

const ARROW_CLS =
  'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xl leading-none ' +
  'text-orange-500 bg-orange-50 active:scale-95 transition ' +
  'disabled:text-stone-300 disabled:bg-stone-100 disabled:active:scale-100'

export default function PeriodSwitcher({
  band,
  index,
  total,
  isCurrent,
  isFuture,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-3xl bg-white border border-orange-100 shadow-sm p-3">
      <button onClick={onPrev} disabled={index === 0} aria-label="上一个周期" className={ARROW_CLS}>
        ‹
      </button>

      <div className="flex-1 min-w-0 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="font-bold text-stone-800 truncate">
            <span className="mr-1">{band.emoji}</span>
            {band.label}
          </h2>
          {isCurrent && (
            <span className="shrink-0 text-[10px] bg-orange-500 text-white rounded-full px-2 py-0.5">
              当前阶段
            </span>
          )}
          {isFuture && (
            <span className="shrink-0 text-[10px] bg-stone-200 text-stone-500 rounded-full px-2 py-0.5">
              未到龄
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-0.5 truncate">{band.theme}</p>
        <p className="text-[10px] text-stone-300 mt-0.5">
          第 {index + 1} / {total} 个周期
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={index === total - 1}
        aria-label="下一个周期"
        className={ARROW_CLS}
      >
        ›
      </button>
    </div>
  )
}
