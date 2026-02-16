import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  const { data: templates } = await supabase
    .from('call_templates')
    .select('*')
    .or(`is_system.eq.true,organization_id.eq.${member?.organization_id || '00000000-0000-0000-0000-000000000000'}`)
    .eq('is_active', true)
    .order('is_system', { ascending: false })
    .order('name');

  const callTypeLabels: Record<string, string> = {
    discovery: 'Discovery', sales: 'Sales', onboarding: 'Onboarding',
    meeting: 'Meeting', follow_up: 'Follow-up', custom: 'Custom',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Call Templates</h1>
          <p className="text-sm text-stone mt-1">Framework templates to guide your conversations</p>
        </div>
        <Link
          href="/calls/templates/new"
          className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 transition-colors"
        >
          New Template
        </Link>
      </div>

      <div className="space-y-3">
        {templates?.map((template) => {
          const phaseCount = Array.isArray(template.phases) ? template.phases.length : 0;
          return (
            <Link
              key={template.id}
              href={`/calls/templates/${template.id}`}
              className="block bg-white rounded-xl border border-stone/10 p-5 hover:border-teal/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-charcoal">{template.name}</h3>
                    {template.is_system && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-teal/10 text-teal rounded-full">System</span>
                    )}
                  </div>
                  <p className="text-sm text-stone mt-1">{template.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone">
                    <span className="px-2 py-0.5 bg-cream rounded">{callTypeLabels[template.call_type] || template.call_type}</span>
                    <span>{phaseCount} phases</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {(!templates || templates.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
            <p className="text-stone text-sm mb-2">No templates yet</p>
            <p className="text-xs text-stone">Ask your admin to seed system templates or create your own.</p>
          </div>
        )}
      </div>
    </div>
  );
}
