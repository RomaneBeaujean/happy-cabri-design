import type { ReactNode } from 'react'

export interface FilterTabOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface FilterTabsProps<T extends string> {
  value: T
  options: FilterTabOption<T>[]
  onChange: (value: T) => void
  size?: 'default' | 'small' | 'xsmall'
  className?: string
}

const SIZE_CLASSES: Record<'default' | 'small' | 'xsmall', string> = {
  default: 'px-200 py-150 text-[12px]',
  small:   'px-150 py-150 text-[11px]',
  xsmall:  'px-100 py-100 text-[10px]',
}

export default function FilterTabs<T extends string>({ value, options, onChange, size = 'default', className = '' }: FilterTabsProps<T>) {
  const wraps = size !== 'default'
  return (
    <div className={`flex gap-75 ${wraps ? 'flex-wrap' : 'overflow-x-auto pb-50'} ${className}`}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            'btn gap-75 whitespace-nowrap rounded-full font-semibold transition-colors h-auto',
            SIZE_CLASSES[size],
            value === o.value
              ? 'bg-primary-500 text-neutral-0'
              : 'border border-neutral-40 bg-white/60 text-neutral-600 hover:border-neutral-60 hover:text-neutral-800',
          ].join(' ')}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
