"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
  // optional: keep buttons stable while server is re-rendering
  disabled?: boolean;
};

export default function PaginationControls({ page, totalPages, disabled }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseQuery = useMemo(() => {
    // clone current query so we preserve filters/sort/limit/etc.
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  function goTo(nextPage: number) {
    const qp = new URLSearchParams(baseQuery);
    qp.set("page", String(nextPage));
    router.push(`${pathname}?${qp.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-50"
        onClick={() => goTo(page - 1)}
        disabled={disabled || !canPrev}
      >
        Prev
      </button>

      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </div>

      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-50"
        onClick={() => goTo(page + 1)}
        disabled={disabled || !canNext}
      >
        Next
      </button>
    </div>
  );
}
