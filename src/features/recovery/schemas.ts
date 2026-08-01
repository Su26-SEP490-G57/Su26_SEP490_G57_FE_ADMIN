import { z } from 'zod'
import type { SurveyQuestion } from './types'

const questionOptionSchema = z.object({
  optionText: z.string().trim().min(1, 'Lựa chọn phải có tên nhãn hiển thị.'),
  scoreValue: z.number('Trọng số phải là một số.').min(0, 'Trọng số không được nhỏ hơn 0.'),
})

export const questionFormSchema = z.object({
  questionText: z.string().trim().min(1, 'Nội dung câu hỏi không được để trống.'),
  orderNumber: z
    .number('Thứ tự hiển thị phải là một số.')
    .min(1, 'Thứ tự hiển thị tối thiểu là 1.'),
  isDefault: z.boolean(),
  options: z.array(questionOptionSchema).min(1, 'Vui lòng thêm ít nhất 1 lựa chọn trả lời.'),
})

export type QuestionFormValues = z.infer<typeof questionFormSchema>

const DEFAULT_QUESTION_OPTIONS: QuestionFormValues['options'] = [
  { optionText: 'Không', scoreValue: 0 },
  { optionText: 'Nhẹ', scoreValue: 1 },
  { optionText: 'Vừa', scoreValue: 2 },
  { optionText: 'Nặng', scoreValue: 3 },
]

export const buildQuestionFormDefaultValues = (): QuestionFormValues => ({
  questionText: '',
  orderNumber: 1,
  isDefault: false,
  options: DEFAULT_QUESTION_OPTIONS.map((opt) => ({ ...opt })),
})

const questionDetailOptionSchema = z.object({
  optionId: z.number().optional(),
  optionText: z.string(),
  scoreValue: z.number(),
  isNew: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
})

export const questionDetailFormSchema = z
  .object({
    questionText: z.string(),
    orderNumber: z.number(),
    isDefault: z.boolean(),
    options: z.array(questionDetailOptionSchema),
  })
  .superRefine((values, ctx) => {
    if (!values.questionText.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['questionText'],
        message: 'Nội dung câu hỏi không được để trống.',
      })
    }

    if (values.orderNumber < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['orderNumber'],
        message: 'Thứ tự hiển thị tối thiểu là 1.',
      })
    }

    const activeOptions = values.options.filter((opt) => !opt.isDeleted)

    if (activeOptions.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Câu hỏi phải có ít nhất 1 lựa chọn trả lời.',
      })
    }

    values.options.forEach((opt, idx) => {
      if (opt.isDeleted) return

      if (!opt.optionText.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', idx, 'optionText'],
          message: 'Nội dung lựa chọn không được để trống.',
        })
      }

      if (opt.scoreValue < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', idx, 'scoreValue'],
          message: 'Trọng số điểm phải lớn hơn hoặc bằng 0.',
        })
      }
    })
  })

export type QuestionDetailFormValues = z.infer<typeof questionDetailFormSchema>

export const buildQuestionDetailFormDefaultValues = (
  question?: SurveyQuestion | null,
): QuestionDetailFormValues => ({
  questionText: question?.questionText ?? '',
  orderNumber: question?.orderNumber ?? 1,
  isDefault: question?.isDefault ?? false,
  options: (question?.options ?? []).map((opt) => ({
    optionId: opt.optionId,
    optionText: opt.optionText,
    scoreValue: opt.scoreValue,
  })),
})
