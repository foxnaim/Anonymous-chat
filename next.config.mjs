import { createHash } from 'crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    typedRoutes: true,
    // optimizeCss: true, // Отключено из-за проблем с critters на Railway
    optimizePackageImports: ['react-icons', 'date-fns', 'framer-motion', '@radix-ui'], // Tree-shaking для больших библиотек
  },
  // Оптимизация bundle size
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Оптимизация chunk splitting для лучшего кэширования
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Оптимизация chunk splitting для production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunks
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return createHash('sha1').update(chunks.reduce((acc, chunk) => acc + chunk.name, '')).digest('hex').substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
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
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    // Получаем URL бэкенда из переменной окружения
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Преобразуем http:// в ws:// и https:// в wss:// для WebSocket
    const wsUrl = apiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    // Извлекаем домен из URL
    const apiDomain = wsUrl.replace(/^wss?:\/\//, '').split('/')[0];
    // Извлекаем домен для HTTP/HTTPS
    const httpDomain = apiUrl.replace(/^https?:\/\//, '').split('/')[0];
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), browsing-topics=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://${httpDomain} wss://${apiDomain} https:;`
          }
        ]
      }
    ];
  }
};

export default nextConfig;

