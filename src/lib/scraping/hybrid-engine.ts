import { ProprietaryWebParser } from './parser'
import { LLMExtractor } from './llm-extractor'
import { blink } from '../../blink/client'
import { 
  ScrapingJob, 
  ScrapingSettings, 
  ExtractionResult, 
  ScrapedData,
  PageLog 
} from './types'

export class HybridScrapingEngine {
  private parser: ProprietaryWebParser
  private llmExtractor: LLMExtractor
  private settings: ScrapingSettings

  constructor(settings: ScrapingSettings = {}) {
    this.settings = {
      maxPages: 10,
      delay: 1000,
      timeout: 30000,
      followPagination: false,
      enableJavaScript: true,
      ...settings
    }
    
    this.parser = new ProprietaryWebParser(this.settings)
    this.llmExtractor = new LLMExtractor()
  }

  async processJob(job: ScrapingJob): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update job status to running
      await this.updateJobStatus(job.id, 'running')
      
      // Process all target URLs
      const allUrls = await this.expandUrls(job.targetUrls)
      await this.updateJobProgress(job.id, allUrls.length, 0, 0, 0)
      
      let processedCount = 0
      let successCount = 0
      let failedCount = 0
      
      // Process URLs in batches to avoid overwhelming the system
      const batchSize = 3
      for (let i = 0; i < allUrls.length; i += batchSize) {
        const batch = allUrls.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (url) => {
          try {
            const result = await this.processUrl(url, job)
            if (result.metadata.extractionSource !== 'failed') {
              successCount++
              await this.saveExtractionResult(job, url, result)
            } else {
              failedCount++
            }
          } catch (error) {
            failedCount++
            await this.logPageError(job.id, job.userId, url, error)
          }
          
          processedCount++
          await this.updateJobProgress(job.id, allUrls.length, processedCount, successCount, failedCount)
        })
        
        await Promise.all(batchPromises)
        
