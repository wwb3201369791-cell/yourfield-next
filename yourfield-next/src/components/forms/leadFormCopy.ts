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
  successWithMail: string;
  summary: string;
  validationError: string;
}>;

const leadFormCopyByLocale: Record<LeadFormLocale, LeadFormCopy> = {
  zh: {
    captchaError: '表单验证未通过，请稍后再试。',
    consent: '我同意永霏为回复本次咨询使用以上信息。',
    genericError: '提交失败，请稍后再试，或直接通过邮箱联系我们。',
    rateLimited: '提交过于频繁，请稍后再试。',
    requiredLabel: '必填',
    serverError: '暂时无法提交，请稍后再试，或直接通过邮箱联系我们。',
    submitting: '正在提交...',
    success: '已收到您的咨询，我们会尽快与您联系。',
    successWithMail: '已保存到后台，并已为您打开邮件草稿；请在邮箱中确认发送。',
    summary: '提交后会进入永霏线索系统，并为您打开邮件草稿；如需邮箱留档，请在邮箱中确认发送。',
    validationError: '请检查姓名、联系方式和需求描述后再提交。',
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
    successWithMail:
      'Your inquiry has been saved, and an email draft has opened. Please confirm and send it in your email client.',
    summary:
      'After submission, your inquiry will enter the YourField lead system and an email draft will open for your confirmation.',
    validationError: 'Please check your name, contact details, and message before submitting.',
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
    successWithMail:
      'Запрос сохранен, и открыт черновик письма. Подтвердите отправку в почтовом клиенте.',
    summary:
      'После отправки запрос поступит в систему заявок YourField, а черновик письма откроется для подтверждения.',
    validationError: 'Проверьте имя, контактные данные и сообщение перед отправкой.',
  },
};

export function getLeadFormCopy(locale: LeadFormLocale) {
  return leadFormCopyByLocale[locale];
}
