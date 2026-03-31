# 📝 Phase 3 — User Stories & Exigences Fonctionnelles

---

📅 Mars 2026 · 👤 Business Analyst · 🚦 **En cours**

---

> 🎯 **Objectif de cette phase**
> Traduire les besoins des personas en exigences fonctionnelles claires, testables et priorisées — prêtes à être développées.

---

## 📐 Format utilisé

Chaque User Story suit le format BA standard :

**"En tant que** [persona]**, je veux** [action] **afin de** [bénéfice]."**

Accompagnée de :
- ✅ **Critères d'acceptation** — conditions mesurables pour valider la fonctionnalité
- 🏷️ **Priorité MoSCoW** — Must / Should / Could / Won't
- 👤 **Persona(s) concernée(s)**

---

## 🔗 ÉPIQUE 1 — Connexion aux Apps de Santé

---

### US-01 · Connexion Apple Health

**En tant qu'** utilisatrice iPhone, **je veux** connecter Afiya à Apple Health **afin de** partager automatiquement mes données de santé sans saisie manuelle.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Yasmine, Sophie, Lina |
| 🔗 Dépendances | Apple HealthKit API |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice voit un écran de demande de permissions au premier lancement
- [ ] Elle peut choisir quelles données partager (cycle, sommeil, activité, fréquence cardiaque)
- [ ] En cas de refus, l'app fonctionne en mode limité avec un message explicatif
- [ ] La connexion est confirmée par un message de succès clair
- [ ] Les données sont lues en temps réel depuis Apple Health

---

### US-02 · Connexion Google Health Connect

**En tant qu'** utilisatrice Android, **je veux** connecter Afiya à Google Health Connect **afin de** bénéficier du même coaching que les utilisatrices iOS.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Amina |
| 🔗 Dépendances | Google Health Connect API |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice peut connecter son compte Google Health Connect en 3 étapes maximum
- [ ] Les mêmes types de données sont accessibles que sur iOS
- [ ] La déconnexion est possible à tout moment depuis les paramètres
- [ ] Un message d'erreur clair s'affiche si la connexion échoue

---

### US-03 · Gestion des permissions & confidentialité

**En tant qu'** utilisatrice, **je veux** contrôler quelles données je partage avec Afiya **afin de** protéger ma vie privée et ne partager que ce que je souhaite.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Toutes |
| 🔗 Dépendances | US-01, US-02 |

**✅ Critères d'acceptation**
- [ ] Un écran "Mes données" liste toutes les données auxquelles Afiya a accès
- [ ] L'utilisatrice peut révoquer l'accès à n'importe quelle catégorie de données
- [ ] Afiya ne stocke aucune donnée de santé sur ses serveurs (traitement local uniquement)
- [ ] Une politique de confidentialité claire est accessible depuis l'app en moins de 2 clics

---

## 💬 ÉPIQUE 2 — Conseil Quotidien Personnalisé

---

### US-04 · Affichage du conseil du jour

**En tant qu'** utilisatrice, **je veux** recevoir un conseil de bien-être personnalisé chaque matin **afin de** savoir comment prendre soin de moi aujourd'hui en fonction de mon état réel.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Toutes |
| 🔗 Dépendances | US-01 ou US-02 |

**✅ Critères d'acceptation**
- [ ] Un conseil est généré chaque jour avant 8h du matin
- [ ] Le conseil tient compte d'au moins 2 sources de données (ex : cycle + sommeil)
- [ ] Le conseil est lisible en moins de 30 secondes
- [ ] Le conseil est rédigé dans un ton bienveillant et non culpabilisant
- [ ] Si les données sont insuffisantes, un conseil générique s'affiche avec un message d'invitation à connecter plus de données

---

### US-05 · Conseil lié à la phase du cycle

