import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, UserSearch, UserPlus2, Package, Wrench, ClipboardList, Undo2, ReceiptText, Hammer, BarChart3, Users, LogOut } from "lucide-react";
import { COLORS } from "../theme.js";
import { useAuth } from "../context/AuthContext.jsx";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rental/new", label: "New Rental", icon: ClipboardList },
  { to: "/rental/return", label: "Return Rental", icon: Undo2 },
  { to: "/rental/manage", label: "Manage Active Rental", icon: Wrench },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Product List", icon: Package },
  { to: "/machines", label: "Machine List", icon: Wrench },
  { to: "/payments", label: "Payment Entry", icon: ReceiptText },
  { to: "/maintenance", label: "Maintenance", icon: Hammer },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const { session, signOut } = useAuth();
  return (
    <div style={{ width: 216, background: "#fff", borderRight: `1px solid ${COLORS.LINE}`, height: "100vh", flexShrink: 0, position: "sticky", top: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 18px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.FOREST_DARK, letterSpacing: 0.5 }}>RentDesk</div>
        <div style={{ fontSize: 11, color: COLORS.INK_SOFT }}>Tool & machine rental</div>
      </div>
      <nav style={{ padding: "6px 10px", flex: 1 }}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              textDecoration: "none",
              color: isActive ? COLORS.FOREST_DARK : COLORS.INK_SOFT,
              background: isActive ? COLORS.FOREST_BG : "transparent",
              marginBottom: 2,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${COLORS.LINE}` }}>
        {session?.user?.email && (
          <div style={{ fontSize: 11, color: COLORS.INK_SOFT, marginBottom: 8, wordBreak: "break-all" }}>
            {session.user.email}
          </div>
        )}
        <button
          onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, color: COLORS.INK_SOFT, fontSize: 13, cursor: "pointer" }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}
