'use client';

import React, { useState, useEffect } from 'react';
import { Contribution, ContributionCreate, ContributionUpdate, configApi, Project } from '@/services/fundApi';

interface ContributionFormProps {
  contribution?: Contribution | null;
  projects: Project[];
  selectedProjectId?: string;
  onSubmit: (data: ContributionCreate | ContributionUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContributionForm({
  contribution,
  projects,
  selectedProjectId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContributionFormProps) {
  const [currencies, setCurrencies] = useState<string[]>(['BDT', 'USD', 'CAD', 'AUD', 'EUR']);
  const [paymentModes, setPaymentModes] = useState<string[]>(['Mobile Money', 'Cash', 'Bank Transfer', 'Bkash', 'Nagad', 'Offline', 'Stripe', 'PayPal']);
  
  const [formData, setFormData] = useState({
    project_id: selectedProjectId || '',
    contributor_name: '',
    amount: '',
    currency: 'BDT',
    payment_mode: 'Cash',
    payment_status: 'completed',
    collection_notes: '',
    contribution_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!contribution;

  useEffect(() => {
    // Load config
    Promise.all([
      configApi.getCurrencies(),
      configApi.getPaymentModes(),
    ]).then(([curr, modes]) => {
      setCurrencies(curr);
      setPaymentModes(modes);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (contribution) {
      setFormData({
        project_id: contribution.project_id,
        contributor_name: contribution.contributor_name,
        amount: contribution.amount.toString(),
        currency: contribution.currency,
        payment_mode: contribution.payment_mode,
        payment_status: contribution.payment_status,
        collection_notes: contribution.collection_notes || '',
        contribution_date: contribution.contribution_date.split('T')[0],
      });
    } else if (selectedProjectId) {
      setFormData((prev) => ({ ...prev, project_id: selectedProjectId }));
    }
  }, [contribution, selectedProjectId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_id) {
      newErrors.project_id = 'Please select a project';
    }

    if (!formData.contributor_name.trim()) {
      newErrors.contributor_name = 'Contributor name is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.contribution_date) {
      newErrors.contribution_date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data = isEditing
      ? {
          contributor_name: formData.contributor_name,
          amount: Number(formData.amount),
          currency: formData.currency,
          payment_mode: formData.payment_mode,
          payment_status: formData.payment_status,
          collection_notes: formData.collection_notes || undefined,
          contribution_date: formData.contribution_date,
        }
      : {
          project_id: formData.project_id,
          contributor_name: formData.contributor_name,
          amount: Number(formData.amount),
          currency: formData.currency,
          payment_mode: formData.payment_mode,
          payment_status: formData.payment_status,
          collection_notes: formData.collection_notes || undefined,
          contribution_date: formData.contribution_date,
        };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project Selection (only for new contributions) */}
      {!isEditing && (
        <div>
          <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            id="project_id"
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white ${
              errors.project_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading || !!selectedProjectId}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>}
        </div>
      )}

      {/* Contributor Name */}
      <div>
        <label htmlFor="contributor_name" className="block text-sm font-medium text-gray-700 mb-1">
          Contributor Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="contributor_name"
          value={formData.contributor_name}
          onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.contributor_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Enter contributor's name"
          disabled={isLoading}
        />
        {errors.contributor_name && <p className="mt-1 text-sm text-red-600">{errors.contributor_name}</p>}
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            disabled={isLoading}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Mode and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="payment_mode" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Mode
          </label>
          <select
            id="payment_mode"
            value={formData.payment_mode}
            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            disabled={isLoading}
          >
            {paymentModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            id="payment_status"
            value={formData.payment_status}
            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            disabled={isLoading}
          >
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Contribution Date */}
      <div>
        <label htmlFor="contribution_date" className="block text-sm font-medium text-gray-700 mb-1">
          Contribution Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="contribution_date"
          value={formData.contribution_date}
          onChange={(e) => setFormData({ ...formData, contribution_date: e.target.value })}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.contribution_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.contribution_date && <p className="mt-1 text-sm text-red-600">{errors.contribution_date}</p>}
      </div>

      {/* Collection Notes */}
      <div>
        <label htmlFor="collection_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="collection_notes"
          rows={2}
          value={formData.collection_notes}
          onChange={(e) => setFormData({ ...formData, collection_notes: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          placeholder="Optional notes about this contribution"
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isEditing ? 'Update Contribution' : 'Add Contribution'}
        </button>
      </div>
    </form>
  );
}

export default ContributionForm;
