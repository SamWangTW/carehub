// app/patients/loading.tsx
export default function LoadingPatients() {
  return (
    <div className="p-6 space-y-4">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-9 w-28 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Filters bar skeleton */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="h-9 w-36 rounded bg-gray-200 animate-pulse" />
        <div className="h-9 w-36 rounded bg-gray-200 animate-pulse" />
        <div className="h-9 w-44 rounded bg-gray-200 animate-pulse" />
        <div className="h-9 w-44 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b bg-gray-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>

        {Array.from({ length: 10 }).map((_, r) => (
          <div
            key={r}
            className="grid grid-cols-6 gap-4 px-4 py-3 border-b last:border-b-0"
          >
            {Array.from({ length: 6 }).map((__, c) => (
              <div key={c} className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-9 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}