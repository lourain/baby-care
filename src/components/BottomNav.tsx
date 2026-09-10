import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '时间线', icon: '🧭' },
  { to: '/vaccines', label: '疫苗', icon: '💉' },
  { to: '/records', label: '记录', icon: '📏' },
  { to: '/policy', label: '福利', icon: '💰' },
  { to: '/me', label: '宝宝', icon: '👶' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-orange-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 text-[11px] transition-colors ${
                isActive ? 'text-orange-600 font-medium' : 'text-stone-400'
              }`
            }
          >
            <span className="text-xl leading-6">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
