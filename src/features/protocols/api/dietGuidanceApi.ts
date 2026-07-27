import { api } from '../../../lib/api'
import type {
  CreateOperationTypeDto,
  CreatePodProtocolDto,
  OperationTypeResponseDto,
  PodProtocolResponseDto,
  UpdateOperationTypeDto,
  UpdatePodProtocolDto,
} from '../types'

const BASE_PATH = '/diet-guidance'

// ============================================================================
// Operation Types API
// ============================================================================

/**
 * Get list of all operation types
 */
export async function getOperationTypes(): Promise<OperationTypeResponseDto[]> {
  const response = await api.get<OperationTypeResponseDto[]>(`${BASE_PATH}/operation-types`)
  return response.data
}

/**
 * Get single operation type by ID
 */
export async function getOperationTypeById(id: number): Promise<OperationTypeResponseDto> {
  const response = await api.get<OperationTypeResponseDto>(`${BASE_PATH}/operation-types/${id}`)
  return response.data
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
// POD Protocols API
// ============================================================================

/**
 * Get list of PODs for an operation type
 */
export async function getPodProtocols(operationTypeId: number): Promise<PodProtocolResponseDto[]> {
  const response = await api.get<PodProtocolResponseDto[]>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods`,
  )
  return response.data
}

/**
 * Get single POD protocol detail
 */
export async function getPodProtocolById(
  operationTypeId: number,
  podId: number,
): Promise<PodProtocolResponseDto> {
  const response = await api.get<PodProtocolResponseDto>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`,
  )
  return response.data
}

/**
 * Create new POD protocol (HEAD_NURSE only)
 */
export async function createPodProtocol(
  operationTypeId: number,
  data: CreatePodProtocolDto,
): Promise<PodProtocolResponseDto> {
  const response = await api.post<PodProtocolResponseDto>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods`,
    data,
  )
  return response.data
}

/**
 * Update POD protocol (HEAD_NURSE only)
 */
export async function updatePodProtocol(
  operationTypeId: number,
  podId: number,
  data: UpdatePodProtocolDto,
): Promise<PodProtocolResponseDto> {
  const response = await api.patch<PodProtocolResponseDto>(
    `${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`,
    data,
  )
  return response.data
}

/**
 * Delete POD protocol (HEAD_NURSE only)
 */
export async function deletePodProtocol(operationTypeId: number, podId: number): Promise<void> {
  await api.delete(`${BASE_PATH}/operation-types/${operationTypeId}/pods/${podId}`)
}
