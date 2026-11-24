"use client";

import React, { Suspense } from "react";
import { CreateProjectPrototypeForm } from "@/components/projects/CreateProjectPrototypeForm";

export default function CreateProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1100px] mx-auto py-12 px-4 text-center text-slate-400 text-sm font-sans">
          Loading project creation wizard...
        </div>
      }
    >
      <div className="py-2">
        <CreateProjectPrototypeForm standalone />
      </div>
    </Suspense>
  );
}
