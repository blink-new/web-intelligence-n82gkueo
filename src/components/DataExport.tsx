import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { 
  Download, 
  FileText, 
  Database, 
  Cloud, 
  Filter, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Eye
} from 'lucide-react'
import { blink } from '../blink/client'

interface ExportJob {
  id: string
  name: string
  format: 'csv' | 'json' | 'xlsx' | 'xml'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  size: string
  created: string
  downloadUrl?: string
}

interface DataVisualization {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any[]
  config: any
}

export function DataExport() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [visualizations, setVisualizations] = useState<DataVisualization[]>([])
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xlsx' | 'xml'>('csv')
  const [exportName, setExportName] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [filters, setFilters] = useState({
    industry: '',
    status: '',
    source: ''
  })

  const loadExportJobs = async () => {
    // Simulate loading export jobs
    const sampleJobs: ExportJob[] = [
      {
        id: 'exp_1',
        name: 'E-commerce Price Data',
        format: 'csv',
        status: 'completed',
        size: '2.4 MB',
        created: '2024-01-22 14:30',
        downloadUrl: '#'
      },
      {
        id: 'exp_2',
        name: 'Real Estate Listings',
        format: 'json',
        status: 'processing',
        size: '1.8 MB',
        created: '2024-01-22 15:45'
      },
      {
        id: 'exp_3',
        name: 'Travel Deals Analysis',
        format: 'xlsx',
        status: 'completed',
        size: '3.2 MB',
        created: '2024-01-22 16:20',
        downloadUrl: '#'
      }
    ]
    setExportJobs(sampleJobs)
  }

  const loadVisualizations = async () => {
    // Simulate loading visualizations
    const sampleViz: DataVisualization[] = [
      {
        id: 'viz_1',
        name: 'Price Trends by Category',
        type: 'line',
        data: [],
        config: {}
      },
      {
        id: 'viz_2',
        name: 'Extraction Methods Distribution',
        type: 'pie',
        data: [],
        config: {}
      },
      {
        id: 'viz_3',
        name: 'Success Rate by Domain',
        type: 'bar',
        data: [],
        config: {}
      }
    ]
    setVisualizations(sampleViz)
  }

  useEffect(() => {
    loadExportJobs()
    loadVisualizations()
  }, [])

  const createExport = async () => {
    if (!exportName.trim()) return

    const newJob: ExportJob = {
      id: `exp_${Date.now()}`,
      name: exportName,
      format: selectedFormat,
      status: 'pending',
      size: 'Calculating...',
      created: new Date().toLocaleString()
    }

    setExportJobs(prev => [newJob, ...prev])
    setExportName('')

    // Simulate processing
    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'processing' }
          : job
      ))
    }, 1000)

    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              status: 'completed', 
              size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
              downloadUrl: '#'
            }
          : job
      ))
    }, 3000)
  }

  const downloadExport = (job: ExportJob) => {
    // Simulate download
    const blob = new Blob(['Sample export data'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name}.${job.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { value: 'json', label: 'JSON', icon: Database, description: 'JavaScript Object Notation' },
    { value: 'xlsx', label: 'Excel', icon: FileText, description: 'Microsoft Excel format' },
    { value: 'xml', label: 'XML', icon: FileText, description: 'Extensible Markup Language' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Export & Visualization</h2>
        <p className="text-gray-600">
          Export your scraped data in various formats and create visualizations for insights.
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Create New Export
              </CardTitle>
              <CardDescription>
                Export your scraped data with custom filters and formatting options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exportName">Export Name</Label>
                  <Input
                    id="exportName"
                    placeholder="e.g., Q1 E-commerce Data"
                    value={exportName}
                    onChange={(e) => setExportName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Format</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {formatOptions.map((format) => (
                      <button
                        key={format.value}
                        onClick={() => setSelectedFormat(format.value as any)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedFormat === format.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <format.icon className="h-4 w-4" />
                          <span className="font-medium">{format.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{format.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4" />
                  Filters
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <select
                      id="industry"
                      className="w-full p-2 border rounded-md"
                      value={filters.industry}
                      onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    >
                      <option value="">All Industries</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="realestate">Real Estate</option>
                      <option value="travel">Travel</option>
                      <option value="healthcare">Healthcare</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status">Job Status</Label>
                    <select
                      id="status"
                      className="w-full p-2 border rounded-md"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="source">Extraction Source</Label>
                    <select
                      id="source"
                      className="w-full p-2 border rounded-md"
                      value={filters.source}
                      onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                    >
                      <option value="">All Sources</option>
                      <option value="parser">Parser Only</option>
                      <option value="llm">LLM Only</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={createExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Create Export
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and download your previous exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{job.name}</h4>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <Badge variant="outline">{job.format.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Size: {job.size}</span>
                        <span>Created: {job.created}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadExport(job)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Processing...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Visualizations
              </CardTitle>
              <CardDescription>
                Create interactive charts and graphs from your scraped data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizations.map((viz) => (
                  <Card key={viz.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{viz.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                        {viz.type === 'line' && <TrendingUp className="h-12 w-12 text-gray-400" />}
                        {viz.type === 'pie' && <PieChart className="h-12 w-12 text-gray-400" />}
                        {viz.type === 'bar' && <BarChart3 className="h-12 w-12 text-gray-400" />}
                        <div className="ml-3 text-gray-500">
                          <p className="font-medium">{viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} Chart</p>
                          <p className="text-sm">Interactive visualization</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Create New Visualization
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Data Integrations
              </CardTitle>
              <CardDescription>
                Connect your scraped data to external platforms and services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Google Sheets</h4>
                          <p className="text-sm text-gray-500">Export to spreadsheets</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <p className="text-xs text-gray-500">
                      Automatically sync your scraped data to Google Sheets for easy collaboration.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Cloud className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Zapier</h4>
                          <p className="text-sm text-gray-500">Workflow automation</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <p className="text-xs text-gray-500">
                      Trigger automated workflows when new data is scraped.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Airtable</h4>
                          <p className="text-sm text-gray-500">Database management</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <p className="text-xs text-gray-500">
                      Store and organize your data in Airtable bases.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Tableau</h4>
                          <p className="text-sm text-gray-500">Advanced analytics</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <p className="text-xs text-gray-500">
                      Create advanced visualizations and dashboards.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Custom Integration</h3>
                <p className="text-gray-600 mb-4">
                  Need a custom integration? Our API makes it easy to connect Web Intelligence to any platform.
                </p>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  View API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}