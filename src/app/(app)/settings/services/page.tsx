import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { AddServiceForm } from './add-service-form';
import { DeactivateServiceButton } from './deactivate-service-button';

export default async function ServicesPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Services</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Define your services and how often customers typically need to rebook. This drives
        automated rebooking reminders on the customer detail page.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900">Add a service</h2>
        <div className="mt-4">
          <AddServiceForm />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Rebook after
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Default price
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services && services.length > 0 ? (
              services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{service.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {service.recurrence_interval_days ? `${service.recurrence_interval_days} days` : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {service.default_price != null ? `$${service.default_price.toFixed(2)}` : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeactivateServiceButton serviceId={service.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No services yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
