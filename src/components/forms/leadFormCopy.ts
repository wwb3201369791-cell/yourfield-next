export type LeadFormLocale = 'zh' | 'en' | 'ru';

type LeadFormCopy = Readonly<{
  captchaError: string;
  consent: string;
  emailFallbackLabel: string;
  emailFallbackSubject: string;
  emailOpeningStatus: string;
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
    emailFallbackLabel: '未弹出？再次打开邮箱',
    emailFallbackSubject: '官网咨询',
    emailOpeningStatus: '正在为您打开邮箱，请在邮件客户端确认发送；同时正在保存到后台。',
    genericError: '邮箱已尝试打开，但后台暂时未保存成功；请确认邮件客户端内容后发送，或稍后再试。',
    rateLimited: '提交过于频繁，请稍后再试。',
    requiredLabel: '必填',
    serverError: '邮箱已尝试打开，但后台暂时未保存成功；请确认邮件客户端内容后发送，或稍后再试。',
    submitting: '正在提交...',
    success: '后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。',
    validationError: '信息不完整或格式不规范，请补充后重新提交。',
  },
  en: {
    captchaError: 'Form verification failed. Please try again later.',
    consent: 'I agree that YourField may use the information above to respond to this inquiry.',
    emailFallbackLabel: 'Email did not open? Open it again',
    emailFallbackSubject: 'Website inquiry',
    emailOpeningStatus:
      'Opening your email client. Please confirm and send the message there while we save this inquiry.',
    genericError:
      'We tried to open your email client, but the backend could not save this inquiry. Please send the email or try again later.',
    rateLimited: 'Too many submissions. Please try again later.',
    requiredLabel: 'required',
    serverError:
      'We tried to open your email client, but the backend could not save this inquiry. Please send the email or try again later.',
    submitting: 'Submitting...',
    success:
      'The inquiry is saved. Your email client has been opened; please confirm and send there.',
    validationError:
      'Please complete the required fields and check that your phone and email are valid.',
  },
  ru: {
    captchaError: 'Проверка формы не пройдена. Повторите попытку позже.',
    consent: 'Я согласен(на), что YourField может использовать эти данные для ответа на запрос.',
    emailFallbackLabel: 'Не открылось? Открыть почту ещё раз',
    emailFallbackSubject: 'Запрос с сайта',
    emailOpeningStatus:
      'Открываем почтовый клиент. Подтвердите отправку письма, пока мы сохраняем запрос.',
    genericError:
      'Мы попытались открыть почту, но запрос не удалось сохранить в системе. Отправьте письмо или повторите попытку позже.',
    rateLimited: 'Слишком много отправок. Повторите попытку позже.',
    requiredLabel: 'обязательно',
    serverError:
      'Мы попытались открыть почту, но запрос не удалось сохранить в системе. Отправьте письмо или повторите попытку позже.',
    submitting: 'Отправка...',
    success: 'Запрос сохранён. Почтовый клиент открыт — подтвердите отправку письма.',
    validationError: 'Заполните обязательные поля и проверьте корректность телефона и email.',
  },
};

export function getLeadFormCopy(locale: LeadFormLocale) {
  return leadFormCopyByLocale[locale];
}
