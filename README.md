# K4nb4n

**The Local-First Anonymous Kanban Board**

> Instantly create, share, and manage task boards — no sign-up, no passwords, no tracking. Just open the link and start working.

---

## What is K4nb4n?

K4nb4n is a lightweight, privacy-first Kanban board built for teams and individuals who need a fast way to track work without the overhead of heavyweight project management tools. It runs entirely on a single server with an embedded SQLite database — no external services, no cloud dependencies, no user accounts.

When you first visit K4nb4n, an anonymous identity is generated and stored in your browser. That identity is yours — it gives you admin powers on every board you create, and member access on boards you join. No email, no password. Just you and your browser.

---

## Key Features

### 🗂️ Kanban Board
Organize tasks across customizable status lanes — **Backlog**, **To Do**, **In Progress**, **Review**, and **Done**. Drag and drop cards between lanes to update status instantly.

### 📊 Timeline View
Switch to a Gantt-style timeline view to visualize task schedules with start and end dates. Filter and inspect tasks across time to identify bottlenecks and plan ahead.

### 🔗 Deep Linking
Every task gets a unique, auto-incrementing Task ID (e.g., `TASK-ID-000042`). Share a direct URL to any task — it opens the board and focuses the task modal automatically.

### 🏷️ Tags, Priorities & Assignments
Categorize tasks with custom tags, set priority levels (**Critical**, **High**, **Medium**, **Low**), assign team members, and add start/end dates. All filterable via the advanced search panel.

### ✅ To-Do Lists
Break tasks into subtasks with embedded to-do checklists. Track completion progress at a glance with a visual progress bar on each card.

### 💬 Threaded Comments
Discuss tasks in context with threaded comments. Reply to specific messages to keep conversations organized. Markdown supported.

### 📝 Rich Descriptions
Write task descriptions in full Markdown — headers, lists, code blocks, links. A built-in Markdown help modal is always a click away.

### 📜 Board Change Log
Every change is audited: task updates, to-do modifications, comment additions, status transitions. The history sidebar shows a real-time feed of who changed what and when, with user-specific color coding.

### 🔍 Advanced Filters
Filter tasks by owner, priority, tags, and date range. Combine filters for precise views. The filter panel supports multi-select owners and tag typeahead.

### 👥 Team Management
Add members to a board by name (they get a randomly generated Star Wars identity). Admins can promote, demote, or remove members. Everyone sees each other's avatar colors throughout the board.

### 🔒 Anonymous by Design
No accounts. No passwords. No tracking. Your identity is a UUID stored in `localStorage`. If you clear your browser data, you get a new identity. It's that simple.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Backend** | Next.js API Routes (Route Handlers) |
| **Database** | SQLite via `better-sqlite3` (embedded, zero-config) |
| **Styling** | CSS Modules, custom dark theme |
| **Date Handling** | `react-datepicker`, `date-fns` |
| **Icons** | `lucide-react` |
| **Markdown** | `react-markdown` |
| **Deployment** | Docker (single container) |

---

## Getting Started

### With Docker (Recommended)

```bash
docker-compose up -d --build
```

The app will be available at **http://localhost:3001**.

### Local Development

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:3001**.

---

## Project Structure

```
app/
├── api/                  # REST API routes
│   ├── boards/           # Board CRUD + members + history
│   ├── tasks/            # Task CRUD with audit logging
│   ├── todos/            # To-do list management
│   ├── comments/         # Comment threads
│   └── users/            # User registration on join
├── board/[hash]/         # Board page (dynamic route)
│   └── [taskNum]/        # Deep-link to specific task
├── page.tsx              # Landing page
└── layout.tsx            # Root layout

components/
├── Board/                # Kanban board, lanes, task cards
├── Header/               # Search, filters, navigation
├── TaskModal/             # Full task editor modal
├── Timeline/             # Gantt-style timeline view
├── History/              # Real-time change log sidebar
├── Modals/               # Board info, settings, team modals
└── Footer/               # Global footer with licensing

lib/
├── db.ts                 # SQLite connection + schema
├── seed.ts               # Demo data seeder
├── identity.ts           # Browser-based anonymous identity
├── history.ts            # Audit log utilities
└── utils.ts              # Shared helpers
```

---

## How Sharing Works

1. **Create a board** — you become the Admin.
2. **Copy the 8-character hash** from your board list.
3. **Share the link** (e.g., `https://your-server/board/a1b2c3d4`) with your team.
4. When teammates open the link, they're prompted to join. A Star Wars-themed identity is generated for them automatically.
5. Admins can manage roles from the Team panel.

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

See [LICENSE](https://www.gnu.org/licenses/gpl-3.0.en.html) for details.

---

<p align="center">
  <em>Created by <strong>richardh8</strong>, coded by <strong>Antigravity</strong> — empowering people with light tools and AI.</em>
</p>
