import React, { useState } from "react";
import { Wrench, CheckCircle2 } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, Field, Card } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function Maintenance() {
  const { machines, maintenance, reportMaintenance, resolveMaintenance } = useApp();
  const [machineId, setMachineId] = useState(machines[0]?.id || "");
  const [issue, setIssue] = useState("");

  const eligible = machines.filter((m) => m.status !== "repair");

  function handleReport() {
    if (!machineId || !issue.trim()) return;
    reportMaintenance({ machineId, issue: issue.trim() });
    setIssue("");
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Maintenance" subtitle="Take a machine out of service and bring it back once it's fixed." />

        <Card style={{ marginBottom: 16 }}>
          <Field label="Machine">
            <select style={inputStyle} value={machineId} onChange={(e) => setMachineId(e.target.value)}>
              {eligible.map((m) => <option key={m.id} value={m.id}>{m.number} — {m.product}</option>)}
            </select>
          </Field>
          <Field label="Issue">
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="What's wrong with it?" />
          </Field>
          <PrimaryButton onClick={handleReport} disabled={!machineId || !issue.trim()} style={{ width: "100%", justifyContent: "center" }}>
            <Wrench size={16} /> Send for repair
          </PrimaryButton>
        </Card>

        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>Maintenance log</div>
        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {maintenance.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No maintenance records yet.</div>}
          {maintenance.slice().reverse().map((rec, i) => {
            const m = machines.find((mm) => mm.id === rec.machineId);
            return (
              <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{m?.number}</div>
                  <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>{rec.issue} · reported {rec.reportedOn}</div>
                </div>
                {rec.status === "open" ? (
                  <button onClick={() => resolveMaintenance(rec.id, rec.machineId)} style={{ fontSize: 12, fontWeight: 600, background: COLORS.FOREST, color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} /> Mark fixed
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, background: COLORS.FOREST_BG, color: COLORS.FOREST_DARK, padding: "5px 10px", borderRadius: 6 }}>Resolved</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
