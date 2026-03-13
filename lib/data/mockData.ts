import {
  Department,
  Meeting,
  ActionItem,
  Decision,
  Risk,
  Participant,
  Company,
  Output,
} from '@/lib/types'

// Mock Participants
export const participants: Record<string, Participant> = {
  sarah: {
    id: 'p1',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    role: 'Product Lead',
  },
  mike: {
    id: 'p2',
    name: 'Mike Rodriguez',
    email: 'mike@company.com',
    role: 'Engineering Lead',
  },
  alice: {
    id: 'p3',
    name: 'Alice Thompson',
    email: 'alice@company.com',
    role: 'Designer',
  },
  james: {
    id: 'p4',
    name: 'James Park',
    email: 'james@company.com',
    role: 'Data Analyst',
  },
  emma: {
    id: 'p5',
    name: 'Emma Wilson',
    email: 'emma@company.com',
    role: 'Operations',
  },
}

// Mock Departments
export const departments: Record<string, Department> = {
  product: {
    id: 'dept-1',
    name: 'Product',
    description: 'Product strategy and development',
    isRecording: true,
    openActionItems: 12,
    lastMeetingDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    meetingCount: 24,
    participants: [participants.sarah, participants.mike, participants.alice],
    color: '#0ea5e9',
  },
  engineering: {
    id: 'dept-2',
    name: 'Engineering',
    description: 'Core infrastructure team',
    isRecording: false,
    openActionItems: 8,
    lastMeetingDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    meetingCount: 18,
    participants: [participants.mike, participants.james],
    color: '#8b5cf6',
  },
  design: {
    id: 'dept-3',
    name: 'Design',
    description: 'UX/UI and brand',
    isRecording: false,
    openActionItems: 5,
    lastMeetingDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    meetingCount: 14,
    participants: [participants.alice, participants.sarah],
    color: '#ec4899',
  },
  data: {
    id: 'dept-4',
    name: 'Data & Analytics',
    description: 'Analytics and insights',
    isRecording: false,
    openActionItems: 3,
    lastMeetingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    meetingCount: 12,
    participants: [participants.james, participants.emma],
    color: '#f59e0b',
  },
}

// Mock Decisions
const mockDecisions: Record<string, Decision> = {
  dec1: {
    id: 'dec-1',
    title: 'Adopt new authentication framework',
    description: 'Move from Firebase to custom OAuth2 implementation',
    owner: participants.mike,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    impact: 'high',
    sourceTranscriptId: 'seg-1',
  },
  dec2: {
    id: 'dec-2',
    title: 'Design system v2 rollout',
    description: 'Implement new component library across all products',
    owner: participants.alice,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    impact: 'high',
    sourceTranscriptId: 'seg-2',
  },
  dec3: {
    id: 'dec-3',
    title: 'Q2 roadmap priorities',
    description: 'Focus on performance optimization and mobile experience',
    owner: participants.sarah,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    impact: 'medium',
    sourceTranscriptId: 'seg-3',
  },
}

// Mock Risks
const mockRisks: Record<string, Risk> = {
  risk1: {
    id: 'risk-1',
    title: 'OAuth2 migration timeline risk',
    description: 'Current timeline of 3 weeks may be too aggressive',
    severity: 'high',
    owner: participants.mike,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-4',
    mitigation: 'Add buffer week and plan for rollback strategy',
  },
  risk2: {
    id: 'risk-2',
    title: 'Design system adoption lag',
    description: 'Teams may struggle with new component library',
    severity: 'medium',
    owner: participants.alice,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-5',
    mitigation: 'Plan comprehensive training sessions',
  },
}

// Mock Action Items
export const mockActionItems: Record<string, ActionItem> = {
  ai1: {
    id: 'ai-1',
    title: 'Create OAuth2 migration plan',
    description: 'Detailed timeline and rollback strategy',
    owner: participants.mike,
    status: 'In Progress',
    priority: 'P1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-1',
    linkedJiraKey: 'AUTH-123',
    jiraStatus: 'In Progress',
    comments: [],
  },
  ai2: {
    id: 'ai-2',
    title: 'Finalize design system components',
    description: 'Complete remaining button variants and form elements',
    owner: participants.alice,
    status: 'In Review',
    priority: 'P1',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-2',
    linkedJiraKey: 'DESIGN-456',
    jiraStatus: 'In Review',
    comments: [],
  },
  ai3: {
    id: 'ai-3',
    title: 'Set up performance monitoring',
    description: 'Implement analytics for load times and Core Web Vitals',
    owner: participants.james,
    status: 'Backlog',
    priority: 'P2',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-6',
    comments: [],
  },
  ai4: {
    id: 'ai-4',
    title: 'Schedule training sessions',
    description: 'Onboard teams to new design system',
    owner: participants.alice,
    status: 'Done',
    priority: 'P2',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-5',
    comments: [],
  },
  ai5: {
    id: 'ai-5',
    title: 'Prepare migration communication',
    description: 'Draft announcement for OAuth2 migration to users',
    owner: participants.emma,
    status: 'In Progress',
    priority: 'P2',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sourceTranscriptId: 'seg-1',
    comments: [],
  },
}

