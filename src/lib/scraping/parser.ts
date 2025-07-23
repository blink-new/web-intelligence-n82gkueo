import { ParserRule, ParsedContent, ScrapingSettings } from './types'

export class ProprietaryWebParser {
  private settings: ScrapingSettings
  private defaultRules: Record<string, ParserRule[]>

  constructor(settings: ScrapingSettings = {}) {
    this.settings = {
      delay: 1000,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      enableJavaScript: true,
      ...settings
    }

    // Predefined rules for common website patterns
    this.defaultRules = {
      ecommerce: [
        { name: 'title', selector: 'h1, .product-title, [data-testid="product-title"]', required: true },
        { name: 'price', selector: '.price, .product-price, [data-testid="price"]', required: true },
        { name: 'description', selector: '.description, .product-description, [data-testid="description"]' },
        { name: 'images', selector: 'img[src*="product"], .product-image img', attribute: 'src', multiple: true },
        { name: 'rating', selector: '.rating, .stars, [data-testid="rating"]' },
        { name: 'reviews', selector: '.review, .customer-review', multiple: true }
      ],
      realestate: [
        { name: 'address', selector: '.address, .property-address, [data-testid="address"]', required: true },
        { name: 'price', selector: '.price, .property-price, [data-testid="price"]', required: true },
        { name: 'bedrooms', selector: '.beds, .bedrooms, [data-testid="beds"]' },
        { name: 'bathrooms', selector: '.baths, .bathrooms, [data-testid="baths"]' },
        { name: 'sqft', selector: '.sqft, .square-feet, [data-testid="sqft"]' },
        { name: 'images', selector: '.property-image img, .listing-image img', attribute: 'src', multiple: true }
      ],
      travel: [
        { name: 'destination', selector: '.destination, .hotel-name, .flight-destination', required: true },
        { name: 'price', selector: '.price, .cost, [data-testid="price"]', required: true },
        { name: 'dates', selector: '.dates, .check-in, .departure-date' },
        { name: 'rating', selector: '.rating, .stars, [data-testid="rating"]' },
        { name: 'amenities', selector: '.amenities li, .features li', multiple: true }
      ],
      healthcare: [
        { name: 'drugName', selector: '.drug-name, .medication-name, h1', required: true },
        { name: 'price', selector: '.price, .cost, [data-testid="price"]' },
        { name: 'dosage', selector: '.dosage, .strength' },
        { name: 'manufacturer', selector: '.manufacturer, .brand' },
        { name: 'sideEffects', selector: '.side-effects li, .warnings li', multiple: true }
      ],
      general: [
        { name: 'title', selector: 'h1, title, .main-title' },
        { name: 'content', selector: '.content, .main-content, article, .post-content' },
        { name: 'links', selector: 'a[href]', attribute: 'href', multiple: true },
        { name: 'images', selector: 'img[src]', attribute: 'src', multiple: true }
      ]
    }
  }

  async extractFromUrl(url: string, customRules?: ParserRule[]): Promise<ParsedContent> {
    const startTime = Date.now()
    
    try {
      // Use Blink's data.scrape for reliable content extraction
      const { markdown, metadata, extract } = await this.scrapeWithBlink(url)
      
      // Determine the best rule set to use
      const rules = customRules || this.detectRuleSet(url, extract.text)
      
      // Parse the content using rules
      const parsedData = this.applyRules(extract, rules)
      
      // Calculate confidence based on required fields found
      const confidence = this.calculateConfidence(parsedData, rules)
      
      return {
        success: confidence > 0.3,
        data: {
          ...parsedData,
          metadata: {
            title: metadata.title,
            description: metadata.description,
            url: url,
            extractedAt: new Date().toISOString()
          }
        },
        confidence,
        htmlContext: this.extractHtmlContext(extract.text, parsedData),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        data: {},
        confidence: 0,
        htmlContext: '',
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        processingTime: Date.now() - startTime
      }
    }
  }

  private async scrapeWithBlink(url: string) {
    // Import blink client dynamically to avoid circular dependencies
    const { blink } = await import('../../blink/client')
    
    return await blink.data.scrape(url)
  }

