// question.js
// 全局变量存储触摸点坐标
var arrx = [];
var arry = [];
var arrz = [];
var canvasw = 0;
var canvash = 0;

Page({
  data: {
    questions: [],
    currentQuestion: 0,
    currentQuestionData: {},
    userAnswer: '',
    feedback: '',
    isCorrect: false,
    correctCount: 0,
    incorrectCount: 0,
    elapsedTime: 0,
    formattedTime: '00:00',
    timer: null,
    isDrawing: false,
    questionCount: 10,
    wrongQuestions: [],
    canvasLeft: 0,
    canvasTop: 0,
    accessToken: '',
    isGettingToken: false,
    isInputting: false
  },
  
  onLoad() {
    this.ctx = null;
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('quizConfig', (data) => {
      this.setData({ questionCount: data.questionCount });
    });
    this.generateQuestions();
    this.setCurrentQuestion();
    this.startTimer();
    this.getAccessToken();
  },

  onReady() {
    this.initCanvas();
  },
  
  // 获取百度API的access token
  getAccessToken() {
    this.setData({ isGettingToken: true });
    const apiKey = 'YOUR_BAIDU_API_KEY';
    const secretKey = 'YOUR_BAIDU_SECRET_KEY';
    
    wx.request({
      url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      method: 'GET',
      success: (res) => {
        if (res.data.access_token) {
          this.setData({ accessToken: res.data.access_token });
          console.log('获取access token成功');
        } else {
          console.error('获取access token失败:', res.data);
        }
      },
      fail: (error) => {
        console.error('获取access token网络错误:', error);
      },
      complete: () => {
        this.setData({ isGettingToken: false });
      }
    });
  },
  
  generateQuestions() {
    const questions = [];
    const operators = ['+', '-', '*', '/'];
    
    for (let i = 0; i < this.data.questionCount; i++) {
      const operator = operators[Math.floor(Math.random() * operators.length)];
      let number1, number2, answer;
      
      switch (operator) {
        case '+':
          number1 = Math.floor(Math.random() * 100);
          number2 = Math.floor(Math.random() * 100);
          answer = number1 + number2;
          break;
        case '-':
          number1 = Math.floor(Math.random() * 100) + 1;
          number2 = Math.floor(Math.random() * number1);
          answer = number1 - number2;
          break;
        case '*':
          number1 = Math.floor(Math.random() * 20);
          number2 = Math.floor(Math.random() * 20);
          answer = number1 * number2;
          break;
        case '/':
          number2 = Math.floor(Math.random() * 10) + 1;
          answer = Math.floor(Math.random() * 20);
          number1 = number2 * answer;
          break;
      }
      
      questions.push({
        question: number1.toString(),
        operator: operator,
        number2: number2.toString(),
        answer: answer.toString()
      });
    }
    
    this.setData({ questions });
  },
  
  setCurrentQuestion() {
    const currentQuestionData = this.data.questions[this.data.currentQuestion];
    this.setData({ 
      currentQuestionData,
      userAnswer: '',
      feedback: ''
    });
    this.clearCanvas();
  },
  
  startTimer() {
    // 清除可能存在的旧计时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 重置计时器
    this.setData({ 
      elapsedTime: 0,
      formattedTime: '00:00'
    });
    
    // 启动新计时器
    const that = this;
    this.data.timer = setInterval(function() {
      const newElapsedTime = that.data.elapsedTime + 1;
      const mins = Math.floor(newElapsedTime / 60);
      const secs = newElapsedTime % 60;
      const newFormattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      that.setData({
        elapsedTime: newElapsedTime,
        formattedTime: newFormattedTime
      });
    }, 1000);
  },
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  initCanvas() {
    const sys = wx.getSystemInfoSync();
    canvasw = sys.windowWidth;
    canvash = Math.floor((sys.windowWidth * 300) / 750);

    this.ctx = wx.createCanvasContext('handwriting', this);
    this.clearCanvas();
  },
  
  startDrawing(e) {
    this.setData({ isDrawing: true, isInputting: true });
    if (!this.ctx) return;
    const point = e.touches && e.touches[0];
    if (!point) return;
    const x = point.x ?? point.clientX ?? 0;
    const y = point.y ?? point.clientY ?? 0;
    arrz.push(0);
    arrx.push(x);
    arry.push(y);
  },
  
  draw(e) {
    if (!this.data.isDrawing) return;
    if (!this.ctx) return;
    const point = e.touches && e.touches[0];
    if (!point) return;
    const x = point.x ?? point.clientX ?? 0;
    const y = point.y ?? point.clientY ?? 0;
    arrz.push(1);
    arrx.push(x);
    arry.push(y);
    
    // 绘制所有触摸点
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < arrx.length; i++) {
      if (arrz[i] === 0) {
        ctx.moveTo(arrx[i], arry[i]);
      } else {
        ctx.lineTo(arrx[i], arry[i]);
      }
    }
    ctx.setStrokeStyle('#000');
    ctx.setLineWidth(5);
    ctx.setLineCap('round');
    ctx.setLineJoin('round');
    ctx.stroke();
    ctx.draw(true);
  },
  
  stopDrawing() {
    this.setData({ isDrawing: false, isInputting: false });
  },
  
  clearCanvas() {
    arrx = [];
    arry = [];
    arrz = [];
    this.setData({ isDrawing: false, isInputting: false });
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasw, canvash);
    ctx.setFillStyle('#fff');
    ctx.fillRect(0, 0, canvasw, canvash);
    ctx.draw(true);
  },
  
  submitAnswer() {
    this.setData({ isDrawing: false, isInputting: false });
    // 检查是否有access token
    if (!this.data.accessToken) {
      wx.showToast({
        title: '正在获取识别服务，请稍后重试',
        icon: 'none'
      });
      return;
    }
    
    // 将Canvas转换为图片
    wx.canvasToTempFilePath({
      canvasId: 'handwriting',
      destWidth: canvasw,
      destHeight: canvash,
      success: (res) => {
        // 将图片转换为base64
        this.base64Encode(res.tempFilePath, (base64Image) => {
          if (!base64Image) {
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
            return;
          }
          
          // 调用百度数字识别API
          wx.request({
            url: `https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?access_token=${this.data.accessToken}`,
            method: 'POST',
            header: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `image=${encodeURIComponent(base64Image)}`,
            success: (response) => {
              console.log('百度API返回结果:', response.data);
              
              // 检查返回状态
              if (response.data.error_code) {
                console.error('API错误:', response.data.error_msg);
                wx.showToast({
                  title: '识别服务错误，请重试',
                  icon: 'none'
                });
                return;
              }
              
              // 检查识别结果
              if (response.data.words_result && response.data.words_result.length > 0) {
                // 提取所有识别结果并合并
                let recognizedText = '';
                for (let item of response.data.words_result) {
                  recognizedText += item.words;
                }
                
                // 提取数字
                const answer = recognizedText.replace(/[^0-9]/g, '');
                console.log('识别结果:', recognizedText, '提取的数字:', answer);
                
                if (answer) {
                  this.setData({ userAnswer: answer });
                  this.checkAnswer(answer);
                } else {
                  wx.showToast({
                    title: '未识别到数字，请重试',
                    icon: 'none'
                  });
                }
              } else {
                wx.showToast({
                  title: '识别失败，请重试',
                  icon: 'none'
                });
              }
            },
            fail: (error) => {
              console.error('API调用失败:', error);
              wx.showToast({
                title: '识别请求失败，请检查网络与域名配置',
                icon: 'none'
              });
            }
          });
        });
      },
      fail: (error) => {
        console.error('Canvas转换失败:', error);
        wx.showToast({
          title: '图片生成失败，请重试',
          icon: 'none'
        });
      }
    }, this);
  },
  
  // 将图片转换为base64
  base64Encode(filePath, callback) {
    const fs = wx.getFileSystemManager();
    if (!filePath) {
      callback(null);
      return;
    }

    const readAsBase64 = (targetPath) => {
      fs.readFile({
        filePath: targetPath,
        encoding: 'base64',
        success: (res) => {
          callback(res.data);
        },
        fail: (error) => {
          console.error('读取文件失败:', error, targetPath);
          callback(null);
        }
      });
    };

    const requestAsBase64 = (targetUrl) => {
      wx.request({
        url: targetUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        success: (res) => {
          try {
            const base64 = wx.arrayBufferToBase64(res.data);
            callback(base64);
          } catch (error) {
            console.error('ArrayBuffer 转 base64 失败:', error, targetUrl);
            callback(null);
          }
        },
        fail: (error) => {
          console.error('通过 request 读取临时图片失败:', error, targetUrl);
          callback(null);
        }
      });
    };

    // 开发者工具中 canvasToTempFilePath 可能返回 http://tmp/...，
    // 先尝试用 getImageInfo 拿到实际本地路径，再退化到 request(arraybuffer)。
    if (/^https?:\/\/tmp\//.test(filePath)) {
      wx.getImageInfo({
        src: filePath,
        success: (infoRes) => {
          if (infoRes.path && !/^https?:\/\//.test(infoRes.path)) {
            readAsBase64(infoRes.path);
            return;
          }
          requestAsBase64(filePath);
        },
        fail: (error) => {
          console.error('获取临时图片信息失败:', error, filePath);
          requestAsBase64(filePath);
        }
      });
      return;
    }

    readAsBase64(filePath);
  },
  
  checkAnswer(answer) {
    const isCorrect = answer === this.data.currentQuestionData.answer;
    const feedback = isCorrect ? '回答正确！' : `回答错误，正确答案是 ${this.data.currentQuestionData.answer}`;
    
    let wrongQuestions = [...this.data.wrongQuestions];
    if (!isCorrect) {
      wrongQuestions.push({
        question: this.data.currentQuestionData.question,
        operator: this.data.currentQuestionData.operator,
        number2: this.data.currentQuestionData.number2,
        correctAnswer: this.data.currentQuestionData.answer,
        userAnswer: answer
      });
    }
    
    this.setData({
      feedback,
      isCorrect,
      correctCount: isCorrect ? this.data.correctCount + 1 : this.data.correctCount,
      incorrectCount: !isCorrect ? this.data.incorrectCount + 1 : this.data.incorrectCount,
      wrongQuestions: wrongQuestions
    });
    
    // 延迟一秒后进入下一题
    setTimeout(() => {
      this.nextQuestion();
    }, 1000);
  },
  
  nextQuestion() {
    const nextQuestion = this.data.currentQuestion + 1;
    if (nextQuestion < this.data.questionCount) {
      this.setData({ currentQuestion: nextQuestion });
      this.setCurrentQuestion();
    } else {
      this.finishQuiz();
    }
  },
  
  finishQuiz() {
    clearInterval(this.data.timer);
    
    // 提交答题记录到后端
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (userInfo && userInfo.openid) {
      // 计算正确率
      const accuracy = this.data.questionCount ? (this.data.correctCount / this.data.questionCount) : 0;

      const wrongQuestions = (this.data.wrongQuestions || []).map((item) => {
        const number2 = Number(item.number2);
        const correctAnswer = Number(item.correctAnswer);
        const userAnswer = Number(item.userAnswer);
        const question = `${item.question}${item.operator}${item.number2}=?`;
        return {
          question,
          operator: item.operator,
          number2: Number.isFinite(number2) ? number2 : item.number2,
          correctAnswer: Number.isFinite(correctAnswer) ? correctAnswer : item.correctAnswer,
          userAnswer: Number.isFinite(userAnswer) ? userAnswer : item.userAnswer
        };
      });
      
      // 调用后端 API 提交答题记录
      wx.request({
        url: 'YOUR_BACKEND_BASE_URL/api/v1/quiz-records',
        method: 'POST',
        header: {
          'X-Openid': userInfo.openid,
          'Content-Type': 'application/json'
        },
        data: {
          questionCount: this.data.questionCount,
          correctCount: this.data.correctCount,
          incorrectCount: this.data.incorrectCount,
          elapsedTime: this.data.elapsedTime,
          accuracy: accuracy,
          wrongQuestions: wrongQuestions
        },
        success: (res) => {
          console.log('提交答题记录成功:', res.data);
        },
        fail: (error) => {
          console.error('提交答题记录失败:', error);
        },
        complete: () => {
          // 跳转到结果页面
          wx.navigateTo({
            url: '../result/result',
            success: (res) => {
              res.eventChannel.emit('quizResult', {
                questionCount: this.data.questionCount,
                correctCount: this.data.correctCount,
                incorrectCount: this.data.incorrectCount,
                elapsedTime: this.data.elapsedTime,
                wrongQuestions: this.data.wrongQuestions
              });
            }
          });
        }
      });
    } else {
      // 未登录，直接跳转到结果页面
      wx.navigateTo({
        url: '../result/result',
        success: (res) => {
          res.eventChannel.emit('quizResult', {
            questionCount: this.data.questionCount,
            correctCount: this.data.correctCount,
            incorrectCount: this.data.incorrectCount,
            elapsedTime: this.data.elapsedTime,
            wrongQuestions: this.data.wrongQuestions
          });
        }
      });
    }
  }
})
