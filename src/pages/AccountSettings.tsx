import { useState } from 'react'
import { Mail, Lock, Phone, Save } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

export default function AccountSettings() {
  const [email, setEmail] = useState('romane.beaujean@gmail.com')
  const [phone, setPhone] = useState('06 12 34 56 78')
  const [password, setPassword] = useState('')

  return (
    <AppLayout activeItem="compte" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <p className="text-[11px] eyebrow text-neutral-90">
            Compte
          </p>
          <h1 className="mt-150 text-[42px] font-extrabold leading-tight text-neutral-800 lg:text-[48px]">
            Paramètres du compte
          </h1>
        </section>

        {/* ── Formulaire ── */}
        <section className="widget-card space-y-200 p-300">
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Adresse email</p>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-150 size-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input input-icon"
              />
            </div>
          </div>

          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Téléphone</p>
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-150 size-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input input-icon"
              />
            </div>
          </div>

          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Nouveau mot de passe</p>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-150 size-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.75} />
              <input
                type="password"
                placeholder="Laisser vide pour ne pas changer"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input input-icon"
              />
            </div>
          </div>

          <button className="btn btn-primary">
            <Save className="size-4 shrink-0" strokeWidth={2} />
            Enregistrer les modifications
          </button>
        </section>

      </div>
    </AppLayout>
  )
}
