// components/LandingPage.tsx
import React from 'react';
import { User, Shield, Database } from 'lucide-react';

interface LandingPageProps {
  onFieldAgentLogin: () => void;
  onAdminLogin: () => void;
}

export function LandingPage({ onFieldAgentLogin, onAdminLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Child Health Record System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive child health monitoring and malnutrition tracking system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Field Agent Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">Field Agent</h3>
            <p className="text-gray-600 text-center mb-6">
              Collect child health data offline. Work without internet connection and sync when available.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Work completely offline
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                No login required for data collection
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Sync records when internet is available
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Automatic data backup
              </li>
            </ul>
            <button
              onClick={onFieldAgentLogin}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            >
              Start as Field Agent
            </button>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">Administrator</h3>
            <p className="text-gray-600 text-center mb-6">
              Access analytics, manage records, and monitor field operations with comprehensive dashboards.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                View analytics and reports
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Monitor field agent activities
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Download health records
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                System administration
              </li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Demo Credentials:</strong><br />
                Username: <strong>admin</strong><br />
                Password: <strong>admin123</strong>
              </p>
            </div>
            <button
              onClick={onAdminLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              Login as Administrator
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Secure • Offline-First • Multi-Language Support
          </p>
        </div>
      </div>
    </div>
  );
}