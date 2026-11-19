<div align="center">

# 🖐️ HAND OF GOD

**A pixelated, divinely overconfident desktop experience.**

[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#-installation)
[![Engine](https://img.shields.io/badge/engine-Electron%20%2B%20Canvas-47848F?style=for-the-badge&logo=electron&logoColor=white)](package.json)
[![Vibes](https://img.shields.io/badge/vibes-divine-ff4fc8?style=for-the-badge)](#-frequently-asked-questions)
[![Spoilers](https://img.shields.io/badge/spoilers-absolutely%20not-ffd257?style=for-the-badge)](#-frequently-asked-questions)

</div>

---

## ✨ What is Hand of GOD?

Something ancient has been loading for a very long time.

Now it is almost done.

> *"A video game to play to spend your time. Hurt feelings won't be reimbursed."*

---

## 🎮 Features

- 🖐️ **One (1) hand.** Handcrafted, pixel by pixel. Not a stock photo. Not AI-generated. Drawn with math.
- ⏳ **A load screen that respects your time** by taking exactly as long as it says it will.
- 🎬 **Cinematic build-up.** There is music. There is light. There are particles. There is *anticipation*.
- 🔁 **A beginning, a middle, and an end.** Very much an end.
- 🔊 **Volume control.** Genuinely just volume control. We are not going to upsell you a "brightness" slider.
- 🖥️ **A real Windows installer.** Pick a folder. Watch files appear inside it. Feel powerful.

---

## 📦 Installation

1. Grab `HandOfGOD-Setup-1.0.0.exe` from the [Releases](../../releases) page.
2. Run it.
3. **Choose your install directory.** Any folder. This is your moment.
4. Click install. Wait approximately six seconds. That's it. That's the whole wait.
5. Launch **Hand of GOD** from the Start Menu or the desktop shortcut.

> Windows SmartScreen may get shy about an unsigned indie game. Choose *More info → Run anyway* and trust the hand.

### System requirements

| | |
|---|---|
| OS | Windows 10 / 11 (x64) |
| Graphics | Whatever you already have |
| Input | A mouse, or keyboard arrows + Enter |
| Emotional state | Unprepared |

---

## 🛠️ Build it yourself

```bash
npm install
npm start        # run the game
npm run dist     # build dist/HandOfGOD-Setup-1.0.0.exe (NSIS installer)
```

Everything is vanilla HTML/CSS/Canvas inside Electron — no framework, no bundler, no surprises.
The pixel hand, the chiptune audio and the installer icon are all generated from code, so the repo stays tiny.

```
game.js               the whole game (state machine, sprites, audio)
electron/main.js      desktop window + exit
electron/preload.js   tiny quit bridge
tools/make_icons.py   draws build/icon.ico
build/icon.ico        the face of the operation
```

---

## ❓ Frequently Asked Questions

<details>
<summary><b>Is this a horror game?</b></summary>
<br />
No. It is a comedy. Whether you laugh is between you and your conscience.
</details>

<details>
<summary><b>How long is it?</b></summary>
<br />
About forty-five seconds, if you have the patience of a saint. There are no achievements. There is only truth.
</details>

<details>
<summary><b>Can I skip the loading screen?</b></summary>
<br />
The loading screen cannot be skipped. The loading screen skips <i>you</i>.
</details>

<details>
<summary><b>Why does it only have volume settings?</b></summary>
<br />
Because the hand has already decided everything else.
</details>

<details>
<summary><b>Is my data safe?</b></summary>
<br />
The game collects absolutely nothing. Your volume preference lives in a few bytes of local storage and never leaves your PC.
</details>

---

## 🧾 Legal-ish

It's a harmless prank game. Nothing is installed outside the folder you pick, nothing is sent anywhere, and the uninstaller is a perfectly normal uninstaller.

MIT licensed. Made with pixels, sass, and an unhealthy amount of `fillRect`.

<div align="center">

**[⬇️ Download for Windows](../../releases)**

*You have been chosen.*

</div>
