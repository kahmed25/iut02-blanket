'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatExact } from '@/utils/formatNumber';

interface DonationChartProps {
  data: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function DonationChart({ data }: DonationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No data available for charts</p>
      </div>
    );
  }

  // Debug: log first row to see structure
  console.log('Chart data sample:', data[0]);

  // Helper function to find column by exact or partial name match
  const findColumn = (row: any, patterns: string[]): string | null => {
    const keys = Object.keys(row);
    // First try exact match
    for (const pattern of patterns) {
      const exactMatch = keys.find(key => 
        key && typeof key === 'string' && key.toLowerCase() === pattern.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }
    // Then try partial match
    for (const pattern of patterns) {
      const found = keys.find(key => 
        key && typeof key === 'string' && 
        key.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  };

  // Find the actual column names - try common variations
  const nameCol = findColumn(data[0] || {}, ['name', 'unnamed: 1']);
  const paymentCol = findColumn(data[0] || {}, ['payment mode', 'payment', 'mode', 'unnamed: 2']);
  const amountCol = findColumn(data[0] || {}, ['amount (bdt)', 'amount', 'bdt', 'unnamed: 3', 'unnamed: 4']);

  // Prepare data for charts
  // Payment Mode distribution
  const paymentModeData = data.reduce((acc: any, row: any) => {
    const mode = paymentCol ? (row[paymentCol] || 'Unknown') : 'Unknown';
    const amount = amountCol ? (parseFloat(row[amountCol]) || 0) : 0;
    const modeStr = String(mode).trim();
    if (modeStr && modeStr !== 'null' && modeStr !== '' && modeStr !== 'NaN' && !isNaN(amount) && amount > 0) {
      acc[modeStr] = (acc[modeStr] || 0) + amount;
    }
    return acc;
  }, {});

  const paymentModeChart = Object.entries(paymentModeData)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10

  // Top donors by amount
  const topDonors = data
    .filter((row: any) => {
      const name = nameCol ? row[nameCol] : null;
      const amount = amountCol ? parseFloat(row[amountCol]) : 0;
      return name && String(name).trim() !== '' && String(name).trim() !== 'null' && !isNaN(amount) && amount > 0;
    })
    .map((row: any) => ({
      name: String(nameCol ? row[nameCol] : 'Unknown').substring(0, 15),
      amount: parseFloat(amountCol ? row[amountCol] : 0) || 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Show message if no chart data could be generated
  if (paymentModeChart.length === 0 && topDonors.length === 0) {
    return (
      <div className="w-full space-y-8 animate-fade-in-up">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Charts & Visualizations</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-500 mb-2">Unable to generate charts from the current data structure.</p>
          <p className="text-sm text-gray-400">
            Charts require columns with names containing: &quot;Name&quot;, &quot;Payment Mode&quot;, and &quot;Amount&quot;
          </p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-blue-600">Show data structure</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(data[0], null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Charts & Visualizations
        </h2>
        <p className="text-gray-500">Interactive data analytics and insights</p>
      </div>
      
      {/* Payment Mode Distribution - Pie Chart */}
      {paymentModeChart.length > 0 && (
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-soft border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Chart 1: Payment Mode Distribution</h3>
          <p className="text-sm text-gray-500 mb-6">Breakdown of donations by payment method</p>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={paymentModeChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentModeChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Donors - Bar Chart */}
      {topDonors.length > 0 && (
        <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-soft border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Chart 2: Top Donors by Amount</h3>
          <p className="text-sm text-gray-500 mb-6">Leading contributors ranked by donation amount</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topDonors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
              <Legend />
              <Bar dataKey="amount" fill="#3b82f6" name="Amount (BDT)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Mode Amounts - Bar Chart */}
      {paymentModeChart.length > 0 && (
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-soft border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Chart 3: Total Amount by Payment Mode</h3>
          <p className="text-sm text-gray-500 mb-6">Aggregated totals for each payment method</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={paymentModeChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `৳${formatExact(value)}`} />
              <Legend />
              <Bar dataKey="value" fill="#10b981" name="Total Amount (BDT)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