// Mock Transcript
const mockTranscript = [
  {
    id: 'seg-1',
    speaker: participants.sarah,
    text: 'So we need to decide on the authentication framework. Mike, can you walk us through the OAuth2 approach?',
    timestamp: 0,
    highlights: ['dec-1'],
  },
  {
    id: 'seg-2',
    speaker: participants.mike,
    text: 'Sure. We analyzed Firebase vs custom OAuth2. Custom OAuth2 gives us more control and better integration with our existing systems. Timeline would be 3 weeks.',
    timestamp: 15,
    highlights: ['dec-1', 'risk-1'],
  },
  {
    id: 'seg-3',
    speaker: participants.alice,
    text: 'That timeline seems aggressive. We should build in some buffer time given the complexity.',
    timestamp: 45,
    highlights: ['risk-1'],
  },
  {
    id: 'seg-4',
    speaker: participants.sarah,
    text: 'Agreed. Alice, on the design system front - do we have consensus on the v2 components?',
    timestamp: 65,
    highlights: ['dec-2'],
  },
  {
    id: 'seg-5',
    speaker: participants.alice,
    text: 'Most components are finalized. We need another week on the form elements. We should also do training sessions across teams.',
    timestamp: 85,
    highlights: ['dec-2', 'risk-2'],
  },
  {
    id: 'seg-6',
    speaker: participants.james,
    text: 'For Q2, we should prioritize performance optimization. Our Core Web Vitals have regressed slightly.',
    timestamp: 120,
    highlights: ['dec-3'],
  },
]

// Mock Outputs
const mockOutputs: Output[] = [
  {
    id: 'out-1',
    type: 'jira',
    status: 'synced',
    syncedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    description: '3 action items synced to Jira',
    linkedItems: ['ai-1', 'ai-2', 'ai-3'],
    link: 'https://jira.example.com/projects/MERIDIAN',
  },
  {
    id: 'out-2',
    type: 'slack',
    status: 'pending',
    description: 'Preparing meeting summary for #product channel',
    linkedItems: [],
  },
  {
    id: 'out-3',
    type: 'calendar',
    status: 'synced',
    syncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'Follow-up meeting scheduled for Friday',
    linkedItems: [],
    link: 'https://calendar.google.com/event?id=abc123',
  },
]

// Mock Meeting
const createMeeting = (id: string, deptId: string, title: string, offset: number): Meeting => ({
  id,
  title,
  date: new Date(Date.now() - offset).toISOString(),
  duration: 45 + Math.random() * 30,
  departmentId: deptId,
  status: 'Completed',
  participants: [participants.sarah, participants.mike, participants.alice, participants.james],
  decisions: Object.values(mockDecisions),
  actionItems: Object.values(mockActionItems),
  risks: Object.values(mockRisks),
  transcript: mockTranscript,
  outputs: mockOutputs,
  notes: 'Discussed Q2 roadmap, authentication strategy, and design system rollout.',
})

export const meetings: Record<string, Meeting> = {
  'meeting-1': createMeeting('meeting-1', 'dept-1', 'Q2 Planning & Product Roadmap', 2 * 60 * 60 * 1000),
  'meeting-2': createMeeting('meeting-2', 'dept-1', 'Design System Sync', 5 * 60 * 60 * 1000),
  'meeting-3': createMeeting('meeting-3', 'dept-2', 'Backend Architecture Review', 1 * 24 * 60 * 60 * 1000),
  'meeting-4': createMeeting('meeting-4', 'dept-3', 'UI Component Refinement', 2 * 24 * 60 * 60 * 1000),
  'meeting-5': createMeeting('meeting-5', 'dept-1', 'Sprint Kickoff', 3 * 24 * 60 * 60 * 1000),
}

// Enrich departments with meetings and members
const enrichedDepartments = Object.values(departments).map(dept => ({
  ...dept,
  meetings: Object.values(meetings).filter(m => m.departmentId === dept.id),
  members: dept.participants.map(p => p.name),
}))

// Update company with enriched departments
export const company: Company = {
  id: 'company-1',
  name: 'Meridian Inc',
  departments: enrichedDepartments,
  totalMeetings: 68,
  totalActionItems: 34,
  lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
}

// Helper function to get all meetings for a department
export const getMeetingsByDepartment = (deptId: string): Meeting[] => {
  return Object.values(meetings).filter(m => m.departmentId === deptId)
}

// Helper function to get action item stats for a department
export const getActionItemStats = (deptId: string) => {
  const deptMeetings = getMeetingsByDepartment(deptId)
  const allItems = deptMeetings.flatMap(m => m.actionItems)

  return {
    total: allItems.length,
    backlog: allItems.filter(ai => ai.status === 'Backlog').length,
    inProgress: allItems.filter(ai => ai.status === 'In Progress').length,
    inReview: allItems.filter(ai => ai.status === 'In Review').length,
    done: allItems.filter(ai => ai.status === 'Done').length,
  }
}
