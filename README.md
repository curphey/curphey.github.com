# curphey.com

The Curphey family website: the family's story as a puzzle game in eight scenes. Static files, no build step.

- `index.html` and `pieces/voyage/` are the game. Each scene is two files in `pieces/voyage/chapters/`.
- `crashoverride/` is a separate game and is not touched by any of the tooling here.
- `sw.js`, `manifest.webmanifest` and `icons/` make the site installable and playable offline.

## Checking a change

    npm install
    npm test                      # puzzles, privacy scan, syntax, site wiring: seconds
    VERIFY_GPU=1 npm run check    # plays every scene in a browser on this machine's graphics card: minutes
    npm run check:gpu             # frames a second, scene by scene

`npm run check -- taps` plays every scene with real taps only; `taps-phone` does it at phone size with finger taps.
`VERIFY_LITE=1` runs the checks in the game's low-detail mode, for machines with no graphics card.

## Publishing

Open a pull request. `.github/workflows/checks.yml` runs the checks and publishes to curphey.com when a change
reaches `master`. Do not push to `master` directly.

## Building a scene

See `.claude/skills/build-scene/SKILL.md`.
