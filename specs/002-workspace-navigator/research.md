# Research: Éditeur Markdown Avancé

**Feature**: 001-markdown
**Date**: 2025-12-09
**Status**: Complete

## Executive Summary

Cette recherche documente les décisions techniques pour l'implémentation de l'Éditeur Markdown Avancé dans Workspace Navigator. L'analyse s'appuie sur l'infrastructure existante (Milkdown, AutosaveManager, TabManager) et définit les choix d'architecture pour chaque composant majeur.

---

## 1. Moteur d'Édition Markdown

### Decision: Utiliser Milkdown (déjà installé)

**Rationale**:
- Milkdown 7.17 est déjà en dépendance du projet
- Architecture basée sur ProseMirror (robuste, extensible)
- Support natif React via `@milkdown/react`
- Plugins disponibles pour GFM et Math
- WYSIWYG avec syntaxe markdown visible (correspond au besoin)

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Milkdown | Déjà installé, plugin ecosystem, React support | Courbe d'apprentissage ProseMirror | CHOISI |
| CodeMirror 6 | Excellent pour code, performant | Pas WYSIWYG natif, plus complexe | Rejeté |
| Monaco Editor | Puissant, VSCode-like | Trop orienté code, bundle lourd | Rejeté |
| TipTap | Similaire à Milkdown, populaire | Nécessite nouvelle dépendance | Rejeté |
| Textarea simple | Léger, simple | Pas de rendu live, UX basique | Rejeté |

**Implementation Notes**:
```typescript
// Utiliser @milkdown/react pour l'intégration
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
```

---

## 2. Support LaTeX / Formules Mathématiques

### Decision: KaTeX via @milkdown/plugin-math

**Rationale**:
- KaTeX est ~10x plus rapide que MathJax
- `@milkdown/plugin-math` existe et s'intègre nativement
- Rendu côté client sans dépendance serveur
- Support offline complet

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| KaTeX | Rapide, léger (~100KB) | Moins de LaTeX supporté que MathJax | CHOISI |
| MathJax 3 | Support LaTeX complet | Plus lent, bundle plus gros | Rejeté |
| Custom regex | Ultra léger | Maintenance complexe, bugs potentiels | Rejeté |

**Dependencies to Add**:
```bash
npm install katex @milkdown/plugin-math
npm install -D @types/katex
```

**Implementation Notes**:
- Syntaxe inline: `$E = mc^2$`
- Syntaxe block: `$$\int_0^1 x^2 dx$$`
- Erreurs de parsing affichées en rouge dans le preview

---

## 3. Gestion des Images / Assets

### Decision: Copie locale dans `workspace/assets/images/`

**Rationale**:
- Fonctionnement 100% offline
- Pas de dépendance à des URLs externes
- Chemins relatifs portables
- Contrôle total sur les fichiers

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Copie locale | Offline, portable, contrôle | Duplication si image réutilisée | CHOISI |
| Liens externes | Pas de duplication | Requiert internet, liens morts possibles | Rejeté |
| Base64 inline | Ultra portable | Fichier markdown énorme, pas de cache | Rejeté |
| SQLite BLOB | Centralisé | Complexité, performance sur grosses images | Rejeté |

**Implementation Notes**:
```typescript
// Structure des chemins
const assetPath = `assets/images/${Date.now()}-${sanitizedFilename}`;
// Markdown généré
`![${altText}](${assetPath})`
```

**Collision Handling**:
- Si fichier existe: ajouter suffixe `-1`, `-2`, etc.
- Hash MD5 optionnel pour déduplication future

---

## 4. Synchronisation Scroll Editor/Preview

### Decision: Mapping basé sur les positions de ligne

**Rationale**:
- Approche utilisée par MarkText/Typora
- Performance acceptable pour notes < 10k lignes
- Implémentation relativement simple

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Line mapping | Simple, efficace | Précision limitée sur longs paragraphes | CHOISI |
| Source maps | Précis au caractère | Complexe à implémenter | Rejeté |
| Scroll ratio | Ultra simple | Désynchronisé si contenu asymétrique | Rejeté |

**Implementation Notes**:
```typescript
// Approche: mapper les lignes source aux positions DOM
interface LineMapping {
  sourceLine: number;
  previewElement: HTMLElement;
  offsetTop: number;
}

function syncScroll(sourceScrollTop: number, mappings: LineMapping[]) {
  // Trouver la ligne visible la plus haute
  // Scroller le preview à l'élément correspondant
}
```

---

## 5. Numérotation des Lignes

### Decision: Composant React séparé avec virtualisation conditionnelle

**Rationale**:
- Séparation des responsabilités (testable)
- Virtualisation possible si > 5000 lignes
- Synchronisation via ref partagé

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Composant séparé | Modulaire, testable | Nécessite sync scroll | CHOISI |
| CSS counter | Native CSS, simple | Pas de contrôle fin, difficile avec wrap | Rejeté |
| Plugin Milkdown | Intégré | Pas de plugin existant, complexe | Rejeté |

**Implementation Notes**:
```typescript
interface LineNumbersProps {
  lineCount: number;
  scrollTop: number;
  lineHeight: number;
  visibleRange: { start: number; end: number };
}
```

---

## 6. Architecture des Transformations Markdown

### Decision: Fonctions pures dans un module utilitaire

