export type LeadFormLocale = 'zh' | 'en' | 'ru';

type LeadFormCopy = Readonly<{
  captchaError: string;
  consent: string;
  genericError: string;
  rateLimited: string;
  requiredLabel: string;
  serverError: string;
  submitting: string;
  success: string;
  validationError: string;
}>;

const leadFormCopyByLocale: Record<LeadFormLocale, LeadFormCopy> = {
  zh: {
    captchaError: '信息验证失败，请稍后再试。',
    consent: '我同意永霏为回复本次咨询使用以上信息。',
    genericError: '提交失败，请稍后再试，或直接通过邮箱联系我们。',
    rateLimited: '提交过于频繁，请稍后再试。',
    requiredLabel: '必填',
    serverError: '暂时无法提交，请稍后再试，或直接通过邮箱联系我们。',
    submitting: '正在提交...',
    success: '已收到您的咨询，我们会尽快与您联系。',
    validationError: '信息不完整或格式不规范，请补充后重新提交。',
  },
  en: {
    captchaError: 'Form verification failed. Please try again later.',
    consent: 'I agree that YourField may use the information above to respond to this inquiry.',
    genericError: 'Submission failed. Please try again later or contact us by email.',
    rateLimited: 'Too many submissions. Please try again later.',
    requiredLabel: 'required',
    serverError:
      'We cannot submit the form right now. Please try again later or contact us by email.',
    submitting: 'Submitting...',
    success: 'Your inquiry has been received. We will contact you soon.',
    validationError:
      'Please complete the required fields and check that your phone and email are valid.',
  },
  ru: {
    captchaError: 'Проверка формы не пройдена. Повторите попытку позже.',
    consent: 'Я согласен(на), что YourField может использовать эти данные для ответа на запрос.',
    genericError: 'Не удалось отправить форму. Повторите попытку позже или напишите нам по email.',
    rateLimited: 'Слишком много отправок. Повторите попытку позже.',
    requiredLabel: 'обязательно',
    serverError:
      'Сейчас форму нельзя отправить. Повторите попытку позже или свяжитесь с нами по email.',
    submitting: 'Отправка...',
    success: 'Ваш запрос получен. Мы скоро свяжемся с вами.',
    validationError: 'Заполните обязательные поля и проверьте корректность телефона и email.',
  },
};

export function getLeadFormCopy(locale: LeadFormLocale) {
  return leadFormCopyByLocale[locale];
}
