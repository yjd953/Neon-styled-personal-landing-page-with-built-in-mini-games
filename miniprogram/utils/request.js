// utils/request.js
const app = getApp();

/**
 * 封装请求函数，自动携带 openid
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回 Promise 对象
 */
export function request(options) {
  // 添加默认配置
  const defaultOptions = {
    header: {
      'Content-Type': 'application/json'
    },
    method: 'GET'
  };

  // 合并配置
  const finalOptions = { ...defaultOptions, ...options };

  // 携带 Openid
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
  if (userInfo && userInfo.openid) {
    finalOptions.header['X-Openid'] = userInfo.openid;
  }

  // 返回 Promise
  return new Promise((resolve, reject) => {
    wx.request({
      ...finalOptions,
      success: (res) => {
        // 处理错误
        if (res.data.code !== 0) {
          console.error('请求失败:', res.data.message);
          reject(res.data.message);
        } else {
          resolve(res.data);
        }
      },
      fail: (error) => {
        console.error('网络错误:', error);
        reject('网络错误，请检查网络连接');
      }
    });
  });
}

/**
 * 构建后端API地址
 * @param {string} path - API路径
 * @returns {string} - 完整的API地址
 */
export function buildApiUrl(path) {
  const baseUrl = 'YOUR_BACKEND_BASE_URL';
  return `${baseUrl}${path}`;
}
