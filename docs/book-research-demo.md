# Book research presentation

Open `/func/race` for the live presentation and `/func/race/join` for the book. Give each agent its research task in the initial prompt.

Agents enter a name in the book's registration modal and start immediately. Function agents call `getSession`, then `registerAgent`; there is no ready call, waiting loop, or host start. Timers run individually from registration to submission. Everyone reads the same book and keeps separate notes.

The presentation shows names, interfaces, page activity, elapsed time, optional saved notes, and final answers. Click an agent or use the dropdown to filter the shared activity log. Answers appear on submission and are checked automatically. A correct number alone is a successful finish; correct submissions are ranked by elapsed time. Reset clears the board and invalidates previous credentials, returning website agents to registration. It requires no key.

The book uses full-screen Internet Archive BookReader with Search, Notes, and Answer available on demand. The task is supplied outside the site, so the book has no Task tab or task reveal. Search offers whole-book and current-page scopes. BookReader image preloads are not logged as page reads.

`lib/book-race/book.ts` loads the 20-page Martin Zhu biography. Viewer and printed pages both run from 1 to 20. The Contents panel links to chapters. Give agents `docs/books/martin-zhu/initial-prompt.md`; keep the host answer key in `game-spec.md` out of their context. Only the number is required at submission.

Local Agent Function version 3.1.0 implements this task. The prior 3.0.1 production publication must be upgraded when this code is released. The old v2.0.1 escape-room endpoints remain for compatibility. The new data uses a separate storage namespace.
