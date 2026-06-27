import { useEffect, useState } from 'react'
import { useCreateNurse, useUpdateNurse } from '../api/nurses'
import type { Nurse } from '../types'

interface NurseFormModalProps {
  isOpen: boolean
  onClose: () => void
  nurse?: Nurse | null // null means CREATE mode, object means EDIT mode
}

export function NurseFormModal({ isOpen, onClose, nurse }: NurseFormModalProps) {
  const isEdit = !!nurse
  const createMutation = useCreateNurse()
  const updateMutation = useUpdateNurse()

  // Form Fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dob, setDob] = useState('')
  const [cityProvince, setCityProvince] = useState('')
  const [ward, setWard] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [role, setRole] = useState<'Nurse' | 'Head_Nurse'>('Nurse')
  const [isActive, setIsActive] = useState(true)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  // Sync state with nurse prop (for Edit mode)
  useEffect(() => {
    if (isOpen) {
      if (nurse) {
        setUsername(nurse.username)
        setPassword('')
        setFullName(nurse.fullName)
        setPhoneNumber(nurse.phoneNumber || '')
        setDob(nurse.dob || '')
        setCityProvince(nurse.cityProvince || '')
        setWard(nurse.ward || '')
        setDetailedAddress(nurse.detailedAddress || '')
        const mainRole = nurse.roles.includes('Head_Nurse') ? 'Head_Nurse' : 'Nurse'
        setRole(mainRole)
        setIsActive(nurse.isActive)
      } else {
        // Reset for Create mode
        setUsername('')
        setPassword('')
        setFullName('')
        setPhoneNumber('')
        setDob('')
        setCityProvince('')
        setWard('')
        setDetailedAddress('')
        setRole('Nurse')
        setIsActive(true)
      }
      setErrors({})
      setSubmitError('')
    }
  }, [isOpen, nurse])

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Username validation
    if (!isEdit) {
      if (!username.trim()) {
        newErrors.username = 'Tên tài khoản không được để trống'
      } else if (/\s/.test(username)) {
        newErrors.username = 'Tên tài khoản không được chứa khoảng trắng'
      } else if (username.length > 50) {
        newErrors.username = 'Tên tài khoản tối đa 50 ký tự'
      }

      // Password validation
      if (!password) {
        newErrors.password = 'Mật khẩu không được để trống'
      } else if (password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
      } else if (password.length > 100) {
        newErrors.password = 'Mật khẩu tối đa 100 ký tự'
      }
    }

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống'
    } else if (fullName.length > 100) {
      newErrors.fullName = 'Họ và tên tối đa 100 ký tự'
    }

    // Phone number validation
    if (phoneNumber) {
      const phoneRegex = /^0\d{9}$/
      if (!phoneRegex.test(phoneNumber)) {
        newErrors.phoneNumber = 'Số điện thoại phải bắt đầu bằng số 0 và đúng 10 chữ số'
      }
    }

    // Address fields lengths
    if (cityProvince && cityProvince.length > 100) {
      newErrors.cityProvince = 'Tên Tỉnh/Thành phố tối đa 100 ký tự'
    }
    if (ward && ward.length > 100) {
      newErrors.ward = 'Tên Quận/Huyện/Xã/Phường tối đa 100 ký tự'
    }
    if (detailedAddress && detailedAddress.length > 255) {
      newErrors.detailedAddress = 'Địa chỉ chi tiết tối đa 255 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    try {
      if (isEdit && nurse) {
        await updateMutation.mutateAsync({
          id: nurse.id,
          data: {
            fullName,
            phoneNumber: phoneNumber || undefined,
            dob: dob || undefined,
            cityProvince: cityProvince || undefined,
            ward: ward || undefined,
            detailedAddress: detailedAddress || undefined,
            role,
            isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          username,
          password,
          fullName,
          phoneNumber: phoneNumber || undefined,
          dob: dob || undefined,
          cityProvince: cityProvince || undefined,
          ward: ward || undefined,
          detailedAddress: detailedAddress || undefined,
          role,
        })
      }
      onClose()
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin điều dưỡng')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00459a]">
              {isEdit ? 'edit_note' : 'person_add'}
            </span>
            <h3 className="text-base font-bold text-slate-800">
              {isEdit ? 'Chỉnh sửa thông tin điều dưỡng' : 'Thêm tài khoản điều dưỡng mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
              <p>{submitError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Username (Only Editable on Create) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tên tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: nurse02"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
            </div>

            {/* Password (Only on Create) */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
              {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ngày sinh
              </label>
              <input
                type="date"
                value={dob ? dob.split('T')[0] : ''}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
            </div>

            {/* Role select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Nurse' | 'Head_Nurse')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              >
                <option value="Nurse">Điều dưỡng viên</option>
                <option value="Head_Nurse">Điều dưỡng trưởng</option>
              </select>
            </div>

            {/* City/Province */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tỉnh / Thành phố
              </label>
              <input
                type="text"
                value={cityProvince}
                onChange={(e) => setCityProvince(e.target.value)}
                placeholder="Ví dụ: Hà Nội"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
              {errors.cityProvince && <p className="text-xs text-red-500">{errors.cityProvince}</p>}
            </div>

            {/* Ward */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quận / Huyện / Xã / Phường
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Ví dụ: Thanh Xuân"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
              {errors.ward && <p className="text-xs text-red-500">{errors.ward}</p>}
            </div>
          </div>

          {/* Detailed Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Địa chỉ chi tiết
            </label>
            <input
              type="text"
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder="Ví dụ: Số 1 Nguyễn Trãi"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
            />
            {errors.detailedAddress && <p className="text-xs text-red-500">{errors.detailedAddress}</p>}
          </div>

          {/* Account status toggle (Edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <div className="text-sm font-bold text-slate-800">Trạng thái hoạt động</div>
                <div className="text-xs text-slate-500">
                  Khi tạm ngưng, tài khoản này sẽ không thể đăng nhập vào hệ thống.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${
                  isActive ? 'bg-[#00459a]' : 'bg-[#c2c6d5]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1 rounded-xl bg-[#00459a] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
            >
              {isPending ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
