# Architecture — Happy Cabri

## Navigation principale

L'application partage la même structure de navigation sur les deux plateformes, 
avec une adaptation visuelle selon le support.

Sur **desktop**, une top bar fixe horizontale porte le logo à gauche, les 
onglets de navigation au centre, et l'avatar de l'utilisateur à droite. Sur 
**mobile**, une bottom navigation bar affiche les mêmes destinations sous forme 
d'icônes, avec l'avatar à l'extrémité droite.

Les cinq destinations principales sont les suivantes, dans l'ordre affiché :

| Destination | Accès | Icône |
|---|---|---|
| Accueil | Tous | Maison |
| Calendrier | Abonnement mensuel/annuel uniquement | Calendrier |
| Plans de course | Tous | Graphique / podium |
| Profil coureur | Tous | Personne |
| Compte | Tous | Avatar initiales |

Le Calendrier est accessible pour les abonnements gratuits mais il précise qu'il faut s'abonner pour accéder à cette fonctionnalité.

---

## Pages et fonctionnalités par destination

### Accueil

Point d'entrée après connexion. Donne une vision immédiate de l'activité en cours et des prochaines échéances.

- Affichage de la prochaine course planifiée avec son compte à rebours
- Accès rapide au dernier plan de course modifié
- Rappel de télécharger ou d'imprimer le roadbook quand une course est proche (moins de 7 jours)
- Suggestion de mise à niveau vers un abonnement pour les utilisateurs en plan gratuit ou à la course (accès au Calendrier, multi-scénarios illimités)
- Pour les abonnés, dashboard des dernières activités et analyse des données (impact sur ce qui a été travaillé -endurance, VMA, etc- et sur les prévisions de course)

### Calendrier *(abonnement mensuel/annuel uniquement)*

Vue de la saison sportive de l'utilisateur sur une timeline annuelle.

- Visualisation de toutes les courses planifiées sur l'année
- Distinction visuelle entre course-objectif et course-étape
- Niveau de priorité configurable par course
- Accès direct au plan de course associé en un clic
- Ajout d'une nouvelle course depuis cette vue (déclenche l'import GPX)
- Visualisation du volume via les dernières activités Strava et calcul du kilométrage de chaque activité en fin de semaine

### Plans de course

Cœur fonctionnel de l'application. Regroupe toute la logique de planification.

**Vue liste (tous les utilisateurs)**
- Liste des plans de course existants avec statut (en modification, finalisé, course passée)
- Création d'un nouveau plan (import GPX)
- Accès aux plans (si finalisé ou terminé = mode visualisation, sinon mode édition)

**Vue plan (détail d'un plan)**
- Visualisation du tracé avec le profil altimétrique (on voit le tracé avec l'altitude, les points de ravitaillements, les segments montée/descente)
- Visualisation du tracé avec carte OpenStreetMap (on voit le tracé et les ravitaillements)
- Liste des segments avec, pour chacun : allure et durée (avec tag si bot ou manuel), temps de passage, ration nutritionnelle avec produits réels
- Interrogation du bot sur un segment précis et application en un clic
- Placement et configuration des ravitaillements (temps de pause, barrière horaire)
- Gestion des scénarios : création, duplication, désignation du scénario de référence (offre payante)
- Export du roadbook PDF (offre payante)
- Génération du lien de partage assistants (offre payante)
- Checklist de matériel associée au plan

### Profil coureur

Saisie et gestion du profil personnel utilisé par le bot pour générer les estimations.

- Allures par pourcentage de pente et type de terrain (lisse vs technique)
- Vitesse ascensionnelle (VAM)
- Vitesse au kilomètre-effort
- Facteur de fatigue
- Aisance en montée et en descente
- Préférences nutritionnelles : glucides/h, eau ml/h, eau électrolytes ou isotonique ml/h
- Gestion des produits nutritionnels personnels (ajout, modification, suppression)
- *(V1)* Connexion et synchronisation Strava 

### Compte

Gestion de l'espace personnel, de l'abonnement et des données.

- Informations du compte (nom, email, mot de passe)
- Offre active et date de renouvellement
- Historique des achats et factures (via Stripe Customer Portal)
- Mise à niveau ou résiliation de l'abonnement
- Export des données personnelles (RGPD)
- Suppression du compte

---

## Architecture technique

### Frontend

L'application est développée en React + TypeScript. La même base de code est 
déployée sur deux surfaces : une application web accessible depuis n'importe 
quel navigateur, et une application mobile iOS et Android compilée via 
Capacitor en WebView.

La navigation principale est gérée par React Router. Chaque destination 
correspond à une route racine ; les sous-vues (détail d'un plan, vue athlète) 
sont des routes imbriquées.

Se référer au fichier design-system.md

### Backend

Supabase assure l'ensemble du backend : authentification (Auth avec OAuth2 
pour Strava/Garmin en V1), base de données PostgreSQL avec Row Level Security 
pour l'isolation des données entre utilisateurs et structures coach, et Storage 
pour les fichiers GPX et les exports PDF.

Les migrations sont versionnées dans `supabase/migrations/`. Chaque nouvelle 
entité ou relation fait l'objet d'une migration dédiée accompagnée des 
politiques RLS correspondantes.

### Paiement

Stripe gère l'intégralité du cycle de vie des abonnements (création, 
renouvellement, résiliation, remboursement). Le Stripe Customer Portal est 
utilisé pour la gestion en self-service depuis la page Compte. Aucune donnée 
de carte bancaire n'est stockée en base.

### Tests

Les tests unitaires et de logique métier (calculs d'allure, nutrition, temps 
de passage) sont écrits avec Vitest. Les parcours utilisateurs critiques 
(création d'un plan, export roadbook, souscription) sont couverts par des 
tests end-to-end Playwright.

---

## Maquettage

Les maquettes sont réalisées sur **Figma** avec un design system custom 
(tokens de couleur, typographie, espacements, composants). Les tokens seront 
documentés dans ce fichier au fil des sessions de maquettage.

Chaque écran est décliné en deux formats : desktop (largeur fixe) et mobile 
(largeur fluide), conformément à l'approche visible dans les premières maquettes 
de navigation.

Les maquettes constituent la référence visuelle avant tout développement de 
composant. En cas d'ambiguïté entre une maquette Figma et ce fichier 
d'architecture, la maquette prévaut pour les décisions visuelles ; ce fichier 
prévaut pour les décisions fonctionnelles.