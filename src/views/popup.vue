<template>
  <a-card class="page-widget" size="small" title="股票" :bordered="false">
    <template slot="extra">
      <a href="javascript:" @click="editing ? openSave() : openEdit()"
        ><a-icon :type="editing ? 'check' : 'edit'"
      /></a>
      <!--<a href="javascript:;" @click="reload"><a-icon type="reload"/></a>-->
    </template>
    <a-table
      class="result-table"
      :columns="columns"
      :data-source="data"
      size="middle"
      :pagination="false"
      :show-header="false"
    >
      <span class="data" slot="data" slot-scope="text">{{ text }}</span>
      <span slot="status" slot-scope="text, data" class="data status" :class="data.statusName">
        <span class="symbol">{{ getValueSymbol(data.status) }}</span>
        <span class="value">{{ text.replace("-", "") }}</span>
      </span>
      <template slot="operation" slot-scope="text, record">
        <a href="javascript:" @click="onDelete(record.id)" title="删除"><a-icon type="delete"/></a>
        <a href="javascript:" @click="onToTop(record.id)" title="置顶" style="margin-left: 10px"
          ><a-icon type="vertical-align-top"
        /></a>
      </template>
      <template slot="title">
        <TopData :data="topdata"></TopData>
      </template>
      <template slot="footer">
        <a-input
          placeholder="输入代码"
          v-model="keyword"
          size="small"
          @pressEnter="handleInputChange"
        >
          <a-icon slot="suffix" type="search" />
        </a-input>
      </template>
    </a-table>
  </a-card>
</template>

