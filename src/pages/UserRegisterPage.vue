
  <template>
  <div class="register-container">
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
          :rules="accountRules"
        />
        <van-field
          v-model="userPassword"
          type="password"
          name="userPassword"
          label="密码"
          placeholder="请输入密码"
          :rules="passwordRules"
        />
        <van-field
          v-model="checkPassword"
          type="password"
          name="checkPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="checkPasswordRules"
        />
        <van-field
          v-model="planetCode"
          name="planetCode"
          label="编号"
          placeholder="请自定义唯一编号"
          :rules="planetCodeRules"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          注册
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../plugins/myAxios';
import { Toast } from 'vant';

const router = useRouter();

const userAccount = ref('');
const userPassword = ref('');
const checkPassword = ref('');
const planetCode = ref('');

// 账号校验规则
const accountRules = [
  { required: true, message: '请输入账号' },
  { min: 4, max: 20, message: '账号长度在 4 到 20 个字符' },
];

// 密码校验规则
const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, max: 16, message: '密码长度在 6 到 16 个字符' },
];

// 确认密码校验规则
const checkPasswordRules = [
  { required: true, message: '请再次输入密码' },
  {
    validator: (value) => value === userPassword.value,
    message: '两次输入的密码不一致',
  },
];

// 编号校验规则 (可选)
const planetCodeRules = [
  { max: 10, message: '编号最多 10 个字符' },
];

const onSubmit = async () => {
  try {
    const res = await myAxios.post('/user/register', {
      userAccount: userAccount.value,
      userPassword: userPassword.value,
      checkPassword: checkPassword.value,
      planetCode: planetCode.value,
    });
    console.log(res, "注册请求");

    if (res.code === 0 && res.data) {
      Toast.success("注册成功");
      router.push("/user/login");
    } else {
      // 优先使用 description，其次使用 message，最后使用默认值
      const errorMessage = res.description || res.message || "注册失败";
      Toast.fail(errorMessage);
    }
  } catch (error: any) {
    let errorMessage = "注册失败"; // 默认错误消息

    if (error.response && error.response.data) {
      // 优先从 description 获取，没有则从 message 获取
      errorMessage = error.response.description || error.response.message;
    }
    //如果都没有
    if (!errorMessage) {
      errorMessage = error.message;
    }

    console.error("注册失败:", error);
    Toast.fail(errorMessage);
  }
};
</script>

<style scoped>
.register-container {
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