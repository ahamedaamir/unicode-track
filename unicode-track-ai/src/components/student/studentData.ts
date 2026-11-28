import { StudentStatus, AISeverity } from "./StatusBadge";
import { GroupMemberAvatar } from "./AvatarGroup";

export interface StudentProjectItem {
  id: string;
  code: string;
  title: string;
  course: string;
  supervisor: string;
  groupName: string;
  status: StudentStatus;
  progress: number;
  deadline: string;
  countdown: string;
  urgent: boolean;
  repoName: string;
  commits: number;
  aiScore: number;
  finalMark: number | null;
  members: GroupMemberAvatar[];
  description: string;
}

export const STUDENT_PROJECTS: StudentProjectItem[] = [
  {
    id: "proj-cs3021",
    code: "CS3021",
    title: "Distributed Campus Library & Reservation System",
    course: "Software Engineering II",
    supervisor: "Dr. Sarah Al-Mansoor",
    groupName: "Team Atlas (Group 04)",
    status: "in_progress",
    progress: 74,
    deadline: "Dec 15, 2026",
    countdown: "Due in 4 days",
    urgent: true,
    repoName: "team-atlas/campus-library-v2",
    commits: 148,
    aiScore: 86,
    finalMark: null,
    members: [
      { name: "Alex Chen", role: "Team Lead", isLeader: true },
      { name: "Maya Patel", role: "Backend" },
      { name: "Liam O'Connor", role: "Database" },
      { name: "Nadia Kim", role: "Frontend" },
    ],
    description:
      "Full-stack academic resource booking platform with role-based access, PostgreSQL schema validation, and automated CI checks.",
  },
  {
    id: "proj-it2040",
    code: "IT2040",
    title: "Real-Time IoT Lab Energy Telemetry Portal",
    course: "Database Management Systems",
    supervisor: "Prof. Marcus Sterling",
    groupName: "Team Nexus (Group 02)",
    status: "submitted",
    progress: 92,
    deadline: "Dec 20, 2026",
    countdown: "Due in 9 days",
    urgent: false,
    repoName: "team-nexus/iot-energy-db",
    commits: 112,
    aiScore: 91,
    finalMark: 90,
    members: [
      { name: "Maya Patel", role: "Team Lead", isLeader: true },
      { name: "Alex Chen", role: "API & Schema" },
      { name: "Noah Silva", role: "Analytics" },
    ],
    description:
      "Normalized time-series relational database with ER-verified constraints, indexing benchmarks, and Recharts telemetry views.",
  },
  {
    id: "proj-se3100",
    code: "SE3100",
    title: "AI-Assisted Peer Code Review Sandbox",
    course: "Capstone Design Studio",
    supervisor: "Dr. Elena Vance",
    groupName: "Team Atlas (Group 04)",
    status: "revision_requested",
    progress: 61,
    deadline: "Dec 28, 2026",
    countdown: "Due in 17 days",
    urgent: false,
    repoName: "team-atlas/review-sandbox",
    commits: 64,
    aiScore: 78,
    finalMark: null,
    members: [
      { name: "Alex Chen", role: "Team Lead", isLeader: true },
      { name: "Nadia Kim", role: "UI/UX" },
    ],
    description:
      "Modular Next.js & TypeScript workspace for rubric-aligned code inspection with strict advisory separation.",
  },
];

export const STUDENT_NOTIFICATIONS = [
  {
    id: "n1",
    title: "AI Advisory Review Ready for CS3021",
    desc: "Gemini generated 5 advisory observations on your latest pull request.",
    time: "18m ago",
    unread: true,
    category: "AI Review",
  },
  {
    id: "n2",
    title: "Revision Requested: SE3100 Proposal",
    desc: "Dr. Elena Vance requested updated non-functional security requirements.",
    time: "2h ago",
    unread: true,
    category: "Proposal",
  },
  {
    id: "n3",
    title: "Final Mark Released: IT2040",
    desc: "Prof. Marcus Sterling approved your final evaluation (90 / 100).",
    time: "1d ago",
    unread: false,
    category: "Evaluation",
  },
  {
    id: "n4",
    title: "GitHub Repository Synced",
    desc: "14 new commits synced from team-atlas/campus-library-v2.",
    time: "2d ago",
    unread: false,
    category: "GitHub",
  },
];

export const AI_CODE_FINDINGS: {
  id: string;
  file: string;
  line: number;
  severity: AISeverity;
  title: string;
  suggestion: string;
  snippet: string;
}[] = [
  {
    id: "f1",
    file: "src/services/reservations/book.ts",
    line: 4,
    severity: "critical",
    title: "Missing transaction lock on concurrent seat reservation",
    suggestion:
      "Wrap the availability check and insert inside a single database transaction with row-level locking to prevent double-booking.",
    snippet: `export async function reserveResource(userId: string, slotId: string) {
  const existing = await db.query("SELECT id FROM reservations WHERE slot_id = $1", [slotId]);
  if (existing.rows.length > 0) throw new Error("Slot unavailable");
  return db.query("INSERT INTO reservations (user_id, slot_id) VALUES ($1, $2)", [userId, slotId]);
}`,
  },
  {
    id: "f2",
    file: "src/app/api/submissions/route.ts",
    line: 3,
    severity: "high",
    title: "Validate payload size before parsing JSON body",
    suggestion:
      "Add Zod schema bounds on attachment URLs and description length to guard against oversized payloads.",
    snippet: `export async function POST(req: Request) {
  const body = await req.json();
  // Consider enforcing max length via Zod schema
  return Response.json({ ok: true, projectId: body.projectId });
}`,
  },
  {
    id: "f3",
    file: "src/components/ProposalForm.tsx",
    line: 2,
    severity: "medium",
    title: "Extract repeated form validation helper",
    suggestion:
      "Consolidate duplicate field validation checks into a shared validator module.",
    snippet: `const isValidTitle = (title: string) => title.trim().length >= 6;
// Repeated in ProposalDraftModal.tsx`,
  },
  {
    id: "f4",
    file: "src/lib/date.ts",
    line: 1,
    severity: "info",
    title: "Consider explicit UTC formatting for deadline countdowns",
    suggestion:
      "Explicitly pass timezone options when rendering submission timestamps across student browsers.",
    snippet: `export const formatDeadline = (iso: string) => new Date(iso).toLocaleDateString("en-US");`,
  },
];
