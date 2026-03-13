'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Bell, Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopNavBarProps {
  onStartMeeting?: () => void
}

export function TopNavBar({ onStartMeeting }: TopNavBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline">Meridian</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings, tickets..."
              className="pl-10 bg-secondary text-foreground placeholder-muted-foreground border-0"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-amber rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem className="cursor-default py-3">
                <div className="space-y-3 w-full">
                  <div className="text-sm font-medium">Pre-meeting briefing ready for Q2 Planning</div>
                  <div className="text-xs text-muted-foreground">5 minutes ago</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-default py-3">
                <div className="space-y-3 w-full">
                  <div className="text-sm font-medium">Contradiction detected in design decisions</div>
                  <div className="text-xs text-muted-foreground">1 hour ago</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-default py-3">
                <div className="space-y-3 w-full">
                  <div className="text-sm font-medium">3 action items due today</div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Start Meeting */}
          <Button
            onClick={onStartMeeting}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Start Meeting</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
