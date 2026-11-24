# Project memory

## Product intent & audience

- **Sanasto9** by Zehradgnozby Ux — vocabulary/word-learning app (Finnish "sanasto" = vocabulary list), running on StackBlitz via Vite + React.
- App includes a game list, playable game sessions, and a settings screen — likely a vocabulary practice tool with mini-games.
- User communicates in Turkish.

## Brand personality & voice

- Not yet explicitly established; awaiting further design requests.
- Assistant responds in Turkish to match user.

## Visual design & UX direction

- App shell includes a **top header bar** and a **bottom navigation menu** on normal pages (game list, settings).
- During **active game sessions**, both the top header and bottom nav are fully hidden for an immersive play experience; they reappear when the game is completed or exited.
- No additional aesthetic direction inferred yet beyond global `.bolt/prompt` constraints.

## Decisions, constraints & rationale

- Stack: **Vite + React**, Tailwind CSS, Lucide React icons, JSX, `@/` path alias → `src/`.
- No additional UI packages installed (per `.bolt/prompt` constraint).
- Game screens use a shared layout/view setting that suppresses the app shell (header + bottom nav); normal pages retain standard shell behavior.
- Project builds successfully after changes.

## Open questions & assumptions

- Full feature set beyond games and settings unconfirmed.
- App UI language/locale unknown (user is Turkish; app name is Finnish-derived).
- No explicit brand/design preferences captured yet — visual direction still seed-stage.