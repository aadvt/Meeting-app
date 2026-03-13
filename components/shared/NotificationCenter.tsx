'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  title: string
  description: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationCenterProps {
  notifications?: Notification[]
}

export function NotificationCenter({ notifications: initialNotifications }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || [
      {
        id: '1',
        type: 'success',
        title: 'Pre-meeting briefing ready',
        description: 'Q2 Planning briefing is prepared with context from 3 previous meetings',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionUrl: '/meeting/meeting-1',
      },
      {
        id: '2',
        type: 'warning',
        title: 'Contradiction detected',
        description: 'Decision conflicts found in design system rollout discussion',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/meeting/meeting-1?tab=knowledge',
      },
      {
        id: '3',
        type: 'info',
        title: '3 action items due today',
        description: 'Review status of Design System Components, OAuth2 Migration Plan, and others',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
      },
    ]
  )

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-status-green" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-status-amber" />
      case 'info':
        return <Clock className="w-5 h-5 text-accent" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-status-amber rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {Math.min(unreadCount, 9)}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-96 z-50"
            >
              <Card className="bg-card border-border shadow-lg">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <motion.button
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          setNotifications(notifications.map(n =>
                            n.id === notification.id ? { ...n, read: true } : n
                          ))
                          if (notification.actionUrl) {
                            // Handle navigation
                          }
                        }}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                          !notification.read ? 'bg-accent/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-foreground text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-border text-center">
                    <button className="text-xs text-accent hover:text-accent/80 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
