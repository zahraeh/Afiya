# ⚖️ Phase 5 — Priorisation MoSCoW & Backlog

---

📅 Mars 2026 · 👤 Business Analyst · 🚦 **En cours**

---

> 🎯 **Objectif de cette phase**
> Organiser toutes les fonctionnalités identifiées en un backlog priorisé et une roadmap réaliste sur 6 mois — 12 sprints de 2 semaines — pour guider l'équipe de développement de manière claire et structurée.

---

> 📐 **Cadre MoSCoW**
> - 🔴 **Must Have** — Indispensable. Sans ça, l'app ne peut pas être lancée.
> - 🟡 **Should Have** — Important. Doit être livré rapidement après le MVP.
> - 🟢 **Could Have** — Utile. Livré si le temps le permet.
> - ⚪ **Won't Have (v1)** — Hors périmètre pour cette version.

---

## 🔴 Must Have — Le cœur d'Afiya

*Ces fonctionnalités constituent le MVP. Sans elles, l'app ne peut pas être lancée.*

| # | User Story | Épique | Complexité | Sprint cible |
| --- | --- | --- | --- | --- |
| US-01 | Connexion Apple HealthKit | Intégration | 🔴 Élevée | Sprint 2 |
| US-02 | Connexion Google Health Connect | Intégration | 🔴 Élevée | Sprint 3 |
| US-03 | Gestion permissions & confidentialité | Intégration | 🟡 Moyenne | Sprint 2 |
| US-04 | Affichage du conseil du jour | Conseil quotidien | 🔴 Élevée | Sprint 5 |
| US-05 | Conseil lié à la phase du cycle | Conseil quotidien | 🟡 Moyenne | Sprint 6 |
| US-07 | Saisie et suivi du cycle menstruel | Cycle | 🟡 Moyenne | Sprint 4 |
| US-09 | Analyse du sommeil | Sommeil | 🟡 Moyenne | Sprint 4 |
| US-13 | Conseil sportif adapté au cycle | Sport | 🟡 Moyenne | Sprint 7 |
| US-15 | Définition des objectifs de santé | Objectifs | 🟢 Faible | Sprint 3 |
| US-17 | Déclaration du profil hormonal | Profil hormonal | 🟡 Moyenne | Sprint 3 |

---

## 🟡 Should Have — La valeur ajoutée

*Ces fonctionnalités enrichissent significativement l'expérience. Livrées juste après le MVP.*

| # | User Story | Épique | Complexité | Sprint cible |
| --- | --- | --- | --- | --- |
| US-06 | Sauvegarder & réagir à un conseil | Conseil quotidien | 🟢 Faible | Sprint 7 |
| US-08 | Suivi des symptômes menstruels | Cycle | 🟢 Faible | Sprint 6 |
| US-10 | Corrélation sommeil & cycle | Sommeil | 🔴 Élevée | Sprint 9 |
| US-11 | Check-in humeur quotidien | Humeur | 🟢 Faible | Sprint 6 |
| US-14 | Suivi de la récupération | Sport | 🟡 Moyenne | Sprint 8 |
| US-16 | Suivi de progression vers les objectifs | Objectifs | 🟡 Moyenne | Sprint 8 |
| US-18 | Conseils adaptés à la péri-ménopause | Profil hormonal | 🟡 Moyenne | Sprint 9 |

---

## 🟢 Could Have — Les plus

*Livrées si la capacité de l'équipe le permet dans les 6 mois.*

| # | User Story | Épique | Complexité | Sprint cible |
| --- | --- | --- | --- | --- |
| US-12 | Détection des périodes de stress | Humeur | 🔴 Élevée | Sprint 10 |

---

## ⚪ Won't Have (v1) — Hors périmètre

*Identifiées mais volontairement exclues de la version 1.*

| Fonctionnalité | Raison |
| --- | --- |
| Partage social / communauté | Complexité + risques vie privée |
| Intégration médecin / professionnel de santé | Réglementation médicale complexe |
| Diagnostic ou analyse médicale | Hors scope — Afiya n'est pas une app médicale |
| IA vocale / coach vocal | Complexité technique élevée |
| Version web | Mobile uniquement en v1 |
| Monétisation / abonnement | Phase 1 = gratuit pour valider l'usage |
| Garmin / Fitbit / Clue / Flo | Intégration reportée en v2 |

---

## 📅 Roadmap — 6 mois / 12 sprints

### 🏗️ PHASE A — Fondations (Sprints 1-3) · Avril 2026

---

**Sprint 1 · 1-14 Avril — Setup & Architecture**

