import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./components/Login.jsx";
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
import { useAuth } from "./context/AuthContext.jsx";
import { AppProvider } from "./context/AppContext.jsx";

export default function App() {
  const { session } = useAuth();

  // undefined = Supabase hasn't told us yet whether a session exists
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7a72", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <AppProvider>
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
    </AppProvider>
  );
}
