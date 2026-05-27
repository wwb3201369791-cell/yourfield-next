export {
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  type AdminMediaDoc as ProductImageMedia,
} from '@/components/admin/media-upload/mediaUploadUtils';
import { buildMediaAltText } from '@/components/admin/media-upload/mediaUploadUtils';

export function buildProductImageAltText({
  fileName,
  productName,
}: {
  fileName: string;
  productName: string;
}) {
  return buildMediaAltText({ fileName, title: productName });
}
