import type { KeyboardEvent } from 'react'

// Chặn Enter trong <input> tự submit form (hành vi mặc định của trình duyệt):
// trên các phiếu, Enter chỉ để xuống dòng — lưu phiếu phải bấm nút "Lưu".
// <textarea> không bị ảnh hưởng (Enter vẫn xuống dòng bình thường).
export function preventEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.preventDefault()
  }
}
