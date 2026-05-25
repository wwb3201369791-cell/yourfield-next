import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Payload 后台启动提示',
};

export default function PayloadAdminFallbackPage() {
  return (
    <main
      style={{
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f7f4ec 0%, #ffffff 52%, #eef4f8 100%)',
        color: '#1f2933',
        display: 'flex',
        minHeight: '100vh',
        padding: '32px',
      }}
    >
      <section
        aria-labelledby="payload-admin-fallback-title"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(30, 58, 95, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(30, 58, 95, 0.12)',
          margin: '0 auto',
          maxWidth: '720px',
          padding: '40px',
        }}
      >
        <p
          style={{
            color: '#9a6a2f',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            margin: '0 0 12px',
            textTransform: 'uppercase',
          }}
        >
          Payload Admin
        </p>
        <h1
          id="payload-admin-fallback-title"
          style={{
            color: '#18314f',
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            lineHeight: 1,
            margin: '0 0 18px',
          }}
        >
          Payload 后台需要通过完整服务启动
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, margin: '0 0 24px' }}>
          当前请求已命中 Next.js 的 /admin 兜底页面，说明 Payload Express 中间件没有接管后台路由。请使用完整服务启动命令，而不是只运行
          Next 开发服务器。
        </p>
        <pre
          style={{
            background: '#0f172a',
            borderRadius: '16px',
            color: '#e2e8f0',
            margin: '0 0 24px',
            overflowX: 'auto',
            padding: '18px 20px',
          }}
        >
          <code>cd yourfield-next{`\n`}pnpm dev</code>
        </pre>
        <p style={{ fontSize: '0.98rem', lineHeight: 1.7, margin: '0 0 28px' }}>
          完整服务启动后，Payload 后台入口为 <strong>/admin/</strong>。这个兜底页的作用是防止 /admin 被误匹配成公开站点的 locale 路由并触发
          notFound 报错。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <a
            href="/admin/"
            style={{
              background: '#1e3a5f',
              borderRadius: '999px',
              color: '#ffffff',
              fontWeight: 700,
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            重新打开 /admin/
          </a>
          <a
            href="/zh"
            style={{
              border: '1px solid rgba(30, 58, 95, 0.24)',
              borderRadius: '999px',
              color: '#1e3a5f',
              fontWeight: 700,
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            返回官网首页
          </a>
        </div>
      </section>
    </main>
  );
}
