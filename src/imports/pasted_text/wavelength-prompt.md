# Build Prompt: "Wavelength" — Free, Ad-Free Music Streaming & Artist Support Platform

## 0. One-line brief
Build a full-stack, mobile-responsive music streaming web app where anyone can listen to music for free with no ads and no subscription, artists can upload their own tracks and receive direct fan donations (platform keeps a 20% commission), and users can optionally pull in tracks from Spotify's catalog to listen to alongside self-hosted uploads. Visual style: minimal, clean, generous whitespace, a restrained 2–3 color palette, and subtle ambient motion graphics in the background (not distracting from content).

---

## 1. Tech Stack

> **Versions verified current as of September 2026.** Since tooling moves fast, always run each install command with `@latest` (or the framework's own `upgrade` command) at build time rather than hardcoding these numbers into `package.json` from day one — treat the versions below as "what's current today," not a permanent pin.

**Frontend**
- **Next.js 16** (currently 16.3.x, Active LTS — App Router, React Server Components, Turbopack by default) + **TypeScript 5.x**. Next.js 15 is still in Maintenance LTS if you need to stay one major behind for ecosystem-compatibility reasons, but 16 is the recommended default for a new build.
- **React 19** (currently 19.2.x) + **React DOM 19**
- **Tailwind CSS v4** (currently 4.3.x — CSS-first config via `@theme`, no more `tailwind.config.js` required, built-in Vite/webpack plugins, faster incremental builds)
- Framer Motion (now published as **`motion`**, its current npm package name) for UI motion, plus a lightweight WebGL/Canvas layer (OGL or Three.js, kept tiny) for the ambient background animation
- Zustand or Redux Toolkit for global player state (current track, queue, playback position)
- `howler.js` or native `<audio>` + Web Audio API (for waveform/visualizer analysis)
- TanStack Query (React Query) for server-state caching

**Backend**
- **Node.js 24 LTS** ("Krypton" — Active LTS as of late 2025/into 2026; supported through mid-2028) as the runtime. Node 22 ("Jod") is the fallback Maintenance LTS if a dependency isn't Node-24-ready yet.
- **NestJS 11** (or Express/Fastify if you want something lighter) — TypeScript throughout for shared types with the frontend. NestJS 11 ships as ESM-first and requires Node 20.19+/22.12+ at minimum, so Node 24 comfortably clears that bar.
- PostgreSQL as primary DB with **Prisma ORM 7** (current major — note Prisma 7 changed the generated-client import path to your own `generated/prisma/client` output rather than `@prisma/client`, so check that when scaffolding)
- Redis for caching, session storage, rate limiting, and the "now playing"/live listener counts
- BullMQ (Redis-backed) for background jobs: audio transcoding, payout batching, Spotify token refresh, analytics rollups
- S3-compatible object storage (AWS S3, Cloudflare R2, or Backblaze B2) for uploaded audio files + artwork
- FFmpeg (server-side, via a worker) for transcoding uploads to streaming-friendly formats (HLS/AAC or Opus) and generating waveform peak data
- WebSockets (Socket.IO) for live features: live listener counts, real-time donation alerts to artists

**Payments**
- Stripe Connect (Standard or Express accounts) for artist payouts — this is the standard pattern for "platform takes a cut, rest goes to a third party." Handles KYC, tax forms, and payouts for you. Pin the Stripe SDK to whatever the latest stable API version is at integration time (Stripe versions its REST API by date string, e.g. `2025-XX-XX`, and the Node SDK auto-targets the version it shipped with) — check `https://docs.stripe.com/upgrades` when you start.
- Stripe Checkout / Payment Intents for the donation flow itself

**Auth**
- Auth.js (NextAuth) with email+password, Google, and optionally Spotify OAuth (needed anyway if you use the official Spotify API path)
- JWT access tokens + refresh token rotation

**Infra**
- Vercel or a Dockerized deployment (ECS/Fly.io/Render) for the app
- CDN (CloudFront/Cloudflare) in front of S3 for audio delivery
- Terraform (optional) for infra-as-code

---

## 2. Core Feature Set

### 2.1 Listener-facing
- Browse/search catalog (self-hosted uploads + optionally Spotify-sourced metadata)
- Full playback: play/pause/seek/skip, queue management, shuffle/repeat, volume, gapless playback where possible
- Persistent mini-player that survives navigation (bottom bar) + full "Now Playing" expanded view with animated album art and waveform
- Playlists: user-created, public/private, collaborative optional
- Likes/favorites, recently played, listening history
- Search across tracks/artists/albums/playlists
- Artist profile pages with bio, uploaded tracks, total plays, and a prominent "Support this artist" donation button
- No ads, no paywall on playback — 100% free listening tier by design

### 2.2 Artist-facing
- Artist onboarding flow (separate role/account type or upgrade from listener account)
- Upload flow: audio file + cover art + metadata (title, album, genre, lyrics optional, explicit flag)
- Background transcoding pipeline (uploaded file → normalized loudness → HLS chunks or streamable Opus/AAC + waveform peaks JSON)
- Artist dashboard: play counts, unique listeners, geographic breakdown, donation history, payout history, earnings graph
- Stripe Connect onboarding embedded in dashboard (required before donations can be received)
- Ability to edit/delete own tracks, reorder into albums/EPs

### 2.3 Donations
- One-time or recurring donation to an artist (Stripe Payment Intents / Stripe Checkout)
- Optional message/shout-out attached to donation, shown in a public "supporters" feed on artist page (toggleable per-donation as private)
- **Commission logic**: platform fee = 20% of donation amount, artist receives 80%, applied via Stripe Connect's `application_fee_amount` at charge time — this is atomic (no separate transfer step needed, avoids reconciliation bugs)
- Real-time toast/notification to artist when a donation lands (WebSocket push + email)
- Automatic payouts to artist's connected bank account per Stripe's payout schedule (daily/weekly, configurable)
- Full transparent ledger: donor sees "$10 sent → artist receives $8, platform fee $2" before confirming

### 2.4 Spotify Integration (dual-path — see §6)
- Search Spotify's catalog for tracks not available as native uploads
- Show Spotify tracks in search results tagged distinctly ("via Spotify") from native uploads
- Playback of Spotify tracks (constraints depend on which integration path you choose — detailed in §6)
- Merge Spotify metadata (album art, artist info) into the unified search/browse experience

---

## 3. Database Schema (Prisma-style, abbreviated)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String?
  displayName   String
  avatarUrl     String?
  role          Role     @default(LISTENER) // LISTENER, ARTIST, ADMIN
  stripeConnectId String?  // Stripe Connect account, set once artist onboards
  stripeCustomerId String? // for making donations
  createdAt     DateTime @default(now())
  tracks        Track[]
  playlists     Playlist[]
  donationsSent DonationDonation[] @relation("DonorDonations")
  donationsRecv Donation[] @relation("ArtistDonations")
  listenHistory ListenEvent[]
}

