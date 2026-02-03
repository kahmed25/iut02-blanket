'use client';

import React from 'react';
import Link from 'next/link';

const helpTopics = [
  {
    title: 'Getting Started',
    description: 'New to IUT02 Care? Start here for a quick overview of the platform.',
    href: '/help/getting-started',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Projects',
    description: 'Learn how to browse, create, and manage charity fund projects.',
    href: '/help/projects',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Contributions',
    description: 'Understand how donations are tracked and how to add manual entries.',
    href: '/help/contributions',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Distributions',
    description: 'Track how collected funds are distributed to beneficiary institutions.',
    href: '/help/distributions',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Media Gallery',
    description: 'Upload and manage images, videos, and audio for your projects.',
    href: '/help/media',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-50',
  },
  {
    title: 'Import Projects',
    description: 'Bulk import projects and contributions from Excel spreadsheets.',
    href: '/help/import',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
  },
  {
    title: 'Admin Panel',
    description: 'System administration, user management, and app settings.',
    href: '/help/admin',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-50',
  },
  {
    title: 'Roles & Permissions',
    description: 'Understand user roles and what each role can do in the system.',
    href: '/help/roles',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
  },
];

export default function HelpCenterPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-lg text-gray-600">
          Welcome to IUT02 Care Help Center. Find guides and answers to help you make the most of the platform.
        </p>
      </div>

      {/* Quick Start Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">New to IUT02 Care?</h2>
            <p className="text-emerald-100 mb-4">Get started with our quick 5-minute guide to learn the basics.</p>
            <Link
              href="/help/getting-started"
              className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Getting Started Guide
            </Link>
          </div>
          <div className="hidden md:block">
            <svg className="w-24 h-24 text-emerald-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Help Topics Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Browse Topics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {helpTopics.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all"
          >
            <div className="flex items-start">
              <div className={`w-14 h-14 ${topic.bgColor} rounded-xl flex items-center justify-center text-gray-700 group-hover:scale-110 transition-transform`}>
                {topic.icon}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          <details className="bg-white rounded-lg border border-gray-200 p-4 group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              How do I donate to a project?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-3 text-gray-600 text-sm">
              Navigate to a project&apos;s detail page and click on the &quot;Donate Now&quot; tab. You&apos;ll find information on how to contact the fund administrators to make a donation via various payment methods including Bkash, Nagad, Bank Transfer, or Cash.
            </p>
          </details>
          <details className="bg-white rounded-lg border border-gray-200 p-4 group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              What are the different user roles?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-3 text-gray-600 text-sm">
              There are four roles: Super Admin (full access), Admin (manage projects and users), Fund Admin (manage contributions for assigned projects), and User (view-only access). See the <Link href="/help/roles" className="text-emerald-600 hover:underline">Roles & Permissions</Link> guide for details.
            </p>
          </details>
          <details className="bg-white rounded-lg border border-gray-200 p-4 group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              How can I upload media to a project?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-3 text-gray-600 text-sm">
              Go to a project&apos;s detail page and click on the &quot;Media&quot; tab. If you have admin or fund admin permissions, you&apos;ll see an &quot;Upload Media&quot; button. You can upload images (up to 10MB), videos (up to 100MB), and audio files (up to 20MB).
            </p>
          </details>
          <details className="bg-white rounded-lg border border-gray-200 p-4 group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              How do I import a project from Excel?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-3 text-gray-600 text-sm">
              Admins can import projects using the &quot;Import Project&quot; feature in the navigation. Download the Excel template, fill in your project details and contributions, then upload the file. See the <Link href="/help/import" className="text-emerald-600 hover:underline">Import Projects</Link> guide for step-by-step instructions.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-10 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Still Need Help?</h2>
        <p className="text-gray-600 mb-4">
          Can&apos;t find what you&apos;re looking for? Contact the system administrator for assistance.
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact your organization&apos;s administrator
        </div>
      </div>
    </div>
  );
}
