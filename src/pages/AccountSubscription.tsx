import { CreditCard, Download } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'

const invoices = [
  { date: '01 juil. 2026', label: 'Formule Premium — mensuel', amount: '9,99 €' },
  { date: '01 juin 2026',  label: 'Formule Premium — mensuel', amount: '9,99 €' },
  { date: '01 mai 2026',   label: 'Formule Premium — mensuel', amount: '9,99 €' },
]

export default function AccountSubscription() {
  return (
    <AppLayout activeItem="compte" userInitials="RB">
      <div className="mx-auto max-w-3xl space-y-300">

        {/* ── Header ── */}
        <section className="pt-100">
          <p className="text-[11px] eyebrow text-neutral-90">
            Compte
          </p>
          <h1 className="mt-150 text-[42px] font-extrabold leading-tight text-neutral-800 lg:text-[48px]">
            Abonnement &amp; achats
          </h1>
        </section>

        {/* ── Formule actuelle ── */}
        <section className="widget-card-secondary flex items-center justify-between p-300">
          <div>
            <p className="widget-label">Formule actuelle</p>
            <p className="mt-75 text-[24px] font-extrabold text-neutral-0">Premium</p>
            <p className="mt-25 text-[13px] text-neutral-10/80">9,99 € / mois · renouvellement le 1er août 2026</p>
          </div>
          <button className="btn btn-primary bg-neutral-0! text-primary-700! hover:bg-neutral-10!">
            Changer de formule
          </button>
        </section>

        {/* ── Moyen de paiement ── */}
        <section className="widget-card flex items-center justify-between p-300">
          <div className="flex items-center gap-150">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-20/70">
              <CreditCard className="size-5 text-neutral-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-neutral-800">Carte •••• 4242</p>
              <p className="text-[12px] text-neutral-500">Expire 04/28</p>
            </div>
          </div>
          <button className="btn btn-text">Modifier</button>
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
    </AppLayout>
  )
}
