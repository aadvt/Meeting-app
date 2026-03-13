// Core types for Meridian application

export type Status = 'Backlog' | 'In Progress' | 'In Review' | 'Done'
export type Priority = 'P1' | 'P2' | 'P3'
export type MeetingStatus = 'Recording' | 'Completed' | 'Scheduled'
export type ConflictType = 'contradiction' | 'duplicate' | 'inconsistency'

export interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

export interface TranscriptSegment {
  id: string
  speaker: Participant
  text: string
  timestamp: number // in seconds
  highlights?: string[] // highlighted decision/action/risk IDs
}

export interface Decision {
  id: string
  title: string
  description: string
  owner: Participant
  date: string
  impact: 'high' | 'medium' | 'low'
  sourceTranscriptId: string
}

export interface ActionItem {
  id: string
  title: string
  description: string
  owner: Participant
  status: Status
  priority: Priority
  dueDate: string
  createdDate: string
  sourceTranscriptId: string
  linkedJiraKey?: string
  jiraStatus?: string
  comments: Comment[]
}

export interface Risk {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  owner: Participant
  date: string
  sourceTranscriptId: string
  mitigation?: string
}

export interface Comment {
  id: string
  author: Participant
  text: string
  timestamp: string
  attachments?: string[]
}

export interface KnowledgeGraphNode {
  id: string
  type: 'decision' | 'action' | 'risk' | 'participant'
  label: string
  data: Decision | ActionItem | Risk | Participant
}

export interface KnowledgeGraphEdge {
  id: string
  source: string
  target: string
  relationship: string
}

export interface Output {
  id: string
  type: 'jira' | 'gmail' | 'slack' | 'calendar'
  status: 'pending' | 'synced' | 'failed'
  syncedAt?: string
  description: string
  linkedItems?: string[] // IDs of action items
  link?: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  duration: number // in minutes
  departmentId: string
  status: MeetingStatus
  participants: Participant[]
  decisions: Decision[]
  actionItems: ActionItem[]
  risks: Risk[]
  transcript: TranscriptSegment[]
  outputs: Output[]
  recording?: {
    url: string
    startTime: string
  }
  notes?: string
  conflicts?: Conflict[]
}

export interface Conflict {
  id: string
  type: ConflictType
  item1Id: string
  item2Id: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

export interface Department {
  id: string
  name: string
  description?: string
  icon?: string
  isRecording: boolean
  openActionItems: number
  lastMeetingDate?: string
  meetingCount: number
  participants: Participant[]
  color?: string
  meetings?: Meeting[]
  members?: string[]
  timeline?: TimelineEvent[]
}

export interface Company {
  id: string
  name: string
  departments: Department[]
  totalMeetings: number
  totalActionItems: number
  lastActivityDate: string
}

export interface Highlight {
  id: string
  type: 'decision' | 'action' | 'risk'
  startTime: number
  endTime: number
  text: string
  entityId: string
}

export type EventType = 'meeting_started' | 'decision_made' | 'action_created' | 'risk_flagged' | 'meeting_ended' | 'participant_joined' | 'participant_left'

export interface TimelineEvent {
  id: string
  type: EventType
  title: string
  description: string
  timestamp: string
  metadata?: {
    meetingId?: string
    actionItemId?: string
    decisionId?: string
    riskId?: string
    participantId?: string
  }
  severity?: 'high' | 'medium' | 'low'
}


