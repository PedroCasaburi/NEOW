import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      // Sourcemaps apenas em desenvolvimento (não expõe código fonte em produção)
      sourcemap: !isProd,
      // Remove console.log e debugger em produção
      minify: 'esbuild',
      target: 'es2020',
      rollupOptions: {
        output: {
          // Chunk splitting: separa bibliotecas grandes para melhor cache
          manualChunks: {
            'vendor-motion': ['motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-leaflet': ['leaflet', 'react-leaflet'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
    esbuild: {
      // Remove logs de debug e debugger em produção
      drop: isProd ? ['console', 'debugger'] : [],
    },
  };
});