model Track {
  id            String   @id @default(uuid())
  title         String
  artistId      String
  artist        User     @relation(fields: [artistId], references: [id])
  source        TrackSource @default(NATIVE) // NATIVE, SPOTIFY
  spotifyId     String?  // if source = SPOTIFY
  durationMs    Int
  coverArtUrl   String?
  audioUrl      String?  // HLS manifest / streamable file URL (NATIVE only)
  waveformJson  Json?
  genre         String?
  explicit      Boolean  @default(false)
  playCount     Int      @default(0)
  createdAt     DateTime @default(now())
}

model Playlist {
  id          String   @id @default(uuid())
  ownerId     String
  name        String
  isPublic    Boolean  @default(true)
  tracks      PlaylistTrack[]
}

model PlaylistTrack {
  playlistId String
  trackId    String
  position   Int
  @@id([playlistId, trackId])
}

model Donation {
  id              String   @id @default(uuid())
  donorId         String
  donor           User     @relation("DonorDonations", fields: [donorId], references: [id])
  artistId        String
  artist          User     @relation("ArtistDonations", fields: [artistId], references: [id])
  amountCents     Int
  platformFeeCents Int     // 20% of amountCents
  artistNetCents  Int      // 80%
  currency        String   @default("usd")
  message         String?
  isPublic        Boolean  @default(true)
  stripePaymentIntentId String
  status          DonationStatus @default(PENDING) // PENDING, SUCCEEDED, FAILED, REFUNDED
  createdAt       DateTime @default(now())
}

