export type Department = 'eng' | 'fin' | 'mkt'

export interface DepartmentProfile {
  id: Department
  label: string
  extractionFocus: string
  outputTargets: string[]
  ragNamespace: string
}

export const DEPARTMENT_PROFILES: Record<Department, DepartmentProfile> = {
  eng: {
    id: 'eng',
    label: 'Engineering',
    extractionFocus: `Focus on: technical decisions, architecture choices, API design, database decisions,
      framework selections, performance risks, security concerns, deadlines, assigned engineers,
      and any technical contradictions with previous decisions.`,
    outputTargets: ['jira', 'slack', 'github'],
    ragNamespace: 'engineering',
  },
  fin: {
    id: 'fin',
    label: 'Finance',
    extractionFocus: `Focus on: budget decisions, cost approvals, vendor selections, financial risks,
      compliance requirements, audit items, expense approvals, and contradictions with previous budget decisions.`,
    outputTargets: ['airtable', 'excel', 'slack'],
    ragNamespace: 'finance',
  },
  mkt: {
    id: 'mkt',
    label: 'Marketing',
    extractionFocus: `Focus on: campaign decisions, channel strategy, budget allocations, target audience,
      launch dates, creative approvals, KPI targets, and contradictions with previous campaign decisions.`,
    outputTargets: ['hubspot', 'slack', 'airtable'],
    ragNamespace: 'marketing',
  },
}

export function getProfile(dept: string): DepartmentProfile {
  return DEPARTMENT_PROFILES[dept as Department] ?? DEPARTMENT_PROFILES.eng
}
