import { useState } from 'react'
import { useApp } from '../store'
import { ageDetail, ageInMonths } from '../lib/age'

export default function Profile() {
  const { child, setChild, resetAll } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)
  if (!child) return null

  const month = ageInMonths(child.birthDate)
  const progress = Math.min(100, (month / 36) * 100)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-stone-800">👶 宝宝档案</h1>

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-400 text-white p-5 shadow-lg shadow-orange-200">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}</span>
          <div>
            <p className="text-lg font-bold">{child.nickname}</p>
            <p className="text-xs opacity-90 mt-0.5">
              {child.birthDate} · {ageDetail(child.birthDate)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] opacity-90 mb-1">
            <span>出生</span>
            <span>时间线进度：{month} / 36 月龄</span>
            <span>3 岁</span>
          </div>
          <div className="h-2 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 编辑档案 */}
      <div className="mt-5 rounded-3xl bg-white border border-orange-100 p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-stone-600">编辑资料</h3>

        <div>
          <label className="text-xs text-stone-400">昵称</label>
          <input
            value={child.nickname}
            onChange={(e) => setChild({ nickname: e.target.value })}
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-2.5 outline-none focus:border-orange-300"
          />
        </div>

        <div>
          <label className="text-xs text-stone-400">出生日期</label>
          <input
            type="date"
            value={child.birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setChild({ birthDate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-2.5 outline-none focus:border-orange-300"
          />
        </div>

        <div>
          <label className="text-xs text-stone-400">性别</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(
              [
                ['male', '👦 男孩'],
                ['female', '👧 女孩'],
                ['unknown', '🤫 秘密'],
              ] as const
            ).map(([g, label]) => (
              <button
                key={g}
                onClick={() => setChild({ gender: g })}
                className={`rounded-xl py-2 text-xs transition-all ${
                  child.gender === g ? 'bg-orange-500 text-white' : 'bg-orange-50 text-stone-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-400">所在城市（决定政策内容）</label>
          <select
            value={child.city}
            onChange={(e) => setChild({ city: e.target.value })}
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-2.5 outline-none focus:border-orange-300 bg-white"
          >
            <option value="上海">上海</option>
            <option value="其他">其他城市（仅全国政策）</option>
          </select>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="mt-4 rounded-2xl bg-sky-50 border border-sky-100 p-4">
        <p className="text-xs text-sky-700 leading-relaxed">
          🔒 所有数据（宝宝档案、疫苗打卡、成长记录）仅保存在本机浏览器的 IndexedDB 中，不上传任何服务器。换设备或清除浏览器数据会导致记录丢失，请注意。
          云同步能力已在架构中预留，后续版本支持账号同步。
        </p>
      </div>

      {/* 免责声明 */}
      <div className="mt-3 rounded-2xl bg-stone-100 p-4">
        <p className="text-[11px] text-stone-500 leading-relaxed">
          ⚠️ 免责声明：本应用的健康知识、发育里程碑、生长曲线等内容为公开资料整理的科普参考，不能替代专业医疗建议；宝宝有健康疑虑请咨询儿保或专科医生。政策内容以官方渠道最新发布为准。
        </p>
      </div>

      {/* 危险操作 */}
      <div className="mt-4 mb-8">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full text-xs text-stone-400 underline py-2"
          >
            清除全部数据（重新开始）
          </button>
        ) : (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 space-y-3">
            <p className="text-xs text-rose-600 font-bold">
              将删除宝宝档案、疫苗打卡、成长记录等全部本地数据，不可恢复！
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-xl py-2.5 text-xs bg-white border border-stone-200 text-stone-500"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                }}
                className="flex-1 rounded-xl py-2.5 text-xs bg-rose-500 text-white"
              >
                确认清除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
