import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, Download, X, Check, AlertTriangle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

const invoices = [
  { date: '01 juil. 2026', label: 'Formule Premium — mensuel', amount: '9,99 €' },
  { date: '01 juin 2026',  label: 'Formule Premium — mensuel', amount: '9,99 €' },
  { date: '01 mai 2026',   label: 'Formule Premium — mensuel', amount: '9,99 €' },
]

type PlanId = 'monthly' | 'annual'

const PLAN_META: Record<PlanId, { label: string; price: string; note?: string; summary: string }> = {
  monthly: {
    label: 'Mensuel',
    price: '9,99 € / mois',
    summary: '9,99 € / mois · renouvellement le 1er août 2026',
  },
  annual: {
    label: 'Annuel',
    price: '89,99 € / an',
    note: 'soit 7,50 € / mois — 2 mois offerts',
    summary: '89,99 € / an · renouvellement le 1er août 2026',
  },
}

function PlanOption({ id, selected, onSelect }: { id: PlanId; selected: boolean; onSelect: () => void }) {
  const meta = PLAN_META[id]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-150 text-left transition-colors ${
        selected ? 'border-primary-500 bg-primary-500' : 'border-neutral-30 bg-white/60 hover:border-neutral-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-[13px] font-bold ${selected ? 'text-neutral-0' : 'text-neutral-800'}`}>{meta.label}</p>
        {selected && <Check className="size-4 text-neutral-0" strokeWidth={2.5} />}
      </div>
      <p className={`mt-25 text-[18px] font-extrabold ${selected ? 'text-neutral-0' : 'text-primary-600'}`}>{meta.price}</p>
      {meta.note && <p className={`mt-25 text-[11px] ${selected ? 'text-neutral-10/80' : 'text-neutral-500'}`}>{meta.note}</p>}
    </button>
  )
}

