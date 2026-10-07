import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

/** In-shell 404 (e.g. a customer that doesn't exist) - keeps the sidebar. */
export default function AppNotFound() {
  return (
    <div className="card mx-auto mt-6 max-w-lg">
      <EmptyState
        icon="search"
        title="We couldn't find that"
        description="The page or record you're looking for doesn't exist, or you don't have access to it."
        action={
          <>
            <Link href="/dashboard" className="btn btn-primary">
              Go to dashboard
            </Link>
            <Link href="/customers" className="btn btn-secondary">
              View customers
            </Link>
          </>
        }
      />
    </div>
  );
}
