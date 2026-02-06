import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const COLORS = ['#e11d48', '#fbbf24', '#0ea5e9', '#10b981', '#8b5cf6'];

interface SalesData {
    name: string;
    total: number;
}

interface CategoryData {
    name: string;
    value: number;
}

interface RevenueChartProps {
    data: SalesData[];
    title?: string;
}

export function RevenueChart({ data, title = "Receita Mensal" }: RevenueChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Visão geral dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}kz`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => [`${value.toLocaleString()} Kz`, 'Receita']}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#e11d48"
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

interface CategoryPieChartProps {
    data: CategoryData[];
    title?: string;
}

export function CategoryPieChart({ data, title = "Vendas por Categoria" }: CategoryPieChartProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Distribuição de vendas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} vendas`, 'Quantidade']} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
