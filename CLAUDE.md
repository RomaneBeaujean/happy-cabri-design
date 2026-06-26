# Happy Cabri Design — Guide de développement

## Styles partagés

### Boutons — `src/styles/buttons.css`

**Toujours consulter `src/styles/buttons.css` avant de créer ou styler un bouton.**

Ce fichier est la source unique de vérité pour les boutons de l'app. Toute modification s'applique partout.

Classes disponibles :
- `.btn` — base obligatoire (font Elms Sans, flex, transition)
- `.btn-primary` — fond primary-500, texte blanc, hauteur 40px
- `.btn-full` — pleine largeur, hauteur auto (mobile)
- `.btn-icon` — bouton circulaire icône uniquement
- `.btn-ghost` — bouton texte sans fond

Utilisation :
```html
<!-- Bouton standard -->
<button class="btn btn-primary">Label</button>

<!-- Bouton pleine largeur (mobile) -->
<button class="btn btn-primary btn-full">Label</button>

<!-- Bouton icône -->
<button class="btn btn-icon"><Icon /></button>

<!-- Bouton texte -->
<button class="btn btn-ghost">Voir tout</button>
```

Ne jamais recréer des styles de bouton inline avec Tailwind — utiliser les classes ci-dessus et faire évoluer le fichier CSS si nécessaire.

## Design tokens

Définis dans `src/index.css` (`@theme`) :
- Couleurs : `--color-primary-*`, `--color-secondary-*`, `--color-neutral-*`
- Spacing : `--spacing-25` (2px) → `--spacing-900` (72px)
- Fonts : `--font-body` (Inter), `--font-heading` (Plus Jakarta Sans), `--font-accent` (Manrope)

## Composants réutilisables — `src/components/`

### `Stepper.tsx`
Barre de progression multi-étapes. Affiche les étapes passées (coche), active (ring), et à venir (grisée).
```tsx
import Stepper, { type StepConfig } from '../components/Stepper'
const STEPS: StepConfig[] = [{ label: 'Import GPX' }, { label: 'Infos course' }, { label: 'Confirmation' }]
<Stepper steps={STEPS} current={1} /> // 0-indexed
```

### `AltimetryChart.tsx`
Graphique altimétrique basé sur recharts. Courbe en `accent-500` (orange), gradient de remplissage, tooltip interactif.
```tsx
import AltimetryChart, { type AltimetryPoint } from '../components/AltimetryChart'
const data: AltimetryPoint[] = [{ km: 0, alt: 800 }, { km: 40, alt: 2400 }]
<AltimetryChart data={data} height={130} />
```

## Navigation

Le routeur est un routeur maison dans `src/App.tsx` — pas de React Router. Pour naviguer programmatiquement :
```ts
window.history.pushState({}, '', '/ma-route')
window.dispatchEvent(new PopStateEvent('popstate'))
```
Toute nouvelle page doit être ajoutée dans l'objet `routes` de `App.tsx`.

## Couleurs accent

`--color-accent-500` (#F47425, orange) est réservé aux courbes altimétrique et aux graphiques GPX.
Ne pas l'utiliser pour des boutons ou états UI — utiliser `primary-500` pour ça.

## Breakpoints

Le layout utilise `lg` comme breakpoint desktop (1024px). Ne pas utiliser `md` pour des logiques desktop/mobile — rester sur `lg`.
