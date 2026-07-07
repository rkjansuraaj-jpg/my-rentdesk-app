import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { COLORS } from "../theme.js";
import { PrimaryButton, Field, Card } from "./ui.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.PAPER }}>
      <Card style={{ width: 340 }}>
        <div style={{ fontSize: 12, color: COLORS.FOREST_DARK, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
          RentDesk
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.INK, marginTop: 2, marginBottom: 18 }}>
          Sign in
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.LINE}`, fontSize: 14, boxSizing: "border-box" }}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "9px 11px", borderRadius: 7, border: `1px solid ${COLORS.LINE}`, fontSize: 14, boxSizing: "border-box" }}
            />
          </Field>
          {error && (
            <div style={{ color: COLORS.RED, fontSize: 12.5, marginBottom: 12 }}>{error}</div>
          )}
          <PrimaryButton disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
        <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT, marginTop: 16 }}>
          Accounts are created by an admin in the Supabase dashboard, not
          through this screen — ask whoever set up the app for a login.
        </div>
      </Card>
    </div>
  );
}
