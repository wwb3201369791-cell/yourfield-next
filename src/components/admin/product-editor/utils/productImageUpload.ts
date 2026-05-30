export {
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  type AdminMediaDoc as ProductImageMedia,
} from '@/components/admin/media-upload/mediaUploadUtils';
import { buildMediaUploadAltText } from '@/components/admin/media-upload/mediaUploadUtils';

export function buildProductImageAltText({
  fileName,
  locale,
  productName,
}: {
  fileName: string;
  locale: string | undefined;
  productName: string;
}) {
  return buildMediaUploadAltText({ fileName, locale, title: productName });
}
