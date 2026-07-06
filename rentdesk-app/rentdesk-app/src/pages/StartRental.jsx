import React, { useRef, useState } from "react";
import { Search, UserPlus, CheckCircle2, ArrowLeft, Wrench, ChevronRight, Camera, X, Trash2 } from "lucide-react";
import { COLORS, inputStyle } from "../theme.js";
import { PageHeader, PrimaryButton, GhostButton, Field, Card, StepTicket } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";

const STEPS = ["Search", "Customer", "Items", "Advance", "Done"];

function PhotoCapture({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12.5, color: COLORS.INK_SOFT, marginBottom: 5, fontWeight: 500 }}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result);
          reader.readAsDataURL(file);
        }}
      />
      {value ? (
        <div style={{ position: "relative", width: 140, height: 90, borderRadius: 8, overflow: "hidden", border: `1px solid ${COLORS.LINE}` }}>
          <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button onClick={() => onChange(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(28,35,51,0.7)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={12} color="#fff" />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} style={{ width: 140, height: 90, border: `1.5px dashed ${COLORS.LINE}`, borderRadius: 8, background: COLORS.PAPER, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: COLORS.INK_SOFT, fontSize: 11.5 }}>
          <Camera size={18} />
          Capture
        </button>
      )}
    </div>
  );
}

