import React from "react";

export function Badge({ tone = "stone", children }) {
  const tones = {
    stone: "bg-stone-100 text-stone-700 border-stone-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Btn({ onClick, children, tone = "primary", disabled, small }) {
  const base = small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const tones = {
    primary: "bg-red-900 text-red-50 hover:bg-red-800",
    accent: "bg-red-700 text-white hover:bg-red-800",
    ghost: "bg-transparent text-stone-700 border border-stone-300 hover:bg-stone-100",
    danger: "bg-red-700 text-white hover:bg-red-800",
    green: "bg-emerald-700 text-white hover:bg-emerald-800",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} rounded font-medium tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wider text-stone-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-400";

export function CheckGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onChange(on ? value.filter((v) => v !== opt) : [...value, opt])}
            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
              on ? "bg-red-700 text-white border-red-700" : "bg-white text-stone-700 border-stone-300 hover:border-red-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function AutofillHint({ fields }) {
  if (!fields || fields.length === 0) return null;
  return (
    <div className="text-xs text-red-900 bg-red-50 border border-red-100 rounded px-2.5 py-1.5 mb-3">
      Prefilled from discovery context: {fields.join(", ")} — review and adjust before submitting.
    </div>
  );
}

export function Panel({ title, hint, children }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-serif text-base text-stone-900">{title}</h3>
        {hint && <span className="text-[11px] uppercase tracking-wider text-red-900">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, accent, danger }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? "bg-red-50 border-red-200" : accent ? "bg-red-50 border-red-100" : "bg-white border-stone-200"}`}>
      <div className={`font-mono text-2xl ${danger ? "text-red-700" : "text-stone-900"}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">
        {label}
        {sub ? ` \u00b7 ${sub}` : ""}
      </div>
    </div>
  );
}
