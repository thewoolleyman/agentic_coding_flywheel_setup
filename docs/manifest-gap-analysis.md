# Manifest Gap Analysis

> install.sh ↔ acfs.manifest.yaml mapping
>
> Created: 2025-12-21 | Bead: mjt.2.1

## Overview

This document maps the relationship between `install.sh` phases and `acfs.manifest.yaml` modules to:
1. Identify what the installer does that isn't in the manifest
2. Identify what the manifest specifies that the installer doesn't implement
3. Guide future manifest-driven installer integration

---

## Phase-to-Module Mapping

| install.sh Phase | Function | Manifest Module(s) | Status |
|------------------|----------|-------------------|--------|
| Phase 0 | `run_preflight_checks()` | — | Installer-only |
| Phase 1 | `ensure_base_deps()` | `base.system` | ✓ Aligned |
| Phase 2 | `normalize_user()` | `users.ubuntu` | ✓ Aligned |
| Phase 3 | `setup_filesystem()` | `base.filesystem` | ✓ Aligned |
| Phase 4 | `setup_shell()` | `shell.zsh` | ✓ Aligned |
| Phase 5 | `install_cli_tools()` | `cli.modern` | Partial (see gaps) |
| Phase 6 | `install_languages()` | `lang.*`, `tools.atuin`, `tools.zoxide`, `tools.ast_grep` | ✓ Aligned |
| Phase 7 | `install_agents()` | `agents.*` | ✓ Aligned |
| Phase 8 | `install_cloud_db()` | `db.postgres18`, `tools.vault`, `cloud.*` | ✓ Aligned |
| Phase 9 | `install_stack()` | `stack.*` | ✓ Aligned |
| Phase 10 | `finalize()` | `acfs.onboard`, `acfs.doctor` | Partial |
| Smoke Test | `run_smoke_test()` | — | Installer-only |

---

## Detailed Phase Analysis

### Phase 1: Base Dependencies (`ensure_base_deps`)

**Installer installs:** `curl git ca-certificates unzip tar xz-utils jq build-essential sudo gnupg`

**Manifest specifies (base.system):**
```yaml
install:
  - sudo apt-get update -y
  - sudo apt-get install -y curl git ca-certificates unzip tar xz-utils jq build-essential
verify:
  - curl --version
  - git --version
  - jq --version
```

**Gap:** Installer adds `sudo gnupg` which manifest doesn't specify.

---

### Phase 2: User Normalization (`normalize_user`)

**Installer does:**
- Creates ubuntu user if missing
- Adds to sudo group
- Configures passwordless sudo (`/etc/sudoers.d/90-ubuntu-acfs`)
- Copies SSH keys from root
- Adds user to docker group

**Manifest specifies (users.ubuntu):**
```yaml
install:
  - "Ensure user ubuntu exists with home /home/ubuntu"
  - "Write /etc/sudoers.d/90-ubuntu-acfs: ubuntu ALL=(ALL) NOPASSWD:ALL"
  - "Copy authorized_keys from invoking user to /home/ubuntu/.ssh/"
verify:
  - id ubuntu
  - sudo -n true
```

**Gap:** Manifest uses prose descriptions, not executable commands. Installer adds docker group membership.

---

### Phase 3: Filesystem Setup (`setup_filesystem`)

**Installer creates:**
- `/data/projects`, `/data/cache`
- `$TARGET_HOME/Development`, `$TARGET_HOME/Projects`, `$TARGET_HOME/dotfiles`
- `$ACFS_HOME/{zsh,tmux,bin,docs,logs}`
- `$ACFS_LOG_DIR` (/var/log/acfs)

**Manifest specifies (base.filesystem):**
```yaml
install:
  - "Create /data/projects and /data/cache directories"
  - "Create ~/.acfs/{zsh,tmux,bin,docs,logs} directories"
verify:
  - test -d /data/projects
  - test -d ~/.acfs
```

**Gap:** Installer creates more directories (Development, Projects, dotfiles, logs). Manifest uses prose.

