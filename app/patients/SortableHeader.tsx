"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { controlLabelStyle } from "./filterStyles";

type SortOrder = "asc" | "desc";

export default function SortableHeader({
  label,
  sortKey,
}: {
  label: string;
  sortKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { active, order } = useMemo(() => {
    const sortBy = searchParams.get("sortBy") ?? "";
    const sortOrder = (searchParams.get("sortOrder") ?? "asc") as SortOrder;
    return {
      active: sortBy === sortKey,
      order: sortOrder === "desc" ? "desc" : "asc",
    };
  }, [searchParams, sortKey]);

  function onClick() {
    const qp = new URLSearchParams(searchParams.toString());

    const currentSortBy = qp.get("sortBy") ?? "";
    const currentOrder = (qp.get("sortOrder") ?? "asc") as SortOrder;

    if (currentSortBy === sortKey) {
      // toggle asc <-> desc
      qp.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
    } else {
      // new sort column => default asc
      qp.set("sortBy", sortKey);
      qp.set("sortOrder", "asc");
    }

    // sorting changes result set => go back to page 1
    qp.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${qp.toString()}`);
    });
  }

  const arrow = active ? (order === "asc" ? "▲" : "▼") : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      title="Sort"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "inherit",
        font: "inherit",
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ ...controlLabelStyle, lineHeight: 1 }}>{arrow}</span>
    </button>
  );
}
