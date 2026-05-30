import { en } from 'payload/i18n/en';
import { zh } from 'payload/i18n/zh';

export const adminI18nResources = {
  en: en.translations,
  zh: {
    ...zh.translations,
    authentication: {
      ...zh.translations.authentication,
      forgotPasswordEmailInstructions: '请输入登录账号，系统会发送密码重置说明。',
      loginUser: '登录永霏网站运营后台',
    },
    error: {
      ...zh.translations.error,
      emailOrPasswordIncorrect: '账号或密码不正确。',
      missingEmail: '请输入登录账号。',
    },
    general: {
      ...zh.translations.general,
      columns: '显示字段',
      email: '登录账号',
      emailAddress: '登录账号',
      fallbackToDefaultLocale: '空内容临时显示参考语言',
      filters: '筛选条件',
      locale: '内容语言',
      locales: '内容语言',
      loading: '加载中',
      noResults: '暂无符合条件的{{label}}记录。',
      notFound: '未找到相关条目',
      of: '共',
      perPage: '每页显示 {{limit}} 条',
    },
    validation: {
      ...zh.translations.validation,
      emailAddress: '请输入有效的登录账号。',
    },
  },
};

export const adminSupportedLanguages = {
  en,
  zh,
};
