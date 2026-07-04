// purchases.js
import { request, buildApiUrl } from '../../utils/request';
Page({
  data: {
    purchaseList: [],
    loading: true
  },
  
  onLoad() {
    this.loadPurchases();
  },
  
  loadPurchases() {
    this.setData({ loading: true });
    request({
      url: buildApiUrl('/api/v1/purchases'),
      method: 'GET'
    }).then((res) => {
      const records = Array.isArray(res.data) ? res.data : [];
      const purchaseList = records.map((r) => {
        const dateObj = r.createdAt ? new Date(r.createdAt) : null;
        const date = dateObj
          ? `${dateObj.toISOString().split('T')[0]} ${dateObj.toTimeString().split(' ')[0].substring(0, 5)}`
          : '';
        const statusText = r.status === 'success' ? '已完成' : r.status === 'failed' ? '失败' : '处理中';
        return {
          id: r.id,
          product: r.membershipName || r.membershipLevel || `会员#${r.membershipId || ''}`,
          amount: r.amount,
          date,
          orderId: r.transactionId || '',
          status: statusText
        };
      });
      this.setData({ purchaseList });
    }).catch((message) => {
      console.error('获取购买记录失败:', message);
      wx.showToast({
        title: String(message || '获取购买记录失败'),
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
})
