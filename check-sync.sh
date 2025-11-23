#!/bin/bash
# Quick script to check if git and Vercel are in sync

echo "🔍 Checking Git and Vercel sync status..."
echo ""

# Check git status
echo "📦 Git Status:"
git status -sb
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  WARNING: You have uncommitted changes!"
  echo "   Run: git add . && git commit -m 'Your message' && git push"
else
  echo "✅ No uncommitted changes"
fi
echo ""

# Check if local is ahead/behind remote
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "none")
BASE=$(git merge-base @ @{u} 2>/dev/null || echo "none")

if [ "$REMOTE" = "none" ]; then
  echo "⚠️  No remote tracking branch set"
elif [ "$LOCAL" = "$REMOTE" ]; then
  echo "✅ Local and remote are in sync"
elif [ "$LOCAL" = "$BASE" ]; then
  echo "⬇️  Local is behind remote - run: git pull"
elif [ "$REMOTE" = "$BASE" ]; then
  echo "⬆️  Local is ahead of remote - run: git push"
else
  echo "⚠️  Local and remote have diverged - run: git pull && git push"
fi
echo ""

# Check Vercel project
if [ -f ".vercel/project.json" ]; then
  echo "✅ Vercel project configured"
  PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName": "[^"]*"' | cut -d'"' -f4)
  echo "   Project: $PROJECT_NAME"
else
  echo "⚠️  No Vercel project found - run: vercel link"
fi
echo ""

echo "💡 To verify Vercel deployments:"
echo "   Visit: https://vercel.com/dashboard"
echo "   Check Settings → Git to ensure connected to: $(git remote get-url origin | sed 's/.*github.com\///' | sed 's/\.git$//')"

