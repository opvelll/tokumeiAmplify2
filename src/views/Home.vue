<template>
  <v-app-bar density="compact" flat
    ><v-app-bar-title>Amplify製・匿名掲示板</v-app-bar-title></v-app-bar
  >
  <v-divider></v-divider>
  <v-container>
    <div class="threadList">
      <v-list>
        <v-subheader>スレッド一覧</v-subheader>
        <v-list-item
          v-for="thread in threadList"
          :key="thread.id"
          :to="thread.id"
        >
          <v-list-item-title>{{ thread.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ thread.createdAt }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>

    <div class="createThreadForm">
      <form @submit.prevent="onSubmitForm">
        <v-subheader>スレッドを作成する</v-subheader>
        <div>
          <div>
            <label for="title">スレッド名</label>
          </div>
          <input id="title" v-model="createThreadForm.title" />
        </div>
        <div>
          <div>
            <label for="comment">最初のコメント</label>
          </div>
          <textarea id="comment" v-model="createThreadForm.firstComment">
          </textarea>
        </div>
        <v-btn>送信</v-btn>
      </form>
    </div>
  </v-container>
</template>

<script>
import { API } from "@aws-amplify/api";
import { byCreatedAt } from "../graphql/queries.js";
import { createComment, createThread } from "../graphql/mutations.js";
import { ref, reactive, onMounted } from "vue";

import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    // スレッドの一覧
    const threadList = ref([]);
    // スレッド作成フォーム
    const createThreadForm = reactive({ title: "", firstComment: "" });
    const errorMessage = ref("");

    // スレッド一覧の取得
    const getThreadList = async () => {
      const { data } = await API.graphql({
        query: byCreatedAt,
        variables: { type: "t", sortDirection: "DESC" },
      });
      console.log("getThread : ", data);
      threadList.value = data.byCreatedAt.items;
    };

    // 作成フォームをクリック時の挙動
    const onSubmitForm = async () => {
      // 片方でも空だったら終了
      if (!createThreadForm.title || !createThreadForm.firstComment) return;
      const newThread = await createNewThread();
      await createFirstComment(newThread.id);
      clearForm();
    };

    // スレッドの作成
    const createNewThread = async () => {
      const { data } = await API.graphql({
        query: createThread,
        variables: {
          input: {
            type: "t", // ソートするために同じ値を入れる
            title: createThreadForm.title,
          },
        },
      });
      console.log("createNewThread :", data);
      unshiftThreadToList(data.createThread);
      return data.createThread;
    };

    // スレッド最初のコメントの作成
    const createFirstComment = async (threadId) => {
      const res = await API.graphql({
        query: createComment,
        variables: {
          input: { threadId: threadId, title: createThreadForm.firstComment },
        },
      });
      console.log("createFirstComment :", res);
    };

    // 新しいスレッドをリストの先頭に追加する
    const unshiftThreadToList = (newThread) => {
      threadList.value.unshift(newThread);
    };

    // フォームをクリアする
    const clearForm = () => {
      createThreadForm.title = "";
      createThreadForm.firstComment = "";
    };

    onMounted(getThreadList);

    return { threadList, createThreadForm, errorMessage, onSubmitForm };
  },
});
</script>
