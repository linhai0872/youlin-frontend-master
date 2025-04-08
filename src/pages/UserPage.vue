<template>
  <template v-if="user">
    <van-cell title="用户" :value="user?.username" />
    <van-cell title="修改信息" is-link to="/user/update" />
    <van-cell title="我创建的队伍" is-link to="/user/team/create" />
    <van-cell title="我加入的队伍" is-link to="/user/team/join" />
  </template>
  <div
    style="position: fixed; bottom: 50px; width: 100%;  text-align: center; padding: 0px 0;border-top: 1px solid #eee;;"
  >
    <van-button
      type="default"
      plain
      @click="showLogoutConfirm"
      style="color: red; border: none; width: 100%;"
    >
      退出登录
    </van-button>
  </div>
  <van-dialog
    v-model:show="showConfirm"
    title="确认退出"
    message="确定要退出登录吗？"
    show-cancel-button
    @confirm="doLogout"
  >
  </van-dialog>
</template>

<script setup lang="ts">
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";
import myAxios from "../plugins/myAxios";
import {Toast} from "vant";
import {getCurrentUser} from "../services/user";



const user = ref();

const router = useRouter();

const showConfirm = ref(false);

const showLogoutConfirm = () => {
    showConfirm.value = true;
}

onMounted(async () => {
  user.value = await getCurrentUser();
})

const toEdit = (editKey: string, editName: string, currentValue: string) => {
  router.push({
    path: '/user/edit',
    query: {
      editKey,
      editName,
      currentValue,
    }
  })
}

const doLogout = async () => {
  const res = await myAxios.post('/user/logout');
  if (res.code === 0) {
    Toast.success('退出登录成功');
    // 清除用户信息
    user.value = null; 
    // 或者使用你的用户状态管理方式清除用户信息，例如：

    // 退出登录后，通常需要重定向到登录页或其他页面
    router.push('/user/login'); 
    //或者其他页面
  } else {
    Toast.fail('退出登录失败');
  }
};

</script>

<style scoped>

</style>