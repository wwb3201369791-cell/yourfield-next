import '@/styles/legacy-product-detail.css';

import { ProductDetailLoadingScrollReset } from '@/components/product/ProductDetailScrollReset';

export default function ProductDetailLoading() {
  return (
    <>
      <ProductDetailLoadingScrollReset />
      <main
        className="detail-page detail-page--loading"
        role="status"
        aria-live="polite"
        aria-label="产品详情加载中"
      >
        <section className="detail-page-shell">
          <div className="container">
            <div className="detail-loading-shell">
              <span className="detail-loading-breadcrumb" />
              <div className="detail-loading-card">
                <div className="detail-loading-media" />
                <div className="detail-loading-copy">
                  <span />
                  <strong />
                  <p />
                  <p />
                  <div />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
