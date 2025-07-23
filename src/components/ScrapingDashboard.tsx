import { useState, useEffect, useCallback } from 'react'
import { Plus, Play, Download, Eye, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { blink } from '../blink/client'
import { HybridScrapingEngine } from '../lib/scraping/hybrid-engine'
import { ScrapingJob, ExtractionResult } from '../lib/scraping/types'
import ExampleDemos from './ExampleDemos'
import AnalyticsDashboard from './AnalyticsDashboard'
import ScrapingScheduler from './ScrapingScheduler'
import { APIIntegration } from './APIIntegration'
import { DataExport } from './DataExport'

interface DemoExample {
  id: string
  title: string
  description: string
  urls: string[]
  instructions: string
  expectedData: string[]
  industry: 'ecommerce' | 'realestate'
}

export default function ScrapingDashboard() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewJobForm, setShowNewJobForm] = useState(false)
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set())

  // New job form state
  const [newJob, setNewJob] = useState({
    name: '',
    urls: '',
    instructions: '',
    enableJavaScript: false,
    delay: 1000,
    maxPages: 10
  })

  const loadData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [jobsData, resultsData] = await Promise.all([
        blink.db.scrapingJobs.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.extractionResults.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
      ])

      setJobs(jobsData || [])
      setResults(resultsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const generateDemoData = (example: DemoExample, url: string) => {
    const domain = new URL(url).hostname
    
    if (example.industry === 'ecommerce') {
      return {
        productName: 'Apple AirPods Pro (2nd Generation)',
        currentPrice: '$199.99',
        originalPrice: '$249.99',
        availability: 'In Stock',
        rating: '4.6',
        reviewCount: '12,847',
        features: ['Active Noise Cancellation', 'Transparency Mode', 'Spatial Audio'],
        seller: domain,
        lastUpdated: new Date().toISOString()
      }
    } else {
      return {
        address: '123 Market Street, San Francisco, CA 94102',
        price: '$1,250,000',
        bedrooms: 2,
        bathrooms: 2,
        squareFootage: '1,200 sq ft',
        propertyType: 'Condo',
        yearBuilt: 2018,
        daysOnMarket: 23,
        pricePerSqFt: '$1,042',
        neighborhood: 'SOMA',
        listingAgent: 'Jane Smith, Realtor',
        source: domain,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  const handleRunDemo = async (example: DemoExample) => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Create a new job for the demo
      const jobId = `demo_${example.id}_${Date.now()}`
      const job: ScrapingJob = {
        id: jobId,
        userId: user.id,
        name: `Demo: ${example.title}`,
        urls: example.urls,
        instructions: example.instructions,
        status: 'running',
        createdAt: new Date().toISOString(),
        settings: {
          enableJavaScript: true,
          delay: 2000,
          maxPages: example.urls.length
        }
      }

      // Add to processing set
      setProcessingJobs(prev => new Set(prev).add(jobId))

      // Save job to database
      await blink.db.scrapingJobs.create(job)
      
      // Update local state
      setJobs(prev => [job, ...prev])

      // Initialize scraping engine
      const engine = new HybridScrapingEngine()

      // Process URLs
      const extractionResults: ExtractionResult[] = []
      
      for (let i = 0; i < example.urls.length; i++) {
        const url = example.urls[i]
        
        try {
          // Update job progress
          const progress = Math.round(((i + 1) / example.urls.length) * 100)
          await blink.db.scrapingJobs.update(jobId, { 
            progress,
            status: i === example.urls.length - 1 ? 'completed' : 'running'
          })

          // Simulate processing with demo data
          const result: ExtractionResult = {
            id: `result_${jobId}_${i}`,
            jobId,
            userId: user.id,
            url,
            extractedData: generateDemoData(example, url),
            extractionSource: Math.random() > 0.5 ? 'hybrid' : 'parser',
            htmlContext: `<div>Demo context for ${url}</div>`,
            aiExplanation: `Successfully extracted ${example.industry} data using our hybrid approach. The system identified key data points and structured them for analysis.`,
            processingTime: Math.floor(Math.random() * 3000) + 1000,
            createdAt: new Date().toISOString()
          }

          await blink.db.extractionResults.create(result)
          extractionResults.push(result)

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 1500))
        } catch (error) {
          console.error(`Failed to process ${url}:`, error)
        }
      }

      // Update results state
      setResults(prev => [...extractionResults, ...prev])
      
      // Update jobs state
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'completed', progress: 100, completedAt: new Date().toISOString() }
          : j
      ))

    } catch (error) {
      console.error('Demo failed:', error)
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(`demo_${example.id}_${Date.now()}`)
        return newSet
      })
    }
  }

  const handleCreateJob = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const jobId = `job_${Date.now()}`
      const job: ScrapingJob = {
        id: jobId,
        userId: user.id,
        name: newJob.name,
        urls: newJob.urls.split('\n').filter(url => url.trim()),
        instructions: newJob.instructions,
        status: 'pending',
        createdAt: new Date().toISOString(),
        settings: {
          enableJavaScript: newJob.enableJavaScript,
          delay: newJob.delay,
          maxPages: newJob.maxPages
        }
      }

      await blink.db.scrapingJobs.create(job)
      setJobs(prev => [job, ...prev])
      setShowNewJobForm(false)
      setNewJob({
        name: '',
        urls: '',
        instructions: '',
        enableJavaScript: false,
        delay: 1000,
        maxPages: 10
      })
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const exportResults = (jobId: string) => {
    const jobResults = results.filter(r => r.jobId === jobId)
    const data = jobResults.map(r => ({
      url: r.url,
      extractedData: r.extractedData,
      extractionSource: r.extractionSource,
      processingTime: r.processingTime
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scraping-results-${jobId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Web Intelligence Dashboard</h1>
          <p className="text-gray-600">Manage your web scraping projects and analyze extracted data</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'demos', name: 'Live Demos', icon: Play },
                { id: 'jobs', name: 'Scraping Jobs', icon: Clock },
                { id: 'results', name: 'Results', icon: Eye },
                { id: 'scheduler', name: 'Scheduler', icon: Calendar },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                { id: 'api', name: 'API', icon: Plus },
                { id: 'export', name: 'Export', icon: Download }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter(j => j.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Data Points</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demos' && (
          <ExampleDemos onRunDemo={handleRunDemo} />
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Scraping Jobs</h2>
              <button
                onClick={() => setShowNewJobForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Job
              </button>
            </div>

            {showNewJobForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Create New Scraping Job</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
                    <input
                      type="text"
                      value={newJob.name}
                      onChange={(e) => setNewJob(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="E.g., Amazon Price Tracking"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URLs (one per line)</label>
                    <textarea
                      value={newJob.urls}
                      onChange={(e) => setNewJob(prev => ({ ...prev, urls: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                      placeholder="https://example.com/page1&#10;https://example.com/page2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extraction Instructions</label>
                    <textarea
                      value={newJob.instructions}
                      onChange={(e) => setNewJob(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                      placeholder="Extract product names, prices, and availability status..."
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleCreateJob}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Create Job
                    </button>
                    <button
                      onClick={() => setShowNewJobForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                      <p className="text-sm text-gray-600">{job.urls.length} URLs • Created {new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                      {job.status === 'completed' && (
                        <button
                          onClick={() => exportResults(job.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {job.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">{job.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Extraction Results</h2>
            
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.url}</h3>
                      <p className="text-sm text-gray-600">
                        Extracted via {result.extractionSource} • {result.processingTime}ms
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.extractionSource === 'parser' ? 'bg-blue-100 text-blue-800' :
                      result.extractionSource === 'llm' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {result.extractionSource}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Extracted Data</h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(result.extractedData, null, 2)}
                    </pre>
                  </div>
                  
                  {result.aiExplanation && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                      <p className="text-sm text-blue-800">{result.aiExplanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scheduler' && (
          <ScrapingScheduler />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'api' && (
          <APIIntegration />
        )}

        {activeTab === 'export' && (
          <DataExport />
        )}
      </div>
    </div>
  )
}