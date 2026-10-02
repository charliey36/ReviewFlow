'use client';

import { deactivateService } from './actions';

export function DeactivateServiceButton({ serviceId }: { serviceId: string }) {
  return (
    <button
      onClick={() => deactivateService(serviceId)}
      className="text-xs font-medium text-slate-400 hover:text-red-600"
    >
      Remove
    </button>
  );
}
