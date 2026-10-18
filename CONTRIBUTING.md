# Contributing to CapAble

Thanks for your interest. CapAble is a hackathon project that is growing, so small, focused contributions are the easiest to review.

## Ground rules
1. **Human in the loop.** AI outputs recommend; people decide. Do not add features that auto-reject candidates.
2. **No fabrication.** Anything generated about a person must come from verified records.
3. **Explainability.** New capability or match logic should return its evidence or reasoning.
4. **Secrets.** Never commit API keys. Use `.env.local` and keep server keys server-side.
5. **Privacy.** Do not use real personal data in demos, tests or screenshots.

## Workflow
1. Open an issue describing the change.
2. Fork, then branch: `feat/<short-name>` or `fix/<short-name>`.
3. Run `npm run lint` (frontend) before pushing. Next.js 16 has breaking changes, so check `node_modules/next/dist/docs/` first.
4. Open a pull request using the template.

## Good first areas
Accessibility (WCAG), real screenshots, tests for the ML endpoints, docs and translations.
