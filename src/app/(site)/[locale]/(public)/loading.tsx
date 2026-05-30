export default function PublicRouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-label="页面加载中">
      <span className="route-loading__bar" />
    </div>
  );
}
