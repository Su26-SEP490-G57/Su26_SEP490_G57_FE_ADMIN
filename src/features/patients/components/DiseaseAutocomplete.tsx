import { useState } from 'react'
import { diseaseCatalog, type DiseaseOption } from '../diseaseCatalog'

// Ô tìm bệnh theo mã/tên trong danh mục ICD (diseaseCatalog). Dùng chung cho
// form thêm/sửa người bệnh và phiếu theo dõi điều trị. `multiple` = chọn nhiều
// (Bệnh kèm theo), hiển thị dạng tag có nút xoá.
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

function diseaseLabel(option: DiseaseOption): string {
  return `${option.code} - ${option.name}`
}

export function DiseaseAutocomplete({
  value,
  onChange,
  multiple = false,
}: {
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
}) {
  const selectedValues = multiple ? (value as string[]) : value ? [value as string] : []
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabels = new Set(selectedValues)
  const options = diseaseCatalog.filter((option) => {
    const haystack = normalizeSearch(`${option.code} ${option.name}`)
    return !selectedLabels.has(diseaseLabel(option)) && haystack.includes(normalizeSearch(query))
  })

  const selectOption = (option: DiseaseOption) => {
    const selected = diseaseLabel(option)
    onChange(multiple ? [...selectedValues, selected] : selected)
    setQuery('')
    setIsOpen(false)
  }

  const removeOption = (selected: string) => {
    onChange(selectedValues.filter((item) => item !== selected))
  }

  const inputValue = !multiple && !query ? (value as string) : query

  return (
    <div className="relative">
      {multiple && selectedValues.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedValues.map((selected) => (
            <span
              key={selected}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"
            >
              <span className="truncate">{selected}</span>
              <button
                type="button"
                onClick={() => removeOption(selected)}
                className="font-bold text-blue-500 hover:text-blue-800"
                aria-label={`Xóa ${selected}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={inputValue}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          if (!multiple && value) onChange('')
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={multiple ? 'Tìm mã hoặc tên bệnh để thêm...' : 'Tìm mã hoặc tên bệnh...'}
        className={inputCls}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
      />
      {isOpen && options.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              type="button"
              key={option.code}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
            >
              {diseaseLabel(option)}
            </button>
          ))}
        </div>
      )}
      {isOpen && query && options.length === 0 && (
        <p className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
          Không tìm thấy bệnh phù hợp
        </p>
      )}
    </div>
  )
}
