import axios, {AxiosInstance} from "axios";

const isProd = process.env.NODE_ENV === 'production';

const myAxios: AxiosInstance = axios.create({
    baseURL: isProd ? '' : 'http://localhost:8084/api',// todo 修改成你的后端端口号
});

myAxios.defaults.withCredentials = true; // 配置为true

myAxios.interceptors.request.use(function (config) {
    console.log('我要发请求啦', config)
    return config;
}, function (error) {
    return Promise.reject(error);
});


myAxios.interceptors.response.use(function (response) {
    console.log('我收到你的响应啦', response)
    if (response?.data?.code === 40100) {
        const redirectUrl = window.location.href;
        window.location.href = `/user/login?redirect=${redirectUrl}`;
    }
    return response.data;
}, function (error) {
    return Promise.reject(error);
});

export default myAxios;
