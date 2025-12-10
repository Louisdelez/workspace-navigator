# Feature Specification: Éditeur Markdown Avancé

**Feature Branch**: `001-markdown`
**Created**: 2025-12-09
**Status**: Draft
**Input**: User description: "Éditeur Markdown Avancé pour Workspace Navigator - écrire, formater, organiser et prévisualiser des notes en Markdown dans une interface moderne similaire à MarkText ou Typora"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Écriture Markdown avec Rendu Live (Priority: P1)

En tant qu'utilisateur, je veux taper du texte markdown dans une zone d'édition et voir immédiatement la mise en forme appliquée, afin de créer des notes structurées rapidement sans devoir prévisualiser manuellement.

**Why this priority**: C'est la fonctionnalité fondamentale de l'éditeur. Sans elle, aucune autre fonctionnalité n'a de sens. Elle permet de valider l'intégration de base avec le système d'onglets existant.

**Independent Test**: Peut être testé en créant une nouvelle note, en tapant du texte avec des syntaxes markdown (titres, listes, gras), et en vérifiant que le rendu visuel est mis à jour instantanément. Délivre la valeur de base: prise de notes formatées.

**Acceptance Scenarios**:

1. **Given** une note markdown vide ouverte dans un onglet, **When** je tape `# Mon Titre`, **Then** le texte s'affiche comme un titre de niveau 1 avec le style approprié (grande taille, gras)
2. **Given** une note contenant du texte, **When** je tape `**texte en gras**`, **Then** le texte apparaît immédiatement en gras dans la zone d'édition
3. **Given** une note ouverte, **When** je tape une liste avec `- item 1` suivi d'un retour à la ligne et `- item 2`, **Then** une liste à puces formatée s'affiche
4. **Given** une note avec du contenu, **When** je tape des blocs de code avec triple backticks, **Then** le code s'affiche dans un bloc formaté avec fond distinct

---

### User Story 2 - Barre d'Outils de Formatage (Priority: P2)

En tant qu'utilisateur non technique, je veux pouvoir formater mon texte via des boutons dans une barre d'outils, afin d'appliquer des styles sans connaître la syntaxe markdown.

**Why this priority**: Rend l'éditeur accessible aux utilisateurs qui ne connaissent pas la syntaxe markdown. Critique pour l'adoption par un public large (étudiants, chercheurs non techniques).

**Independent Test**: Peut être testé en sélectionnant du texte et en cliquant sur chaque bouton de formatage, vérifiant que le texte est correctement encapsulé avec la syntaxe markdown correspondante.

**Acceptance Scenarios**:

1. **Given** du texte sélectionné dans l'éditeur, **When** je clique sur le bouton "Gras" (B), **Then** le texte est encapsulé avec `**texte**` et s'affiche en gras
2. **Given** du texte sélectionné, **When** je clique sur le bouton "Italique" (I), **Then** le texte est encapsulé avec `*texte*` et s'affiche en italique
3. **Given** le curseur placé sur une ligne, **When** je clique sur le bouton "H2", **Then** la ligne est préfixée par `## ` et s'affiche comme titre de niveau 2
4. **Given** plusieurs lignes sélectionnées, **When** je clique sur le bouton "Liste à puces", **Then** chaque ligne est préfixée par `- ` et s'affiche comme une liste
5. **Given** du texte sélectionné, **When** je clique sur le bouton "Citation", **Then** chaque ligne est préfixée par `> ` et s'affiche comme une citation
6. **Given** du texte sélectionné, **When** je clique sur le bouton "Code inline", **Then** le texte est encapsulé avec des backticks et s'affiche en police monospace

---

### User Story 3 - Sauvegarde Automatique Intelligente (Priority: P2)

En tant qu'utilisateur, je veux que mes modifications soient sauvegardées automatiquement après 500ms d'inactivité avec un indicateur visuel, afin de ne jamais perdre mon travail.

**Why this priority**: Critique pour la fiabilité. La perte de données est inacceptable. Doit s'intégrer avec le système de sauvegarde existant de Workspace Navigator.

