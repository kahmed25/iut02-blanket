'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { RoleProtectedRoute } from '@/auth/components/RoleProtectedRoute';
import { projectsApi, ImportPreviewResponse } from '@/services/fundApi';
import { tokenService } from '@/auth/services/tokenService';
import { formatExact } from '@/utils/formatNumber';

function ImportProjectContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setPreview(null);
        setError(null);
        setSuccess(null);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setError(null);
      setSuccess(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const previewData = await projectsApi.previewImport(file);
      setPreview(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setError(null);
    
    try {
      const result = await projectsApi.importProject(file);
      setSuccess(result.message);
      setPreview(null);
      setFile(null);
      
      // Redirect to the new project after a short delay
      setTimeout(() => {
        router.push(`/projects/${result.project.project_id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (withExample: boolean) => {
    const token = tokenService.getAccessToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/import/template?with_example=${withExample}`;
    
    // Create a temporary link with auth header via fetch
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => response.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = withExample ? 'project_import_example.xlsx' : 'project_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(err => {
        setError('Failed to download template');
        console.error(err);
      });
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Import Project</h1>
            <p className="mt-2 text-gray-600">Import a project with contributions from an Excel file</p>
          </div>

          {/* Download Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Download Template</h2>
            <p className="text-sm text-gray-600 mb-4">
              Download a template to get started. The template includes instructions and required field formats.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => downloadTemplate(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Empty Template
              </button>
              <button
                onClick={() => downloadTemplate(true)}
                className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Template with Example Data
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Upload Excel File</h2>
            
            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-4 text-gray-600">Drag and drop your Excel file here, or</p>
                  <label className="mt-2 inline-block">
                    <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">Supports .xlsx and .xls files</p>
                </>
              )}
            </div>

            {/* Preview Button */}
            {file && !preview && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Import
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success} Redirecting to project...</span>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Review Import Preview</h2>

              {/* Validation Errors */}
              {preview.validation_errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Validation Errors</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {preview.validation_errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Project Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{preview.project.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Target:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {preview.project.currency} {formatExact(preview.project.target_amount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{preview.project.status || 'active'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <span className="ml-2 text-gray-700">{preview.project.description || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.summary.total_contributions}</p>
                  <p className="text-sm text-blue-700">Total Rows</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{preview.summary.valid_contributions}</p>
                  <p className="text-sm text-emerald-700">Valid</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.summary.invalid_contributions}</p>
                  <p className="text-sm text-red-700">Invalid</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">৳{formatExact(preview.summary.contributions_amount || 0)}</p>
                  <p className="text-sm text-amber-700">Total Amount</p>
                </div>
              </div>

              {/* Contributions Preview Table */}
              {preview.contributions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Contributions Preview</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600">Row</th>
                          <th className="px-3 py-2 text-left text-gray-600">Contributor</th>
                          <th className="px-3 py-2 text-right text-gray-600">Amount</th>
                          <th className="px-3 py-2 text-left text-gray-600">Payment</th>
                          <th className="px-3 py-2 text-left text-gray-600">Date</th>
                          <th className="px-3 py-2 text-center text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.contributions.map((c, idx) => (
                          <tr
                            key={idx}
                            className={`border-b ${c.valid ? 'hover:bg-gray-50' : 'bg-red-50'}`}
                          >
                            <td className="px-3 py-2 text-gray-500">{c.row}</td>
                            <td className="px-3 py-2">{c.contributor_name || '-'}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              {c.amount ? `৳${formatExact(c.amount)}` : '-'}
                            </td>
                            <td className="px-3 py-2">{c.payment_mode || '-'}</td>
                            <td className="px-3 py-2">{c.contribution_date || '-'}</td>
                            <td className="px-3 py-2 text-center">
                              {c.valid ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700" title={c.errors.join(', ')}>
                                  Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Contribution Errors */}
              {preview.contributions_errors.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Contribution Row Errors (will be skipped)</h3>
                  <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                    {preview.contributions_errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Distributions Summary */}
              {preview.distributions && preview.distributions.length > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Distributions Preview</h3>
                    
                    {/* Distribution Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{preview.summary.total_distributions || 0}</p>
                        <p className="text-sm text-purple-700">Total Rows</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{preview.summary.valid_distributions || 0}</p>
                        <p className="text-sm text-emerald-700">Valid</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{preview.summary.invalid_distributions || 0}</p>
                        <p className="text-sm text-red-700">Invalid</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600">৳{formatExact(preview.summary.distributions_amount || 0)}</p>
                        <p className="text-sm text-indigo-700">Total Distributed</p>
                      </div>
                    </div>

                    {/* Distributions Preview Table */}
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Row</th>
                            <th className="px-3 py-2 text-left text-gray-600">Institution Type</th>
                            <th className="px-3 py-2 text-left text-gray-600">Institution Name</th>
                            <th className="px-3 py-2 text-right text-gray-600">Amount</th>
                            <th className="px-3 py-2 text-left text-gray-600">Date</th>
                            <th className="px-3 py-2 text-center text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.distributions.map((d, idx) => (
                            <tr
                              key={idx}
                              className={`border-b ${d.valid ? 'hover:bg-gray-50' : 'bg-red-50'}`}
                            >
                              <td className="px-3 py-2 text-gray-500">{d.row}</td>
                              <td className="px-3 py-2">{d.institution_type || '-'}</td>
                              <td className="px-3 py-2">{d.institution_name || '-'}</td>
                              <td className="px-3 py-2 text-right font-medium">
                                {d.amount ? `${d.currency || '৳'}${formatExact(d.amount)}` : '-'}
                              </td>
                              <td className="px-3 py-2">{d.distribution_date || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {d.valid ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                                    Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700" title={d.errors.join(', ')}>
                                    Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Distribution Errors */}
                  {preview.distributions_errors && preview.distributions_errors.length > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="font-semibold text-amber-800 mb-2">Distribution Row Errors (will be skipped)</h3>
                      <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                        {preview.distributions_errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Import Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || !preview.is_valid}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    preview.is_valid
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Project ({preview.summary.valid_contributions} contributions{preview.summary.valid_distributions ? `, ${preview.summary.valid_distributions} distributions` : ''})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-800 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Import Instructions</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                <p>Download the template and fill in your project information in the &quot;Project Info&quot; sheet.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                <p>Add contribution records in the &quot;Contributions&quot; sheet starting from row 3 (row 2 contains field descriptions).</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                <p>Optionally, add distribution records in the &quot;Distributions&quot; sheet to track fund distributions.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
                <p>Upload the file and preview to validate your data before importing.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</span>
                <p>Review and confirm the import. Invalid rows will be skipped automatically.</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h3 className="font-medium text-white mb-2">Supported Payment Modes</h3>
              <div className="flex flex-wrap gap-2">
                {['Bkash', 'Nagad', 'Bank Transfer', 'Cash', 'Card', 'Other'].map((mode) => (
                  <span key={mode} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ImportProjectPage() {
  return (
    <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <ImportProjectContent />
    </RoleProtectedRoute>
  );
}
