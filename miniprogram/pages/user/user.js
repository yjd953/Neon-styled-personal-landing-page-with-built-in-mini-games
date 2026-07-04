// user.js
const app = getApp();
import { request, buildApiUrl } from '../../utils/request';
Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '',
      userId: ''
    },
    memberInfo: {
      level: '普通会员',
      benefit1: '基础练习',
      benefit2: '错题记录',
      benefit3: '学习报告'
    },
    memberships: [],
    isLogging: false
  },
  
  onLoad() {
    this.loadUserInfo();
    this.loadMemberInfo();
  },
  
  loadUserInfo() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (userInfo) {
      // 已登录，显示用户信息
      this.setData({
        userInfo: {
          avatarUrl: userInfo.avatar || '/images/avatar.png',
          nickName: userInfo.nickname || '用户',
          userId: userInfo.id || ''
        }
      });
    } else {
      // 未登录，执行登录
      this.login();
    }
  },
  
  login() {
    this.setData({ isLogging: true });
    const app = getApp();
    
    app.login().then(res => {
      const userInfo = res.data.user;
      this.setData({
        userInfo: {
          avatarUrl: userInfo.avatar || '/images/avatar.png',
          nickName: userInfo.nickname || '用户',
          userId: userInfo.id || ''
        },
        isLogging: false
      });
    }).catch(error => {
      console.error('登录失败:', error);
      this.setData({ isLogging: false });
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    });
  },
  
  loadMemberInfo() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (userInfo && userInfo.openid) {
      Promise.all([
        request({ url: buildApiUrl('/api/v1/memberships'), method: 'GET' }),
        request({ url: buildApiUrl('/api/v1/memberships/me'), method: 'GET' })
      ]).then(([allMembershipsRes, meRes]) => {
        const memberships = Array.isArray(allMembershipsRes.data) ? allMembershipsRes.data : [];
        const me = meRes.data;
        const activeMembership = me && me.status === 'active' ? me : null;
        const matched = activeMembership
          ? memberships.find((m) => m.id === activeMembership.membershipId)
          : null;

        this.setData({
          memberships,
          memberInfo: {
            level: matched?.name || matched?.level || '普通用户',
            benefit1: '基础练习',
            benefit2: '错题记录',
            benefit3: '学习报告'
          }
        });
      }).catch((message) => {
        console.error('获取会员信息失败:', message);
      });
    } else {
      // 未登录，使用默认会员信息
      this.setData({
        memberInfo: {
          level: '普通用户',
          benefit1: '基础练习',
          benefit2: '错题记录',
          benefit3: '学习报告'
        }
      });
    }
  },
  
  goToHistory() {
    wx.navigateTo({
      url: '../history/history'
    });
  },
  
  goToPurchases() {
    wx.navigateTo({
      url: '../purchases/purchases'
    });
  },
  
  goToSettings() {
    wx.navigateTo({
      url: '../settings/settings'
    });
  },
  
  // 手动触发登录
  handleLogin() {
    this.login();
  }
})
