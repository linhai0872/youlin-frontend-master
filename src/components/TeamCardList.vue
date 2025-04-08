<template>
  <div id="teamCardList">
    <!-- 加载骨架屏 -->
    <van-skeleton title :row="3" :loading="props.loading" v-for="index in 4" :key="`skeleton-${index}`" style="margin-bottom: 12px;">
      <!-- 这里是实际内容，骨架屏加载时会覆盖 -->
    </van-skeleton>

    <!-- 实际卡片列表，loading 为 false 时显示 -->
    <template v-if="!props.loading">
      <van-card
        v-for="team in props.teamList"
        :key="team.id"
        :thumb="team.createUser?.avatarUrl || defaultAvatar"
        :desc="team.description || '暂无描述'"
        :title="`${team.name}`"
        @click="showTeamDetail(team)"
        class="team-card"
      >
        <template #tags>
          <van-tag plain :type="getTagType(team.status)" style="margin-right: 8px; margin-top: 8px">
            {{ teamStatusEnum[team.status] }}
          </van-tag>
          <van-tag
            v-if="team.hasJoinNum && team.hasJoinNum >= team.maxNum"
            plain type="warning" style="margin-right: 8px; margin-top: 8px"
          >
            已满员
          </van-tag>
        </template>

        <template #bottom>
          <div class="card-bottom-info">
            <van-icon name="friends-o" /> {{ `${team.hasJoinNum ?? '?'}/${team.maxNum}` }}
          </div>
          <div class="card-bottom-info" v-if="team.createUser">
            <van-icon name="manager-o" /> 队长: {{ team.createUser.username || '未知' }}
          </div>
          <div class="card-bottom-info">
            <van-icon name="calendar-o" /> {{ team.expireTime ? formatDateTime(team.expireTime) : "长期有效" }}
          </div>
        </template>
        <template #footer>
          <div class="card-actions">
              <!-- 加入队伍 -->
              <van-button
                size="small" type="primary"
                v-if="currentUser && Number(team.createUser?.id) !== Number(currentUser.id) && !team.hasJoin"
                plain icon="add-o" @click.stop="preJoinTeam(team)" > 加入队伍 </van-button>
                <!-- *** 新增聊天按钮 *** -->
                <van-button size="small" plain v-if="team.hasJoin"
                            icon="chat-o" type="primary"
                            :to="`/team/${team.id}/chat`">
                  聊天
                </van-button>
              <!-- 更新队伍 -->
              <van-button
                v-if="currentUser && Number(team.createUser?.id) === Number(currentUser.id)"
                size="small" plain icon="edit" @click.stop="doUpdateTeam(team.id)" > 更新队伍 </van-button>
              <!-- 退出队伍 -->
              <van-button
                v-if="currentUser && Number(team.createUser?.id) !== Number(currentUser.id) && team.hasJoin"
                size="small" plain icon="log-out" @click.stop="doQuitTeam(team.id)" > 退出队伍 </van-button>
              <!-- 解散队伍 -->
              <van-button
                v-if="currentUser && Number(team.createUser?.id) === Number(currentUser.id)"
                size="small" type="danger" plain icon="delete-o" @click.stop="doDeleteTeam(team.id)" > 解散队伍 </van-button>
          </div>
        </template>
      </van-card>
    </template>

    <!-- 密码弹窗 -->
    <van-dialog
      v-model:show="showPasswordDialog" title="请输入密码" show-cancel-button
      @confirm="doJoinTeam" @cancel="doJoinCancel" :before-close="beforeJoinDialogClose" >
      <van-field v-model="password" type="password" placeholder="请输入队伍密码" />
    </van-dialog>

    <!-- 队伍详情弹窗 -->
     <van-popup
        v-model:show="showDetailPopup" round position="bottom"
        style="height: 75%; padding-top: 4px;" closeable >
        <div class="team-detail-content" v-if="currentTeamDetail">
            <h2 style="text-align: center; margin: 10px 0;">{{ currentTeamDetail.name }}</h2>
            <van-cell-group inset>
                 <van-cell title="队伍ID" :value="currentTeamDetail.id" />
                 <van-cell title="队长">
                     <template #value>
                         <div style="display: flex; align-items: center; justify-content: flex-end;">
                             <van-image :src="currentTeamDetail.createUser?.avatarUrl || defaultAvatar" round width="20" height="20" style="margin-right: 5px;"/>
                             <span>{{ currentTeamDetail.createUser?.username || '未知' }}</span>
                         </div>
                     </template>
                 </van-cell>
                 <van-cell title="描述" value-class="cell-value-label" :label="currentTeamDetail.description || '暂无描述'" />
                 <van-cell title="状态" :value="teamStatusEnum[currentTeamDetail.status]" />
                 <van-cell title="人数" :value="`${currentTeamDetail.hasJoinNum ?? '?'}/${currentTeamDetail.maxNum}`" />
                 <van-cell title="过期时间" :value="currentTeamDetail.expireTime ? formatDateTime(currentTeamDetail.expireTime) : '长期有效'" />
                 <van-cell title="创建时间" :value="formatDateTime(currentTeamDetail.createTime)" />
            </van-cell-group>

            <van-cell-group inset title="队伍成员" style="margin-top: 15px;">
                 <div v-if="detailLoading" style="text-align: center; padding: 10px;"> <van-loading size="20px">加载成员中...</van-loading> </div>
                 <!-- 注意这里 v-for 的 :key，如果 member 没有 id，用 userId -->
                 <van-cell v-else-if="teamMembers.length > 0" v-for="member in teamMembers" :key="member.userId ?? `member-${Math.random()}`">
                     <template #title>
                         <div style="display: flex; align-items: center;">
                             <van-image :src="member.avatarUrl || defaultAvatar" round width="30" height="30" style="margin-right: 10px;"/>
                             <!-- 检查显示：如果 username 为 null，显示 userAccount -->
                             <span>{{ member.username || member.userAccount || '匿名用户' }}</span>
                             <!-- 队长标签判断：用 member.userId -->
                             <van-tag v-if="currentUser && Number(member.userId) === Number(currentTeamDetail.createUser?.id)" type="primary" style="margin-left: 8px;">队长</van-tag>
                         </div>
                     </template>
                     <template #right-icon>
                         <!-- **** 修改这里的 v-if 和 @click **** -->
                         <van-button
                             v-if="currentUser && Number(currentTeamDetail.createUser?.id) === Number(currentUser.id) && member.userId && Number(member.userId) !== Number(currentUser.id)"
                             size="mini" type="danger" plain
                             @click.stop="kickMember(member.userId, member.username || member.userAccount)">踢出</van-button>
                         <!-- **** 修改结束 **** -->
                     </template>
                 </van-cell>
                 <van-empty v-else description="暂无其他成员" image-size="80"/>
            </van-cell-group>
        </div>
     </van-popup>
  </div>
