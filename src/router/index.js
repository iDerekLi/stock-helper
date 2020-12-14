import Vue from "vue";
import VueRouter from "vue-router";
import NotFount from "../views/error.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/popup.html"
  },
  {
    path: "/popup.html",
    name: "popup",
    component: () => import("../views/popup.vue")
  },
  {
    path: "*",
    name: "error",
    component: NotFount
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
