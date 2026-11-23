# CLIPDEV API CONTRACT — v1.0

**Dernière mise à jour** : 2026-10-25  
**Version du protocole** : 1.0  
**Statut** : Production

Ce document définit le contrat formel entre une IA générative et le daemon CLIPDEV. Toute commande émise doit respecter ce schéma. Tout résultat renvoyé suit la structure définie ici.

---

## 1. Principe fondamental

CLIPDEV est un **daemon amnésique** qui fait le pont entre le presse-papier et l'environnement de travail local. Il n'a aucune mémoire entre deux tours. L'IA est responsable de :
- Maintenir le contexte conversationnel
- Émettre des commandes JSON structurées
- Interpréter les résultats et gérer les erreurs

**Sentinel** : tout payload destiné à CLIPDEV contient `"_clipdev": "1.0"` en clé de premier niveau.

---

## 2. Structure Card (commande complète)

Une **Card** représente une tâche complète. Elle contient 1 ou plusieurs **Batches**, chacun contenant 1 ou plusieurs **Ops**.

### Schéma JSON

```json
{
  "_clipdev": "1.0",
  "id": "card-unique-id",
  "intent": "Ce que cette carte accomplit et pourquoi",
  "batches": [
    {
      "id": "batch-1",
      "intent": "Ce que ce batch établit",
      "on_error": "stop",
      "ops": [
        {
          "_clipdev": "1.0",
          "op": "read",
          "id": "op-1",
          "path": "fichier.txt",
          "when": ""
        }
      ],
      "fallback": []
    }
  ]
}
```

### Champs Card

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `_clipdev` | string | ✅ | Toujours `"1.0"` (sentinel) |
| `id` | string | ✅ | Identifiant unique de la carte |
| `intent` | string | ✅ | Ce que la carte accomplit globalement |
| `batches` | array | ✅ | Liste des batches (groupes séquentiels) |

### Champs Batch

| Champ | Type | Obligatoire | Défaut | Description |
|---|---|---|---|---|
| `id` | string | ✅ | — | Identifiant du batch |
| `intent` | string | ✅ | — | Objectif fonctionnel du groupe |
| `depends_on` | array[string] | ❌ | `[]` | IDs des batches précédents qui doivent avoir réussi avant l'exécution de ce batch |
| `on_error` | string | ❌ | `"stop"` | Politique d'erreur : `"stop"` ou `"continue"` |
| `recover` | bool | ❌ | `false` | Si `true`, un fallback entièrement réussi efface l'état d'échec du batch et permet sa reprise |
| `ops` | array | ✅ | — | Liste des opérations séquentielles |
| `fallback` | array | ❌ | `[]` | Ops exécutées si une op échoue |

---

## 3. Structure Op (commande atomique)

### Schéma JSON

```json
{
  "_clipdev": "1.0",
  "op": "read",
  "id": "op-unique-id",
  "when": "",
  "dry_run": false,
  "path": "fichier.txt",
  "lines": [1, 100]
}
```

### Champs communs

