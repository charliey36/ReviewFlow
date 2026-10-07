'use client';

import { ConfirmActionButton } from '@/components/ui/confirm-action-button';
import { deactivateService } from './actions';

export function DeactivateServiceButton({ serviceId, serviceName }: { serviceId: string; serviceName: string }) {
  return (
    <ConfirmActionButton
      label="Remove"
      ariaLabel={`Remove service ${serviceName}`}
      onConfirm={() => deactivateService(serviceId)}
    />
  );
}
