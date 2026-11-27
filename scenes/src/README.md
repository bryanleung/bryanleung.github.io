# Scene sources

Source for the animated Course Pacing scene used on the homepage card and the
Course Pacing case study hero. The built files the pages load are
`scenes/course-pacing-scene.js` and `scenes/course-pacing-scene.css`.

The scene is built with the stageshow skill's React kit, which isn't copied
here. To rebuild:

1. Copy the stageshow skill folder somewhere and run `npm install` in it.
2. Copy `course-pacing/` into its `examples/` folder, and `entry.tsx` and
   `vite.config.ts` into a `site-build/` folder beside `kit/`.
3. In `entry.tsx`, change the import back to `../examples/course-pacing`.
4. Run `node_modules/.bin/vite build --config site-build/vite.config.ts` and
   copy `site-build/dist/*` into `scenes/`.

Posters (shown before the script loads, and kept static under reduced
motion by the scene itself) are in `img/course-pacing/`.
