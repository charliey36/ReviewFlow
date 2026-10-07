'use client';

import { ConfirmActionButton } from '@/components/ui/confirm-action-button';
import { deleteSegment } from './actions';

export function DeleteSegmentButton({ segmentId, segmentName }: { segmentId: string; segmentName: string }) {
  return (
    <ConfirmActionButton
      label="Delete"
      ariaLabel={`Delete segment ${segmentName}`}
      onConfirm={() => deleteSegment(segmentId)}
    />
  );
}