function ChangePlanModal({ draft, cancelled, onSelect, onConfirm, onCancel, onClose }: {
  draft: PlanId
  cancelled: boolean
  onSelect: (id: PlanId) => void
  onConfirm: () => void
  onCancel: () => void
  onClose: () => void
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe w-full max-w-[420px] overflow-hidden rounded-3xl shadow-lg">
          <div className="flex items-center justify-between px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Modifier mon abonnement</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-100 px-200 py-200">
            <PlanOption id="monthly" selected={draft === 'monthly'} onSelect={() => onSelect('monthly')} />
            <PlanOption id="annual" selected={draft === 'annual'} onSelect={() => onSelect('annual')} />
            {!cancelled && (
              <button
                type="button"
                onClick={onCancel}
                className="mt-50 text-[12px] text-neutral-500 underline transition-colors hover:text-neutral-700"
              >
                Résilier mon abonnement
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>Confirmer</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

function CancelSubscriptionModal({ renewalDate, onConfirm, onClose }: {
  renewalDate: string
  onConfirm: () => void
  onClose: () => void
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe w-full max-w-[380px] overflow-hidden rounded-3xl shadow-lg">
          <div className="flex items-start gap-150 px-200 pt-200">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="size-4.5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-accent text-[16px] font-bold text-neutral-800">Résilier mon abonnement ?</p>
              <p className="mt-50 text-[13px] text-neutral-600">
                Vous garderez l'accès à l'offre Premium jusqu'au {renewalDate}, puis votre compte repassera en formule gratuite.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-100 px-200 py-200">
            <button type="button" className="btn btn-text" onClick={onClose}>Annuler</button>
            <button
              type="button"
              className="btn bg-red-500 text-white hover:bg-red-600!"
              onClick={onConfirm}
            >
              Résilier
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

function EditCardModal({ number, expiry, cvc, onNumberChange, onExpiryChange, onCvcChange, canSave, onSave, onClose }: {
  number: string
  expiry: string
  cvc: string
  onNumberChange: (v: string) => void
  onExpiryChange: (v: string) => void
  onCvcChange: (v: string) => void
  canSave: boolean
  onSave: () => void
  onClose: () => void
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] modal-overlay" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-200">
        <div className="modal-surface-taupe w-full max-w-[420px] overflow-hidden rounded-3xl shadow-lg">
          <div className="flex items-center justify-between px-200 py-200">
            <p className="font-accent text-[16px] font-bold text-neutral-800">Modifier la carte</p>
            <button
              type="button"
              onClick={onClose}
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-40 hover:text-neutral-700"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-150 px-200 py-200">
            <div className="space-y-75">
              <p className="widget-label widget-label-compact">Numéro de carte</p>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={number}
                onChange={e => onNumberChange(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex items-center gap-100">
              <div className="flex-1 space-y-75">
                <p className="widget-label widget-label-compact">Expiration</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={e => onExpiryChange(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="flex-1 space-y-75">
                <p className="widget-label widget-label-compact">CVC</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvc}
                  onChange={e => onCvcChange(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
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

export default function AccountSubscription() {
  const [cardLabel, setCardLabel] = useState('Carte •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('Expire 04/28')
  const [editingCard, setEditingCard] = useState(false)
  const [numberDraft, setNumberDraft] = useState('')
  const [expiryDraft, setExpiryDraft] = useState('')
  const [cvcDraft, setCvcDraft] = useState('')

  const [plan, setPlan] = useState<PlanId>('monthly')
  const [editingPlan, setEditingPlan] = useState(false)
  const [planDraft, setPlanDraft] = useState<PlanId>(plan)

  const renewalDate = '1er août 2026'
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function openCardModal() {
    setNumberDraft('')
    setExpiryDraft('')
    setCvcDraft('')
    setEditingCard(true)
  }

  function saveCard() {
    const last4 = numberDraft.replace(/\D/g, '').slice(-4)
    setCardLabel(`Carte •••• ${last4}`)
    setCardExpiry(`Expire ${expiryDraft}`)
    setEditingCard(false)
  }

  function openPlanModal() {
    setPlanDraft(plan)
    setEditingPlan(true)
  }

  function confirmPlan() {
    setPlan(planDraft)
    setCancelled(false)
    setEditingPlan(false)
  }

  const canSaveCard = numberDraft.replace(/\D/g, '').length >= 12 && /^\d{2}\/\d{2}$/.test(expiryDraft) && cvcDraft.trim().length >= 3

  return (
    <AppLayout activeItem="compte" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <h1 className="mt-150 leading-tight text-neutral-800">
            Abonnement &amp; achats
          </h1>
        </section>

        {/* ── Formule actuelle ── */}
        <section className="widget-card-secondary flex items-center justify-between p-300">
          <div>
            <p className="widget-label">Formule actuelle</p>
            <p className="mt-75 text-[24px] font-extrabold text-neutral-0">Premium</p>
            <p className="mt-25 text-[13px] text-neutral-10/80">
              {cancelled ? `Résilié · accès jusqu'au ${renewalDate}` : PLAN_META[plan].summary}
            </p>
          </div>
          <button className="btn btn-primary bg-neutral-0! text-primary-700! hover:bg-neutral-10!" onClick={openPlanModal}>
            Modifier mon abonnement
          </button>
        </section>

        {/* ── Moyen de paiement ── */}
        <section className="widget-card flex items-center justify-between p-300">
          <div className="flex items-center gap-150">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
              <CreditCard className="size-5 text-neutral-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-neutral-800">{cardLabel}</p>
              <p className="text-[12px] text-neutral-500">{cardExpiry}</p>
            </div>
          </div>
          <button className="btn btn-text" onClick={openCardModal}>Modifier</button>
        </section>

        {/* ── Factures ── */}
        <section className="widget-card overflow-hidden p-100">
          <p className="widget-title px-200 py-150">Historique des achats</p>
          {invoices.map((inv, i) => (
            <div key={i} className="widget-row flex items-center justify-between px-200 py-150">
              <div>
                <p className="text-[14px] font-semibold text-neutral-800">{inv.label}</p>
                <p className="text-[12px] text-neutral-500">{inv.date}</p>
              </div>
              <div className="flex items-center gap-150">
                <p className="text-[14px] font-bold text-primary-700">{inv.amount}</p>
                <button aria-label="Télécharger la facture" className="btn btn-icon size-8 text-neutral-500 hover:bg-neutral-20!">
                  <Download className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </section>

      </div>

      {editingCard && (
        <EditCardModal
          number={numberDraft}
          expiry={expiryDraft}
          cvc={cvcDraft}
          onNumberChange={setNumberDraft}
          onExpiryChange={setExpiryDraft}
          onCvcChange={setCvcDraft}
          canSave={canSaveCard}
          onSave={saveCard}
          onClose={() => setEditingCard(false)}
        />
      )}

      {editingPlan && (
        <ChangePlanModal
          draft={planDraft}
          cancelled={cancelled}
          onSelect={setPlanDraft}
          onConfirm={confirmPlan}
          onCancel={() => { setEditingPlan(false); setCancelling(true) }}
          onClose={() => setEditingPlan(false)}
        />
      )}

      {cancelling && (
        <CancelSubscriptionModal
          renewalDate={renewalDate}
          onConfirm={() => { setCancelled(true); setCancelling(false) }}
          onClose={() => setCancelling(false)}
        />
      )}
    </AppLayout>
  )
}
