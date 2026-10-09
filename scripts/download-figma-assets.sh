#!/usr/bin/env bash
# Downloads the images imported by src/components from the Figma MCP asset
# server. These URLs expire 7 days after export (exported 2026-10-09);
# after that, re-export them from Figma nodes 264:176 and 160:625.
set -euo pipefail
cd "$(dirname "$0")/.."

HERO="https://www.figma.com/api/mcp/asset/cfd121ac-4d2f-4160-8d87-42fcd2da1a86"
STORY="https://www.figma.com/api/mcp/asset/6dc2ad32-0957-4947-a998-c1b0ab022588"

mkdir -p src/assets/hero src/assets/story

fetch() { curl -fsSL -o "$2" "$1"; echo "ok  $2"; }

# Hero (264:176)
fetch "$HERO/73deb.png" src/assets/hero/poster-1.png
fetch "$HERO/d8700.png" src/assets/hero/poster-2.png
fetch "$HERO/4d09f.png" src/assets/hero/poster-3.png
fetch "$HERO/6ff2f.png" src/assets/hero/poster-4.png
fetch "$HERO/4b662.png" src/assets/hero/poster-5.png
fetch "$HERO/12350.png" src/assets/hero/poster-6.png
fetch "$HERO/840cd.png" src/assets/hero/poster-7.png
fetch "$HERO/b880d.png" src/assets/hero/logo-icon-sprite.png
fetch "$HERO/a2833.png" src/assets/hero/logo-wordmark-sprite.png
fetch "$HERO/24946.svg" src/assets/hero/arrow.svg

# Story (160:625)
fetch "$STORY/bbab3.png" src/assets/story/intro-character.png
fetch "$STORY/154aa.svg" src/assets/story/bubble-tail.svg
fetch "$STORY/268b2.png" src/assets/story/step-media.png
fetch "$STORY/84d52.svg" src/assets/story/divider.svg
fetch "$STORY/c35c9.png" src/assets/story/gallery-col1-top.png
fetch "$STORY/1c2f1.svg" src/assets/story/gallery-slot.svg
fetch "$STORY/6ff2f.png" src/assets/story/gallery-fenesis.png
fetch "$STORY/6d5c4.png" src/assets/story/gallery-mid-a.png
fetch "$STORY/2eb54.png" src/assets/story/gallery-mid-b.png
fetch "$STORY/9035b.svg" src/assets/story/gallery-shade.svg
fetch "$STORY/73deb.png" src/assets/story/gallery-three-girls.png
fetch "$STORY/8294a.png" src/assets/story/gallery-cat.png
fetch "$STORY/ec3e9.png" src/assets/story/gallery-alien.png
fetch "$STORY/a7d88.png" src/assets/story/gallery-jurassic.png
fetch "$STORY/fcb1d.svg" src/assets/story/cta-arrow.svg
fetch "$STORY/b1c73.svg" src/assets/story/divider-footer.svg
fetch "$STORY/85326.svg" src/assets/story/copyright-circle.svg
fetch "$STORY/1a245.svg" src/assets/story/footer-sep.svg
