# CLIPDEV — Guide de démarrage pour une IA générative

**Objectif** : ce document te permet de démarrer immédiatement une session d'ingénierie logicielle ou de rétro-ingénierie binaire avec CLIPDEV.

## 1. Opérations d'analyse binaire et de rétro-ingénierie

| Op | Usage | Exemple |
|---|---|---|
| `bin_preflight` | Triage complet IA (métadonnées, DIE, Binwalk, packers, chaînes classées, opérations recommandées) | `{"_clipdev":"1.0","op":"bin_preflight","id":"pf1","path":"app.exe"}` |
| `bin_pe` | Inspection PE approfondie (`all`, `headers`, `exports`, `imports`, `datadir`, `clr`), convertisseur `rva2off`/`off2rva` et reconstruction de dump mémoire (`rebuild_dump`) | `{"_clipdev":"1.0","op":"bin_pe","id":"pe1","path":"app.exe","sub":"all"}` |
| `bin_bundle` | Détection, listing et extraction de bundles **.NET Single-File AppHost** (v1–v6 + Deflate), **PyInstaller** et flux embarqués (**PNG**, `BSJB`) | `{"_clipdev":"1.0","op":"bin_bundle","id":"bb1","path":"app.exe","sub":"extract","mode":"carve"}` |
| `bin_scan` | Scan multi-encodage simultané (**ASCII + UTF-16LE**) ou **Array of Bytes (`aob` avec jokers `??`)** sur un binaire ou tout un dossier, avec RVA/Section PE | `{"_clipdev":"1.0","op":"bin_scan","id":"sc1","path":".","sub":"keywords","pattern":"SerialNumber\|License\|Dongle"}` |
| `dotnet_inspect` | Inspecteur natif **ECMA-335 (.NET `BSJB`)** : types, méthodes + corps IL hex, P/Invoke `[DllImport]`, chaînes `#US` et extraction `.resources`/`.g.resources` | `{"_clipdev":"1.0","op":"dotnet_inspect","id":"dn1","path":"app.dll","sub":"all"}` |
| `net_decompile` | Décompiler un assembly `.NET` en C# via `dnSpy.Console.exe` ou `ilspycmd.exe` (`mode:"ilspy"`, `target` optionnel) | `{"_clipdev":"1.0","op":"net_decompile","id":"nd1","path":"app.dll","target":"MyNamespace.MyClass"}` |
| `bin_functions` | Lister, filtrer et classer les fonctions par taille ou complexité via **IDA Pro 9.4 Headless** (`.i64` caché) ou **Binary Ninja MCP** (`mode:"bn"`) | `{"_clipdev":"1.0","op":"bin_functions","id":"fn1","path":"app.exe","sub":"user","mode":"complexity"}` |
| `bin_decompile` | Décompiler une ou plusieurs fonctions en **Pseudo-C Hex-Rays** (IDA Pro 9.4) ou Pseudo-C Binary Ninja (`mode:"bn"`) | `{"_clipdev":"1.0","op":"bin_decompile","id":"dec1","path":"app.exe","target":"main","args":["0x140001000"]}` |
| `bin_disasm` | Désassemblage structuré d'une fonction ou adresse (octets, mnémoniques, opérandes, commentaires, cibles) | `{"_clipdev":"1.0","op":"bin_disasm","id":"dis1","path":"app.exe","target":"main","length":200}` |
| `bin_xrefs` | Références croisées (`to`, `from`, `all`) ou recherche d'xrefs vers des chaînes (`sub:"string"`) | `{"_clipdev":"1.0","op":"bin_xrefs","id":"xr1","path":"app.exe","sub":"string","target":"(?i)(license\|serial\|key)"}` |
| `bin_cfg` | Control Flow Graph (Basic Blocks, arêtes, complexité cyclomatique, boucles et diagramme Mermaid) | `{"_clipdev":"1.0","op":"bin_cfg","id":"cfg1","path":"app.exe","target":"main"}` |
| `bin_callgraph` | Graphe d'appels multi-niveaux (`both`, `callees`, `callers`, `depth` 1..6 + diagramme Mermaid) | `{"_clipdev":"1.0","op":"bin_callgraph","id":"cg1","path":"app.exe","target":"main","depth":2}` |
| `bin_symbols` | Table des segments, imports IAT, exports, points d'entrée, noms démanglés et chaînes IDA/BN | `{"_clipdev":"1.0","op":"bin_symbols","id":"sym1","path":"app.exe","sub":"all"}` |
| `bin_il` | Représentations intermédiaires **Binary Ninja MCP** (`hlil`, `mlil`, `llil`, `lifted`, `hlil_ssa`, `mlil_ssa`, `llil_ssa`) | `{"_clipdev":"1.0","op":"bin_il","id":"il1","path":"app.exe","target":"entry","sub":"hlil_ssa"}` |
| `bn_mcp` | Accès direct aux **68 outils MCP natifs de Binary Ninja** (`bn_binary_view_triage`, `bn_function_stack_layout`, `bn_symbol_rename`, etc.) | `{"_clipdev":"1.0","op":"bn_mcp","id":"mcp1","path":"app.exe","sub":"bn_binary_view_triage"}` |
| `bin_diff` | Comparaison octet par octet entre deux binaires | `{"_clipdev":"1.0","op":"bin_diff","id":"df1","path":"patched.exe","against":"orig.exe"}` |
| `bin_patch` | Patching binaire (`bytes`, `nop`, `invert`) avec sauvegarde snapshot automatique (`undo`) | `{"_clipdev":"1.0","op":"bin_patch","id":"pt1","path":"app.exe","patches":[{"offset":"0x1024","mode":"invert"}],"dry_run":true}` |
| `crack_scan` | Détection heuristique de chaînes de vérification, imports crypto/comparaison et sauts conditionnels | `{"_clipdev":"1.0","op":"crack_scan","id":"cs1","path":"app.exe"}` |
| `bin_strings` / `bin_hex` / `bin_extract` / `extract` | Extraction de chaînes, hexdump, extraction d'overlay brut ou d'archive SFX 7-Zip | `{"_clipdev":"1.0","op":"bin_strings","id":"st1","path":"app.exe","min_len":6}` |

## 2. Pipelines préconfigurés (`pipeline-list`)

- `bin-full-triage` : Preflight + `bin_pe` (`all`) + `bin_bundle` (`list`) en parallèle.
- `ida-deep-audit` : Cartographie des fonctions et symboles via IDA Pro 9.4 + décompilation Hex-Rays + CallGraph + Xrefs de chaînes.
- `bn-ssa-audit` : Triage Binary Ninja MCP + extraction `hlil_ssa` et `mlil_ssa`.
- `dotnet-bundle-audit` : Extraction de bundle `.NET Single-File` + inspection ECMA-335 `dotnet_inspect` + extraction des ressources + `net_decompile`.
- `dir-multi-scan` : Scan multi-binaires ASCII + UTF-16LE sur tout un dossier.
- `pe-dump-rebuild` : Reconstruction d'un dump mémoire PE (`rebuild_dump`) suivie de sa vérification `bin_pe` + `dotnet_inspect`.

Consultez [`CLIPDEV_API_CONTRACT.md`](file:///C:/Users/patatoid/Documents/Developpement/RepoGo-V2-master/CLIPDEV_API_CONTRACT.md) et l'opération `{"_clipdev":"1.0","op":"capabilities","id":"cap1"}` pour les détails complets du protocole.
