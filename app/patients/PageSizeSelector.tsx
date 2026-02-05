"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { selectStyle, optionStyle, controlLabelStyle } from "./filterStyles";

const OPTIONS = [10, 20, 50] as const;

export default function PageSizeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentLimit = useMemo(() => {
    const raw = searchParams.get("limit");
    const n = raw ? Number(raw) : 10;
    return OPTIONS.includes(n as any) ? (n as (typeof OPTIONS)[number]) : 10;
  }, [searchParams]);

  function onChange(nextLimit: number) {
    const qp = new URLSearchParams(searchParams.toString());
    qp.set("limit", String(nextLimit));
    qp.set("page", "1"); // ✅ reset page when page size changes

    startTransition(() => {
      router.push(`${pathname}?${qp.toString()}`);
    });
  }

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={controlLabelStyle}>Page size</span>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={currentLimit}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={isPending}
          style={selectStyle}
        >
          {OPTIONS.map((n) => (
            <option key={n} value={n} style={optionStyle}>
              {n}
            </option>
          ))}
        </select>

        {isPending ? <span style={{ opacity: 0.7 }}>Loading…</span> : null}
      </div>
    </label>
  );
}