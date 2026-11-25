import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  FolderKanban, 
  GitBranch, 
  Bot, 
  Trophy, 
  Check, 
  ChevronRight, 
  Building2, 
  ShieldCheck, 
  Activity,
  Layers,
  Users2,
  School
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardPreview } from "@/components/dashboard/DashboardPreview";
import { ProjectCard, ProjectCardData } from "@/components/projects/ProjectCard";
import { HackathonCard, HackathonData } from "@/components/hackathons/HackathonCard";
import { EvaluationPreview } from "@/components/evaluation/EvaluationPreview";

export default function Home() {
  // Sample academic projects for Section 6
  const sampleProjects: ProjectCardData[] = [
    {
      title: "Autonomous Drone Navigation & Obstacle Detection",
      course: "CS-492 Capstone",
      department: "Dept. of Computer Science & Engineering",
      teamName: "Team SkyGrid",
      teamMembers: [
        { name: "Alex Chen", avatar: "AC", role: "Team Lead & Sensors" },
        { name: "Sarah Lin", avatar: "SL", role: "ML Computer Vision" },
        { name: "Marcus Doe", avatar: "MD", role: "Backend Systems" },
        { name: "Priya Patel", avatar: "PP", role: "Telemetry & DevOps" },
      ],
      progress: 78,
      nextMilestone: "Milestone 4: Field Testing & Telemetry Ingestion",
      milestoneDue: "Nov 30, 2026",
      supervisor: "Dr. Evelyn Reed",
      supervisorRole: "Associate Professor & Capstone Director",
      status: "On Track",
      repoName: "skygrid/drone-ai-core",
      totalCommits: 135,
    },
    {
      title: "BioSignal: Real-Time EEG Telemetry & Seizure Pre-Detection",
      course: "BME-401 Senior Design",
      department: "Biomedical Engineering & Data Science",
      teamName: "NeuralPulse",
      teamMembers: [
        { name: "Liam Davis", avatar: "LD", role: "Signal Processing" },
        { name: "Maya Wang", avatar: "MW", role: "ML Model Training" },
        { name: "Carlos Ruiz", avatar: "CR", role: "Embedded Firmware" },
      ],
      progress: 64,
      nextMilestone: "Milestone 3: Clinical Dataset Validation",
      milestoneDue: "Dec 04, 2026",
      supervisor: "Prof. Jonathan Hayes",
      supervisorRole: "Principal Investigator, NeuroTech Lab",
      status: "Needs Review",
      repoName: "neuralpulse/eeg-edge-detect",
      totalCommits: 98,
    },
  ];

  // Sample hackathons for Section 7
  const sampleHackathons: HackathonData[] = [
    {
      id: "unihacks-2026",
      title: "UniHacks AI Global 2026",
      organizer: "Global University Consortium & DevFest",
      description:
        "Build impactful artificial intelligence solutions addressing real-world challenges in climate resilience, precision medicine, and intelligent accessibility.",
      status: "Registration Open",
      dates: "Dec 05 - Dec 07, 2026",
      duration: "48-Hour Sprint",
      prizePool: "$15,000 in Prizes",
      teamCount: 142,
      categories: ["Generative AI", "Healthcare Tech", "Climate Systems", "EdTech"],
      location: "Hybrid (Campus & Virtual)",
      registrationDeadline: "Dec 01, 2026",
    },
    {
      id: "greentech-cup",
      title: "GreenTech Campus Innovation Cup",
      organizer: "Faculty of Environmental Engineering",
      description:
        "Develop IoT telemetry pipelines and algorithmic models to reduce university carbon footprint and optimize smart municipal energy grids.",
      status: "Starts in 3 Days",
      dates: "Nov 28 - Nov 30, 2026",
      duration: "36-Hour Hackathon",
      prizePool: "$8,000 in Grants",
      teamCount: 64,
      categories: ["Clean Energy", "Smart Campus IoT", "Circular Economy"],
      location: "Engineering Atrium Hub",
      registrationDeadline: "Nov 26, 2026",
    },
    {
      id: "cybersprint-2027",
      title: "NextGen Web3 & Security Sprint",
      organizer: "Department of Information Assurance & ACM",
      description:
        "Architect zero-knowledge proof verification protocols, cryptographic storage abstractions, and resilient decentralized authentication frameworks.",
      status: "Upcoming",
      dates: "Jan 16 - Jan 18, 2027",
      duration: "48-Hour Sprint",
      prizePool: "$12,500 in Prizes",
      teamCount: 88,
      categories: ["Zero-Knowledge", "Cryptography", "Decentralized ID"],
      location: "Virtual Global Hackathon",
      registrationDeadline: "Jan 10, 2027",
    },
  ];

  const featureCards = [
    {
      title: "Academic Project Management",
      description: "Manage undergraduate and postgraduate research workflows with clear deliverables.",
      points: [
        "Create and organize academic projects.",
        "Assign students to teams.",
        "Track milestones and deadlines.",
        "Manage lecturer supervision.",
      ],
      icon: <FolderKanban className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
    {
      title: "GitHub Contribution Tracking",
      description: "Eliminate free-riding with individual commit velocity and pull request metrics.",
      points: [
        "Connect GitHub repositories.",
        "View commit activity.",
        "Monitor team contribution patterns.",
      ],
      icon: <GitBranch className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
    {
      title: "AI-Assisted Project Evaluation",
      description: "Assist professors with instant rubric matching and constructive feedback drafts.",
      points: [
        "Evaluate projects using rubrics.",
        "Generate structured feedback.",
        "Help lecturers review project progress.",
      ],
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
    {
      title: "Hackathon Management",
      description: "Run competitive campus hackathons, manage tracks, and coordinate live judging.",
      points: [
        "Create hackathon events.",
        "Register teams.",
        "Manage challenges and submissions.",
        "Support judging and leaderboards.",
      ],
      icon: <Trophy className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
    {
      title: "Team Collaboration",
      description: "Facilitate seamless teamwork and peer collaboration within student groups.",
      points: [
        "Organize student teams.",
        "Share project information.",
        "Monitor team progress.",
      ],
      icon: <Users2 className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
    {
      title: "University Workspace",
      description: "Unified institutional portal customized for your university's faculties and departments.",
      points: [
        "Manage university information.",
        "Organize faculties and academic activities.",
        "Provide a dedicated workspace for each university.",
      ],
      icon: <School className="w-5 h-5 text-accent" />,
      bg: "bg-muted border-border",
      accent: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* A. Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* B. Hero Section */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-background via-background to-background">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-20" />

          {/* Subtle teal decorative ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Hero Text & CTAs */}
              <div className="lg:col-span-5 space-y-6 text-left">
                {/* Small badge */}
                <div className="inline-flex">
                  <Badge variant="teal" size="md" dot>
                    <Sparkles className="w-3.5 h-3.5 text-accent mr-0.5" />
                    AI-Powered Academic Collaboration
                  </Badge>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-foreground leading-[1.12]">
                  Manage Academic Projects.{" "}
                  <span className="text-accent">Track Progress.</span> Build Better Ideas.
                </h1>

                {/* Supporting Text */}
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  UniCodeTrack AI helps universities organize academic projects, monitor student progress, track GitHub contributions, support AI-assisted evaluations, and manage hackathon competitions in one intelligent workspace.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    href="/register"
                    variant="primary"
                    size="lg"
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Get Started
                  </Button>
                  <Button
                    href="/login"
                    variant="outline"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </div>

                {/* Trust text */}
                <div className="pt-3 flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-muted text-accent text-[10px] font-bold text-center leading-6 border border-border">
                      Uni
                    </span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-accent text-background text-[10px] font-bold text-center leading-6">
                      AI
                    </span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-muted text-muted-foreground text-[10px] font-bold text-center leading-6 border border-border">
                      Git
                    </span>
                  </div>
                  <span>Built for students, lecturers, and university teams.</span>
                </div>
              </div>

              {/* Right Column: High-Fidelity Product Dashboard Preview */}
              <div className="lg:col-span-7 w-full">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Platform Statistics */}
        <section className="border-y border-border bg-card py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Platform Statistics (Simulated Academic Metrics)
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center p-4 rounded-xl hover:bg-muted/60 transition-colors">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
                  1,200<span className="text-accent">+</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  Academic Projects
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Across capstone & research courses
                </div>
              </div>

              <div className="text-center p-4 rounded-xl hover:bg-muted/60 transition-colors">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
                  4,800<span className="text-accent">+</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  Student Teams
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Actively collaborating & tracking commits
                </div>
              </div>

              <div className="text-center p-4 rounded-xl hover:bg-muted/60 transition-colors">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
                  150<span className="text-accent">+</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  Hackathon Events
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Organized by university clubs & faculty
                </div>
              </div>

              <div className="text-center p-4 rounded-xl hover:bg-muted/60 transition-colors">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-mono tabular-nums">
                  18,000<span className="text-accent">+</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  AI-Assisted Evaluations
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Milestone checks verified by lecturers
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* C. What Can UniCodeTrack AI Do? */}
        <section id="features" className="py-20 sm:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="teal" size="md" className="mb-3">
                Comprehensive Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                What Can UniCodeTrack AI Do?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
                Empowering universities with an all-in-one ecosystem for academic milestones, transparent git telemetry, AI-assisted rubric evaluation, and hackathon organization.
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featureCards.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-[16px] border border-border p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-accent/40 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border ${feat.bg}`}>
                      {feat.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {feat.description}
                    </p>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {feat.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`mt-6 pt-4 border-t border-border flex items-center text-xs font-semibold ${feat.accent}`}>
                    <span>Explore module</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* D. How It Works */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="teal" size="md" className="mb-3">
                Simple 3-Step Process
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
                From institutional onboarding to continuous academic review and hackathon management.
              </p>
            </div>

            {/* Three connected steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-border -translate-y-8 z-0 pointer-events-none" />

              {/* Step 1 */}
              <div className="relative z-10 bg-background border border-border rounded-[16px] p-7 text-left hover:border-accent/40 transition-colors shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-card text-foreground font-mono font-bold flex items-center justify-center text-sm shadow-xs border border-border">
                    01
                  </span>
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full border border-accent-border">
                    Step 1
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Register Your University
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The designated university administrator registers the institution, enters faculty details, and activates the official university workspace.
                </p>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Building2 className="w-4 h-4 text-accent" />
                  <span>Institutional Administrator Portal</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 bg-background border border-border rounded-[16px] p-7 text-left hover:border-accent/40 transition-colors shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-accent text-background font-mono font-bold flex items-center justify-center text-sm shadow-xs">
                    02
                  </span>
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full border border-accent-border">
                    Step 2
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Create Courses and Academic Projects
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Supervisors and faculty define course milestones, establish grading rubrics, assign teams, and link project repositories with GitHub webhooks.
                </p>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <GitBranch className="w-4 h-4 text-accent" />
                  <span>Curriculum & Repository Setup</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 bg-background border border-border rounded-[16px] p-7 text-left hover:border-accent/40 transition-colors shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl bg-card text-foreground font-mono font-bold flex items-center justify-center text-sm shadow-xs border border-border">
                    03
                  </span>
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full border border-accent-border">
                    Step 3
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Manage Students, Projects, and Hackathons
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Students collaborate on code, submit milestones, and participate in hackathons while lecturers review automated AI rubric insights and finalize evaluations.
                </p>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Bot className="w-4 h-4 text-accent" />
                  <span>AI Pre-Screening & Evaluation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Projects Section */}
        <section id="academic-projects" className="py-20 sm:py-28 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <Badge variant="teal" size="md" className="mb-3">
                  Academic Project Management
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Transparent Progress for Every Student Project
                </h2>
                <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                  Eliminate guesswork in group assignments. Monitor individual contributions, milestone deliverables, and supervisor feedback in one unified timeline.
                </p>
              </div>

              <div>
                <Button
                  href="/register"
                  variant="primary"
                  size="md"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Project Management
                </Button>
              </div>
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sampleProjects.map((project, idx) => (
                <ProjectCard key={idx} project={project} />
              ))}
            </div>

            {/* Bottom feature note */}
            <div className="mt-10 p-5 rounded-[16px] bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-soft text-accent border border-accent-border">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-foreground block text-sm">
                    Verifiable Academic Integrity
                  </span>
                  <span>
                    Direct repository integration ensures accurate git commit attribution, reducing free-riding in student group work.
                  </span>
                </div>
              </div>
              <Link
                href="/about"
                className="font-semibold text-accent hover:text-accent-hover shrink-0 inline-flex items-center gap-1"
              >
                Learn how it works <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Hackathon Section */}
        <section id="hackathons" className="py-20 sm:py-28 bg-card text-foreground relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent-border text-xs font-semibold mb-3">
                  <Trophy className="w-3.5 h-3.5 text-accent" />
                  Campus & Global Hackathons
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Turn Ideas Into Real-World Solutions
                </h2>
                <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                  Supercharge university hackathons with streamlined team registrations, challenge tracks, GitHub project submissions, and structured judging panels.
                </p>
              </div>

              <div>
                <Button
                  href="/hackathons"
                  variant="primary"
                  size="md"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Hackathons
                </Button>
              </div>
            </div>

            {/* Hackathon Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sampleHackathons.map((hackathon) => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
          </div>
        </section>

        {/* AI Evaluation Section */}
        <section id="ai-evaluation" className="py-20 sm:py-28 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="teal" size="md" className="mb-3">
                Intelligent Academic Assistant
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                AI-Assisted Evaluation for Faculty & Supervisors
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
                Empower educators with instant code rubric analysis, architecture reviews, and team contribution audits while preserving academic rigor.
              </p>
            </div>

            {/* Interactive Evaluation Mock Interface */}
            <div className="max-w-5xl mx-auto">
              <EvaluationPreview />
            </div>

            {/* Key Evaluation Principles */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-5 rounded-[16px] bg-card border border-border">
                <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent border border-accent-border flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Defined Academic Rubrics</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Configure custom criteria such as ABET outcomes, test coverage thresholds, and software design patterns.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-card border border-border">
                <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent border border-accent-border flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Fair Contribution Auditing</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Evaluate individual commit velocity and pull requests to ensure balanced group participation.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-card border border-border">
                <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent border border-accent-border flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Human-in-the-Loop Authority</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  AI provides actionable evaluation insights, but final academic marks and decisions always remain with professors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* E. Final CTA */}
        <section className="py-20 sm:py-24 bg-card border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[16px] bg-background text-foreground p-8 sm:p-12 lg:p-16 text-center overflow-hidden shadow-2xl border border-border">
              <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent-border text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Academic Excellence with AI
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                  Bring Your University&apos;s Projects Into One Workspace.
                </h2>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Join leading academic institutions streamlining course deliverables, student git accountability, and hackathon innovation.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button
                    href="/register"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Register Your University
                  </Button>
                  <Button
                    href="/login"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                  >
                    Sign In
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Dedicated institutional workspaces with role-based access for students, lecturers, and administrators.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* F. Footer */}
      <Footer />
    </div>
  );
}
