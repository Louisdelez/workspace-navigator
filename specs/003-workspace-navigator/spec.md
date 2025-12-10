# Feature Specification: Workspace Navigator

**Feature Branch**: `003-workspace-navigator`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Application desktop moderne combinant navigateur web, éditeur Markdown et panneau IA dans une interface unifiée

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigation Web avec Sauvegarde Automatique (Priority: P1)

En tant qu'utilisateur, je veux naviguer sur le web et avoir chaque page visitée automatiquement sauvegardée dans mon workspace pour retrouver mes recherches ultérieurement sans effort d'organisation manuel.

**Why this priority**: C'est la fonctionnalité fondamentale qui différencie l'application d'un navigateur classique. Sans cette capacité de capture automatique, l'application perd sa proposition de valeur principale.

**Independent Test**: Peut être testé en ouvrant plusieurs pages web et en vérifiant qu'elles apparaissent automatiquement dans l'arborescence du workspace avec les métadonnées correctes (titre, URL, date).

**Acceptance Scenarios**:

1. **Given** l'application est ouverte, **When** l'utilisateur navigue vers une nouvelle URL, **Then** un item est automatiquement créé dans le dossier du jour avec le titre de la page et l'URL
2. **Given** un dossier daté n'existe pas pour aujourd'hui, **When** l'utilisateur visite sa première page du jour, **Then** un nouveau dossier avec la date du jour est créé automatiquement
3. **Given** une URL est déjà ouverte dans un onglet, **When** l'utilisateur tente d'ouvrir la même URL, **Then** le focus passe sur l'onglet existant au lieu d'en créer un nouveau
4. **Given** l'utilisateur a des onglets ouverts, **When** l'application crash et redémarre, **Then** tous les onglets sont restaurés dans leur état précédent

---

### User Story 2 - Organisation Hiérarchique du Workspace (Priority: P1)

En tant qu'utilisateur, je veux organiser mes items (pages web, notes) dans une arborescence de dossiers pour structurer mes recherches et projets de manière personnalisée.

**Why this priority**: L'organisation est essentielle pour rendre la navigation permanente utile. Sans structure, la masse d'items deviendrait ingérable.

**Independent Test**: Peut être testé en créant des dossiers, en déplaçant des items par drag & drop, et en vérifiant que la structure persiste après redémarrage.

**Acceptance Scenarios**:

1. **Given** le workspace contient des items, **When** l'utilisateur crée un nouveau dossier, **Then** le dossier apparaît dans l'arborescence et peut contenir des items
2. **Given** un item existe dans un dossier, **When** l'utilisateur le glisse vers un autre dossier, **Then** l'item est déplacé et la structure est mise à jour immédiatement
3. **Given** le workspace contient des milliers d'items, **When** l'utilisateur fait défiler l'arborescence, **Then** le défilement reste fluide sans saccades
4. **Given** l'utilisateur tape dans la barre de recherche, **When** des caractères sont saisis, **Then** les résultats correspondants apparaissent instantanément (< 100ms)

---

### User Story 3 - Création et Édition de Notes Markdown (Priority: P2)

En tant que créateur de contenu, je veux rédiger des notes Markdown dans des onglets dédiés pour documenter mes recherches et les lier à mes sources web.

**Why this priority**: Les notes enrichissent la navigation en permettant d'ajouter du contexte personnel. C'est un complément naturel à la capture automatique.

**Independent Test**: Peut être testé en créant une note, en saisissant du contenu Markdown, et en vérifiant la sauvegarde automatique et le rendu.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est dans le workspace, **When** il crée une nouvelle note, **Then** un onglet d'édition Markdown s'ouvre et un item est créé dans l'arborescence
2. **Given** l'utilisateur édite une note, **When** il arrête de taper pendant 500ms, **Then** le contenu est automatiquement sauvegardé et un indicateur discret confirme la sauvegarde
3. **Given** une note contient du Markdown valide, **When** l'utilisateur visualise la note, **Then** le rendu est moderne et épuré avec formatage correct
4. **Given** une note existe dans le workspace, **When** l'utilisateur clique dessus, **Then** l'onglet correspondant s'ouvre ou reçoit le focus s'il est déjà ouvert

---

### User Story 4 - Panneau IA Dédié (Priority: P2)

En tant que professionnel, je veux accéder à un panneau IA permanent à droite de l'écran pour interagir avec des assistants IA sans interrompre ma navigation.

**Why this priority**: L'intégration IA est un différenciateur clé mais dépend d'abord d'avoir une navigation fonctionnelle.

**Independent Test**: Peut être testé en ouvrant le panneau IA, en sélectionnant un service, et en vérifiant que les sessions sont conservées.

**Acceptance Scenarios**:

