"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  LabelList,
  Legend,
} from "recharts";

const PROGRESS_DATA = [
  { name: "Proposal", progress: 100 },
  { name: "ER Diagram", progress: 100 },
  { name: "Backend", progress: 78 },
  { name: "Frontend", progress: 64 },
  { name: "Testing", progress: 35 },
];

const COMMIT_DATA = [
  { week: "W1", commits: 14, aiReviews: 2 },
  { week: "W2", commits: 22, aiReviews: 4 },
  { week: "W3", commits: 19, aiReviews: 3 },
  { week: "W4", commits: 31, aiReviews: 6 },
  { week: "W5", commits: 28, aiReviews: 5 },
  { week: "W6", commits: 36, aiReviews: 7 },
];

export function ProjectProgressChart({
  data = PROGRESS_DATA,
}: {
  data?: { name: string; progress: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748B", fontSize: 12 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#64748B", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--neutral-card)",
              borderColor: "var(--neutral-border)",
              borderRadius: "12px",
              color: "var(--neutral-text)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="progress" name="Completion %" fill="#4F46E5" radius={[8, 8, 0, 0]} maxBarSize={44}>
            <LabelList
              dataKey="progress"
              position="top"
              formatter={(v) => `${v}%`}
              style={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CommitActivityChart({
  data = COMMIT_DATA,
}: {
  data?: { week: string; commits: number; aiReviews: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#64748B", fontSize: 12 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--neutral-card)",
              borderColor: "var(--neutral-border)",
              borderRadius: "12px",
              color: "var(--neutral-text)",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey="commits"
            name="Git Commits"
            stroke="#4F46E5"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#4F46E5" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="aiReviews"
            name="AI Code Reviews"
            stroke="#06B6D4"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={{ r: 4, fill: "#06B6D4" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
