// app.js - 小程序全局入口
// 功能：云开发初始化、用户登录、身份识别、全局用户信息管理
App({
  globalData: {
    userInfo: null,  // 用户信息对象（登录后填充）
    token: null,     // 预留 token 字段
    // env 参数说明：
    // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会请求到哪个云环境的资源
    // 此处请填入环境 ID, 环境 ID 可在微信开发者工具右上顶部工具栏点击云开发按钮打开获取
    env: "",
  },

  /**
   * 小程序启动时执行
   * 1. 初始化云开发能力
   * 2. 检查本地缓存中的登录状态
   */
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

  /**
   * 用户登录
   * 流程：
   * 1. 调用云函数 getOpenId 获取当前用户的 openid
   * 2. 用 openid 调用后端 onboard 接口（登录或注册）
   * 3. 将返回的用户信息保存到 globalData 和本地 Storage
   * 4. 返回 Promise，方便调用方链式处理
   */
  login() {
    return new Promise((resolve, reject) => {
      // 第一步：通过云函数获取 openid（微信私有协议鉴权，安全可靠）
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getOpenId' }
      }).then((resp) => {
        const openid = resp?.result?.openid;
        if (!openid) {
          reject('获取 openid 失败');
          return;
        }

        // 第二步：调用后端 onboard 接口，用 openid 注册或查询用户
        wx.request({
          url: 'YOUR_BACKEND_BASE_URL/api/v1/users/onboard',
          method: 'GET',
          header: {
            'X-Openid': openid
          },
          success: (response) => {
            if (response.data.code === 0) {
              // 保存用户信息到全局变量和本地缓存
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

  /**
   * 检查登录状态
   * 从本地 Storage 读取 userInfo，如果存在且有 openid 则恢复登录态
   * @returns {boolean} 是否已登录
   */
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo;
      return true;
    }
    return false;
  },

  /**
   * 获取用户信息（Promise 化）
   * 如果已登录直接返回，未登录则先执行登录
   * 方便各页面在需要用户身份时统一调用
   */
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
