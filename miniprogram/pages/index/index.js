// index.js
Page({
  data: {
    questionCounts: [
      { label: '10题', value: 10 },
      { label: '20题', value: 20 },
      { label: '30题', value: 30 },
      { label: '50题', value: 50 }
    ],
    selectedCount: 10
  },
  onLoad() {
  },
  selectCount(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedCount: value
    });
  },
  startQuiz() {
    wx.navigateTo({
      url: '../question/question',
      success: (res) => {
        res.eventChannel.emit('quizConfig', {
          questionCount: this.data.selectedCount
        });
      }
    });
  }
})
