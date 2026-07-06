import React, { useMemo } from "react";
import { Boxes, Clock, Wrench, CheckCircle2 } from "lucide-react";
import { COLORS } from "../theme.js";
import { PageHeader } from "../components/ui.jsx";
import { useApp, TODAY } from "../context/AppContext.jsx";

export default function Reports() {
  const { machines, customers, orders } = useApp();

  const report = useMemo(() => {
    const totalRented = machines.filter((m) => m.status === "rented").length;
    const available = machines.filter((m) => m.status === "available").length;
    const repair = machines.filter((m) => m.status === "repair").length;

    const activeOrders = orders.filter((o) => o.status === "active" && o.items.length > 0);
    const longRenters = activeOrders
      .map((o) => {
        const days = Math.round((TODAY - new Date(o.createdOn)) / (1000 * 60 * 60 * 24));
        return { order: o, customer: customers.find((c) => c.id === o.customerId), days };
      })
      .filter((r) => r.days > 3);

    return { totalRented, available, repair, longRenters };
  }, [machines, customers, orders]);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Reports" subtitle="Quick operational summaries." />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 26 }}>
          {[
            { icon: Clock, label: "Machines rented", value: report.totalRented, tone: [COLORS.AMBER_BG, COLORS.AMBER] },
            { icon: CheckCircle2, label: "Available", value: report.available, tone: [COLORS.FOREST_BG, COLORS.FOREST_DARK] },
            { icon: Wrench, label: "Under repair", value: report.repair, tone: [COLORS.RED_BG, COLORS.RED] },
          ].map((s) => (
            <div key={s.label} style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.tone[0], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={17} color={s.tone[1]} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.INK }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>
          Customers renting more than 3 days
        </div>
        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {report.longRenters.length === 0 && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No one currently over 3 days.</div>}
          {report.longRenters.map((r, i) => (
            <div key={r.order.id} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{r.customer?.name}</div>
                <div style={{ fontSize: 12, color: COLORS.INK_SOFT }}>{r.order.items.map((it) => it.number).join(", ")}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.AMBER }}>{r.days} days</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
