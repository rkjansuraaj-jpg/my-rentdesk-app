import React from "react";
import { COLORS } from "../theme.js";

export function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#B9C4BE" : COLORS.FOREST,
        color: "#fff",
        border: "none",
        padding: "11px 22px",
        borderRadius: 8,
        fontSize: 14.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = COLORS.FOREST_DARK; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = COLORS.FOREST; }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: COLORS.INK_SOFT,
        border: `1px solid ${COLORS.LINE}`,
        padding: "10px 18px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12.5, color: COLORS.INK_SOFT, marginBottom: 5, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, color: COLORS.FOREST_DARK, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
        RentDesk
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.INK, marginTop: 2 }}>{title}</div>
      {subtitle && <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 4, marginBottom: 0 }}>{subtitle}</p>}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function StepTicket({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 54 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? COLORS.FOREST : done ? COLORS.FOREST_BG : "#fff",
                  border: `1.5px solid ${active || done ? COLORS.FOREST : COLORS.LINE}`,
                  color: active ? "#fff" : done ? COLORS.FOREST_DARK : COLORS.INK_SOFT,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? COLORS.INK : COLORS.INK_SOFT, fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 0, borderTop: `1.5px dashed ${i < current ? COLORS.FOREST : COLORS.LINE}`, marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
