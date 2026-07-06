import React, { useMemo, useState } from "react";
import { Search, ArrowLeft, CheckCircle2, Circle, ChevronRight, AlertTriangle, PackageCheck } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, GhostButton, Card, StepTicket } from "../components/ui.jsx";
import { useApp, TODAY } from "../context/AppContext.jsx";

const STEPS = ["Find rental", "Select items", "Settle", "Done"];
const LATE_FEE_PER_DAY = 50;

function daysBetween(dateStr) {
  const diff = Math.round((TODAY - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

function Row({ label, value, bold, warn, good }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ color: COLORS.INK_SOFT }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: warn ? COLORS.RED : good ? COLORS.FOREST_DARK : COLORS.INK }}>{value}</span>
    </div>
  );
}

export default function ReturnRental() {
  const { orders, customers, returnItems } = useApp();
  const activeOrders = orders.filter((o) => o.status === "active" && o.items.length > 0);

  const [phase, setPhase] = useState("search");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returningIds, setReturningIds] = useState([]);
  const [conditions, setConditions] = useState({});
  const [completed, setCompleted] = useState(null);

  const customer = selectedOrder ? customers.find((c) => c.id === selectedOrder.customerId) : null;

  function handleSearch() {
    const q = query.trim().toLowerCase();
    const found = activeOrders.filter((o) => {
      const c = customers.find((cc) => cc.id === o.customerId);
      return c?.mobile.includes(q) || c?.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
    });
    setMatches(found);
    setPhase(found.length ? "pick-order" : "notfound");
  }

  function openOrder(order) {
    setSelectedOrder(order);
    setReturningIds(order.items.map((i) => i.machineId));
    const init = {};
    order.items.forEach((i) => (init[i.machineId] = "good"));
    setConditions(init);
    setPhase("pick");
  }

  function toggleReturning(id) { setReturningIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])); }

  const settlement = useMemo(() => {
    if (!selectedOrder) return null;
    const days = daysBetween(selectedOrder.createdOn);
    const lateDays = Math.max(Math.round((TODAY - new Date(selectedOrder.returnDate)) / (1000 * 60 * 60 * 24)), 0);
    const returningItems = selectedOrder.items.filter((i) => returningIds.includes(i.machineId));
    const rentTotal = returningItems.reduce((s, i) => s + i.dailyRent * days, 0);
    const lateFee = lateDays * LATE_FEE_PER_DAY * returningItems.length;
    const damagedCount = returningItems.filter((i) => conditions[i.machineId] === "damaged").length;
    const balanceDue = rentTotal + lateFee - selectedOrder.advance;
    return { days, lateDays, rentTotal, lateFee, damagedCount, balanceDue, returningItems };
  }, [selectedOrder, returningIds, conditions]);

  function reset() {
    setPhase("search"); setQuery(""); setMatches([]); setSelectedOrder(null); setReturningIds([]); setConditions({}); setCompleted(null);
  }

  function confirmReturn() {
    const damagedIds = selectedOrder.items.filter((i) => conditions[i.machineId] === "damaged" && returningIds.includes(i.machineId)).map((i) => i.machineId);
    returnItems({ orderId: selectedOrder.id, machineIds: returningIds, rentTotal: settlement.rentTotal, lateFee: settlement.lateFee, damagedIds });
    setCompleted({ order: selectedOrder, settlement });
    setPhase("done");
  }

  const stepIndex = { search: 0, notfound: 0, "pick-order": 0, pick: 1, settle: 2, done: 3 }[phase];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Return rental" />
        <StepTicket steps={STEPS} current={stepIndex} />

        <Card>
          {phase === "search" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Find the rental</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 16 }}>Search by customer mobile, name, or rental order number.</p>
              <input style={inputStyle} placeholder="Mobile, name, or order ID" value={query} onChange={(e) => setQuery(e.target.value)} />
              <PrimaryButton onClick={handleSearch} disabled={!query.trim()} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                <Search size={16} /> Search
              </PrimaryButton>
            </div>
          )}

          {phase === "notfound" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <AlertTriangle size={22} color={COLORS.RED} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>No active rental found</div>
              <GhostButton onClick={reset}><ArrowLeft size={15} /> Search again</GhostButton>
            </div>
          )}

          {phase === "pick-order" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 14 }}>{matches.length} active rental(s) found</div>
              {matches.map((order) => {
                const c = customers.find((cc) => cc.id === order.customerId);
                return (
                  <div key={order.id} onClick={() => openOrder(order)} style={{ border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{c?.name} — {order.id}</div>
                      <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, marginTop: 2 }}>{order.items.map((i) => i.number).join(", ")} · due {order.returnDate}</div>
                    </div>
                    <ChevronRight size={18} color={COLORS.INK_SOFT} />
                  </div>
                );
              })}
              <GhostButton onClick={reset}><ArrowLeft size={15} /> Search again</GhostButton>
            </div>
          )}

          {phase === "pick" && selectedOrder && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>{customer?.name} — {selectedOrder.id}</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 16 }}>Select what's being returned today.</p>
              {selectedOrder.items.map((i) => {
                const isReturning = returningIds.includes(i.machineId);
                return (
                  <div key={i.machineId} style={{ border: `1.5px solid ${isReturning ? COLORS.FOREST : COLORS.LINE}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: isReturning ? COLORS.FOREST_BG : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div onClick={() => toggleReturning(i.machineId)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        {isReturning ? <CheckCircle2 size={18} color={COLORS.FOREST} /> : <Circle size={18} color={COLORS.LINE} />}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{i.number}</div>
                          <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>₹{i.dailyRent}/day</div>
                        </div>
                      </div>
                      {isReturning && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {["good", "damaged"].map((c2) => (
                            <button key={c2} onClick={() => setConditions((prev) => ({ ...prev, [i.machineId]: c2 }))} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 6, fontWeight: 600, cursor: "pointer", border: `1px solid ${conditions[i.machineId] === c2 ? (c2 === "damaged" ? COLORS.RED : COLORS.FOREST) : COLORS.LINE}`, background: conditions[i.machineId] === c2 ? (c2 === "damaged" ? COLORS.RED_BG : COLORS.FOREST_BG) : "#fff", color: conditions[i.machineId] === c2 ? (c2 === "damaged" ? COLORS.RED : COLORS.FOREST_DARK) : COLORS.INK_SOFT }}>
                              {c2 === "good" ? "Good" : "Damaged"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <GhostButton onClick={reset}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={() => setPhase("settle")} disabled={returningIds.length === 0} style={{ flex: 1, justifyContent: "center" }}>
                  Calculate settlement <ChevronRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "settle" && selectedOrder && settlement && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Settle up</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 16 }}>{settlement.returningItems.map((i) => i.number).join(", ")} · {settlement.days} day(s) on rent</p>
              <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 16, fontSize: 13.5, marginBottom: 16 }}>
                <Row label="Rental charge" value={`₹${settlement.rentTotal}`} />
                {settlement.lateFee > 0 && <Row label="Late fee" value={`₹${settlement.lateFee}`} warn />}
                <Row label="Advance already paid" value={`− ₹${selectedOrder.advance}`} />
                <div style={{ borderTop: `1px solid ${COLORS.LINE}`, margin: "8px 0" }} />
                <Row label="Balance due from customer" value={`₹${Math.max(settlement.balanceDue, 0)}`} bold />
                {settlement.balanceDue < 0 && <Row label="Refund to customer" value={`₹${-settlement.balanceDue}`} bold good />}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <GhostButton onClick={() => setPhase("pick")}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={confirmReturn} style={{ flex: 1, justifyContent: "center" }}>
                  <PackageCheck size={16} /> Confirm return
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "done" && completed && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={28} color={COLORS.FOREST_DARK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.INK, marginBottom: 16 }}>Return recorded</div>
              <PrimaryButton onClick={reset} style={{ width: "100%", justifyContent: "center" }}>Process next return</PrimaryButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
