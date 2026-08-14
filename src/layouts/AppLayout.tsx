import { type ReactNode, useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Home, Mountain, User, Settings, CreditCard, LogOut, type LucideIcon } from 'lucide-react'
import logoMain from '../assets/logo.svg'
import { getAvatarUrl, subscribeAvatarUrl } from '../stores/userAvatar'

export const ACCOUNT_MENU_ITEMS = [
  { label: 'Modifier les paramètres du compte', sublabel: 'Email, mot de passe, téléphone', href: '/compte/parametres', icon: Settings },
  { label: 'Gérer l’abonnement et les achats', sublabel: 'Formule, moyens de paiement, factures', href: '/compte/abonnement', icon: CreditCard },
] as const

export const MAIN_NAV_ITEMS = [
  { id: 'accueil',    label: 'Accueil',        mobileLabel: 'Accueil',    href: '/',           icon: Home },
  { id: 'calendrier', label: 'Calendrier',      mobileLabel: 'Calendrier', href: '/calendrier',  icon: Calendar },
  { id: 'plans',      label: 'Plans de course', mobileLabel: 'Plans',      href: '/plans',       icon: Mountain },
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
  isActive,
  size = 'md',
  className = '',
}: {
  initials: string
  isActive: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  const avatarUrl = useSyncExternalStore(subscribeAvatarUrl, getAvatarUrl)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setOpen(o => !o)
  }

  function logout() {
    setOpen(false)
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="Compte"
        aria-current={isActive ? 'page' : undefined}
        className={[
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-500 font-semibold text-neutral-0 transition-all',
          size === 'md' ? 'size-10 text-[14px]' : 'size-8 text-[12px]',
          isActive || open
            ? 'ring-2 ring-primary-400 ring-offset-2'
            : 'hover:bg-primary-600',
          className,
        ].join(' ')}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="size-full object-cover" />
          : initials}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="fixed z-[999] w-72 rounded-2xl border border-neutral-20 bg-white py-50 shadow-lg"
            style={{ top: pos.top, right: pos.right }}
          >
            {ACCOUNT_MENU_ITEMS.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-75 px-150 py-100 text-left hover:bg-neutral-20"
              >
                <item.icon className="size-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-neutral-700">{item.label}</span>
                  <span className="block truncate text-[11px] text-neutral-400">{item.sublabel}</span>
                </span>
              </a>
            ))}
            <div className="my-50 border-t border-neutral-20" />
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-75 px-150 py-100 text-left hover:bg-neutral-20"
            >
              <LogOut className="size-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
              <span className="text-[13px] font-medium text-neutral-700">Se déconnecter</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-app">

      {/* ── Top bar — mobile ── */}
      <header className={[
        'fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-300 lg:hidden transition-all duration-300',
        scrolled ? 'bg-white/30 backdrop-blur-xl' : '',
      ].join(' ')}>
        <a href="/">
          <img src={logoMain} alt="Happy Cabri" className="h-11 w-auto" />
        </a>
        <UserAvatar
          initials={userInitials}
          isActive={activeItem === ACCOUNT_NAV.id}
          size="sm"
        />
      </header>

      {/* ── Top bar — desktop ── */}
      <header className={[
        'fixed inset-x-0 top-0 z-20 hidden h-20 items-center justify-between px-600 lg:flex transition-all duration-300',
        scrolled ? 'bg-white/80 backdrop-blur-xl' : '',
      ].join(' ')}>

        {/* Logo — gauche, grand */}
        <a href="/" className="shrink-0">
          <img src={logoMain} alt="Happy Cabri" className="h-[3.75rem] w-auto" />
        </a>

        {/* Droite : nav pill + icônes utilitaires */}
        <div className="flex items-center gap-200">

          {/* Nav pill — propre, sans icônes */}
          <nav>
            <div className="flex items-center gap-[2px] rounded-full border border-neutral-40/40 bg-white/50 px-[5px] py-[5px] backdrop-blur-2xl">
              {MAIN_NAV_ITEMS.map(({ id, label, href }) => (
                <a
                  key={id}
                  href={href}
                  aria-current={activeItem === id ? 'page' : undefined}
                  className={[
                    'flex items-center rounded-full px-[16px] py-[7px] text-[15px] tracking-[-0.01em] transition-all',
                    activeItem === id
                      ? 'bg-primary-500 font-medium text-neutral-0 shadow-sm'
                      : 'font-normal text-neutral-400 hover:text-neutral-700',
                  ].join(' ')}
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>

          {/* Avatar */}
          <UserAvatar
            initials={userInitials}
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
        className="fixed inset-x-200 bottom-300 z-20 lg:hidden"
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
