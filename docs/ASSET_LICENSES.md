# Asset provenance

Inventory, dimensions, byte sizes, usage and accessibility treatment are recorded in [`public/assets/manifest.json`](../public/assets/manifest.json). The generation prompts and master IDs allow the illustration set to be traced to its sources. ImageGen did not provide a seed or concrete model identifier in its response.

| Assets | Origin and author | Licence and handling |
| --- | --- | --- |
| Ghost C vectors, custom lettering and app icons | Authorized adaptation of the supplied `Cuddling Ghost C Icon.png`. Paths authored for this project. | User-supplied reference. SVG master and named exports in `public/brand/`. |
| Hero, invitations and three game covers | Original assets generated with Codex built-in ImageGen on 2026-11-21. | Generated for this project. Resized, stripped of metadata and compressed to WebP. [Prompts](asset-prompts/paper-world.md) |
| Classic game drawings and logo explorations | Original project vector artwork. | Authored SVG. No external artwork sources. |
| Social image | Closely mark and the generated hero, composed in the repository. | Original derivative assembly. |
| Sparkle Trio sticker | Samiran De, `stick-it-up` 0.4.0. [Source](https://github.com/Sam721166/stick-it-up) | [MIT notice](licenses/STICK-IT-UP.txt), inspected 2026-11-21. No changes to source artwork. Rendered only as decoration. |
| DM Sans | The DM Sans Project Authors, Fontsource 5.3.0. [Source](https://github.com/googlefonts/dm-fonts) | [SIL OFL 1.1](licenses/DM-SANS.txt), inspected 2026-11-21. Latin variable WOFF2 loaded unchanged with `next/font/local`. |
| Fraunces | The Fraunces Project Authors, Fontsource 5.3.0. [Source](https://github.com/undercasetype/Fraunces) | [SIL OFL 1.1](licenses/FRAUNCES.txt), inspected 2026-11-21. Latin variable WOFF2 loaded unchanged with `next/font/local`. |
| Utility icons | Lucide contributors. [Source and ISC notice](https://github.com/lucide-icons/lucide) | Rendered from the installed package. |

Cofounder and Stick It Up screenshots under `artifacts/closely` document research. The screenshots do not appear in the application. Inherited sound files and visual assets from the first version are unused by these screens.
