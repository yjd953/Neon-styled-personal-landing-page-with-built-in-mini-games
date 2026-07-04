// history.js
const app = getApp();
import { request, buildApiUrl } from '../../utils/request';
Page({
  data: {
    historyList: [],
    loading: true
  },
  
  onLoad() {
    this.loadHistory();
  },
  
  loadHistory() {
    this.setData({ loading: true });
    const userInfo = app.globalData.userInfo;
    
    if (userInfo && userInfo.openid) {
      request({
        url: buildApiUrl('/api/v1/quiz-records?page=0&size=10'),
        method: 'GET'
      }).then((res) => {
        const records = res.data?.content || [];
        const historyList = records.map(record => {
          const date = new Date(record.createdAt);
          const minutes = Math.floor(record.elapsedTime / 60);
          const seconds = record.elapsedTime % 60;
          return {
            id: record.id,
            date: `${date.toISOString().split('T')[0]} ${date.toTimeString().split(' ')[0].substring(0, 5)}`,
            score: Math.round((record.accuracy || 0) * 100),
            correct: record.correctCount,
            incorrect: record.incorrectCount,
            time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          };
        });
        this.setData({ historyList });
      }).catch((message) => {
        console.error('获取历史记录失败:', message);
      }).finally(() => {
        this.setData({ loading: false });
      });
    } else {
      // 未登录，使用默认数据
      this.setData({
        historyList: [
          {
            id: 1,
            date: '2026-03-06 10:30',
            score: 85,
            correct: 42,
            incorrect: 8,
            time: '05:30'
          },
          {
            id: 2,
            date: '2026-03-05 15:45',
            score: 78,
            correct: 39,
            incorrect: 11,
            time: '06:15'
          },
          {
            id: 3,
            date: '2026-03-04 09:20',
            score: 92,
            correct: 46,
            incorrect: 4,
            time: '04:45'
          }
        ],
        loading: false
      });
    }
  }
})
