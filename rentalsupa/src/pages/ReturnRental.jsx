import React, { useMemo, useState } from "react";
import { Search, ArrowLeft, CheckCircle2, Circle, ChevronRight, PackageCheck, StickyNote, Tag, Wrench, AlertTriangle } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, GhostButton, Card, StepTicket } from "../components/ui.jsx";
import { useApp, TODAY, daysOf, itemDaysLate } from "../context/AppContext.jsx";

const STEPS = ["Find rental", "Select items", "Settle", "Done"];
const LATE_FEE_PER_DAY = 50;

function Row({ label, value, bold, warn, good }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ color: COLORS.INK_SOFT }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: warn ? COLORS.RED : good ? COLORS.FOREST_DARK : COLORS.INK }}>{value}</span>
    </div>
  );
}

export default function ReturnRental() {
  const { orders, customers, returnItem } = useApp();

  const activeOrders = orders.filter((o) => o.items.some((i) => i.status === "active"));

  const [phase, setPhase] = useState("browse"); // browse | pick | settle | done
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returningIds, setReturningIds] = useState([]);
  const [conditions, setConditions] = useState({});
  const [amountPaid, setAmountPaid] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [discount, setDiscount] = useState("");
  const [completed, setCompleted] = useState(null);

  const customer = selectedOrder ? customers.find((c) => c.id === selectedOrder.customerId) : null;

  const visibleOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeOrders;
    return activeOrders.filter((o) => {
      const c = customers.find((cc) => cc.id === o.customerId);
      return c?.mobile.includes(q) || c?.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.items.some((i) => i.machine.toLowerCase().includes(q));
    });
  }, [query, activeOrders, customers]);

  const activeItemsInOrder = selectedOrder ? selectedOrder.items.filter((i) => i.status === "active") : [];

  function openOrder(order) {
    setSelectedOrder(order);
    const items = order.items.filter((i) => i.status === "active");
    setReturningIds(items.map((i) => i.itemId));
    const init = {};
    items.forEach((i) => (init[i.itemId] = "good"));
    setConditions(init);
    setPhase("pick");
  }

  function toggleReturning(id) { setReturningIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])); }

  // Per-item breakdown using the segment history (handles swaps automatically).
  const breakdown = useMemo(() => {
    if (!selectedOrder) return [];
    return activeItemsInOrder
      .filter((i) => returningIds.includes(i.itemId))
      .map((i) => {
        const segs = i.segments.map((s, idx) => (idx === i.segments.length - 1 ? { ...s, to: TODAY.toISOString().slice(0, 10) } : s));
        let total = segs.reduce((s, seg) => s + daysOf(seg) * seg.dailyRate, 0);
        const totalDays = segs.reduce((s, seg) => s + daysOf(seg), 0);
        if (totalDays === 0) total = i.dailyRate;
        return { item: i, days: Math.max(totalDays, 1), total };
      });
  }, [selectedOrder, activeItemsInOrder, returningIds]);

  const settlement = useMemo(() => {
    if (!selectedOrder) return null;
    const rentTotal = breakdown.reduce((s, b) => s + b.total, 0);
    const lateItems = breakdown.filter((b) => itemDaysLate(b.item) > 0);
    const lateFee = lateItems.reduce((s, b) => s + itemDaysLate(b.item) * LATE_FEE_PER_DAY, 0);
    const extra = selectedOrder.extraExpense || 0;
    // Extra expense and advance apply once per order; only attribute them when settling everything still active.
    const isFinalBatch = returningIds.length === activeItemsInOrder.length;
    const grossDue = rentTotal + lateFee + (isFinalBatch ? extra : 0);
    const advanceApplied = isFinalBatch ? selectedOrder.advance : 0;
    const balanceDue = Math.max(grossDue - advanceApplied, 0);
    return { rentTotal, lateFee, extra: isFinalBatch ? extra : 0, balanceDue, isFinalBatch };
  }, [selectedOrder, breakdown, returningIds, activeItemsInOrder]);

  function goToSettle() {
    setAmountPaid(String(settlement.balanceDue));
    setShowDiscount(false);
    setDiscount("");
    setPhase("settle");
  }

  const paidNum = Number(amountPaid) || 0;
  const discountNum = showDiscount ? Number(discount) || 0 : 0;
  const netDue = Math.max((settlement?.balanceDue || 0) - discountNum, 0);
  const remainingAfter = netDue - paidNum;

  function openDiscount() {
    setDiscount(String(Math.max((settlement?.balanceDue || 0) - paidNum, 0)));
    setShowDiscount(true);
  }

  function reset() {
    setPhase("browse"); setQuery(""); setSelectedOrder(null); setReturningIds([]); setConditions({});
    setAmountPaid(""); setShowDiscount(false); setDiscount(""); setCompleted(null);
  }

  function confirmReturn() {
    // Settle each returning item individually — discount and payment are split
    // evenly across the batch so per-item bookkeeping (repair status, machine
    // availability) still happens per item via returnItem().
    const perItemDiscount = breakdown.length ? discountNum / breakdown.length : 0;
    const perItemPaid = breakdown.length ? paidNum / breakdown.length : 0;
    const statuses = {};
    breakdown.forEach((b) => {
      returnItem(selectedOrder.id, b.item.itemId, {
        condition: conditions[b.item.itemId], amountPaid: perItemPaid, discount: perItemDiscount, creditChoice: remainingAfter < 0 ? "cash" : null,
      });
      statuses[b.item.machine] = conditions[b.item.itemId] === "damaged" ? "repair" : "available";
    });
    setCompleted({ order: selectedOrder, breakdown, settlement, amountPaid: paidNum, discount: discountNum, remainingAfter, statuses });
    setPhase("done");
  }

  const stepIndex = { browse: 0, pick: 1, settle: 2, done: 3 }[phase];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Return rental" />
        <StepTicket steps={STEPS} current={stepIndex} />

        <Card>
          {phase === "browse" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Current rentals</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 14 }}>Every machine still out with a customer.</p>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <Search size={15} color={COLORS.INK_SOFT} style={{ position: "absolute", left: 12, top: 12 }} />
                <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Filter by mobile, name, order ID, or machine number" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {visibleOrders.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>Nothing matches.</div>}
              {visibleOrders.map((order) => {
                const c = customers.find((cc) => cc.id === order.customerId);
                const active = order.items.filter((i) => i.status === "active");
                const lateCount = active.filter((i) => itemDaysLate(i) > 0).length;
                return (
                  <div key={order.id} onClick={() => openOrder(order)} style={{ border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{c?.name} — {order.id}</div>
                      <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, marginTop: 2 }}>{active.map((i) => i.machine).join(", ")}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {lateCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: COLORS.RED_BG, color: COLORS.RED, padding: "4px 8px", borderRadius: 6 }}>{lateCount} late</span>}
                      <ChevronRight size={18} color={COLORS.INK_SOFT} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {phase === "pick" && selectedOrder && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>{customer?.name} — {selectedOrder.id}</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 12 }}>Select what's being returned today.</p>
              {selectedOrder.remarks && (
                <div style={{ display: "flex", gap: 8, background: COLORS.PAPER, borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12.5, color: COLORS.INK_SOFT }}>
                  <StickyNote size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div><strong style={{ color: COLORS.INK }}>Note from rental:</strong> {selectedOrder.remarks}</div>
                </div>
              )}
              {activeItemsInOrder.map((item) => {
                const isReturning = returningIds.includes(item.itemId);
                const isDamaged = conditions[item.itemId] === "damaged";
                const late = itemDaysLate(item);
                return (
                  <div key={item.itemId} style={{ border: `1.5px solid ${isReturning ? COLORS.FOREST : COLORS.LINE}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: isReturning ? COLORS.FOREST_BG : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div onClick={() => toggleReturning(item.itemId)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        {isReturning ? <CheckCircle2 size={18} color={COLORS.FOREST} /> : <Circle size={18} color={COLORS.LINE} />}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{item.machine} <span style={{ fontWeight: 400, color: COLORS.INK_SOFT }}>· {item.product}</span></div>
                          <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>Due {item.expectedReturn}{late > 0 ? ` · ${late}d late` : ""}</div>
                        </div>
                      </div>
                      {isReturning && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {["good", "damaged"].map((c2) => (
                            <button key={c2} onClick={() => setConditions((prev) => ({ ...prev, [item.itemId]: c2 }))} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 6, fontWeight: 600, cursor: "pointer", border: `1px solid ${conditions[item.itemId] === c2 ? (c2 === "damaged" ? COLORS.RED : COLORS.FOREST) : COLORS.LINE}`, background: conditions[item.itemId] === c2 ? (c2 === "damaged" ? COLORS.RED_BG : COLORS.FOREST_BG) : "#fff", color: conditions[item.itemId] === c2 ? (c2 === "damaged" ? COLORS.RED : COLORS.FOREST_DARK) : COLORS.INK_SOFT }}>
                              {c2 === "good" ? "Good" : "Damaged"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {isReturning && isDamaged && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11.5, color: COLORS.RED }}>
                        <Wrench size={12} /> Moves to <strong>Under Repair</strong> automatically on confirm.
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <GhostButton onClick={reset}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={goToSettle} disabled={returningIds.length === 0} style={{ flex: 1, justifyContent: "center" }}>
                  Calculate settlement <ChevronRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "settle" && selectedOrder && settlement && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Settle up</div>
              <div style={{ marginBottom: 14 }}>
                {breakdown.map((b) => (
                  <div key={b.item.itemId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${COLORS.LINE}` }}>
                    <span style={{ color: COLORS.INK }}>{b.item.machine} <span style={{ color: COLORS.INK_SOFT }}>· {b.days}d</span></span>
                    <span style={{ fontWeight: 600, color: COLORS.INK }}>₹{b.total}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 16, fontSize: 13.5, marginBottom: 16 }}>
                <Row label="Rental charge" value={`₹${settlement.rentTotal}`} />
                {settlement.lateFee > 0 && <Row label="Late fee" value={`₹${settlement.lateFee}`} warn />}
                {settlement.extra > 0 && <Row label="Extra expense" value={`₹${settlement.extra}`} />}
                {settlement.isFinalBatch && <Row label="Advance already paid" value={`− ₹${selectedOrder.advance}`} />}
                <div style={{ borderTop: `1px solid ${COLORS.LINE}`, margin: "8px 0" }} />
                <Row label="Total balance due" value={`₹${settlement.balanceDue}`} bold />
                {showDiscount && discountNum > 0 && <Row label="Discount applied" value={`− ₹${discountNum}`} good />}
              </div>
              {!settlement.isFinalBatch && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: COLORS.AMBER_BG, color: COLORS.AMBER, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
                  <AlertTriangle size={14} /> Partial return — advance and extra expense will apply when the rest of this order is returned.
                </div>
              )}
              <div style={{ marginBottom: 6 }}>
                <label style={{ display: "block", fontSize: 12.5, color: COLORS.INK_SOFT, marginBottom: 5, fontWeight: 500 }}>Amount he's paying now (₹)</label>
                <input type="number" style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>
              {!showDiscount ? (
                <button onClick={openDiscount} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px dashed ${COLORS.LINE}`, color: COLORS.INK_SOFT, fontSize: 12.5, fontWeight: 600, borderRadius: 7, padding: "7px 12px", cursor: "pointer", marginBottom: 14 }}>
                  <Tag size={13} /> Add discount
                </button>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: COLORS.INK_SOFT, marginBottom: 5, fontWeight: 500 }}>
                    <Tag size={13} /> Discount (₹)
                  </label>
                  <input type="number" style={inputStyle} value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px 16px", fontSize: 13.5 }}>
                <span style={{ color: COLORS.INK_SOFT }}>{remainingAfter > 0 ? "Still owing" : remainingAfter < 0 ? "Refund due" : "Fully settled"}</span>
                <span style={{ fontWeight: 700, color: remainingAfter > 0 ? COLORS.RED : remainingAfter < 0 ? COLORS.FOREST_DARK : COLORS.INK }}>{remainingAfter !== 0 ? `₹${Math.abs(remainingAfter)}` : "₹0"}</span>
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
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.INK, marginBottom: 8 }}>Return recorded</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                {Object.entries(completed.statuses).map(([machine, status]) => (
                  <span key={machine} style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 6, background: status === "repair" ? COLORS.RED_BG : COLORS.FOREST_BG, color: status === "repair" ? COLORS.RED : COLORS.FOREST_DARK }}>
                    {machine} → {status === "repair" ? "Under repair" : "Available"}
                  </span>
                ))}
              </div>
              <PrimaryButton onClick={reset} style={{ width: "100%", justifyContent: "center" }}>Process next return</PrimaryButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
