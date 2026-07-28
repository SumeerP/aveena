import React, { useReducer, useEffect, useState, useContext } from "react";
import { AppCtx } from "./state/context.js";
import { reducer } from "./state/reducer.js";
import { loadPersisted, persist } from "./state/storage.js";
import { SEED_OPPS } from "./domain/seed.js";
import { LoginScreen } from "./components/auth/LoginScreen.jsx";
import { CustomerPortal } from "./components/customer/CustomerPortal.jsx";
import { InternalShell } from "./components/InternalShell.jsx";

function Shell() {
  const { state } = useContext(AppCtx);
  const me = state.session;
  if (me.role === "customer") return <CustomerPortal />;
  return <InternalShell />;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    session: null,
    opportunities: SEED_OPPS,
    loaded: false,
  });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      if (Array.isArray(persisted) && persisted.length) {
        dispatch({ type: "HYDRATE", payload: { opportunities: persisted } });
      } else if (persisted.opportunities) {
        dispatch({ type: "HYDRATE", payload: persisted });
      }
    }
    setBooting(false);
  }, []);

  useEffect(() => {
    if (!booting) persist(state);
  }, [state.opportunities, booting]);

  if (booting) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-500 font-mono text-sm animate-pulse">Loading pipeline…</div>
      </div>
    );
  }

  return (
    <AppCtx.Provider value={{ state, dispatch }}>
      {state.session ? <Shell /> : <LoginScreen onLogin={(u) => dispatch({ type: "LOGIN", payload: u })} />}
    </AppCtx.Provider>
  );
}
