# Scene sources

Source for the animated Canvas scenes on the homepage cards and case study
heroes (Course Pacing, Bulk Publish, Selective Modules Release). The pages
load one built bundle, `scenes/scenes.js` and `scenes/scenes.css`, and mount
each scene into an element with a `data-scene` name (see `entry.tsx`).

- `course-pacing/`, `bulk-publish/`, `selective-modules/`: one scene each,
  exporting a card (398 x 265) and a hero (736 x 491, with the card layout
  on phones).
- `canvas-shared/`: Canvas chrome the last two share (nav, module rows,
  publish mark).

The scenes are built with the stageshow skill's React kit, which isn't
copied here. To rebuild:

1. Copy the stageshow skill folder somewhere and run `npm install` in it.
2. Copy the four scene folders into its `examples/` folder, and `entry.tsx`
   and `vite.config.ts` into a `site-build/` folder beside `kit/`.
3. In `entry.tsx`, change the `./` imports back to `../examples/`.
4. Run `node_modules/.bin/vite build --config site-build/vite.config.ts` and
   copy `site-build/dist/*` into `scenes/`.

Posters (shown before the script loads, and kept static under reduced
motion by the scenes themselves) are `card-poster.png` and
`hero-poster.png` in each case study's `img/` folder.
