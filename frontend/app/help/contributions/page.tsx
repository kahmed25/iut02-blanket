'use client';

import React from 'react';
import Link from 'next/link';

export default function ContributionsHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Contributions</h1>
            <p className="text-gray-600">Tracking donations and manual entries</p>
          </div>
        </div>
      </div>

      <h2>Viewing Contributions</h2>
      <p>
        The Contributions tab on a project&apos;s detail page shows all recorded donations. 
        Each entry displays:
      </p>
      <ul>
        <li><strong>Contributor Name</strong> - The donor&apos;s name</li>
        <li><strong>Amount</strong> - Donation amount in the project&apos;s currency</li>
        <li><strong>Payment Mode</strong> - How the donation was made</li>
        <li><strong>Payment Status</strong> - Current status of the contribution</li>
        <li><strong>Date</strong> - When the contribution was made</li>
      </ul>

      <h3>Payment Modes</h3>
      <p>IUT02 Care supports the following payment methods:</p>
      <div className="not-prose grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
        <div className="px-4 py-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
          <span className="font-medium text-pink-700">Bkash</span>
        </div>
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <span className="font-medium text-orange-700">Nagad</span>
        </div>
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <span className="font-medium text-blue-700">Bank Transfer</span>
        </div>
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <span className="font-medium text-green-700">Cash</span>
        </div>
        <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <span className="font-medium text-purple-700">Card</span>
        </div>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <span className="font-medium text-gray-700">Other</span>
        </div>
      </div>

      <h3>Payment Status</h3>
      <div className="not-prose space-y-2 my-4">
        <div className="flex items-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">completed</span>
          <span className="ml-3 text-gray-600">Payment has been received and verified</span>
        </div>
        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">pending</span>
          <span className="ml-3 text-gray-600">Awaiting payment or confirmation</span>
        </div>
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">failed</span>
          <span className="ml-3 text-gray-600">Payment failed or was declined</span>
        </div>
      </div>

      <h2 id="manual-entry">Adding Contributions (Fund Admin+)</h2>
      <div className="not-prose bg-green-50 border border-green-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-800 mb-2">Permission Required</h3>
            <p className="text-green-700 text-sm">
              Only Fund Admins (for assigned projects), Admins, and Super Admins can add contribution entries.
            </p>
          </div>
        </div>
      </div>

      <p>To record a new contribution:</p>
      <ol>
        <li>Navigate to the <strong>Fund Management</strong> page (or project Contributions tab)</li>
        <li>Click <strong>&quot;Add Contribution&quot;</strong></li>
        <li>Fill in the contribution details:
          <ul>
            <li><strong>Contributor Name</strong> (required) - Name of the donor</li>
            <li><strong>Amount</strong> (required) - Donation amount</li>
            <li><strong>Payment Mode</strong> (required) - Select the payment method</li>
            <li><strong>Payment Status</strong> - Usually &quot;completed&quot; for verified donations</li>
            <li><strong>Contribution Date</strong> - When the donation was received</li>
            <li><strong>Notes</strong> - Any additional details (e.g., &quot;Collected via Bkash at event&quot;)</li>
          </ul>
        </li>
        <li>Click <strong>&quot;Save&quot;</strong> to record the contribution</li>
      </ol>

      <h2>Fund Management Page</h2>
      <p>
        Fund Admins, Admins, and Super Admins have access to the Fund Management page via the navigation menu. 
        This page provides:
      </p>
      <ul>
        <li>Quick access to assigned projects</li>
        <li>Contribution entry form</li>
        <li>Recent contributions list</li>
        <li>Summary statistics</li>
      </ul>

      <h2>Tips for Fund Admins</h2>
      <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-amber-800 mb-3">Best Practices</h3>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Record contributions as soon as you receive them to maintain accurate records</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use the Notes field to document how donations were collected (event, personal, etc.)</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Double-check the contributor name spelling for consistency</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Set correct contribution date (not entry date) for accurate reporting</span>
          </li>
        </ul>
      </div>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/projects" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Managing charity projects</p>
        </Link>
        <Link href="/help/import" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Import Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Bulk import contributions</p>
        </Link>
      </div>
    </div>
  );
}
