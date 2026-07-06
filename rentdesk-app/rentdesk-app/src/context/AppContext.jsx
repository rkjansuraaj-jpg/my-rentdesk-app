import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

// TODAY is fixed for demo purposes. Swap this for `new Date()` once you're
// running against real dates, or drive it from your Google Sheets sync.
export const TODAY = new Date("2026-07-05");

const seedProducts = [
  { id: "P-01", name: "Hammer Drill", dailyRent: 150 },
  { id: "P-02", name: "Cutter Machine", dailyRent: 200 },
  { id: "P-03", name: "Concrete Vibrator", dailyRent: 180 },
  { id: "P-04", name: "Generator", dailyRent: 500 },
];

const seedMachines = [
  { id: "M-001", product: "Hammer Drill", number: "Hammer-001", status: "available" },
  { id: "M-002", product: "Hammer Drill", number: "Hammer-002", status: "available" },
  { id: "M-003", product: "Hammer Drill", number: "Hammer-003", status: "available" },
  { id: "M-004", product: "Cutter Machine", number: "Cutter-001", status: "available" },
  { id: "M-005", product: "Cutter Machine", number: "Cutter-002", status: "available" },
  { id: "M-006", product: "Concrete Vibrator", number: "Vibrator-001", status: "repair" },
  { id: "M-007", product: "Generator", number: "Generator-001", status: "available" },
  { id: "M-008", product: "Generator", number: "Generator-002", status: "available" },
];

const seedCustomers = [
  {
    id: "C-1042", name: "Rahul Kumar", mobile: "9876543210", address: "14 Gandhi Nagar, Bhopal",
    idFront: null, idBack: null, notes: "", outstanding: 450,
  },
  {
    id: "C-1055", name: "Sunita Verma", mobile: "9812345670", address: "22 Shastri Colony, Bhopal",
    idFront: null, idBack: null, notes: "", outstanding: 0,
  },
];

// orders: { id, customerId, items: [{ machineId, number, product, dailyRent }],
//           advance, returnDate, remarks, status: 'active'|'closed', createdOn }
const seedOrders = [];
const seedPayments = []; // { id, productId, rentalOrderId, amount, date, notes }
const seedMaintenance = []; // { id, machineId, issue, reportedOn, status: 'open'|'done' }

export function AppProvider({ children }) {
  const [products, setProducts] = useState(seedProducts);
  const [machines, setMachines] = useState(seedMachines);
  const [customers, setCustomers] = useState(seedCustomers);
  const [orders, setOrders] = useState(seedOrders);
  const [payments, setPayments] = useState(seedPayments);
  const [maintenance, setMaintenance] = useState(seedMaintenance);

  // ---- Products ----
  function addProduct(name, dailyRent) {
    const id = `P-${String(products.length + 1).padStart(2, "0")}`;
    setProducts((prev) => [...prev, { id, name, dailyRent }]);
  }
  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ---- Machines ----
  function addMachine(product, number) {
    const id = `M-${String(machines.length + 1).padStart(3, "0")}`;
    setMachines((prev) => [...prev, { id, product, number, status: "available" }]);
  }
  function deleteMachine(id) {
    setMachines((prev) => prev.filter((m) => m.id !== id));
  }
  function setMachineStatus(id, status) {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  // ---- Customers ----
  function findCustomer({ mobile, name }) {
    const m = mobile?.trim();
    const n = name?.trim().toLowerCase();
    if (m) return customers.find((c) => c.mobile.includes(m));
    if (n) return customers.find((c) => c.name.toLowerCase().includes(n));
    return null;
  }
  function addCustomer(data) {
    const id = `C-${1000 + customers.length + 1}`;
    const record = { id, outstanding: 0, ...data };
    setCustomers((prev) => [...prev, record]);
    return record;
  }
  function adjustOutstanding(customerId, delta) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, outstanding: Math.max(0, c.outstanding + delta) } : c)));
  }

  // ---- Rentals ----
  function createRental({ customerId, items, advance, returnDate, remarks }) {
    const id = `RO-${2000 + orders.length + 1}`;
    const order = {
      id, customerId, items, advance: Number(advance) || 0,
      returnDate, remarks, status: "active",
      createdOn: TODAY.toISOString().slice(0, 10),
    };
    setOrders((prev) => [...prev, order]);
    setMachines((prev) => prev.map((m) => (items.find((i) => i.machineId === m.id) ? { ...m, status: "rented" } : m)));
    return order;
  }

  function returnItems({ orderId, machineIds, rentTotal, lateFee, depositRefund, damagedIds = [] }) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const remaining = o.items.filter((i) => !machineIds.includes(i.machineId));
        return { ...o, items: remaining, status: remaining.length === 0 ? "closed" : "active" };
      })
    );
    setMachines((prev) =>
      prev.map((m) => (machineIds.includes(m.id) ? { ...m, status: damagedIds.includes(m.id) ? "repair" : "available" } : m))
    );
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const balanceDue = rentTotal + (lateFee || 0) - order.advance;
      adjustOutstanding(order.customerId, Math.max(balanceDue, 0));
    }
  }

  // ---- Payments ----
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
    setMaintenance((prev) => [...prev, { id, machineId, issue, reportedOn: TODAY.toISOString().slice(0, 10), status: "open" }]);
    setMachineStatus(machineId, "repair");
  }
  function resolveMaintenance(id, machineId) {
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, status: "done" } : m)));
    setMachineStatus(machineId, "available");
  }

  const value = {
    products, machines, customers, orders, payments, maintenance,
    addProduct, deleteProduct,
    addMachine, deleteMachine, setMachineStatus,
    findCustomer, addCustomer, adjustOutstanding,
    createRental, returnItems,
    addPayment,
    reportMaintenance, resolveMaintenance,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