</template>

<script setup lang="ts">
import { TeamType } from "../models/team";
// ** 确保 UserType 包含 userId ** (如果你的 models/user.d.ts 没有 userId，需要添加，但通常 id 和 userId 不会同时存在，后端应该统一返回一种)
// 假设 UserType 至少包含 id 或 userId
import { UserType } from "../models/user";
import { teamStatusEnum } from "../constants/team";
import defaultAvatar from "../assets/logo.png";
import myAxios from "../plugins/myAxios";
import {
    Dialog, Toast, Card, Tag, Icon, Button, Popup, CellGroup, Cell, Image, Loading, Empty, Field, Skeleton
} from "vant"; // 确保导入 Skeleton
import { onMounted, ref } from "vue";
import { getCurrentUser } from "../services/user";
import { useRouter } from "vue-router";

// 定义 Props 接口
interface TeamCardListProps {
  teamList: TeamType[];
  loading: boolean; // 添加 loading prop
}

// 定义 Props，设置默认值
const props = withDefaults(defineProps<TeamCardListProps>(), {
  teamList: () => [] as TeamType[],
  loading: true, // 默认是加载状态
});


const showPasswordDialog = ref(false);
const password = ref("");
const joinTeamId = ref<number | null>(null);
const currentUser = ref<UserType | null>(null); // UserType 应该包含 id
const router = useRouter();
const showDetailPopup = ref(false);
const currentTeamDetail = ref<TeamType | null>(null);
// ** teamMembers 的类型应该是包含 userId 的 **
// 可以定义一个 TeamMemberType 或者确保 UserType 有 userId
// 这里我们假设 UserType 里有 userId
const teamMembers = ref<UserType[]>([]);
const detailLoading = ref(false);

onMounted(async () => { currentUser.value = await getCurrentUser(); });

