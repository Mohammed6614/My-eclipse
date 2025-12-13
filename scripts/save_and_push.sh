#!/usr/bin/env bash
set -euo pipefail

usage(){
  cat <<EOF
Usage: $0 [--tag] [--tag-name NAME]

Options:
  --tag            Create and push tag after push (default tag name v1.0.0)
  --tag-name NAME  Specify tag name to create/push (default v1.0.0)
  -h, --help       Show this help

This script adds modified and untracked files to git but skips any path
under node_modules and any *.log files. It commits with message
"Save latest modifications" and pushes the current branch to origin.
EOF
}

TAG=false
TAG_NAME="v1.0.0"

while [[ ${#@} -gt 0 ]]; do
  case "$1" in
    --tag) TAG=true; shift ;;
    --tag-name) TAG_NAME="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    *) break ;;
  esac
done

# Ensure we're in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: not a git repository (or any parent)" >&2
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch: $BRANCH"

# Collect modified and untracked files safely (NUL-separated)
mapfile -d '' -t files < <(git ls-files -m -o --exclude-standard -z)

if [ ${#files[@]} -eq 0 ]; then
  echo "No modified or untracked files to add. Nothing to do."
  exit 0
fi

ADDED=false
for f in "${files[@]}"; do
  # Skip node_modules and any .log files
  case "$f" in
    node_modules/*|*/node_modules/*)
      echo "Skipping (node_modules): $f"
      continue
      ;;
    *.log|*.log/*)
      echo "Skipping (log): $f"
      continue
      ;;
  esac

  echo "Adding: $f"
  git add -- "$f"
  ADDED=true
done

if [ "$ADDED" != true ]; then
  echo "No files were added (all candidates excluded)."
  exit 0
fi

# Commit if there are staged changes
if git diff --cached --quiet; then
  echo "Nothing staged to commit."
else
  git commit -m "Save latest modifications"
fi

# Push current branch to origin
echo "Pushing branch $BRANCH to origin..."
git push origin "$BRANCH"

# Optionally create and push tag
if [ "$TAG" = true ]; then
  echo "Creating and pushing tag $TAG_NAME"
  git tag -f "$TAG_NAME"
  git push origin --force --tags "$TAG_NAME" 2>/dev/null || git push origin "$TAG_NAME"
fi

echo "Done."