  private detectRuleSet(url: string, content: string): ParserRule[] {
    const urlLower = url.toLowerCase()
    const contentLower = content.toLowerCase()

    // E-commerce detection
    if (this.containsKeywords(urlLower, ['shop', 'store', 'product', 'buy', 'cart', 'amazon', 'ebay']) ||
        this.containsKeywords(contentLower, ['add to cart', 'buy now', 'price', '$', 'product'])) {
      return this.defaultRules.ecommerce
    }

    // Real estate detection
    if (this.containsKeywords(urlLower, ['realtor', 'zillow', 'realty', 'homes', 'property']) ||
        this.containsKeywords(contentLower, ['bedrooms', 'bathrooms', 'sqft', 'listing', 'mls'])) {
      return this.defaultRules.realestate
    }

    // Travel detection
    if (this.containsKeywords(urlLower, ['booking', 'hotel', 'flight', 'travel', 'expedia', 'airbnb']) ||
        this.containsKeywords(contentLower, ['check-in', 'check-out', 'nights', 'guests', 'amenities'])) {
      return this.defaultRules.travel
    }

    // Healthcare detection
    if (this.containsKeywords(urlLower, ['drug', 'medication', 'pharmacy', 'health', 'medical']) ||
        this.containsKeywords(contentLower, ['dosage', 'side effects', 'prescription', 'mg', 'tablet'])) {
      return this.defaultRules.healthcare
    }

    return this.defaultRules.general
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private applyRules(extract: any, rules: ParserRule[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    // Since we're working with extracted text/markdown, we'll use text-based parsing
    const text = extract.text || ''
    const headings = extract.headings || []
    
    for (const rule of rules) {
      try {
        let value = this.extractByRule(rule, text, headings, extract)
        
        if (value && rule.transform) {
          value = rule.transform(value)
        }
        
        if (value !== null && value !== undefined) {
          result[rule.name] = value
        }
      } catch (error) {
        console.warn(`Failed to apply rule ${rule.name}:`, error)
      }
    }
    
    return result
  }

  private extractByRule(rule: ParserRule, text: string, headings: string[], extract: any): any {
    const { name, multiple } = rule
    
    // Use intelligent text extraction based on rule name
    switch (name) {
      case 'title':
        return headings[0] || this.extractTitle(text)
      
      case 'price':
        return this.extractPrices(text, multiple)
      
      case 'description':
        return this.extractDescription(text)
      
      case 'rating':
        return this.extractRating(text)
      
      case 'images':
        return extract.images || []
      
      case 'links':
        return extract.links || []
      
      default:
        return this.extractGenericField(text, name, multiple)
    }
  }

  private extractTitle(text: string): string | null {
    // Look for title patterns in text
    const lines = text.split('\n').filter(line => line.trim())
    return lines[0]?.trim() || null
  }

  private extractPrices(text: string, multiple?: boolean): string | string[] | null {
    const priceRegex = /\$[\d,]+\.?\d*/g
    const matches = text.match(priceRegex)
    
    if (!matches) return null
    
    return multiple ? matches : matches[0]
  }

  private extractDescription(text: string): string | null {
    // Extract meaningful description from text
    const lines = text.split('\n').filter(line => line.trim().length > 50)
    return lines[0]?.trim() || null
  }

  private extractRating(text: string): string | null {
    const ratingRegex = /(\d+\.?\d*)\s*(?:out of|\/)\s*(\d+)|(\d+\.?\d*)\s*stars?/i
    const match = text.match(ratingRegex)
    return match ? match[0] : null
  }

  private extractGenericField(text: string, fieldName: string, multiple?: boolean): any {
    // Generic field extraction using keyword matching
    const lines = text.split('\n')
    const relevantLines = lines.filter(line => 
      line.toLowerCase().includes(fieldName.toLowerCase())
    )
    
    if (relevantLines.length === 0) return null
    
    return multiple ? relevantLines : relevantLines[0]?.trim()
  }

  private calculateConfidence(data: Record<string, any>, rules: ParserRule[]): number {
    const requiredRules = rules.filter(rule => rule.required)
    const foundRequired = requiredRules.filter(rule => 
      data[rule.name] !== null && data[rule.name] !== undefined
    )
    
    const totalFields = Object.keys(data).length
    const requiredScore = requiredRules.length > 0 ? foundRequired.length / requiredRules.length : 1
    const totalScore = totalFields / rules.length
    
    return (requiredScore * 0.7) + (totalScore * 0.3)
  }

  private extractHtmlContext(text: string, data: Record<string, any>): string {
    // Extract relevant context snippets
    const contexts: string[] = []
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        const lines = text.split('\n')
        const contextLine = lines.find(line => line.includes(value))
        if (contextLine) {
          contexts.push(`${key}: ${contextLine.trim()}`)
        }
      }
    })
    
    return contexts.join('\n')
  }

  async handlePagination(url: string, maxPages: number = 10): Promise<string[]> {
    const urls: string[] = [url]
    
    try {
      const { links } = await this.scrapeWithBlink(url)
      
      // Look for pagination links
      const paginationLinks = links.filter((link: string) => 
        /page|next|more|\d+/.test(link.toLowerCase())
      ).slice(0, maxPages - 1)
      
      urls.push(...paginationLinks)
    } catch (error) {
      console.warn('Pagination detection failed:', error)
    }
    
    return urls
  }
}