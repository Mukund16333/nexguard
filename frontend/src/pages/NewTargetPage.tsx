import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TargetCreateInput } from '../lib/types';
import { useTargets } from '../hooks/useTargets';
import { PageHeader } from '../components/common/PageHeader';
import { TargetForm } from '../components/targets/TargetForm';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const NewTargetPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTarget } = useTargets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (input: TargetCreateInput) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createTarget(input);
      setSuccessMessage(`Target "${created.display_name}" registered successfully.`);
      setTimeout(() => {
        navigate(`/targets/${created.target_id}`);
      }, 1000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to create deployment target');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Register Deployment Target"
        subtitle="Configure a cloud endpoint, host alias, and version marker for automated validation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Targets', href: '/targets' },
          { label: 'Register Target' },
        ]}
      />

      {successMessage && (
        <div className="p-4 rounded-xl border border-status-pass/30 bg-status-pass-bg text-status-pass text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage} Redirecting to target details...</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-xl border border-status-fail/30 bg-status-fail-bg text-status-fail text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <TargetForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Register &amp; Validate Target"
      />
    </div>
  );
};
