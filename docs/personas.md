# Personas — Happy Cabri

## Persona principal : L'Amateur Sérieux

**Profil.** Homme ou femme, 38 ans, cadre dynamique (ingénieur, entrepreneur, CSP+). Pratique 4 à 5 sorties hebdomadaires et participe à 4 à 6 compétitions par an, sur des distances de 40 à 80 km. Équipé d'une montre Garmin et d'un compte Strava. Budget sport annuel entre 1 000 € et 2 500 €.

**Motivations.** C'est un passionné de données : le plaisir du trail réside pour lui dans la compréhension et la maîtrise de chaque paramètre de sa course, pas uniquement dans l'effort physique. Sa quête est celle du « flow », cet état d'alignement où la préparation technique efface l'incertitude. Son objectif n'est pas de gagner, mais de franchir la ligne dans le temps qu'il s'est fixé, sans subir l'événement.

**Frustrations.** Sa préparation manuelle (souvent sur Excel) lui prend 2 à 4 heures et reste une source d'anxiété plutôt qu'un outil de sérénité. Il a soit déjà vécu une course « calvaire » à cause d'une mauvaise gestion de l'allure ou d'une crise de faim, soit s'apprête à franchir un saut dans l'inconnu (sa première distance de 50-80 km) et sent que son intuition ne suffira plus.

**Cas d'usage typique (MVP).** Il importe le Trace GPX d'une course inscrite depuis trois mois. Comme la connexion Strava n'est pas disponible au lancement, il renseigne manuellement son RunnerProfile : ses allures par pourcentage de pente et par type de terrain (lisse vs technique), sa vitesse ascensionnelle, sa vitesse au kilomètre-effort, son facteur de fatigue, son aisance en montée et en descente, ainsi que ses préférences nutritionnelles. Il ajuste lui-même certains segments qu'il connaît déjà, interroge le bot sur les segments plus incertains, configure sa stratégie nutritionnelle avec ses propres produits, génère deux ou trois scénarios, puis exporte son roadbook la semaine précédant la course.

**Point de vigilance.** Ce persona est un passionné de données qui attendait initialement un import automatique via Strava (cf. son équipement). Le passage à une saisie manuelle au MVP introduit une friction d'onboarding plus importante que prévu pour ce profil précis ; je recommande un assistant de saisie guidé (valeurs par défaut suggérées selon le niveau déclaré, ajustables ensuite) pour limiter l'abandon à cette étape — voir `non-functional-requirements.md`.

**Disposition à payer.** 7 à 12 €/mois si la preuve de valeur est immédiate. C'est le profil le plus aligné avec l'offre Abonnement B2C (8,99 €/mois ou 59,99 €/an), qui lui donne aussi accès au SeasonPlan.

---

## Persona secondaire : Le Sceptique Expérimenté

**Profil.** Traileur confirmé, auto-coaché, base athlétique solide. Utilise déjà un stack fragmenté (Garmin + Excel) qu'il a lui-même construit au fil des années.

**Motivations.** Il valorise la fiabilité algorithmique et l'interface plus que l'accompagnement. Il a une exigence de précision élevée et ne change d'outil que si la preuve de valeur est démontrable immédiatement.

**Frustrations.** Il ne convertira pas sur la promesse seule : il a besoin d'une première expérience concrète et gratuite avant d'envisager un engagement payant. Il est allergique à toute prescription rigide — c'est précisément pour ce profil que la distinction visuelle « estimation du bot » vs « valeur manuelle » sur chaque segment est un argument de confiance fort : il peut vérifier le calcul du bot puis l'écraser de sa propre valeur s'il n'est pas convaincu.

**Cas d'usage typique.** Il teste l'application sur une course ponctuelle via le plan gratuit, compare le résultat à son propre calcul manuel sur quelques segments clés en interrogeant le bot, puis passe à l'offre à la course pour débloquer le multi-scénario et l'export du roadbook s'il est convaincu.

**Disposition à payer.** 10 à 15 €/mois, la plus élevée des segments B2C, mais conditionnée à une preuve de valeur préalable.

---

## Segment opportuniste, hors cible au lancement : Le Coureur en Transition

**Profil.** Novice en trail, venu de la course sur route ou de la salle. Courses inférieures à 15 km.

**Motivations.** Il veut être guidé : à quelle vitesse courir, section par section. Il découvre la complexité de la gestion de l'effort en montagne.

**Frustrations.** Le manque de repères sur un terrain qu'il ne maîtrise pas encore. La nutrition n'est pas encore un sujet central pour lui sur ces distances courtes.

**Pourquoi il est hors cible au lancement.** Sa disposition à payer est plus faible (8-10 €/mois) et sa douleur est moins aiguë que celle de l'amateur sérieux. Il devient un levier de croissance pertinent à 12-18 mois, quand ses distances s'allongeront naturellement.
