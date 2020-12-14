<template>
  <div class="top-data">
    <div v-for="(item, index) in data" :key="index" class="top-dataitem" :class="item.statusName">
      <label class="td-name">{{ item.name }}</label>
      <strong class="td-current">{{ item.current }}</strong>
      <div class="td-info">
        <span class="td-jump"
          >{{ getValueSymbol(item.status) }}{{ item.jump.replace("-", "") }}</span
        >
        <span class="td-jumpratio"
          >{{ getValueSymbol(item.status) }}{{ item.jumpRatio.replace("-", "") }}</span
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "top-data",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getValueSymbol(value) {
      return value > 0 ? "+" : value < 0 ? "-" : "";
    }
  }
};
</script>

<style lang="scss" scoped>
.top-data {
  display: flex;
  flex-direction: row;
  padding: 0;
  .top-dataitem {
    flex: 1;
    padding: 5px 0;
    margin: 0 2.5px;
    border-radius: 3px;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;

    &:first-child {
      margin-left: 0;
    }
    &:last-child {
      margin-right: 0;
    }

    .td-name,
    .td-current,
    .td-jump,
    .td-jumpratio {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .td-name,
    .td-current {
      display: block;
    }
    .td-current {
      font-weight: 600;
    }
    .td-info {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      font-size: 12px;
    }
    .td-jump,
    .td-jumpratio {
      flex: 1;
    }
  }
}
</style>