export default function StartRental() {
  const { products, machines, findCustomer, addCustomer, createRental } = useApp();

  const [phase, setPhase] = useState("search");
  const [mobileQuery, setMobileQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", address: "", idFront: null, idBack: null, notes: "" });
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.name || "");
  const [cart, setCart] = useState([]);
  const [details, setDetails] = useState({ advance: "", returnDate: "", remarks: "" });
  const [lastOrder, setLastOrder] = useState(null);

  const stepIndex = { search: 0, notfound: 0, newcustomer: 1, found: 1, items: 2, advance: 3, confirm: 4 }[phase];

  function resetAll() {
    setPhase("search"); setMobileQuery(""); setNameQuery(""); setActiveCustomer(null);
    setNewCustomer({ name: "", mobile: "", address: "", idFront: null, idBack: null, notes: "" });
    setSelectedProduct(products[0]?.name || ""); setCart([]); setDetails({ advance: "", returnDate: "", remarks: "" });
  }

  function handleSearch() {
    const match = findCustomer({ mobile: mobileQuery, name: nameQuery });
    if (match) { setActiveCustomer(match); setPhase("found"); } else setPhase("notfound");
  }

  function handleCreateCustomer() {
    if (!newCustomer.name.trim() || !newCustomer.mobile.trim()) return;
    const record = addCustomer({
      name: newCustomer.name.trim(), mobile: newCustomer.mobile.trim(), address: newCustomer.address.trim(),
      idFront: newCustomer.idFront, idBack: newCustomer.idBack, notes: newCustomer.notes.trim(),
    });
    setActiveCustomer(record);
    setPhase("items");
  }

  const availableForProduct = machines.filter((m) => m.product === selectedProduct && m.status === "available" && !cart.find((c) => c.machineId === m.id));

  function addToCart(machine) {
    const prod = products.find((p) => p.name === machine.product);
    setCart((prev) => [...prev, { machineId: machine.id, number: machine.number, product: machine.product, dailyRent: prod.dailyRent }]);
  }
  function removeFromCart(id) { setCart((prev) => prev.filter((c) => c.machineId !== id)); }

  function handleSubmit() {
    const order = createRental({ customerId: activeCustomer.id, items: cart, advance: details.advance, returnDate: details.returnDate, remarks: details.remarks });
    setLastOrder(order);
    setPhase("confirm");
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 640 }}>
        <PageHeader title="Start a rental" />
        <StepTicket steps={STEPS} current={stepIndex} />

        <Card>
          {phase === "search" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Find the customer</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 18 }}>Search by mobile or name before starting a new rental.</p>
              <Field label="Mobile number">
                <input style={inputStyle} placeholder="98765 43210" value={mobileQuery} onChange={(e) => { setMobileQuery(e.target.value); setNameQuery(""); }} />
              </Field>
              <div style={{ textAlign: "center", fontSize: 12, color: COLORS.INK_SOFT, margin: "4px 0 14px" }}>OR</div>
              <Field label="Customer name">
                <input style={inputStyle} placeholder="e.g. Rahul Kumar" value={nameQuery} onChange={(e) => { setNameQuery(e.target.value); setMobileQuery(""); }} />
              </Field>
              <PrimaryButton onClick={handleSearch} disabled={!mobileQuery.trim() && !nameQuery.trim()} style={{ width: "100%", justifyContent: "center" }}>
                <Search size={16} /> Search
              </PrimaryButton>
            </div>
          )}

          {phase === "notfound" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>No customer found</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginBottom: 20 }}>Register them once and continue straight to the rental.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <GhostButton onClick={resetAll}><ArrowLeft size={15} /> Search again</GhostButton>
                <PrimaryButton onClick={() => { setNewCustomer((n) => ({ ...n, mobile: mobileQuery, name: nameQuery })); setPhase("newcustomer"); }}>
                  <UserPlus size={16} /> Create new customer
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "newcustomer" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Register customer</div>
              <Field label="Full name"><input style={inputStyle} value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></Field>
              <Field label="Mobile number"><input style={inputStyle} value={newCustomer.mobile} onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })} /></Field>
              <Field label="Address"><input style={inputStyle} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} /></Field>
              <div style={{ display: "flex", gap: 16 }}>
                <PhotoCapture label="ID proof — front" value={newCustomer.idFront} onChange={(v) => setNewCustomer({ ...newCustomer, idFront: v })} />
                <PhotoCapture label="ID proof — back" value={newCustomer.idBack} onChange={(v) => setNewCustomer({ ...newCustomer, idBack: v })} />
              </div>
              <Field label="Notes"><textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} /></Field>
              <div style={{ display: "flex", gap: 10 }}>
                <GhostButton onClick={resetAll}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={handleCreateCustomer} disabled={!newCustomer.name.trim() || !newCustomer.mobile.trim()} style={{ flex: 1, justifyContent: "center" }}>
                  Save and continue <ChevronRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "found" && activeCustomer && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>{activeCustomer.name}</div>
              <div style={{ fontSize: 13, color: COLORS.INK_SOFT, fontFamily: "monospace", marginBottom: 18 }}>{activeCustomer.mobile}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <GhostButton onClick={resetAll}><ArrowLeft size={15} /> Search again</GhostButton>
                <PrimaryButton onClick={() => setPhase("items")} style={{ flex: 1, justifyContent: "center" }}>
                  Continue rental <ChevronRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "items" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Select items</div>
              <p style={{ fontSize: 13, color: COLORS.INK_SOFT, marginTop: 0, marginBottom: 16 }}>Pick a product, then choose an available machine number.</p>
              <Field label="Product">
                <select style={inputStyle} value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                  {products.map((p) => <option key={p.id} value={p.name}>{p.name} — ₹{p.dailyRent}/day</option>)}
                </select>
              </Field>
              <div style={{ marginBottom: 16 }}>
                {availableForProduct.length === 0 ? (
                  <div style={{ fontSize: 13, color: COLORS.INK_SOFT, background: COLORS.PAPER, borderRadius: 8, padding: "12px 14px" }}>No available units for {selectedProduct}.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {availableForProduct.map((m) => (
                      <button key={m.id} onClick={() => addToCart(m)} style={{ border: `1.5px solid ${COLORS.LINE}`, borderRadius: 8, padding: "10px 12px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}><Wrench size={14} color={COLORS.INK_SOFT} />{m.number}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.FOREST_DARK, background: COLORS.FOREST_BG, borderRadius: 5, padding: "3px 7px" }}>ADD</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && cart.map((c) => (
                <div key={c.machineId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.FOREST_BG, borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{c.number}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>{c.product} · ₹{c.dailyRent}/day</div>
                  </div>
                  <button onClick={() => removeFromCart(c.machineId)} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.FOREST_DARK }}><Trash2 size={15} /></button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <GhostButton onClick={() => setPhase("found")}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={() => setPhase("advance")} disabled={cart.length === 0} style={{ flex: 1, justifyContent: "center" }}>
                  Continue with {cart.length} item{cart.length === 1 ? "" : "s"} <ChevronRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "advance" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.INK, marginBottom: 4 }}>Advance & terms</div>
              <Field label="Advance received (₹)"><input type="number" style={inputStyle} value={details.advance} onChange={(e) => setDetails({ ...details, advance: e.target.value })} /></Field>
              <Field label="Expected return date"><input type="date" style={inputStyle} value={details.returnDate} onChange={(e) => setDetails({ ...details, returnDate: e.target.value })} /></Field>
              <Field label="Remarks"><textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={details.remarks} onChange={(e) => setDetails({ ...details, remarks: e.target.value })} /></Field>
              <div style={{ display: "flex", gap: 10 }}>
                <GhostButton onClick={() => setPhase("items")}><ArrowLeft size={15} /> Back</GhostButton>
                <PrimaryButton onClick={handleSubmit} disabled={!details.returnDate} style={{ flex: 1, justifyContent: "center" }}>Submit rental</PrimaryButton>
              </div>
            </div>
          )}

          {phase === "confirm" && lastOrder && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={30} color={COLORS.FOREST_DARK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.INK, marginBottom: 16 }}>Rental order {lastOrder.id} created</div>
              <PrimaryButton onClick={resetAll} style={{ width: "100%", justifyContent: "center" }}>Start next rental</PrimaryButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