model ListenEvent {
  id        String   @id @default(uuid())
  userId    String?  // nullable for anonymous listens
  trackId   String
  playedMs  Int
  country   String?
  createdAt DateTime @default(now())
}
```

---

## 4. Key API Endpoints (REST, versioned `/api/v1`)

```
Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me

Catalog
GET    /tracks?search=&genre=&source=
GET    /tracks/:id
POST   /tracks/upload            (artist only, multipart -> triggers transcode job)
DELETE /tracks/:id
GET    /artists/:id
GET    /artists/:id/tracks

Playback
POST   /tracks/:id/play-event    (log listen, increment play count, debounce/anti-fraud)
GET    /tracks/:id/stream        (signed URL to HLS manifest / CDN asset)

Playlists
GET/POST/PATCH/DELETE /playlists...

Donations
POST   /donations/intent         (create Stripe PaymentIntent w/ application_fee_amount)
POST   /donations/webhook        (Stripe webhook: confirm success, update ledger)
GET    /artists/:id/donations     (public supporter feed)
GET    /me/earnings               (artist dashboard data)

Artist Payments
POST   /connect/onboarding-link   (Stripe Connect onboarding URL)
GET    /connect/status

Spotify
GET    /spotify/search?q=
GET    /spotify/track/:id
GET    /spotify/playback-token    (if using official SDK path)
```

---

## 5. Upload → Playback Pipeline (Native Tracks)

1. Artist uploads raw audio (mp3/wav/flac) via multipart upload → temp S3 bucket.
2. `POST /tracks/upload` creates a `Track` row with `status: PROCESSING` and enqueues a BullMQ job.
3. Worker: validates file, runs loudness normalization (FFmpeg `loudnorm`), transcodes to:
   - HLS (multiple bitrate renditions) for adaptive streaming, **or**
   - a single Opus/AAC file if you want to keep it simple initially.
4. Worker generates waveform peak data (e.g., via `audiowaveform` CLI) → stored as JSON for the frontend visualizer.
5. Final assets pushed to permanent S3 path, CDN-fronted; `Track.status → READY`, `audioUrl` set.
6. Frontend streams via signed CDN URL; use HTTP Range requests / HLS.js on the client for adaptive playback.

---

## 6. Spotify Integration — Two Paths (choose one, or ship both behind a feature flag)

### Path A — Official Spotify Web API + Web Playback SDK (recommended)
- Use Spotify OAuth so users log in with their own Spotify account.
- Web API for search/metadata (`/v1/search`, `/v1/tracks/:id`) — fully legal, well documented, stable.
- Web Playback SDK lets you embed actual full-track playback **for users who have Spotify Premium**, inside your own UI (Spotify's official supported method for third-party apps).
- Limitation: free-tier Spotify users only get 30-second previews via the API; full playback via the SDK requires the listener to have Premium — you can't bypass this legally.
- Pros: TOS-compliant, stable, no ban risk, no legal exposure.
- Cons: full playback gated behind the *listener's own* Spotify Premium subscription (not your platform's).

### Path B — SpotAPI (unofficial, reverse-engineered) — as requested
- Repo: `https://github.com/Aran404/SpotAPI` — logs into a Spotify account by scraping internal/private endpoints (not a public, sanctioned API).
- **Risk flags to build in awareness of, not silently ignore**: violates Spotify's ToS, can trigger account bans/IP blocks, endpoints can break without notice since they're unofficial, and distributing this functionality in a commercial product carries legal exposure (Spotify has taken legal action against similar unofficial clients in the past).
- If you proceed anyway, isolate it completely:
  - Wrap it in its own microservice (e.g., a small Python service, since SpotAPI is Python) that your Node backend calls over an internal-only API — never expose it directly to the client.
  - Put it behind a `SpotifyProviderInterface` in your backend so it's a swappable implementation detail, not baked into your core domain logic — this lets you rip it out fast if it breaks or you get a cease-and-desist.
  - Use a dedicated, disposable Spotify account (not real user credentials) for the scraping session, rotate it out if flagged.
  - Rate-limit and cache aggressively (Redis) to minimize calls.
  - Do not claim in your UI that this is "official Spotify integration" — clearly label it and disclose to users in your ToS that this feature depends on an unofficial method that may be interrupted at any time.

