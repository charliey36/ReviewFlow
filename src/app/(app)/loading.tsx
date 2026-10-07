import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown instantly while a page's server data loads, so navigation feels
 * immediate and the layout doesn't jump when content arrives.
 */
export default function AppLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading&hellip;</span>

      <div className="mb-8">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-line">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-3 px-6 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-2 h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
