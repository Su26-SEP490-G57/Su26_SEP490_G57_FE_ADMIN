// Operation Type DTOs
export interface OperationTypeResponseDto {
  id: number
  name: string
  description: string | null
  podCount: number
}

export interface CreateOperationTypeDto {
  name: string
  description?: string
}

export interface UpdateOperationTypeDto {
  name?: string
  description?: string
}

// POD Protocol DTOs
export interface PodProtocolResponseDto {
  podId: number
  operationTypeId: number
  label: string
  dietLevel: number
  mealsPerDayMin: number | null
  mealsPerDayMax: number | null
  mealInstruction: string | null
  volumePerMealMin: number | null
  volumePerMealMax: number | null
  volumeInstruction: string | null
  recommendedFoods: string[]
  recommendedDrinks: string[]
  forbiddenFoods: string[]
  forbiddenDrinks: string[]
  upgradeCriteria: string[]
  updatedAt: Date | null
  createdAt: Date
}

export interface CreatePodProtocolDto {
  label: string
  dietLevel?: number
  mealsPerDayMin?: number
  mealsPerDayMax?: number
  mealInstruction?: string
  volumePerMealMin?: number
  volumePerMealMax?: number
  volumeInstruction?: string
  recommendedFoods?: string[]
  recommendedDrinks?: string[]
  forbiddenFoods?: string[]
  forbiddenDrinks?: string[]
  upgradeCriteria?: string[]
}

export interface UpdatePodProtocolDto {
  label?: string
  dietLevel?: number
  mealsPerDayMin?: number
  mealsPerDayMax?: number
  mealInstruction?: string
  volumePerMealMin?: number
  volumePerMealMax?: number
  volumeInstruction?: string
  recommendedFoods?: string[]
  recommendedDrinks?: string[]
  forbiddenFoods?: string[]
  forbiddenDrinks?: string[]
  upgradeCriteria?: string[]
}
