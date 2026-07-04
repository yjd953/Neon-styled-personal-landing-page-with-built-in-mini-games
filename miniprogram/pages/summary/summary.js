// summary.js
Page({
  data: {
    questionCount: 10,
    correctCount: 0,
    incorrectCount: 0,
    elapsedTime: 0,
    formattedTime: '00:00',
    wrongQuestions: []
  },
  
  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('summaryData', (data) => {
      const mins = Math.floor(data.elapsedTime / 60);
      const secs = data.elapsedTime % 60;
      const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      this.setData({
        questionCount: data.questionCount,
        correctCount: data.correctCount,
        incorrectCount: data.incorrectCount,
        elapsedTime: data.elapsedTime,
        formattedTime: formattedTime,
        wrongQuestions: data.wrongQuestions
      });
    });
  },
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  submitToAI() {
    // 构建提交给AI的字段
    const aiInput = {
      questionCount: this.data.questionCount,
      correctCount: this.data.correctCount,
      incorrectCount: this.data.incorrectCount,
      elapsedTime: this.data.elapsedTime,
      wrongQuestions: this.data.wrongQuestions.map(item => ({
        question: `${item.question} ${item.operator} ${item.number2} = ?`,
        correctAnswer: item.correctAnswer,
        userAnswer: item.userAnswer
      }))
    };
    
    // 显示AI处理中的提示
    wx.showLoading({
      title: 'AI生成报告中...',
      mask: true
    });
    
    // 模拟AI处理过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示AI生成的报告
      wx.showModal({
        title: 'AI学习报告',
        content: `根据你的答题情况，AI生成以下报告：\n\n你完成了${this.data.questionCount}道题目，正确${this.data.correctCount}道，错误${this.data.incorrectCount}道，用时${this.formatTime(this.data.elapsedTime)}。\n\n你的正确率为${Math.round((this.data.correctCount / this.data.questionCount) * 100)}%，表现${this.data.correctCount / this.data.questionCount > 0.8 ? '优秀' : this.data.correctCount / this.data.questionCount > 0.6 ? '良好' : '需要加强'}。\n\n建议：\n1. 多练习${this.data.wrongQuestions.length > 0 ? '错题' : '基础运算'}\n2. 提高计算速度和准确性\n3. 每天坚持练习10分钟`,
        showCancel: false,
        confirmText: '确定'
      });
    }, 2000);
  },
  
  goHome() {
    wx.switchTab({
      url: '../index/index'
    });
  }
})