**Independent Test**: Peut être testé en modifiant une note, attendant 500ms, fermant l'application sans sauvegarder manuellement, et vérifiant que les modifications sont préservées au redémarrage.

**Acceptance Scenarios**:

1. **Given** une note ouverte avec du contenu modifié, **When** 500ms s'écoulent sans nouvelle modification, **Then** le contenu est automatiquement sauvegardé et un indicateur "Saved at HH:MM:SS" s'affiche
2. **Given** une note en cours d'édition active, **When** je tape continuellement pendant 2 secondes, **Then** aucune sauvegarde n'est déclenchée jusqu'à 500ms après la dernière frappe
3. **Given** une note avec des modifications non sauvegardées, **When** je ferme l'application, **Then** une sauvegarde immédiate est déclenchée avant la fermeture
4. **Given** une sauvegarde en cours, **When** une erreur se produit, **Then** un indicateur d'erreur s'affiche et l'utilisateur est informé

---

### User Story 4 - Intégration avec les Onglets du Workspace (Priority: P2)

En tant qu'utilisateur, je veux que mes notes markdown s'ouvrent dans des onglets comme les pages web, et que mes onglets ouverts soient restaurés au redémarrage.

**Why this priority**: Essentielle pour l'intégration cohérente avec Workspace Navigator. Sans cela, l'éditeur serait un composant isolé et non intégré.

**Independent Test**: Peut être testé en ouvrant plusieurs notes dans des onglets, fermant l'application, relançant, et vérifiant que tous les onglets sont restaurés avec leur contenu.

**Acceptance Scenarios**:

1. **Given** une note markdown dans le workspace, **When** je double-clique dessus, **Then** elle s'ouvre dans un nouvel onglet avec le titre de la note comme titre d'onglet
2. **Given** une note markdown ouverte, **When** je modifie son titre dans le contenu (premier H1), **Then** le titre de l'onglet se met à jour automatiquement
3. **Given** plusieurs notes markdown ouvertes dans des onglets, **When** je ferme et relance l'application, **Then** tous les onglets sont restaurés dans le même ordre avec leur contenu
4. **Given** un mélange d'onglets web et markdown, **When** je navigue entre eux, **Then** chaque onglet affiche le bon contenu sans conflit

---

### User Story 5 - Insertion d'Images (Priority: P3)

En tant qu'utilisateur, je veux insérer des images facilement dans mes notes par drag & drop ou via un bouton, afin d'enrichir visuellement mes documents.

**Why this priority**: Enrichit significativement les notes mais n'est pas essentielle pour l'usage de base. Les notes textuelles restent fonctionnelles sans images.

**Independent Test**: Peut être testé en glissant une image dans l'éditeur et vérifiant que l'image est copiée dans le workspace et que le lien markdown est inséré correctement.

**Acceptance Scenarios**:

1. **Given** une note ouverte, **When** je glisse-dépose une image depuis mon explorateur de fichiers, **Then** l'image est copiée dans un dossier `assets` du workspace et le lien `![description](assets/filename.png)` est inséré à la position du curseur
2. **Given** une note ouverte, **When** je clique sur le bouton "Insérer image" et sélectionne un fichier, **Then** l'image est copiée et le lien markdown est inséré
3. **Given** une image insérée par son lien markdown, **When** la note est affichée, **Then** l'image est rendue visuellement dans la zone de prévisualisation
4. **Given** une image glissée dans l'éditeur, **When** l'image est un format non supporté, **Then** un message d'erreur informatif s'affiche

---

### User Story 6 - Numérotation des Lignes (Priority: P3)

En tant que développeur ou utilisateur technique, je veux voir les numéros de ligne à gauche de l'éditeur, afin de mieux naviguer et référencer des parties spécifiques de mes notes.

**Why this priority**: Fonctionnalité de confort pour les utilisateurs techniques, mais non essentielle pour la prise de notes de base.

**Independent Test**: Peut être testé en ouvrant une note longue et vérifiant que les numéros de ligne sont affichés, restent synchronisés avec le scroll, et correspondent aux vraies lignes du contenu.

**Acceptance Scenarios**:

