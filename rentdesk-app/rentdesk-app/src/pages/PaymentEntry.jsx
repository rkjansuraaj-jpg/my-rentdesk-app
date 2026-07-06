import React, { useState } from "react";
import { ReceiptText } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, Field, Card } from "../components/ui.jsx";
import { useApp, TODAY } from "../context/AppContext.jsx";

export default function PaymentEntry() {
  const { orders, customers, products, payments, addPayment } = useApp();
  const [orderId, setOrderId] = useState("");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const order = orders.find((o) => o.id === orderId);
  const customer = order ? customers.find((c) => c.id === order.customerId) : null;

  function handleSubmit() {
    if (!orderId || !amount) return;
    addPayment({ productId, rentalOrderId: orderId, amount, date: TODAY.toISOString().slice(0, 10), notes });
    setOrderId(""); setAmount(""); setNotes("");
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Payment entry" subtitle="Record a payment against an existing rental order." />

        <Card style={{ marginBottom: 16 }}>
          <Field label="Rental order">
            <select style={inputStyle} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">Select an order…</option>
              {orders.filter((o) => o.status === "active" || true).map((o) => {
                const c = customers.find((cc) => cc.id === o.customerId);
                return <option key={o.id} value={o.id}>{o.id} — {c?.name}</option>;
              })}
            </select>
          </Field>

          {customer && (
            <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, background: COLORS.PAPER, borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
              {customer.name} · outstanding ₹{customer.outstanding}
            </div>
          )}

          <Field label="Product">
            <select style={inputStyle} value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Amount (₹)">
            <input type="number" style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>

          <Field label="Notes">
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </Field>

          <PrimaryButton onClick={handleSubmit} disabled={!orderId || !amount} style={{ width: "100%", justifyContent: "center" }}>
            Record payment
          </PrimaryButton>
        </Card>

        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>Recent payments</div>
        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {payments.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No payments recorded yet.</div>}
          {payments.slice().reverse().map((p, i) => {
            const o = orders.find((oo) => oo.id === p.rentalOrderId);
            const c = o ? customers.find((cc) => cc.id === o.customerId) : null;
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.FOREST_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ReceiptText size={16} color={COLORS.FOREST_DARK} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{c?.name || "—"} · {p.rentalOrderId}</div>
                    <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>{p.date} {p.notes && `· ${p.notes}`}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.FOREST_DARK }}>₹{p.amount}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
