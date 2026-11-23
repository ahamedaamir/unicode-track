export interface GenerateRequirementsParams {
  prompt: string;
  topic?: string;
  difficulty?: string;
  technologies?: string;
  teamSize?: string | number;
  courseCode?: string;
  department?: string;
  projectType?: string;
}

export function buildProjectRequirementsPrompt(params: GenerateRequirementsParams): string {
  return `You are a senior university computer science professor and academic curriculum evaluator.
Generate a comprehensive, professional, and rigorous academic project requirements document based on the following lecturer brief:

LECTURER BRIEF:
${params.prompt}

${params.topic ? `TOPIC / SPECIALIZATION: ${params.topic}` : ""}
${params.difficulty ? `DIFFICULTY LEVEL: ${params.difficulty}` : "DIFFICULTY LEVEL: Intermediate"}
${params.technologies ? `RECOMMENDED TECHNOLOGIES: ${params.technologies}` : "RECOMMENDED TECHNOLOGIES: Modern Web/Cloud & Database Stack"}
${params.teamSize ? `TEAM SIZE: ${params.teamSize}` : "TEAM SIZE: 3-4 Students"}
${params.courseCode ? `COURSE CODE: ${params.courseCode}` : ""}
${params.department ? `DEPARTMENT: ${params.department}` : ""}

You MUST format the output as clean GitHub-flavored markdown containing EXACTLY these 12 numbered sections:

# 1. Project Title
Provide an official, formal academic project title.

## 2. Project Overview
A comprehensive summary of the project scope, background context, and real-world motivation.

## 3. Problem Statement
The clear problem, inefficiency, or technological gap being solved by this system.

## 4. Project Objectives
List 4-6 specific, measurable academic and technical milestones.

## 5. Target Users & Stakeholders
Primary and secondary end users, their responsibilities, and access permissions.

## 6. Functional Requirements
Numbered list (FR-1, FR-2, etc.) covering user onboarding, business workflows, transactions, reporting, and management.

## 7. Non-Functional Requirements
Structured requirements for Performance, Security (RBAC, TLS), Scalability, Availability, and Usability.

## 8. System Features & Architecture
Key architectural layers, modules, API integrations, and database entities.

## 9. Technical Requirements & Toolchain
Recommended frontend, backend runtime, database, cloud hosting, and git repository standards.

## 10. Expected Deliverables
Milestone 1 (System Architecture & Wireframes), Milestone 2 (Working Prototype & GitHub commits), and Final Release (Deployment, Test Suite, Capstone Report).

## 11. Project Constraints & Assumptions
Technical, computational, regulatory, and ethical boundaries.

## 12. Evaluation Criteria & Grading Rubric
Clear scoring rubric out of 100%: System Architecture (25%), Feature Completeness (30%), Git Attribution & Collaboration (20%), Testing & Documentation (15%), Final Defense & Presentation (10%).

Do not include conversational greetings. Return only the structured markdown document.`;
}

