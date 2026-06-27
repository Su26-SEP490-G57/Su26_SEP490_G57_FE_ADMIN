export interface Nurse {
  id: number
  username: string
  fullName: string
  phoneNumber: string | null
  dob: string | null
  cityProvince: string | null
  ward: string | null
  detailedAddress: string | null
  roles: string[] // e.g. ['Nurse'] or ['Head_Nurse']
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedNurses {
  data: Nurse[]
  total: number
  page: number
  limit: number
}

export interface QueryNurseParams {
  page?: number
  limit?: number
  userId?: number
  search?: string
}

export interface CreateNurseInput {
  username: string
  password?: string
  fullName: string
  phoneNumber?: string
  dob?: string
  cityProvince?: string
  ward?: string
  detailedAddress?: string
  role: 'Nurse' | 'Head_Nurse'
}

export interface UpdateNurseInput {
  fullName?: string
  phoneNumber?: string
  password?: string
  dob?: string
  cityProvince?: string
  ward?: string
  detailedAddress?: string
  role?: 'Nurse' | 'Head_Nurse'
  isActive?: boolean
}
