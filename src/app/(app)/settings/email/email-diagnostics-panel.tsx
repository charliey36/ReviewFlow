'use client';

import { useEffect, useState } from 'react';
import type { ResendDiagnostics } from '@/lib/email-sandbox';

export function EmailDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<ResendDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-diagnostics');
      const data = await response.json();
      if (data.success) {
        setDiagnostics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestLoading(true);
      setTestMessage(null);
      const response = await fetch('/api/send-test-email', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setTestMessage({
          type: 'success',
          text: `Test email sent to ${diagnostics?.senderAddress}. Check your email to confirm delivery.`,
        });
        setTimeout(fetchDiagnostics, 1000);
      } else {
        setTestMessage({
          type: 'error',
          text: data.error || 'Failed to send test email',
        });
      }
    } catch (error) {
      setTestMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send test email',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-600">Loading email configuration...</div>;
  }

  if (!diagnostics) {
    return <div className="text-sm text-red-600">Failed to load email diagnostics</div>;
  }

  const statusColor = diagnostics.connected ? 'text-green-600' : 'text-red-600';
  const statusIcon = diagnostics.connected ? '✅' : '❌';
  const modeIcon = diagnostics.mode === 'sandbox' ? '🧪' : diagnostics.mode === 'production' ? '🚀' : '❓';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-slate-900">Email Provider Status</h4>
            <p className={`text-sm ${statusColor}`}>
              {statusIcon} {diagnostics.connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Mode</label>
              <p className="mt-1 text-sm text-slate-900">
                {modeIcon} {diagnostics.mode === 'sandbox' ? 'Sandbox (Testing)' : diagnostics.mode === 'production' ? 'Production' : 'Unknown'}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Sender Address</label>
              <p className="mt-1 text-sm text-slate-900">{diagnostics.senderAddress}</p>
            </div>
          </div>

          {diagnostics.mode === 'sandbox' && diagnostics.allowedRecipient && (
            <div className="rounded bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Sandbox Mode Active</p>
              <p className="mt-1 text-xs text-amber-800">
                Email can only be sent to <strong>{diagnostics.allowedRecipient}</strong> until a domain is verified.
              </p>
              <p className="mt-2 text-xs text-amber-700">
                To send emails to customers, verify a domain at{' '}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">
                  resend.com/domains
                </a>
              </p>
            </div>
          )}

          {diagnostics.verifiedDomain && (
            <div className="rounded bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-900">Production Domain Verified</p>
              <p className="mt-1 text-xs text-green-800">Verified domain: {diagnostics.verifiedDomain}</p>
            </div>
          )}

          {diagnostics.error && (
            <div className="rounded bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-900">Configuration Error</p>
              <p className="mt-1 text-xs text-red-800">{diagnostics.error}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          onClick={handleSendTestEmail}
          disabled={testLoading || !diagnostics.connected}
          className="btn btn-secondary btn-sm"
        >
          {testLoading ? 'Sending...' : 'Send Test Email'}
        </button>
        {testMessage && (
          <div className={`mt-2 rounded p-3 text-sm ${testMessage.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
            {testMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
