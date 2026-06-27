import { useQuery } from '@tanstack/react-query'

// Vietnam administrative units (2-tier: Tỉnh/Thành phố → Phường/Xã).
// Public, no-auth dataset — fetched with the native `fetch` so the app's
// authenticated axios interceptor doesn't attach a Bearer token to a 3rd party.
const VN_ADDRESS_API = 'https://provinces.open-api.vn/api/v2'

export interface Province {
  code: number
  name: string
}

export interface Ward {
  code: number
  name: string
}

interface ProvinceWithWards extends Province {
  wards: Ward[]
}

export const vnAddressKeys = {
  provinces: ['vn-address', 'provinces'] as const,
  wards: (provinceCode: number | null) => ['vn-address', 'wards', provinceCode] as const,
}

// All provinces / centrally-governed cities.
export function useProvinces() {
  return useQuery({
    queryKey: vnAddressKeys.provinces,
    queryFn: async (): Promise<Province[]> => {
      const res = await fetch(`${VN_ADDRESS_API}/p/`)
      if (!res.ok) throw new Error('Không tải được danh sách tỉnh/thành phố')
      return (await res.json()) as Province[]
    },
    staleTime: Infinity, // administrative units almost never change within a session
    gcTime: Infinity,
  })
}

// Wards belonging to a province (depth=2 returns the nested wards array).
export function useWards(provinceCode: number | null) {
  return useQuery({
    queryKey: vnAddressKeys.wards(provinceCode),
    queryFn: async (): Promise<Ward[]> => {
      if (!provinceCode) return []
      const res = await fetch(`${VN_ADDRESS_API}/p/${provinceCode}?depth=2`)
      if (!res.ok) throw new Error('Không tải được danh sách phường/xã')
      const data = (await res.json()) as ProvinceWithWards
      return data.wards ?? []
    },
    enabled: provinceCode !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