<script>
import axios from "axios";
import TopData from "@/components/top-data";
export default {
  name: "Popup",
  components: {
    TopData
  },
  data() {
    return {
      topdata: [],
      data: [],
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          align: "left",
          ellipsis: true
        },
        {
          title: "最新价",
          dataIndex: "current",
          key: "current",
          width: 80,
          align: "right",
          ellipsis: true,
          scopedSlots: { customRender: "data" }
        },
        {
          title: "涨幅",
          dataIndex: "jumpRatio",
          key: "jumpRatio",
          width: 70,
          align: "right",
          ellipsis: true,
          scopedSlots: { customRender: "status" }
        }
      ],
      from: {
        list: []
      },
      keyword: "",
      editing: false
    };
  },
  watch: {
    "from.list"() {
      localStorage.setItem("list", JSON.stringify(this.from.list));
    }
  },
  async mounted() {
    const localList = JSON.parse(localStorage.getItem("list"));

    if (!Array.isArray(localList) || localList.length === 0) {
      this.from.list = ["sh000001", "sz399001", "sz399006"];
    } else {
      this.from.list = localList;
    }
    this.reload();
    this.timer = this.setTimeout(this.reload, 1000 * 5);
  },
  beforeDestroy() {
    this.timer();
  },
  methods: {
    handleInputChange() {
      this.getCodeData(this.keyword).then(async data => {
        this.keyword = "";
        if (data.id && !this.from.list.includes(data.id)) {
          this.from.list.push(data.id);
        }
        try {
          const result = await this.getCurrentData(this.from.list);
          this.topdata = result.slice(0, 3);
          this.data = result.slice(3);
        } catch (e) {
          this.from.list.pop();
        }
      });
    },
    async reload() {
      const result = await this.getCurrentData(this.from.list);
      this.topdata = result.slice(0, 3);
      this.data = result.slice(3);
    },
    getValueSymbol(value) {
      return value > 0 ? "+" : value < 0 ? "-" : "";
    },
    openSave() {
      this.editing = false;
      this.columns = this.originColums;
    },
    openEdit() {
      this.editing = true;
      const originColums = this.columns;
      this.originColums = originColums;
      this.columns = [
        originColums[0],
        originColums[1],
        {
          title: "操作",
          dataIndex: "operation",
          key: "operation",
          width: 70,
          align: "center",
          scopedSlots: { customRender: "operation" }
        }
      ];
    },
    onDelete(id) {
      const dataSource = [...this.data];
      this.data = dataSource.filter(item => item.id !== id);

      const list = [...this.from.list];
      this.from.list = list.filter(item => item !== id);
    },
    onToTop(id) {
      const list = [...this.from.list];
      const nodeIndex = list.findIndex(item => item === id);
      if (nodeIndex !== -1) {
        const node = list.splice(nodeIndex, 1)[0];
        list.splice(3, 0, node);
        this.from.list = list;

        const data = [...this.data];
        const nodeData = data.splice(nodeIndex - 3, 1)[0];
        data.splice(0, 0, nodeData);
        this.data = data;
      }
    },
    /**
     * 获取实时数据
     * 前缀：hq_str_
     * https://hq.sinajs.cn/rn=1607478292903&list=sh000001,sz399006,sz002352
     */
    getCurrentData(list) {
      return new Promise((resolve, reject) => {
        axios({
          url: "https://hq.sinajs.cn",
          method: "get",
          params: {
            rn: Date.now(),
            list: list.join(",")
          }
        }).then(res => {
          const result = [];
          res.data.split(/\s?;\s?/).forEach(code => {
            const template = code.replace(/^var\s?hq_str_/, "").replace(/"/g, "");
            if (!template) return;

            let [id, tempData] = template.split("=");
            if (tempData === "FAILED") {
              reject();
              return;
            }
            tempData = tempData.split(",");

            const data = { id };

            let props;
            if (id.includes("gb_")) {
              props = [
                { key: 0, prop: "name" },
                { key: 5, prop: "today", fixed: 2 },
                { prop: "pre", fn: data => data[1] * 1 - data[4] * 1, fixed: 2 },
                { key: 1, prop: "current", fixed: 2 },
                { prop: "high", fn: () => "-" },
                { prop: "low", fn: () => "-" }
              ];
              console.log(id);
            } else {
              props = [
                { key: 0, prop: "name" },
                { key: 1, prop: "today" },
                { key: 2, prop: "pre" },
                { key: 3, prop: "current" },
                { key: 4, prop: "high" },
                { key: 5, prop: "low" }
              ];
            }

            props.forEach(({ key, prop, fn, fixed }) => {
              if (fn) {
                data[prop] = fn(tempData);
              } else {
                data[prop] = tempData[key];
              }

              if (fixed !== undefined) {
                data[prop] = (data[prop] * 1).toFixed(fixed);
              }
            });

            // 未开盘
            if (data.current * 1 === 0) {
              data.today = "-";
              data.current = "-";
              data.jump = "-";
              data.jumpRatio = "-";
              data.status = 0;
              data.statusName = "gary";
            } else {
              const jump = data.current - data.pre;
              const jumpRatio = (jump / data.pre) * 100;
              data.jump = !isNaN(jump) ? jump.toFixed(2) : "-";
              data.jumpRatio = !isNaN(jumpRatio) ? jumpRatio.toFixed(2) + "%" : "-";
              data.status = jump > 0 ? 1 : jump < 0 ? -1 : 0;
              data.statusName = jump > 0 ? "red" : jump < 0 ? "green" : "gary";
            }

            result.push(data);
          });

          resolve(result);
        });
      });
    },
    /**
     * 查询代码
     * callbackProp = name
     * https://suggest3.sinajs.cn/suggest/type=&key=002352&name=suggestdata_1607478596484
     */
    getCodeData(key) {
      const name = "suggestdata_" + Date.now();
      return new Promise(resolve => {
        axios({
          url: "https://suggest3.sinajs.cn/suggest/",
          method: "get",
          params: {
            type: "",
            key,
            name
          }
        }).then(res => {
          const data = res.data
            .replace(new RegExp(`\\s*var\\s+${name}="([\\S]*)";*\\s*`), "$1")
            .split(",");
          const area = data[1];

          let id = data[3];

          if (area === "41") {
            id = "gb_" + id;
          }

          resolve({
            id,
            code: data[2],
            name: data[4]
          });
        });
      });
    },
    setTimeout(fn, timeout) {
      let startTime = +new Date();
      let timer = null;

      const startSetInterval = interval => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          startTime += timeout;
          const endTime = +new Date();
          const deviation = endTime - startTime;

          const resolve = fn(endTime);

          if (resolve instanceof Promise) {
            resolve.then(() => {
              if (timer) {
                startSetInterval(timeout - deviation);
              }
            });
          } else {
            if (timer) {
              startSetInterval(timeout - deviation);
            }
          }
        }, interval);
      };

      const stopSetInterval = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        return 1;
      };

      startSetInterval(timeout);

      return stopSetInterval;
    }
  }
};
</script>

<style lang="scss" scoped>
.page-widget {
  width: 300px;
  max-height: 600px;
  &::v-deep {
    .ant-card-body {
      padding: 0;
    }
  }
}

.result-table {
  margin: 5px;
  &::v-deep {
    .ant-table-title {
      padding: 0;
    }
    th,
    td {
      padding: 8px 0 !important;
      font-size: 12px;
    }

    .data {
      overflow: hidden;
      display: block;
      padding: 2px 4px;
      margin-left: 4px;
      border-radius: 3px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .status {
      .symbol {
        float: left;
      }
    }
  }
}
</style>