| Tâche | Type | Priorité |
| --- | --- | --- |
| Mise en place de l'environnement de développement | Tech | 🔴 |
| Architecture de la base de données locale (SQLite chiffré) | Tech | 🔴 |
| Système de navigation de l'app (React Native) | Tech | 🔴 |
| Écran de bienvenue & onboarding (maquette validée) | Design | 🔴 |
| Charte graphique & design system | Design | 🔴 |

> ✅ **Critère de fin de sprint :** L'app se lance, la navigation de base fonctionne, le design system est validé.

---

**Sprint 2 · 15-28 Avril — Connexion iOS & Permissions**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Intégration Apple HealthKit | US-01 | 🔴 |
| Écran de gestion des permissions | US-03 | 🔴 |
| Lecture des données sommeil (iOS) | US-09 | 🔴 |
| Lecture des données activité (iOS) | US-13 | 🔴 |
| Stockage local sécurisé des données lues | Tech | 🔴 |

> ✅ **Critère de fin de sprint :** Une utilisatrice iOS peut connecter Apple Health et accorder/révoquer des permissions par catégorie.

---

**Sprint 3 · 29 Avril - 12 Mai — Profil & Objectifs**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Intégration Google Health Connect | US-02 | 🔴 |
| Écran de création du profil utilisatrice | US-17 | 🔴 |
| Sélection du profil hormonal (SOPK, ménopause…) | US-17 | 🔴 |
| Écran de définition des objectifs de santé | US-15 | 🔴 |
| Sauvegarde locale du profil | Tech | 🔴 |

> ✅ **Critère de fin de sprint :** L'utilisatrice peut créer son profil complet, définir ses objectifs et connecter son app de santé (iOS ou Android).

---

### 🌱 PHASE B — Fonctionnalités Cœur (Sprints 4-6) · Mai - Juin 2026

---

**Sprint 4 · 13-26 Mai — Cycle & Sommeil**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Écran de saisie du cycle menstruel | US-07 | 🔴 |
| Calcul automatique de la phase du cycle | US-07 | 🔴 |
| Prédiction de la prochaine date de règles | US-07 | 🔴 |
| Calendrier de cycle (3 mois) | US-07 | 🔴 |
| Affichage des données de sommeil (7 jours) | US-09 | 🔴 |

> ✅ **Critère de fin de sprint :** L'utilisatrice peut saisir son cycle, voir sa phase actuelle et consulter ses données de sommeil.

---

**Sprint 5 · 27 Mai - 9 Juin — Conseil du Jour**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Moteur de génération du conseil quotidien | US-04 | 🔴 |
| Bibliothèque de conseils (par catégorie + phase) | US-04 | 🔴 |
| Écran principal — affichage du conseil du jour | US-04 | 🔴 |
| Notification matinale (heure paramétrable) | US-04 | 🔴 |
| Conseil de secours si données insuffisantes | US-04 | 🔴 |

> ✅ **Critère de fin de sprint :** Chaque matin, l'utilisatrice reçoit un conseil personnalisé basé sur ses données disponibles.

---

**Sprint 6 · 10-23 Juin — Personnalisation du Conseil**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Conseil intégrant la phase du cycle | US-05 | 🔴 |
| Check-in humeur quotidien | US-11 | 🟡 |
| Saisie des symptômes menstruels | US-08 | 🟡 |
| Adaptation du conseil au profil hormonal | US-17 | 🔴 |
| Affichage de la phase du cycle sur l'écran principal | US-05 | 🔴 |

> ✅ **Critère de fin de sprint :** Le conseil du jour est personnalisé selon le cycle, le profil hormonal et l'humeur déclarée.

---

### 🚀 PHASE C — Enrichissement (Sprints 7-9) · Juillet - Août 2026

---

**Sprint 7 · 24 Juin - 7 Juillet — Sport & Sauvegarde**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Conseil sportif adapté à la phase du cycle | US-13 | 🔴 |
| Lecture des données sportives (HealthKit / Health Connect) | US-13 | 🔴 |
| Bouton sauvegarder un conseil | US-06 | 🟡 |
| Onglet "Mes conseils sauvegardés" | US-06 | 🟡 |
| Système de feedback 👍 / 👎 sur les conseils | US-06 | 🟡 |

> ✅ **Critère de fin de sprint :** Les sportives reçoivent des conseils d'entraînement adaptés à leur phase. Les conseils peuvent être sauvegardés.

---

