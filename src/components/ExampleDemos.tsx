import React, { useState } from 'react'
import { ShoppingCart, Home, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface DemoExample {
  id: string
  title: string
  description: string
  urls: string[]
  instructions: string
  expectedData: string[]
  industry: 'ecommerce' | 'realestate'
}

const demoExamples: DemoExample[] = [
  {
    id: 'ecommerce-price-tracking',
    title: 'E-commerce Price Tracking',
    description: 'Monitor competitor prices across multiple retailers for the same product',
    urls: [
      'https://www.amazon.com/dp/B08N5WRWNW',
      'https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation/6418599.p',
      'https://www.target.com/p/apple-airpods-pro-2nd-generation/-/A-54191097'
    ],
    instructions: 'Extract product name, current price, original price (if on sale), availability status, customer rating, and number of reviews. Focus on AirPods Pro pricing data.',
    expectedData: [
      'Product Name: Apple AirPods Pro (2nd Generation)',
      'Current Price: $199.99 - $249.99',
      'Availability: In Stock / Limited Stock',
      'Customer Rating: 4.5-4.8 stars',
      'Review Count: 1000+ reviews'
    ],
    industry: 'ecommerce'
  },
  {
    id: 'ecommerce-review-analysis',
    title: 'Product Review Aggregation',
    description: 'Collect and analyze customer reviews across platforms for sentiment analysis',
    urls: [
      'https://www.amazon.com/dp/B0BDHWDR12',
      'https://www.bestbuy.com/site/samsung-galaxy-s23-ultra/6532622.p'
    ],
    instructions: 'Extract recent customer reviews (last 30 days), review ratings, reviewer names, review dates, and key sentiment phrases. Focus on Samsung Galaxy S23 Ultra reviews.',
    expectedData: [
      'Recent Reviews: 50+ new reviews',
      'Average Rating: 4.3-4.6 stars',
      'Common Praise: Camera quality, battery life',
      'Common Complaints: Price, size/weight',
      'Sentiment Trend: 85% positive'
    ],
    industry: 'ecommerce'
  },
  {
    id: 'realestate-listings',
    title: 'Real Estate Listing Aggregation',
    description: 'Gather property listings with detailed metadata from multiple real estate sites',
    urls: [
      'https://www.zillow.com/san-francisco-ca/',
      'https://www.realtor.com/realestateandhomes-search/San-Francisco_CA',
      'https://www.redfin.com/city/17151/CA/San-Francisco'
    ],
    instructions: 'Extract property listings in San Francisco: address, price, bedrooms, bathrooms, square footage, lot size, year built, property type, listing date, and agent contact info.',
    expectedData: [
      'Properties Found: 200+ active listings',
      'Price Range: $800K - $5M+',
      'Property Types: Condos, Single Family, Townhomes',
      'Average Price/sqft: $1,200-$1,800',
      'Days on Market: 15-45 days average'
    ],
    industry: 'realestate'
  },
  {
    id: 'realestate-price-history',
    title: 'Property Price History Analysis',
    description: 'Track price changes and market trends for specific properties over time',
    urls: [
      'https://www.zillow.com/homedetails/123-Main-St-San-Francisco-CA-94102/15178378_zpid/',
      'https://www.redfin.com/CA/San-Francisco/123-Main-St-94102/home/1234567'
    ],
    instructions: 'Extract price history, zestimate changes, comparable sales, neighborhood trends, and market statistics for properties on Main Street, San Francisco.',
    expectedData: [
      'Current Value: $1.2M - $1.5M',
      'Price History: +15% over 2 years',
      'Comparable Sales: 5 recent sales nearby',
      'Market Trend: Stable with slight growth',
      'Neighborhood Stats: Median $1.3M'
    ],
    industry: 'realestate'
  }
]

interface ExampleDemosProps {
  onRunDemo: (example: DemoExample) => void
}

export default function ExampleDemos({ onRunDemo }: ExampleDemosProps) {
  const [selectedExample, setSelectedExample] = useState<DemoExample | null>(null)
  const [runningDemo, setRunningDemo] = useState<string | null>(null)

  const handleRunDemo = async (example: DemoExample) => {
    setRunningDemo(example.id)
    setSelectedExample(example)
    
    try {
      await onRunDemo(example)
    } finally {
      setRunningDemo(null)
    }
  }

  const ecommerceExamples = demoExamples.filter(ex => ex.industry === 'ecommerce')
  const realestateExamples = demoExamples.filter(ex => ex.industry === 'realestate')

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Live Demo Examples
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          See how Web Intelligence handles real-world scraping scenarios with our hybrid LLM + rules-based approach
        </p>
      </div>

      {/* E-commerce Examples */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">E-commerce Use Cases</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {ecommerceExamples.map((example) => (
            <div key={example.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h4>
              <p className="text-gray-600 mb-4">{example.description}</p>
              
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Target Sites:</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {example.urls.map((url, idx) => (
                      <div key={idx} className="truncate">{new URL(url).hostname}</div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Expected Results:</span>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {example.expectedData.map((data, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {data}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => handleRunDemo(example)}
                disabled={runningDemo === example.id}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {runningDemo === example.id ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Running Demo...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Demo
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Real Estate Examples */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Home className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Real Estate Use Cases</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {realestateExamples.map((example) => (
            <div key={example.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h4>
              <p className="text-gray-600 mb-4">{example.description}</p>
              
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Target Sites:</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {example.urls.map((url, idx) => (
                      <div key={idx} className="truncate">{new URL(url).hostname}</div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Expected Results:</span>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {example.expectedData.map((data, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {data}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => handleRunDemo(example)}
                disabled={runningDemo === example.id}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {runningDemo === example.id ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Running Demo...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Demo
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">How These Demos Work</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Hybrid Analysis</h4>
            <p className="text-sm text-gray-600">Our system first tries rules-based parsing, then uses AI for complex content</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Real-time Processing</h4>
            <p className="text-sm text-gray-600">Watch as pages are processed in parallel with live progress updates</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Structured Results</h4>
            <p className="text-sm text-gray-600">Get clean, structured data with full provenance tracking</p>
          </div>
        </div>
      </div>
    </div>
  )
}