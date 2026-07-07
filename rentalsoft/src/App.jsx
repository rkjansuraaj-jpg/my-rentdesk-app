import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProductList from "./pages/ProductList.jsx";
import MachineList from "./pages/MachineList.jsx";
import StartRental from "./pages/StartRental.jsx";
import ReturnRental from "./pages/ReturnRental.jsx";
import ManageActiveRental from "./pages/ManageActiveRental.jsx";
import CustomerDatabase from "./pages/CustomerDatabase.jsx";
import PaymentEntry from "./pages/PaymentEntry.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rental/new" element={<StartRental />} />
          <Route path="/rental/return" element={<ReturnRental />} />
          <Route path="/rental/manage" element={<ManageActiveRental />} />
          <Route path="/customers" element={<CustomerDatabase />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/machines" element={<MachineList />} />
          <Route path="/payments" element={<PaymentEntry />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
}
