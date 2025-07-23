import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Globe, Clock, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { blink } from '../blink/client'

interface AnalyticsData {
  totalJobs: number
  successRate: number
  avgProcessingTime: number
  dataPointsExtracted: number
  topDomains: { domain: string; count: number }[]
  extractionMethods: { method: string; count: number; percentage: number }[]
  dailyActivity: { date: string; jobs: number; success: number }[]
  industryBreakdown: { industry: string; count: number; percentage: number }[]
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  const loadAnalytics = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Get jobs and results data
      const [jobs, results] = await Promise.all([
        blink.db.scrapingJobs.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.extractionResults.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
      ])

      // Calculate analytics
      const totalJobs = jobs.length
      const completedJobs = jobs.filter(j => j.status === 'completed').length
      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

      const avgProcessingTime = results.length > 0 
        ? results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length
        : 0

      // Extract domains from URLs
      const domainCounts = new Map<string, number>()
      results.forEach(result => {
        try {
          const domain = new URL(result.url).hostname
          domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
        } catch (e) {
          // Invalid URL, skip
        }
      })

      const topDomains = Array.from(domainCounts.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Extraction methods breakdown
      const methodCounts = new Map<string, number>()
      results.forEach(result => {
        const method = result.extractionSource || 'unknown'
        methodCounts.set(method, (methodCounts.get(method) || 0) + 1)
      })

      const extractionMethods = Array.from(methodCounts.entries())
        .map(([method, count]) => ({
          method,
          count,
          percentage: results.length > 0 ? (count / results.length) * 100 : 0
        }))

      // Daily activity (last 7 days)
      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayJobs = jobs.filter(j => j.createdAt.startsWith(dateStr))
        const daySuccess = dayJobs.filter(j => j.status === 'completed')
        
        dailyActivity.push({
          date: dateStr,
          jobs: dayJobs.length,
          success: daySuccess.length
        })
      }

      // Industry breakdown (based on job names and URLs)
      const industryKeywords = {
        'E-commerce': ['amazon', 'ebay', 'shop', 'store', 'product', 'price', 'ecommerce'],
        'Real Estate': ['zillow', 'realtor', 'redfin', 'property', 'house', 'apartment', 'real estate'],
        'Travel': ['booking', 'expedia', 'airbnb', 'hotel', 'flight', 'travel'],
        'Healthcare': ['health', 'medical', 'drug', 'pharmacy', 'clinical', 'hospital'],
        'News & Media': ['news', 'article', 'blog', 'media', 'press'],
        'Other': []
      }

      const industryCounts = new Map<string, number>()
      jobs.forEach(job => {
        const text = (job.name + ' ' + job.urls.join(' ') + ' ' + job.instructions).toLowerCase()
        let classified = false
        
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
          if (industry === 'Other') continue
          if (keywords.some(keyword => text.includes(keyword))) {
            industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1)
            classified = true
            break
          }
        }
        
        if (!classified) {
          industryCounts.set('Other', (industryCounts.get('Other') || 0) + 1)
        }
      })

      const industryBreakdown = Array.from(industryCounts.entries())
        .map(([industry, count]) => ({
          industry,
          count,
          percentage: totalJobs > 0 ? (count / totalJobs) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)

      setAnalytics({
        totalJobs,
        successRate,
        avgProcessingTime,
        dataPointsExtracted: results.length,
        topDomains,
        extractionMethods,
        dailyActivity,
        industryBreakdown
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your web scraping performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalJobs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.avgProcessingTime)}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.dataPointsExtracted.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Activity Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <div className="space-y-3">
              {analytics.dailyActivity.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{day.jobs} jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{day.success} success</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extraction Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Extraction Methods</h3>
            <div className="space-y-4">
              {analytics.extractionMethods.map((method) => (
                <div key={method.method} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">{method.method}</span>
                    <span className="text-sm text-gray-600">{method.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        method.method === 'parser' ? 'bg-blue-500' :
                        method.method === 'llm' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Domains */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Scraped Domains</h3>
            <div className="space-y-3">
              {analytics.topDomains.map((domain, index) => (
                <div key={domain.domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{domain.domain}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{domain.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h3>
            <div className="space-y-4">
              {analytics.industryBreakdown.map((industry) => (
                <div key={industry.industry} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{industry.industry}</span>
                    <span className="text-sm text-gray-600">{industry.count} jobs ({industry.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-90">
                Your success rate is {analytics.successRate > 90 ? 'excellent' : analytics.successRate > 75 ? 'good' : 'needs improvement'}
              </p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-90">
                Average processing time: {analytics.avgProcessingTime < 2000 ? 'Fast' : analytics.avgProcessingTime < 5000 ? 'Moderate' : 'Slow'}
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-90">
                {analytics.dataPointsExtracted} data points extracted successfully
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}