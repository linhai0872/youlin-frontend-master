import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import styleImport, {VantResolve} from 'vite-plugin-style-import';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), styleImport({
        resolves: [VantResolve()],
    })],
    server: {
        host: '0.0.0.0',
        port: 8083, // todo 修改为你的目标端口号
        open: true
    },
});