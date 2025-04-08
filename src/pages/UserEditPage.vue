<template>
  <van-form @submit="onSubmit" class="edit-form">
    <!-- 简介编辑 -->
    <van-field
        v-if="editUser.editKey === 'bio'"
        v-model="editUser.currentValue"
        :name="editUser.editKey"
        :label="editUser.editName"
        type="textarea"
        rows="4"
        autosize
        maxlength="200"
        show-word-limit
        :placeholder="`请输入${editUser.editName}`"
        class="bio-textarea"
    />
    <!-- 性别编辑 -->
    <van-field v-else-if="editUser.editKey === 'gender'" :label="editUser.editName" class="gender-field">
        <template #input>
            <van-radio-group v-model="editUser.genderText" direction="horizontal" class="gender-radio-group">
                <van-radio name="男">男</van-radio>
                <van-radio name="女">女</van-radio>
            </van-radio-group>
        </template>
    </van-field>
    <!-- 其他字段编辑 -->
    <van-field
        v-else
        v-model="editUser.currentValue"
        :name="editUser.editKey"
        :label="editUser.editName"
        :placeholder="`请输入${editUser.editName}`"
    />

    <!-- 操作按钮区域 -->
    <div style="margin: 24px 16px 16px;">
      <!-- 清空按钮 -->
      <van-button
          round
          block
          plain
          type="danger"
          @click="clearInput"
          style="margin-bottom: 10px;"
      >
        清空当前内容
      </van-button>
      <!-- 提交按钮 -->
      <van-button round block type="primary" native-type="submit">
        提交
      </van-button>
    </div>
  </van-form>
</template>

<script setup lang="ts"> // 建议使用 ts
import { useRoute, useRouter } from "vue-router";
import { ref, Ref } from "vue"; // 引入 Ref
import myAxios from "../plugins/myAxios";
import { Toast, Form, Field, RadioGroup, Radio, Button } from "vant"; // 确保导入所需组件
import { getCurrentUser } from "../services/user";

const route = useRoute();
const router = useRouter();

// 定义 ref 的类型
const editUser: Ref<{
    editKey: string | null;
    currentValue: any; // 可以是 string, number, null 等
    genderText: string; // 用于性别单选框
    editName: string | null;
}> = ref({
  editKey: route.query.editKey as string ?? null,
  currentValue: route.query.currentValue ?? '',
  // 初始化 genderText: 如果是编辑性别，根据 currentValue (0 或 1) 设置；否则为空
  genderText: (route.query.editKey === 'gender')
                ? (route.query.currentValue === '0' ? '男' : (route.query.currentValue === '1' ? '女' : ''))
                : '',
  editName: route.query.editName as string ?? null,
});

// 提交表单
const onSubmit = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    Toast.fail('用户未登录');
    router.push('/user/login'); // 跳转到登录
    return;
  }

  let valueToUpdate = editUser.value.currentValue;

  // 如果是编辑性别，根据 genderText 更新 valueToUpdate
  if (editUser.value.editKey === 'gender') {
    if (editUser.value.genderText === '男') {
      valueToUpdate = 0;
    } else if (editUser.value.genderText === '女') {
      valueToUpdate = 1;
    } else {
      // 如果性别未选择，可以根据业务需求决定如何处理
      // 选项1: 不允许提交
       Toast('请选择性别');
       return;
      // 选项2: 提交 null 或特定值表示未设置 (假设后端允许)
      // valueToUpdate = null;
    }
  }

  // 防止 editKey 为 null 时提交
  if (!editUser.value.editKey) {
      Toast.fail('无效的编辑项');
      return;
  }

  try {
    const res = await myAxios.post('/user/update', {
      id: currentUser.id,
      [editUser.value.editKey]: valueToUpdate, // 使用 valueToUpdate
    });

    console.log(res, '更新请求');
    if (res.code === 0 && res.data > 0) {
      Toast.success('修改成功');
      // 返回上一页前，可能需要更新本地缓存的用户信息，或让上一页重新加载
      router.back();
    } else {
      Toast.fail(res.message || '修改失败'); // 显示后端返回的错误信息
    }
  } catch (error: any) {
      console.error("更新失败:", error);
      Toast.fail(error?.message || '网络错误或服务器异常');
  }
};

// 清空输入内容
const clearInput = () => {
  if (editUser.value.editKey === 'gender') {
    editUser.value.genderText = ''; // 清空性别选择
  } else {
    editUser.value.currentValue = ''; // 清空其他输入框
  }
  Toast('内容已清空');
};
</script>

<style scoped>
/* 简介文本域样式 */
.bio-textarea {
  /* 如果需要，可以增加最小高度 */
  min-height: 100px;
}

/* 性别单选按钮组样式 */
/* van-field 包裹 radio-group 时，需要调整 label 和 input 的对齐 */
:deep(.gender-field .van-field__label) {
    width: auto; /* 让 label 宽度自适应 */
    margin-right: 16px; /* 增加 label 和 radio 之间的间距 */
}
.gender-radio-group {
    /* display: flex; */
    /* align-items: center; */
}
.gender-radio-group .van-radio {
  margin-right: 16px; /* 选项之间的间距 */
}
.gender-radio-group .van-radio:last-child {
  margin-right: 0;
}
</style>