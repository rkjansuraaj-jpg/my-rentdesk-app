import React, { useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";

const STATUS_STYLE = {
  available: { bg: COLORS.FOREST_BG, fg: COLORS.FOREST_DARK, label: "Available" },
  rented: { bg: COLORS.AMBER_BG, fg: COLORS.AMBER, label: "On rent" },
  repair: { bg: COLORS.RED_BG, fg: COLORS.RED, label: "In repair" },
};

export default function MachineList() {
  const { products, machines, addMachine, deleteMachine, setMachineStatus } = useApp();
  const [product, setProduct] = useState(products[0]?.name || "");
  const [number, setNumber] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleAdd() {
    if (!number.trim()) return;
    addMachine(product, number.trim());
    setNumber("");
  }

  function cycleStatus(m) {
    const order = ["available", "rented", "repair"];
    setMachineStatus(m.id, order[(order.indexOf(m.status) + 1) % order.length]);
  }

  const visible = filter === "all" ? machines : machines.filter((m) => m.status === filter);
  const counts = machines.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 680 }}>
        <PageHeader title="Machine list" subtitle="Every physical unit you own, tagged to a product. New Rental only offers units marked available." />

        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 12 }}>Add a machine</div>
          <div style={{ display: "flex", gap: 10 }}>
            <select style={{ ...inputStyle, width: 180 }} value={product} onChange={(e) => setProduct(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Machine number, e.g. Hammer-004" value={number} onChange={(e) => setNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <button onClick={handleAdd} disabled={!number.trim()} style={{ background: !number.trim() ? "#B9C4BE" : COLORS.FOREST, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", cursor: !number.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { key: "all", label: `All (${machines.length})` },
            { key: "available", label: `Available (${counts.available || 0})` },
            { key: "rented", label: `On rent (${counts.rented || 0})` },
            { key: "repair", label: `In repair (${counts.repair || 0})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${filter === f.key ? COLORS.FOREST : COLORS.LINE}`, background: filter === f.key ? COLORS.FOREST_BG : "#fff", color: filter === f.key ? COLORS.FOREST_DARK : COLORS.INK_SOFT }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {visible.length === 0 && <div style={{ padding: 32, textAlign: "center", color: COLORS.INK_SOFT, fontSize: 13.5 }}>No machines in this view.</div>}
          {visible.map((m, i) => {
            const s = STATUS_STYLE[m.status];
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={16} color={s.fg} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{m.number}</div>
                    <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>{m.product}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={() => cycleStatus(m)} style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: s.bg, color: s.fg, border: "none", cursor: "pointer" }}>{s.label}</button>
                  {confirmDelete === m.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { deleteMachine(m.id); setConfirmDelete(null); }} style={{ fontSize: 12, background: COLORS.RED, color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 12, background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(m.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#B9B7AB", padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
