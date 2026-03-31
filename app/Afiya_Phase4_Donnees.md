# 🔀 Phase 4 — Cartographie des Données & Intégrations

---

📅 Mars 2026 · 👤 Business Analyst · 🚦 **En cours**

---

> 🎯 **Objectif de cette phase**
> Définir précisément quelles données Afiya collecte, comment elles circulent, où elles sont traitées et comment elles sont protégées — pour garantir une app fiable, transparente et conforme au RGPD.

---

> 🔒 **Principe fondateur — 100% Local**
> Toutes les données de santé d'Afiya sont traitées **uniquement sur l'appareil de l'utilisatrice**. Aucune donnée de santé n'est envoyée, stockée ou analysée sur un serveur externe. Afiya ne voit jamais tes données — ton téléphone les traite pour toi.

---

## 📥 Sources de données

Afiya repose sur **une seule source principale** : la **saisie manuelle de l'utilisatrice**, complétée par les APIs de santé natives du téléphone.

| Source | Type | Disponibilité | Obligatoire ? |
| --- | --- | --- | --- |
| ✍️ Saisie manuelle | Cycle, humeur, symptômes, objectifs | iOS & Android | ✅ Oui |
| 🍎 Apple HealthKit | Sommeil, activité, fréquence cardiaque, HRV | iOS uniquement | ⬜ Optionnel |
| 🤖 Google Health Connect | Sommeil, activité, fréquence cardiaque | Android uniquement | ⬜ Optionnel |

> 💡 **Note BA**
> La saisie manuelle est la source principale car elle garantit que l'app fonctionne même sans connexion à une app tierce. Les données Apple/Google enrichissent l'expérience mais ne sont jamais obligatoires.

---

## 📊 Tableau des Données

### 🩸 Données de Cycle Menstruel

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Date de début des règles | Manuelle | Utilisatrice | À chaque cycle | Local uniquement | Calcul de phase, conseils |
| Date de fin des règles | Manuelle | Utilisatrice | À chaque cycle | Local uniquement | Durée du cycle |
| Durée du cycle (calculée) | Calculée | Afiya | Automatique | Local uniquement | Prédiction prochaines règles |
| Phase actuelle (calculée) | Calculée | Afiya | Quotidienne | Local uniquement | Personnalisation des conseils |
| Symptômes (crampes, fatigue…) | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Patterns mensuels |
| Flux (léger / moyen / abondant) | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Suivi santé |

---

### 😴 Données de Sommeil & Fatigue

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Durée du sommeil | HealthKit / Health Connect / Manuelle | App ou utilisatrice | Quotidienne | Local uniquement | Conseil du matin |
| Qualité du sommeil | HealthKit / Health Connect / Manuelle | App ou utilisatrice | Quotidienne | Local uniquement | Score de récupération |
| Heure de coucher / lever | HealthKit / Health Connect | App | Quotidienne | Local uniquement | Analyse des habitudes |
| Niveau de fatigue perçu | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Conseil adapté |
| Fréquence cardiaque nocturne | HealthKit / Health Connect | App | Quotidienne | Local uniquement | Qualité sommeil |

---

### 🧠 Données Humeur & Santé Mentale

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Humeur du jour (échelle 1-5) | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Corrélation cycle/humeur |
| Niveau de stress perçu | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Détection stress |
| Note libre (optionnelle) | Manuelle | Utilisatrice | Optionnelle | Local uniquement | Journal personnel |
| HRV (variabilité cardiaque) | HealthKit / Health Connect | App | Quotidienne | Local uniquement | Détection stress physiologique |

---

### 🏃‍♀️ Données Sport & Récupération

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Type d'activité physique | HealthKit / Health Connect / Manuelle | App ou utilisatrice | Par séance | Local uniquement | Conseil récupération |
| Durée de l'activité | HealthKit / Health Connect / Manuelle | App ou utilisatrice | Par séance | Local uniquement | Charge d'entraînement |
| Fréquence cardiaque à l'effort | HealthKit / Health Connect | App | Par séance | Local uniquement | Intensité de l'effort |
| Fréquence cardiaque au repos | HealthKit / Health Connect | App | Quotidienne | Local uniquement | Score de récupération |
| Nombre de pas | HealthKit / Health Connect / Manuelle | App ou utilisatrice | Quotidienne | Local uniquement | Niveau d'activité général |

---

### 🥗 Données Alimentation & Énergie

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Niveau d'énergie perçu | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Conseil du jour |
| Hydratation | Manuelle | Utilisatrice | Quotidienne | Local uniquement | Conseil hydratation |
| Repas / type d'alimentation | Manuelle | Utilisatrice | Optionnelle | Local uniquement | Conseils nutritionnels |

---

### 👤 Données de Profil Utilisatrice

