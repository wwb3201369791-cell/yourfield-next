import payloadTranslations from 'payload/dist/translations';

export const adminI18nResources = {
  ...payloadTranslations,
  zh: {
    ...payloadTranslations.zh,
    authentication: {
      ...payloadTranslations.zh.authentication,
      forgotPasswordEmailInstructions: '请输入登录账号，系统会发送密码重置说明。',
      loginUser: '登录永霏网站运营后台',
    },
    error: {
      ...payloadTranslations.zh.error,
      emailOrPasswordIncorrect: '账号或密码不正确。',
      missingEmail: '请输入登录账号。',
    },
    general: {
      ...payloadTranslations.zh.general,
      columns: '显示字段',
      email: '登录账号',
      emailAddress: '登录账号',
      fallbackToDefaultLocale: '使用默认内容语言回填',
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
      ...payloadTranslations.zh.validation,
      emailAddress: '请输入有效的登录账号。',
    },
  },
};
