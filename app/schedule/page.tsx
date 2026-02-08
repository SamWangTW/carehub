import { Suspense } from "react";
import SchedulerClient from "./SchedulerClient";

export default function SchedulePage() {
  return (
    <main style={{ padding: 24 }}>
      <Suspense fallback={<div style={{ color: "#9aa0a6" }}>Loading schedule...</div>}>
        <SchedulerClient />
      </Suspense>
    </main>
  );
}
