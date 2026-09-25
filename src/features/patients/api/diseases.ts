import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

// Danh mục mã bệnh ICD-10 (bảng `diseases`, seed sẵn trong migration backend
// CreateDiseasesTable — hiện là các mã chương K). Tìm theo mã hoặc tên, không
// phân biệt dấu, lọc phía server.
export interface DiseaseOption {
  code: string
  name: string
}

export const diseaseKeys = {
  search: (search: string) => ['diseases', 'search', search] as const,
}

export async function searchDiseases(search: string, limit = 20) {
  const { data } = await api.get<DiseaseOption[]>('/diseases', {
    params: { search: search || undefined, limit },
  })
  return data
}

// Debounce 250ms để không bắn request theo từng phím gõ.
export function useDiseaseSearch(query: string, enabled: boolean) {
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(handler)
  }, [query])

  return useQuery({
    queryKey: diseaseKeys.search(debounced),
    queryFn: () => searchDiseases(debounced),
    enabled,
    staleTime: Infinity, // danh mục chuẩn, gần như không đổi
    placeholderData: keepPreviousData,
  })
}
