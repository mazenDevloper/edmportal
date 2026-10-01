#!/usr/bin/env bash
# Updates the running portal from Gitea: pulls the latest main and rebuilds the container.
# Run on the server inside the deployment folder, e.g. /opt/dhofar-portal:
#   ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="${DEPLOY_BRANCH:-main}"
echo "→ Fetching $BRANCH from $(git remote get-url origin)"
git fetch --prune origin
git checkout -q "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ Building and restarting the portal"
docker compose up -d --build --remove-orphans

echo "→ Removing old images"
docker image prune -f >/dev/null

echo "✓ Deployed $(git log -1 --format='%h %s')"
