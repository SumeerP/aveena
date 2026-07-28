import React from 'react';
import { STAGES, stageIndex } from '../../constants/stages.js';
import { now, daysBetween } from '../../domain/dates.js';

export function ProofingRail({ opp }) {
  const idx = stageIndex(opp.stage);
  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-max">
        {STAGES.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          const stageDays = current ? daysBetween(opp.stageEnteredAt, now()) : null;
          const overdue = current && s.sla > 0 && stageDays > s.sla;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center w-24">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    done
                      ? "bg-red-700 border-red-700"
                      : current
                      ? overdue
                        ? "bg-red-600 border-red-600"
                        : "bg-white border-red-700"
                      : "bg-white border-stone-300"
                  }`}
                />
                <div
                  className={`mt-1.5 text-[11px] leading-tight text-center ${
                    current ? "font-semibold text-stone-900" : done ? "text-stone-600" : "text-stone-400"
                  }`}
                >
                  {s.label}
                </div>
                {current && s.sla > 0 && (
                  <div className={`text-[10px] font-mono ${overdue ? "text-red-700 font-semibold" : "text-stone-500"}`}>
                    d{stageDays}/{s.sla} {overdue ? "· over SLA" : ""}
                  </div>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-0.5 w-8 -mt-6 ${i < idx ? "bg-red-700" : "bg-stone-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Sign-in ---------- */