1. **Given** l'application est ouverte, **When** l'utilisateur ouvre le panneau IA, **Then** le panneau apparaît à droite sans bloquer la navigation principale
2. **Given** le panneau IA est ouvert, **When** l'utilisateur sélectionne un service IA (ChatGPT, Claude, Gemini), **Then** la webview correspondante se charge
3. **Given** une session IA est en cours, **When** l'utilisateur ferme et rouvre l'application, **Then** la session IA est restaurée
4. **Given** le panneau IA est visible, **When** l'utilisateur redimensionne le panneau, **Then** le layout s'adapte fluidement

---

### User Story 5 - Gestion Multi-Onglets Performante (Priority: P2)

En tant qu'utilisateur multitâche, je veux ouvrir de nombreux onglets simultanément avec des performances optimales et un avertissement lorsque j'approche des limites de ressources.

**Why this priority**: La performance multi-onglets est essentielle pour une utilisation professionnelle quotidienne.

**Independent Test**: Peut être testé en ouvrant 20+ onglets et en mesurant les temps de réponse et la consommation mémoire.

**Acceptance Scenarios**:

1. **Given** l'application est lancée, **When** l'utilisateur ouvre un nouvel onglet, **Then** l'onglet se charge en moins de 200ms
2. **Given** l'utilisateur a 20 onglets ouverts, **When** il ouvre un 21ème onglet, **Then** un avertissement discret s'affiche mais l'onglet s'ouvre sans restriction
3. **Given** un onglet est ouvert dans la barre d'onglets, **When** l'utilisateur clique sur l'item correspondant dans l'arborescence, **Then** le focus passe sur l'onglet existant

---

### User Story 6 - Interface Moderne Dark Mode (Priority: P3)

En tant qu'utilisateur, je veux une interface élégante en dark mode avec des animations fluides pour une expérience visuelle professionnelle et agréable.

**Why this priority**: L'esthétique améliore l'expérience mais n'est pas bloquante pour les fonctionnalités core.

**Independent Test**: Peut être testé en naviguant dans l'interface et en vérifiant la cohérence visuelle et la fluidité des transitions.

**Acceptance Scenarios**:

1. **Given** l'application démarre, **When** l'interface se charge, **Then** le thème dark mode premium est appliqué par défaut
2. **Given** l'utilisateur interagit avec l'interface, **When** des transitions se produisent, **Then** les animations durent entre 120 et 180ms
3. **Given** le layout 3 panneaux est affiché, **When** l'utilisateur redimensionne les panneaux, **Then** les effets glass et glow restent cohérents

---

### Edge Cases

- Que se passe-t-il lorsqu'une page web ne peut pas être chargée (timeout, erreur réseau) ? → L'item est créé avec un statut d'erreur et l'utilisateur peut réessayer
- Comment le système gère-t-il les URLs avec authentification requise ? → La webview affiche la page de login, l'utilisateur s'authentifie, l'item est mis à jour
- Que se passe-t-il si la base de données est corrompue ? → L'application détecte la corruption au démarrage et propose de restaurer depuis une sauvegarde automatique
- Comment le système réagit-il avec 10 000+ items dans le workspace ? → Virtualisation de la liste pour maintenir les performances de rendu
- Que se passe-t-il lors d'un crash pendant une sauvegarde ? → Les transactions garantissent l'intégrité des données, les écritures partielles sont annulées

## Requirements *(mandatory)*

### Functional Requirements

#### Workspace Hiérarchique

- **FR-001**: Le système DOIT afficher une arborescence de fichiers (dossiers et items) dans un panneau latéral gauche
- **FR-002**: Le système DOIT créer automatiquement un item lorsque l'utilisateur navigue vers une nouvelle URL
- **FR-003**: Le système DOIT créer automatiquement un dossier daté (format: YYYY-MM-DD) pour les nouveaux items si inexistant
- **FR-004**: Les utilisateurs DOIVENT pouvoir créer, renommer et supprimer des dossiers manuellement
- **FR-005**: Les utilisateurs DOIVENT pouvoir déplacer des items entre dossiers par glisser-déposer
- **FR-006**: Le système DOIT fournir une recherche instantanée dans tout le workspace (titre, URL, contenu des notes)

#### Navigateur Intégré

- **FR-007**: Le système DOIT afficher des webviews dans des onglets avec une barre d'onglets style moderne
- **FR-008**: Le système DOIT fournir une barre d'adresse avec boutons de navigation (précédent, suivant, rafraîchir)
- **FR-009**: Le système DOIT détecter les URL dupliquées et focaliser l'onglet existant au lieu d'en créer un nouveau
- **FR-010**: Le système DOIT restaurer les onglets ouverts après un crash ou redémarrage
- **FR-011**: Le système DOIT afficher le titre de la page dans l'onglet et la favicon si disponible

#### Éditeur Markdown

- **FR-012**: Les utilisateurs DOIVENT pouvoir créer et éditer des notes Markdown dans des onglets dédiés
- **FR-013**: Le système DOIT sauvegarder automatiquement le contenu après 500ms d'inactivité de frappe
- **FR-014**: Le système DOIT afficher un indicateur de sauvegarde discret ("Saved at HH:MM:SS")
- **FR-015**: Le système DOIT fournir un rendu Markdown moderne et épuré

