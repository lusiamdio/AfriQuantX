import React from 'react';

interface CompanyOnboardingProps {
  onBack: () => void;
  setActiveTab: (tab: string) => void;
}

export function CompanyOnboarding({ onBack }: CompanyOnboardingProps) {
  return (
    <section className="max-w-3xl mx-auto p-6 text-white" aria-labelledby="company-onboarding-title">
      <h1 id="company-onboarding-title" className="text-2xl font-bold">Company onboarding unavailable</h1>
      <p className="mt-4 text-zinc-300">Company verification and document submission are not available yet.</p>
      <button type="button" onClick={onBack} className="mt-6 rounded-lg bg-white px-4 py-2 font-semibold text-black">Go back</button>
    </section>
  );
}
