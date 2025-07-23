export interface ScrapingJob {
  id: string
  userId: string
  name: string
  description?: string
  targetUrls: string[]
  extractionInstructions?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  completedAt?: string
  totalPages: number
  processedPages: number
  successPages: number
  failedPages: number
  settings?: ScrapingSettings
}

export interface ScrapingSettings {
  maxPages?: number
  delay?: number
  timeout?: number
  followPagination?: boolean
  userAgent?: string
  headers?: Record<string, string>
  selectors?: Record<string, string>
  enableJavaScript?: boolean
}

export interface ExtractionResult {
  id: string
  jobId: string
  userId: string
  pageUrl: string
  extractionSource: 'parser' | 'llm' | 'hybrid'
  extractedData: Record<string, any>
  htmlContext?: string
  explanation?: string
  processingTimeMs: number
  createdAt: string
}

export interface PageLog {
  id: string
  jobId: string
  userId: string
  pageUrl: string
  status: 'success' | 'failed' | 'skipped'
  errorMessage?: string
  processingTimeMs: number
  createdAt: string
}

export interface ScrapedData {
  url: string
  title?: string
  content: Record<string, any>
  metadata: {
    extractionSource: 'parser' | 'llm' | 'hybrid'
    processingTime: number
    timestamp: string
    htmlContext?: string
    explanation?: string
  }
}

export interface ParserRule {
  name: string
  selector: string
  attribute?: string
  multiple?: boolean
  required?: boolean
  transform?: (value: string) => any
}

export interface ParsedContent {
  success: boolean
  data: Record<string, any>
  confidence: number
  htmlContext: string
  errors?: string[]
}