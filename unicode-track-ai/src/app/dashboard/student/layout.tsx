import React from "react";
import { StudentShell } from "@/components/student/StudentShell";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
