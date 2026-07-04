// result.js
Page({
  data: {
    questionCount: 10,
    correctCount: 0,
    incorrectCount: 0,
    elapsedTime: 0,
    accuracy: 0,
    weakArea: '加减法',
    wrongQuestions: []
  },
  
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('quizResult', (data) => {
      const accuracy = Math.round((data.correctCount / data.questionCount) * 100);
      let weakArea;
      
      if (accuracy < 60) {
        weakArea = '基础运算';
      } else if (accuracy < 80) {
        weakArea = '乘除法';
      } else {
        weakArea = '混合运算';
      }
      
      this.setData({
        questionCount: data.questionCount,
        correctCount: data.correctCount,
        incorrectCount: data.incorrectCount,
        elapsedTime: data.elapsedTime,
        accuracy: accuracy,
        weakArea: weakArea,
        wrongQuestions: data.wrongQuestions
      });
    });
  },
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  restartQuiz() {
    wx.navigateTo({
      url: '../question/question'
    });
  },
  
  goHome() {
    wx.switchTab({
      url: '../index/index'
    });
  },
  
  goToSummary() {
    wx.navigateTo({
      url: '../summary/summary',
      success: (res) => {
        res.eventChannel.emit('summaryData', {
          questionCount: this.data.questionCount,
          correctCount: this.data.correctCount,
          incorrectCount: this.data.incorrectCount,
          elapsedTime: this.data.elapsedTime,
          wrongQuestions: this.data.wrongQuestions
        });
      }
    });
  }
})