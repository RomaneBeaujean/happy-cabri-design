import { Check } from 'lucide-react'

export interface StepConfig {
  label: string
}

interface StepperProps {
  steps: StepConfig[]
  current: number // 0-indexed
}

/**
 * Stepper — barre de progression multi-étapes.
 *
 * Usage :
 *   const STEPS = [{ label: 'Import GPX' }, { label: 'Infos course' }, { label: 'Confirmation' }]
 *   <Stepper steps={STEPS} current={0} />
 *
 * - `current` = index de l'étape active (0-indexed)
 * - Les étapes précédentes affichent une coche
 * - Les étapes suivantes sont grisées
 */
export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done    = i < current
        const active  = i === current
        const pending = i > current

        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-200">
              <div className={[
                'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                done    ? 'bg-primary-500 text-neutral-0'                                    : '',
                active  ? 'bg-primary-500 text-neutral-0 ring-4 ring-primary-100'           : '',
                pending ? 'bg-neutral-20 text-neutral-300'                                  : '',
              ].join(' ')}>
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={[
                'text-xs font-semibold whitespace-nowrap',
                done    ? 'text-primary-600' : '',
                active  ? 'text-primary-700' : '',
                pending ? 'text-neutral-300' : '',
              ].join(' ')}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={[
                'mx-150 h-px w-9 shrink-0',
                i < current ? 'bg-primary-300' : 'bg-neutral-40',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
