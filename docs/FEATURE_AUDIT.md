# CapAble feature audit (summary)

Source: internal inspection of the deployed CapAble prototype (capable-alpha.vercel.app), 2026-09-25. This audit covers the deployed app, not the Access-Hire and accesshireml repositories. Legend: built = component, service and route exist and work; partial = incomplete or UI-only; new = added recently and needs testing; not built = does not exist.

| Area | Total | Built | Partial / new | Not built |
|---|---:|---:|---:|---:|
| Assessment & proctoring | 24 | 3 | 2 | 19 |
| Candidate profile & career | 21 | 11 | 2 | 8 |
| Communication & interview prep | 11 | 4 | 0 | 7 |
| Job marketplace | 14 | 2 | 4 | 8 |
| Employer dashboard | 16 | 5 | 0 | 11 |
| Institution (TPO) dashboard | 19 | 6 | 3 | 10 |
| Notifications | 7 | 2 | 1 | 4 |
| Platform infrastructure | 13 | 3 | 0 | 10 |
| Learning & development | 12 | 4 | 1 | 7 |
| **Total** | **137** | **40 (29%)** | **13 (9%)** | **84 (62%)** |

## Built features

- **Career:** AI career-path mapping, skill-gap analysis, personalised learning path, course recommendations from skill gaps, QR-linked certificates, public profile URL, portfolio with GitHub sync, resume tailored to a job description, five resume templates, ATS score.
- **Interview:** AI real-time voice mock interview, saved sessions and statistics, live filler-word counter.
- **Institution:** real-time placement dashboard, bulk CSV invite, NAAC/NIRF report, faculty dashboard, CSV skill-matrix export.
- **Employer:** role posting, Kanban candidate pipeline, offer-letter PDF, interview scheduling.
- **Platform:** Firestore RBAC security rules, in-app notification centre, dark mode, aptitude test (60 questions), tab-switch detection, timed sections.

## Critical gaps

1. The Gemini API key is in the frontend. Move calls to a backend.
2. Email notifications are queued but nothing sends until the Firebase "Trigger Email" extension is installed.
3. Webcam proctoring captures snapshots only, with no face detection or liveness check.
4. Institution admins cannot yet create placement drives in the UI.
5. Job recommendations exist as a service but are not wired into the opportunities page.
6. No employer analytics or automated shortlisting rules.

## Suggested order

Week 1: security and critical fixes. Week 2: assessment module. Week 3: employer and institution polish. Week 4: PWA and notifications.
