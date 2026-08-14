type Listener = () => void

let avatarUrl: string | null = null
const listeners = new Set<Listener>()

export function getAvatarUrl() {
  return avatarUrl
}

export function setAvatarUrl(url: string | null) {
  avatarUrl = url
  listeners.forEach(l => l())
}

export function subscribeAvatarUrl(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
