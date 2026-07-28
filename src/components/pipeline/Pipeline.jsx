import React from 'react';
import { Badge } from '../common/ui.jsx';
import { STAGES, stageIndex } from '../../constants/stages.js';
import { now, daysBetween } from '../../domain/dates.js';
import { pendingForRole } from '../../domain/queue.js';
import { userRoleShort } from '../../domain/users.js';

export function Pipeline({ opps, me, onOpen, filter, query }) {
  const q = (query || "").trim().toLowerCase();
  const searched = q
    ? opps.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.contact.name.toLowerCase().includes(q)
      )
    : opps;
  const base = filter === "mine" ? searched.filter((o) => pendingForRole(o, me.role).length > 0) : searched;
  // Returned work floats to the top — it's the most urgent thing in any queue.
  const list = [...base].sort((a, b) => {
    const ra = a.returnInfo ? 1 : 0;
    const rb = b.returnInfo ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return 0;
  });
  if (list.length === 0)
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-lg p-10 text-center text-stone-500 text-sm">
        {q
          ? `No customer requests match "${query}"${filter === "mine" ? " in your queue — try All opportunities" : ""}.`
          : filter === "mine"
          ? "Nothing is waiting on you right now. The system will surface hand-offs here as they arrive."
          : "No opportunities yet. Create one to start discovery."}
      </div>
    );
  return (
    <div className="space-y-2">
      {list.map((o) => {
        const idx = stageIndex(o.stage);
        const st = STAGES[idx];
        const stageDays = daysBetween(o.stageEnteredAt, now());
        const overdue = st.sla > 0 && stageDays > st.sla && o.stage !== "manufacturing";
        const tasks = pendingForRole(o, me.role);
        return (
          <button
            key={o.id}
            onClick={() => onOpen(o.id)}
            className="w-full text-left bg-white border border-stone-200 hover:border-red-400 rounded-lg p-4 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-red-800">{o.id}</span>
                <span className="font-serif text-lg text-stone-900 truncate">{o.customer}</span>
                {opps.filter((x) => x.contact.email.toLowerCase() === o.contact.email.toLowerCase()).length > 1 && (
                  <span className="text-[11px] text-stone-400 whitespace-nowrap">↻ repeat</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(o.discussion || []).length > 0 && (
                  <span className="text-xs text-stone-400 font-mono">💬 {(o.discussion || []).length}</span>
                )}
                {o.returnInfo && <Badge tone="red">returned · {userRoleShort(o.returnInfo.by)}</Badge>}
                {o.formulations.status === "blocked" && <Badge tone="red">formulations blocked</Badge>}
                {o.formulations.requested && o.formulations.status === "pending" && <Badge tone="blue">formulations</Badge>}
                {overdue && <Badge tone="red">over SLA · d{stageDays}/{st.sla}</Badge>}
                <Badge tone={o.stage === "shipped" ? "green" : o.stage === "manufacturing" ? "blue" : "amber"}>{st.label}</Badge>
              </div>
            </div>
            <div className="text-sm text-stone-600 mt-1 truncate">{o.product}</div>
            <div className="mt-2 flex items-center gap-1">
              {STAGES.map((s, i) => (
                <div key={s.key} className={`h-1 flex-1 rounded-full ${i < idx ? "bg-red-600" : i === idx ? (overdue ? "bg-red-500" : "bg-red-300") : "bg-stone-200"}`} />
              ))}
            </div>
            {tasks.length > 0 && <div className="text-xs text-amber-800 mt-2">Waiting on you: {tasks.join(" · ")}</div>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Customer portal ---------- */
