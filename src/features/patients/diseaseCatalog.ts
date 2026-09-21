export interface DiseaseOption {
  code: string
  name: string
}

// Kept as code + name so the form stores the same unambiguous value it shows.
export const diseaseCatalog: DiseaseOption[] = [
  { code: 'A00.1', name: 'Bệnh tả do Vibrio cholerae, típ sinh học cholerae' },
  { code: 'C16.9', name: 'Ung thư dạ dày, không xác định' },
  { code: 'C18.9', name: 'Ung thư đại tràng, không xác định' },
  { code: 'C20', name: 'Ung thư trực tràng' },
  { code: 'K25.4', name: 'Loét dạ dày mạn tính hoặc không xác định có xuất huyết' },
  { code: 'K26.4', name: 'Loét tá tràng mạn tính hoặc không xác định có xuất huyết' },
  { code: 'K35.8', name: 'Viêm ruột thừa cấp khác' },
  { code: 'K40.9', name: 'Thoát vị bẹn, không nghẹt hoặc hoại tử' },
  { code: 'K56.6', name: 'Tắc ruột khác và không xác định' },
  { code: 'K57.3', name: 'Bệnh túi thừa đại tràng không có thủng hoặc áp xe' },
  { code: 'K60.3', name: 'Rò hậu môn' },
  { code: 'K61.0', name: 'Áp xe hậu môn' },
  { code: 'K63.1', name: 'Thủng ruột (không do chấn thương)' },
  { code: 'K80.2', name: 'Sỏi túi mật không có viêm túi mật' },
  { code: 'K81.0', name: 'Viêm túi mật cấp' },
  { code: 'K85.9', name: 'Viêm tụy cấp, không xác định' },
  { code: 'K86.1', name: 'Viêm tụy mạn khác' },
  { code: 'N20.0', name: 'Sỏi thận' },
  { code: 'N40', name: 'Tăng sản tuyến tiền liệt' },
  { code: 'N80.9', name: 'Lạc nội mạc tử cung, không xác định' },
]
