import { useEffect, useState } from 'react'

// Même seuil que le breakpoint desktop `lg` (1024px) utilisé partout ailleurs dans l'app.
const QUERY = '(max-width: 1023px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
