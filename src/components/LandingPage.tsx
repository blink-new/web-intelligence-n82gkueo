import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { blink } from '../blink/client'
import { 
  ArrowRight, 
  BarChart3, 
  Bot, 
  Building2, 
  Car, 
  CheckCircle, 
  Globe, 
  Heart, 
  Play, 
  Shield, 
  ShoppingCart, 
  Star, 
  Target, 
  Users, 
  Zap 
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface LandingPageProps {
  user: any
}

export default function LandingPage({ user }: LandingPageProps) {
  const [stats, setStats] = useState({
    websites: 0,
    dataPoints: 0,
    customers: 0,
    uptime: 0
  })

  // Animate counters
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        websites: 2500000,
        dataPoints: 15000000000,
        customers: 50000,
        uptime: 99.9
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const industries = [
    {
      icon: ShoppingCart,
      title: "E-commerce",
      description: "Automated price tracking and competitor monitoring; product review aggregation.",
      features: ["Price Monitoring", "Competitor Analysis", "Review Aggregation", "Inventory Tracking"]
    },
    {
      icon: Building2,
      title: "Real Estate",
      description: "Aggregating listings with metadata, price histories, and local trends across property sites.",
      features: ["Listing Aggregation", "Price Histories", "Market Trends", "Property Analytics"]
    },
    {
      icon: Car,
      title: "Travel",
      description: "Scraping flight, hotel, and rental deals; dynamic pricing analytics.",
      features: ["Flight Deals", "Hotel Prices", "Rental Analytics", "Dynamic Pricing"]
    },
    {
      icon: Heart,
      title: "Healthcare",
      description: "Drug price scraping, clinical trial updates, hospital and provider directories.",
      features: ["Drug Pricing", "Clinical Trials", "Provider Data", "Medical Research"]
    }
  ]

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Extraction",
      description: "Advanced AI algorithms automatically adapt to website changes and extract data with 99.9% accuracy."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption, proxy rotation, and CAPTCHA solving ensure reliable, secure data extraction."
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Process millions of data points in real-time with our distributed cloud infrastructure."
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Transform raw data into actionable insights with our advanced visualization dashboard."
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Scrape from any website worldwide with our global proxy network and multi-region deployment."
    },
    {
      icon: Target,
      title: "Custom Solutions",
      description: "Tailored scraping solutions for your specific industry needs with white-glove support."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Data Director at TechCorp",
      content: "Web Intelligence transformed our competitive analysis. We now track 10,000+ products across 50 competitors in real-time.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Real Estate Analyst",
      content: "The real estate data aggregation is incredible. We've identified market trends 3 months ahead of our competitors.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Travel Industry Consultant",
      content: "Their travel pricing analytics helped us optimize our booking platform and increase revenue by 40%.",
      rating: 5
    }
  ]

  const companies = [
    "Microsoft", "Amazon", "Google", "Meta", "Netflix", "Spotify", "Uber", "Airbnb"
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Web Intelligence</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#industries" className="text-gray-600 hover:text-gray-900 transition-colors">Industries</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                    Sign In
                  </Button>
                  <Button onClick={() => window.location.href = '/signup'}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                🚀 Trusted by 50,000+ companies worldwide
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                The Ultimate
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Web Scraping </span>
                Platform
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Extract, analyze, and visualize data from any website with AI-powered precision. 
                Industry-specific solutions for E-commerce, Real Estate, Travel, and Healthcare.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg"
                  onClick={() => blink.auth.login()}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-indigo-600">
                    {stats.websites.toLocaleString()}+
                  </div>
                  <div className="text-gray-600">Websites Scraped</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-indigo-600">
                    {(stats.dataPoints / 1000000000).toFixed(1)}B+
                  </div>
                  <div className="text-gray-600">Data Points</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-indigo-600">
                    {stats.customers.toLocaleString()}+
                  </div>
                  <div className="text-gray-600">Happy Customers</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-indigo-600">
                    {stats.uptime}%
                  </div>
                  <div className="text-gray-600">Uptime SLA</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 mb-8">Trusted by industry leaders</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center opacity-60">
            {companies.map((company, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-semibold text-gray-400">{company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section id="industries" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Industry-Specific Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored web scraping solutions designed for your industry's unique data needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-0 shadow-md">
                  <CardHeader>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                      <industry.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xl">{industry.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {industry.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {industry.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade web scraping with AI-powered intelligence and unmatched reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers who trust Web Intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-xl"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Data Strategy?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join 50,000+ companies using Web Intelligence to extract actionable insights from the web
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={() => blink.auth.login()}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 text-lg">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Web Intelligence</span>
              </div>
              <p className="text-gray-400 mb-4">
                The ultimate web scraping platform for every industry need.
              </p>
              <div className="flex space-x-4">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">50,000+ customers</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Industries</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">E-commerce</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Real Estate</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Travel</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Healthcare</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Web Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}