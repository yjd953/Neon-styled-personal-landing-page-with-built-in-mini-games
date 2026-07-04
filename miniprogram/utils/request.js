// utils/request.js - 网络请求封装
// 功能：统一请求配置、自动携带 openid、统一错误处理、Promise 化返回

const app = getApp();

/**
 * 封装请求函数，自动携带 openid
 * 对 wx.request 做了三层封装：
 *   1. 默认 header 和 method
 *   2. 自动在 header 中注入 X-Openid（用户身份标识）
 *   3. 统一判断 code === 0 为成功，非 0 则 reject
 *
 * @param {Object} options - 请求配置，同 wx.request 参数
 * @param {string} options.url - 请求地址
 * @param {string} [options.method='GET'] - 请求方法
 * @param {Object} [options.header] - 请求头
 * @param {Object} [options.data] - 请求数据
 * @returns {Promise<Object>} - 成功时 resolve 完整 response data（含 code/data/message）
 *                              失败时 reject 错误信息（字符串）
 */
export function request(options) {
  // 默认配置
  const defaultOptions = {
    header: {
      'Content-Type': 'application/json'
    },
    method: 'GET'
  };

  // 合并用户配置和默认配置
  const finalOptions = { ...defaultOptions, ...options };

  // 从全局状态或本地缓存获取用户 openid，注入到请求头
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
  if (userInfo && userInfo.openid) {
    finalOptions.header['X-Openid'] = userInfo.openid;
  }

  // 返回 Promise，方便 async/await 或 .then() 调用
  return new Promise((resolve, reject) => {
    wx.request({
      ...finalOptions,
      success: (res) => {
        // 统一业务错误处理：后端约定 code === 0 表示成功
        if (res.data.code !== 0) {
          console.error('请求失败:', res.data.message);
          reject(res.data.message);
        } else {
          resolve(res.data);
        }
      },
      fail: (error) => {
        // 网络层错误（无网络、超时、域名不合法等）
        console.error('网络错误:', error);
        reject('网络错误，请检查网络连接');
      }
    });
  });
}

/**
 * 构建后端 API 完整地址
 * 将相对路径拼接到后端基础地址上
 *
 * @param {string} path - API 路径，如 '/api/v1/ai/chat'
 * @returns {string} - 完整的 API 地址
 */
export function buildApiUrl(path) {
  const baseUrl = 'YOUR_BACKEND_BASE_URL';
  return `${baseUrl}${path}`;
}
