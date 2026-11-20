# Contributing to Hand of GOD

Thanks for taking an interest in Hand of GOD. The project is intentionally small: vanilla HTML, CSS and Canvas inside Electron. Please keep contributions focused and avoid adding dependencies unless they solve a clear problem.

## Development setup

1. Install a current Node.js LTS release and npm.
2. Clone the repository and enter its directory.
3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Start the desktop app:

   ```bash
   npm start
   ```

The game is rendered by `game.js`; Electron's main-process setup lives in `electron/main.js`, and the preload bridge lives in `electron/preload.js`. The static download website is in `site/` and can be previewed with:

```bash
cd site
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Before opening a pull request

- Keep the existing visual style, game flow and deliberately short experience intact unless the change is specifically about those areas.
- Avoid introducing telemetry, network requests, accounts, ads or unrelated dependencies.
- Do not commit generated installers, dependency folders, local environment files or personal data.
- For website changes, preserve the existing metadata, canonical URL, structured data and accessible navigation unless the change intentionally updates them.
- Describe what changed, why it is needed, and how you checked it.

## Manual smoke-test checklist

There is no automated test suite at present. For changes that affect the app, run the relevant checks manually:

- [ ] `npm start` opens the app without a startup error.
- [ ] The start menu renders and keyboard and mouse navigation work.
- [ ] The loading sequence completes and the main game sequence reaches its intended ending.
- [ ] Settings open, the volume control responds, and the saved volume survives a restart.
- [ ] Closing the app exits cleanly.
- [ ] If packaging-related files changed, run `npm run dist` on Windows and confirm the installer is produced in `dist/`.

For changes limited to `site/`, preview the site locally and check the download links, navigation, responsive layout and browser console.

## Pull request guidance

Use a focused branch and a descriptive pull request title. Link related issues, include screenshots for visible UI changes, and call out any checks you could not run. Keep unrelated formatting or refactoring out of the diff so changes are easy to review.
