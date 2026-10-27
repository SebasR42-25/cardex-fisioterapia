import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DashboardChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="nombre" stroke="#64748b" tick={{ fontSize: 12 }} />
        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
        <Bar dataKey="total_rutinas" name="Rutinas asignadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completadas" name="Rutinas completadas" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
