import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { Copy, Key, Webhook, Code, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { blink } from '../blink/client'

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created: string
  lastUsed: string
  status: 'active' | 'inactive'
}

interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  created: string
  lastTriggered: string
}

export function APIIntegration() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [testEndpoint, setTestEndpoint] = useState('')
  const [testResponse, setTestResponse] = useState('')

  const loadAPIKeys = async () => {
    // Simulate loading API keys
    const sampleKeys: APIKey[] = [
      {
        id: 'key_1',
        name: 'Production API',
        key: 'wi_live_sk_1234567890abcdef',
        permissions: ['read', 'write', 'admin'],
        created: '2024-01-15',
        lastUsed: '2024-01-22',
        status: 'active'
      },
      {
        id: 'key_2',
        name: 'Development API',
        key: 'wi_test_sk_abcdef1234567890',
        permissions: ['read', 'write'],
        created: '2024-01-10',
        lastUsed: '2024-01-20',
        status: 'active'
      }
    ]
    setApiKeys(sampleKeys)
  }

  const loadWebhooks = async () => {
    // Simulate loading webhooks
    const sampleWebhooks: Webhook[] = [
      {
        id: 'wh_1',
        url: 'https://api.mycompany.com/webhooks/scraping',
        events: ['job.completed', 'job.failed'],
        secret: 'whsec_1234567890abcdef',
        status: 'active',
        created: '2024-01-15',
        lastTriggered: '2024-01-22'
      }
    ]
    setWebhooks(sampleWebhooks)
  }

  useEffect(() => {
    loadAPIKeys()
    loadWebhooks()
  }, [])

  const generateAPIKey = async () => {
    if (!newKeyName.trim()) return

    const newKey: APIKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `wi_live_sk_${Math.random().toString(36).substring(2, 18)}`,
      permissions: ['read', 'write'],
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'active'
    }

    setApiKeys(prev => [...prev, newKey])
    setNewKeyName('')
  }

  const createWebhook = async () => {
    if (!newWebhookUrl.trim() || selectedEvents.length === 0) return

    const newWebhook: Webhook = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      events: selectedEvents,
      secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
      status: 'active',
      created: new Date().toISOString().split('T')[0],
      lastTriggered: 'Never'
    }

    setWebhooks(prev => [...prev, newWebhook])
    setNewWebhookUrl('')
    setSelectedEvents([])
  }

  const testAPIEndpoint = async () => {
    setTestResponse('Testing API endpoint...')
    
    // Simulate API test
    setTimeout(() => {
      setTestResponse(`{
  "status": "success",
  "data": {
    "job_id": "job_123456",
    "status": "completed",
    "results_count": 150,
    "processing_time": "2.3s",
    "extraction_sources": {
      "parser": 85,
      "llm": 45,
      "hybrid": 20
    }
  },
  "timestamp": "${new Date().toISOString()}"
}`)
    }, 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const webhookEvents = [
    'job.created',
    'job.started',
    'job.completed',
    'job.failed',
    'data.extracted',
    'schedule.triggered'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Integration</h2>
        <p className="text-gray-600">
          Integrate Web Intelligence with your applications using our REST API and webhooks.
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access to Web Intelligence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production API"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={generateAPIKey}>Generate Key</Button>
                </div>
              </div>

              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.name}</h4>
                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                          {key.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Switch checked={key.status === 'active'} />
                      </div>
                    </div>
                    <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                      {key.key}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Created: {key.created}</span>
                      <span>Last used: {key.lastUsed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Configure webhooks to receive real-time notifications about scraping events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://api.yourapp.com/webhooks"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {webhookEvents.map((event) => (
                      <label key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents(prev => [...prev, event])
                            } else {
                              setSelectedEvents(prev => prev.filter(ev => ev !== event))
                            }
                          }}
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={createWebhook}>Create Webhook</Button>
              </div>

              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.url}</h4>
                        <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <Switch checked={webhook.status === 'active'} />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                      Secret: {webhook.secret}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Created: {webhook.created}</span>
                      <span>Last triggered: {webhook.lastTriggered}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Learn how to integrate Web Intelligence into your applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div className="text-green-400"># Create a scraping job</div>
                  <div>curl -X POST https://api.webintelligence.com/v1/jobs \</div>
                  <div>  -H "Authorization: Bearer YOUR_API_KEY" \</div>
                  <div>  -H "Content-Type: application/json" \</div>
                  <div>  -d '{`{`}</div>
                  <div>    "urls": ["https://example.com/products"],</div>
                  <div>    "instructions": "Extract product names and prices",</div>
                  <div>    "industry": "ecommerce"</div>
                  <div>  {`}`}'</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Endpoints</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">POST</Badge>
                      <code>/v1/jobs</code>
                    </div>
                    <p className="text-sm text-gray-600">Create a new scraping job</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">GET</Badge>
                      <code>/v1/jobs/{`{id}`}</code>
                    </div>
                    <p className="text-sm text-gray-600">Get job status and results</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">GET</Badge>
                      <code>/v1/jobs</code>
                    </div>
                    <p className="text-sm text-gray-600">List all jobs with pagination</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Response Format</h3>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <div>{`{`}</div>
                  <div>  "job_id": "job_123456",</div>
                  <div>  "status": "completed",</div>
                  <div>  "results": [</div>
                  <div>    {`{`}</div>
                  <div>      "url": "https://example.com/product1",</div>
                  <div>      "data": {`{`}</div>
                  <div>        "name": "Product Name",</div>
                  <div>        "price": "$29.99"</div>
                  <div>      {`}`},</div>
                  <div>      "source": "hybrid",</div>
                  <div>      "confidence": 0.95</div>
                  <div>    {`}`}</div>
                  <div>  ]</div>
                  <div>{`}`}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                API Testing
              </CardTitle>
              <CardDescription>
                Test your API integration with live endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testEndpoint">Test Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    id="testEndpoint"
                    placeholder="/v1/jobs/job_123456"
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                  />
                  <Button onClick={testAPIEndpoint}>
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>

              {testResponse && (
                <div>
                  <Label>Response</Label>
                  <Textarea
                    value={testResponse}
                    readOnly
                    className="font-mono text-sm h-64"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">API Status</span>
                    </div>
                    <p className="text-sm text-gray-600">All systems operational</p>
                    <p className="text-xs text-gray-500 mt-1">Last checked: 2 minutes ago</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Rate Limits</span>
                    </div>
                    <p className="text-sm text-gray-600">1000 requests/hour</p>
                    <p className="text-xs text-gray-500 mt-1">Current usage: 45/1000</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}