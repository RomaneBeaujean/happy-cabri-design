import type { ReactNode } from 'react'
import { Calendar, Home, Trophy, User, type LucideIcon } from 'lucide-react'
import logoMain from '../../docs/logo_main.svg'

export const MAIN_NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil', mobileLabel: 'Accueil', href: '/', icon: Home },
  { id: 'calendrier', label: 'Calendrier', mobileLabel: 'Calendrier', href: '/calendrier', icon: Calendar },
  { id: 'plans', label: 'Plans de course', mobileLabel: 'Plans', href: '/plans', icon: Trophy },
  { id: 'profil', label: 'Profil coureur', mobileLabel: 'Profil', href: '/profil', icon: User },
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
  className = '',
}: {
  initials: string
  href: string
  isActive: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      aria-label="Compte"
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-500 font-accent text-sm font-semibold text-neutral-0 transition-all',
        isActive ? 'ring-2 ring-secondary-700 ring-offset-2' : 'hover:bg-secondary-600',
        className,
      ].join(' ')}
    >
      {initials}
    </a>
  )
}

function TopBarNavLink({
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
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center gap-150 rounded-[10px] px-300 py-150 font-accent text-sm font-semibold transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-neutral-500 hover:text-neutral-800',
      ].join(' ')}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} />
      {label}
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
          : 'text-neutral-400 hover:text-neutral-600',
      ].join(' ')}
    >
      <Icon className="size-6 shrink-0" strokeWidth={1.75} />
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
      {/* Top bar — mobile */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-center bg-transparent px-300 lg:hidden">
        <a href="/">
          <img src={logoMain} alt="Happy Cabri" className="h-12 w-auto" />
        </a>
      </header>

      {/* Top bar — desktop */}
      <header className="fixed inset-x-0 top-0 z-20 hidden h-20 items-center border-b border-neutral-30 bg-neutral-0/40 px-500 shadow-[0_4px_24px_rgba(29,26,22,0.1)] backdrop-blur-xl lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <a href="/" className="flex items-center">
          <img src={logoMain} alt="Happy Cabri" className="h-12 w-auto" />
        </a>

        <nav className="flex items-center gap-100">
          {MAIN_NAV_ITEMS.map((item) => (
            <TopBarNavLink
              key={item.id}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={activeItem === item.id}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end">
          <UserAvatar
            initials={userInitials}
            href={ACCOUNT_NAV.href}
            isActive={activeItem === ACCOUNT_NAV.id}
          />
        </div>
      </header>

      {/* Content */}
      <main className="min-h-screen pt-16 pb-[96px] lg:pt-20 lg:pb-0">
        <div className="p-200 lg:p-300">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-300 bottom-300 z-20 lg:hidden"
      >
        <div className="flex h-[70px] items-stretch gap-50 rounded-[999px] border border-neutral-30 bg-neutral-0/40 p-100 shadow-[0_8px_40px_rgba(29,26,22,0.18)] backdrop-blur-xl">
          {MAIN_NAV_ITEMS.map((item) => (
            <BottomNavLink
              key={item.id}
              href={item.href}
              label={item.mobileLabel}
              icon={item.icon}
              isActive={activeItem === item.id}
            />
          ))}
          <UserAvatar
            initials={userInitials}
            href={ACCOUNT_NAV.href}
            isActive={activeItem === ACCOUNT_NAV.id}
            className="self-center"
          />
        </div>
      </nav>
    </div>
  )
}
