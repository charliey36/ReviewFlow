'use client';

import { useEffect, useRef } from 'react';
import { useActionToast } from '@/components/toast';
import { useFormState } from 'react-dom';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { createSegment, type SegmentFormResult } from './actions';

export function CreateSegmentForm() {
  const [state, formAction] = useFormState<SegmentFormResult, FormData>(createSegment, {});
  useActionToast(state, { title: 'Segment created', description: 'Matching customers are included automatically.' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.6fr_0.8fr_1fr_auto] lg:items-end"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="name" className="label">
          Segment name
        </label>
        <input id="name" name="name" type="text" required className="input mt-1.5" placeholder="Lapsed high-value" />
      </div>

      <div>
        <label htmlFor="field" className="label">
          Field
        </label>
        <select id="field" name="field" className="input mt-1.5" defaultValue="days_since_last_visit">
          <option value="days_since_last_visit">Days since last visit</option>
          <option value="lifetime_value">Lifetime value</option>
          <option value="visit_count">Visit count</option>
          <option value="tag">Tag</option>
        </select>
      </div>

      <div>
        <label htmlFor="operator" className="label">
          Operator
        </label>
        <select id="operator" name="operator" className="input mt-1.5" defaultValue="gte">
          <option value="gt">&gt;</option>
          <option value="gte">&ge;</option>
          <option value="lt">&lt;</option>
          <option value="lte">&le;</option>
          <option value="eq">=</option>
        </select>
      </div>

      <div>
        <label htmlFor="value" className="label">
          Value
        </label>
        <input id="value" name="value" type="text" required className="input mt-1.5" placeholder="60" />
      </div>

      <SubmitButton pendingText="Creating…" className="sm:col-span-2 lg:col-span-1">
        Create segment
      </SubmitButton>

      {state.error && <Notice variant="error" className="sm:col-span-2 lg:col-span-5">{state.error}</Notice>}
    </form>
  );
}
