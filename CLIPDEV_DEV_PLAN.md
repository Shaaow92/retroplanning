# CLIPDEV — Plan de développement

**État** : Phase 1 close (carte multi-batch, UI 3 colonnes, HITL, contrat de session). Intégration des opérations d'analyse binaire et de décompilation .NET effective.

**Mise à jour** : 2026-10-25.

## 1. État actuel

### Acquis fonctionnels
- ✅ Watcher clipboard natif
- ✅ Parser multi-JSON avec compatibilité descendante
- ✅ Hiérarchie Card → Batch → Op avec intents fonctionnels
- ✅ Résolution robuste des chemins sous `.clipdev` pour toutes les ops de fichiers et binaires
- ✅ Opérations d'analyse binaire et d'ingénierie intégrées (`extract`, `net_decompile`, `bin_preflight`, `bin_info`, `bin_strings`)
- ✅ Intégration de dnSpy.Console et 7-Zip pour l'analyse d'exécutables managés et natifs

## 2. Roadmap et Prochaines étapes

- Poursuite de l'optimisation des flux d'analyse et de l'indexation sémantique.