| Donnée | Source | Saisie par | Fréquence | Stockage | Utilisée pour |
| --- | --- | --- | --- | --- | --- |
| Âge | Manuelle | Utilisatrice | Une fois | Local uniquement | Personnalisation |
| Profil hormonal (SOPK, ménopause…) | Manuelle | Utilisatrice | Modifiable | Local uniquement | Adaptation des conseils |
| Objectifs de santé | Manuelle | Utilisatrice | Modifiable | Local uniquement | Orientation des conseils |
| Contraception hormonale | Manuelle | Utilisatrice | Modifiable | Local uniquement | Adaptation cycle |
| Préférences de notification | Manuelle | Utilisatrice | Modifiable | Local uniquement | UX |

---

## 🔄 Diagramme de Flux des Données

```
┌─────────────────────────────────────────────────────────┐
│                   UTILISATRICE                          │
│   Saisie manuelle : cycle, humeur, symptômes, objectifs │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              SOURCES OPTIONNELLES                       │
│   🍎 Apple HealthKit    🤖 Google Health Connect        │
│   Sommeil · Activité · FC · HRV · Pas                  │
└────────────────────────┬────────────────────────────────┘
                         │  (lecture seule, si permission accordée)
                         ▼
┌─────────────────────────────────────────────────────────┐
│           COUCHE DE PERMISSIONS & CONFIDENTIALITÉ       │
│   ✅ Vérification des autorisations utilisatrice        │
│   ✅ Filtrage — seules les données autorisées passent   │
│   ✅ Aucune transmission externe                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              STOCKAGE LOCAL (sur l'appareil)            │
│   Base de données chiffrée — jamais synchronisée        │
│   Données brutes · Historique · Profil utilisatrice     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MOTEUR DE TRAITEMENT LOCAL                 │
│   📊 Calcul de la phase du cycle                        │
│   📊 Score de récupération                              │
│   📊 Détection de patterns (sommeil/cycle/humeur)       │
│   📊 Corrélations entre données                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MOTEUR DE CONSEIL (IA locale)              │
│   🧠 Sélection du conseil adapté au profil              │
│   🧠 Personnalisation selon phase + objectifs           │
│   🧠 Ton adapté au profil hormonal                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              INTERFACE UTILISATRICE (APP)               │
│   💬 Conseil du jour · 📈 Progrès · 🩸 Cycle           │
│   😴 Sommeil · 🎯 Objectifs · 🧠 Humeur                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Règles de Confidentialité & Conformité RGPD

| Règle | Application dans Afiya |
| --- | --- |
| **Minimisation des données** | Afiya ne collecte que les données strictement nécessaires aux conseils |
| **Stockage local uniquement** | Aucune donnée de santé ne quitte l'appareil de l'utilisatrice |
| **Consentement explicite** | Chaque catégorie de données est autorisée séparément par l'utilisatrice |
| **Droit d'accès** | L'utilisatrice peut voir toutes ses données depuis l'app |
| **Droit à l'effacement** | Un bouton "Supprimer toutes mes données" est disponible dans les paramètres |
| **Droit de rectification** | Toutes les données saisies sont modifiables à tout moment |
| **Chiffrement** | Les données locales sont chiffrées sur l'appareil |
| **Pas de partage tiers** | Afiya ne partage aucune donnée avec des annonceurs ou partenaires |

---

## ⚠️ Données NON collectées par Afiya

> 🚫 **Afiya ne collecte jamais :**
> - Localisation GPS
> - Contacts téléphoniques
> - Photos ou caméra
> - Identifiants publicitaires
> - Données de navigation
> - Informations bancaires ou de paiement
> - Données médicales diagnostiques

---

## 📋 Durée de conservation des données

| Type de données | Durée de conservation | Suppression |
| --- | --- | --- |
| Données de cycle | 24 mois (pour détecter les patterns) | À la demande ou désinstallation |
| Données de sommeil | 12 mois | À la demande ou désinstallation |
| Données d'humeur | 12 mois | À la demande ou désinstallation |
| Données sportives | 12 mois | À la demande ou désinstallation |
| Profil utilisatrice | Durée d'utilisation | À la demande ou désinstallation |

---

## 🧩 Dépendances techniques identifiées

| Composant | Technologie | Rôle |
| --- | --- | --- |
| Stockage local | SQLite chiffré | Base de données sur l'appareil |
| Lecture santé iOS | Apple HealthKit SDK | Accès aux données de santé iPhone |
| Lecture santé Android | Health Connect API | Accès aux données de santé Android |
| Moteur de conseil | Modèle IA embarqué (on-device) | Génération des conseils sans internet |
| Chiffrement | AES-256 | Protection des données locales |
| Interface | React Native | Application iOS & Android |

---

## 📋 Prochaine étape

➡️ **Phase 5 — Priorisation MoSCoW & Backlog**
Organiser toutes les fonctionnalités en un backlog priorisé avec une roadmap de livraison claire.

---

🌿 *Afiya — Coach Bien-être Connecté · Document vivant · Mars 2026*
