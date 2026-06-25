import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import RacePlans from './pages/RacePlans'
import RunnerProfile from './pages/RunnerProfile'

const routes: Record<string, () => React.ReactElement> = {
  '/': Home,
  '/calendrier': Calendar,
  '/plans': RacePlans,
  '/profil': RunnerProfile,
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin) return
      if (url.pathname in routes) {
        e.preventDefault()
        window.history.pushState({}, '', url.pathname)
        setPath(url.pathname)
      }
    }
    const handlePopState = () => setPath(window.location.pathname)

    document.addEventListener('click', handleClick)
    window.addEventListener('popstate', handlePopState)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const Page = routes[path] ?? Home
  return <Page />
}
