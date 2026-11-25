import React from "react";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface HackathonData {
  id: string;
  title: string;
  organizer: string;
  description: string;
  status: "Registration Open" | "Starts in 3 Days" | "Upcoming" | "Judging Phase";
  dates: string;
  duration: string;
  prizePool: string;
  teamCount: number;
  categories: string[];
  location: string;
  registrationDeadline: string;
}

export function HackathonCard({ hackathon }: { hackathon: HackathonData }) {
  const getStatusBadge = (status: HackathonData["status"]) => {
    switch (status) {
      case "Registration Open":
        return <Badge variant="teal" dot>Registration Open</Badge>;
      case "Starts in 3 Days":
        return <Badge variant="warning" dot>Starts Soon</Badge>;
      case "Upcoming":
        return <Badge variant="outline">Upcoming</Badge>;
      case "Judging Phase":
        return <Badge variant="navy">Judging Phase</Badge>;
    }
  };

  return (
    <div className="bg-card border border-border rounded-[16px] p-6 sm:p-7 flex flex-col justify-between hover:border-accent/40 transition-all duration-200 group relative overflow-hidden text-foreground">
      {/* Subtle top accent glow highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top Badges: Status + Prize Pool */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {getStatusBadge(hackathon.status)}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-accent text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span>{hackathon.prizePool}</span>
          </div>
        </div>

        {/* Title & Organizer */}
        <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-accent transition-colors">
          {hackathon.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Organized by <span className="text-foreground font-medium">{hackathon.organizer}</span>
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {hackathon.description}
        </p>

        {/* Categories / Tracks */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {hackathon.categories.map((cat, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-medium"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-6 pt-5 border-t border-border space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{hackathon.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{hackathon.teamCount} Teams registered</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">
              Registration deadline: <strong className="text-foreground font-semibold font-mono">{hackathon.registrationDeadline}</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          href="/register"
          variant="primary"
          size="md"
          className="w-full justify-center group-hover:bg-[#0D9488]"
          iconRight={<ArrowRight className="w-4 h-4" />}
        >
          Register Team
        </Button>
      </div>
    </div>
  );
}
