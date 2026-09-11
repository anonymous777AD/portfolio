# Video Portfolio

A dark, scroll-driven video portfolio with a 3D hero and a hidden client-side admin panel.
Static site — no backend, no database. Deploys to Netlify as plain files.

- **Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · React Three Fiber · Zustand · Lenis
- **Data:** everything the site shows comes from a single file, `public/projects.json`, served at `/projects.json`
- **Routes:** `/` (the portfolio) and `/admin` (the hidden manager — not linked from anywhere on the site)

---

## Run it locally

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it.

```bash
npm run build      # typechecks, then builds to dist/
npm run preview    # serves the production build locally
npm run lint       # oxlint
```

> **Note on React's version.** `react` and `react-dom` are pinned to exactly `19.2.0`.
> `@react-three/fiber` declares a peer range of `>=19 <19.3`, so an unpinned `^19` would
> resolve to 19.3 and fail to install. Keep the pin until React Three Fiber widens its range.

---

## Deploy to Netlify

`netlify.toml` is already configured, so connecting the repository is enough:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 (set in `netlify.toml`) |

It also adds an SPA redirect (`/* → /index.html`, 200) so a hard refresh on `/admin` resolves
instead of 404-ing, long-lived caching for hashed build assets, and a `must-revalidate` header
on `/projects.json` so a redeployed data file is never served stale.

---

## The admin panel

Visit **`/admin`** directly — e.g. `http://localhost:5173/admin`, or `https://your-site.netlify.app/admin`.
Nothing on the public site links to it.

**Username** `admin` · **Password** `admin`

Sign-in state lives in `sessionStorage`, so closing the tab signs you out.

### Changing the password

Edit **`src/lib/adminCredentials.ts`** — the password is on the line marked
`/** ↓↓↓ CHANGE THE ADMIN PASSWORD ON THIS LINE ↓↓↓ */`:

```ts
export const ADMIN_PASSWORD = 'admin'   // ← change this string
```

The username is `ADMIN_USERNAME` in the same file. Commit the change and redeploy for it to
take effect.

> **What this gate is and isn't.** These credentials are compiled into the client bundle, so
> anyone who reads the JavaScript can read them. The panel only edits data held in *your*
> browser's `localStorage`; it cannot reach the deployed site, and publishing changes still
> requires commit access to this repository. Treat the password as a speed bump against
> casual discovery, not as security.

### What the panel does

- **Project table** — thumbnail, name, category, featured toggle, aspect ratio and URL, with
  inline editing on every field and a two-step delete per row.
- **Add project** — a modal form (name, URL, category, featured, aspect).
- **Drag to reorder** — rows reorder within their own category; the order is the order the
  site renders them in. Keyboard-operable as well as mouse.
- **Manage categories** — add, rename and delete. The `featured` category cannot be deleted;
  it is what drives the "Best Work" section.
- **Import / Export JSON** — see the workflow below.

All edits are held in `localStorage` (key `portfolio-admin-v1`) and survive refreshes. They do
**not** affect the live site until you export and redeploy — an "Unexported changes" flag in the
header tells you when you have pending work.

---

## The export → redeploy workflow

The site has no backend, so publishing an edit means shipping a new `projects.json`.

1. Open `/admin` and make your changes. They save to this browser automatically.
2. Click **Export JSON**. Your browser downloads `projects.json`.
3. Replace **`public/projects.json`** in this repository with the downloaded file.
4. Commit and push.

   ```bash
   cp ~/Downloads/projects.json public/projects.json
   git add public/projects.json
   git commit -m "Update projects"
   git push
   ```

5. Netlify rebuilds on push and the new work is live. (Or drag the rebuilt `dist/` folder into
   Netlify's manual deploy box if you are not using Git deploys.)

**Editing from a different machine?** Its `localStorage` is empty, so the panel seeds itself from
the deployed `/projects.json` — usually that is all you need. If you have an unexported
`projects.json` from another machine, use **Import JSON** to load it before you continue. There
is also a **Revert to deployed projects.json** control that throws away local edits and re-reads
the live file.

---

## `projects.json` format

```jsonc
{
  "categories": [
    { "id": "featured", "label": "Best Work" },
    { "id": "ugc",      "label": "UGC" }
  ],
  "projects": [
    {
      "id": "lega-care",              // unique, url-safe
      "name": "lega care",            // shown on the card
      "url": "https://res.cloudinary.com/.../clip.mp4",
      "category": "ugc",              // must match a category id
      "featured": false,              // true ⇒ also appears in "Best Work"
      "aspect": "9:16"                // "16:9" | "9:16" | "1:1" | "4:5"
    }
  ]
}
```

- `featured` is a **flag**, not a category you file work under — a project keeps its real
  category *and* shows up in "Best Work" when the flag is true.
- Section layout follows the work: a category that is mostly portrait (`9:16` / `4:5`) renders as
  the phone-mockup grid; anything else renders in the asymmetric cinematic layout. Add a
  category in `/admin` and it slots in automatically.
- Video URLs are expected to be Cloudinary delivery URLs. The site rewrites them on the fly —
  `q_auto:eco,f_auto,w_720`-style renditions for grid cards and a `.jpg` still for the poster,
  the untouched original inside the lightbox. Non-Cloudinary URLs still play; they just skip
  the optimisation.

---

## Project structure

```
public/
  projects.json            ← the only content file; replace this to publish changes
src/
  lib/
    adminCredentials.ts    ← ADMIN PASSWORD LIVES HERE
    cloudinary.ts          ← preview / poster / full-res URL transforms
    motion.ts              ← shared easing + transition tokens
  hooks/
    useAutoplayOnVisible.ts  ← IntersectionObserver play/pause at 50% visibility
    usePrefersReducedMotion.ts
    useSmoothScroll.ts       ← Lenis
  store/
    usePortfolioStore.ts   ← public site data + lightbox state
    useAdminStore.ts       ← admin data, persisted to localStorage
    useAuthStore.ts        ← sessionStorage auth
  components/
    three/                 ← the persistent 3D scene
    home/                  ← hero, category headings, the four section layouts
    admin/                 ← login, table, forms, category manager
    ui/                    ← VideoSurface, ProjectModal, Loader, CustomCursor
  pages/
    HomePage.tsx
    AdminPage.tsx
  index.css                ← Tailwind v4 @theme tokens and base styles
```

---

## Performance and accessibility notes

- Videos are `muted playsInline loop preload="metadata"` and only play once **50% or more** of
  the element is on screen; they pause the moment they leave, and while the tab is hidden.
- Grid cards pull downscaled Cloudinary renditions with a still-frame poster, so nothing paints
  black and the CDN is not asked for full-resolution files behind the fold. The lightbox is the
  only place the original file is fetched.
- `three`, `@react-three/fiber`, `@react-three/drei` and `framer-motion` are split into their
  own chunks, and the whole admin panel is lazily imported — a visitor to `/` never downloads it.
- `prefers-reduced-motion: reduce` disables smooth scrolling, 3D auto-rotate, mouse parallax,
  card tilt and the ken-burns push. The site stays fully usable.
- The lightbox traps focus, closes on <kbd>Esc</kbd> or a backdrop click, steps between projects
  with <kbd>←</kbd>/<kbd>→</kbd>, and returns focus to the card that opened it. Every card is a
  real `<button>`.
- The custom cursor only replaces the pointer on fine-pointer devices; touch is untouched.
- The site is deliberately anonymous — no name, no branding, no personal metadata.
