import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';

function randomColor() {
  let arr = [];
  let color = '';
  for (let i = 0; i < 3; i++) {
    arr[i] = parseInt(Math.random() * 255);
  }
  color = `rgba(${arr[0]},${arr[1]},${arr[2]}, 0.25)`;
  return color
}

let order = 0;
let heightArr = [];

Page({
  data: {
    header: {},
    menuButton: {},
    // 搜索
    searchValue: '',
    // tab
    optionBest: [{
        text: '最佳',
        value: 0
      },
      {
        text: '最新',
        value: 'fresh'
      }
    ],
    optionCategory: [{
        text: '全部',
        value: 0
      },
      {
        text: '摄影图片',
        value: 1
      },
      {
        text: '插画',
        value: 2
      },
    ],
    optionStructure: [{
        text: '全部',
        value: 0
      },
      {
        text: '横图',
        value: 3
      },
      {
        text: '竖图',
        value: 4
      },
      {
        text: '方图',
        value: 5
      },
    ],
    optionColor: [{
        text: '全部',
        value: 0
      },
      {
        text: '黑白',
        value: 1
      },
      {
        text: '彩色',
        value: 2
      },
    ],
    filterTitleBest: '最佳',
    filterTitleCategory: '分类',
    filterTitleStructure: '构图',
    filterTitleColor: '色彩',
    valueBest: 0,
    valueCategory: 0,
    valueStructure: 0,
    valueColor: 0,

    // 窗口
    width: 0,
    height: 0,
    colWidth: 0,

    // 瀑布流数据
    colNum: 3,
    arrArr: [],
    page: {
      currentPage: 1,
      pageSize: 10,
      total: 0
    },
    isEmpty: true,
    // 是否加载中
    loadingMore: false,
    loadingInit: false
  },
  onChangeBest({
    detail
  }) {
    const obj = this.data.optionBest.find(el => el.value === detail);
    this.data.filterTitleBest = obj.text;

    this.setData({
      valueBest: detail,
      filterTitleBest: this.data.filterTitleBest
    })

    this.fetchInitData();
  },
  onChangeCategory({
    detail
  }) {
    if (detail === 0) {
      this.data.filterTitleCategory = '分类';
    } else {
      const obj = this.data.optionCategory.find(el => el.value === detail);
      this.data.filterTitleCategory = obj.text;
    }
    this.setData({
      valueCategory: detail,
      filterTitleCategory: this.data.filterTitleCategory
    })

    this.fetchInitData();
  },
  onChangeStructure({
    detail
  }) {

    if (detail === 0) {
      this.data.filterTitleStructure = '构图';
    } else {
      const obj = this.data.optionStructure.find(el => el.value === detail);
      this.data.filterTitleStructure = obj.text;
    }
    this.setData({
      valueStructure: detail,
      filterTitleStructure: this.data.filterTitleStructure
    })

    this.fetchInitData();
  },
  onChangeColor({
    detail
  }) {
    if (detail === 0) {
      this.data.filterTitleColor = '色彩';
    } else {
      const obj = this.data.optionColor.find(el => el.value === detail);
      this.data.filterTitleColor = obj.text;
    }
    this.setData({
      valueColor: detail,
      filterTitleColor: this.data.filterTitleColor
    })

    this.fetchInitData();
  },
  // 搜索
  onSearch(val) {
    this.data.searchValue = val.detail;

    this.fetchInitData();
  },
  fetchInitData() {
    Toast.loading({
      duration: 0,
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.setData({
      loadingInit: true
    })

    this.data.page.currentPage = 1;
    this.initArrArr();

    this.fetchData();
  },
  // 初始化
  onLoad() {
    this.setData({
      menuButton: wx.getMenuButtonBoundingClientRect()
    });

    wx.createSelectorQuery().select('#header').boundingClientRect(rect => {
      this.setData({
        header: rect
      })
    }).exec();

    wx.createSelectorQuery().select('#waterfall-list').boundingClientRect((rect) => {
      const w = Number.parseInt(rect.width);
      const colWidth = Math.floor(w / this.data.colNum);
      this.setData({
        height: wx.getSystemInfoSync().windowHeight,
        width: w,
        colWidth: colWidth
      });
    }).exec();

     this.fetchInitData();
  },
  // 获取数据
  fetchData() {
    const params = {};
    params.phrase = this.data.searchValue;
    params.page = this.data.page.currentPage;

    if (this.data.valueStructure !== 0) {
      params['creativeColorType[]'] = this.data.valueStructure;
    }

    if (this.data.valueColor !== 0) {
      params['colorType[]'] = this.data.valueColor;
    }

    if (this.data.valueCategory !== 0) {
      params.graphicalStyle = this.data.valueCategory;
    }

    if (this.data.valueBest !== 0) {
      params.sort = this.data.valueBest;
    }

    wx.request({
      url: 'https://www.vcg.com/api/common/searchAllImage',
      data: params,
      success: (res) => {
        const data = res.data;
        let list = data.list || [];

        list = list.filter(el => {
          return this.validImage(el);
        })

        // 设置宽高
        list = list.map(el => {
          const obj = {};
          obj.id = el.id;
          obj.order = order++;

          // 每一项的宽高
          const p = el.height / el.width;
          obj.w = this.data.colWidth;
          obj.h = Math.floor(obj.w * p);

          // 获取、设置url
          obj.url = this.getUrl(el);
          obj.previewUrl = this.getPreviewUrl(el);

          // 图片随机背景色
          obj.backgroundColor = randomColor();

          return obj;
        })

        this.setList(list)
      },
      fail: (error) => {
        this.setData({
          loadingMore: false,
          loadingInit: false
        })

        console.log(error);
        Toast.fail('数据获取失败');
      }
    })
  },
  validImage(el) {
    const str = '//alifei';
    const p1 = el.width / el.height;
    const p2 = el.height / el.width;
    if (p1 > 3 || p2 > 3) {
      return false;
    }

    if (el.url800 && el.equalw_url && el.equalh_url) {
      if (el.url800.startsWith(str) && (el.equalw_url.startsWith(str) || el.equalh_url.startsWith(str))) {
        return true;
      }
    }

    return false;
  },
  getUrl(el) {
    const str = '//alifei';
    let url = 'https://images.weserv.nl/?url=';

    if (el.equalw_url.startsWith(str)) {
      url += el.equalw_url;
    } else if (el.equalh_url.startsWith(str)) {
      url += el.equalh_url;
    }
    return url;
  },
  getPreviewUrl(el) {
    let url = 'https://images.weserv.nl/?url=' + el.url800;
    return url;
  },
  initArrArr() {
    this.data.arrArr = [];
    heightArr = [];
    for (let i = 0; i < this.data.colNum; i++) {
      this.data.arrArr.push([]);
      heightArr.push(0);
    }
    this.setData({
      arrArr: this.data.arrArr
    });
  },
  // push
  setList(list) {
    const isEmpty = list.length === 0;

    for (let item of list) {
      const minIndex = this.getMinIndex();
      if (this.data.arrArr.length === 0) {
        this.initArrArr();
      }
      this.data.arrArr[minIndex].push(item);
      heightArr[minIndex] += item.h;
    }

    this.setData({
      arrArr: this.data.arrArr,
      isEmpty: isEmpty
    }, () => {
      this.setData({
        loadingMore: false,
        loadingInit: false
      })
      Toast.clear();
    })
  },
  getMinIndex() {
    const minNum = Math.min(...heightArr);
    return heightArr.findIndex(num=>{
      return num<=minNum;
    });
  },
  // 底部触发
  onLower() {
    this.setData({
      loadingMore: true
    })
    this.data.page.currentPage++;
    this.fetchData();
  },
  // 预览图片
  onPreview(e) {
    const item = e.target.dataset.item || {}
    if (e.target.id && item.id + '' === e.target.id) {
      wx.previewImage({
        current: item.previewUrl, // 当前显示图片的http链接
        urls: [item.previewUrl]
      })
    }
  },
  onInputFocus() {
    this.selectComponent('#dropdown-item1').toggle(false);
    this.selectComponent('#dropdown-item2').toggle(false);
    this.selectComponent('#dropdown-item3').toggle(false);
    this.selectComponent('#dropdown-item4').toggle(false);
  }
})