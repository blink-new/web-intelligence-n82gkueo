import { useState, useEffect } from 'react'
import { Calendar, Clock, Repeat, Play, Pause, Trash2, Settings } from 'lucide-react'
import { blink } from '../blink/client'

interface ScheduledJob {
  id: string
  userId: string
  name: string
  urls: string[]
  instructions: string
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly'
    time: string // HH:MM format
    dayOfWeek?: number // 0-6 for weekly
    dayOfMonth?: number // 1-31 for monthly
    timezone: string
  }
  isActive: boolean
  nextRun: string
  lastRun?: string
  createdAt: string
  settings: {
    enableJavaScript: boolean
    delay: number
    maxPages: number
    retryAttempts: number
  }
}

export default function ScrapingScheduler() {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    urls: '',
    instructions: '',
    scheduleType: 'daily' as 'once' | 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enableJavaScript: false,
    delay: 1000,
    maxPages: 10,
    retryAttempts: 3
  })

  const loadScheduledJobs = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // In a real implementation, this would be a separate table
      // For demo purposes, we'll create some sample scheduled jobs
      const sampleJobs: ScheduledJob[] = [
        {
          id: 'schedule_1',
          userId: user.id,
          name: 'Daily Amazon Price Check',
          urls: ['https://amazon.com/dp/B08N5WRWNW', 'https://amazon.com/dp/B09JQMJHXY'],
          instructions: 'Extract product prices, availability, and ratings',
          schedule: {
            type: 'daily',
            time: '09:00',
            timezone: 'America/New_York'
          },
          isActive: true,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          settings: {
            enableJavaScript: true,
            delay: 2000,
            maxPages: 5,
            retryAttempts: 3
          }
        },
        {
          id: 'schedule_2',
          userId: user.id,
          name: 'Weekly Real Estate Listings',
          urls: ['https://zillow.com/san-francisco-ca/', 'https://redfin.com/city/17151/CA/San-Francisco'],
          instructions: 'Extract new property listings, prices, and details',
          schedule: {
            type: 'weekly',
            time: '10:00',
            dayOfWeek: 1, // Monday
            timezone: 'America/Los_Angeles'
          },
          isActive: true,
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastRun: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          settings: {
            enableJavaScript: true,
            delay: 3000,
            maxPages: 20,
            retryAttempts: 2
          }
        }
      ]

      setScheduledJobs(sampleJobs)
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScheduledJobs()
  }, [])

  const calculateNextRun = (schedule: ScheduledJob['schedule']): Date => {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)
    
    const nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)
    
    switch (schedule.type) {
      case 'once':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'weekly': {
        const targetDay = schedule.dayOfWeek || 1
        const currentDay = nextRun.getDay()
        let daysUntilTarget = targetDay - currentDay
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7
        }
        nextRun.setDate(nextRun.getDate() + daysUntilTarget)
        break
      }
      case 'monthly': {
        const targetDate = schedule.dayOfMonth || 1
        nextRun.setDate(targetDate)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
        break
      }
    }
    
    return nextRun
  }

  const handleCreateSchedule = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const scheduleId = `schedule_${Date.now()}`
      const nextRun = calculateNextRun({
        type: newSchedule.scheduleType,
        time: newSchedule.time,
        dayOfWeek: newSchedule.dayOfWeek,
        dayOfMonth: newSchedule.dayOfMonth,
        timezone: newSchedule.timezone
      })

      const scheduledJob: ScheduledJob = {
        id: scheduleId,
        userId: user.id,
        name: newSchedule.name,
        urls: newSchedule.urls.split('\n').filter(url => url.trim()),
        instructions: newSchedule.instructions,
        schedule: {
          type: newSchedule.scheduleType,
          time: newSchedule.time,
          dayOfWeek: newSchedule.dayOfWeek,
          dayOfMonth: newSchedule.dayOfMonth,
          timezone: newSchedule.timezone
        },
        isActive: true,
        nextRun: nextRun.toISOString(),
        createdAt: new Date().toISOString(),
        settings: {
          enableJavaScript: newSchedule.enableJavaScript,
          delay: newSchedule.delay,
          maxPages: newSchedule.maxPages,
          retryAttempts: newSchedule.retryAttempts
        }
      }

      // In a real implementation, save to database
      setScheduledJobs(prev => [scheduledJob, ...prev])
      setShowNewScheduleForm(false)
      
      // Reset form
      setNewSchedule({
        name: '',
        urls: '',
        instructions: '',
        scheduleType: 'daily',
        time: '09:00',
        dayOfWeek: 1,
        dayOfMonth: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enableJavaScript: false,
        delay: 1000,
        maxPages: 10,
        retryAttempts: 3
      })
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  const toggleSchedule = (scheduleId: string) => {
    setScheduledJobs(prev => prev.map(job => 
      job.id === scheduleId 
        ? { ...job, isActive: !job.isActive }
        : job
    ))
  }

  const deleteSchedule = (scheduleId: string) => {
    setScheduledJobs(prev => prev.filter(job => job.id !== scheduleId))
  }

  const getScheduleDescription = (schedule: ScheduledJob['schedule']) => {
    const time = schedule.time
    switch (schedule.type) {
      case 'once':
        return `Once at ${time}`
      case 'daily':
        return `Daily at ${time}`
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return `Weekly on ${days[schedule.dayOfWeek || 1]} at ${time}`
      }
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${time}`
      default:
        return 'Unknown schedule'
    }
  }

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else {
      return 'soon'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduled jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scraping Scheduler</h1>
          <p className="text-gray-600">Automate your web scraping with scheduled jobs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduledJobs.filter(job => job.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Run</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduledJobs.filter(job => job.isActive).length > 0 
                    ? formatNextRun(
                        scheduledJobs
                          .filter(job => job.isActive)
                          .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0]
                          ?.nextRun || ''
                      )
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Jobs</h2>
          <button
            onClick={() => setShowNewScheduleForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            New Schedule
          </button>
        </div>

        {/* New Schedule Form */}
        {showNewScheduleForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="E.g., Daily Price Monitoring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URLs (one per line)</label>
                <textarea
                  value={newSchedule.urls}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, urls: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={newSchedule.instructions}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="Extract product prices, availability, and ratings..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                <select
                  value={newSchedule.scheduleType}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduleType: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {newSchedule.scheduleType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                  <select
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}

              {newSchedule.scheduleType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newSchedule.dayOfMonth}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateSchedule}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Create Schedule
              </button>
              <button
                onClick={() => setShowNewScheduleForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Scheduled Jobs List */}
        <div className="space-y-4">
          {scheduledJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {job.urls.length} URLs • {getScheduleDescription(job.schedule)}
                  </p>
                  <p className="text-sm text-gray-500">{job.instructions}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSchedule(job.id)}
                    className={`p-2 rounded-lg ${
                      job.isActive 
                        ? 'text-orange-600 hover:bg-orange-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {job.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteSchedule(job.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Next Run:</span>
                  <p className="text-gray-600">
                    {job.isActive 
                      ? `${new Date(job.nextRun).toLocaleDateString()} ${new Date(job.nextRun).toLocaleTimeString()} (${formatNextRun(job.nextRun)})`
                      : 'Paused'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Run:</span>
                  <p className="text-gray-600">
                    {job.lastRun 
                      ? new Date(job.lastRun).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Settings:</span>
                  <p className="text-gray-600">
                    {job.settings.delay}ms delay, {job.settings.maxPages} max pages
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {scheduledJobs.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled jobs</h3>
            <p className="text-gray-600 mb-4">Create your first scheduled scraping job to automate data collection</p>
            <button
              onClick={() => setShowNewScheduleForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Create Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  )
}