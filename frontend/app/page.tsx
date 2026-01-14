'use client';

import React, { useEffect, useState } from 'react';
import { fetchExcelData, fetchImages, ExcelData, ImageList } from '@/services/api';
import DataTable from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import ImageGallery from '@/components/ImageGallery';
import DonationChart from '@/components/DonationChart';
import Tabs from '@/components/Tabs';

export default function Home() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [images, setImages] = useState<ImageList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [data, imageList] = await Promise.all([
        fetchExcelData(),
        fetchImages(),
      ]);
      
      setExcelData(data);
      setImages(imageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center max-w-md mx-auto p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get all sheets dynamically
  const sheets = excelData?.data?.sheets || {};
  const sheetNames = Object.keys(sheets);
  
  // Get first sheet (for charts and default table view)
  const firstSheet = sheetNames.length > 0 ? sheets[sheetNames[0]] : null;
  // Get second sheet (for summary/statistics)
  const secondSheet = sheetNames.length > 1 ? sheets[sheetNames[1]] : null;

  // Define tabs dynamically based on actual sheet names
  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'charts', label: '📈 Charts', icon: '📈' },
    ...sheetNames.map((name, idx) => ({ 
      id: name.toLowerCase().replace(/\s+/g, '-'), 
      label: `📋 ${name}`, 
      icon: '📋' 
    })),
    ...(images && images.images && images.images.length > 0 
      ? [{ id: 'gallery', label: '🖼️ Gallery', icon: '🖼️' }] 
      : [])
  ];

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Summary Statistics - from second sheet if it's a summary type */}
            {secondSheet && secondSheet.type === 'summary' && secondSheet.data && Object.keys(secondSheet.data).length > 0 && (
              <section>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Summary Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(secondSheet.data).map(([key, value], idx) => {
                    const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'> = 
                      ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                    return (
                      <SummaryCard
                        key={idx}
                        title={key}
                        value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                        color={colors[idx % colors.length]}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Quick Stats - from first sheet if it's a table */}
            {firstSheet && firstSheet.type === 'table' && (
              <section>
                <div className="mb-8">
                  <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Quick Statistics
                  </h2>
                  <p className="text-gray-500">Data insights at a glance</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryCard
                    title="Total Records"
                    value={firstSheet.data?.length || 0}
                    color="blue"
                  />
                  <SummaryCard
                    title="Total Amount"
                    value={firstSheet.data?.reduce((sum: number, row: any) => {
                      const amount = parseFloat(row['Amount (BDT)']) || 0;
                      return sum + amount;
                    }, 0).toLocaleString() || '0'}
                    color="green"
                    subtitle="BDT"
                  />
                  <SummaryCard
                    title="Payment Methods"
                    value={new Set(firstSheet.data?.map((row: any) => row['Payment Mode']).filter(Boolean)).size || 0}
                    color="purple"
                  />
                </div>
              </section>
            )}
          </div>
        );

      case 'charts':
        return (
          <div>
            {(() => {
              // Find the first sheet with table data
              const tableSheet = sheetNames
                .map(name => ({ name, data: sheets[name] }))
                .find(({ data }) => data?.type === 'table' && data?.data && data.data.length > 0);
              
              if (tableSheet && tableSheet.data.data) {
                return <DonationChart data={tableSheet.data.data} />;
              }
              
              return (
                <div className="text-center py-12 text-gray-500">
                  <p>No chart data available</p>
                  <p className="text-sm mt-2">Make sure you have a sheet with table data containing &apos;Name&apos; and &apos;Amount (BDT)&apos; columns</p>
                </div>
              );
            })()}
          </div>
        );

      case 'gallery':
        return (
          <div>
            {images && images.images && images.images.length > 0 ? (
              <ImageGallery images={images.images} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No images available
              </div>
            )}
          </div>
        );

      default:
        // Handle all sheets dynamically by matching tab ID to sheet name
        const sheetName = sheetNames.find(
          name => name.toLowerCase().replace(/\s+/g, '-') === activeTab
        );
        if (sheetName) {
          const sheetData = sheets[sheetName];
          return (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {sheetName}
                </h2>
                <p className="text-gray-500">Detailed data view</p>
              </div>
              {sheetData?.type === 'table' && (
                <DataTable
                  columns={sheetData.columns || []}
                  data={sheetData.data || []}
                  title=""
                />
              )}
              {sheetData?.type === 'summary' && sheetData.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {Object.entries(sheetData.data).map(([key, value], idx) => {
                    const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'> = 
                      ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                    return (
                      <SummaryCard
                        key={idx}
                        title={key}
                        value={typeof value === 'number' ? value.toLocaleString() : String(value)}
                        color={colors[idx % colors.length]}
                      />
                    );
                  })}
                </div>
              )}
              {sheetData?.raw_data && sheetData.raw_data.length > 0 && (
                <DataTable
                  columns={sheetData.raw_data.length > 0 ? Object.keys(sheetData.raw_data[0]) : []}
                  data={sheetData.raw_data}
                  title=""
                />
              )}
            </div>
          );
        }
        return <div className="text-center py-12 text-gray-500">Content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-100">
                {excelData?.data?.metadata?.file_name?.replace('.xlsx', '') || 'Excel Data Visualization'}
              </h1>
              <p className="text-blue-200 text-lg font-medium">
                Interactive data presentation & analytics
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-xs text-blue-200 uppercase tracking-wider">Sheets</p>
                <p className="text-2xl font-bold">{excelData?.data?.metadata?.sheet_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Tabs Navigation */}
        {tabs.length > 0 && (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-100 p-8 md:p-10 min-h-[500px]">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 mt-16 border-t border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold">Data Source:</span> Excel file
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-slate-400 text-xs">Live Data</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