1. **Given** une note avec plusieurs lignes, **When** l'éditeur est affiché, **Then** une colonne à gauche affiche les numéros de ligne commençant à 1
2. **Given** une note longue dépassant la zone visible, **When** je scrolle, **Then** les numéros de ligne scrollent de manière synchronisée avec le contenu
3. **Given** une ligne wrappée (retour à la ligne automatique), **When** elle s'affiche sur plusieurs lignes visuelles, **Then** le numéro de ligne reste unique pour cette ligne logique

---

### User Story 7 - Prévisualisation Intégrée (Priority: P3)

En tant qu'utilisateur, je veux pouvoir activer une prévisualisation synchronisée à côté de mon éditeur, afin de voir le rendu final de mon document.

**Why this priority**: Utile pour valider le rendu final, mais le rendu live dans l'éditeur couvre déjà 80% du besoin.

**Independent Test**: Peut être testé en activant la prévisualisation et vérifiant que le rendu est synchronisé avec l'édition et le scroll.

**Acceptance Scenarios**:

1. **Given** une note ouverte, **When** je clique sur le bouton "Prévisualisation", **Then** un panneau de prévisualisation s'affiche à côté de l'éditeur
2. **Given** la prévisualisation activée, **When** je modifie du texte dans l'éditeur, **Then** la prévisualisation se met à jour en temps réel
3. **Given** la prévisualisation activée sur une note longue, **When** je scrolle dans l'éditeur, **Then** la prévisualisation scrolle de manière synchronisée
4. **Given** la prévisualisation activée, **When** je clique à nouveau sur le bouton, **Then** la prévisualisation se ferme et l'éditeur reprend toute la largeur

---

### User Story 8 - Insertion de Liens (Priority: P3)

En tant qu'utilisateur, je veux insérer facilement des liens hypertexte dans mes notes, afin de référencer des ressources externes.

**Why this priority**: Fonctionnalité courante mais secondaire par rapport à l'édition de base.

**Independent Test**: Peut être testé en sélectionnant du texte et utilisant le bouton lien pour créer un lien markdown fonctionnel.

**Acceptance Scenarios**:

1. **Given** du texte sélectionné, **When** je clique sur le bouton "Lien" et saisis une URL, **Then** le texte devient `[texte](url)` et s'affiche comme un lien cliquable
2. **Given** aucune sélection, **When** je clique sur "Lien" et saisis texte + URL, **Then** le lien complet est inséré à la position du curseur
3. **Given** un lien dans la prévisualisation, **When** je clique dessus, **Then** l'URL s'ouvre dans un nouvel onglet web du workspace

---

### User Story 9 - Formules Mathématiques LaTeX (Priority: P4)

En tant qu'étudiant ou chercheur, je veux écrire des formules mathématiques en LaTeX et voir leur rendu, afin de documenter des équations dans mes notes.

**Why this priority**: Fonctionnalité avancée ciblant un public spécifique (STEM). Non bloquante pour l'usage général.

**Independent Test**: Peut être testé en insérant une formule LaTeX et vérifiant son rendu dans la prévisualisation.

**Acceptance Scenarios**:

1. **Given** une note ouverte, **When** je tape `$E = mc^2$`, **Then** la formule s'affiche en rendu mathématique inline dans la prévisualisation
2. **Given** une note ouverte, **When** je tape un bloc `$$\int_0^1 x^2 dx$$`, **Then** la formule s'affiche centrée en mode bloc
3. **Given** une formule LaTeX invalide, **When** elle est parsée, **Then** un indicateur d'erreur s'affiche dans la prévisualisation

---

### Edge Cases

- **Note vide**: Que se passe-t-il lorsqu'on ouvre une note sans contenu? L'éditeur affiche un placeholder invitant à écrire.
- **Note très longue**: Notes de plus de 10 000 lignes - le rendu doit rester fluide (< 16ms par frame).
- **Caractères spéciaux**: Le markdown contenant des caractères Unicode complexes (emoji, caractères CJK) doit être correctement géré.
- **Images manquantes**: Si une image référencée n'existe plus, un placeholder informatif s'affiche.
- **Fermeture pendant l'édition**: Une sauvegarde immédiate est déclenchée avant toute fermeture.
- **Perte de focus pendant la frappe**: La sauvegarde se déclenche si l'utilisateur quitte l'onglet.
- **Formats d'image non supportés**: Seuls PNG, JPG, GIF, WebP sont acceptés; les autres déclenchent une erreur.
- **Collisions de noms d'images**: Les images dupliquées sont renommées automatiquement avec un suffixe numérique.
- **Liens vers des fichiers locaux**: Les chemins relatifs doivent être résolus par rapport au workspace.