| Champ | Type | Obligatoire | Défaut | Description |
|---|---|---|---|---|
| `_clipdev` | string | ✅ | — | Toujours `"1.0"` |
| `op` | string | ✅ | — | Type d'opération (voir inventaire) |
| `id` | string | ✅ | — | Identifiant unique dans la carte |
| `when` | string ou object | ❌ | `""` | Condition legacy (`""`, `"always"`, `"on_failure"`) ou condition structurée basée sur le résultat d'une op précédente |
| `dry_run` | bool | ❌ | `false` | Mode prévisualisation (pas d'effet de bord) |

---

## 4. Inventaire des opérations

### 4.1 Lecture et exploration

#### `read` — Lecture de fichier

```json
{
  "_clipdev": "1.0",
  "op": "read",
  "id": "r1",
  "path": "src/main.go",
  "lines": [10, 50]
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Chemin relatif au workdir |
| `lines` | array[int] | ❌ | Plage de lignes `[from, to]` (1-indexé) |

**Résultat** : contenu du fichier (tronqué à `max_output_bytes` si nécessaire)

---

#### `grep` — Recherche regex

```json
{
  "_clipdev": "1.0",
  "op": "grep",
  "id": "g1",
  "pattern": "func.*Handler",
  "path": "internal",
  "ext": [".go"],
  "context": 2
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `pattern` | string | ✅ | Expression régulière (syntaxe Go) |
| `path` | string | ❌ | Dossier de recherche (défaut: `"."`) |
| `ext` | array[string] | ❌ | Extensions à filtrer (ex: `[".go", ".ts"]`) |
| `context` | int | ❌ | Nombre de lignes de contexte avant/après |

**Résultat** : liste des fichiers et lignes correspondantes

---

#### `find` — Recherche de fichiers

```json
{
  "_clipdev": "1.0",
  "op": "find",
  "id": "f1",
  "path": "src",
  "name": "*.ts",
  "modified_after": "2026-08-01"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ❌ | Dossier racine (défaut: `"."`) |
| `name` | string | ❌ | Pattern glob (ex: `"*.go"`) |
| `modified_after` | string | ❌ | Fichiers modifiés après cette date (ISO 8601) |

**Résultat** : liste des fichiers avec préfixe `[F]` (fichier) ou `[D]` (dossier)

---

#### `tree` — Arborescence

```json
{
  "_clipdev": "1.0",
  "op": "tree",
  "id": "t1",
  "path": ".",
  "depth": 3,
  "ignore": ["node_modules", "dist"]
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ❌ | Dossier racine (défaut: `"."`) |
| `depth` | int | ❌ | Profondeur max (défaut: 4) |
| `ignore` | array[string] | ❌ | Dossiers/fichiers à exclure |

**Résultat** : arborescence formatée avec icônes 📁 (dossier) et 📄 (fichier)

---

### 4.2 Écriture et modification

#### `write` — Écriture de fichier

```json
{
  "_clipdev": "1.0",
  "op": "write",
  "id": "w1",
  "path": "src/newfile.go",
  "content": "package main\n\nfunc main() {}\n",
  "mode": "create",
  "dry_run": false
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Chemin relatif au workdir |
| `content` | string | ✅ | Contenu à écrire |
| `mode` | string | ❌ | `"create"` (échoue si existe), `"overwrite"` (défaut), `"append"` |
| `dry_run` | bool | ❌ | Mode prévisualisation |

**HITL** : ✅ **Toujours** (validation humaine requise)

**Interdictions** : `.toml`, `.env`, `.yaml`, `.yml` (retourne `FORBIDDEN_EXT`)

**Résultat** : confirmation d'écriture avec taille

---

#### `patch` — Application de diff

```json
{
  "_clipdev": "1.0",
  "op": "patch",
  "id": "p1",
  "path": "src/main.go",
  "diff": "--- a/src/main.go\n+++ b/src/main.go\n@@ -10,3 +10,5 @@\n func main() {\n+\t// Nouveau commentaire\n }\n",
  "dry_run": false
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Fichier cible |
| `diff` | string | ✅ | Diff au format unified (compatible `git apply`) |
| `dry_run` | bool | ❌ | Mode prévisualisation |

**HITL** : ✅ **Toujours**

Le diff est normalisé pour accepter les fins de ligne LF ou CRLF. CLIPDEV vérifie également que les en-têtes du unified diff ciblent exclusivement le fichier déclaré par `path` avant d'appeler `git apply`.

**Résultat** : confirmation d'application

---

#### `rm` — Suppression de fichier

```json
{
  "_clipdev": "1.0",
  "op": "rm",
  "id": "rm1",
  "path": "temp/old.txt",
  "dry_run": false
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Fichier à supprimer |
| `dry_run` | bool | ❌ | Mode prévisualisation |

**HITL** : ✅ **Toujours**

**Restrictions** :
- Fichiers uniquement (jamais de dossiers)
- Pas dans `.git/`
- Pas `.toml`, `.env`, `.yaml`, `.yml`

**Résultat** : confirmation de suppression

---

### 4.3 Outils externes et Analyse Binaire

#### `git` — Commandes Git

```json
{
  "_clipdev": "1.0",
  "op": "git",
  "id": "git1",
  "sub": "status",
  "args": ["--porcelain"]
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `sub` | string | ✅ | Sous-commande Git |
| `args` | array[string] | ❌ | Arguments supplémentaires |

**Sous-commandes autorisées** :
- **Lecture** (sans HITL) : `status`, `diff`, `log`, `branch`, `show`, `blame`
- **Écriture** (avec HITL) : `add`, `commit`, `stash`, `restore`, `checkout`, `init`, `rm`

**Résolution** : via `ResolveTool("git")` (PATH hérité → `CLIPDEV_GIT_PATH` → emplacements usuels Windows)

**Identité de commit** : `user.name=CLIPDEV`, `user.email=clipdev@local` (injecté automatiquement)

**Résultat** : sortie Git (stdout + stderr combinés)

---

#### `go` — Outils Go

```json
{
  "_clipdev": "1.0",
  "op": "go",
  "id": "go1",
  "sub": "build",
  "args": ["-v", "./cmd/..."],
  "pkg": "./...",
  "timeout": "30s"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `sub` | string | ✅ | Sous-commande Go |
| `args` | array[string] | ❌ | Arguments supplémentaires |
| `pkg` | string | ❌ | Package cible (défaut: `"./..."`) |
| `run` | string | ❌ | Pattern de test (pour `go test`) |
| `timeout` | string | ❌ | Timeout (défaut: `max_timeout` config) |

**Sous-commandes autorisées** : `build`, `test`, `vet`, `fmt`, `generate`, `mod tidy`

**Résultat** : sortie Go

---

#### `python` — Exécution Python

```json
{
  "_clipdev": "1.0",
  "op": "python",
  "id": "py1",
  "script": "print('Hello from Python')",
  "timeout": "10s"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `script` | string | ✅ | Code Python à exécuter |
| `timeout` | string | ❌ | Timeout (défaut: 10s, max: `max_timeout` config) |

**Résultat** : sortie Python (stdout + stderr combinés)

---

#### `archive` — Listing et extraction d'archives

```json
{
  "_clipdev": "1.0",
  "op": "archive",
  "id": "a1",
  "path": "Samples/installer.exe",
  "sub": "list",
  "offset": 26918400,
  "length": 677413198
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Archive cible (`.zip`, `.tar`, `.tar.gz`, `7z`, SFX 7z) |
| `sub` | string | ❌ | `"list"` (défaut) ou `"extract"` |
| `pattern` | string | ❌ | Filtre regex sur les noms d'entrées |
| `out_dir` | string | ❌ | Dossier d'extraction sous `.clipdev/analysis/` |
| `offset` | int64 | ❌ | Décalage d'une archive embarquée dans un conteneur |
| `length` | int64 | ❌ | Longueur de la plage à carver |
| `mode` | string | ❌ | `"overwrite"` pour écraser (défaut: ignoré) |

**HITL** : ✅ pour `sub: "extract"`

Avec `offset`/`length`, la plage est d'abord carvée dans un fichier temporaire sous `.clipdev/analysis/_carve/` puis supprimée après usage. Pour le 7z, l'extraction passe par un dossier temporaire et seules les entrées dont le chemin relatif est sûr sont déplacées vers `out_dir`, afin que 7z ne puisse jamais écrire hors confinement.

**Résultat** : liste des entrées (nom, taille, taille compressée, CRC, chiffrement) ou bilan d'extraction avec entrées écartées et motif.

---

#### `extract` — Extraction d'archives

```json
{
  "_clipdev": "1.0",
  "op": "extract",
  "id": "ext1",
  "path": "TestsBinary\archive.exe"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Chemin de l'archive ou stub SFX (résolution sous `.clipdev` si besoin) |

**Résultat** : Détails d'extraction et fichiers extraits.

---

#### `net_decompile` — Décompilation .NET / IL

```json
{
  "_clipdev": "1.0",
  "op": "net_decompile",
  "id": "nd1",
  "path": "TestsBinary\app.exe"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Fichier assembly .NET managé |

**Résultat** : Code C# décompilé via `dnSpy.Console.exe` dans `.clipdev/analysis/`.

---

#### `bin_preflight` / `bin_info` / `bin_strings` — Analyse binaire

```json
{
  "_clipdev": "1.0",
  "op": "bin_preflight",
  "id": "bp1",
  "path": "app.exe"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Fichier exécutable cible |

**Résultat** : Rapport d'entropie, sections PE/ELF, détection de packers et chaînes de caractères remarquables.

---

#### `bin_functions` / `bin_decompile` / `bin_disasm` / `bin_xrefs` / `bin_cfg` / `bin_callgraph` / `bin_symbols` — Analyse Binaire Pro (IDA Pro 9.4 Headless + Hex-Rays)

Toutes ces opérations s'exécutent de manière 100% autonome et silencieuse via `idat.exe` (IDAPython + Hex-Rays) et mettent automatiquement en cache la base d'analyse `.i64` sous `.clipdev/analysis/idb/<nom>_<hash>.i64`.

```json
{
  "_clipdev": "1.0",
  "op": "bin_decompile",
  "id": "dec1",
  "path": "app.exe",
  "target": "main",
  "args": ["sub_140001010"]
}
```

| Opération | Paramètres principaux | Description |
|---|---|---|
| `bin_functions` | `path`, `sub` (`all`/`user`/`exports`/`thunks`/`entry`), `mode` (`address`/`size`/`complexity`), `pattern`, `min_len`, `offset`, `length` | Liste, filtre et trie les fonctions (taille, nombre de basic blocks, callers/callees, prototype). |
| `bin_decompile` | `path`, `target` (ou `function` : nom, nom démanglé, `0x...`, `main`, `entry`), `args` (liste de fonctions additionnelles) | Décompile en Pseudo-C Hex-Rays avec variables locales, prototype, callers, callees, chaînes référencées et fallback désassemblage. |
| `bin_disasm` | `path`, `target` (ou `function` / `offset`), `length` (max instructions, défaut 200) | Désassemblage structuré (octets hex, mnémonique, opérandes, commentaires, cibles symboliques et chaînes). |
| `bin_xrefs` | `path`, `target` (ou `pattern`), `sub` (`all`, `to`, `from`, `string`), `length` | Références croisées entrantes/sortantes sur une fonction/adresse/import, ou vers toutes les chaînes matchant une regex (`sub: "string"`). |
| `bin_cfg` | `path`, `target` (ou `function`), `mode` (`full` ou `summary`) | Control Flow Graph : Basic Blocks, arêtes orientées, complexité cyclomatique McCabe, têtes de boucles et graphe Mermaid `flowchart TD`. |
| `bin_callgraph` | `path`, `target` (défaut `main`/`entry`), `sub` (`both`/`callees`/`callers`), `depth` (défaut 2, max 6), `mode` (`ida` ou `bn`) | Graphe d'appels multi-niveaux (amont et aval) avec diagramme Mermaid `flowchart LR`. |
| `bin_symbols` | `path`, `sub` (`all`/`imports`/`exports`/`strings`/`names`/`segments`), `pattern`, `length`, `mode` (`ida` ou `bn`) | Table complète des segments, imports IAT, exports/points d'entrée, symboles démanglés et chaînes IDA/BN. |
| `bin_il` | `path`, `target` (défaut `entry`/`main`), `sub` (`hlil`, `mlil`, `llil`, `lifted`, `hlil_ssa`, `mlil_ssa`, `llil_ssa`), `offset`, `length` | Rendu **Intermediate Language (LLIL / MLIL / HLIL + forme SSA)** via le serveur MCP de Binary Ninja (auto-démarré en tâche de fond cachée). |
| `bn_mcp` | `sub` (nom de l'outil `bn_*` ou `"tools"`), `path` (optionnel, ouvre/analyse le binaire automatiquement), `target`, `pattern`, `content` (JSON args) | Pont direct vers les **68 outils MCP natifs de Binary Ninja** (`bn_binary_view_triage`, `bn_function_decompile`, `bn_function_il`, `bn_function_stack_layout`, `bn_function_complexity`, `bn_memory_read`, `bn_symbol_rename`, `bn_comment_set`, `bn_type_define`, etc.). |
| `bin_pe` | `path`, `sub` (`all`, `headers`, `exports`, `imports`, `datadir`, `clr`, `rva2off`, `off2rva`, `rebuild_dump`), `target` (RVA/VA/offset), `pattern`, `out_dir` | Inspection PE approfondie (table d'exports, fonctions importées par DLL, 16 Data Directories, PDB path, en-tête CLR/BSJB), convertisseur `RVA <-> FileOffset`, et reconstructeur de dump mémoire PE (`VA -> RawPtr`). |
| `bin_bundle` | `path`, `sub` (`list`, `detect`, `extract`), `mode` (`carve`), `pattern`, `out_dir` | Détecte, liste et extrait automatiquement les bundles **.NET Single-File AppHost** (v1–v6 avec décompression Deflate), les archives **PyInstaller** et les flux embarqués (**PNG**, métadonnées `BSJB`). |
| `bin_scan` | `path` (fichier ou dossier), `sub` (`keywords` ou `aob`), `pattern` (mots-clés séparés par `|` ou signature hex `48 8B ?? ??`), `args`, `ext`, `depth`, `length` | Scan multi-encodage simultané (**ASCII + UTF-16LE**) ou **Array of Bytes (AOB avec wildcards `??`)** sur un binaire ou tout un répertoire, avec résolution automatique RVA/VA/Section PE et contexte. |
| `dotnet_inspect` | `path`, `sub` (`all`, `types`, `methods`, `il`, `pinvoke`, `resources`, `extract_resources`, `strings`), `pattern`, `target`, `out_dir` | Inspecteur natif **ECMA-335 (.NET `BSJB`)** : liste des types, méthodes (avec RVA, offset et hex du corps IL), imports natifs P/Invoke `[DllImport]`, chaînes `#US`, et extraction des `ManifestResource` (`.resources`/`.g.resources`). |
| `bin_diff` | `path`, `against` | Comparaison binaire octet par octet entre deux fichiers avec liste des plages modifiées (`offset`, `before`, `after`). |
| `bin_patch` | `path`, `patches` (`[{offset, mode: "bytes"\|"nop"\|"invert", hex, len}]`), `dry_run` | Patching binaire (`bytes`, `nop`, ou inversion de saut conditionnel `invert`) avec sauvegarde snapshot automatique restaurable via `undo` (**HITL** hors `dry_run`). |
| `crack_scan` | `path` | Triage heuristique statique des chaînes de vérification, imports de comparaison/crypto et sauts conditionnels candidats. |

> **Note Multi-Engine** : Les 7 opérations unifiées (`bin_functions`, `bin_decompile`, `bin_disasm`, `bin_xrefs`, `bin_cfg`, `bin_callgraph`, `bin_symbols`) utilisent **IDA Pro 9.4 Headless (`idat.exe`)** par défaut, mais peuvent basculer sur le **serveur MCP de Binary Ninja** en passant `"mode": "bn"`. Binary Ninja est configuré automatiquement (`ui.mcp.enabled = true` + plugin d'auto-start `MCP\Start Server` en mode fenêtre cachée `CLIPDEV_BN_HIDDEN=1`).

---

### 4.4 Intelligence et Code

#### `ast` - Scanner de code Go

Parse un fichier ou un dossier Go pour extraire l'Arbre Syntaxique Abstrait (AST), les signatures, structures et méthodes. Idéal pour cartographier le code sans lire les fichiers entiers.

```json
{
  "_clipdev": "1.0",
  "op": "ast",
  "id": "ast1",
  "path": "internal/ops"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ❌ | Fichier ou dossier cible (défaut: `.`) |

**Résultat** : Structure JSON détaillant les types, fonctions, docstrings et variables exportées.

---

#### `replace` - Remplacement exact (HITL)

Remplace précisément une ou plusieurs chaînes exactes dans un fichier, une alternative plus légère et robuste à `patch` pour des modifications ciblées.

```json
{
  "_clipdev": "1.0",
  "op": "replace",
  "id": "rep1",
  "path": "main.go",
  "target": "func main() {",
  "replacement": "func main() {\n\t// Entry point"
}
```

| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | string | ✅ | Fichier cible |
| `target` | string | ✅* | Chaîne exacte à chercher |
| `replacement` | string | ✅* | Chaîne de remplacement |
| `chunks` | array | ❌ | Liste d'objets `{"target": "...", "replacement": "..."}` pour modifications multiples. Remplace `target`/`replacement` à la racine. |
| `allow_multiple`| bool | ❌ | Par défaut, la cible doit être unique. Mettre à `true` pour remplacer toutes les occurrences. |

---

### 4.5 Historique et Pipelines

#### `undo` - Annulation (HITL)

Restaure un fichier à son état précédent via le snapshot généré automatiquement par la dernière opération l'ayant modifié (`write`, `patch`, `replace`, `rm`).

```json
{
  "_clipdev": "1.0",
  "op": "undo",
  "id": "u1",
  "path": "main.go"
}
```

#### `pipeline-register`, `pipeline-list`, `pipeline-delete`

Permet de manipuler le catalogue local (`pipelines.json`) des macros/pipelines préconfigurées.

```json
{
  "_clipdev": "1.0",
  "op": "pipeline-register",
  "id": "p1",
  "name": "my-macro",
  "label": "Titre",
  "batches": [ ... ] 
}
```

- **`pipeline-list`** : retourne la liste des pipelines.
- **`pipeline-delete`** : nécessite un paramètre `"name"` pour supprimer le pipeline ciblé.

---

## 5. Structure Response (résultat)

### Schéma JSON

```json
{
  "_clipdev": "1.0",
  "type": "card",
  "id": "card-unique-id",
  "intent": "Ce que cette carte accomplit",
  "batches": [
    {
      "id": "batch-1",
      "intent": "Ce que ce batch établit",
      "ops": [
        {
          "_clipdev": "1.0",
          "id": "op-1",
          "ok": true,
          "op": "read",
          "result": "contenu du fichier...",
          "duration_ms": 12
        }
      ],
      "fallback": []
    }
  ]
}
```

### Champs Response

| Champ | Type | Description |
|---|---|---|
| `_clipdev` | string | Toujours `"1.0"` |
| `id` | string | Identifiant de l'op (écho de la commande) |
| `ok` | bool | Succès (`true`) ou échec (`false`) |
| `op` | string | Type d'opération (écho) |
| `result` | json.RawMessage | Résultat de l'op (string, objet, array) |
| `truncated` | bool | `true` si le résultat a été tronqué à `max_output_bytes` |
| `duration_ms` | int64 | Temps d'exécution en millisecondes |
| `error` | string | Message d'erreur (si `ok=false`) |
| `code` | string | Code d'erreur machine (si `ok=false`) |
| `dry_run` | bool | `true` si exécuté en mode prévisualisation |

### Statuts possibles

| Statut | Condition | Description |
|---|---|---|
| **Succès** | `ok=true` | L'op s'est exécutée avec succès |
| **Erreur** | `ok=false` et `code≠"IGNORED"` | L'op a échoué, message d'erreur fourni |
| **Ignoré** | `ok=false` et `code="IGNORED"` | L'op ne s'est pas exécutée (arrêt sur erreur précédente) |

### Codes d'erreur courants

| Code | Signification |
|---|---|
| `IO_ERROR` | Erreur de lecture/écriture fichier |
| `PATH_ESCAPE` | Le chemin sort du workdir (sandbox) |
| `MISSING_PARAM` | Paramètre obligatoire manquant |
| `FORBIDDEN_SUBCMD` | Sous-commande non autorisée (git/go) |
| `FORBIDDEN_EXT` | Extension protégée (.toml, .env, etc.) |
| `FORBIDDEN_TARGET` | Cible interdite (.git, workdir root, etc.) |
| `INVALID_PATTERN` | Regex invalide (grep) |
| `TOOL_NOT_FOUND` | Outil externe introuvable (git, python) |
| `TIMEOUT` | Commande trop longue |
| `PATCH_ERROR` | Échec de `git apply` |
| `UNKNOWN_OP` | Op non reconnue |

---

## 6. Sémantiques d'erreur

### 6.1 `batch.on_error`

Contrôle le comportement du batch quand une op échoue.

| Valeur | Comportement |
|---|---|
| `"stop"` (défaut) | Les ops suivantes passent en statut **Ignoré** (ne s'exécutent pas) |
| `"continue"` | Les ops suivantes s'exécutent quand même (malgré l'erreur) |

### 6.2 `op.when`

Contrôle si l'op s'exécute selon les conditions.

### 6.3 `batch.fallback`

Ops exécutées immédiatement après une erreur dans le batch.

### 6.4 `batch.depends_on`

Dépendances séquentielles entre batches.

---

## 7. Validation humaine (HITL) & Sécurité

Validation systématique pour les opérations d'écriture et de modification sensible.

---

**Fin du contrat.**
