"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { DailyPoint } from "@/lib/queries/admin";

export function OrdersChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-semibold">Commandes par jour</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" fontSize={11} tickLine={false} />
          <YAxis allowDecimals={false} fontSize={11} width={24} />
          <Tooltip />
          <Bar dataKey="orders" fill="#00A651" radius={[4, 4, 0, 0]} name="Commandes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UsersChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-semibold">Nouveaux utilisateurs</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" fontSize={11} tickLine={false} />
          <YAxis allowDecimals={false} fontSize={11} width={24} />
          <Tooltip />
          <Line type="monotone" dataKey="users" stroke="#0B3C26" strokeWidth={2} name="Utilisateurs" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