## Requirements *(mandatory)*

### Functional Requirements

#### Édition de Base
- **FR-001**: Le système DOIT permettre de créer une nouvelle note markdown depuis l'interface du workspace
- **FR-002**: Le système DOIT afficher un éditeur de texte avec rendu markdown en temps réel dans la zone d'édition
- **FR-003**: Le système DOIT supporter les syntaxes markdown suivantes: titres (H1-H6), gras, italique, listes (à puces et numérotées), citations, code inline, blocs de code
- **FR-004**: Le système DOIT mettre à jour le rendu visuel en moins de 50ms après chaque modification

#### Barre d'Outils
- **FR-005**: Le système DOIT afficher une barre d'outils avec des boutons pour: Gras (B), Italique (I), Souligné (U), H1-H6, Liste à puces, Liste numérotée, Citation, Code inline, Bloc de code, Lien, Image, Formule mathématique
- **FR-006**: Le système DOIT appliquer le formatage sur toute la sélection lorsque du texte est sélectionné
- **FR-007**: Le système DOIT insérer les balises markdown à la position du curseur si aucun texte n'est sélectionné
- **FR-008**: Pour les actions multi-lignes (listes, citations), le système DOIT appliquer le formatage à chaque ligne sélectionnée

#### Numérotation des Lignes
- **FR-009**: Le système DOIT afficher une colonne de numéros de ligne à gauche de l'éditeur
- **FR-010**: Les numéros de ligne DOIVENT être synchronisés avec le scrolling vertical
- **FR-011**: Les numéros de ligne DOIVENT correspondre aux lignes logiques (un numéro par ligne de code, pas par ligne visuelle wrappée)

#### Sauvegarde
- **FR-012**: Le système DOIT sauvegarder automatiquement le contenu après 500ms d'inactivité
- **FR-013**: Le système DOIT afficher un indicateur "Saved at HH:MM:SS" après chaque sauvegarde réussie
- **FR-014**: Le système DOIT déclencher une sauvegarde immédiate lors de la fermeture de l'onglet ou de l'application
- **FR-015**: Le système DOIT s'intégrer avec le système de sauvegarde existant de Workspace Navigator (AutosaveManager)

#### Images
- **FR-016**: Le système DOIT accepter le drag & drop d'images (PNG, JPG, GIF, WebP) dans l'éditeur
- **FR-017**: Le système DOIT copier les images droppées dans un dossier `assets` au sein du workspace
- **FR-018**: Le système DOIT insérer automatiquement le lien markdown `![description](chemin)` après le drop
- **FR-019**: Le système DOIT fournir un bouton ouvrant un dialog natif de sélection de fichier image
- **FR-020**: Le système DOIT gérer les collisions de noms en ajoutant un suffixe numérique

#### Liens
- **FR-021**: Le système DOIT permettre d'insérer des liens via un bouton de la barre d'outils
- **FR-022**: Le système DOIT afficher un dialog demandant l'URL (et le texte si aucune sélection)
- **FR-023**: Les liens dans la prévisualisation DOIVENT être cliquables et ouvrir dans un nouvel onglet web

#### Formules Mathématiques
- **FR-024**: Le système DOIT supporter les formules inline avec la syntaxe `$...$`
- **FR-025**: Le système DOIT supporter les formules en bloc avec la syntaxe `$$...$$`
- **FR-026**: Le système DOIT rendre les formules LaTeX dans la zone de prévisualisation
- **FR-027**: Le système DOIT afficher un indicateur d'erreur pour les formules LaTeX invalides

