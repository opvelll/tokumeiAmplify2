<template>
  <el-header height="30px"><span>匿名掲示板(AWS Amplify製)</span> </el-header>
  <el-main>
    <el-table
      style="margin-bottom: 24px"
      :data="threadList"
      @cell-click="onClickCell"
    >
      <el-table-column prop="title" label="スレッド名"> </el-table-column>
      <el-table-column prop="createdAt" label="作成日"> </el-table-column>
    </el-table>

    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>スレッドを作成する</span>
        </div>
      </template>
      <el-form label-position="top" :model="createThreadForm">
        <el-form-item label="スレッド名">
          <el-input v-model="createThreadForm.title"></el-input>
        </el-form-item>
        <el-form-item label="最初のコメント">
          <el-input v-model="createThreadForm.firstComment"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmitForm">作成</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-main>
</template>

<script>
import { useRouter } from "vue-router";
import { API } from "@aws-amplify/api";
import { byCreatedAt } from "../graphql/queries.js";
import { createComment, createThread } from "../graphql/mutations.js";
import { ref, reactive, onMounted } from "vue";

import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const router = useRouter();
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

    //cellをクリック
    const onClickCell = (row) => {
      router.push(row.id);
    };

    onMounted(getThreadList);

    return {
      onClickCell,
      threadList,
      createThreadForm,
      errorMessage,
      onSubmitForm,
    };
  },
});
</script>
