import React, { useState } from 'react';
import type { OrgDataset } from '../types';

interface FeedbackViewProps {
  org: OrgDataset;
  onSubmitFeedback: (payload: {
    category: string;
    sentiment: string;
    message: string;
    departmentScope: string;
  }) => Promise<void>;
  onUpvoteFeedback: (id: string) => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  org,
  onSubmitFeedback,
  onUpvoteFeedback,
  onTriggerToast,
}) => {
  const [category, setCategory] = useState('Work Conditions');
  const [sentiment, setSentiment] = useState('Constructive');
  const [departmentScope, setDepartmentScope] = useState(
    `${org.name} All Crew (k ≥ 15 workers)`
  );
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSubmitFeedback({
      category,
      sentiment,
      message: message.trim(),
      departmentScope,
    });
    setMessage('');
    onTriggerToast('Anonymous feedback recorded in unlinked zero-knowledge store');
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
          <span>Workspace</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-secondary font-semibold">Anonymous Feedback</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Zero-Knowledge Workplace Feedback
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Share candid observations on work conditions, scheduling, and amenities. Stored separately from identifiable employee records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left: Submission Form (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">visibility_off</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary">
                Submit Unlinked Feedback
              </h2>
              <span className="font-label-sm text-label-sm text-on-tertiary-container">
                k-Anonymity Threshold Active (Min. 15 workers per group)
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-space-md">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Feedback Theme
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
              >
                <option value="Work Conditions">Work Conditions</option>
                <option value="Safety & PPE">Safety &amp; PPE</option>
                <option value="Shift Scheduling">Shift Scheduling</option>
                <option value="Management Respect">Management Respect</option>
                <option value="Facilities & Hygiene">Facilities &amp; Hygiene</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-space-sm">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  Tone / Sentiment
                </label>
                <select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                >
                  <option value="Constructive">Constructive</option>
                  <option value="Positive">Positive</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">
                  Aggregation Cohort
                </label>
                <select
                  value={departmentScope}
                  onChange={(e) => setDepartmentScope(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                >
                  <option value={`${org.name} All Crew (k ≥ 15 workers)`}>
                    All Site Crew (k ≥ 15)
                  </option>
                  <option value="Day Shift Roster Cohort (k ≥ 25 workers)">
                    Day Shift Cohort (k ≥ 25)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Your Observation *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what is working well or what needs improvement. Avoid including your name or unique personal details in the text..."
                className="w-full p-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container resize-none"
              />
            </div>

            {/* Honest Privacy Disclosure Note (PRD FR-05) */}
            <div className="p-space-sm rounded-lg bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                privacy_tip
              </span>
              <p>
                <strong>Transparency &amp; Privacy Safeguard:</strong> FairShift strips your employee ID and session token before storing feedback. Please avoid typing uniquely identifying details (such as your name or exact punch minute) in free-text responses.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-lg text-label-lg transition-all cursor-pointer"
            >
              Submit Anonymous Feedback
            </button>
          </form>
        </div>

        {/* Right: Aggregated Feedback Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  Aggregated Workforce Themes
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Visible to workers and HR only when cohort size meets k-anonymity rules (k ≥ 15)
                </p>
              </div>
            </div>

            <div className="space-y-space-md">
              {org.feedback.map((item) => (
                <div
                  key={item.id}
                  className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold">
                        {item.category}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {item.departmentScope}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {item.createdAt}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">{item.message}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-label-sm text-label-sm text-on-tertiary-container flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> Identity
                      Unlinked
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpvoteFeedback(item.id);
                        onTriggerToast('Supported anonymous workforce theme');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        thumb_up
                      </span>
                      <span className="tabular-nums">Agree ({item.upvotes})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
