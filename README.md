# UniCodeTrack AI
### AI-Powered Academic Project & Hackathon Management Platform

<p align="center">
  **Track Projects. Evaluate Progress. Empower Innovation.**
</p>

<p align="center">
  A centralized platform designed to simplify university project management, enhance student collaboration, and introduce AI-powered project evaluation.
</p>

---

## About the Project

**UniCodeTrack AI** is an AI-assisted academic project and hackathon management platform developed to improve the way universities manage student projects, monitor academic progress, and organize innovation-driven competitions.

The platform provides a centralized environment connecting students, lecturers, administrators, hackathon organizers, and judges. By integrating project management, GitHub repository tracking, AI-powered evaluation, and hackathon management, UniCodeTrack AI aims to make academic project development more organized, transparent, and efficient.

## Key Features

- **Academic Project Management** – Create, assign, manage, and monitor university projects.
- **Team Management** – Organize student groups and manage project responsibilities.
- **AI-Powered Evaluation** – Analyze project submissions and assist with academic evaluation.
- **GitHub Integration** – Connect repositories and monitor software development activities.
- **Hackathon Management** – Create hackathons, manage participants, and organize competitions.
- **Progress Tracking** – Monitor project milestones, tasks, and submission progress.
- **Role-Based Access Control** – Provide different access levels according to user roles.
- **Academic Dashboards** – Provide dedicated dashboards for students, lecturers, administrators, organizers, and judges.

## User Roles

| User Role | Responsibilities |
|---|---|
| Administrator | Manage users, roles, and platform activities |
| Lecturer | Manage academic projects and evaluate student progress |
| Student | Participate in projects, collaborate, and submit work |
| Organizer | Create and manage hackathon events |
| Judge | Review and evaluate hackathon submissions |

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React.js, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Authentication |
| AI Integration | Google Gemini API |
| Version Control | Git & GitHub |
| Charts | Recharts |
| Deployment | Vercel |

## System Architecture

```text
                  UniCodeTrack AI
                         |
             +-----------+-----------+
             |                       |
          Frontend                 Backend
          Next.js                API Routes
             |                       |
             +-----------+-----------+
                         |
          +--------------+--------------+
          |              |              |
       Supabase       Gemini API     GitHub API
          |              |              |
       Database       AI Services    Repository
       & Auth                        Integration
```

## Project Structure

```text
unicode-track-ai/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   ├── lecturer/
│   │   │   ├── student/
│   │   │   ├── organizer/
│   │   │   ├── judge/
│   │   │   ├── courses/
│   │   │   ├── projects/
│   │   │   └── hackathons/
│   │   │
│   │   └── api/
│   │       ├── github/
│   │       ├── ai/
│   │       └── submissions/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── github/
│   │   ├── evaluation/
│   │   └── hackathons/
│   │
│   ├── services/
│   │   ├── github/
│   │   ├── ai/
│   │   ├── projects/
│   │   └── hackathons/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   └── validators/
│   │
│   ├── hooks/
│   └── types/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js (LTS version)
- npm
- Git
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/unicode-track-ai.git
```

### 2. Navigate to the Project

```bash
cd unicode-track-ai
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

GEMINI_API_KEY=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Add your actual service credentials. Never commit API keys or sensitive credentials to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

## Git Branching Strategy

The project follows a structured branching strategy to support collaborative development.

| Branch | Purpose |
|---|---|
| `main` | Stable and production-ready code |
| `develop` | Main integration and development branch |
| `aamir` | Aamir's development branch |
| `razim` | Razim's development branch |
| `aysha` | Aysha's development branch |

### Development Workflow

1. Each team member works on their assigned branch.
2. Changes are committed and pushed to GitHub.
3. Pull Requests are created to merge individual branches into `develop`.
4. The integrated application is tested by the team.
5. Stable and approved changes are merged into `main`.

## Development Roadmap

- [ ] Repository setup and project initialization
- [ ] Database design and integration
- [ ] User authentication and role management
- [ ] Student and lecturer dashboards
- [ ] Academic project management
- [ ] Team management and milestone tracking
- [ ] GitHub repository integration
- [ ] AI-powered project evaluation
- [ ] Hackathon management
- [ ] Submission and judging system
- [ ] Testing and deployment

## Project Objectives

- Centralize academic project management within universities.
- Improve collaboration between students and lecturers.
- Introduce AI-assisted academic project evaluation.
- Improve transparency in project progress monitoring.
- Simplify hackathon organization and participation.
- Integrate software development workflows into academic environments.

## Project Team

| Team Member | Role |
|---|---|
| **Aamir** | Project Leader & Developer |
| **Razim** | Developer |
| **Aysha** | Developer |

## Future Enhancements

- Advanced AI-based code analysis.
- Automated project progress reports.
- Intelligent project recommendations.
- Advanced performance analytics.
- Integration with additional development platforms.

## License

This project is developed for academic purposes. Licensing details can be added when the project is prepared for public distribution.

---

<p align="center">
  **UniCodeTrack AI**
  <br>
  <i>Transforming Academic Project Management Through Intelligence and Innovation.</i>
</p>