**Suggested default: build Path A first (it's a real, durable feature), and treat Path B as an experimental opt-in behind a feature flag**, given the stability/legal risk trade-off.

---

## 7. UI / UX Design System

**Palette (minimal, 3 colors + neutrals):**
- Background: `#0B0B0E` (near-black) in dark mode / `#FAFAF8` (off-white) in light mode
- Primary accent: one saturated color, e.g., `#5EEAD4` (soft teal) or `#B4A7FF` (soft lavender) — used sparingly for the play button, active states, and progress bar only
- Text: `#EDEDED` on dark / `#161616` on light, with a muted gray (`#8A8A8E`) for secondary text
- No more than one accent color visible on screen at a time

**Typography**
- One display font for headings (e.g., "Söhne", "General Sans", or "Inter Tight"), one for body (Inter) — avoid more than 2 font families
- Generous line-height, large tap targets for mobile

**Layout**
- Persistent bottom mini-player (desktop: full-width bar; mobile: compact bar above nav)
- Sidebar nav on desktop collapsing to bottom tab bar on mobile
- Card-based grids for browse/search with heavy whitespace, no visual clutter (no borders where spacing can do the job)

**Motion graphics (background ambiance)**
- A subtle animated gradient mesh or slowly drifting particle field rendered in a fixed, full-viewport `<canvas>` behind all content (very low opacity, ~5–10%, so text stays fully legible)
- Animation should react gently to audio: e.g., particle speed or gradient hue tied to the current track's average frequency/amplitude (Web Audio API `AnalyserNode`) for a subtle "alive" feeling without being a full visualizer
- Respect `prefers-reduced-motion` — disable/simplify animation for users who request it
- Page transitions via Framer Motion (fade/slide, ~200ms, easing `easeOut`) — nothing bouncy or attention-grabbing
- Album art on the Now Playing screen can have a slow ambient "breathing" scale/blur animation

**Responsiveness**
- Mobile-first Tailwind breakpoints; test at 375px, 768px, 1024px, 1440px
- Player controls and touch targets ≥44px on mobile

---

## 8. Anti-fraud / Abuse Considerations
- Play-count integrity: debounce play events (minimum listen duration, e.g., 30s or 50% of track, before counting toward artist stats) and rate-limit per IP/user to deter fake-play farming, since play counts may indirectly influence discovery/ranking
- Donation fraud: rely on Stripe's built-in fraud detection (Radar); disallow donating to your own artist account (self-donation check: donor.id !== artist.id)
- Upload abuse: scan uploads for copyright red flags is out of scope for a v1, but add a DMCA takedown request flow (simple form + admin review queue) since user uploads create copyright liability
- Content moderation: basic profanity/metadata filter + admin flagging queue for uploaded tracks and donation messages

---

## 9. Suggested Build Order (Milestones)
1. Auth + user roles + basic Next.js shell with the design system/motion background
2. Native upload → transcode → playback pipeline (core value prop #1)
3. Player UI (mini player, queue, now-playing) fully working end-to-end on native tracks
4. Playlists, search, browse
5. Stripe Connect onboarding + donation flow with 20% commission split
6. Artist dashboard (earnings, plays, supporters)
7. Spotify Path A (official API + Web Playback SDK) integration into unified search
8. (Optional/flagged) Spotify Path B (SpotAPI) as an isolated experimental service
9. Polish: motion graphics, reduced-motion support, mobile pass, load testing on streaming endpoints

---

## 10. Additional Functions Worth Adding (not explicitly requested, but valuable)
- **Recommendation engine (v2)**: simple collaborative filtering or "listeners also played" based on `ListenEvent` co-occurrence
- **Artist verification badge** for confirmed identity, to build trust around donations
- **Tip goals/campaigns**: artists set a visible funding goal (e.g., "$500 toward studio time") with a progress bar
- **Public API/embeds**: shareable embeddable player widget for artists to post on their own sites/socials
- **Offline queueing via Service Worker** (PWA) so the app installs like an app and caches recently played tracks
- **Multi-currency support** for donations via Stripe's built-in currency conversion
- **Tax/1099 handling**: Stripe Connect automatically handles this for US-based artist payouts above threshold — surface it in the dashboard rather than building it yourself