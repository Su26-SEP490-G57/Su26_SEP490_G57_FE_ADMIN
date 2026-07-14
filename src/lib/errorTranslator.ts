/**
 * Dịch error messages từ BE (tiếng Anh) sang tiếng Việt
 * @param error - Error object từ axios hoặc any error
 * @param fallbackMessage - Message mặc định nếu không match pattern nào
 * @param suppressConsole - Có suppress console.error không (mặc định: false)
 */
export function translateError(error: unknown, fallbackMessage = 'Có lỗi xảy ra', suppressConsole = false): string {
  // Suppress console error if needed (for expected errors like 409 Conflict)
  if (suppressConsole) {
    // Prevent error from being logged to console
    const errorObj = error as { config?: { suppressError?: boolean } }
    if (errorObj && typeof errorObj === 'object') {
      errorObj.config = { ...errorObj.config, suppressError: true }
    }
  }

  // Extract message from axios error
  const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message

  let errorText = Array.isArray(msg) ? msg.join(', ') : msg || fallbackMessage

  const lowerText = errorText.toLowerCase()

  // Common error patterns
  if ((lowerText.includes('case') || lowerText.includes('patient')) && lowerText.includes('already exist')) {
    return 'Mã bệnh nhân đã tồn tại trong hệ thống'
  }

  if (lowerText.includes('case id') && lowerText.includes('already exists')) {
    return 'Mã bệnh nhân đã tồn tại trong hệ thống'
  }

  if (lowerText.includes('username') && lowerText.includes('already exists')) {
    return 'Tên đăng nhập đã tồn tại'
  }

  if (lowerText.includes('email') && lowerText.includes('already exists')) {
    return 'Email đã tồn tại'
  }

  if (lowerText.includes('duplicate') || lowerText.includes('conflict')) {
    return 'Dữ liệu đã tồn tại trong hệ thống'
  }

  if (lowerText.includes('not found')) {
    return 'Không tìm thấy dữ liệu'
  }

  if (lowerText.includes('invalid')) {
    return 'Dữ liệu không hợp lệ'
  }

  if (lowerText.includes('unauthorized')) {
    return 'Không có quyền thực hiện thao tác này'
  }

  if (lowerText.includes('forbidden')) {
    return 'Truy cập bị từ chối'
  }

  if (lowerText.includes('bad request')) {
    return 'Yêu cầu không hợp lệ'
  }

  if (lowerText.includes('internal server error')) {
    return 'Lỗi máy chủ nội bộ'
  }

  if (lowerText.includes('network') || lowerText.includes('connection')) {
    return 'Lỗi kết nối mạng'
  }

  if (lowerText.includes('timeout')) {
    return 'Hết thời gian chờ'
  }

  // Return original or fallback
  return errorText
}
