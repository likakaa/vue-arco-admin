import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import ViteLegacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import DefineOptions from 'unplugin-vue-define-options/vite'
import Eslint from 'vite-plugin-eslint'
import ViteCompression from 'vite-plugin-compression'
import ViteImagemin from 'vite-plugin-imagemin'
import ViteMarkdown from 'vite-plugin-vue-markdown'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { createStyleImportPlugin } from 'vite-plugin-style-import'
import { viteMockServe } from 'vite-plugin-mock'
import Unocss from 'unocss/vite'
import Shiki from 'markdown-it-shiki'
import LinkAttributes from 'markdown-it-link-attributes'
import type { ConfigEnv, UserConfig } from 'vite'

// https://cn.vitejs.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_PORT, VITE_PUBLIC_PATH } = env
  const isBuild = command === 'build'
  // const isHttps = /^https:\/\//.test(VITE_BASE_URL)

  return {
    base: VITE_PUBLIC_PATH,
    plugins: [
      Vue({ include: [/\.vue$/, /\.md$/] }),
      VueJsx(),
      // https://github.com/vitejs/vite/tree/main/packages/plugin-legacy
      ViteLegacy({ targets: ['defaults', 'not IE 11'] }),
      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', '@vueuse/head'],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/store'],
        vueTemplate: true,
        resolvers: [ArcoResolver()],
      }),
      // https://github.com/antfu/unplugin-vue-components
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        dts: 'src/components.d.ts',
        resolvers: [ArcoResolver({ sideEffect: true })],
      }),
      // https://github.com/sxzz/unplugin-vue-macros/blob/main/packages/define-options/README-zh-CN.md
      DefineOptions(),
      // https://github.com/vbenjs/vite-plugin-style-import/blob/main/README.zh_CN.md
      createStyleImportPlugin({
        libs: [
          {
            libraryName: '@arco-design/web-vue',
            esModule: true,
            resolveStyle: (name) => {
              interface replaceMap {
                [key: string]: string
              }
              // 这部分组件的使用必须依赖父级，所以直接忽略即可。
              const ignoreList = [
                'config-provider',
                'anchor-link',
                'sub-menu',
                'menu-item',
                'menu-item-group',
                'breadcrumb-item',
                'form-item',
                'step',
                'card-grid',
                'card-meta',
                'collapse-panel',
                'collapse-item',
                'descriptions-item',
                'list-item',
                'list-item-meta',
                'table-column',
                'table-column-group',
                'tab-pane',
                'tab-content',
                'timeline-item',
                'tree-node',
                'skeleton-line',
                'skeleton-shape',
                'grid-item',
                'carousel-item',
                'doption',
                'option',
                'optgroup',
                'icon',
              ]
              // 需要映射引入样式的组件列表
              const replaceList: replaceMap = {
                'typography-text': 'typography',
                'typography-title': 'typography',
                'typography-paragraph': 'typography',
                'typography-link': 'typography',
                'dropdown-button': 'dropdown',
                'input-password': 'input',
                'input-search': 'input',
                'input-group': 'input',
                'radio-group': 'radio',
                'checkbox-group': 'checkbox',
                'layout-sider': 'layout',
                'layout-content': 'layout',
                'layout-footer': 'layout',
                'layout-header': 'layout',
                'month-picker': 'date-picker',
                'range-picker': 'date-picker',
                row: 'grid', // 'grid/row.less'
                col: 'grid', // 'grid/col.less'
                'avatar-group': 'avatar',
                'image-preview': 'image',
                'image-preview-group': 'image',
              }
              if (ignoreList.includes(name)) return ''
              // eslint-disable-next-line no-prototype-builtins
              return replaceList.hasOwnProperty(name)
                ? `@arco-design/web-vue/es/${replaceList[name]}/style/css.js`
                : `@arco-design/web-vue/es/${name}/style/css.js`
              // less
              // return `@arco-design/web-vue/es/${name}/style/index.js`;
            },
          },
        ],
      }),
      // https://github.com/vbenjs/vite-plugin-mock
      viteMockServe({
        ignore: /^_/,
        mockPath: 'mock',
        localEnabled: !isBuild,
        prodEnabled: isBuild,
        injectCode: `
        import { setupProdMockServer } from '../mock/_createProductionServer';
        setupProdMockServer();
        `,
      }),
      // https://github.com/unocss/unocss/tree/main/packages/vite
      Unocss(),
      // https://github.com/gxmari007/vite-plugin-eslint
      // https://cn.vitejs.dev/guide/using-plugins.html#enforcing-plugin-ordering
      { ...Eslint(), apply: 'serve' },
      // https://github.com/vbenjs/vite-plugin-compression
      { ...ViteCompression(), apply: 'build' },
      // https://github.com/vbenjs/vite-plugin-imagemin
      {
        ...ViteImagemin({
          gifsicle: {
            optimizationLevel: 7,
            interlaced: false,
          },
          optipng: {
            optimizationLevel: 7,
          },
          mozjpeg: {
            quality: 20,
          },
          pngquant: {
            quality: [0.8, 0.9],
            speed: 4,
          },
          svgo: {
            plugins: [
              {
                name: 'removeViewBox',
              },
              {
                name: 'removeEmptyAttrs',
                active: false,
              },
            ],
          },
        }),
        apply: 'build',
      },
      // https://github.com/antfu/vite-plugin-vue-markdown
      ViteMarkdown({
        wrapperClasses: 'prose prose-sm m-auto text-left',
        headEnabled: false,
        markdownItSetup(md) {
          // https://prismjs.com/
          md.use(Shiki, {
            theme: {
              light: 'vitesse-light',
              dark: 'vitesse-dark',
            },
          })
          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          })
        },
      }),
    ],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: 'vue',
          replacement: 'vue/dist/vue.esm-bundler.js', // compile template
        },
      ],
    },
    server: {
      host: true,
      port: Number(VITE_PORT),
      // proxy: {
      //   '/api': {
      //     target: VITE_BASE_URL,
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/api/, ''),
      //     ...(isHttps ? { secure: false } : {}),
      //   },
      // },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            arco: ['@arco-design/web-vue'],
            vue: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  }
})
