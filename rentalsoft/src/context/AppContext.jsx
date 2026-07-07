import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

// Real, live "today" — was hardcoded to a fixed demo date before.
// For day-to-day counter use this must track the actual current date.
export const TODAY = new Date();
const todayStr = TODAY.toISOString().slice(0, 10);

// ---- localStorage persistence ----
// Everything below used to live only in React state, which reset on every
// page refresh. For real daily use that's a non-starter, so each slice of
// state is now mirrored to localStorage under its own key and rehydrated
// on load.
const STORAGE_PREFIX = "rentdesk:";

function loadPersisted(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState(key, initial) {
  const [state, setState] = useState(() => loadPersisted(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage full or unavailable (e.g. private browsing) — data will
      // still work for this session, it just won't persist across reloads.
    }
  }, [key, state]);
  return [state, setState];
}

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

const seedProducts = [
  { id: "P-01", name: "Hammer Drill", dailyRent: 150 },
  { id: "P-02", name: "Cutter Machine", dailyRent: 200 },
  { id: "P-03", name: "Concrete Vibrator", dailyRent: 180 },
  { id: "P-04", name: "Generator", dailyRent: 500 },
];

const seedMachines = [
  { id: "M-001", product: "Hammer Drill", number: "Hammer-001", status: "available" },
  { id: "M-002", product: "Hammer Drill", number: "Hammer-002", status: "rented" },
  { id: "M-003", product: "Hammer Drill", number: "Hammer-003", status: "rented" },
  { id: "M-004", product: "Cutter Machine", number: "Cutter-001", status: "available" },
  { id: "M-005", product: "Cutter Machine", number: "Cutter-002", status: "rented" },
  { id: "M-006", product: "Concrete Vibrator", number: "Vibrator-001", status: "repair" },
  { id: "M-007", product: "Generator", number: "Generator-001", status: "rented" },
  { id: "M-008", product: "Generator", number: "Generator-002", status: "available" },
];

const seedCustomers = [
  { id: "C-1042", name: "Rahul Kumar", mobile: "9876543210", address: "14 Gandhi Nagar, Bhopal", idFront: true, idBack: true, notes: "Regular customer, always pays on time.", outstanding: 450, creditBalance: 0, joinedOn: "2025-11-02" },
  { id: "C-1043", name: "Rahul Kumar", mobile: "9823456781", address: "7 Link Road, Kolar, Bhopal", idFront: false, idBack: false, notes: "", outstanding: 0, creditBalance: 0, joinedOn: "2026-06-30" },
  { id: "C-1044", name: "Rahul Kumar Sharma", mobile: "9871122334", address: "MP Nagar Zone 2, Bhopal", idFront: true, idBack: false, notes: "", outstanding: 0, creditBalance: 0, joinedOn: "2026-03-15" },
  { id: "C-1055", name: "Sunita Verma", mobile: "9812345670", address: "22 Shastri Colony, Bhopal", idFront: true, idBack: true, notes: "Prefers WhatsApp reminders before due date.", outstanding: 0, creditBalance: 0, joinedOn: "2025-08-10" },
];

// orders: { id, customerId, advance, extraExpense, remarks, createdOn,
//   items: [{ itemId, machineId, product, machine, dailyRate, expectedReturn,
//             status: 'active'|'returned', segments: [{machineId, machine, product, dailyRate, from, to, reason}] }] }
const seedOrders = [
  {
    id: "RO-2001", customerId: "C-1042", advance: 300, extraExpense: 50,
    remarks: "Generator added Jul 3 for an extra job on site.", createdOn: "2026-06-28",
    items: [
      {
        itemId: "IT-1", machineId: "M-005", product: "Cutter Machine", machine: "Cutter-002", dailyRate: 200, expectedReturn: "2026-07-03", status: "active",
        segments: [
          { machineId: "M-002", machine: "Hammer-002", product: "Hammer Drill", dailyRate: 150, from: "2026-06-28", to: "2026-07-04", reason: "Damaged — swapped for Cutter Machine" },
          { machineId: "M-005", machine: "Cutter-002", product: "Cutter Machine", dailyRate: 200, from: "2026-07-04", to: null, reason: null },
        ],
      },
      {
        itemId: "IT-2", machineId: "M-007", product: "Generator", machine: "Generator-001", dailyRate: 500, expectedReturn: "2026-07-06", status: "active",
        segments: [{ machineId: "M-007", machine: "Generator-001", product: "Generator", dailyRate: 500, from: "2026-07-03", to: null, reason: "Added mid-rental" }],
      },
    ],
  },
  {
    id: "RO-1998", customerId: "C-1055", advance: 200, extraExpense: 0, remarks: "", createdOn: "2026-07-01",
    items: [
      {
        itemId: "IT-1", machineId: "M-005b", product: "Generator", machine: "Generator-003", dailyRate: 500, expectedReturn: "2026-07-06", status: "active",
        segments: [{ machineId: "M-005b", machine: "Generator-003", product: "Generator", dailyRate: 500, from: "2026-07-01", to: null, reason: null }],
      },
    ],
  },
];

