
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, SoldItemSummary } from '../types';

interface AnalyticsVisualsProps {
  orders: any[]; 
  soldItems: SoldItemSummary[];
}

const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return '#3B82F6'; // Blue
      case 'Payment Received': return '#8B5CF6'; // Purple
      case 'Shipped': return '#F59E0B'; // Amber
      case 'Delivered': return '#10B981'; // Green
      case 'Cancelled': return '#EF4444'; // Red
      default: return '#9CA3AF';
    }
};

const CHART_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899', '#84CC16', '#6366F1'];

const AnalyticsVisuals: React.FC<AnalyticsVisualsProps> = ({ orders, soldItems }) => {
    const [timeUnit, setTimeUnit] = useState<'days' | 'months'>('days');
    const [timeValue, setTimeValue] = useState(30);

    // 1. Top Selling Products Visual (The missing feature)
    const topProducts = useMemo(() => {
        return [...soldItems]
            .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
            .slice(0, 5);
    }, [soldItems]);

    const maxSold = useMemo(() => Math.max(...topProducts.map(p => p.total_quantity_sold), 1), [topProducts]);

    // 2. Revenue Trajectory Data
    const trendData = useMemo(() => {
        const results: { label: string; value: number }[] = [];
        const now = new Date();
        for (let i = timeValue - 1; i >= 0; i--) {
            const d = new Date(now);
            if (timeUnit === 'days') {
                d.setDate(now.getDate() - i);
                const dayStr = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const value = orders
                    .filter(o => o.created_at.startsWith(dayStr) && o.status !== 'Cancelled')
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                results.push({ label, value });
            } else {
                d.setMonth(now.getMonth() - i);
                const month = d.getMonth();
                const year = d.getFullYear();
                const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                const value = orders
                    .filter(o => {
                        const od = new Date(o.created_at);
                        return od.getMonth() === month && od.getFullYear() === year && o.status !== 'Cancelled';
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                results.push({ label, value });
            }
        }
        return results;
    }, [orders, timeUnit, timeValue]);

    const maxRevenue = useMemo(() => Math.max(...trendData.map(d => d.value), 100), [trendData]);

    // 3. Order Status Breakdown
    const orderStatusData = useMemo(() => {
        const counts = orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([status, count]) => ({ label: status, value: count }));
    }, [orders]);

    return (
      <div className="space-y-12 animate-fadeIn pb-12">
        {/* TOP LEVEL METRICS & TREND */}
        <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-hav-gold/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                <div>
                    <h3 className="text-4xl font-serif font-black text-hav-forest">Revenue Trajectory</h3>
                    <p className="text-[10px] text-hav-gold mt-2 uppercase font-black tracking-[0.4em]">Performance Snapshot</p>
                </div>
                <div className="flex bg-hav-cream p-1 rounded-2xl border border-hav-gold/20">
                    <button 
                        onClick={() => { setTimeUnit('days'); setTimeValue(7); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${timeUnit === 'days' && timeValue === 7 ? 'bg-hav-forest text-hav-gold shadow-lg' : 'text-hav-forest/60'}`}
                    >1W</button>
                    <button 
                        onClick={() => { setTimeUnit('days'); setTimeValue(30); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${timeUnit === 'days' && timeValue === 30 ? 'bg-hav-forest text-hav-gold shadow-lg' : 'text-hav-forest/60'}`}
                    >1M</button>
                    <button 
                        onClick={() => { setTimeUnit('months'); setTimeValue(12); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${timeUnit === 'months' ? 'bg-hav-forest text-hav-gold shadow-lg' : 'text-hav-forest/60'}`}
                    >1Y</button>
                </div>
            </div>

            <div className="w-full h-80 relative pt-4">
                <svg viewBox={`0 0 ${(trendData.length - 1) * 10} 100`} className="w-full h-full preserve-aspect-none overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C9A236" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#C9A236" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path 
                        initial={{ pathLength: 0 }} 
                        animate={{ pathLength: 1 }} 
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d={`M ${trendData.map((d, i) => `${i * 10},${100 - (d.value / maxRevenue) * 100}`).join(' L ')}`} 
                        fill="none" 
                        stroke="#0F4A3C" 
                        strokeWidth="2" 
                        strokeLinejoin="round" 
                        strokeLinecap="round" 
                    />
                    <motion.path 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.5 }}
                        d={`M 0,100 L ${trendData.map((d, i) => `${i * 10},${100 - (d.value / maxRevenue) * 100}`).join(' L ')} L ${(trendData.length - 1) * 10},100 Z`} 
                        fill="url(#areaGrad)" 
                    />
                </svg>
                {/* Labels */}
                <div className="flex justify-between mt-4">
                    {trendData.filter((_, i) => i % Math.ceil(trendData.length/6) === 0).map((d, i) => (
                        <span key={i} className="text-[9px] font-black text-hav-olive/40 uppercase tracking-tighter">{d.label}</span>
                    ))}
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* PRODUCT POPULARITY - The missing chart */}
            <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-hav-gold/10">
                <h3 className="text-3xl font-serif font-black text-hav-forest mb-8">Inventory Velocity</h3>
                <div className="space-y-8">
                    {topProducts.map((p, i) => {
                        const widthPercent = (p.total_quantity_sold / maxSold) * 100;
                        return (
                            <div key={p.product_id} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black text-hav-forest uppercase tracking-tight truncate max-w-[200px]">{p.product_name}</span>
                                    <span className="text-xs font-black text-hav-gold">{p.total_quantity_sold} Units</span>
                                </div>
                                <div className="h-4 bg-hav-cream rounded-full overflow-hidden border border-hav-gold/10">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${widthPercent}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="h-full rounded-full shadow-lg"
                                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ORDER STATUS CIRCLE */}
            <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-hav-gold/10 flex flex-col">
                <h3 className="text-3xl font-serif font-black text-hav-forest mb-8">Operational Status</h3>
                <div className="flex-grow flex items-center justify-center relative">
                    <div className="grid grid-cols-1 gap-4 w-full">
                        {orderStatusData.map((d, i) => (
                            <div key={d.label} className="flex items-center justify-between p-4 bg-hav-cream/30 rounded-2xl border border-hav-gold/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getStatusColor(d.label) }}></div>
                                    <span className="text-sm font-black text-hav-forest uppercase tracking-widest">{d.label}</span>
                                </div>
                                <span className="text-xl font-black text-hav-forest">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
      </div>
    );
}

export default AnalyticsVisuals;
