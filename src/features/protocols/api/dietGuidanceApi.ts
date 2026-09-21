import { api } from '../../../lib/api'
import type {
  CreateDietLevelProtocolDto,
  CreateOperationTypeDto,
  DietLevelProtocolResponseDto,
  OperationTypeResponseDto,
  UpdateDietLevelProtocolDto,
  UpdateOperationTypeDto,
} from '../types'

const BASE_PATH = '/diet-guidance'

// ============================================================================
// Operation Types API
// ============================================================================

interface WireOperationTypeResponse {
  id: number
  name: string
  description: string | null
  podCount: number
}

function toOperationTypeResponse(wire: WireOperationTypeResponse): OperationTypeResponseDto {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    dietLevelCount: wire.podCount,
  }
}

/**
 * Get list of all operation types
 */
export async function getOperationTypes(): Promise<OperationTypeResponseDto[]> {
  const response = await api.get<WireOperationTypeResponse[]>(`${BASE_PATH}/operation-types`)
  return response.data.map(toOperationTypeResponse)
}

/**
 * Get single operation type by ID
 */
export async function getOperationTypeById(id: number): Promise<OperationTypeResponseDto> {
  const response = await api.get<WireOperationTypeResponse>(`${BASE_PATH}/operation-types/${id}`)
  return toOperationTypeResponse(response.data)
}

/**
 * Create new operation type (HEAD_NURSE only)
 */
export async function createOperationType(
  data: CreateOperationTypeDto,
): Promise<OperationTypeResponseDto> {
  const response = await api.post<OperationTypeResponseDto>(`${BASE_PATH}/operation-types`, data)
  return response.data
}

/**
 * Update operation type (HEAD_NURSE only)
 */
export async function updateOperationType(
  id: number,
  data: UpdateOperationTypeDto,
): Promise<OperationTypeResponseDto> {
  const response = await api.patch<OperationTypeResponseDto>(
    `${BASE_PATH}/operation-types/${id}`,
    data,
  )
  return response.data
}

/**
 * Delete operation type (HEAD_NURSE only)
 */
export async function deleteOperationType(id: number): Promise<void> {
  await api.delete(`${BASE_PATH}/operation-types/${id}`)
}

// ============================================================================
// Diet Level Protocol API
// Backend wire contract still uses /pods paths and PodProtocolResponseDto shape.
// Frontend wrappers expose clean Diet Level Protocol names; mapper converts here.
// ============================================================================

interface WirePodProtocolResponse {
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
  updatedAt: Date | null
  createdAt: Date
}

function toDietLevelProtocol(wire: WirePodProtocolResponse): DietLevelProtocolResponseDto {
  return {
    dietLevelId: wire.podId,
    operationTypeId: wire.operationTypeId,
    label: wire.label,
    dietLevel: wire.dietLevel,
    mealsPerDayMin: wire.mealsPerDayMin,
    mealsPerDayMax: wire.mealsPerDayMax,
    mealInstruction: wire.mealInstruction,
    volumePerMealMin: wire.volumePerMealMin,
    volumePerMealMax: wire.volumePerMealMax,
    volumeInstruction: wire.volumeInstruction,
    recommendedFoods: wire.recommendedFoods,
    recommendedDrinks: wire.recommendedDrinks,
    updatedAt: wire.updatedAt,
    createdAt: wire.createdAt,
  }
}

/**
 * Get list of diet level protocols for an operation type.
 * Backend route: GET /diet-guidance/operation-types/:operationTypeId/pods
 */
export async function getDietLevelProtocols(
  operationTypeId: number,
): Promise<DietLevelProtocolResponseDto[]> {
  const response = await api.get<WirePodProtocolResponse[]>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods`,
  )
  return response.data.map(toDietLevelProtocol)
}

/**
 * Get single diet level protocol detail.
 * Backend route: GET /diet-guidance/operation-types/:operationTypeId/pods/:podId
 */
export async function getDietLevelProtocolById(
  operationTypeId: number,
  podId: number,
): Promise<DietLevelProtocolResponseDto> {
  const response = await api.get<WirePodProtocolResponse>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`,
  )
  return toDietLevelProtocol(response.data)
}

/**
 * Create new diet level protocol (HEAD_NURSE only).
 * Backend route: POST /diet-guidance/operation-types/:operationTypeId/pods
 */
export async function createDietLevelProtocol(
  operationTypeId: number,
  data: CreateDietLevelProtocolDto,
): Promise<DietLevelProtocolResponseDto> {
  const response = await api.post<WirePodProtocolResponse>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods`,
    data,
  )
  return toDietLevelProtocol(response.data)
}

/**
 * Update diet level protocol (HEAD_NURSE only).
 * Backend route: PATCH /diet-guidance/operation-types/:operationTypeId/pods/:podId
 */
export async function updateDietLevelProtocol(
  operationTypeId: number,
  podId: number,
  data: UpdateDietLevelProtocolDto,
): Promise<DietLevelProtocolResponseDto> {
  const response = await api.patch<WirePodProtocolResponse>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`,
    data,
  )
  return toDietLevelProtocol(response.data)
}

/**
 * Delete diet level protocol (HEAD_NURSE only).
 * Backend route: DELETE /diet-guidance/operation-types/:operationTypeId/pods/:podId
 */
export async function deleteDietLevelProtocol(
  operationTypeId: number,
  podId: number,
): Promise<void> {
  await api.delete(`${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`)
}