const seedPayments = [];
const seedDiscounts = [];
const seedMaintenance = [];

export function AppProvider({ children }) {
  const [products, setProducts] = usePersistentState("products", seedProducts);
  const [machines, setMachines] = usePersistentState("machines", seedMachines);
  const [customers, setCustomers] = usePersistentState("customers", seedCustomers);
  const [orders, setOrders] = usePersistentState("orders", seedOrders);
  const [payments, setPayments] = usePersistentState("payments", seedPayments);
  const [discounts, setDiscounts] = usePersistentState("discounts", seedDiscounts);
  const [maintenance, setMaintenance] = usePersistentState("maintenance", seedMaintenance);

  // Wipe every saved record and start blank — for switching from the demo
  // data over to real shop data.
  function resetAllData() {
    const keys = ["products", "machines", "customers", "orders", "payments", "discounts", "maintenance"];
    keys.forEach((k) => localStorage.removeItem(STORAGE_PREFIX + k));
    setProducts([]);
    setMachines([]);
    setCustomers([]);
    setOrders([]);
    setPayments([]);
    setDiscounts([]);
    setMaintenance([]);
  }

  // ---- Products ----
  function addProduct(name, dailyRent) {
    const id = `P-${String(products.length + 1).padStart(2, "0")}`;
    setProducts((prev) => [...prev, { id, name, dailyRent }]);
  }
  function deleteProduct(id) { setProducts((prev) => prev.filter((p) => p.id !== id)); }

  // ---- Machines ----
  function addMachine(product, number) {
    const id = `M-${String(machines.length + 1).padStart(3, "0")}`;
    setMachines((prev) => [...prev, { id, product, number, status: "available" }]);
  }
  function deleteMachine(id) { setMachines((prev) => prev.filter((m) => m.id !== id)); }
  function setMachineStatus(id, status) { setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m))); }

  // ---- Customers ----
  function addCustomer(data) {
    const id = `C-${1000 + customers.length + 1}`;
    const record = { id, outstanding: 0, creditBalance: 0, joinedOn: todayStr, ...data };
    setCustomers((prev) => [...prev, record]);
    return record;
  }
  function editCustomer(id, data) {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }
  function adjustOutstanding(customerId, delta) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, outstanding: Math.max(0, c.outstanding + delta) } : c)));
  }
  function adjustCredit(customerId, delta) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, creditBalance: Math.max(0, (c.creditBalance || 0) + delta) } : c)));
  }

  // ---- Create rental (Start Rental) ----
  function createRental({ customerId, cart, advance, extraExpense, returnDate, remarks, startDate }) {
    const id = `RO-${2000 + orders.length + 1}`;
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
    setOrders((prev) => [...prev, order]);
    setMachines((prev) => prev.map((m) => (cart.find((c) => c.machineId === m.id) ? { ...m, status: "rented" } : m)));
    return order;
  }

  // ---- Add item mid-rental ----
  function addItemToOrder(orderId, { machineId, product, machine, dailyRate, expectedReturn }) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newItem = {
          itemId: `IT-${o.items.length + 1}`, machineId, product, machine, dailyRate, expectedReturn, status: "active",
          segments: [{ machineId, machine, product, dailyRate, from: todayStr, to: null, reason: "Added mid-rental" }],
        };
        return { ...o, items: [...o.items, newItem] };
      })
    );
    setMachineStatus(machineId, "rented");
  }

  // ---- Swap machine on an active item ----
  function swapItemMachine(orderId, itemId, { newMachineId, newMachine, newProduct, newDailyRate, reason }) {
    let oldMachineId = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((it) => {
            if (it.itemId !== itemId) return it;
            oldMachineId = it.machineId;
            const closedSegments = it.segments.map((s, idx) =>
              idx === it.segments.length - 1 ? { ...s, to: todayStr, reason } : s
            );
            return {
              ...it, machineId: newMachineId, product: newProduct, machine: newMachine, dailyRate: newDailyRate,
              segments: [...closedSegments, { machineId: newMachineId, machine: newMachine, product: newProduct, dailyRate: newDailyRate, from: todayStr, to: null, reason: null }],
            };
          }),
        };
      })
    );
    const damaged = /damaged/i.test(reason || "");
    if (oldMachineId) setMachineStatus(oldMachineId, damaged ? "repair" : "available");
    setMachineStatus(newMachineId, "rented");
  }

  // ---- Edit an item's expected return date ----
  function editItemReturnDate(orderId, itemId, newDate) {
    setOrders((prev) =>
      prev.map((o) => (o.id !== orderId ? o : { ...o, items: o.items.map((it) => (it.itemId === itemId ? { ...it, expectedReturn: newDate } : it)) }))
    );
  }

  // ---- Return a single item (full settlement, with discount + credit choice) ----
  function returnItem(orderId, itemId, { condition, amountPaid, discount, creditChoice }) {
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

    setOrders((prev) =>
      prev.map((o) =>
        o.id !== orderId ? o : { ...o, items: o.items.map((it) => (it.itemId === itemId ? { ...it, status: "returned", segments: closedSegs } : it)) }
      )
    );
    setMachineStatus(item.machineId, condition === "damaged" ? "repair" : "available");

    if (remainingAfter > 0) adjustOutstanding(order.customerId, remainingAfter);
    else if (remainingAfter < 0 && creditChoice === "credit") adjustCredit(order.customerId, Math.abs(remainingAfter));

    if (paidNum > 0) {
      setPayments((prev) => [...prev, { id: `PMT-${prev.length + 1}`, rentalOrderId: orderId, productId: item.product, amount: paidNum, date: todayStr, notes: "Return settlement" }]);
    }
    if (discountNum > 0) {
      setDiscounts((prev) => [...prev, { id: `DSC-${prev.length + 1}`, rentalOrderId: orderId, customerId: order.customerId, amount: discountNum, date: todayStr, notes: "" }]);
    }
    return { total, netDue, remainingAfter };
  }

  // ---- Payments (manual entry) ----
  function addPayment({ productId, rentalOrderId, amount, date, notes }) {
    const id = `PMT-${payments.length + 1}`;
    const record = { id, productId, rentalOrderId, amount: Number(amount) || 0, date, notes };
    setPayments((prev) => [...prev, record]);
    const order = orders.find((o) => o.id === rentalOrderId);
    if (order) adjustOutstanding(order.customerId, -Number(amount || 0));
    return record;
  }

  // ---- Maintenance ----
  function reportMaintenance({ machineId, issue }) {
    const id = `MT-${maintenance.length + 1}`;
    setMaintenance((prev) => [...prev, { id, machineId, issue, reportedOn: todayStr, status: "open" }]);
    setMachineStatus(machineId, "repair");
  }
  function resolveMaintenance(id, machineId) {
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, status: "done" } : m)));
    setMachineStatus(machineId, "available");
  }

  const value = {
    products, machines, customers, orders, payments, discounts, maintenance,
    addProduct, deleteProduct,
    addMachine, deleteMachine, setMachineStatus,
    addCustomer, editCustomer, adjustOutstanding, adjustCredit,
    createRental, addItemToOrder, swapItemMachine, editItemReturnDate, returnItem,
    addPayment,
    reportMaintenance, resolveMaintenance,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
