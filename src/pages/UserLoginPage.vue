<template>
  <div class="login-page-container">
    <!-- 顶部区域：Logo + 标题 -->
    <div class="header">
      <van-image
        width="80"
        height="80"
        round
        src="https://fastly.jsdelivr.net/npm/@vant/assets/logo.png"
      />
      <h2>有林</h2>
    </div>
    <van-divider />

    <!-- 表单区域 -->
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
            v-model="userAccount"
            name="userAccount"
            label="账号"
            placeholder="请输入账号"
            :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
            v-model="userPassword"
            type="password"
            name="userPassword"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          登录
        </van-button>
        <van-button round block type="default" style="margin-top: 16px;" @click="toRegisterPage">
          注册
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";
import myAxios from "../plugins/myAxios";
import { Toast } from "vant";

const router = useRouter();
const route = useRoute();

const userAccount = ref('');
const userPassword = ref('');

const onSubmit = async () => {
  const res = await myAxios.post('/user/login', {
    userAccount: userAccount.value,
    userPassword: userPassword.value,
  })
  console.log(res, '用户登录');
  if (res.code === 0 && res.data) {
    Toast.success('登录成功');
    // 跳转到之前的页面
    const redirectUrl = route.query?.redirect as string ?? '/';
    window.location.href = redirectUrl;
  } else {
    Toast.fail('登录失败');
  }
};

const toRegisterPage = () => {
  router.push('/user/register');
}
</script>

<style scoped>
/* 添加包裹整个登录表单的容器样式 */
.login-page-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  padding: 20px; /* 添加内边距 */
}

/* 顶部 Logo 和标题的样式 */
.header {
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  margin-bottom: 0px; /* 减小与表单的间距 */
}

.header h2 {
  margin-top: 10px; /* 减小标题与 Logo 的间距 */
  margin-bottom: 0px;
}
</style>