**En tant qu'** utilisatrice, **je veux** que mon conseil du jour tienne compte de ma phase menstruelle actuelle **afin de** recevoir des recommandations adaptées à mon état hormonal du moment.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Yasmine, Amina, Lina |
| 🔗 Dépendances | US-04, Épique 3 |

**✅ Critères d'acceptation**
- [ ] Le conseil mentionne explicitement la phase du cycle (menstruelle, folliculaire, ovulatoire, lutéale)
- [ ] Les conseils varient selon la phase (ex : repos en phase menstruelle, effort en phase folliculaire)
- [ ] L'utilisatrice peut voir quelle phase elle traverse depuis l'écran principal
- [ ] En l'absence de données de cycle, le conseil reste pertinent et ne mentionne pas de phase

---

### US-06 · Sauvegarder & réagir à un conseil

**En tant qu'** utilisatrice, **je veux** pouvoir sauvegarder ou noter un conseil **afin de** le retrouver plus tard ou indiquer s'il était utile.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Sophie, Yasmine |
| 🔗 Dépendances | US-04 |

**✅ Critères d'acceptation**
- [ ] Un bouton "Sauvegarder" est disponible sur chaque conseil
- [ ] Les conseils sauvegardés sont accessibles dans un onglet "Mes conseils"
- [ ] L'utilisatrice peut indiquer 👍 ou 👎 sur chaque conseil
- [ ] Les retours utilisateur améliorent les futurs conseils générés

---

## 🩸 ÉPIQUE 3 — Suivi du Cycle Menstruel

---

### US-07 · Saisie et suivi du cycle

**En tant qu'** utilisatrice, **je veux** enregistrer mon cycle menstruel dans Afiya **afin de** recevoir des conseils adaptés à chaque phase de mon cycle.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Yasmine, Amina, Lina |
| 🔗 Dépendances | US-01 ou US-02 |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice peut indiquer le début et la fin de ses règles
- [ ] Afiya importe automatiquement les données de cycle depuis Apple Health / Clue si disponibles
- [ ] La phase actuelle du cycle est affichée sur l'écran principal (icône + label)
- [ ] L'utilisatrice peut voir un calendrier de son cycle sur les 3 derniers mois
- [ ] Une prédiction de la prochaine date de règles est affichée

---

### US-08 · Suivi des symptômes menstruels

