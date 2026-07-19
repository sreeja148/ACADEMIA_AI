# Academia — Professor Recommendation & Course Planning System

A vanilla HTML/CSS/JS front-end prototype. No build step — open `index.html` directly, or serve the folder with any static server.

## Run it
```
cd academia
python3 -m http.server 8080
# open http://localhost:8080
```
Sign in with any email/password — it's a mocked auth flow with in-memory dummy data (no backend yet). Pick **Student**, **Professor**, or **Admin** on the sign-in screen to see that role's dashboard.

## Structure
```
academia/
├── index.html          # auth screen + app shell markup
├── css/
│   └── styles.css       # design tokens, components, dark/light theme
└── js/
    ├── data.js          # dummy "database" — courses, professors, students, reviews...
    ├── recommend.js      # weighted compatibility scoring engine
    ├── utils.js          # toast, star rows, trait bars, small DOM helpers
    ├── charts.js          # Chart.js wrappers (GPA trend, dept ratings, enrollment, radar...)
    ├── views.js           # render functions for every screen, grouped by role
    ├── router.js           # client-side view switching + sidebar nav
    └── main.js              # auth wiring, theme toggle, modals, notifications
```

## Mapped to the original brief
- **Auth** — role tabs (student/professor/admin), login, register, forgot-password modal. Mocked; swap `enterApp()` in `main.js` for real JWT calls.
- **Recommendation engine** — `recommend.js` implements the weighted formula (teaching 30%, grading 20%, difficulty match 15%, learning style 15%, reviews 10%, prior preference 10%) and returns the top N professors with a plain-language "why recommended" list.
- **Course planner** — `planner()` in `views.js`: credit-limit check, prerequisite check, timetable conflict detection (visual + banner), GPA calculator, elective suggestions, graduation-progress ring.
- **Reviews** — pros/cons/anonymous/upvote, submitted via a modal and pushed into `DB.reviews`.
- **Admin** — manage students/professors/courses (table CRUD against the in-memory arrays), analytics charts, review moderation.
- **Notifications** — bell icon + dedicated panel, unread state, mark-as-read.

## Converting to React later
Each entry in `StudentViews` / `ProfessorViews` / `AdminViews` (in `views.js`) is intentionally shaped like a component: it takes `state`, returns `{ title, sub, html, mount }`, and reads from the same `DB` object. That maps cleanly onto:
- `DB` → Context/Redux store or API layer
- each view function → a page component, `html` → JSX
- `mount()` side effects → `useEffect`
- `recommend.js` / `charts.js` → framework-agnostic, reuse as-is

## Notes
- All data is in-memory and resets on page reload — there's no backend or persistence yet, per the brief's "for now" scope.
- Theme preference is saved to `localStorage` (the only persistence in the app).
