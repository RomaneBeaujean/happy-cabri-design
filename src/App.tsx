import AppLayout from './layouts/AppLayout'

export default function App() {
  return (
    <AppLayout activeItem="accueil" userInitials="RB">
      <h1 className="font-heading text-2xl font-bold text-neutral-800">
        Accueil
      </h1>
      <p className="mt-200 font-body text-neutral-500">
        Bienvenue sur Happy Cabri
      </p>
    </AppLayout>
  )
}
