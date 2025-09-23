#!/usr/bin/env bash
set -euo pipefail

# Bumps the @version in lvciids-market-watcher.user.js
# Usage:
#   scripts/bump_version.sh           # bump patch (x.y.Z)
#   scripts/bump_version.sh patch     # bump patch (default)
#   scripts/bump_version.sh minor     # bump minor (x.Y.0)
#   scripts/bump_version.sh major     # bump major (X.0.0)
#   scripts/bump_version.sh set 1.2.3 # set explicit version

FILE="lvciids-market-watcher.user.js"
MODE="${1:-patch}"
TARGET="${2:-}"

if [[ ! -f "$FILE" ]]; then
  echo "Error: $FILE not found" >&2
  exit 1
fi

current=$(grep -E "^// @version\s+" "$FILE" | head -n1 | awk '{print $3}')
if [[ -z "$current" ]]; then
  echo "Error: could not find @version in $FILE" >&2
  exit 1
fi

IFS='.' read -r MAJ MIN PAT <<< "$current"
MAJ=${MAJ:-0}; MIN=${MIN:-0}; PAT=${PAT:-0}

case "$MODE" in
  patch) PAT=$((PAT+1));;
  minor) MIN=$((MIN+1)); PAT=0;;
  major) MAJ=$((MAJ+1)); MIN=0; PAT=0;;
  set) if [[ -z "$TARGET" ]]; then echo "Usage: $0 set X.Y.Z" >&2; exit 2; fi; IFS='.' read -r MAJ MIN PAT <<< "$TARGET";;
  *) echo "Unknown mode: $MODE" >&2; exit 2;;
esac

newver="${MAJ}.${MIN}.${PAT}"

# macOS/BSD sed needs an empty string after -i; GNU sed also accepts it
sed -i '' -E "s|^(// @version\s+).*|\\1${newver}|" "$FILE" 2>/dev/null || \
sed -i -E "s|^(// @version\s+).*|\\1${newver}|" "$FILE"

echo "Bumped version: ${current} -> ${newver}"

# If running inside a git repo and the file is tracked, stage it
if command -v git >/dev/null 2>&1; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add "$FILE" 2>/dev/null || true
  fi
fi
