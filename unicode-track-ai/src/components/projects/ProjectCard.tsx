import React from "react";
import { 
  Calendar, 
  FolderGit2, 
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ProjectCardData {
  title: string;
  course: string;
  department: string;
  teamName: string;
  teamMembers: { name: string; avatar: string; role: string }[];
  progress: number;
  nextMilestone: string;
  milestoneDue: string;
  supervisor: string;
  supervisorRole: string;
  status: "On Track" | "Needs Review" | "Ahead of Schedule";
  repoName: string;
  totalCommits: number;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const getStatusBadge = (status: ProjectCardData["status"]) => {
    switch (status) {
      case "On Track":
        return <Badge variant="teal" dot>On Track</Badge>;
      case "Ahead of Schedule":
        return <Badge variant="success" dot>Ahead of Schedule</Badge>;
      case "Needs Review":
        return <Badge variant="warning" dot>Review Ready</Badge>;
    }
  };

  return (
    <div className="bg-card rounded-[16px] border border-border p-6 sm:p-7 hover:border-accent/40 transition-all duration-200">
      {/* Header: Course badge, Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
            {project.course}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {project.department}
          </span>
        </div>
        {getStatusBadge(project.status)}
      </div>

      {/* Project Title */}
      <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-accent transition-colors">
        {project.title}
      </h3>

      {/* Team & Members */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            {project.teamMembers.map((member, i) => (
              <div
                key={i}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-card bg-muted text-foreground text-xs font-bold"
                title={`${member.name} (${member.role})`}
              >
                {member.avatar}
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{project.teamName}</p>
            <p className="text-[11px] text-muted-foreground">{project.teamMembers.length} members collaborating</p>
          </div>
        </div>

        {/* GitHub stats pill */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
          <FolderGit2 className="w-3.5 h-3.5 text-accent" />
          <span>{project.repoName}</span>
          <span className="text-border">•</span>
          <span>{project.totalCommits} commits</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Project Progress</span>
          <span className="font-bold text-foreground font-mono">{project.progress}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[var(--accent-deep)] to-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Next Milestone & Supervisor Details */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border text-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Next Milestone
          </span>
          <p className="font-medium text-foreground leading-snug">{project.nextMilestone}</p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            Due: {project.milestoneDue}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Project Supervisor
          </span>
          <p className="font-medium text-foreground leading-snug flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-accent" />
            {project.supervisor}
          </p>
          <span className="text-[11px] text-muted-foreground block mt-1">
            {project.supervisorRole}
          </span>
        </div>
      </div>
    </div>
  );
}
