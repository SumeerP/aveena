import React, { useState } from 'react';
import { inputCls, Btn } from '../common/ui.jsx';
import { userName, userRoleShort } from '../../domain/users.js';
import { fmtDateTime } from '../../domain/dates.js';

export function Discussion({ opp, me, dispatch }) {
  const [text, setText] = useState("");
  const msgs = opp.discussion || [];
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-serif text-base text-stone-900">Discussion</h3>
        <span className="text-[11px] uppercase tracking-wider text-stone-400">All roles</span>
      </div>
      {msgs.length === 0 ? (
        <div className="text-sm text-stone-500 mb-3">No messages yet. Ask a question about this customer request — every role on this opportunity can see and reply.</div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-3">
          {msgs.map((m, i) => {
            const mine = m.by === me.id;
            return (
              <div key={i} className={mine ? "pl-8" : "pr-8"}>
                <div className={`rounded-lg px-3 py-2 text-sm ${mine ? "bg-red-50 border border-red-100" : "bg-stone-100 border border-stone-200"}`}>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-medium text-stone-900">{userName(m.by)}</span>
                    <span className="text-[11px] text-red-800">{userRoleShort(m.by)}</span>
                    <span className="text-[11px] text-stone-400 ml-auto">{fmtDateTime(m.at)}</span>
                  </div>
                  <div className="text-stone-800">{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              dispatch({ type: "ADD_DISCUSSION", payload: { id: opp.id, by: me.id, text: text.trim() } });
              setText("");
            }
          }}
          placeholder="Ask the team a question…"
        />
        <Btn small disabled={!text.trim()} onClick={() => { dispatch({ type: "ADD_DISCUSSION", payload: { id: opp.id, by: me.id, text: text.trim() } }); setText(""); }}>
          Post
        </Btn>
      </div>
    </div>
  );
}
