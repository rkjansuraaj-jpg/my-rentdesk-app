import React, { useMemo } from "react";
import { Boxes, CheckCircle2, Wrench, AlertTriangle, Clock, IndianRupee, Users, UserX, Undo2, PackagePlus, ReceiptText } from "lucide-react";
import { COLORS } from "../theme.js";
import { PageHeader } from "../components/ui.jsx";
import { useApp, TODAY } from "../context/AppContext.jsx";

function daysOverdue(expectedReturn) {
  if (!expectedReturn) return -999;
  return Math.round((TODAY - new Date(expectedReturn)) / (1000 * 60 * 60 * 24));
}

function StatCard({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { fg: COLORS.INK, iconBg: COLORS.PAPER, iconFg: COLORS.INK_SOFT },
    forest: { fg: COLORS.FOREST_DARK, iconBg: COLORS.FOREST_BG, iconFg: COLORS.FOREST_DARK },
    amber: { fg: COLORS.AMBER, iconBg: COLORS.AMBER_BG, iconFg: COLORS.AMBER },
    red: { fg: COLORS.RED, iconBg: COLORS.RED_BG, iconFg: COLORS.RED },
  }[tone];
  return (
    <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: tones.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={tones.iconFg} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: tones.fg, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.INK_SOFT, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

function AlertRow({ icon: Icon, title, subtitle, tone }) {
  const t = { red: [COLORS.RED_BG, COLORS.RED], amber: [COLORS.AMBER_BG, COLORS.AMBER], neutral: [COLORS.PAPER, COLORS.INK_SOFT] }[tone];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: t[0], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={t[1]} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.INK }}>{title}</div>
        <div style={{ fontSize: 11.5, color: COLORS.INK_SOFT }}>{subtitle}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { machines, customers, orders, payments } = useApp();
  const todayStr = TODAY.toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const total = machines.length;
    const available = machines.filter((m) => m.status === "available").length;
    const rented = machines.filter((m) => m.status === "rented").length;
    const repair = machines.filter((m) => m.status === "repair").length;

    const activeOrders = orders.filter((o) => o.status === "active" && o.items.length > 0);
    const activeCustomerIds = new Set(activeOrders.map((o) => o.customerId));
    const outstandingTotal = customers.reduce((s, c) => s + c.outstanding, 0);
    const pendingPaymentCustomers = customers.filter((c) => c.outstanding > 0).length;

    const overdue3Plus = [];
    const dueToday = [];
    const overdueCustomerIds = new Set();
    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const d = daysOverdue(o.returnDate);
        if (d >= 3) { overdue3Plus.push({ number: item.number, customer: customers.find((c) => c.id === o.customerId)?.name, days: d }); overdueCustomerIds.add(o.customerId); }
        else if (d === 0) dueToday.push({ number: item.number, customer: customers.find((c) => c.id === o.customerId)?.name });
        else if (d > 0) overdueCustomerIds.add(o.customerId);
      });
    });
    const underMaintenance = machines.filter((m) => m.status === "repair");

    const rentalsToday = orders.filter((o) => o.createdOn === todayStr).length;
    const paymentsToday = payments.filter((p) => p.date === todayStr).reduce((s, p) => s + p.amount, 0);

    return {
      total, available, rented, repair,
      outstandingTotal, activeCustomers: activeCustomerIds.size, overdueCustomers: overdueCustomerIds.size, pendingPaymentCustomers,
      overdue3Plus, dueToday, underMaintenance, rentalsToday, paymentsToday,
      activeOrders,
    };
  }, [machines, customers, orders, payments, todayStr]);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ maxWidth: 900 }}>
        <PageHeader title="Dashboard" subtitle={TODAY.toDateString()} />

        <SectionLabel>Today</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 26 }}>
          <StatCard icon={PackagePlus} label="Rentals today" value={stats.rentalsToday} tone="forest" />
          <StatCard icon={Undo2} label="Returns today" value={0} tone="forest" />
          <StatCard icon={ReceiptText} label="Payments received" value={`₹${stats.paymentsToday}`} tone="forest" />
          <StatCard icon={IndianRupee} label="Outstanding amount" value={`₹${stats.outstandingTotal}`} tone={stats.outstandingTotal > 0 ? "red" : "neutral"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 26 }}>
          <div>
            <SectionLabel>Machines</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard icon={Boxes} label="Total machines" value={stats.total} />
              <StatCard icon={CheckCircle2} label="Available" value={stats.available} tone="forest" />
              <StatCard icon={Clock} label="Rented" value={stats.rented} tone="amber" />
              <StatCard icon={Wrench} label="Under repair" value={stats.repair} tone="red" />
            </div>
          </div>
          <div>
            <SectionLabel>Customers</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <StatCard icon={Users} label="Active customers" value={stats.activeCustomers} tone="forest" />
              <StatCard icon={UserX} label="Overdue customers" value={stats.overdueCustomers} tone={stats.overdueCustomers > 0 ? "red" : "neutral"} />
              <StatCard icon={IndianRupee} label="Pending payment" value={stats.pendingPaymentCustomers} tone={stats.pendingPaymentCustomers > 0 ? "amber" : "neutral"} />
            </div>
          </div>
        </div>

        <SectionLabel>Alerts</SectionLabel>
        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, padding: 6, marginBottom: 26 }}>
          {stats.overdue3Plus.length === 0 && stats.dueToday.length === 0 && stats.underMaintenance.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No alerts right now.</div>
          )}
          {stats.overdue3Plus.map((m) => (
            <AlertRow key={m.number} icon={AlertTriangle} tone="red" title={`${m.number} — overdue by ${m.days} days`} subtitle={`Rented to ${m.customer}`} />
          ))}
          {stats.dueToday.map((m) => (
            <AlertRow key={m.number} icon={Clock} tone="amber" title={`${m.number} — due back today`} subtitle={`Rented to ${m.customer}`} />
          ))}
          {stats.underMaintenance.map((m) => (
            <AlertRow key={m.number} icon={Wrench} tone="neutral" title={`${m.number} — under maintenance`} subtitle={m.product} />
          ))}
        </div>

        <SectionLabel>Customers currently renting</SectionLabel>
        <div style={{ background: COLORS.CARD, border: `1px solid ${COLORS.LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {stats.activeOrders.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: COLORS.INK_SOFT }}>No active rentals yet.</div>
          )}
          {stats.activeOrders.map((o, i) => {
            const customer = customers.find((c) => c.id === o.customerId);
            const worst = Math.max(...o.items.map(() => daysOverdue(o.returnDate)));
            const tone = worst >= 3 ? "red" : worst > 0 ? "amber" : "forest";
            const label = worst > 0 ? `${worst}d overdue` : worst === 0 ? "Due today" : "On track";
            const ts = { red: [COLORS.RED_BG, COLORS.RED], amber: [COLORS.AMBER_BG, COLORS.AMBER], forest: [COLORS.FOREST_BG, COLORS.FOREST_DARK] }[tone];
            return (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${COLORS.LINE}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.INK }}>{customer?.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.INK_SOFT, marginTop: 2 }}>
                    {o.items.map((it) => it.number).join(", ")} · <span style={{ fontFamily: "monospace" }}>{customer?.mobile}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {customer?.outstanding > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.RED }}>₹{customer.outstanding} due</span>}
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: ts[0], color: ts[1] }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
