import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { HackathonCard, HackathonData } from "@/components/hackathons/HackathonCard";
import { Trophy, Plus } from "lucide-react";

export default function HackathonsPage() {
  const hackathons: HackathonData[] = [
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B1220]">
      <Navbar />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-[#0B1220] text-white py-16 sm:py-20 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
                <Trophy className="w-3.5 h-3.5 text-teal-400" />
                University Hackathon Hub
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Turn Ideas Into Real-World Solutions
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
                Discover university sprint challenges, register student teams, submit GitHub repositories, and compete for industry-sponsored awards.
              </p>
            </div>
          </div>
        </section>

        {/* Hackathon List Grid */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-[#0B1220]">
                Featured & Upcoming Competitions
              </h2>
              <p className="text-xs text-slate-500">
                Explore registered university hackathons open for student submissions
              </p>
            </div>

            <Button
              href="/register"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Host a Hackathon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hackathons.map((h) => (
              <HackathonCard key={h.id} hackathon={h} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
