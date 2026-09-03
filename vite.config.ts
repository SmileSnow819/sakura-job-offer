import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/sakura-job-offer/',
  fmt: {
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    printWidth: 100,
    // 公司数据和每日记录不参与代码格式化，避免产生无关的大量差异。
    ignorePatterns: [
      'data/**',
      'public/**',
      'src/**/*.json',
      'pnpm-lock.yaml',
      'package-lock.json',
      // 第三方 Skill 保留上游原文与示例，不应用项目格式规则。
      '.agents/skills/superpowers/**',
    ],
  },
  lint: {
    ignorePatterns: ['dist/**', '.agents/skills/superpowers/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
