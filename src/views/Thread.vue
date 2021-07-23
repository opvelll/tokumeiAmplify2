<template>
  <el-header height="30px">
    <el-button icon="el-icon-back" @click="backMain">戻る</el-button>
  </el-header>
  <el-main>
    <h1>{{ thread.title }}</h1>
    <div class="thread">
      <el-table :data="thread.comments.items" style="margin-bottom: 24px">
        <el-table-column prop="title" label="コメント"> </el-table-column>
        <el-table-column prop="createdAt" label="投稿日"> </el-table-column>
      </el-table>
    </div>
    <div class="commentForm">
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>コメントを投稿する</span>
          </div>
        </template>
        <el-form label-position="top" :model="commentForm">
          <el-form-item>
            <el-input v-model="commentForm.content"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onCommentForm">投稿</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </el-main>
</template>

<script>
import { useRoute, useRouter } from "vue-router";
import { defineComponent, onMounted, onUnmounted, reactive, ref } from "vue";
import { API } from "@aws-amplify/api";
import { getThread } from "../graphql/queries";
import { createComment } from "../graphql/mutations";
import { onCommentByThreadId } from "../graphql/subscriptions";

export default defineComponent({
  setup() {
    const route = useRoute();
    const router = useRouter();

    const isNotFoundError = ref(false);
    const threadId = ref("");
    const thread = reactive({ title: "", comments: { items: [] } });
    const commentForm = reactive({ content: "" });
    const createCommentSubscription = ref({});

    const setUpPage = () => {
      getThreadData();
      setSubscription();
    };
    // ページの表示
    const getThreadData = async () => {
      threadId.value = route.params.threadId;
      console.log("threadId :", threadId.value);
      try {
        await getThreadAPI();
      } catch (e) {
        console.error(e);
      }
    };

    // サブスクリプション設定
    const setSubscription = async () => {
      createCommentSubscription.value = await API.graphql({
        query: onCommentByThreadId,
        variables: {
          threadId: threadId.value,
        },
      }).subscribe({
        next: (data) => {
          const newComment = data.value.data.onCommentByThreadId;
          console.log("newComment: ", newComment);
          // コメントが無ければ追加
          const idx = thread.comments.items.findIndex(
            (comment) => comment.id === newComment.id
          );
          console.log("idx :", idx);

          if (!(idx === -1)) return;
          pushCommentToList(newComment);
        },
      });
    };

    const unSubscription = () => {
      createCommentSubscription.value.unsubscribe();
      console.log("unsubscribe");
    };

    //コメントフォームをクリック時
    const onCommentForm = async () => {
      if (!commentForm.content) return;
      await createNewComment();
      clearCommentForm();
    };

    // 新しいコメントを作成
    const createNewComment = async () => {
      const { data } = await API.graphql({
        query: createComment,
        variables: {
          input: { threadId: threadId.value, title: commentForm.content },
        },
      });
      console.log("createNewComment :", data);
      pushCommentToList(data.createComment);
    };

    // list にコメントを追加する
    const pushCommentToList = (newComment) => {
      thread.comments.items.push(newComment);
    };

    // スレッドの取得
    const getThreadAPI = async () => {
      const { data } = await API.graphql({
        query: getThread,
        variables: { id: threadId.value },
      });
      console.log(data);
      Object.assign(thread, data.getThread);
    };

    const clearCommentForm = () => {
      commentForm.content = "";
    };

    const backMain = () => {
      router.push("/");
    };

    onMounted(setUpPage);
    onUnmounted(unSubscription);

    return { onCommentForm, isNotFoundError, thread, commentForm, backMain };
  },
});
</script>
