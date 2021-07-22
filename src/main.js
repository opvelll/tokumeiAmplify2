import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import Amplify from "aws-amplify";
import aws_exports from "./aws-exports";

import {
  ElButton,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElContainer,
  ElHeader,
  ElMain,
  ElSpace,
  ElForm,
  ElFormItem,
  ElInput,
  ElCard,
} from "element-plus";

import {
  applyPolyfills,
  defineCustomElements,
} from "@aws-amplify/ui-components/loader";

Amplify.configure(aws_exports);
applyPolyfills().then(() => {
  defineCustomElements(window);
});

const app = createApp(App);

const components = [
  ElButton,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElContainer,
  ElHeader,
  ElMain,
  ElSpace,
  ElForm,
  ElFormItem,
  ElInput,
  ElCard,
];
components.forEach((component) => {
  app.component(component.name, component);
});

app.use(router).mount("#app");