#### Prévisualisation
- **FR-028**: Le système DOIT proposer un mode prévisualisation activable/désactivable
- **FR-029**: La prévisualisation DOIT être synchronisée en temps réel avec l'éditeur
- **FR-030**: Le scroll de la prévisualisation DOIT être synchronisé avec le scroll de l'éditeur

#### Intégration Workspace
- **FR-031**: Les notes markdown DOIVENT être des "items" dans le workspace au même titre que les pages web
- **FR-032**: L'ouverture d'une note DOIT créer un onglet avec le titre de la note
- **FR-033**: Le titre de l'onglet DOIT se mettre à jour si le premier H1 de la note change
- **FR-034**: Les onglets markdown ouverts DOIVENT être restaurés lors du redémarrage de l'application
- **FR-035**: L'éditeur DOIT s'ouvrir en moins de 200ms

### Key Entities

- **MarkdownItem**: Représente une note markdown dans le workspace. Attributs: id, workspaceId, folderId (nullable), title, content (texte markdown), metadata (position de scroll, mode preview), timestamps (created, updated). Relations: appartient à un Workspace, peut appartenir à un Folder.

- **MarkdownAsset**: Représente un fichier image associé à une note. Attributs: id, noteId, filename, originalFilename, mimeType, size, path relatif dans le workspace. Relations: appartient à une MarkdownItem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les utilisateurs peuvent créer et éditer une note markdown complète (avec titres, listes, images) en moins de 5 minutes lors de leur première utilisation
- **SC-002**: Le rendu markdown se met à jour en moins de 50ms après chaque frappe (mesuré sur des notes jusqu'à 5000 lignes)
- **SC-003**: L'éditeur s'ouvre en moins de 200ms après le double-clic sur une note
- **SC-004**: 100% des modifications sont sauvegardées automatiquement - aucune perte de données lors des fermetures normales ou inattendues
- **SC-005**: Les images droppées sont insérées et visibles en moins de 1 seconde
- **SC-006**: L'éditeur reste fluide (60 fps) sur des notes de 10 000 lignes lors du scroll
- **SC-007**: La restauration de session recrée tous les onglets markdown en moins de 500ms au démarrage
- **SC-008**: Les formules LaTeX se rendent correctement dans 95% des cas pour les syntaxes standard

## Scope Boundaries

### In Scope
- Édition markdown avec rendu live
- Barre d'outils complète avec tous les boutons spécifiés
- Numérotation des lignes synchronisée
- Sauvegarde automatique avec indicateur
- Insertion d'images (drag & drop + dialog)
- Insertion de liens
- Formules mathématiques LaTeX
- Prévisualisation synchronisée
- Intégration complète avec les onglets du workspace
- Restauration de session
- Support multi-plateforme (Windows, macOS, Linux)

### Out of Scope
- Collaboration temps réel
- Synchronisation cloud
- Plugins externes
- Mode WYSIWYG complet (la syntaxe markdown reste visible)
- Export vers d'autres formats (PDF, Word)
- Thèmes personnalisables pour l'éditeur
- Raccourcis clavier personnalisables
- Tableaux markdown (pourra être ajouté ultérieurement)
- Diagrammes (Mermaid, PlantUML)
- Support des fichiers .md externes (seules les notes du workspace sont supportées)

## Assumptions

- Le système d'onglets existant de Workspace Navigator fonctionne correctement et peut accepter un nouveau type d'item
- L'AutosaveManager existant peut être réutilisé pour les notes markdown
- Les utilisateurs ont une résolution d'écran minimale de 1280x720
- Le workspace dispose d'au moins 100MB d'espace disponible pour les images
- Les images insérées ne dépassent pas 10MB individuellement
- Les utilisateurs comprennent les bases de la syntaxe markdown ou utilisent la barre d'outils

## Dependencies

- **Système d'onglets existant (TabManager)**: Pour l'intégration des notes comme onglets
- **AutosaveManager existant**: Pour la sauvegarde automatique avec debounce
- **SessionManager existant**: Pour la restauration des onglets au démarrage
- **WorkspaceEngine existant**: Pour la création et gestion des items
- **Système de fichiers du workspace**: Pour le stockage des images dans le dossier assets
