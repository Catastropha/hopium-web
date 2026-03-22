#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-}"

case "$ENV" in
  dev)
    S3_BUCKET="s3://hopium-web-dev"
    CF_DISTRIBUTION="E_DEV_DISTRIBUTION_ID"
    VITE_API_BASE="https://dev-api.hopium.bet"
    VITE_BOT_USERNAME="HopiumDevBot"
    ;;
  live)
    S3_BUCKET="s3://hopium.bet"
    CF_DISTRIBUTION="E39NTHDF6WW9DR"
    VITE_API_BASE="https://live-api.hopium.bet"
    VITE_BOT_USERNAME="hopiumbetbot"
    ;;
  *)
    echo "Usage: ./deploy.sh [dev|live]"
    exit 1
    ;;
esac

echo "Deploying to $ENV..."

cd "$(dirname "$0")/.."

VITE_API_BASE="$VITE_API_BASE" VITE_BOT_USERNAME="$VITE_BOT_USERNAME" npx vite build

aws s3 sync dist/ "$S3_BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html "$S3_BUCKET/index.html" \
  --cache-control "public, max-age=60, s-maxage=300"

aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION" \
  --paths "/*" \
  --no-cli-pager

echo "Deployed to $ENV"
