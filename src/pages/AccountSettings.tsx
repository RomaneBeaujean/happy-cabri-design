import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Lock, Phone, ChevronRight, X, type LucideIcon } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

type Field = 'email' | 'phone' | 'password'

function SettingRow({ icon: Icon, label, value, onClick, isLast }: {
  icon: LucideIcon
  label: string
  value: string
  onClick: () => void
  isLast?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-150 px-200 py-200 text-left transition-colors hover:bg-neutral-10/60${isLast ? '' : ' border-b border-neutral-20'}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
        <Icon className="size-4 text-neutral-400" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-neutral-800">{label}</p>
        <p className="mt-25 truncate text-[12px] text-neutral-500">{value}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-neutral-300" strokeWidth={2} />
    </button>
  )
}

function EditFieldModal({ field, title, canSave, onSave, onClose, children }: {
  field: Field
  title: string
  canSave: boolean
  onSave: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe max-h-[calc(100vh-24px)] w-full max-w-[420px] overflow-x-hidden overflow-y-auto rounded-3xl shadow-lg">
          <div className="flex items-center justify-between px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-150 px-200 py-200" key={field}>
            {children}
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="btn btn-primary disabled:pointer-events-none disabled:opacity-40"
              disabled={!canSave}
              onClick={onSave}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function AccountSettings() {
  const [email, setEmail] = useState('romane.beaujean@gmail.com')
  const [phone, setPhone] = useState('06 12 34 56 78')

  const [editing, setEditing] = useState<Field | null>(null)
  const [emailDraft, setEmailDraft] = useState(email)
  const [phoneDraft, setPhoneDraft] = useState(phone)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signOutAllDevices, setSignOutAllDevices] = useState(true)

  function openModal(field: Field) {
    setEmailDraft(email)
    setPhoneDraft(phone)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setEditing(field)
  }

  const canSaveEmail = emailDraft.trim().length > 0
  const canSavePhone = phoneDraft.trim().length > 0
  const canSavePassword = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword

  return (
    <AppLayout activeItem="compte" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <h1 className="mt-150 leading-tight text-neutral-800">
            Paramètres
          </h1>
        </section>

        {/* ── Sécurité ── */}
        <section className="widget-card overflow-hidden">
          <SettingRow icon={Mail} label="E-mail" value={email} onClick={() => openModal('email')} />
          <SettingRow icon={Phone} label="Téléphone" value={phone} onClick={() => openModal('phone')} />
          <SettingRow icon={Lock} label="Mot de passe" value="••••••••" onClick={() => openModal('password')} isLast />
        </section>

      </div>

      {editing === 'email' && (
        <EditFieldModal
          field="email"
          title="Modifier l'e-mail"
          canSave={canSaveEmail}
          onClose={() => setEditing(null)}
          onSave={() => { setEmail(emailDraft); setEditing(null) }}
        >
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Nouvel e-mail</p>
            <input
              autoFocus
              type="email"
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
              className="input w-full"
            />
          </div>
        </EditFieldModal>
      )}

      {editing === 'phone' && (
        <EditFieldModal
          field="phone"
          title="Modifier le téléphone"
          canSave={canSavePhone}
          onClose={() => setEditing(null)}
          onSave={() => { setPhone(phoneDraft); setEditing(null) }}
        >
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Nouveau numéro</p>
            <input
              autoFocus
              type="tel"
              value={phoneDraft}
              onChange={e => setPhoneDraft(e.target.value)}
              className="input w-full"
            />
          </div>
        </EditFieldModal>
      )}

      {editing === 'password' && (
        <EditFieldModal
          field="password"
          title="Modifier le mot de passe"
          canSave={canSavePassword}
          onClose={() => setEditing(null)}
          onSave={() => setEditing(null)}
        >
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Mot de passe actuel</p>
            <input
              autoFocus
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Nouveau mot de passe</p>
            <input
              type="password"
              placeholder="6 caractères minimum"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="space-y-75">
            <p className="widget-label widget-label-compact">Confirmer le nouveau mot de passe</p>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input w-full"
            />
          </div>
          <label className="flex items-center gap-75 text-[12px] text-neutral-600">
            <input
              type="checkbox"
              checked={signOutAllDevices}
              onChange={e => setSignOutAllDevices(e.target.checked)}
              className="size-4 accent-primary-500"
            />
            Déconnecter tous les appareils
          </label>
        </EditFieldModal>
      )}
    </AppLayout>
  )
}
