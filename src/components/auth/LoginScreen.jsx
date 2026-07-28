import React, { useState } from 'react';
import { USERS, ROLES, DEMO_PASSWORD } from '../../constants/roles.js';
import { Btn, Field, inputCls } from '../common/ui.jsx';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const u = USERS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || pw !== DEMO_PASSWORD) {
      setErr("Email or password doesn't match a demo account.");
      return;
    }
    onLogin(u);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-lg shadow-xl overflow-hidden border border-stone-200">
        <div className="bg-red-900 text-red-50 p-8 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs tracking-widest text-red-200 uppercase">Boston Baking Company</div>
            <h1 className="font-serif text-3xl mt-3 leading-snug">
              Discovery to<br />Manufacturing,<br />in one week.
            </h1>
            <p className="text-sm text-red-100 mt-4 leading-relaxed">
              One portal for opportunity IDs, sample versions, formulations, pricing, specs, labels, and
              final approval — with SLA tracking on every hand-off.
            </p>
          </div>
          <div className="text-xs text-red-200 font-mono mt-8">SLA target: 4 weeks → 1 week</div>
        </div>
        <div className="p-8">
          <h2 className="font-serif text-xl text-stone-900">Sign in</h2>
          <div className="space-y-4 mt-4">
            <Field label="Work email">
              <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maya@bostonbaking.co" />
            </Field>
            <Field label="Password">
              <input
                className={inputCls}
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
              />
            </Field>
            {err && <div className="text-sm text-red-700">{err}</div>}
            <Btn onClick={submit}>Sign in</Btn>
          </div>
          <div className="mt-6 border-t border-stone-200 pt-4">
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">
              Demo accounts · password <span className="font-mono text-stone-800">bake2026</span>
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto pr-1">
              {USERS.filter((u) => u.role !== "customer").map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setEmail(u.email); setPw(DEMO_PASSWORD); setErr(""); }}
                  className="flex items-center justify-between text-left text-sm px-3 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-100"
                >
                  <span className="text-stone-800">{u.name}</span>
                  <span className="text-xs text-stone-500">{ROLES[u.role].short}</span>
                </button>
              ))}
              <div className="text-[10px] uppercase tracking-widest text-stone-400 px-3 pt-2 pb-1">Customer portal</div>
              {USERS.filter((u) => u.role === "customer").map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setEmail(u.email); setPw(DEMO_PASSWORD); setErr(""); }}
                  className="flex items-center justify-between text-left text-sm px-3 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-100"
                >
                  <span className="text-stone-800">{u.name}</span>
                  <span className="text-xs text-stone-500">{u.company}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Queue logic: what needs THIS role's action ---------- */
