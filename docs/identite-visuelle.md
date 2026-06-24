# Identité visuelle — Happy Cabri

## Concept

Happy Cabri est une application SaaS de trail running qui génère des plans de course personnalisés depuis des fichiers GPX : allure segment par segment, stratégie nutritionnelle, roadbook imprimable.

L'identité visuelle traduit trois valeurs : **clarté**, **énergie**, **nature**.

---

## Logo

Mascotte bouquetin (cabri) avec lunettes style Oakley Sutro.
Typo double : script pour "Happy" + display bold pour "Cabri".

| Format | Fichier |
|---|---|
| SVG (vectoriel, usage principal) | `docs/logo.svg` |
| PNG (raster, fallback) | `docs/logo.png` |

--- 

## Typographies

Trois voix complémentaires, chacune avec un rôle précis.

### Inter — corps de texte
Lisible et neutre pour les interfaces et le contenu courant.
Usage : paragraphes, labels, inputs, données.
Variable CSS : `--font-body`

### Plus Jakarta Sans — titres
Caractère affirmé pour les en-têtes et la hiérarchie visuelle.
Usage : H1 à H6, titres de section, titres de cards.
Variable CSS : `--font-heading`

### Manrope — accents
Touches d'accentuation, labels et éléments secondaires.
Usage : badges, tags, captions, éléments de navigation.
Variable CSS : `--font-accent`

---

## Couleurs

### Page background
| Nom | Hex |
|---|---|
| Page BG | `#faf8f3` |

### Primary — Teal/Aqua
Couleur principale de la marque. Famille aqua/teal ancrée sur l'univers nature et trail.

| Échelon | Hex |
|---|---|
| primary-50 | `#f0f8f9` |
| primary-100 | `#daeff1` |
| primary-200 | `#c5e4e7` |
| primary-300 | `#92ced3` |
| primary-400 | `#55bac3` |
| **primary-500** | **`#2ba1ab`** |
| primary-600 | `#208992` |
| primary-700 | `#18747c` |
| primary-800 | `#125c63` |
| primary-900 | `#0c454b` |

primary-500 est la valeur de référence pour les boutons, liens actifs, et éléments interactifs primaires.

### Secondary — Tiger Orange
Couleur d'accent énergique. Utilisée pour les CTA secondaires, highlights, et éléments de contraste.

| Échelon | Hex |
|---|---|
| secondary-50 | `#fef3eb` |
| secondary-100 | `#fde0ce` |
| secondary-200 | `#fac7a8` |
| secondary-300 | `#f7a26e` |
| secondary-400 | `#f5843d` |
| **secondary-500** | **`#f47425`** |
| secondary-600 | `#e6610f` |
| secondary-700 | `#ba5212` |
| secondary-800 | `#8e4415` |
| secondary-900 | `#663415` |

### Neutrals
Palette warm-gray ancrée dans des tons terreux, cohérents avec l'univers outdoor.

| Échelon | Hex |
|---|---|
| neutral-0 | `#ffffff` |
| neutral-10 | `#fafaf9` |
| neutral-20 | `#f5f5f4` |
| neutral-30 | `#efeeec` |
| neutral-40 | `#e3e1de` |
| neutral-50 | `#cbc8c3` |
| neutral-100 | `#7f786b` |
| neutral-300 | `#736b5e` |
| neutral-500 | `#585146` |
| neutral-700 | `#39342d` |
| neutral-800 | `#282520` |
| neutral-900 | `#1d1a16` |

### Couleurs sémantiques
| Rôle | Hex |
|---|---|
| Success | `#0db28b` |
| Warning | `#e29e21` |
| Error | `#c8424e` |

---

## Espacements

Échelle harmonique issue du design system Figma. Base 8px.

| Token | Valeur |
|---|---|
| spacing-25 | 2px |
| spacing-50 | 4px |
| spacing-75 | 6px |
| spacing-100 | 8px |
| spacing-150 | 12px |
| spacing-200 | 16px |
| spacing-300 | 24px |
| spacing-400 | 32px |
| spacing-500 | 40px |
| spacing-600 | 48px |
| spacing-700 | 56px |
| spacing-800 | 64px |
| spacing-900 | 72px |

---

## Usage dans le code

```tsx
// Fonts via variables CSS
className="font-body"       // Inter
className="font-heading"    // Plus Jakarta Sans
className="font-accent"     // Manrope

// Couleurs Tailwind
className="bg-primary-500 text-neutral-0"
className="bg-secondary-500"
className="text-neutral-700"

// Espacements
className="gap-300 p-200"
```

---

## Breakpoints

| Breakpoint | Min | Max |
|---|---|---|
| Mobile | 360px | 599px |
| Tablet | 600px | 1023px |
| Desktop | 1024px | 1920px |
