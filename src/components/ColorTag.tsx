import type { MouseEvent, ReactNode } from 'react'

export type TagColor =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'red'
  | 'pink'
  | 'purple'
  | 'deep-purple'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'bright-green'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deep-orange'
  | 'brown'
  | 'white'

interface TagPalette { background: string; color: string }

const palette: Record<TagColor, Record<'soft' | 'strong', TagPalette>> = {
  primary:      { soft: { background: '#303030', color: '#ffffff' }, strong: { background: '#161616', color: '#ffffff' } },
  secondary:    { soft: { background: '#FEF6DC', color: '#8A6209' }, strong: { background: '#F3C94A', color: '#5C4006' } },
  neutral:      { soft: { background: '#dee1e3', color: '#152833' }, strong: { background: '#c3c8cb', color: '#091e2a' } },
  white:        { soft: { background: '#ffffff', color: '#354750' }, strong: { background: '#ffffff', color: '#354750' } },
  red:          { soft: { background: '#FEE2E2', color: '#82181A' }, strong: { background: '#e6a8ae', color: '#541c21' } },
  pink:         { soft: { background: '#f9eef4', color: '#8d3a68' }, strong: { background: '#e5afcd', color: '#54223e' } },
  purple:       { soft: { background: '#f7eff6', color: '#61325c' }, strong: { background: '#dbb3d7', color: '#4a2646' } },
  'deep-purple':{ soft: { background: '#f4f0f8', color: '#513764' }, strong: { background: '#cdb8dd', color: '#3e2a4c' } },
  cyan:         { soft: { background: '#e6f8ff', color: '#014d6b' }, strong: { background: '#8bdeff', color: '#014d6b' } },
  teal:         { soft: { background: '#e6f8f9', color: '#004e51' }, strong: { background: '#8adfe2', color: '#004e51' } },
  green:        { soft: { background: '#e7f7f3', color: '#054b3a' }, strong: { background: '#90dcca', color: '#054b3a' } },
  'bright-green':{ soft:{ background: '#e7fbf6', color: '#055946' }, strong: { background: '#8fecd6', color: '#055946' } },
  lime:         { soft: { background: '#f5fdf3', color: '#406337' }, strong: { background: '#d0f6c6', color: '#406337' } },
  yellow:       { soft: { background: '#F7E788', color: '#894B00' }, strong: { background: '#fcfcbe', color: '#69682f' } },
  amber:        { soft: { background: '#fffaea', color: '#6b5511' }, strong: { background: '#ffe79c', color: '#6b5511' } },
  orange:       { soft: { background: '#fcf5e9', color: '#CA3500' }, strong: { background: '#f2d299', color: '#5f420e' } },
  'deep-orange':{ soft: { background: '#FFEDD4', color: '#C2410C' }, strong: { background: '#FFD7A8', color: '#CA3500' } },
  brown:        { soft: { background: '#f4f1ef', color: '#733E0A' }, strong: { background: '#cbbcb7', color: '#3b2e2a' } },
}

function getTagColor(color: TagColor, variant: 'soft' | 'strong'): TagPalette {
  return palette[color]?.[variant] ?? palette.primary[variant]
}

export interface ColorTagProps {
  label?: string
  color?: TagColor
  variant?: 'soft' | 'strong'
  size?: 'medium' | 'small'
  fluid?: boolean
  /** Icône affichée à gauche du label. */
  icon?: ReactNode
  /** Icône affichée à droite du label. Devient cliquable si `onRightIconClick` est fourni. */
  rightIcon?: ReactNode
  onRightIconClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Rend le tag entier cliquable (ex: pour passer en édition). */
  onClick?: () => void
  children?: ReactNode
}

export default function ColorTag({
  label,
  color = 'neutral',
  variant = 'soft',
  size = 'small',
  fluid = false,
  icon,
  rightIcon,
  onRightIconClick,
  onClick,
  children,
}: ColorTagProps) {
  const { background, color: textColor } = getTagColor(color, variant)

  return (
    <div
      onClick={onClick}
      className={`inline-flex min-w-0 max-w-full shrink-0 items-center gap-75 truncate${onClick ? ' cursor-pointer' : ''}`}
      style={{
        backgroundColor: background,
        color: textColor,
        width: fluid ? '100%' : 'auto',
        height: size === 'medium' ? '32px' : '26px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontFamily: 'var(--font-accent)',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      {(label != null || children != null) && (
        <span className="min-w-0 flex-1 truncate">{label ?? children}</span>
      )}
      {rightIcon && (
        onRightIconClick ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRightIconClick(e) }}
            className="-mr-50 ml-25 flex shrink-0 items-center justify-center rounded-full p-25 transition-colors hover:bg-black/10"
            style={{ color: textColor }}
          >
            {rightIcon}
          </button>
        ) : (
          <span className="flex shrink-0 items-center">{rightIcon}</span>
        )
      )}
    </div>
  )
}
