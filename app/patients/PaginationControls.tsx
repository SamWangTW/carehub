"use client";

import { useMemo, useTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
  disabled?: boolean;
};

export default function PaginationControls({ page, totalPages, disabled }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [localLoading, setLocalLoading] = useState(false);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseQuery = useMemo(() => {
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  // when URL updates, turn off localLoading
  useEffect(() => {
    setLocalLoading(false);
  }, [searchParams]);

  function goTo(nextPage: number) {
    const qp = new URLSearchParams(baseQuery);
    qp.set("page", String(nextPage));

    // immediately show loading UI
    setLocalLoading(true);

    startTransition(() => {
      router.push(`${pathname}?${qp.toString()}`);
    });
  }

  const isDisabled = disabled || isPending || localLoading;

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-50"
        onClick={() => goTo(page - 1)}
        disabled={isDisabled || !canPrev}
      >
        Prev
      </button>

      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
        {(isPending || localLoading) ? (
          <span className="ml-2 opacity-70">Loading…</span>
        ) : null}
      </div>

      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-50"
        onClick={() => goTo(page + 1)}
        disabled={isDisabled || !canNext}
      >
        Next
      </button>
    </div>
  );
}