        // Add delay between batches
        if (i + batchSize < allUrls.length) {
          await this.delay(this.settings.delay || 1000)
        }
      }
      
      // Mark job as completed
      await this.updateJobStatus(job.id, 'completed', new Date().toISOString())
      
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed')
      await this.logPageError(job.id, job.userId, 'job-level', error)
    }
  }

  async processUrl(url: string, job: ScrapingJob): Promise<ScrapedData> {
    const startTime = Date.now()
    
    try {
      // Step 1: Try proprietary parser first
      const parserResult = await this.parser.extractFromUrl(url)
      
      // Step 2: Determine if LLM assistance is needed
      const needsLLM = this.shouldUseLLM(parserResult, job.extractionInstructions)
      
      let finalResult: ScrapedData
      
      if (needsLLM && job.extractionInstructions) {
        // Step 3: Use hybrid approach
        finalResult = await this.hybridExtraction(url, parserResult, job.extractionInstructions)
      } else if (parserResult.success && parserResult.confidence > 0.6) {
        // Step 4: Parser result is good enough
        finalResult = {
          url,
          content: parserResult.data,
          metadata: {
            extractionSource: 'parser',
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            htmlContext: parserResult.htmlContext
          }
        }
      } else {
        // Step 5: Fallback to LLM-only extraction
        finalResult = await this.llmOnlyExtraction(url, job.extractionInstructions || 'Extract all relevant data')
      }
      
      return finalResult
      
    } catch (error) {
      return {
        url,
        content: {},
        metadata: {
          extractionSource: 'failed' as any,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          explanation: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  private async hybridExtraction(
    url: string, 
    parserResult: any, 
    instructions: string
  ): Promise<ScrapedData> {
    const startTime = Date.now()
    
    try {
      // Get the raw content for LLM processing
      const { markdown, extract } = await blink.data.scrape(url)
      
      // Use LLM to enhance parser results
      const llmResult = await this.llmExtractor.extractWithFallback(
        markdown + '\n\n' + extract.text,
        instructions,
        url
      )
      
      // Merge parser and LLM results intelligently
      const mergedData = this.mergeResults(parserResult.data, llmResult.data)
      
      // Generate explanation for the hybrid approach
      const explanation = await this.llmExtractor.generateExtractionSummary(
        mergedData,
        instructions,
        url
      )
      
      return {
        url,
        content: mergedData,
        metadata: {
          extractionSource: 'hybrid',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          htmlContext: parserResult.htmlContext,
          explanation: `Hybrid extraction: ${explanation}`
        }
      }
    } catch (error) {
      // Fallback to parser result if hybrid fails
      return {
        url,
        content: parserResult.data,
        metadata: {
          extractionSource: 'parser',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          htmlContext: parserResult.htmlContext,
          explanation: 'Hybrid extraction failed, using parser results'
        }
      }
    }
  }

  private async llmOnlyExtraction(url: string, instructions: string): Promise<ScrapedData> {
    const startTime = Date.now()
    
    try {
      const { markdown, extract } = await blink.data.scrape(url)
      const content = markdown + '\n\n' + extract.text
      
      const llmResult = await this.llmExtractor.extractWithFallback(content, instructions, url)
      
      return {
        url,
        content: llmResult.data,
        metadata: {
          extractionSource: 'llm',
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          explanation: llmResult.explanation
        }
      }
    } catch (error) {
      throw new Error(`LLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private shouldUseLLM(parserResult: any, instructions?: string): boolean {
    // Use LLM if:
    // 1. Parser confidence is low
    // 2. Specific instructions are provided
    // 3. Parser failed to extract required data
    
    if (!instructions) return false
    if (parserResult.confidence < 0.5) return true
    if (!parserResult.success) return true
    
    // Check if instructions ask for specific fields not found by parser
    const instructionKeywords = instructions.toLowerCase()
    const extractedFields = Object.keys(parserResult.data).join(' ').toLowerCase()
    
    const requestedFields = ['price', 'title', 'description', 'rating', 'reviews', 'address', 'contact']
    const missingFields = requestedFields.filter(field => 
      instructionKeywords.includes(field) && !extractedFields.includes(field)
    )
    
    return missingFields.length > 0
  }

  private mergeResults(parserData: Record<string, any>, llmData: Record<string, any>): Record<string, any> {
    const merged = { ...parserData }
    
    // LLM data takes precedence for missing fields
    Object.entries(llmData).forEach(([key, value]) => {
      if (!merged[key] || (typeof merged[key] === 'string' && merged[key].length < 10)) {
        merged[key] = value
      }
    })
    
    // Add provenance information
    merged._extraction_sources = {
      parser: Object.keys(parserData),
      llm: Object.keys(llmData),
      hybrid: Object.keys(merged)
    }
    
    return merged
  }

  private async expandUrls(targetUrls: string[]): Promise<string[]> {
    const allUrls: string[] = []
    
    for (const url of targetUrls) {
      allUrls.push(url)
      
      // Handle pagination if enabled
      if (this.settings.followPagination) {
        try {
          const paginationUrls = await this.parser.handlePagination(
            url, 
            this.settings.maxPages || 10
          )
          allUrls.push(...paginationUrls.slice(1)) // Skip the original URL
        } catch (error) {
          console.warn(`Pagination failed for ${url}:`, error)
        }
      }
    }
    
    // Remove duplicates and limit total pages
    const uniqueUrls = [...new Set(allUrls)]
    return uniqueUrls.slice(0, this.settings.maxPages || 50)
  }

  private async saveExtractionResult(job: ScrapingJob, url: string, result: ScrapedData): Promise<void> {
    const extractionResult: Omit<ExtractionResult, 'id' | 'createdAt'> = {
      jobId: job.id,
      userId: job.userId,
      pageUrl: url,
      extractionSource: result.metadata.extractionSource,
      extractedData: result.content,
      htmlContext: result.metadata.htmlContext,
      explanation: result.metadata.explanation,
      processingTimeMs: result.metadata.processingTime
    }

    await blink.db.extractionResults.create({
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...extractionResult,
      extractedData: JSON.stringify(result.content),
      createdAt: new Date().toISOString()
    })
  }

  private async updateJobStatus(
    jobId: string, 
    status: string, 
    completedAt?: string
  ): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date().toISOString() 
    }
    
    if (completedAt) {
      updateData.completedAt = completedAt
    }
    
    await blink.db.scrapingJobs.update(jobId, updateData)
  }

  private async updateJobProgress(
    jobId: string,
    totalPages: number,
    processedPages: number,
    successPages: number,
    failedPages: number
  ): Promise<void> {
    await blink.db.scrapingJobs.update(jobId, {
      totalPages,
      processedPages,
      successPages,
      failedPages,
      updatedAt: new Date().toISOString()
    })
  }

  private async logPageError(
    jobId: string,
    userId: string,
    url: string,
    error: any
  ): Promise<void> {
    await blink.db.pageLogs.create({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      userId,
      pageUrl: url,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
      processingTimeMs: 0,
      createdAt: new Date().toISOString()
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public method to create and start a scraping job
  async createAndStartJob(
    userId: string,
    name: string,
    targetUrls: string[],
    extractionInstructions?: string,
    settings?: ScrapingSettings
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const job: Omit<ScrapingJob, 'createdAt' | 'updatedAt'> = {
      id: jobId,
      userId,
      name,
      targetUrls,
      extractionInstructions,
      status: 'pending',
      totalPages: 0,
      processedPages: 0,
      successPages: 0,
      failedPages: 0,
      settings: { ...this.settings, ...settings }
    }

    // Save job to database
    await blink.db.scrapingJobs.create({
      ...job,
      targetUrls: JSON.stringify(targetUrls),
      settings: JSON.stringify(job.settings),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Start processing asynchronously
    this.processJob(job as ScrapingJob).catch(error => {
      console.error(`Job ${jobId} failed:`, error)
    })

    return jobId
  }
}