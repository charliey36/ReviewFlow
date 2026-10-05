'use client';

import { deleteSegment } from './actions';

export function DeleteSegmentButton({ segmentId }: { segmentId: string }) {
  return (
    <button
      onClick={() => deleteSegment(segmentId)}
      className="text-xs font-medium text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
    >
      Delete
    </button>
  );
}
