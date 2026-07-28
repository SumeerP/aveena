import React, { useState, useMemo, useContext } from 'react';
import { AppCtx } from '../state/context.js';
import { Btn, Stat } from './common/ui.jsx';
import { Detail } from './detail/Detail.jsx';
import { Pipeline } from './pipeline/Pipeline.jsx';
import { NewOppModal } from './pipeline/NewOppModal.jsx';
import { STAGES, stageIndex } from '../constants/stages.js';
import { ROLES } from '../constants/roles.js';
import { now, daysBetween } from '../domain/dates.js';
import { pendingForRole } from '../domain/queue.js';
import { clearPersisted } from '../state/storage.js';

export function InternalShell() {
  const { state, dispatch } = useContext(AppCtx);
  const me = state.session;
  const [view, setView] = useState({ page: "list", id: null });
  const [filter, setFilter] = useState("mine");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const opps = state.opportunities;
  const stats = useMemo(() => {
    const active = opps.filter((o) => o.stage !== "shipped");
    const overdue = active.filter((o) => {
      const st = STAGES[stageIndex(o.stage)];
      return st.sla > 0 && daysBetween(o.stageEnteredAt, now()) > st.sla;
    });
    const done = opps.filter((o) => o.stage === "shipped");
    const avgCycle = done.length
      ? Math.round(done.reduce((a, o) => a + daysBetween(o.createdAt, o.stageEnteredAt), 0) / done.length)
      : null;
    const mine = opps.reduce((a, o) => a + (pendingForRole(o, me.role).length > 0 ? 1 : 0), 0);
    return { active: active.length, overdue: overdue.length, avgCycle, mine };
  }, [opps, me.role]);

  const open = opps.find((o) => o.id === view.id);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-red-900 text-red-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif text-lg whitespace-nowrap">Boston Baking Co.</span>
            <span className="font-mono text-[10px] tracking-widest text-red-200 uppercase hidden sm:inline">Discovery → Manufacturing</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm">{me.name}</div>
              <div className="text-[11px] text-red-200">{ROLES[me.role].label}</div>
            </div>
            <button onClick={() => dispatch({ type: "LOGOUT" })} className="text-xs border border-red-700 rounded px-2 py-1 hover:bg-red-800">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view.page === "detail" && open ? (
          <Detail
            opp={open}
            me={me}
            dispatch={dispatch}
            allOpps={opps}
            onOpen={(id) => setView({ page: "detail", id })}
            onBack={() => setView({ page: "list", id: null })}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat label="Waiting on you" value={stats.mine} accent />
              <Stat label="Active opportunities" value={stats.active} />
              <Stat label="Over SLA" value={stats.overdue} danger={stats.overdue > 0} />
              <Stat label="Avg cycle (done)" value={stats.avgCycle != null ? stats.avgCycle + "d" : "—"} sub="target 7d" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 bg-stone-200 rounded-lg p-1">
                  {[
                    ["mine", "My queue"],
                    ["all", "All opportunities"],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`px-3 py-1.5 text-sm rounded-md ${filter === k ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    className="border border-stone-300 rounded-lg pl-3 pr-8 py-1.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-400 w-56"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search customer, product, ID…"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-sm">
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {me.role === "sales_poc" && <Btn tone="accent" onClick={() => setShowNew(true)}>+ New opportunity</Btn>}
                <Btn tone="ghost" onClick={async () => { await clearPersisted(); dispatch({ type: "RESET_DATA" }); }}>
                  Reset demo data
                </Btn>
              </div>
            </div>

            <Pipeline opps={opps} me={me} filter={filter} query={query} onOpen={(id) => setView({ page: "detail", id })} />
          </>
        )}
      </main>

      {showNew && <NewOppModal me={me} dispatch={dispatch} opps={opps} onClose={() => setShowNew(false)} />}
    </div>
  );
}
