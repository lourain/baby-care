import { useState } from 'react'
import { useApp } from '../store'

export default function Onboarding() {
  const { setChild } = useApp()
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown')
  const [birthDate, setBirthDate] = useState('')
  const [city, setCity] = useState('上海')

  const valid = nickname.trim() && birthDate

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50 flex flex-col items-center px-6 pt-16">
      <div className="text-6xl mb-4">👶</div>
      <h1 className="text-2xl font-bold text-orange-900">宝宝时间线</h1>
      <p className="text-sm text-orange-700/70 mt-2 text-center">
        0-3 岁疫苗、健康、政策福利、成长记录
        <br />
        一条时间线全搞定
      </p>

      <div className="w-full max-w-sm mt-8 bg-white/80 backdrop-blur rounded-3xl shadow-lg shadow-orange-100 p-6 space-y-5">
        <div>
          <label className="text-sm text-stone-500">宝宝昵称</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="如：小汤圆"
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-3 outline-none focus:border-orange-300 bg-white"
          />
        </div>

        <div>
          <label className="text-sm text-stone-500">性别</label>
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
                onClick={() => setGender(g)}
                className={`rounded-xl py-2.5 text-sm transition-all ${
                  gender === g
                    ? 'bg-orange-500 text-white shadow shadow-orange-200'
                    : 'bg-orange-50 text-stone-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-stone-500">出生日期</label>
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-3 outline-none focus:border-orange-300 bg-white"
          />
        </div>

        <div>
          <label className="text-sm text-stone-500">所在城市（决定政策内容）</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-xl border border-orange-100 px-4 py-3 outline-none focus:border-orange-300 bg-white"
          >
            <option value="上海">上海</option>
            <option value="其他">其他城市（仅全国政策）</option>
          </select>
        </div>

        <button
          disabled={!valid}
          onClick={() => setChild({ nickname: nickname.trim(), gender, birthDate, city })}
          className={`w-full rounded-2xl py-3.5 font-medium transition-all ${
            valid
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 active:scale-[0.98]'
              : 'bg-orange-100 text-orange-300'
          }`}
        >
          开始生成宝宝的时间线 🎉
        </button>
      </div>

      <p className="text-[11px] text-stone-400 mt-6 text-center px-8">
        数据仅保存在本机浏览器中，不上传服务器
      </p>
    </div>
  )
}
