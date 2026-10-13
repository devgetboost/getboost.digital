import { Fragment } from 'react';

/**
 * R18.9 — MiniFlow: a compact step diagram (nodes + drifting connectors).
 * Vertical on mobile, horizontal from sm up. Connectors are aria-hidden
 * decoration; node labels are real readable text tinted by the area.
 * Hover on a node lifts it slightly (CSS only — no state, no JS).
 */
export const MiniFlow = ({
  steps,
  tint,
  strong,
  flowColor,
  badges,
}: {
  steps: string[];
  /** Node wash, e.g. `var(--gb-ai-tint)`. */
  tint: string;
  /** Node text/dot colour, e.g. `var(--gb-ai-strong)`. */
  strong: string;
  /** Connector colour, e.g. `var(--gb-ai-strong)`. */
  flowColor?: string;
  /** Optional status badges rendered under the flow (AI: Online, 24/7…). */
  badges?: string[];
}) => (
  <div className="mt-5">
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
      {steps.map((step, i) => (
        <Fragment key={step}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className="gb-flow-connector"
              style={{ ['--gb-flow-color' as string]: flowColor ?? strong }}
            />
          )}
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-transform duration-150 hover:-translate-y-px"
            style={{ background: tint, borderColor: tint, color: strong }}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: strong }} />
            {step}
          </span>
        </Fragment>
      ))}
    </div>
    {badges?.length ? (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
            {badge}
          </span>
        ))}
      </div>
    ) : null}
  </div>
);
