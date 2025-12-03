'use client';

import { useState } from 'react';
import { setAutoApproveStatus } from '@/app/actions/settings';

interface AutoApproveToggleProps {
  initialValue: boolean;
}

export function AutoApproveToggle({ initialValue }: AutoApproveToggleProps) {
  const [enabled, setEnabled] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const newValue = !enabled;
    const result = await setAutoApproveStatus(newValue);

    if ('error' in result && result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setEnabled(newValue);
      setSuccess(true);
      setIsLoading(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-so-black">
            Auto-Approve Posts
          </h3>
          <p className="text-sm text-gray-600">
            When enabled, new questions and answers will be automatically
            approved without moderation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-so-blue focus:ring-offset-2 ${
            enabled ? 'bg-so-blue' : 'bg-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">
            ✓ Settings updated successfully
          </p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>
          <strong>Current status:</strong>{' '}
          {enabled ? (
            <span className="text-green-600 font-medium">
              Auto-approve enabled
            </span>
          ) : (
            <span className="text-orange-600 font-medium">
              Manual moderation required
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