---

### Phase 4: Shell Setup (`setup_shell`)

**Installer does:**
- Installs zsh via apt
- Installs Oh My Zsh (verified upstream script)
- Installs Powerlevel10k theme (git clone)
- Installs zsh-autosuggestions, zsh-syntax-highlighting plugins
- Copies `acfs/zsh/acfs.zshrc` to `~/.acfs/zsh/`
- Creates `.zshrc` loader that sources the ACFS config
- Sets zsh as default shell

**Manifest specifies (shell.zsh):** ✓ Matches conceptually.

---

### Phase 5: CLI Tools (`install_cli_tools`)

**Installer installs:**

| Tool | Source | In Manifest? |
|------|--------|--------------|
| gum | Charm apt repo | ❌ No |
| ripgrep | apt | ✓ Yes |
| tmux | apt | ✓ Yes |
| fzf | apt | ✓ Yes |
| direnv | apt | ✓ Yes |
| jq | apt | ✓ Yes (in base.system) |
| gh (GitHub CLI) | apt/official repo | ❌ No |
| git-lfs | apt | ❌ No |
| lsof, dnsutils, netcat, strace, rsync | apt | ❌ No |
| lsd, eza, bat, fd-find, btop, dust, neovim | apt | ✓ Yes (cli.modern) |
| docker.io, docker-compose-plugin | apt | ❌ No |
| lazygit | apt | ✓ Yes |
| lazydocker | apt | ❌ No |

**Manifest gap:** Missing: gum, gh, git-lfs, system utils, docker, lazydocker

---

### Phase 6: Language Runtimes (`install_languages`)

**Installer installs:**

| Tool | Method | Manifest Module |
|------|--------|-----------------|
| Bun | Verified upstream script | `lang.bun` ✓ |
| Rust/Cargo | Verified upstream script | `lang.rust` ✓ |
| ast-grep (sg) | cargo install | `tools.ast_grep` ✓ |
| Go | apt (golang-go) | `lang.go` ✓ |
| uv | Verified upstream script | `lang.uv` ✓ |
| Atuin | Verified upstream script | `tools.atuin` ✓ |
| Zoxide | Verified upstream script | `tools.zoxide` ✓ |

**Gap:** None - well aligned.

---

### Phase 7: Coding Agents (`install_agents`)

**Installer installs:**

| Agent | Method | Manifest Module |
|-------|--------|-----------------|
| Claude Code | Verified upstream script (native) | `agents.claude` ✓ |
| Codex CLI | bun install -g @openai/codex@latest | `agents.codex` ✓ |
| Gemini CLI | bun install -g @google/gemini-cli@latest | `agents.gemini` ✓ |

**Gap:** None - well aligned.

---

### Phase 8: Cloud & Database (`install_cloud_db`)

**Installer installs:**

| Tool | Method | Manifest Module | Skippable |
|------|--------|-----------------|-----------|
| PostgreSQL 18 | PGDG apt repo | `db.postgres18` ✓ | --skip-postgres |
| Vault | HashiCorp apt repo | `tools.vault` ✓ | --skip-vault |
| Wrangler | bun install -g | `cloud.wrangler` ✓ | --skip-cloud |
| Supabase | bun install -g | `cloud.supabase` ✓ | --skip-cloud |
| Vercel | bun install -g | `cloud.vercel` ✓ | --skip-cloud |

**Gap:** Manifest doesn't specify skippability/tags. Installer creates postgres user/db.

---

### Phase 9: Dicklesworthstone Stack (`install_stack`)

**Installer installs:**

| Tool | Method | Manifest Module |
|------|--------|-----------------|
| NTM | Verified upstream script | `stack.ntm` ✓ |
| MCP Agent Mail | Verified upstream script | `stack.mcp_agent_mail` ✓ |
| UBS | Verified upstream script (--easy-mode) | `stack.ultimate_bug_scanner` ✓ |
| Beads Viewer (bv) | Verified upstream script | `stack.beads_viewer` ✓ |
| CASS | Verified upstream script (--easy-mode --verify) | `stack.cass` ✓ |
| CM | Verified upstream script (--easy-mode --verify) | `stack.cm` ✓ |
| CAAM | Verified upstream script | `stack.caam` ✓ |
| SLB | Verified upstream script | `stack.slb` ✓ |

