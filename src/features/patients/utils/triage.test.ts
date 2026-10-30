import { describe, expect, it } from 'vitest'
import type { PatientListItem } from '../types'
import { isGreenPatientReadyToHide, levelKey } from './triage'

function makePatient(overrides: Partial<PatientListItem> = {}): PatientListItem {
  return {
    caseId: 'CASE-001',
    fullName: 'Test Patient',
    nameInitials: null,
    age: 40,
    gender: 'Nam',
    height: 170,
    weight: 60,
    bmi: 20.8,
    diagnosis: '',
    comorbidities: null,
    operationTypeId: 1,
    operationType: null,
    method: '',
    surgeryDate: '2026-01-01',
    currentPod: 1,
    currentDietLevel: 0,
    roomBed: 'P501/1',
    hasGiAnastomosis: null,
    isLocked: false,
    holdReason: null,
    levelId: null,
    level: null,
    lastAssessmentTime: null,
    erasCompleted: false,
    erasCompletedDate: null,
    account: { id: 1, username: 'patient01', fullName: 'Test Patient' },
    ...overrides,
  }
}

// Regression coverage for Critical finding #8 (2026-09-28 recommendations
// doc): levelKey() used to match `level.name` by fragile substring, which
// silently dropped patients with a null/unrecognized levelId from the board
// while the room's total count still included them.
describe('levelKey', () => {
  it('maps the backend RED/YELLOW/GREEN levelId (1/2/3) to the matching risk', () => {
    expect(levelKey(makePatient({ levelId: 1 }))).toBe('red')
    expect(levelKey(makePatient({ levelId: 2 }))).toBe('yellow')
    expect(levelKey(makePatient({ levelId: 3 }))).toBe('green')
  })

  it('returns null (not a silent misclassification) for an unrecognized levelId', () => {
    expect(levelKey(makePatient({ levelId: 99 }))).toBeNull()
  })

  it('returns null for a not-yet-assessed patient (levelId: null, level: null) instead of throwing', () => {
    expect(levelKey(makePatient({ levelId: null, level: null }))).toBeNull()
  })

  it('falls back to the display-name string only when levelId is missing entirely', () => {
    const patient = makePatient({
      levelId: null,
      level: { id: 1, name: 'Đỏ - cấp cứu', color: '#f00' },
    })
    expect(levelKey(patient)).toBe('red')
  })

  it('prefers levelId over a mismatched display name (levelId is the source of truth)', () => {
    const patient = makePatient({
      levelId: 3, // GREEN
      level: { id: 1, name: 'Đỏ - cấp cứu', color: '#f00' }, // stale/wrong name
    })
    expect(levelKey(patient)).toBe('green')
  })
})

describe('isGreenPatientReadyToHide', () => {
  const recentIso = new Date().toISOString()
  const oldIso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

  it('hides a stable Green, unlocked, fully-progressed patient with no assessment in 24h', () => {
    const patient = makePatient({
      levelId: 3,
      isLocked: false,
      currentDietLevel: 4,
      lastAssessmentTime: oldIso,
    })
    expect(isGreenPatientReadyToHide(patient)).toBe(true)
  })

  it('keeps a Green patient visible if assessed within the last 24h', () => {
    const patient = makePatient({
      levelId: 3,
      isLocked: false,
      currentDietLevel: 4,
      lastAssessmentTime: recentIso,
    })
    expect(isGreenPatientReadyToHide(patient)).toBe(false)
  })

  it('never hides a locked patient even if otherwise eligible', () => {
    const patient = makePatient({
      levelId: 3,
      isLocked: true,
      currentDietLevel: 4,
      lastAssessmentTime: oldIso,
    })
    expect(isGreenPatientReadyToHide(patient)).toBe(false)
  })

  it('never hides a non-Green patient', () => {
    const patient = makePatient({
      levelId: 1,
      isLocked: false,
      currentDietLevel: 4,
      lastAssessmentTime: oldIso,
    })
    expect(isGreenPatientReadyToHide(patient)).toBe(false)
  })

  it('never hides an unassessed patient (no lastAssessmentTime)', () => {
    const patient = makePatient({
      levelId: null,
      level: null,
      isLocked: false,
      currentDietLevel: 4,
      lastAssessmentTime: null,
    })
    expect(isGreenPatientReadyToHide(patient)).toBe(false)
  })
})
