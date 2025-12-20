/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    typedRoutes: true
  },
  webpack: (config, { isServer }) => {
    // Исключаем socket.io-client из серверного бандла
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('socket.io-client');
    } else {
      // На клиенте разрешаем require для websocket модулей
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;

