import React, { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function ProductList() {
  const { products, addProduct, deleteProduct } = useApp();
  const [name, setName] = useState("");
  const [rent, setRent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleAdd() {
    if (!name.trim() || !rent) return;
    addProduct(name.trim(), Number(rent));
    setName(""); setRent("");
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 620 }}>
        <PageHeader title="Product list" subtitle="The product types your shop rents out, and the daily rate for each." />

        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 12 }}>Add a product</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Product name, e.g. Hammer Drill" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <input style={{ ...inputStyle, width: 140 }} type="number" placeholder="Daily rent (₹)" value={rent} onChange={(e) => setRent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <button onClick={handleAdd} disabled={!name.trim() || !rent} style={{ background: !name.trim() || !rent ? "#B9C4BE" : COLORS.FOREST, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", cursor: !name.trim() || !rent ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {products.length === 0 && <div style={{ padding: 32, textAlign: "center", color: COLORS.INK_SOFT, fontSize: 13.5 }}>No products yet.</div>}
          {products.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.FOREST_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={16} color={COLORS.FOREST_DARK} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.INK_SOFT, fontFamily: "monospace" }}>{p.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>₹{p.dailyRent}<span style={{ fontSize: 11.5, color: COLORS.INK_SOFT, fontWeight: 400 }}>/day</span></div>
                {confirmDelete === p.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { deleteProduct(p.id); setConfirmDelete(null); }} style={{ fontSize: 12, background: COLORS.RED, color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 12, background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#B9B7AB", padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
