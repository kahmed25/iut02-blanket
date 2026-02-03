'use client';

import React, { useState, useEffect } from 'react';
import { Project, ProjectCreate, ProjectUpdate, configApi } from '@/services/fundApi';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading = false }: ProjectFormProps) {
  const [currencies, setCurrencies] = useState<string[]>(['BDT', 'USD', 'CAD', 'AUD', 'EUR']);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_currency: 'BDT',
    status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled' | 'archived',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!project;

  useEffect(() => {
    // Load currencies from config
    configApi.getCurrencies().then(setCurrencies).catch(console.error);
  }, []);

  useEffect(() => {
    if (project) {
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedAmount = Math.round(project.target_amount * 100) / 100;
      setFormData({
        name: project.name,
        description: project.description || '',
        target_amount: roundedAmount.toString(),
        target_currency: project.target_currency,
        status: project.status,
      });
    }
  }, [project]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.target_amount) {
      newErrors.target_amount = 'Target amount is required';
    } else if (isNaN(Number(formData.target_amount)) || Number(formData.target_amount) <= 0) {
      newErrors.target_amount = 'Target amount must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data = isEditing
      ? {
          name: formData.name,
          description: formData.description || undefined,
          target_amount: Number(formData.target_amount),
          target_currency: formData.target_currency,
          status: formData.status,
        }
      : {
          name: formData.name,
          description: formData.description || undefined,
          target_amount: Number(formData.target_amount),
          target_currency: formData.target_currency,
        };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Enter project name"
          disabled={isLoading}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          placeholder="Enter project description (optional)"
          disabled={isLoading}
        />
      </div>

      {/* Target Amount and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Target Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="target_amount"
            value={formData.target_amount}
            onChange={(e) => {
              // Only allow numbers and one decimal point
              const value = e.target.value.replace(/[^0-9.]/g, '');
              // Ensure only one decimal point
              const parts = value.split('.');
              const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
              setFormData({ ...formData, target_amount: sanitized });
            }}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              errors.target_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="0"
            disabled={isLoading}
          />
          {errors.target_amount && <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>}
        </div>
        <div>
          <label htmlFor="target_currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="target_currency"
            value={formData.target_currency}
            onChange={(e) => setFormData({ ...formData, target_currency: e.target.value })}
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

      {/* Status (only for editing) */}
      {isEditing && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            disabled={isLoading}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

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
          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
