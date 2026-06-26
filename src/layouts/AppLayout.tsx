import type { ReactNode } from 'react'
import { Calendar, Home, Trophy, User, Settings, Bell, type LucideIcon } from 'lucide-react'
import logoMain from '../../docs/logo_main.svg'

export const MAIN_NAV_ITEMS = [
  { id: 'accueil',    label: 'Accueil',        mobileLabel: 'Accueil',    href: '/',           icon: Home },
  { id: 'calendrier', label: 'Calendrier',      mobileLabel: 'Calendrier', href: '/calendrier',  icon: Calendar },
  { id: 'plans',      label: 'Plans de course', mobileLabel: 'Plans',      href: '/plans',       icon: Trophy },
  { id: 'profil',     label: 'Profil coureur',  mobileLabel: 'Profil',     href: '/profil',      icon: User },
] as const

export const ACCOUNT_NAV = {
  id: 'compte',
  label: 'Compte',
  href: '/compte',
} as const

export type NavItemId =
  | (typeof MAIN_NAV_ITEMS)[number]['id']
  | typeof ACCOUNT_NAV.id

interface AppLayoutProps {
  children: ReactNode
  activeItem: NavItemId
  userInitials?: string
}

function UserAvatar({
  initials,
  href,
  isActive,
  size = 'md',
  className = '',
}: {
  initials: string
  href: string
  isActive: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <a
      href={href}
      aria-label="Compte"
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex shrink-0 items-center justify-center rounded-full bg-primary-500 font-heading font-semibold text-neutral-0 transition-all',
        size === 'md' ? 'size-10 text-sm' : 'size-8 text-xs',
        isActive
          ? 'ring-2 ring-primary-400 ring-offset-2'
          : 'hover:bg-primary-600',
        className,
      ].join(' ')}
    >
      {initials}
    </a>
  )
}

function BottomNavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
}) {
  return (
    <a
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex flex-1 items-center justify-center rounded-[999px] px-50 py-100 transition-all',
        isActive
          ? 'bg-primary-500 text-neutral-0 shadow-sm'
          : 'text-neutral-500 hover:text-neutral-800',
      ].join(' ')}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
    </a>
  )
}

export default function AppLayout({
  children,
  activeItem,
  userInitials = 'RB',
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-app">

      {/* ── Top bar — mobile ── */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-300 lg:hidden">
        <a href="/">
          <img src={logoMain} alt="Happy Cabri" className="h-11 w-auto" />
        </a>
        <div className="flex items-center gap-[3px] rounded-full border border-neutral-40/50 bg-white/60 px-[5px] py-[5px] backdrop-blur-xl">
          <button
            aria-label="Notifications"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-0/60 hover:text-neutral-800"
          >
            <Bell className="size-4" strokeWidth={1.75} />
          </button>
          <button
            aria-label="Paramètres"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-0/60 hover:text-neutral-800"
          >
            <Settings className="size-4" strokeWidth={1.75} />
          </button>
          <UserAvatar
            initials={userInitials}
            href={ACCOUNT_NAV.href}
            isActive={activeItem === ACCOUNT_NAV.id}
            size="sm"
          />
        </div>
      </header>

      {/* ── Top bar — desktop ── */}
      <header className="fixed inset-x-0 top-0 z-20 hidden h-20 items-center justify-between px-600 lg:flex">

        {/* Logo — gauche, grand */}
        <a href="/" className="shrink-0">
          <img src={logoMain} alt="Happy Cabri" className="h-[3.75rem] w-auto" />
        </a>

        {/* Droite : nav pill + icônes utilitaires */}
        <div className="flex items-center gap-200">

          {/* Nav pill — beige/transparent avec blur */}
          <nav>
            <div className="flex items-center gap-[3px] rounded-full border border-neutral-40/40 bg-white/35 px-[5px] py-[5px] backdrop-blur-2xl">
              {MAIN_NAV_ITEMS.map(({ id, label, href, icon: Icon }) => (
                <a
                  key={id}
                  href={href}
                  aria-current={activeItem === id ? 'page' : undefined}
                  className={[
                    'flex items-center gap-[7px] rounded-full px-[14px] py-[8px] font-heading text-sm transition-all',
                    activeItem === id
                      ? 'bg-primary-500 font-semibold text-neutral-0 shadow-sm'
                      : 'font-medium text-neutral-500 hover:text-neutral-800',
                  ].join(' ')}
                >
                  <Icon
                    className="size-[14px] shrink-0"
                    strokeWidth={activeItem === id ? 2.2 : 1.75}
                  />
                  {label}
                </a>
              ))}
            </div>
          </nav>

          {/* Settings */}
          <button
            aria-label="Paramètres"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-40/50 bg-neutral-0/55 text-neutral-500 backdrop-blur-2xl transition-all hover:bg-neutral-0 hover:text-neutral-800"
          >
            <Settings className="size-[17px]" strokeWidth={1.75} />
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-40/50 bg-neutral-0/55 text-neutral-500 backdrop-blur-2xl transition-all hover:bg-neutral-0 hover:text-neutral-800"
          >
            <Bell className="size-[17px]" strokeWidth={1.75} />
          </button>

          {/* Avatar */}
          <UserAvatar
            initials={userInitials}
            href={ACCOUNT_NAV.href}
            isActive={activeItem === ACCOUNT_NAV.id}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="min-h-screen pt-16 pb-[96px] lg:pt-20 lg:pb-0">
        <div className="p-200 lg:p-300">{children}</div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-200 bottom-100 z-20 lg:hidden"
      >
        <div className="flex h-[60px] items-stretch gap-[3px] rounded-[999px] border border-neutral-40/40 bg-white/35 px-[5px] py-[5px] shadow-[0_8px_40px_rgba(28,28,28,0.12)] backdrop-blur-2xl">
          {MAIN_NAV_ITEMS.map((item) => (
            <BottomNavLink
              key={item.id}
              href={item.href}
              label={item.mobileLabel}
              icon={item.icon}
              isActive={activeItem === item.id}
            />
          ))}
        </div>
      </nav>

    </div>
  )
}
