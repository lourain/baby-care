import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { useApp } from '../store'
import { WHO_LENGTH, WHO_WEIGHT, WHO_NOTE } from '../data/who'
import { ageInMonths, parseDate, todayStr } from '../lib/age'
import type { GrowthType } from '../types'

const TYPE_META: Record<GrowthType, { label: string; unit: string; icon: string }> = {
  height: { label: '身高', unit: 'cm', icon: '📏' },
  weight: { label: '体重', unit: 'kg', icon: '⚖️' },
  head: { label: '头围', unit: 'cm', icon: '🎓' },
  temp: { label: '体温', unit: '℃', icon: '🌡️' },
}

function tempLevel(v: number): { text: string; cls: string } | null {
  if (v >= 38.5) return { text: '高热 · 建议就医', cls: 'bg-rose-100 text-rose-600' }
  if (v >= 37.3) return { text: '低热 · 注意观察', cls: 'bg-amber-100 text-amber-600' }
  if (v < 36) return { text: '体温偏低 · 注意保暖并复测', cls: 'bg-sky-100 text-sky-600' }
  return null
}

function GrowthChart({ type }: { type: 'height' | 'weight' }) {
  const { child, growthRecords } = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!child || !ref.current) return
    const who = (type === 'height' ? WHO_LENGTH : WHO_WEIGHT)[child.gender === 'female' ? 'female' : 'male']
    const unit = TYPE_META[type].unit

    const my = growthRecords
      .filter((r) => r.type === type)
      .map((r) => ({
        m: ageInMonths(child.birthDate, parseDate(r.recordDate)),
        v: r.value,
        d: r.recordDate,
      }))
      .sort((a, b) => a.m - b.m)

    const mk = (data: number[], name: string, color: string, dash = false) => ({
      type: 'line' as const,
      data: who.months.map((m, i) => [m, data[i]]),
      name,
      lineStyle: { color, width: 1, type: dash ? ('dashed' as const) : ('solid' as const), opacity: 0.8 },
      itemStyle: { color },
      symbol: 'none',
      area: undefined,
      z: 1,
    })

    const option: echarts.EChartsOption = {
      grid: { left: 40, right: 16, top: 36, bottom: 28 },
      tooltip: { trigger: 'item' },
      legend: {
        top: 0,
        textStyle: { fontSize: 10, color: '#78716c' },
        itemWidth: 14,
        itemHeight: 8,
        data: ['P3', 'P50', 'P97', child.nickname],
      },
      xAxis: {
        type: 'value',
        name: '月龄',
        nameTextStyle: { fontSize: 10, color: '#a8a29e' },
        min: 0,
        max: 36,
        interval: 6,
        axisLabel: { fontSize: 10, color: '#a8a29e' },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { fontSize: 10, color: '#a8a29e' },
        scale: true,
        axisLabel: { fontSize: 10, color: '#a8a29e' },
        splitLine: { lineStyle: { color: '#fef3e2' } },
      },
      series: [
        mk(who.p3, 'P3', '#fdba74', true),
        mk(who.p50, 'P50', '#fb923c'),
        mk(who.p97, 'P97', '#fdba74', true),
        {
          type: 'line',
          name: child.nickname,
          data: my.map((p) => [p.m, p.v]),
          lineStyle: { color: '#f43f5e', width: 2.5 },
          itemStyle: { color: '#f43f5e' },
          symbol: 'circle',
          symbolSize: 7,
          z: 10,
          tooltip: {
            valueFormatter: (v) => `${v} ${unit}`,
          },
        },
      ],
    }

    chartRef.current = echarts.init(ref.current)
    chartRef.current.setOption(option)
    const onResize = () => chartRef.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chartRef.current?.dispose()
    }
  }, [child, growthRecords, type])

  return <div ref={ref} className="w-full h-64" />
}

export default function Records() {
  const { child, growthRecords, addGrowth, deleteGrowth } = useApp()
  const [tab, setTab] = useState<'height' | 'weight' | 'temp'>('height')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayStr())
  const [showForm, setShowForm] = useState(false)
  if (!child) return null

  const unit = TYPE_META[tab].unit
  const list = useMemo(
    () =>
      growthRecords
        .filter((r) => r.type === tab)
        .sort((a, b) => b.recordDate.localeCompare(a.recordDate)),
    [growthRecords, tab],
  )

  const save = () => {
    const v = parseFloat(value)
    if (!v || v <= 0) return
    addGrowth(tab, v, date)
    setValue('')
    setShowForm(false)
  }

  const hasCurve = tab === 'height' || tab === 'weight'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">📏 成长记录</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs rounded-full bg-orange-500 text-white px-4 py-2 shadow shadow-orange-200 active:scale-95"
        >
          {showForm ? '收起' : '+ 记一笔'}
        </button>
      </div>

      {/* 类型切换 */}
      <div className="mt-3 flex gap-2">
        {(['height', 'weight', 'temp'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs rounded-xl py-2 border transition-colors ${
              tab === t
                ? 'bg-orange-500 text-white border-orange-500 shadow shadow-orange-200'
                : 'bg-white text-stone-500 border-orange-100'
            }`}
          >
            {TYPE_META[t].icon} {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* 录入表单 */}
      {showForm && (
        <div className="mt-3 rounded-2xl bg-white border border-orange-100 p-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-stone-400">{TYPE_META[tab].label}（{unit}）</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={tab === 'temp' ? '如 36.8' : tab === 'weight' ? '如 7.5' : '如 68.5'}
                className="mt-1 w-full rounded-xl border border-orange-100 px-3 py-2.5 outline-none focus:border-orange-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-stone-400">记录日期</label>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-orange-100 px-3 py-2.5 outline-none focus:border-orange-300"
              />
            </div>
          </div>
          <button
            onClick={save}
            disabled={!value}
            className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
              value ? 'bg-orange-500 text-white active:scale-[0.98]' : 'bg-orange-100 text-orange-300'
            }`}
          >
            保存记录
          </button>
        </div>
      )}

      {/* 曲线图 */}
      {hasCurve && (
        <div className="mt-4 rounded-3xl bg-white border border-orange-100 p-3 shadow-sm">
          <GrowthChart type={tab} />
          <p className="text-[10px] text-stone-400 text-center mt-1 px-2">{WHO_NOTE}</p>
        </div>
      )}

      {/* 记录列表 */}
      <div className="mt-4 space-y-2 pb-8">
        <h3 className="text-xs font-medium text-stone-400">
          最近记录（{list.length} 条）
        </h3>
        {list.length === 0 && (
          <div className="text-center py-10 text-sm text-stone-400">
            还没有{TYPE_META[tab].label}记录，点右上角「记一笔」开始吧
          </div>
        )}
        {list.map((r) => {
          const tl = r.type === 'temp' ? tempLevel(r.value) : null
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                tl ? 'border-transparent bg-white' : 'bg-white border-orange-100'
              }`}
            >
              <div>
                <p className="text-sm text-stone-700">
                  <span className="text-base font-semibold">
                    {r.value} {unit}
                  </span>
                  {tl && (
                    <span className={`ml-2 text-[10px] rounded-full px-2 py-0.5 ${tl.cls}`}>{tl.text}</span>
                  )}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">{r.recordDate}</p>
              </div>
              <button
                onClick={() => deleteGrowth(r.id)}
                className="text-xs text-stone-300 hover:text-rose-400 px-2"
              >
                删除
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
