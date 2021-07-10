<template>
  <div class="thread">
    <router-link to="/">タイトルに戻る</router-link>
    <h2>{{ thread.title }}</h2>
    <div v-for="comment in thread.comments.items" :key="comment.id">
      <div>{{ comment.title }}</div>
    </div>
  </div>
  <div class="commentForm">
    <form @submit.prevent="onCommentForm">
      <h3>コメントする</h3>
      <div>
        <label for="title">新しいコメント</label>
      </div>
      <div>
        <input id="title" v-model="commentForm.content" />
      </div>
      <div><input class="button" type="submit" value="送信" /></div>
    </form>
  </div>
</template>

<script>
import { useRoute } from "vue-router";
import { defineComponent, onMounted, onUnmounted, reactive, ref } from "vue";
import { API } from "@aws-amplify/api";
import { getThread } from "../graphql/queries";
import { createComment } from "../graphql/mutations";
import { onCommentByThreadId } from "../graphql/subscriptions";

export default defineComponent({
  setup() {
    const route = useRoute();

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

    onMounted(setUpPage);
    onUnmounted(unSubscription);

    return { onCommentForm, isNotFoundError, thread, commentForm };
  },
});
</script>