**Gap:** Manifest doesn't capture install flags (--easy-mode, --verify, --yes).

---

### Phase 10: Finalize (`finalize`)

**Installer does:**

| Action | In Manifest? |
|--------|--------------|
| Install tmux.conf | ❌ No (orchestration) |
| Link ~/.tmux.conf | ❌ No |
| Install onboard lessons (8 files) | `acfs.onboard` (partial) |
| Install onboard.sh script | `acfs.onboard` ✓ |
| Install scripts/lib/*.sh | ❌ No (orchestration) |
| Install acfs-update wrapper | ❌ No |
| Install services-setup.sh | ❌ No |
| Install checksums.yaml + VERSION | ❌ No |
| Install acfs CLI (doctor.sh) | `acfs.doctor` (partial) |
| Install Claude Git Safety Guard hook | ❌ No |
| Create state.json | ❌ No (orchestration) |

**Gap:** Most finalize actions are orchestration-level, not module-level.

---

## Summary: Installer-Only Functionality

These are things the installer does that the manifest doesn't specify:

1. **Pre-flight validation** (`run_preflight_checks`)
2. **Gum installation** (enhanced UI)
3. **GitHub CLI (gh)** installation
4. **git-lfs** installation and configuration
5. **System utilities**: lsof, dnsutils, netcat, strace, rsync
6. **Docker** installation and group membership
7. **lazydocker** installation
8. **PostgreSQL user/db creation** for target user
9. **Tmux configuration** linking
10. **ACFS scripts/lib/** installation
11. **acfs-update wrapper** installation
12. **Claude Git Safety Guard** hook installation
13. **State file** creation and management
14. **Smoke test** verification

---

## Summary: Manifest-Only Modules

These manifest modules don't have full installer implementation:

| Module | Issue |
|--------|-------|
| All modules | Use prose descriptions instead of executable commands |
| `users.ubuntu` | Missing docker group membership |
| `cli.modern` | Missing gum, gh, git-lfs, system utils |
| `acfs.onboard` | Verify command uses placeholder |
| `acfs.doctor` | Verify command uses placeholder |

---

## Recommendations for Manifest vNext

### 1. Add Missing Modules

```yaml
- id: cli.gum
  description: Gum terminal UI toolkit
  install:
    - "Add Charm apt repository"
    - sudo apt-get install -y gum
  verify:
    - gum --version
  tags: [optional, ui]

- id: cli.gh
  description: GitHub CLI
  install:
    - "Add GitHub CLI apt repository or install from distro"
    - sudo apt-get install -y gh
  verify:
    - gh --version
  tags: [recommended]

- id: cli.docker
  description: Docker container runtime
  install:
    - sudo apt-get install -y docker.io docker-compose-plugin
  verify:
    - docker --version
  tags: [optional, containers]
```

### 2. Add Tags/Categories for Skippability

```yaml
modules:
  - id: db.postgres18
    tags: [optional, database, skippable]
    skip_flag: --skip-postgres
```

### 3. Add Install Flags

```yaml
- id: stack.ubs
  install_args: ["--easy-mode"]
```

### 4. Separate Orchestration from Modules

Create a new section for orchestration-only actions:
```yaml
orchestration:
  - id: finalize.tmux_config
    description: Link tmux configuration
  - id: finalize.state_file
    description: Create installation state tracking
```

---

## Next Steps

1. **mjt.1.1**: Define module taxonomy (categories/tags/defaults) using this gap analysis
2. **mjt.2.2**: Inventory wizard/docs CLI flags and map to module/tags
3. **mjt.3.1**: Implement schema vNext fields based on identified gaps
