/**
 * Hook for future review automation. Called after every imported service
 * visit. Intentionally does not schedule anything yet: scheduling (using the
 * review window in eligibility.ts + scheduleReviewRequest) will be wired in here.
 */
export async function processServiceVisit(visit: {
  businessId: string;
  customerId: string;
  visitId: string;
  serviceDate: string;
}): Promise<void> {
  console.log('[ReviewAutomationService.ProcessServiceVisit]', visit);
}
