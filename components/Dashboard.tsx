
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInvoices } from '../contexts/InvoiceContext';
import { InvoiceStatus } from '../types';

const Dashboard: React.FC = () => {
    const { invoices, getCorrectionsData } = useInvoices();

    const completedInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Completed);
    const totalCompleted = completedInvoices.length;
    const correctedCount = completedInvoices.filter(inv => inv.isCorrectedByScrutinizer).length;
    const accuracy = totalCompleted > 0 ? ((totalCompleted - correctedCount) / totalCompleted) * 100 : 100;

    const correctionsData = getCorrectionsData();

    const chartData = correctionsData.map(d => ({
        name: d.date,
        '修正件数': d.corrections,
    }));
    
    const stats = [
        { name: '完了済み申請', value: totalCompleted },
        { name: '精査担当による修正件数', value: correctedCount },
        { name: 'AI自動割当精度', value: `${accuracy.toFixed(1)}%` },
        { name: '処理中申請', value: invoices.length - totalCompleted }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.name} className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-sm font-medium text-gray-500 truncate">{stat.name}</h3>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">日次修正件数（カテゴリ精査）</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="修正件数" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
