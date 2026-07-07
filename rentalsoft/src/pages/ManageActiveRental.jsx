import React, { useState } from "react";
import { ArrowLeftRight, Undo2, PlusCircle, CalendarClock, AlertTriangle, ChevronRight, StickyNote, Search, ArrowLeft } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, GhostButton } from "../components/ui.jsx";
import { useApp, TODAY, daysOf, itemRunningTotal, itemDaysLate } from "../context/AppContext.jsx";

function Badge({ children, tone }) {
  const t = { amber: [COLORS.AMBER_BG, COLORS.AMBER], red: [COLORS.RED_BG, COLORS.RED], forest: [COLORS.FOREST_BG, COLORS.FOREST_DARK], neutral: [COLORS.PAPER, COLORS.INK_SOFT] }[tone];
  return <span style={{ fontSize: 11, fontWeight: 600, background: t[0], color: t[1], padding: "4px 9px", borderRadius: 6 }}>{children}</span>;
}

function SmallButton({ children, onClick, tone = "ghost" }) {
  const styles = tone === "primary" ? { background: COLORS.FOREST, color: "#fff", border: "none" } : { background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}` };
  return <button onClick={onClick} style={{ ...styles, fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 7, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</button>;
}

function fmtRange(seg) {
  const from = seg.from.slice(5).replace("-", "/");
  const to = seg.to ? seg.to.slice(5).replace("-", "/") : "ongoing";
  return `${from}–${to}`;
}

export default function ManageActiveRental() {
  const { orders, customers, products, machines, swapItemMachine, addItemToOrder, editItemReturnDate, returnItem } = useApp();
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [openPanel, setOpenPanel] = useState(null);

  const order = orders.find((o) => o.id === selectedOrderId);
  const customer = order ? customers.find((c) => c.id === order.customerId) : null;

  const ordersWithActive = orders.filter((o) => o.items.some((i) => i.status === "active"));
  const visibleOrders = ordersWithActive.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const c = customers.find((cc) => cc.id === o.customerId);
    return c?.name.toLowerCase().includes(q) || c?.mobile.includes(q) || o.id.toLowerCase().includes(q);
  });

  function closePanel() { setOpenPanel(null); }

  if (!order) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: 680 }}>
          <PageHeader title="Manage active rentals" subtitle="Every customer with machines still out. Tap one to swap, return, add, or edit their rental." />
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={15} color={COLORS.INK_SOFT} style={{ position: "absolute", left: 12, top: 12 }} />
            <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search by name, mobile, or order ID" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
            {visibleOrders.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No matching active rentals.</div>}
            {visibleOrders.map((o, i) => {
              const c = customers.find((cc) => cc.id === o.customerId);
              const active = o.items.filter((it) => it.status === "active");
              const lateCount = active.filter((it) => itemDaysLate(it) > 0).length;
              return (
                <div key={o.id} onClick={() => setSelectedOrderId(o.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}`, cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{c?.name} — {o.id}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, marginTop: 2, fontFamily: "monospace" }}>{c?.mobile}</div>
                    <div style={{ fontSize: 12, color: COLORS.INK_SOFT, marginTop: 2 }}>{active.map((it) => it.machine).join(", ")}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Badge tone="forest">{active.length} active</Badge>
                    {lateCount > 0 && <Badge tone="red">{lateCount} late</Badge>}
                    <ChevronRight size={18} color={COLORS.INK_SOFT} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const activeItems = order.items.filter((i) => i.status === "active");
  const closedItems = order.items.filter((i) => i.status === "returned");

  function SwapPanel({ item }) {
    const [product, setProduct] = useState(products[0]?.name || "");
    const [reason, setReason] = useState("wrong");
    const options = machines.filter((m) => m.product === product && m.status === "available");
    const [chosen, setChosen] = useState(options[0]?.id || "");
    const closingDays = daysOf({ ...item.segments[item.segments.length - 1], to: null }, TODAY);
    const newRate = products.find((p) => p.name === product)?.dailyRent || 0;

    function confirm() {
      if (!chosen) return;
      const machineObj = machines.find((m) => m.id === chosen);
      swapItemMachine(order.id, item.itemId, {
        newMachineId: chosen, newMachine: machineObj.number, newProduct: product, newDailyRate: newRate,
        reason: reason === "damaged" ? "Damaged — swapped" : "Wrong machine — swapped",
      });
      closePanel();
    }

    return (
      <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 10 }}>Swap this machine</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {["wrong", "damaged"].map((r) => (
            <button key={r} onClick={() => setReason(r)} style={{ flex: 1, fontSize: 12.5, fontWeight: 600, padding: "8px 10px", borderRadius: 7, cursor: "pointer", border: `1px solid ${reason === r ? COLORS.FOREST : COLORS.LINE}`, background: reason === r ? COLORS.FOREST_BG : "#fff", color: reason === r ? COLORS.FOREST_DARK : COLORS.INK_SOFT }}>
              {r === "wrong" ? "Wrong machine" : "Damaged"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <select style={inputStyle} value={product} onChange={(e) => { setProduct(e.target.value); setChosen(""); }}>
            {products.map((p) => <option key={p.id} value={p.name}>{p.name} — ₹{p.dailyRent}/day</option>)}
          </select>
          <select style={inputStyle} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">Pick unit…</option>
            {options.map((m) => <option key={m.id} value={m.id}>{m.number}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: COLORS.INK_SOFT, background: "#fff", border: `1px solid ${COLORS.LINE}`, borderRadius: 8, padding: "10px 12px", marginBottom: 12, lineHeight: 1.6 }}>
          Closing <strong style={{ color: COLORS.INK }}>{item.machine}</strong>: {closingDays} day{closingDays === 1 ? "" : "s"} used{closingDays === 0 ? " (same-day swap — no charge)" : ""}.
          <br />
          {reason === "damaged" ? "Old machine will be sent to Maintenance." : "Old machine returns to available stock."}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SmallButton onClick={closePanel}>Cancel</SmallButton>
          <SmallButton tone="primary" onClick={confirm}>Confirm swap</SmallButton>
        </div>
      </div>
    );
  }

  function ReturnPanel({ item }) {
    const [condition, setCondition] = useState("good");
    const [amountPaid, setAmountPaid] = useState("");
    const [creditChoice, setCreditChoice] = useState(null);

    const segs = item.segments.map((s, idx) => (idx === item.segments.length - 1 ? { ...s, to: TODAY.toISOString().slice(0, 10) } : s));
    let total = segs.reduce((s, seg) => s + daysOf(seg) * seg.dailyRate, 0);
    const totalDays = segs.reduce((s, seg) => s + daysOf(seg), 0);
    if (totalDays === 0) total = item.dailyRate;

    const paidNum = Number(amountPaid) || 0;
    const remainingAfter = total - paidNum;
    const needsCreditChoice = condition === "damaged" && remainingAfter < 0;

    function confirm() {
      if (needsCreditChoice && !creditChoice) return;
      returnItem(order.id, item.itemId, { condition, amountPaid: paidNum, discount: 0, creditChoice });
      closePanel();
    }

    return (
      <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 10 }}>Return {item.machine}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["good", "damaged"].map((c) => (
            <button key={c} onClick={() => { setCondition(c); setCreditChoice(null); }} style={{ flex: 1, fontSize: 12.5, fontWeight: 600, padding: "8px 10px", borderRadius: 7, cursor: "pointer", border: `1px solid ${condition === c ? (c === "damaged" ? COLORS.RED : COLORS.FOREST) : COLORS.LINE}`, background: condition === c ? (c === "damaged" ? COLORS.RED_BG : COLORS.FOREST_BG) : "#fff", color: condition === c ? (c === "damaged" ? COLORS.RED : COLORS.FOREST_DARK) : COLORS.INK_SOFT }}>
              {c === "good" ? "Good condition" : "Damaged"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, background: "#fff", border: `1px solid ${COLORS.LINE}`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
          Charge for this item: <strong style={{ color: COLORS.INK }}>₹{total}</strong>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Amount he's paying now (₹)</label>
          <input type="number" style={inputStyle} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: needsCreditChoice ? 12 : 4 }}>
          <span style={{ color: COLORS.INK_SOFT }}>{remainingAfter > 0 ? "Still owing" : remainingAfter < 0 ? "Refund due" : "Settled"}</span>
          <span style={{ fontWeight: 700, color: remainingAfter > 0 ? COLORS.RED : remainingAfter < 0 ? COLORS.FOREST_DARK : COLORS.INK }}>{remainingAfter !== 0 ? `₹${Math.abs(remainingAfter)}` : "₹0"}</span>
        </div>
        {needsCreditChoice && (
          <div style={{ background: COLORS.AMBER_BG, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.AMBER, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> No replacement available — ask the customer directly:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SmallButton tone={creditChoice === "cash" ? "primary" : "ghost"} onClick={() => setCreditChoice("cash")}>Refund cash now</SmallButton>
              <SmallButton tone={creditChoice === "credit" ? "primary" : "ghost"} onClick={() => setCreditChoice("credit")}>Hold as store credit</SmallButton>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <SmallButton onClick={closePanel}>Cancel</SmallButton>
          <SmallButton tone="primary" onClick={confirm}>{needsCreditChoice && !creditChoice ? "Choose refund method above" : "Confirm return"}</SmallButton>
        </div>
      </div>
    );
  }

  function EditDatePanel({ item }) {
    const [date, setDate] = useState(item.expectedReturn);
    return (
      <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 10 }}>New expected return date</div>
        <input type="date" style={{ ...inputStyle, marginBottom: 12 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <SmallButton onClick={closePanel}>Cancel</SmallButton>
          <SmallButton tone="primary" onClick={() => { editItemReturnDate(order.id, item.itemId, date); closePanel(); }}>Save date</SmallButton>
        </div>
      </div>
    );
  }

  function AddItemPanel() {
    const [product, setProduct] = useState(products[0]?.name || "");
    const options = machines.filter((m) => m.product === product && m.status === "available");
    const [chosen, setChosen] = useState(options[0]?.id || "");
    const [returnDate, setReturnDate] = useState("");
    const rate = products.find((p) => p.name === product)?.dailyRent || 0;

    function confirm() {
      if (!chosen || !returnDate) return;
      const machineObj = machines.find((m) => m.id === chosen);
      addItemToOrder(order.id, { machineId: chosen, product, machine: machineObj.number, dailyRate: rate, expectedReturn: returnDate });
      closePanel();
    }

    return (
      <div style={{ background: COLORS.PAPER, borderRadius: 10, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.INK, marginBottom: 10 }}>Add a machine to this order</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <select style={inputStyle} value={product} onChange={(e) => { setProduct(e.target.value); setChosen(""); }}>
            {products.map((p) => <option key={p.id} value={p.name}>{p.name} — ₹{p.dailyRent}/day</option>)}
          </select>
          <select style={inputStyle} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">Pick unit…</option>
            {options.map((m) => <option key={m.id} value={m.id}>{m.number}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Expected return date</label>
          <input type="date" style={inputStyle} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SmallButton onClick={closePanel}>Cancel</SmallButton>
          <SmallButton tone="primary" onClick={confirm}>Add to order</SmallButton>
        </div>
      </div>
    );
  }

  function ItemCard({ item }) {
    const late = itemDaysLate(item);
    const running = itemRunningTotal(item);
    const isOpen = openPanel?.itemId === item.itemId;
    return (
      <div style={{ border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: 16, marginBottom: 12, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.INK }}>{item.machine} <span style={{ fontWeight: 400, color: COLORS.INK_SOFT, fontSize: 12.5 }}>· {item.product}</span></div>
            <div style={{ fontSize: 12, color: COLORS.INK_SOFT, marginTop: 4 }}>Due {item.expectedReturn} · running total so far ₹{running}</div>
          </div>
          {late > 0 ? <Badge tone={late >= 3 ? "red" : "amber"}>{late}d late</Badge> : <Badge tone="forest">On track</Badge>}
        </div>
        <div style={{ marginTop: 10, marginBottom: 12 }}>
          {item.segments.map((seg, i) => (
            <div key={i} style={{ fontSize: 11.5, color: COLORS.INK_SOFT, display: "flex", alignItems: "center", gap: 6, marginTop: i > 0 ? 3 : 0 }}>
              {i > 0 && <ChevronRight size={11} />}
              <span style={{ fontFamily: "monospace" }}>{seg.machine}</span>
              <span>({fmtRange(seg)}, {daysOf(seg)}d @ ₹{seg.dailyRate})</span>
              {seg.reason && <span style={{ fontStyle: "italic" }}>— {seg.reason}</span>}
            </div>
          ))}
        </div>
        {!isOpen && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SmallButton onClick={() => setOpenPanel({ type: "swap", itemId: item.itemId })}><ArrowLeftRight size={13} /> Swap</SmallButton>
            <SmallButton onClick={() => setOpenPanel({ type: "return", itemId: item.itemId })}><Undo2 size={13} /> Return</SmallButton>
            <SmallButton onClick={() => setOpenPanel({ type: "edit", itemId: item.itemId })}><CalendarClock size={13} /> Edit date</SmallButton>
          </div>
        )}
        {isOpen && openPanel.type === "swap" && <SwapPanel item={item} />}
        {isOpen && openPanel.type === "return" && <ReturnPanel item={item} />}
        {isOpen && openPanel.type === "edit" && <EditDatePanel item={item} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 680 }}>
        <button onClick={() => { setSelectedOrderId(null); setOpenPanel(null); }} style={{ background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}`, padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <ArrowLeft size={15} /> All active rentals
        </button>

        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.INK }}>{customer?.name}</div>
              <div style={{ fontSize: 12.5, color: COLORS.INK_SOFT, fontFamily: "monospace" }}>{customer?.mobile} · {order.id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>Advance held</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.INK }}>₹{order.advance}</div>
            </div>
          </div>
          {customer?.creditBalance > 0 && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: COLORS.FOREST_DARK, background: COLORS.FOREST_BG, borderRadius: 7, padding: "7px 10px" }}>
              Store credit on file: ₹{customer.creditBalance} — apply toward this customer's next rental.
            </div>
          )}
          {order.remarks && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, fontSize: 12, color: COLORS.INK_SOFT }}>
              <StickyNote size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {order.remarks}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>Active items ({activeItems.length})</div>
        {activeItems.length === 0 && <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT, marginBottom: 16 }}>Everything on this order has been returned.</div>}
        {activeItems.map((item) => <ItemCard key={item.itemId} item={item} />)}

        {openPanel?.type === "add" ? <AddItemPanel /> : (
          <SmallButton onClick={() => setOpenPanel({ type: "add", itemId: null })}><PlusCircle size={14} /> Add another machine to this order</SmallButton>
        )}

        {closedItems.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", margin: "24px 0 10px" }}>Returned from this order</div>
            {closedItems.map((item) => (
              <div key={item.itemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.INK }}>{item.machine} — {item.product}</span>
                <Badge tone="neutral">Returned</Badge>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
