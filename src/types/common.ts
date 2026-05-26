/** Generic option item for selects/dropdowns */
export interface SelectOption<T = string> {
  label: string
  value: T
}

/** Common status values used across entities */
export type Status = 'active' | 'inactive' | 'pending' | 'banned'

/** Sort direction */
export type SortOrder = 'asc' | 'desc'