**Rationale**:
- Facilement testables (100% pure functions)
- Réutilisables dans d'autres contextes
- Pas de couplage avec l'UI

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Fonctions pures | Testables, découplées | Nécessite orchestration séparée | CHOISI |
| Classes avec state | Encapsulation | Plus complexe, moins testable | Rejeté |
| Milkdown commands | Intégré au système | Couplage fort, moins flexible | Rejeté |

**Implementation Notes**:
```typescript
// Pure function signature
function applyBold(
  content: string,
  selection: { start: number; end: number }
): { content: string; newSelection: { start: number; end: number } } {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  return {
    content: `${before}**${selected}**${after}`,
    newSelection: {
      start: selection.start + 2,
      end: selection.end + 2
    }
  };
}
```

---

## 7. Gestion de l'État de l'Éditeur

### Decision: Hook React custom `useMarkdownEditor`

**Rationale**:
- Pattern React moderne
- Encapsulation de la logique
- Réutilisable si besoin d'autres éditeurs

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Custom hook | Moderne, encapsulé | Nécessite expertise hooks | CHOISI |
| Redux/Zustand | Centralisé, debug tools | Overkill pour ce use case | Rejeté |
| Context seul | Simple | Pas de logique métier encapsulée | Rejeté |
| Class component | Lifecycle clair | Pattern obsolète, moins composable | Rejeté |

**Implementation Notes**:
```typescript
function useMarkdownEditor(item: NoteItem) {
  const [content, setContent] = useState(item.content);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // Auto-sync with item changes
  useEffect(() => {
    setContent(item.content);
  }, [item.id]);

  // Autosave logic
  useEffect(() => {
    if (content !== item.content) {
      window.electronAPI.autosave.schedule(item.id, content);
    }
  }, [content]);

  return { content, setContent, lastSaved, editorRef };
}
```

---

## 8. Dialogs (Lien, Image)

### Decision: Composants React modaux avec portals

**Rationale**:
- Pattern standard React
- Accessibilité (focus trap, escape key)
- Réutilisables ailleurs dans l'app

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| React portals | Standard, accessible | Nécessite implémentation | CHOISI |
| Native dialogs (Electron) | OS-native look | Moins flexible, async complexe | Rejeté pour liens |
| Inline form | Pas de modal | UX confuse, prend de l'espace | Rejeté |

**Implementation Notes**:
- Dialog natif Electron pour sélection de fichier image (via IPC)
- Modal React pour saisie de lien (URL + texte)
- Focus trap et Escape pour fermer

---

## 9. Performance sur Notes Longues

### Decision: Lazy rendering + virtualisation conditionnelle

**Rationale**:
- Milkdown gère déjà bien les documents moyens
- Virtualisation activée seulement si > 5000 lignes
- Pas de sur-engineering pour cas rares

**Alternatives Considered**:

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| Virtualisation conditionnelle | Balance perf/complexité | Seuil à calibrer | CHOISI |
| Toujours virtualisé | Performance garantie | Complexité inutile pour petites notes | Rejeté |
| Aucune optimisation | Simple | Risque de lag sur grosses notes | Rejeté |

**Implementation Notes**:
```typescript
const VIRTUALIZATION_THRESHOLD = 5000; // lignes

function shouldVirtualize(lineCount: number): boolean {
  return lineCount > VIRTUALIZATION_THRESHOLD;
}
```

---

## 10. Tests Strategy

### Decision: Tests unitaires + integration + e2e

**Rationale**:
- Conforme à la Constitution (>70% coverage)
- Transformers = unit tests (pure functions)
- Editor integration = Vitest + Testing Library
- Workflow complet = Playwright

**Test Distribution**:

| Type | Scope | Tools | Coverage Target |
|------|-------|-------|-----------------|
| Unit | Transformers, utils | Vitest | 90% |
| Unit | Hooks | Vitest + RTL | 70% |
| Integration | Components | Vitest + RTL | 70% |
| E2E | Full workflow | Playwright | Critical paths |

---

## Summary of Dependencies

### To Install

```bash
npm install katex @milkdown/plugin-math
npm install -D @types/katex
```

### Already Available

- `@milkdown/core`: ^7.17.2
- `@milkdown/react`: ^7.17.2
- `@milkdown/preset-commonmark`: ^7.17.2
- `@milkdown/preset-gfm`: ^7.17.2
- `@milkdown/plugin-listener`: ^7.17.2
- `vitest`: ^1.6.1
- `@playwright/test`: ^1.56.1

---

## Open Questions (Resolved)

1. **Q: Faut-il un nouveau type d'item ou réutiliser 'note'?**
   - **A**: Réutiliser le type `'note'` existant. Pas de changement de schéma.

2. **Q: Comment gérer le titre de l'onglet?**
   - **A**: Extraire le premier H1 du contenu markdown. Si absent, utiliser `item.title`.

3. **Q: Fallback si Milkdown échoue?**
   - **A**: Afficher un textarea simple avec le contenu brut. Log l'erreur.

4. **Q: Limiter la taille des images?**
   - **A**: Max 10MB par image. Afficher erreur si dépassé.

---

## References

- [Milkdown Documentation](https://milkdown.dev/)
- [KaTeX Supported Functions](https://katex.org/docs/supported.html)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Existing MarkdownEditor.tsx](../../src/renderer/components/MarkdownEditor.tsx)
- [AutosaveManager](../../src/core/workspace/autosave-manager.ts)
