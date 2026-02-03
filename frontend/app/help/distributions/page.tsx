'use client';

import React from 'react';
import Link from 'next/link';

export default function DistributionsHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Distributions</h1>
            <p className="text-gray-600">Tracking fund distributions to beneficiary institutions</p>
          </div>
        </div>
      </div>

      <h2>What are Distributions?</h2>
      <p>
        Distributions record how collected charity funds are given to beneficiary institutions. 
        This provides transparency and accountability, showing donors exactly where their contributions go.
      </p>

      <h2>Viewing Distributions</h2>
      <p>
        The Distribution tab on a project&apos;s detail page shows:
      </p>
      <ul>
        <li><strong>Summary Statistics</strong> - Total distributed, number of distributions, unique institutions</li>
        <li><strong>Distribution List</strong> - Each distribution with institution details, amount, and date</li>
        <li><strong>Proof Documents</strong> - Uploaded receipts or photos of distribution activities</li>
      </ul>

      <h3>Institution Types</h3>
      <p>Distributions can be made to various institution types:</p>
      <div className="not-prose grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <span className="font-medium text-amber-700">School</span>
        </div>
        <div className="px-4 py-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
          <span className="font-medium text-pink-700">Orphanage</span>
        </div>
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <span className="font-medium text-red-700">Hospital</span>
        </div>
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <span className="font-medium text-blue-700">Community Center</span>
        </div>
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <span className="font-medium text-green-700">Religious Institution</span>
        </div>
        <div className="px-4 py-3 bg-violet-50 border border-violet-200 rounded-lg text-center">
          <span className="font-medium text-violet-700">NGO</span>
        </div>
        <div className="px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-lg text-center">
          <span className="font-medium text-cyan-700">Government Agency</span>
        </div>
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <span className="font-medium text-orange-700">Individual/Family</span>
        </div>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <span className="font-medium text-gray-700">Other</span>
        </div>
      </div>

      <h2>Adding Distributions (Fund Admin+)</h2>
      <div className="not-prose bg-green-50 border border-green-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-800 mb-2">Permission Required</h3>
            <p className="text-green-700 text-sm">
              Only Fund Admins (for assigned projects), Admins, and Super Admins can add distribution records. 
              Regular users can only view distributions.
            </p>
          </div>
        </div>
      </div>

      <p>To record a new distribution:</p>
      <ol>
        <li>Go to the project&apos;s <strong>Distribution</strong> tab</li>
        <li>Click <strong>&quot;Add Distribution&quot;</strong> button</li>
        <li>Fill in the distribution details:
          <ul>
            <li><strong>Institution Type</strong> (required) - Select from the dropdown</li>
            <li><strong>Institution Name</strong> (required) - Name of the beneficiary</li>
            <li><strong>Amount</strong> (required) - How much was distributed</li>
            <li><strong>Distribution Date</strong> (required) - When the distribution occurred</li>
            <li><strong>Notes</strong> - Additional context or details</li>
          </ul>
        </li>
        <li>Click <strong>&quot;Save Distribution&quot;</strong></li>
      </ol>

      <h2>Uploading Proof Documents</h2>
      <p>
        After creating a distribution, you can upload proof documents (receipts, photos of distribution events):
      </p>
      <ol>
        <li>Find the distribution in the list</li>
        <li>Click <strong>&quot;Upload Proof&quot;</strong></li>
        <li>Select a file from your device</li>
        <li>The proof will be attached to the distribution</li>
      </ol>

      <h3>Supported File Types</h3>
      <div className="not-prose bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Images</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• JPEG / JPG</li>
              <li>• PNG</li>
              <li>• GIF</li>
              <li>• WebP</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Documents</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PDF</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          <strong>Maximum file size:</strong> 10 MB
        </p>
      </div>

      <h2>Best Practices</h2>
      <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-amber-800 mb-3">Tips for Recording Distributions</h3>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Always upload proof documents (receipts, photos) for transparency</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Use clear, descriptive institution names for easy identification</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Add notes explaining the purpose of the distribution (e.g., &quot;Winter blankets for 50 families&quot;)</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Record distributions promptly to keep records up-to-date</span>
          </li>
        </ul>
      </div>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/contributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Contributions</h3>
          <p className="text-sm text-gray-500 mt-1">Track incoming donations</p>
        </Link>
        <Link href="/help/projects" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Managing charity projects</p>
        </Link>
      </div>
    </div>
  );
}
