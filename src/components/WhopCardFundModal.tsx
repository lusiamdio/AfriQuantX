import React from 'react';

export interface WhopCardFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (fundedData: any) => void;
  defaultCardNumber?: string;
  defaultCardName?: string;
}

export function WhopCardFundModal({ isOpen, onClose }: WhopCardFundModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="funding-title">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h2 id="funding-title" className="text-xl font-bold">Card funding unavailable</h2>
        <p className="mt-3 text-sm text-zinc-300">Card funding is not supported in this prototype. No payment will be made.</p>
        <button className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
