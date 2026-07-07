import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AppContext = createContext(null);

// Real, live "today" — the app used to run on a frozen demo date. For real
// counter use this must track the actual current date.
export const TODAY = new Date();
const todayStr = TODAY.toISOString().slice(0, 10);

export function daysOf(seg, endOverride) {
  const start = new Date(seg.from);
  const end = seg.to ? new Date(seg.to) : endOverride || TODAY;
  return Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)), 0);
}

export function itemRunningTotal(item) {
  return item.segments.reduce((s, seg) => s + daysOf(seg) * seg.dailyRate, 0);
}

export function itemDaysLate(item) {
  return Math.max(Math.round((TODAY - new Date(item.expectedReturn)) / (1000 * 60 * 60 * 24)), 0);
}

// ---- next-id helper ----
// Generates the next "PREFIX-123" style id by looking at the highest number
// already in use (in the data currently loaded from Supabase), rather than
// array length — so ids stay stable even after records are deleted.
function nextSeqId(list, prefix, start = 1, pad = 0) {
  const nums = list
    .map((x) => x.id)
    .filter((id) => typeof id === "string" && id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : start;
  return pad ? `${prefix}${String(next).padStart(pad, "0")}` : `${prefix}${next}`;
}

// ---- row <-> app-shape mapping ----
// The database uses snake_case columns; the app's existing pages all expect
// camelCase fields, so each table gets a small mapper in both directions.
const mapCustomerFromRow = (r) => ({
  id: r.id, name: r.name, mobile: r.mobile, address: r.address,
  idFront: r.id_front, idBack: r.id_back, notes: r.notes || "",
  outstanding: Number(r.outstanding) || 0, creditBalance: Number(r.credit_balance) || 0,
  joinedOn: r.joined_on,
});
const mapCustomerToRow = (c) => ({
  id: c.id, name: c.name, mobile: c.mobile, address: c.address,
  id_front: !!c.idFront, id_back: !!c.idBack, notes: c.notes || "",
  outstanding: c.outstanding ?? 0, credit_balance: c.creditBalance ?? 0,
  joined_on: c.joinedOn,
});
const mapProductFromRow = (r) => ({ id: r.id, name: r.name, dailyRent: Number(r.daily_rent) || 0 });
const mapProductToRow = (p) => ({ id: p.id, name: p.name, daily_rent: p.dailyRent });
const mapMachineFromRow = (r) => ({ id: r.id, product: r.product, number: r.number, status: r.status });
const mapMachineToRow = (m) => ({ id: m.id, product: m.product, number: m.number, status: m.status });
const mapOrderFromRow = (r) => ({
  id: r.id, customerId: r.customer_id, advance: Number(r.advance) || 0,
  extraExpense: Number(r.extra_expense) || 0, remarks: r.remarks || "",
  createdOn: r.created_on, items: r.items || [],
});
const mapOrderToRow = (o) => ({
  id: o.id, customer_id: o.customerId, advance: o.advance ?? 0,
  extra_expense: o.extraExpense ?? 0, remarks: o.remarks || "",
  created_on: o.createdOn, items: o.items || [],
});
const mapPaymentFromRow = (r) => ({
  id: r.id, rentalOrderId: r.rental_order_id, productId: r.product_id,
  amount: Number(r.amount) || 0, date: r.date, notes: r.notes || "",
});
const mapPaymentToRow = (p) => ({
  id: p.id, rental_order_id: p.rentalOrderId, product_id: p.productId,
  amount: p.amount ?? 0, date: p.date, notes: p.notes || "",
});
const mapDiscountFromRow = (r) => ({
  id: r.id, rentalOrderId: r.rental_order_id, customerId: r.customer_id,
  amount: Number(r.amount) || 0, date: r.date, notes: r.notes || "",
});
const mapDiscountToRow = (d) => ({
  id: d.id, rental_order_id: d.rentalOrderId, customer_id: d.customerId,
  amount: d.amount ?? 0, date: d.date, notes: d.notes || "",
});
const mapMaintenanceFromRow = (r) => ({
  id: r.id, machineId: r.machine_id, issue: r.issue, reportedOn: r.reported_on, status: r.status,
});
const mapMaintenanceToRow = (m) => ({
  id: m.id, machine_id: m.machineId, issue: m.issue, reported_on: m.reportedOn, status: m.status,
});

async function insertRow(table, row, mapFrom) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return mapFrom(data);
}
async function updateRow(table, id, patch) {
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) throw error;
}
async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [products, setProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setLoadError("");
      try {
        const [p, m, c, o, pay, disc, maint] = await Promise.all([
          supabase.from("products").select("*"),
          supabase.from("machines").select("*"),
          supabase.from("customers").select("*"),
          supabase.from("orders").select("*"),
          supabase.from("payments").select("*"),
          supabase.from("discounts").select("*"),
          supabase.from("maintenance").select("*"),
        ]);
        for (const r of [p, m, c, o, pay, disc, maint]) {
          if (r.error) throw r.error;
        }
        if (cancelled) return;
        setProducts((p.data || []).map(mapProductFromRow));
        setMachines((m.data || []).map(mapMachineFromRow));
        setCustomers((c.data || []).map(mapCustomerFromRow));
        setOrders((o.data || []).map(mapOrderFromRow));
        setPayments((pay.data || []).map(mapPaymentFromRow));
        setDiscounts((disc.data || []).map(mapDiscountFromRow));
        setMaintenance((maint.data || []).map(mapMaintenanceFromRow));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load data from Supabase.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Wipe every saved record — for switching from demo data to a real,
  // blank start, or clearing test entries.
  async function resetAllData() {
    const tables = ["orders", "payments", "discounts", "maintenance", "machines", "customers", "products"];
    for (const t of tables) {
      const { error } = await supabase.from(t).delete().neq("id", "__none__");
      if (error) throw error;
    }
    setProducts([]); setMachines([]); setCustomers([]); setOrders([]);
    setPayments([]); setDiscounts([]); setMaintenance([]);
  }

  // ---- Products ----
  async function addProduct(name, dailyRent) {
    const id = nextSeqId(products, "P-", 1, 2);
    const created = await insertRow("products", mapProductToRow({ id, name, dailyRent }), mapProductFromRow);
    setProducts((prev) => [...prev, created]);
  }
  async function deleteProduct(id) {
    await deleteRow("products", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ---- Machines ----
  async function addMachine(product, number) {
    const id = nextSeqId(machines, "M-", 1, 3);
    const created = await insertRow("machines", mapMachineToRow({ id, product, number, status: "available" }), mapMachineFromRow);
    setMachines((prev) => [...prev, created]);
  }
  async function deleteMachine(id) {
    await deleteRow("machines", id);
    setMachines((prev) => prev.filter((m) => m.id !== id));
  }
  async function setMachineStatus(id, status) {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    await updateRow("machines", id, { status });
  }

  // ---- Customers ----
  async function addCustomer(data) {
    const id = nextSeqId(customers, "C-", 1001);
    const record = { id, outstanding: 0, creditBalance: 0, joinedOn: todayStr, ...data };
    const created = await insertRow("customers", mapCustomerToRow(record), mapCustomerFromRow);
    setCustomers((prev) => [...prev, created]);
    return created;
  }
  async function editCustomer(id, data) {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    const patch = {};
    if ("name" in data) patch.name = data.name;
    if ("mobile" in data) patch.mobile = data.mobile;
    if ("address" in data) patch.address = data.address;
    if ("idFront" in data) patch.id_front = data.idFront;
    if ("idBack" in data) patch.id_back = data.idBack;
    if ("notes" in data) patch.notes = data.notes;
    await updateRow("customers", id, patch);
  }
  async function adjustOutstanding(customerId, delta) {
    const c = customers.find((x) => x.id === customerId);
    const newVal = Math.max(0, (c?.outstanding || 0) + delta);
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, outstanding: newVal } : c)));
    await updateRow("customers", customerId, { outstanding: newVal });
  }
  async function adjustCredit(customerId, delta) {
    const c = customers.find((x) => x.id === customerId);
    const newVal = Math.max(0, (c?.creditBalance || 0) + delta);
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, creditBalance: newVal } : c)));
    await updateRow("customers", customerId, { credit_balance: newVal });
  }

  // ---- Create rental (Start Rental) ----
  async function createRental({ customerId, cart, advance, extraExpense, returnDate, remarks, startDate }) {
    const id = nextSeqId(orders, "RO-", 2001);
    const from = startDate || todayStr;
    const items = cart.map((c, i) => ({
      itemId: `IT-${i + 1}`,
      machineId: c.machineId,
      product: c.product,
      machine: c.number,
      dailyRate: c.dailyRent,
      expectedReturn: returnDate,
      status: "active",
      segments: [{ machineId: c.machineId, machine: c.number, product: c.product, dailyRate: c.dailyRent, from, to: null, reason: null }],
    }));
    const order = { id, customerId, advance: Number(advance) || 0, extraExpense: Number(extraExpense) || 0, remarks, createdOn: from, items };
    const created = await insertRow("orders", mapOrderToRow(order), mapOrderFromRow);
    setOrders((prev) => [...prev, created]);
    const rentedIds = cart.map((c) => c.machineId);
    setMachines((prev) => prev.map((m) => (rentedIds.includes(m.id) ? { ...m, status: "rented" } : m)));
    await supabase.from("machines").update({ status: "rented" }).in("id", rentedIds);
    return created;
  }

  // ---- Add item mid-rental ----
  async function addItemToOrder(orderId, { machineId, product, machine, dailyRate, expectedReturn }) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const newItem = {
      itemId: `IT-${order.items.length + 1}`, machineId, product, machine, dailyRate, expectedReturn, status: "active",
      segments: [{ machineId, machine, product, dailyRate, from: todayStr, to: null, reason: "Added mid-rental" }],
    };
    const newItems = [...order.items, newItem];
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, items: newItems } : o)));
    await updateRow("orders", orderId, { items: newItems });
    await setMachineStatus(machineId, "rented");
  }

  // ---- Swap machine on an active item ----
  async function swapItemMachine(orderId, itemId, { newMachineId, newMachine, newProduct, newDailyRate, reason }) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    let oldMachineId = null;
    const newItems = order.items.map((it) => {
      if (it.itemId !== itemId) return it;
      oldMachineId = it.machineId;
      const closedSegments = it.segments.map((s, idx) =>
        idx === it.segments.length - 1 ? { ...s, to: todayStr, reason } : s
      );
      return {
        ...it, machineId: newMachineId, product: newProduct, machine: newMachine, dailyRate: newDailyRate,
        segments: [...closedSegments, { machineId: newMachineId, machine: newMachine, product: newProduct, dailyRate: newDailyRate, from: todayStr, to: null, reason: null }],
      };
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, items: newItems } : o)));
    await updateRow("orders", orderId, { items: newItems });
    const damaged = /damaged/i.test(reason || "");
    if (oldMachineId) await setMachineStatus(oldMachineId, damaged ? "repair" : "available");
    await setMachineStatus(newMachineId, "rented");
  }

  // ---- Edit an item's expected return date ----
  async function editItemReturnDate(orderId, itemId, newDate) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const newItems = order.items.map((it) => (it.itemId === itemId ? { ...it, expectedReturn: newDate } : it));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, items: newItems } : o)));
    await updateRow("orders", orderId, { items: newItems });
  }

  // ---- Return a single item (full settlement, with discount + credit choice) ----
  async function returnItem(orderId, itemId, { condition, amountPaid, discount, creditChoice }) {
    const order = orders.find((o) => o.id === orderId);
    const item = order?.items.find((i) => i.itemId === itemId);
    if (!order || !item) return null;

    const closedSegs = item.segments.map((s, idx) => (idx === item.segments.length - 1 ? { ...s, to: todayStr } : s));
    let total = closedSegs.reduce((s, seg) => s + daysOf(seg) * seg.dailyRate, 0);
    const totalDays = closedSegs.reduce((s, seg) => s + daysOf(seg), 0);
    if (totalDays === 0) total = item.dailyRate;

    const discountNum = Number(discount) || 0;
    const netDue = Math.max(total - discountNum, 0);
    const paidNum = Number(amountPaid) || 0;
    const remainingAfter = netDue - paidNum;

    const newItems = order.items.map((it) => (it.itemId === itemId ? { ...it, status: "returned", segments: closedSegs } : it));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, items: newItems } : o)));
    await updateRow("orders", orderId, { items: newItems });
    await setMachineStatus(item.machineId, condition === "damaged" ? "repair" : "available");

    if (remainingAfter > 0) await adjustOutstanding(order.customerId, remainingAfter);
    else if (remainingAfter < 0 && creditChoice === "credit") await adjustCredit(order.customerId, Math.abs(remainingAfter));

    if (paidNum > 0) {
      const id = nextSeqId(payments, "PMT-", 1);
      const record = { id, rentalOrderId: orderId, productId: item.product, amount: paidNum, date: todayStr, notes: "Return settlement" };
      const created = await insertRow("payments", mapPaymentToRow(record), mapPaymentFromRow);
      setPayments((prev) => [...prev, created]);
    }
    if (discountNum > 0) {
      const id = nextSeqId(discounts, "DSC-", 1);
      const record = { id, rentalOrderId: orderId, customerId: order.customerId, amount: discountNum, date: todayStr, notes: "" };
      const created = await insertRow("discounts", mapDiscountToRow(record), mapDiscountFromRow);
      setDiscounts((prev) => [...prev, created]);
    }
    return { total, netDue, remainingAfter };
  }

  // ---- Payments (manual entry) ----
  async function addPayment({ productId, rentalOrderId, amount, date, notes }) {
    const id = nextSeqId(payments, "PMT-", 1);
    const record = { id, productId, rentalOrderId, amount: Number(amount) || 0, date, notes };
    const created = await insertRow("payments", mapPaymentToRow(record), mapPaymentFromRow);
    setPayments((prev) => [...prev, created]);
    const order = orders.find((o) => o.id === rentalOrderId);
    if (order) await adjustOutstanding(order.customerId, -Number(amount || 0));
    return created;
  }

  // ---- Maintenance ----
  async function reportMaintenance({ machineId, issue }) {
    const id = nextSeqId(maintenance, "MT-", 1);
    const record = { id, machineId, issue, reportedOn: todayStr, status: "open" };
    const created = await insertRow("maintenance", mapMaintenanceToRow(record), mapMaintenanceFromRow);
    setMaintenance((prev) => [...prev, created]);
    await setMachineStatus(machineId, "repair");
  }
  async function resolveMaintenance(id, machineId) {
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, status: "done" } : m)));
    await updateRow("maintenance", id, { status: "done" });
    await setMachineStatus(machineId, "available");
  }

  const value = {
    loading, loadError,
    products, machines, customers, orders, payments, discounts, maintenance,
    addProduct, deleteProduct,
    addMachine, deleteMachine, setMachineStatus,
    addCustomer, editCustomer, adjustOutstanding, adjustCredit,
    createRental, addItemToOrder, swapItemMachine, editItemReturnDate, returnItem,
    addPayment,
    reportMaintenance, resolveMaintenance,
    resetAllData,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7a72", fontSize: 14 }}>
        Loading your data…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#b3261e", fontSize: 14, padding: 24, textAlign: "center" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Couldn't load data from Supabase</div>
        <div style={{ maxWidth: 420 }}>{loadError}</div>
        <div style={{ marginTop: 10, color: "#6b7a72", fontSize: 12.5 }}>
          Check that the database tables exist (run supabase/schema.sql) and that
          VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set correctly.
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
