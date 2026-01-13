'use client';

import React from 'react';

interface DataTableProps {
  columns: string[];
  data: any[];
  title?: string;
}

export default function DataTable({ columns, data, title }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  // Filter out columns that are all null/empty
  const validColumns = columns.filter(col => {
    return data.some(row => row[col] !== null && row[col] !== undefined && row[col] !== '');
  });

  return (
    <div className="w-full overflow-x-auto animate-fade-in-up">
      {title && (
        <h3 className="text-2xl font-bold mb-6 text-gray-800">{title}</h3>
      )}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
              <tr>
                {validColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
                >
                  {validColumns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium"
                    >
                      {row[col] !== null && row[col] !== undefined
                        ? String(row[col])
                        : <span className="text-gray-400">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

