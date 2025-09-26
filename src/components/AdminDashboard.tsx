import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, AlertTriangle, Upload, TrendingUp, Download, Search } from 'lucide-react';
import { ChildRecord, AdminStats } from '../types';
import { db } from '../services/database';
import { PDFService } from '../services/pdf';
import { calculateBMI, getMalnutritionStatus } from '../utils/healthId';
import { useTranslation } from 'react-i18next';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

export function AdminDashboard() {
  const { t } = useTranslation();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHealthId, setSearchHealthId] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const allRecords = await db.getChildRecords();
      setRecords(allRecords); // Admin sees ALL records

      const totalChildren = allRecords.length;
      let normalCases = 0, moderateCases = 0, severeCases = 0;

      allRecords.forEach(record => {
        const bmi = calculateBMI(record.childWeight, record.childHeight);
        const status = getMalnutritionStatus(bmi, record.age);
        if (status === 'Normal') normalCases++;
        if (status === 'Moderate Acute Malnutrition') moderateCases++;
        if (status === 'Severe Acute Malnutrition') severeCases++;
      });

      const malnutritionCases = moderateCases + severeCases;
      const pendingUploads = allRecords.filter(r => !r.isUploaded).length;

      const regionStats = [
        { region: 'North Region', count: Math.floor(totalChildren * 0.3), malnutritionRate: 0.15 },
        { region: 'South Region', count: Math.floor(totalChildren * 0.25), malnutritionRate: 0.12 },
        { region: 'East Region', count: Math.floor(totalChildren * 0.25), malnutritionRate: 0.18 },
        { region: 'West Region', count: Math.floor(totalChildren * 0.2), malnutritionRate: 0.10 },
      ];

      setStats({
        totalChildren,
        malnutritionCases,
        pendingUploads,
        activeRepresentatives: 5,
        regionStats,
        moderateCases,
        severeCases,
        normalCases
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAndDownload = async () => {
    if (!searchHealthId.trim()) {
      alert(t('alerts.enterHealthId'));
      return;
    }
    try {
      const record = await db.getChildRecordByHealthId(searchHealthId.trim());
      if (record) {
        await PDFService.downloadHealthBooklet(record);
      } else {
        alert(t('alerts.noRecordFound'));
      }
    } catch (error) {
      console.error('Failed to search/download record:', error);
      alert(t('alerts.downloadFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('noRecordsFound')}</p>
      </div>
    );
  }

  const malnutritionData = [
    { name: t('statusGood'), value: stats.normalCases || 0 },
    { name: t('statusModerate'), value: stats.moderateCases || 0 },
    { name: t('statusHighRisk'), value: stats.severeCases || 0 },
  ];

  const ageGroups = records.reduce((acc, record) => {
    const ageGroup = record.age < 1 ? '0-1' :
      record.age < 3 ? '1-3' :
      record.age < 5 ? '3-5' :
      record.age < 10 ? '5-10' : '10+';
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ageGroupData = Object.entries(ageGroups).map(([group, count]) => ({
    age: group,
    count,
  }));

  const AGE_ORDER = ['0-1', '1-3', '3-5', '5-10', '10+'];
  ageGroupData.sort((a, b) => AGE_ORDER.indexOf(a.age) - AGE_ORDER.indexOf(b.age));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central" fontSize="12" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard')}</h2>
        <p className="text-gray-600">{t('fillForm')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalChildren')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalChildren}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('malnutritionCases')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.malnutritionCases}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('pendingUploads')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingUploads}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('activeFieldAgents')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeRepresentatives}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Health ID Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('downloadHealthRecord')}</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('enterHealthIdPlaceholder') || ''}
              value={searchHealthId}
              onChange={(e) => setSearchHealthId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearchAndDownload}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{t('searchAndDownload')}</span>
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{t('nutritionalStatusDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Legend verticalAlign="bottom" height={36} />
              <Pie
                data={malnutritionData}
                cx="50%" cy="50%"
                labelLine={false} label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {malnutritionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{t('childrenByAgeGroup')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Recent Records */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">{t('recentRecords')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('childName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('healthIdLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('age')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('statusLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('createdLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.slice(0, 10).map((record) => {
                const bmi = calculateBMI(record.childWeight, record.childHeight);
                const malnutritionStatus = getMalnutritionStatus(bmi, record.age);
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4">{record.childName}</td>
                    <td className="px-6 py-4 font-mono text-indigo-600">{record.healthId}</td>
                    <td className="px-6 py-4">{record.age}</td>
                    <td className="px-6 py-4">
                      <span className={
                        malnutritionStatus === 'Normal' ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full' :
                        malnutritionStatus.includes('Moderate') ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full' :
                        'bg-red-100 text-red-800 px-2 py-1 rounded-full'
                      }>
                        {malnutritionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => PDFService.downloadHealthBooklet(record)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('downloadPDF')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}