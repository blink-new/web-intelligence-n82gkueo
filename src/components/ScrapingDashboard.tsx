import { useState, useEffect, useCallback } from 'react'
import { Plus, Play, Download, Eye, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Calendar, ExternalLink, AlertCircle } from 'lucide-react'
import { blink } from '../blink/client'

interface ScrapingJob {
  id: string
  userId: string
  name: string
  urls: string[]
  instructions: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  createdAt: string
  completedAt?: string
  settings: {
    enableJavaScript: boolean
    delay: number
    maxPages: number
  }
}

interface ExtractionResult {
  id: string
  jobId: string
  userId: string
  url: string
  extractedData: any
  extractionSource: 'scraper' | 'ai' | 'hybrid'
  htmlContext?: string
  aiExplanation?: string
  processingTime: number
  createdAt: string
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

  const processJob = async (job: ScrapingJob) => {
    try {
      setProcessingJobs(prev => new Set(prev).add(job.id))
      
      // Update job status to running
      await blink.db.scrapingJobs.update(job.id, { 
        status: 'running',
        progress: 0
      })
      
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'running', progress: 0 } : j
      ))

      const extractionResults: ExtractionResult[] = []
      
      for (let i = 0; i < job.urls.length; i++) {
        const url = job.urls[i]
        
        try {
          // Update progress
          const progress = Math.round(((i + 1) / job.urls.length) * 100)
          await blink.db.scrapingJobs.update(job.id, { progress })
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, progress } : j
          ))

          // Scrape the URL using Blink's data scraping
          const startTime = Date.now()
          const { markdown, metadata, extract } = await blink.data.scrape(url)
          const processingTime = Date.now() - startTime

          let extractedData: any = {}
          let extractionSource: 'scraper' | 'ai' | 'hybrid' = 'scraper'
          let aiExplanation = ''

          // Basic structured data extraction
          extractedData = {
            title: metadata.title || extract.headings[0] || 'No title found',
            description: metadata.description || extract.text.substring(0, 200) + '...',
            url: url,
            domain: new URL(url).hostname,
            headings: extract.headings,
            links: extract.links?.slice(0, 10) || [],
            images: extract.images?.slice(0, 5) || [],
            wordCount: extract.text.split(' ').length,
            scrapedAt: new Date().toISOString()
          }

          // If user provided specific instructions, use AI to extract more targeted data
          if (job.instructions.trim()) {
            try {
              const aiResult = await blink.ai.generateObject({
                prompt: `Extract the following information from this webpage content: ${job.instructions}\n\nWebpage content:\n${markdown}`,
                schema: {
                  type: 'object',
                  properties: {
                    extractedInfo: {
                      type: 'object',
                      description: 'The extracted information based on the instructions'
                    },
                    explanation: {
                      type: 'string',
                      description: 'Brief explanation of what was extracted and how'
                    }
                  },
                  required: ['extractedInfo', 'explanation']
                }
              })

              extractedData = {
                ...extractedData,
                aiExtracted: aiResult.object.extractedInfo
              }
              extractionSource = 'hybrid'
              aiExplanation = aiResult.object.explanation
            } catch (aiError) {
              console.warn('AI extraction failed, using basic scraping:', aiError)
            }
          }

          const result: ExtractionResult = {
            id: `result_${job.id}_${i}`,
            jobId: job.id,
            userId: job.userId,
            url,
            extractedData,
            extractionSource,
            htmlContext: markdown.substring(0, 500) + '...',
            aiExplanation,
            processingTime,
            createdAt: new Date().toISOString()
          }

          await blink.db.extractionResults.create(result)
          extractionResults.push(result)

          // Add delay between requests
          if (i < job.urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, job.settings.delay))
          }

        } catch (error) {
          console.error(`Failed to process ${url}:`, error)
          
          // Create error result
          const errorResult: ExtractionResult = {
            id: `result_${job.id}_${i}`,
            jobId: job.id,
            userId: job.userId,
            url,
            extractedData: { error: error instanceof Error ? error.message : 'Unknown error' },
            extractionSource: 'scraper',
            processingTime: 0,
            createdAt: new Date().toISOString()
          }
          
          await blink.db.extractionResults.create(errorResult)
          extractionResults.push(errorResult)
        }
      }

      // Mark job as completed
      await blink.db.scrapingJobs.update(job.id, { 
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString()
      })
      
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { ...j, status: 'completed', progress: 100, completedAt: new Date().toISOString() }
          : j
      ))
      
      setResults(prev => [...extractionResults, ...prev])

    } catch (error) {
      console.error('Job processing failed:', error)
      
      await blink.db.scrapingJobs.update(job.id, { status: 'failed' })
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'failed' } : j
      ))
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(job.id)
        return newSet
      })
    }
  }

  const handleCreateJob = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      if (!newJob.name.trim() || !newJob.urls.trim()) {
        alert('Please provide a job name and at least one URL')
        return
      }

      const jobId = `job_${Date.now()}`
      const urlList = newJob.urls.split('\n').filter(url => url.trim())
      
      const job: ScrapingJob = {
        id: jobId,
        userId: user.id,
        name: newJob.name,
        urls: urlList,
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

      // Start processing the job
      processJob(job)
    } catch (error) {
      console.error('Failed to create job:', error)
      alert('Failed to create job. Please try again.')
    }
  }

  const exportResults = (jobId: string) => {
    const jobResults = results.filter(r => r.jobId === jobId)
    const data = jobResults.map(r => ({
      url: r.url,
      extractedData: r.extractedData,
      extractionSource: r.extractionSource,
      processingTime: r.processingTime,
      scrapedAt: r.createdAt
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scraping-results-${jobId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const runJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    
    await processJob(job)
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
          <p className="text-gray-600">Extract and analyze data from websites with AI-powered scraping</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'jobs', name: 'Scraping Jobs', icon: Clock },
                { id: 'results', name: 'Results', icon: Eye }
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Quick Start Guide */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Create a Scraping Job</h4>
                    <p className="text-sm text-gray-600">Go to "Scraping Jobs" tab and click "New Job" to start extracting data from websites.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Add Target URLs</h4>
                    <p className="text-sm text-gray-600">Provide the URLs you want to scrape, one per line. Our system handles both static and dynamic content.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Set Extraction Instructions</h4>
                    <p className="text-sm text-gray-600">Describe what data you want to extract. Our AI will understand and extract the relevant information.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Monitor & Export</h4>
                    <p className="text-sm text-gray-600">Watch real-time progress and export your results as JSON for further analysis.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                      placeholder="E.g., Product Price Analysis"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extraction Instructions (Optional)</label>
                    <textarea
                      value={newJob.instructions}
                      onChange={(e) => setNewJob(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                      placeholder="Extract product names, prices, and availability status. Also get customer reviews and ratings."
                    />
                    <p className="text-xs text-gray-500 mt-1">Describe what specific data you want to extract. Our AI will understand and target that information.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delay (ms)</label>
                      <input
                        type="number"
                        value={newJob.delay}
                        onChange={(e) => setNewJob(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        min="500"
                        max="10000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Pages</label>
                      <input
                        type="number"
                        value={newJob.maxPages}
                        onChange={(e) => setNewJob(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 10 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        min="1"
                        max="100"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableJavaScript"
                        checked={newJob.enableJavaScript}
                        onChange={(e) => setNewJob(prev => ({ ...prev, enableJavaScript: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="enableJavaScript" className="text-sm text-gray-700">Enable JavaScript</label>
                    </div>
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
              {jobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scraping jobs yet</h3>
                  <p className="text-gray-600 mb-4">Create your first scraping job to start extracting data from websites.</p>
                  <button
                    onClick={() => setShowNewJobForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Create First Job
                  </button>
                </div>
              ) : (
                jobs.map((job) => (
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
                        {job.status === 'pending' && (
                          <button
                            onClick={() => runJob(job.id)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Run Job"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {job.status === 'completed' && (
                          <button
                            onClick={() => exportResults(job.id)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Export Results"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {job.progress !== undefined && job.status === 'running' && (
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
                    
                    {job.instructions && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Instructions:</h4>
                        <p className="text-sm text-gray-600">{job.instructions}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-700">Target URLs:</h4>
                      {job.urls.slice(0, 3).map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <ExternalLink className="h-3 w-3" />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate">
                            {url}
                          </a>
                        </div>
                      ))}
                      {job.urls.length > 3 && (
                        <p className="text-sm text-gray-500">... and {job.urls.length - 3} more URLs</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Extraction Results</h2>
            
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                  <p className="text-gray-600">Run a scraping job to see extracted data here.</p>
                </div>
              ) : (
                results.map((result) => (
                  <div key={result.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{result.url}</h3>
                        <p className="text-sm text-gray-600">
                          Extracted via {result.extractionSource} • {result.processingTime}ms • {new Date(result.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.extractionSource === 'scraper' ? 'bg-blue-100 text-blue-800' :
                        result.extractionSource === 'ai' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.extractionSource}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Extracted Data</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
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
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}