#### Panneau IA

- **FR-016**: Le système DOIT afficher un panneau IA dockable à droite de l'écran
- **FR-017**: Les utilisateurs DOIVENT pouvoir sélectionner parmi plusieurs services IA (ChatGPT, Claude, Gemini)
- **FR-018**: Le système DOIT conserver les sessions IA entre les fermetures d'application
- **FR-019**: Le panneau IA DOIT rester accessible sans bloquer la navigation principale

#### Gestion Multi-Onglets

- **FR-020**: Le système DOIT permettre l'ouverture de webviews et notes depuis l'arborescence
- **FR-021**: Le système DOIT afficher un avertissement à 20 onglets ouverts sans imposer de limite dure
- **FR-022**: Le système DOIT maintenir la connexion bidirectionnelle entre items et onglets

#### Stockage et Persistance

- **FR-023**: Le système DOIT stocker toutes les données localement dans une base de données sécurisée
- **FR-024**: Le système DOIT effectuer des sauvegardes automatiques régulières
- **FR-025**: Le système DOIT supporter la restauration après crash
- **FR-026**: Le système DOIT supporter les migrations de schéma versionnées

#### Interface et Expérience

- **FR-027**: Le système DOIT utiliser un thème dark mode premium par défaut
- **FR-028**: Le système DOIT appliquer des transitions fluides (120-180ms) pour les interactions
- **FR-029**: Le système DOIT afficher un layout 3 panneaux : Sidebar / Workspace / AI Panel

### Key Entities

- **Workspace**: Conteneur racine de toute l'arborescence. Attributs: nom, date de création, paramètres utilisateur
- **Folder**: Conteneur organisationnel pouvant contenir des items et sous-dossiers. Attributs: nom, parent, ordre d'affichage, date de création
- **Item**: Élément individuel représentant une page web ou une note. Attributs: type (web/note), titre, URL (si web), contenu (si note), dossier parent, date de création, date de modification, favicon
- **Tab**: Représentation d'un onglet ouvert. Attributs: item associé, état de navigation, position, actif/inactif
- **AISession**: Session avec un service IA. Attributs: service (ChatGPT/Claude/Gemini), état de la session, dernière utilisation
- **AppState**: État global de l'application pour restauration. Attributs: onglets ouverts, positions des panneaux, dernière session

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: L'application démarre et affiche l'interface complète en moins de 2 secondes
- **SC-002**: Un nouvel onglet s'ouvre et affiche son contenu en moins de 200ms
- **SC-003**: Le workspace gère 10 000+ items sans dégradation perceptible des performances de navigation
- **SC-004**: La recherche affiche des résultats en moins de 100ms pour un workspace de 10 000 items
- **SC-005**: 95% des utilisateurs peuvent organiser leurs items dans des dossiers sans consulter de documentation
- **SC-006**: L'autosave des notes se déclenche dans les 500ms suivant l'arrêt de la frappe avec 100% de fiabilité
- **SC-007**: Après un crash, 100% des onglets et de l'état de l'application sont restaurés
- **SC-008**: Les transitions d'interface restent fluides (60fps) même avec 20+ onglets ouverts
- **SC-009**: L'application fonctionne de manière identique sur Windows, macOS et Linux
- **SC-010**: Aucune donnée utilisateur n'est transmise à l'extérieur (sauf connexions explicites aux services IA)

## Constraints

### Performance

- Lancement de l'application: < 2 secondes
- Ouverture d'un onglet: < 200ms
- Recherche instantanée: < 100ms

### Compatibilité

- Windows 10+, macOS 10.15+, Linux (distributions majeures)
- Architecture offline-first (fonctionne sans connexion internet)

### Sécurité et Confidentialité

- Stockage local uniquement
- Pas de télémétrie ni de tracking
- Base de données chiffrée

### Limites V1 (Hors Scope)

- Pas de synchronisation cloud
- Pas d'édition collaborative
- Pas de fonctionnalités IA internes (utilisation des services officiels uniquement)
- Pas de système de plugins/extensions
- Import/export basique uniquement

## Assumptions

- Les utilisateurs ont une connexion internet pour accéder aux pages web et services IA (mais l'application fonctionne offline pour les données locales)
- Les utilisateurs sont familiers avec les concepts de base d'un navigateur web et d'une arborescence de fichiers
- Les services IA tiers (ChatGPT, Claude, Gemini) restent accessibles via leurs interfaces web standards
- Le système d'exploitation fournit les ressources nécessaires pour exécuter des webviews multiples
- Les utilisateurs acceptent que les sessions IA dépendent des politiques de session des services tiers

## Dependencies

- Aucune dépendance externe pour le stockage (tout est local)
- Dépendance optionnelle aux services IA tiers pour le panneau IA
- Dépendance au réseau pour la navigation web (mais pas pour les notes locales)