function formatDateTime(dateTime: Date | string | null): string {
  if (!dateTime) return "N/A";
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  if (isNaN(date.getTime())) return "无效日期";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
const getTagType = (status: number) => {
  switch (status) { case 0: return "primary"; case 1: return "danger"; case 2: return "warning"; default: return "default"; }
};

const preJoinTeam = (team: TeamType) => {
  if (!currentUser.value) { Toast.fail("请先登录"); router.push("/user/login"); return; }
  joinTeamId.value = team.id;
  if (team.status === 1) { Dialog.alert({ title: "提示", message: `该队伍为私有队伍，请联系队长 (${team.createUser?.username || '队长'}) 申请加入。`, }).then(() => { joinTeamId.value = null; }); return; }
  if (team.status === 0) { doJoinTeam(); } else if (team.status === 2) { password.value = ""; showPasswordDialog.value = true; }
};
const doJoinCancel = () => { joinTeamId.value = null; password.value = ""; };
const beforeJoinDialogClose = (action: string) => { if (action === 'confirm' && !password.value) { Toast('请输入密码'); return false; } return true; };

const doJoinTeam = async () => {
  if (!joinTeamId.value) return;
  const teamToJoin = props.teamList.find(t => t.id === joinTeamId.value);
  const params: { teamId: number; password?: string } = { teamId: joinTeamId.value };
  if (teamToJoin?.status === 2) { if (!password.value && showPasswordDialog.value) { Toast('请输入密码'); return; } params.password = password.value; }
  const loadingToast = Toast.loading({ message: '正在加入...', forbidClick: true, duration: 0 });
  try {
      const res = await myAxios.post("/team/join", params);
      if (res?.code === 0) { Toast.success("加入成功"); showPasswordDialog.value = false; emit('refresh'); }
      else {
        let errorMsg = '加入失败';
        // 注意: 后端的描述可能不直接对应这些中文，需要根据实际返回调整
        switch (res?.description) {
            case '队伍已满': errorMsg = '队伍已满，无法加入'; break;
            case '队伍不存在': errorMsg = '队伍不存在或已解散'; break;
            case '禁止加入自己创建的队伍': errorMsg = '不能加入自己创建的队伍'; break; // 确认后端是否有此描述
            case '用户已加入队伍数达到上限': errorMsg = '您加入的队伍数量已达上限'; break; // 确认后端是否有此描述
            case '你已加入该队伍': errorMsg = '您已在该队伍中'; break; // 确认后端是否有此描述
            case '密码错误': errorMsg = '密码错误'; break;
            default: errorMsg = '加入失败' + (res?.description ? `，${res.description}` : '');
        } Toast.fail(errorMsg);
      }
  } catch (error) { console.error("加入队伍错误:", error); Toast.fail('网络错误，加入失败'); }
  finally { loadingToast.clear(); doJoinCancel(); }
};
const doUpdateTeam = (id: number) => { router.push({ path: "/team/update", query: { id } }); };
const doQuitTeam = async (id: number) => {
  Dialog.confirm({ title: '确认退出', message: '确定要退出该队伍吗？' }).then(async () => {
      const loadingToast = Toast.loading({ message: '正在退出...', forbidClick: true, duration: 0 });
      try { const res = await myAxios.post("/team/quit", { teamId: id }); if (res?.code === 0) { Toast.success("退出成功"); emit('refresh'); } else { Toast.fail("退出失败" + (res?.description ? `，${res.description}` : "")); } }
      catch (error) { Toast.fail("网络错误，退出失败"); } finally { loadingToast.clear(); }
  }).catch(() => {});
};
const doDeleteTeam = async (id: number) => {
  Dialog.confirm({ title: '确认解散', message: '确定要解散该队伍吗？此操作不可恢复！', confirmButtonColor: '#ee0a24', }).then(async () => {
       const loadingToast = Toast.loading({ message: '正在解散...', forbidClick: true, duration: 0 });
       try { const res = await myAxios.post("/team/delete", { id }); if (res?.code === 0) { Toast.success("解散成功"); emit('refresh'); } else { Toast.fail("解散失败" + (res?.description ? `，${res.description}` : "")); } }
       catch (error) { Toast.fail("网络错误，解散失败"); } finally { loadingToast.clear(); }
  }).catch(() => {});
};


const showTeamDetail = async (team: TeamType) => {
    currentTeamDetail.value = team;
    showDetailPopup.value = true;
    teamMembers.value = [];
    detailLoading.value = true;
    try {
        // ** 确保后端接口路径正确，参数 team.id 有效 **
        if (!team || !team.id) {
            throw new Error("无效的队伍信息");
        }
        const res = await myAxios.get(`/team/${team.id}/members`);
        console.log("获取成员列表响应:", res); // 添加日志
        if (res?.code === 0 && Array.isArray(res.data)) {
            // ** 确认 res.data 中对象的结构，是否包含 userId, username, userAccount, avatarUrl **
            teamMembers.value = res.data;
            console.log("Fetched team members:", JSON.stringify(teamMembers.value, null, 2));
        } else {
            Toast.fail('加载成员列表失败' + (res?.description ? `:${res.description}` : ''));
            teamMembers.value = [];
        }
    } catch (error) {
        console.error("获取成员列表错误:", error);
        Toast.fail('网络错误，加载成员失败');
        teamMembers.value = [];
    } finally {
        detailLoading.value = false;
    }
};

// **** 修改 kickMember 函数，确保传入的 memberId 是 userId ****
const kickMember = (memberUserId: number, memberName?: string) => { // 参数名改为 memberUserId 更清晰
    if (!currentTeamDetail.value || !currentUser.value) {
        console.error("踢出成员失败：缺少队伍或当前用户信息");
        Toast.fail('操作失败，请刷新重试');
        return;
    }
    const teamId = currentTeamDetail.value.id;

    // 检查传入的 memberUserId
    if (!teamId || teamId <= 0 || !memberUserId || memberUserId <= 0) {
        console.error(`踢出成员前检查失败：无效的 ID - teamId: ${teamId}, memberUserId: ${memberUserId}`);
        Toast.fail('操作失败：无效的用户或队伍ID');
        return;
    }

    Dialog.confirm({ title: '确认踢出', message: `确定要将成员 "${memberName || '该成员'}" 踢出队伍吗？`, })
      .then(async () => {
        const loadingToast = Toast.loading({ message: '正在操作...', forbidClick: true, duration: 0 });
        try {
            // ** 后端接口 /team/kick 期望的字段名是 kickedUserId **
            const payload = { teamId: teamId, kickedUserId: memberUserId };
            console.log("发起踢人请求，有效载荷:", payload);
            const res = await myAxios.post('/team/kick', payload);
            console.log("踢人响应:", res);
            if (res?.code === 0) {
                Toast.success('踢出成功');
                // ** 使用 memberUserId 来过滤 **
                teamMembers.value = teamMembers.value.filter(m => m.userId !== memberUserId);
                // 刷新外部列表，确保人数等信息更新
                emit('refresh');
                // 可以考虑是否需要关闭详情弹窗
                // showDetailPopup.value = false;
            } else {
                Toast.fail('踢出失败' + (res?.description ? `，${res.description}` : ''));
            }
        } catch (error) {
            console.error("踢出成员接口请求错误:", error);
            Toast.fail('网络错误，操作失败');
        } finally {
            loadingToast.clear();
        }
    }).catch(() => {});
};

const emit = defineEmits(['refresh']);
</script>

<style scoped>
/* 样式保持不变 */
#teamCardList { padding: 0 8px; }
.team-card { margin-bottom: 12px; border-radius: 8px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s ease-in-out; background-color: #fff; }
.team-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.card-bottom-info { font-size: 12px; color: #969799; margin-top: 6px; display: flex; align-items: center; }
.card-bottom-info .van-icon { margin-right: 4px; font-size: 14px; }
.card-actions { margin-top: 10px; padding-top: 10px; border-top: 1px solid #ebedf0; display: flex; justify-content: flex-end; gap: 8px; }
.team-detail-content { padding: 10px 16px 60px; overflow-y: auto; height: 100%; box-sizing: border-box; background-color: #f7f8fa; }
.team-detail-content .van-cell-group--inset { margin: 0 0 10px 0; }
.team-detail-content .van-cell { background-color: #fff; }
:deep(.cell-value-label .van-cell__label) { margin-top: 4px; line-height: 1.4; white-space: normal; word-break: break-word; }
/* :deep(.van-skeleton) { margin-bottom: 12px; padding: 16px; background-color: #fff; border-radius: 8px; } */
.van-empty { padding: 32px 0; background-color: transparent; }
:deep(.van-card__thumb img) { border-radius: 50%; }
:deep(.van-card__thumb) { margin-right: 12px; }
:deep(.van-image__error),
:deep(.van-image__loading),
:deep(.van-card__footer .van-button) {
   margin-left: 5px;
}
:deep(.van-card__title) { font-size: 16px; font-weight: bold; color: #323233; margin-bottom: 4px; }
:deep(.van-card__desc) { font-size: 13px; color: #646566; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; max-height: calc(1.4em * 2); }
</style>