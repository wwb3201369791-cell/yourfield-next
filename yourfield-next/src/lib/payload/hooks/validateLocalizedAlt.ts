import type { BeforeValidateHook } from 'payload/dist/collections/config/types';

type LocalizedText = {
  en?: string;
  ru?: string;
  zh?: string;
};

type MediaData = {
  alt?: LocalizedText | string;
  id: string;
};

const hasText = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0;

export const validateLocalizedAlt: BeforeValidateHook<MediaData> = ({ data }) => {
  const alt = data?.alt;

  if (typeof alt === 'string') {
    if (!hasText(alt)) {
      throw new Error('alt 必须填写。');
    }

    return data;
  }

  if (!alt || !hasText(alt.zh) || !hasText(alt.en) || !hasText(alt.ru)) {
    throw new Error('alt 必须三语全填（zh / en / ru）。');
  }

  return data;
};