**Sprint 8 · 8-21 Juillet — Récupération & Progrès**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Score de récupération quotidien (HRV + sommeil + FC) | US-14 | 🟡 |
| Affichage visuel du score (vert / orange / rouge) | US-14 | 🟡 |
| Écran "Mes progrès" (7, 30, 90 jours) | US-16 | 🟡 |
| Graphiques de progression par objectif | US-16 | 🟡 |
| Observation hebdomadaire automatique | US-16 | 🟡 |

> ✅ **Critère de fin de sprint :** L'utilisatrice voit son score de récupération et peut consulter ses progrès dans le temps.

---

**Sprint 9 · 22 Juillet - 4 Août — Corrélations & Ménopause**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Corrélation sommeil / cycle (après 2 cycles) | US-10 | 🟡 |
| Conseil préventif basé sur patterns historiques | US-10 | 🟡 |
| Conseils spécifiques péri-ménopause | US-18 | 🟡 |
| Ton et contenu adapté au profil ménopause | US-18 | 🟡 |

> ✅ **Critère de fin de sprint :** Afiya détecte les patterns sommeil/cycle et adapte les conseils aux profils ménopause.

---

### 🏁 PHASE D — Finalisation & Lancement (Sprints 10-12) · Août - Septembre 2026

---

**Sprint 10 · 5-18 Août — Détection Stress & Tests**

| Tâche | User Story | Priorité |
| --- | --- | --- |
| Algorithme de détection de stress | US-12 | 🟢 |
| Message bienveillant + actions suggérées | US-12 | 🟢 |
| Tests utilisatrices (beta fermée — 10 profils) | QA | 🔴 |
| Corrections bugs identifiés en beta | QA | 🔴 |

> ✅ **Critère de fin de sprint :** La beta est testée, les bugs critiques sont corrigés.

---

**Sprint 11 · 19 Août - 1 Sept — Polish & Performance**

| Tâche | Type | Priorité |
| --- | --- | --- |
| Optimisation des performances (temps de chargement < 3s) | Tech | 🔴 |
| Accessibilité (taille texte, contraste, lecteur d'écran) | Tech | 🟡 |
| Finalisation onboarding & tutoriel | Design | 🔴 |
| Politique de confidentialité in-app | Legal | 🔴 |
| Bouton "Supprimer toutes mes données" | RGPD | 🔴 |

> ✅ **Critère de fin de sprint :** L'app est fluide, conforme RGPD et prête pour la soumission aux stores.

---

**Sprint 12 · 2-15 Sept — Lancement 🎉**

| Tâche | Type | Priorité |
| --- | --- | --- |
| Soumission App Store (Apple) | Lancement | 🔴 |
| Soumission Google Play Store | Lancement | 🔴 |
| Page de présentation Afiya (site ou landing page) | Marketing | 🟡 |
| Suivi des retours post-lancement | Produit | 🔴 |
| Planification de la v2 | Produit | 🟡 |

> ✅ **Critère de fin de sprint :** Afiya est disponible sur l'App Store et le Play Store. 🚀

---

## 📊 Vue d'ensemble de la Roadmap

| Sprint | Période | Thème | Must | Should | Could |
| --- | --- | --- | --- | --- | --- |
| S1 | 1-14 Avril | Setup & Architecture | 5 tâches | — | — |
| S2 | 15-28 Avril | Connexion iOS | US-01, 03, 09 | — | — |
| S3 | 29 Avril-12 Mai | Profil & Objectifs | US-02, 15, 17 | — | — |
| S4 | 13-26 Mai | Cycle & Sommeil | US-07, 09 | — | — |
| S5 | 27 Mai-9 Juin | Conseil du jour | US-04 | — | — |
| S6 | 10-23 Juin | Personnalisation | US-05 | US-08, 11 | — |
| S7 | 24 Juin-7 Juil | Sport & Sauvegarde | US-13 | US-06 | — |
| S8 | 8-21 Juillet | Récupération & Progrès | — | US-14, 16 | — |
| S9 | 22 Juil-4 Août | Corrélations & Ménopause | — | US-10, 18 | — |
| S10 | 5-18 Août | Stress & Beta | — | — | US-12 |
| S11 | 19 Août-1 Sept | Polish & RGPD | Conformité | Accessibilité | — |
| S12 | 2-15 Sept | 🚀 Lancement | App Store | Play Store | Landing |

---

## 📋 Prochaine étape

➡️ **Phase 6 — Wireframes & Spécifications UI**
Définir les écrans clés d'Afiya avec leurs spécifications fonctionnelles — prêts à être remis au designer.

---

🌿 *Afiya — Coach Bien-être Connecté · Document vivant · Mars 2026*
