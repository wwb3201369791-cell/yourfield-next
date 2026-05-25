import type { Option } from 'payload/dist/fields/config/types';

export const localeOptions: Option[] = [
  { label: '简体中文', value: 'zh' },
  { label: '英文', value: 'en' },
  { label: '俄文', value: 'ru' },
];

export const pageKeyOptions: Option[] = [
  'home',
  'about',
  'products-index',
  'solutions',
  'news-index',
  'franchise',
  'contact',
  'privacy',
  'cookies',
  'terms',
];

export const heroVariantOptions: Option[] = ['video-bg', 'image-bg', 'carousel', 'plain'];

export const productGroupOptions: Option[] = [
  'fire-rescue',
  'electrical-protection',
  'thermal-welding',
  'chemical-medical',
  'water-rescue',
];

export const industryOptions: Option[] = [
  'firefighting',
  'power',
  'petrochemical',
  'steel',
  'medical',
  'welding',
  'defense',
  'emergency-rescue',
];

export const newsCategoryOptions: Option[] = [
  { label: '公司新闻', value: 'news' },
  { label: '活动动态', value: 'event' },
  { label: '公告', value: 'announcement' },
  { label: '展会信息', value: 'exhibition' },
];

export const faqScopeOptions: Option[] = ['global', 'page', 'product', 'news'];

export const mediaFolderOptions: Option[] = [
  'brand',
  'products',
  'news',
  'icons',
  'video',
  'pdf',
  'misc',
];

export const inquiryTypeOptions: Option[] = [
  { label: '招商咨询', value: 'franchise' },
  { label: '留言咨询', value: 'message' },
];

export const submissionStatusOptions: Option[] = [
  { label: '新咨询', value: 'new' },
  { label: '处理中', value: 'processing' },
  { label: '已回复', value: 'replied' },
  { label: '已关闭', value: 'closed' },
];

export const navTargetOptions: Option[] = ['_self', '_blank'];

export const mapServiceOptions: Option[] = ['amap', 'google'];

export const socialPlatformOptions: Option[] = [
  'wechat',
  'weibo',
  'linkedin',
  'youtube',
  'facebook',
  'x',
  'other',
];

export const auditActionOptions: Option[] = [
  'login',
  'logout',
  'login_failed',
  'create',
  'update',
  'delete',
  'restore',
  'publish',
  'unpublish',
  'upload',
  'media-delete',
  'form-submitted',
  'role-change',
  'permission-grant',
  'permission-revoke',
  'config-change',
];

export const certificationStatusOptions: Option[] = [
  'valid',
  'expired',
  'pending',
  'not-applicable',
];

export const visualVariantOptions: Option[] = [
  'gallery',
  'scene',
  'modeling',
  'model',
  'detail',
  'certificate',
  'comparison',
];

export const qualityEvidenceTypeOptions: Option[] = [
  'certificate',
  'test-report',
  'inspection',
  'case-study',
  'other',
];
