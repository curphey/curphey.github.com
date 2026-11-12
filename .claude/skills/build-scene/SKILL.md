---
name: build-scene
description: Build or rework one scene of the family puzzle game (pieces/voyage) without supervision, from a written brief and reference photos, through to a pull request that the checks have passed. Use when asked to add, replace or rework a scene.
---

# Build a scene

A scene is two files in `pieces/voyage/chapters/`: `<id>.mjs` (the puzzle, as data) and `<id>-scene.js` (the model).
It is registered in two one-line lists: `chapters/index.mjs` and `chapters/scenes.js`. Nothing else should need editing;
if it does, say why in the pull request.

## 1. Read the brief. Stop if it is incomplete.

The brief is in the spec store (`~/Documents/GitHub/curphey/openspecs`, change `family-site-family-voyage`),
at `scenes/<id>/brief.md`, with photos beside it. It must give: the place; who plays (ids from `people.mjs`); the goal in
one sentence; a target for the shortest solution in moves; and at least two reference photos, one from above.
The photos are for reference only and are never copied into the site repo.
If any of these is missing, do not guess: report what is missing and stop.

## 2. Puzzle first, proven by the solver

Write `<id>.mjs` and add a test to `models.test.mjs` before modelling anything. The generic tests already require:
every perspective ("apparent") edge joins on screen exactly when its condition holds; no reachable dead end; status
text gives no move away. Your test must also assert: every player has to move; the perspective crossing is on the
shortest solution; the solution length meets the brief's target. Run `npm test`.

Rules that are not negotiable: first names only, and the fourth player is `[REDACTED]`; no four-digit year anywhere;
the goal line names the players; every mechanism a player may use must be usable by a tap (step 4 enforces this).

## 3. Model the scene from the photos

Build with `render/kit.js`. Give each scene an `egg` and a `marg` position. Take screenshots at 1440x900 and 390x844
(`VERIFY_OUT=<dir> npm run check -- <check>`), and compare them with the reference photos against this list:
the landmark's silhouette; its colours; what surrounds it; nothing hides a traveller or a path; the frame includes
every node. Fix and repeat until a fresh reviewer agent, given only the photos and the screenshots, finds nothing
on the list. Record what still differs from the real place.

## 4. Play it as a stranger would

`SCENES=<id> npm run check -- taps` plays the scene with real taps only. If a move has no tap, the scene is not done:
add the lever, handle or tap target. Then add the scene to `playScene` in `verify.mjs`, and run `npm run check`.
On a machine with a graphics card, `npm run check:gpu` must report at least 30 frames a second for the scene.

## 5. Hand over

Branch, commit, open a pull request. The `checks` workflow must pass; it publishes on merge to `master`, so do not push
to `master`. In the pull request say: what was built, the solution length, what differs from the photos, and anything
not verified. Update `tasks.md` in the spec store.

## Decisions that stay with Mark

The story, who appears and under what name, anything about privacy, and whether a scene is fun. Ask; do not decide.
