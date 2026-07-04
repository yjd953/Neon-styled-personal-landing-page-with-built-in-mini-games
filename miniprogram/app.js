// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    // env 参数说明：
    // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会请求到哪个云环境的资源
    // 此处请填入环境 ID, 环境 ID 可在微信开发者工具右上顶部工具栏点击云开发按钮打开获取
    env: "",
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    
    // 检查登录状态
    this.checkLogin();
  },

  // 登录方法
  login() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getOpenId' }
      }).then((resp) => {
        const openid = resp?.result?.openid;
        if (!openid) {
          reject('获取 openid 失败');
          return;
        }

        wx.request({
          url: 'YOUR_BACKEND_BASE_URL/api/v1/users/onboard',
          method: 'GET',
          header: {
            'X-Openid': openid
          },
          success: (response) => {
            if (response.data.code === 0) {
              const userInfo = {
                ...response.data.data.user,
                openid: openid
              };
              this.globalData.userInfo = userInfo;
              wx.setStorageSync('userInfo', userInfo);
              resolve(response.data);
            } else {
              reject(response.data.message);
            }
          },
          fail: (error) => {
            reject(error);
          }
        });
      }).catch((e) => {
        reject(e);
      });
    });
  },

  // 检查登录状态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo;
      return true;
    }
    return false;
  },

  // 获取用户信息
  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo);
      } else {
        this.login()
          .then(() => {
            resolve(this.globalData.userInfo);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  }
});
