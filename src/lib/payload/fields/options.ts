import type { Option } from 'payload';

export const localeOptions: Option[] = [
  { label: { en: 'Simplified Chinese', zh: '简体中文' }, value: 'zh' },
  { label: { en: 'English', zh: '英文' }, value: 'en' },
  { label: { en: 'Russian', zh: '俄文' }, value: 'ru' },
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
  { label: { en: 'Company News', zh: '公司新闻' }, value: 'news' },
  { label: { en: 'Events', zh: '活动动态' }, value: 'event' },
  { label: { en: 'Announcement', zh: '公告' }, value: 'announcement' },
  { label: { en: 'Exhibitions', zh: '展会信息' }, value: 'exhibition' },
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
  { label: { en: 'Franchise inquiry', zh: '招商咨询' }, value: 'franchise' },
  { label: { en: 'General message', zh: '留言咨询' }, value: 'message' },
];

export const submissionStatusOptions: Option[] = [
  { label: { en: 'New inquiry', zh: '新咨询' }, value: 'new' },
  { label: { en: 'Processing', zh: '处理中' }, value: 'processing' },
  { label: { en: 'Replied', zh: '已回复' }, value: 'replied' },
  { label: { en: 'Closed', zh: '已关闭' }, value: 'closed' },
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
