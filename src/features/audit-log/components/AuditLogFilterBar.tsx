import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { AuditLogFilters } from '../types'

interface AuditLogFiltersProps {
  onFiltersChange: (filters: AuditLogFilters) => void
}

// Entity types commonly logged in the system
const ENTITY_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'alerts', label: 'Alerts (Cảnh báo)' },
  { value: 'assessments', label: 'Assessments (Đánh giá triệu chứng)' },
  { value: 'care-observation', label: 'Care Observations (Theo dõi chăm sóc)' },
  { value: 'diet-guidance', label: 'Diet Guidance (Hướng dẫn dinh dưỡng)' },
  { value: 'nurses', label: 'Nurses (Y tá)' },
  { value: 'patients', label: 'Patients (Bệnh nhân)' },
  { value: 'patient_cases', label: 'Patient Cases (Hồ sơ điều trị)' },
  { value: 'patient_assessments', label: 'Patient Assessments (Đánh giá BN)' },
  { value: 'room-nurse-assignments', label: 'Room Assignments (Phân công phòng)' },
  { value: 'treatment-orders', label: 'Treatment Orders (Y lệnh)' },
  { value: 'users', label: 'Users (Người dùng)' },
  { value: 'vital-signs', label: 'Vital Signs (Sinh hiệu)' },
]

export function AuditLogFilterBar({ onFiltersChange }: AuditLogFiltersProps) {
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleApplyFilters = () => {
    onFiltersChange({
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      offset: 0,
    })
  }

  const handleReset = () => {
    setEntityType('')
    setEntityId('')
    setStartDate('')
    setEndDate('')
    onFiltersChange({ offset: 0 })
  }

  // Handle Enter key press on text inputs
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyFilters()
    }
  }

  // Auto-submit when date changes
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value)
    } else {
      setEndDate(value)
    }

    // Auto-submit after date selection
    setTimeout(() => {
      onFiltersChange({
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        startDate: field === 'start' ? value || undefined : startDate || undefined,
        endDate: field === 'end' ? value || undefined : endDate || undefined,
        offset: 0,
      })
    }, 0)
  }

  // Auto-submit when entity type changes
  const handleEntityTypeChange = (value: string) => {
    setEntityType(value)
    setTimeout(() => {
      onFiltersChange({
        entityType: value || undefined,
        entityId: entityId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        offset: 0,
      })
    }, 0)
  }

  return (
    <div className="bg-white border-b border-slate-200 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại Entity</label>
          <select
            value={entityType}
            onChange={(e) => handleEntityTypeChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {ENTITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Entity ID</label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Gõ ID và nhấn Enter..."
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Từ ngày</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Lọc
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  )
}
