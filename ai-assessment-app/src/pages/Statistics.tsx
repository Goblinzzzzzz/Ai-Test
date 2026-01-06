import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3, Users, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { getCohortStatistics, getRecentAssessments, getAssessmentDistribution } from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsData {
  cohort: string;
  total_count: number;
  avg_total: number;
  avg_d1: number;
  avg_d2: number;
  avg_d3: number;
  avg_d4: number;
  avg_d5: number;
  min_total: number;
  max_total: number;
}

interface AssessmentRecord {
  id: string;
  name: string;
  total: number;
  title: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  created_at: string;
}

const Statistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentRecord[]>([]);
  const [, setDistribution] = useState<Array<{ total: number; d1: number; d2: number; d3: number; d4: number; d5: number; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCohort] = useState('default');

  useEffect(() => {
    loadStatistics();
  }, [selectedCohort]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [stats, recent, dist] = await Promise.all([
        getCohortStatistics(selectedCohort),
        getRecentAssessments(selectedCohort, 50),
        getAssessmentDistribution(selectedCohort)
      ]);

      // Fallback: compute statistics from distribution if view has no row
      if (!stats && dist && dist.length) {
        const count = dist.length;
        const totals = dist.map((x: any) => x.total);
        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
        const computed: StatisticsData = {
          cohort: selectedCohort,
          total_count: count,
          avg_total: Number(avg(totals).toFixed(2)),
          avg_d1: Number(avg(dist.map((x: any) => x.d1)).toFixed(2)),
          avg_d2: Number(avg(dist.map((x: any) => x.d2)).toFixed(2)),
          avg_d3: Number(avg(dist.map((x: any) => x.d3)).toFixed(2)),
          avg_d4: Number(avg(dist.map((x: any) => x.d4)).toFixed(2)),
          avg_d5: Number(avg(dist.map((x: any) => x.d5)).toFixed(2)),
          min_total: Math.min(...totals),
          max_total: Math.max(...totals)
        };
        setStatistics(computed);
      } else {
        setStatistics(stats);
      }

      setRecentAssessments(recent || []);
      setDistribution(dist || []);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // User-friendly error messages
      let errorMessage = '无法加载统计数据，请稍后重试';
      if (err instanceof Error) {
        if (err.message.includes('网络') || err.message.includes('network') || err.message.includes('Failed to fetch')) {
          errorMessage = '网络连接失败，请检查您的网络连接后重试';
        } else if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
          errorMessage = '服务暂时不可用，请稍后重试';
        } else if (err.message.includes('500')) {
          errorMessage = '服务器错误，请稍后重试';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate persona distribution
  const getPersonaDistribution = () => {
    const distribution = { 'AI 观望者': 0, '效率尝鲜者': 0, '流程设计师': 0, '超级个体': 0 };
    
    recentAssessments.forEach(assessment => {
      if (assessment.total <= 8) distribution['AI 观望者']++;
      else if (assessment.total <= 16) distribution['效率尝鲜者']++;
      else if (assessment.total <= 24) distribution['流程设计师']++;
      else distribution['超级个体']++;
    });

    return distribution;
  };

  // Chart data
  const dimensionChartData = {
    labels: ['AI卷入度', '指令驾驭力', '场景覆盖率', '创新进化力', '技术亲和度'],
    datasets: [
      {
        label: '平均分',
        data: statistics ? [
          statistics.avg_d1,
          statistics.avg_d2,
          statistics.avg_d3,
          statistics.avg_d4,
          statistics.avg_d5
        ] : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  const personaChartData = {
    labels: Object.keys(getPersonaDistribution()),
    datasets: [
      {
        data: Object.values(getPersonaDistribution()),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 6
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    }
  };

  const exportToCSV = () => {
    if (!recentAssessments.length) return;

    const headers = ['姓名', '总分', '画像', 'AI卷入度', '指令驾驭力', '场景覆盖率', '创新进化力', '技术亲和度', '测评时间'];
    const rows = recentAssessments.map(assessment => [
      assessment.name,
      assessment.total,
      assessment.title,
      assessment.d1,
      assessment.d2,
      assessment.d3,
      assessment.d4,
      assessment.d5,
      new Date(assessment.created_at).toLocaleString('zh-CN')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ai_assessment_data_${selectedCohort}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载统计数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={loadStatistics}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">📊</div>
          <p className="text-gray-600">暂无统计数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">群体数据统计</h1>
          <p className="text-gray-600">班级: {selectedCohort} | 样本数: {statistics.total_count}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总平均分</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.avg_total.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">最高分</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.max_total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">最低分</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.min_total}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">参与人数</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_count}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Dimension Scores Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">各维度平均分</h3>
            <div className="h-80">
              <Bar data={dimensionChartData} options={chartOptions} />
            </div>
          </div>

          {/* Persona Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">画像分布</h3>
            <div className="h-80">
              <Doughnut data={personaChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Recent Assessments Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">最近测评记录</h3>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              导出CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">画像</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI卷入度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指令驾驭力</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场景覆盖率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创新进化力</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">技术亲和度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">测评时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assessment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.total <= 8 ? 'bg-red-100 text-red-800' :
                        assessment.total <= 16 ? 'bg-yellow-100 text-yellow-800' :
                        assessment.total <= 24 ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {assessment.total}/30
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.d1}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.d2}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.d3}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.d4}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.d5}/6
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assessment.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
