import { blink } from '../../blink/client'

export interface LLMExtractionResult {
  success: boolean
  data: Record<string, any>
  confidence: number
  explanation: string
  processingTime: number
  errors?: string[]
}

export class LLMExtractor {
  async extractFromContent(
    content: string,
    instructions: string,
    url: string
  ): Promise<LLMExtractionResult> {
    const startTime = Date.now()
    
    try {
      // Create a structured prompt for data extraction
      const extractionPrompt = this.buildExtractionPrompt(content, instructions, url)
      
      // Use Blink AI to extract structured data
      const { object } = await blink.ai.generateObject({
        prompt: extractionPrompt,
        schema: {
          type: 'object',
          properties: {
            extractedData: {
              type: 'object',
              description: 'The extracted data as key-value pairs'
            },
            confidence: {
              type: 'number',
              description: 'Confidence score from 0 to 1'
            },
            explanation: {
              type: 'string',
              description: 'Brief explanation of the extraction process'
            },
            dataQuality: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Assessment of data quality'
            },
            missingFields: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of fields that could not be extracted'
            }
          },
          required: ['extractedData', 'confidence', 'explanation']
        }
      })

      return {
        success: true,
        data: object.extractedData || {},
        confidence: object.confidence || 0,
        explanation: object.explanation || 'Data extracted using LLM analysis',
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        data: {},
        confidence: 0,
        explanation: 'LLM extraction failed',
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown LLM error']
      }
    }
  }

  async analyzeAndCleanContent(content: string, url: string): Promise<string> {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `
        Analyze this web page content and extract only the main, relevant information while removing noise like ads, navigation, footers, and boilerplate content.

        URL: ${url}
        
        Content:
        ${content.substring(0, 8000)} ${content.length > 8000 ? '...' : ''}

        Return only the cleaned, main content that would be useful for data extraction. Focus on:
        - Product information (if e-commerce)
        - Property details (if real estate)
        - Travel information (if travel site)
        - Healthcare data (if medical site)
        - Main article content (if news/blog)
        
        Remove:
        - Navigation menus
        - Advertisements
        - Footer content
        - Cookie notices
        - Social media widgets
        - Related articles/products (unless specifically relevant)
        `,
        maxTokens: 2000
      })

      return text
    } catch (error) {
      console.warn('Content cleaning failed, using original:', error)
      return content
    }
  }

  async interpretInstructions(instructions: string, content: string): Promise<string> {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `
        Given these extraction instructions: "${instructions}"
        
        And this web content preview: "${content.substring(0, 1000)}..."
        
        Generate specific, actionable extraction rules that would help extract the requested data. 
        Focus on what specific information to look for and how to identify it in the content.
        
        Return a clear, structured approach for extracting the requested data.
        `,
        maxTokens: 500
      })

      return text
    } catch (error) {
      console.warn('Instruction interpretation failed:', error)
      return instructions
    }
  }

  private buildExtractionPrompt(content: string, instructions: string, url: string): string {
    return `
    You are an expert web data extractor. Extract structured data from the following web page content.

    URL: ${url}
    
    Extraction Instructions: ${instructions}
    
    Web Page Content:
    ${content.substring(0, 6000)}${content.length > 6000 ? '\n...(content truncated)' : ''}

    Extract the requested data and return it as a structured object. Follow these guidelines:

    1. Extract only factual information present in the content
    2. Use consistent field names (camelCase)
    3. Convert prices to numbers when possible
    4. Extract dates in ISO format when possible
    5. For lists/arrays, extract all relevant items
    6. Ignore navigation, ads, and boilerplate content
    7. If a field is not found, omit it rather than guessing

    Provide a confidence score based on:
    - How clearly the data was present in the content
    - How well it matches the extraction instructions
    - The completeness of the extracted data

    Include a brief explanation of what was extracted and any challenges encountered.
    `
  }

  async extractWithFallback(
    content: string,
    primaryInstructions: string,
    url: string
  ): Promise<LLMExtractionResult> {
    // Try primary extraction
    let result = await this.extractFromContent(content, primaryInstructions, url)
    
    // If confidence is low, try with cleaned content
    if (result.confidence < 0.5) {
      const cleanedContent = await this.analyzeAndCleanContent(content, url)
      const fallbackResult = await this.extractFromContent(cleanedContent, primaryInstructions, url)
      
      // Use the better result
      if (fallbackResult.confidence > result.confidence) {
        result = fallbackResult
        result.explanation += ' (Used cleaned content for better extraction)'
      }
    }
    
    return result
  }

  async generateExtractionSummary(
    results: Record<string, any>,
    instructions: string,
    url: string
  ): Promise<string> {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `
        Generate a brief summary of this data extraction:
        
        URL: ${url}
        Instructions: ${instructions}
        Extracted Data: ${JSON.stringify(results, null, 2)}
        
        Provide a 1-2 sentence summary of what was successfully extracted and any notable findings.
        `,
        maxTokens: 200
      })

      return text
    } catch (error) {
      return `Extracted ${Object.keys(results).length} fields from ${url}`
    }
  }
}