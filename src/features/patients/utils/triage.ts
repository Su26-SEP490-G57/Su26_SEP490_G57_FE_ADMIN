import type { PatientListItem } from '../types'

export type RiskLevel = 'red' | 'yellow' | 'green'
export type BoardColumn = RiskLevel | 'unassessed'

// Backend's single source of truth for these ids is triageColorFromLevelId()
// in patient/constants/levels.constant.ts (RED=1, YELLOW=2, GREEN=3) — keying
// off levelId here instead of matching on the free-text `level.name` string
// means a backend label rename can't silently miscolor/hide a patient.
export const LEVEL_ID_TO_RISK: Record<number, RiskLevel> = { 1: 'red', 2: 'yellow', 3: 'green' }

export function levelKey(patient: PatientListItem): RiskLevel | null {
  if (patient.levelId != null) return LEVEL_ID_TO_RISK[patient.levelId] ?? null
  // Defensive fallback only for the (shouldn't-happen) case of a levelId the
  // map above doesn't recognize but a display name is still present.
  const normalizedName = (patient.level?.name ?? '').toLowerCase()
  if (normalizedName.includes('red') || normalizedName.includes('đỏ')) return 'red'
  if (normalizedName.includes('yellow') || normalizedName.includes('vàng')) return 'yellow'
  if (normalizedName.includes('green') || normalizedName.includes('xanh')) return 'green'
  return null
}

/** A stable, non-locked, fully-progressed Green patient with no assessment in the last 24h can be hidden from the active board. */
export function isGreenPatientReadyToHide(patient: PatientListItem): boolean {
  if (
    levelKey(patient) !== 'green' ||
    patient.isLocked ||
    patient.currentDietLevel !== 4 ||
    !patient.lastAssessmentTime
  ) {
    return false
  }

  const lastAssessmentTime = new Date(patient.lastAssessmentTime)
  if (Number.isNaN(lastAssessmentTime.getTime())) return false

  const hoursSinceLastAssessment = (Date.now() - lastAssessmentTime.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastAssessment > 24
}
