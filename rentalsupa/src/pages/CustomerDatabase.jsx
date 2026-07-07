import React, { useMemo, useState } from "react";
import { Search, ArrowLeft, MapPin, Phone, StickyNote, Wrench, ReceiptText, IndianRupee, Clock, AlertTriangle, CreditCard, Pencil, Tag, X, Check } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader } from "../components/ui.jsx";
import { useApp, itemDaysLate } from "../context/AppContext.jsx";

function isValidMobile(m) { return /^[6-9]\d{9}$/.test((m || "").trim()); }

function StatChip({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { bg: COLORS.PAPER, fg: COLORS.INK, iconFg: COLORS.INK_SOFT },
    forest: { bg: COLORS.FOREST_BG, fg: COLORS.FOREST_DARK, iconFg: COLORS.FOREST_DARK },
    amber: { bg: COLORS.AMBER_BG, fg: COLORS.AMBER, iconFg: COLORS.AMBER },
    red: { bg: COLORS.RED_BG, fg: COLORS.RED, iconFg: COLORS.RED },
  }[tone];
  return (
    <div style={{ background: tones.bg, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon size={13} color={tones.iconFg} />
        <span style={{ fontSize: 11, color: COLORS.INK_SOFT }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: tones.fg }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10, marginTop: 22 }}>{children}</div>;
}

export default function CustomerDatabase() {
  const { customers, orders, payments, discounts, editCustomer } = useApp();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const visibleCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.address.toLowerCase().includes(q));
  }, [query, customers]);

  const selected = customers.find((c) => c.id === selectedId);

  const profile = useMemo(() => {
    if (!selected) return null;
    const myOrders = orders.filter((o) => o.customerId === selected.id);
    const myPayments = payments.filter((p) => {
      const o = orders.find((oo) => oo.id === p.rentalOrderId);
      return o?.customerId === selected.id;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    const myDiscounts = discounts.filter((d) => d.customerId === selected.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const activeItems = myOrders.flatMap((o) => o.items.filter((i) => i.status === "active").map((i) => ({ ...i, orderId: o.id })));
    const overdueItems = activeItems.filter((i) => itemDaysLate(i) > 0);
    const totalPaid = myPayments.reduce((s, p) => s + p.amount, 0);
    const totalDiscount = myDiscounts.reduce((s, d) => s + d.amount, 0);
    return { myOrders, myPayments, myDiscounts, activeItems, overdueItems, totalPaid, totalDiscount };
  }, [selected, orders, payments, discounts]);

  function startEdit() {
    setEditForm({ name: selected.name, mobile: selected.mobile, address: selected.address, notes: selected.notes });
    setEditError("");
    setEditing(true);
  }

  function saveEdit() {
    if (!editForm.name.trim()) { setEditError("Name can't be empty."); return; }
    if (!isValidMobile(editForm.mobile)) { setEditError("Wrong number — enter a 10-digit mobile number starting with 6, 7, 8, or 9."); return; }
    editCustomer(selected.id, { ...editForm, mobile: editForm.mobile.trim(), name: editForm.name.trim() });
    setEditing(false);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 720 }}>
        <PageHeader title="Customers" />

        {!selected && (
          <div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={15} color={COLORS.INK_SOFT} style={{ position: "absolute", left: 12, top: 12 }} />
              <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search by name, mobile, or address" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
              {visibleCustomers.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No customers match that search.</div>}
              {visibleCustomers.map((c, i) => {
                const activeCount = orders.filter((o) => o.customerId === c.id).flatMap((o) => o.items).filter((it) => it.status === "active").length;
                return (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}`, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: COLORS.FOREST_BG, color: COLORS.FOREST_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.INK_SOFT, marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "monospace" }}>{c.mobile}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {c.address}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {activeCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: COLORS.AMBER_BG, color: COLORS.AMBER, padding: "4px 8px", borderRadius: 6 }}>{activeCount} active</span>}
                      {c.outstanding > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: COLORS.RED_BG, color: COLORS.RED, padding: "4px 8px", borderRadius: 6 }}>₹{c.outstanding} due</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selected && profile && (
          <div>
            <button onClick={() => { setSelectedId(null); setEditing(false); }} style={{ background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}`, padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <ArrowLeft size={15} /> All customers
            </button>

            <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 22, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: COLORS.FOREST_BG, color: COLORS.FOREST_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {selected.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.INK }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>{selected.id} · customer since {selected.joinedOn}</div>
                  </div>
                </div>
                {!editing && (
                  <button onClick={startEdit} style={{ background: "transparent", border: `1px solid ${COLORS.LINE}`, color: COLORS.INK_SOFT, borderRadius: 7, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>

              {!editing ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: selected.notes ? 14 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.INK }}><Phone size={14} color={COLORS.INK_SOFT} /> <span style={{ fontFamily: "monospace" }}>{selected.mobile}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.INK }}><MapPin size={14} color={COLORS.INK_SOFT} /> {selected.address}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.INK }}>
                      <CreditCard size={14} color={COLORS.INK_SOFT} />
                      {selected.idFront || selected.idBack ? <span>ID on file{selected.idFront && selected.idBack ? " (front & back)" : selected.idFront ? " (front only)" : " (back only)"}</span> : <span style={{ color: COLORS.RED }}>No ID captured yet</span>}
                    </div>
                  </div>
                  {selected.notes && (
                    <div style={{ display: "flex", gap: 8, background: COLORS.PAPER, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: COLORS.INK_SOFT }}>
                      <StickyNote size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {selected.notes}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Name</label>
                      <input style={inputStyle} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Mobile</label>
                      <input style={inputStyle} value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11.5, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Address</label>
                    <input style={inputStyle} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: editError ? 8 : 14 }}>
                    <label style={{ display: "block", fontSize: 11.5, color: COLORS.INK_SOFT, marginBottom: 4, fontWeight: 500 }}>Notes</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                  {editError && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.RED, marginBottom: 14 }}><AlertTriangle size={13} /> {editError}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditing(false)} style={{ background: "transparent", color: COLORS.INK_SOFT, border: `1px solid ${COLORS.LINE}`, borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><X size={14} /> Cancel</button>
                    <button onClick={saveEdit} style={{ background: COLORS.FOREST, color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Check size={14} /> Save changes</button>
                  </div>
                </div>
              )}
            </div>

            <SectionLabel>Financial summary</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
              <StatChip icon={IndianRupee} label="Total paid" value={`₹${profile.totalPaid}`} tone="forest" />
              <StatChip icon={AlertTriangle} label="Outstanding" value={`₹${selected.outstanding}`} tone={selected.outstanding > 0 ? "red" : "neutral"} />
              <StatChip icon={Tag} label="Discount given" value={`₹${profile.totalDiscount}`} tone={profile.totalDiscount > 0 ? "amber" : "neutral"} />
              <StatChip icon={Wrench} label="Total rentals" value={profile.myOrders.length} />
              <StatChip icon={Clock} label="Active now" value={profile.activeItems.length} tone={profile.activeItems.length > 0 ? "amber" : "neutral"} />
            </div>
            {selected.creditBalance > 0 && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: COLORS.FOREST_DARK, background: COLORS.FOREST_BG, borderRadius: 8, padding: "9px 12px" }}>
                Store credit on file: ₹{selected.creditBalance}
              </div>
            )}
            {profile.overdueItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.RED_BG, color: COLORS.RED, borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>
                <AlertTriangle size={15} /> {profile.overdueItems.length} item{profile.overdueItems.length > 1 ? "s" : ""} currently overdue
              </div>
            )}

            <SectionLabel>Rental history</SectionLabel>
            <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
              {profile.myOrders.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No rentals yet.</div>}
              {profile.myOrders.map((o, i) => (
                <div key={o.id} style={{ padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>{o.id}</div>
                  {o.items.map((it) => {
                    const late = it.status === "active" ? itemDaysLate(it) : 0;
                    return (
                      <div key={it.itemId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: COLORS.INK_SOFT, padding: "3px 0" }}>
                        <span>{it.machine} · {it.product}</span>
                        <span style={{ fontWeight: 600, color: it.status === "returned" ? COLORS.FOREST_DARK : late > 0 ? COLORS.RED : COLORS.AMBER }}>
                          {it.status === "returned" ? "Returned" : late > 0 ? `${late}d late` : "Active"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <SectionLabel>Payment history</SectionLabel>
            <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
              {profile.myPayments.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No payments recorded yet.</div>}
              {profile.myPayments.map((p, i) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.FOREST_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ReceiptText size={15} color={COLORS.FOREST_DARK} /></div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{p.rentalOrderId}</div>
                      <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>{p.date} · {p.notes}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.FOREST_DARK }}>₹{Math.round(p.amount)}</div>
                </div>
              ))}
            </div>

            <SectionLabel>Discounts given</SectionLabel>
            <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
              {profile.myDiscounts.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No discounts given to this customer.</div>}
              {profile.myDiscounts.map((d, i) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.AMBER_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Tag size={15} color={COLORS.AMBER} /></div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{d.rentalOrderId}</div>
                      <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>{d.date}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.AMBER }}>₹{Math.round(d.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
