export default function EventsSkeleton() {
  return (
    <div className="space-y-5 p-4 lg:p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-48 rounded-md bg-gray-100" />
        </div>

        <div className="h-10 w-36 rounded-xl bg-gray-200" />
      </div>

      {/* Event Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="card p-5"
          >
            {/* Title + Badge */}
            <div className="mb-3 flex items-start justify-between">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>

            {/* Location */}
            <div className="h-3 w-28 rounded bg-gray-100" />

            {/* Date */}
            <div className="mt-3 h-3 w-36 rounded bg-gray-100" />

            {/* Sessions */}
            <div className="mt-4 h-3 w-20 rounded bg-indigo-100" />
          </div>
        ))}
      </div>
    </div>
  );
}