**En tant qu'** utilisatrice, **je veux** noter mes symptômes (crampes, fatigue, humeur) pendant mes règles **afin de** mieux comprendre mes patterns mensuels.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Yasmine, Amina |
| 🔗 Dépendances | US-07 |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice peut sélectionner des symptômes parmi une liste prédéfinie (crampes, maux de tête, fatigue, ballonnements, sautes d'humeur)
- [ ] La saisie prend moins de 30 secondes
- [ ] Les symptômes apparaissent dans l'historique du cycle
- [ ] Afiya génère une observation mensuelle basée sur les symptômes récurrents

---

## 😴 ÉPIQUE 4 — Suivi du Sommeil & Fatigue

---

### US-09 · Analyse du sommeil

**En tant qu'** utilisatrice, **je veux** qu'Afiya analyse mon sommeil de la nuit précédente **afin de** recevoir un conseil adapté à mon niveau de récupération du jour.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Sophie, Amina, Lina |
| 🔗 Dépendances | US-01 ou US-02 |

**✅ Critères d'acceptation**
- [ ] Afiya lit automatiquement les données de sommeil depuis Apple Health / Google Fit
- [ ] Le conseil du matin tient compte de la durée et de la qualité du sommeil
- [ ] Un indicateur visuel simple (😴 Bonne nuit / 😵 Nuit difficile) est affiché
- [ ] Si le sommeil est inférieur à 6h, le conseil suggère des actions de récupération
- [ ] Les données de sommeil des 7 derniers jours sont visibles dans un graphique simple

---

### US-10 · Corrélation sommeil & cycle

**En tant qu'** utilisatrice, **je veux** comprendre comment mon cycle influence mon sommeil **afin d'** anticiper les nuits difficiles et adapter ma routine.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Sophie, Yasmine |
| 🔗 Dépendances | US-07, US-09 |

**✅ Critères d'acceptation**
- [ ] Après 2 cycles complets, Afiya affiche une observation sur le lien sommeil/cycle
- [ ] Ex : "Tu dors en moyenne 45 min de moins pendant ta phase lutéale"
- [ ] Un conseil préventif est généré avant les phases historiquement difficiles

---

## 🧠 ÉPIQUE 5 — Suivi Humeur & Santé Mentale

---

### US-11 · Check-in humeur quotidien

**En tant qu'** utilisatrice, **je veux** noter mon humeur en quelques secondes chaque jour **afin de** suivre mes variations émotionnelles dans le temps.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Yasmine, Sophie |
| 🔗 Dépendances | Aucune |

**✅ Critères d'acceptation**
- [ ] Un check-in humeur s'affiche une fois par jour (matin ou soir, selon préférence)
- [ ] La saisie se fait en 1 clic via des émojis ou une échelle visuelle
- [ ] L'humeur est corrélée à la phase du cycle dans les statistiques mensuelles
- [ ] L'utilisatrice peut ajouter une note courte (optionnel)
- [ ] Le check-in n'est jamais obligatoire — toujours optionnel

---

### US-12 · Détection des périodes de stress

**En tant qu'** utilisatrice, **je veux** qu'Afiya détecte quand je traverse une période de stress **afin de** recevoir des conseils adaptés à ma récupération mentale.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟢 Could Have |
| 👤 Personas | Amina, Sophie |
| 🔗 Dépendances | US-09, US-11 |

**✅ Critères d'acceptation**
- [ ] Si la fréquence cardiaque au repos est élevée + humeur basse + sommeil court pendant 3 jours consécutifs, Afiya détecte un signal de stress
- [ ] Un message bienveillant (non alarmiste) est proposé avec 2-3 actions simples
- [ ] L'utilisatrice peut ignorer la suggestion sans pénalité

---

## 🏃‍♀️ ÉPIQUE 6 — Sport & Récupération

---

### US-13 · Conseil sportif adapté au cycle

**En tant que** sportive, **je veux** recevoir des recommandations d'entraînement adaptées à ma phase de cycle **afin d'** optimiser mes performances et éviter les blessures.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Lina |
| 🔗 Dépendances | US-07, US-01 |

**✅ Critères d'acceptation**
- [ ] Afiya lit les données d'activité physique depuis Apple Health / Google Fit / Garmin
- [ ] Le conseil sportif du jour précise l'intensité recommandée selon la phase (ex : haute intensité en phase folliculaire, récupération en phase menstruelle)
- [ ] En cas de surentraînement détecté (fréquence cardiaque élevée + sommeil court), un conseil de repos est proposé
- [ ] L'utilisatrice peut voir ses stats sportives des 7 derniers jours

---

### US-14 · Suivi de la récupération

**En tant qu'** utilisatrice active, **je veux** suivre ma récupération après l'effort **afin de** savoir si mon corps est prêt pour un nouvel entraînement.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Lina, Yasmine |
| 🔗 Dépendances | US-13, US-09 |

**✅ Critères d'acceptation**
- [ ] Un score de récupération est calculé chaque matin (basé sur HRV, sommeil, fréquence cardiaque au repos)
- [ ] Le score est affiché visuellement (vert / orange / rouge)
- [ ] Si le score est faible, le conseil du jour priorise la récupération

---

## 🎯 ÉPIQUE 7 — Objectifs Personnalisés

---

### US-15 · Définition des objectifs de santé

**En tant qu'** utilisatrice, **je veux** définir mes objectifs de santé personnels **afin de** recevoir des conseils alignés avec ce que je veux accomplir.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Toutes |
| 🔗 Dépendances | Aucune |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice peut sélectionner jusqu'à 3 objectifs parmi : mieux dormir, comprendre mon cycle, réduire le stress, améliorer ma récupération sportive, gérer mes symptômes hormonaux
- [ ] Les objectifs influencent directement le type de conseils générés
- [ ] Les objectifs sont modifiables à tout moment depuis les paramètres
- [ ] Un écran de bienvenue guide la sélection des objectifs dès le premier lancement

---

### US-16 · Suivi de progression vers les objectifs

**En tant qu'** utilisatrice, **je veux** voir ma progression vers mes objectifs **afin de** rester motivée et mesurer l'impact d'Afiya sur mon bien-être.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Toutes |
| 🔗 Dépendances | US-15 |

**✅ Critères d'acceptation**
- [ ] Un écran "Mes progrès" affiche l'évolution sur 7, 30 et 90 jours
- [ ] Chaque objectif a un indicateur visuel de progression (graphique simple)
- [ ] Une observation hebdomadaire est générée automatiquement (ex : "Cette semaine, tu as dormi 45 min de plus qu'il y a un mois")
- [ ] Les progrès sont présentés positivement — jamais culpabilisants

---

## 🔬 ÉPIQUE 8 — Profil Hormonal

---

### US-17 · Déclaration d'un profil hormonal spécifique

**En tant qu'** utilisatrice avec un profil hormonal particulier, **je veux** indiquer ma situation (SOPK, péri-ménopause, thyroïde, contraception hormonale) **afin de** recevoir des conseils adaptés à ma réalité hormonale.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🔴 Must Have |
| 👤 Personas | Amina (SOPK), Sophie (péri-ménopause) |
| 🔗 Dépendances | Aucune |

**✅ Critères d'acceptation**
- [ ] L'utilisatrice peut sélectionner une ou plusieurs situations : SOPK, péri-ménopause, post-ménopause, thyroïde, pilule/stérilet hormonal, grossesse, post-partum
- [ ] Le profil hormonal est pris en compte dans chaque conseil généré
- [ ] Afiya ne pose pas de questions médicales — elle adapte le ton et les conseils, sans diagnostiquer
- [ ] Un message de transparence explique comment le profil est utilisé
- [ ] Le profil est modifiable à tout moment

---

### US-18 · Conseils adaptés à la péri-ménopause

**En tant qu'** utilisatrice en péri-ménopause, **je veux** des conseils spécifiques à mes symptômes **afin de** mieux traverser cette transition hormonale.

| Champ | Détail |
| --- | --- |
| 🏷️ Priorité | 🟡 Should Have |
| 👤 Personas | Sophie |
| 🔗 Dépendances | US-17 |

**✅ Critères d'acceptation**
- [ ] Les conseils tiennent compte des symptômes typiques : bouffées de chaleur, troubles du sommeil, variations d'humeur, sécheresse
- [ ] Le ton est rassurant, adulte et basé sur des données — pas alarmiste
- [ ] Des ressources informatives (articles, podcasts) peuvent être suggérées en complément du conseil
- [ ] Afiya ne remplace jamais un avis médical — un rappel discret l'indique

---

## 📊 Récapitulatif MoSCoW

| Priorité | User Stories | Nombre |
| --- | --- | --- |
| 🔴 Must Have | US-01, 02, 03, 04, 05, 07, 09, 13, 15, 17 | 10 |
| 🟡 Should Have | US-06, 08, 10, 11, 14, 16, 18 | 7 |
| 🟢 Could Have | US-12 | 1 |
| ⚪ Won't Have (v1) | Partage social, diagnostic médical, IA vocale | — |

---

## 📋 Prochaine étape

➡️ **Phase 4 — Cartographie des Données & Intégrations**
Définir les flux de données entre les apps de santé et Afiya, les APIs utilisées et les règles de traitement.

---

🌿 *Afiya — Coach Bien-être Connecté · Document vivant · Mars 2026*