export function generateFallbackRequirements(params: GenerateRequirementsParams): string {
  const title = params.topic || params.prompt.slice(0, 40) || "Distributed Academic Platform";
  const course = params.courseCode || "CS492: Senior Capstone Project";
  const tech = params.technologies || "Next.js, TypeScript, PostgreSQL, Tailwind CSS, Docker, Supabase";
  const diff = params.difficulty || "Intermediate";

  return `# 1. Project Title
**${title.toUpperCase()} — Enterprise Academic Specification**

## 2. Project Overview
This academic capstone project focuses on developing **${title}**, engineered to resolve critical domain operational friction through secure, cloud-native software architecture. Developed within the syllabus of **${course}**, the system serves as an end-to-end production-grade software solution demanding rigorous engineering standards, team accountability, and modern architectural principles.

## 3. Problem Statement
Existing approaches suffer from fragmented workflows, latency in data aggregation, and vulnerability to access inconsistencies. Students must engineer a unified, fault-tolerant platform that guarantees real-time synchronization, data privacy, and transparent audit logging for all stakeholder interactions.

## 4. Project Objectives
1. Design and deploy a scalable, multi-tenant web application adhering to modular clean architecture.
2. Implement secure authentication, granular Role-Based Access Control (RBAC), and session protection.
3. Integrate real-time state management and automated notification pipelines.
4. Establish professional version control hygiene with GitHub feature branching, peer pull request reviews, and CI verification.
5. Deliver comprehensive unit and integration test suites with minimum 80% critical path test coverage.

## 5. Target Users & Stakeholders
- **Primary Users:** University students, project team leaders, and academic peer evaluators.
- **Administrative Users:** Course lecturers, faculty moderators, and external symposium judges.
- **System Services:** Background automated cron jobs, CI/CD runners, and webhook notification handlers.

## 6. Functional Requirements
- **FR-1 [Authentication & RBAC]:** Multi-role sign-in with verified institutional emails, mandatory first-login password enforcement, and secure token rotation.
- **FR-2 [Core Transaction Engine]:** Creation, indexing, search filtering, and state transitions of domain records.
- **FR-3 [Team Collaboration & Milestones]:** Real-time team workspace, milestone checklists, and submission artifact uploads.
- **FR-4 [Audit & Activity Trail]:** Immutable activity logging tracking creation, modifications, and administrative overrides.
- **FR-5 [Automated Analytics Dashboard]:** Visual metrics reflecting progress velocity, deadline countdowns, and completion percentages.

## 7. Non-Functional Requirements
- **Performance:** 95% of API responses must resolve in under 200ms under simulated concurrent student load.
- **Security:** End-to-end TLS 1.3 encryption, parameterized database queries to prevent SQL injections, and strict CSP headers.
- **Availability & Resilience:** 99.9% uptime target with graceful degradation when external APIs are unreachable.
- **Usability:** Responsive layout supporting mobile viewport (375px) through 4K displays with high contrast accessibility standards.

## 8. System Features & Architecture
- **Presentation Layer:** Next.js App Router client & server components with Tailwind CSS design tokens.
- **API & Business Logic:** Edge route handlers, typed schema validation using Zod, and middleware route security.
- **Persistence Layer:** PostgreSQL relational database with foreign key constraints, indexes, and transactional consistency.
- **Version Control & Telemetry:** GitHub API hooks for commit attribution, code frequency analysis, and automated evaluation.

## 9. Technical Requirements & Toolchain
- **Frontend / Framework:** ${tech.includes("Next") ? tech : "Next.js with React 19 and Tailwind CSS"}
- **Backend / Database:** ${tech.includes("PostgreSQL") ? tech : "Node.js / Next.js API Routes, Supabase PostgreSQL"}
- **Testing:** Vitest / Jest with React Testing Library.
- **Deployment:** Vercel or Docker containerized cloud environment.

## 10. Expected Deliverables
- **Milestone 1 [Week 3]:** Software Requirements Specification (SRS), Entity-Relationship (ER) diagram, and wireframe prototypes.
- **Milestone 2 [Week 7]:** Alpha prototype featuring functional authentication, database migrations, and core CRUD workflows.
- **Milestone 3 [Week 12]:** Production release on live URL, complete user documentation, API reference, and GitHub commit history.

## 11. Project Constraints & Assumptions
- **Project Complexity:** Rated as **${diff}** academic standard.
- **Team Size:** ${params.teamSize || "3-4 students per capstone team"}.
- Individual contribution accountability: Every team member must maintain attributable git commits corresponding to assigned tasks.

## 12. Evaluation Criteria & Grading Rubric
- **Architecture & Code Cleanliness (25%):** Component modularity, DRY principles, and TypeScript type safety.
- **Functional Completeness (30%):** Flawless execution of all mandatory functional requirements (FR-1 through FR-5).
- **Git Accountability & Teamwork (20%):** Balanced commit history, descriptive pull requests, and peer reviews.
- **Testing & Documentation (15%):** Unit tests, comprehensive README, and setup documentation.
- **Final Symposium Defense (10%):** Live demonstration, architecture defense, and Q&A handling.`;
}
