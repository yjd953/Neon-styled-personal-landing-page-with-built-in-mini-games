// question.js - 答题页面核心逻辑
// 功能：Canvas 手写输入 + 百度 OCR 手写识别 + 随机出题 + 计时判题 + 错题记录 + 结果提交
// 全局变量说明：存储所有触摸点坐标，用于重绘画布
// arrx/arry 分别存放 x/y 坐标，arrz 标记该点是起笔(0)还是连笔(1)
var arrx = [];
var arry = [];
var arrz = [];
var canvasw = 0;
var canvash = 0;

Page({
  data: {
    questions: [],           // 题目数组
    currentQuestion: 0,      // 当前题目索引
    currentQuestionData: {}, // 当前题目数据
    userAnswer: '',          // 用户答案（识别后的数字）
    feedback: '',            // 对错反馈文字
    isCorrect: false,        // 当前答案是否正确
    correctCount: 0,         // 正确题数
    incorrectCount: 0,       // 错误题数
    elapsedTime: 0,          // 已用时（秒）
    formattedTime: '00:00',  // 格式化后的时间
    timer: null,             // 计时器句柄
    isDrawing: false,        // 是否正在书写
    questionCount: 10,       // 总题数
    wrongQuestions: [],      // 错题列表
    canvasLeft: 0,           // canvas 左偏移（预留）
    canvasTop: 0,            // canvas 上偏移（预留）
    accessToken: '',         // 百度 OCR access_token
    isGettingToken: false,   // 是否正在获取 token
    isInputting: false       // 是否处于输入状态（UI提示用）
  },

  // 页面加载：接收上一页传来的题量配置，生成题目，启动计时，获取 OCR token
  onLoad() {
    this.ctx = null;
    // 从首页 eventChannel 接收题量配置
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('quizConfig', (data) => {
      this.setData({ questionCount: data.questionCount });
    });
    this.generateQuestions(); // 生成随机题目
    this.setCurrentQuestion(); // 展示第一题
    this.startTimer();         // 启动计时器
    this.getAccessToken();     // 预获取百度 OCR 的 access_token
  },

  // 页面首次渲染完成：初始化 Canvas
  onReady() {
    this.initCanvas();
  },

  /**
   * 获取百度 OCR 的 access_token
   * 使用 API Key 和 Secret Key 向百度 OAuth 接口换取 token
   * token 后续会作为 query 参数拼在 OCR 请求 URL 中
   */
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

  /**
   * 生成随机题目
   * 随机选择 + - * / 四种运算符，每个运算符有不同的数值范围约束：
   *   - 加法：两个 0-99 的整数
   *   - 减法：被减数 1-100，减数小于被减数（保证结果非负）
   *   - 乘法：两个 0-19 的整数
   *   - 除法：先随机生成除数和商，反推被除数（保证整除）
   */
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
          // number1 至少为 1，number2 小于 number1，确保结果 >= 0
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
          // 先确定除数和商，再反推被除数，保证除法结果是整数
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

  /**
   * 设置当前题目
   * 切换到下一题时重置答案、反馈，并清空画布
   */
  setCurrentQuestion() {
    const currentQuestionData = this.data.questions[this.data.currentQuestion];
    this.setData({
      currentQuestionData,
      userAnswer: '',
      feedback: ''
    });
    this.clearCanvas();
  },

  /**
   * 启动计时器
   * 每秒更新 elapsedTime 和 formattedTime
   * 启动前先清除可能存在的旧计时器，防止重复计时
   */
  startTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    this.setData({
      elapsedTime: 0,
      formattedTime: '00:00'
    });

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

  /**
   * 秒数转 mm:ss 格式
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * 初始化 Canvas
   * 根据屏幕宽度计算画布尺寸（高度按 300rpx 换算）
   * 创建 Canvas 上下文并填充白色背景
   */
  initCanvas() {
    const sys = wx.getSystemInfoSync();
    canvasw = sys.windowWidth;
    // 300rpx 对应的像素高度 = 屏幕宽度 * 300 / 750
    canvash = Math.floor((sys.windowWidth * 300) / 750);

    this.ctx = wx.createCanvasContext('handwriting', this);
    this.clearCanvas();
  },

  /**
   * 开始书写（手指按下）
   * 记录第一个触摸点，标记为起笔点（arrz = 0）
   */
  startDrawing(e) {
    this.setData({ isDrawing: true, isInputting: true });
    if (!this.ctx) return;
    const point = e.touches && e.touches[0];
    if (!point) return;
    const x = point.x ?? point.clientX ?? 0;
    const y = point.y ?? point.clientY ?? 0;
    arrz.push(0); // 0 表示起笔（moveTo）
    arrx.push(x);
    arry.push(y);
  },

  /**
   * 书写中（手指移动）
   * 每移动一个点就追加到坐标数组，然后全量重绘画布
   * 重绘策略：遍历所有点，起笔点 moveTo，连笔点 lineTo
   * 这种全量重绘虽然性能不是最优，但能保证笔迹连贯不丢失
   */
  draw(e) {
    if (!this.data.isDrawing) return;
    if (!this.ctx) return;
    const point = e.touches && e.touches[0];
    if (!point) return;
    const x = point.x ?? point.clientX ?? 0;
    const y = point.y ?? point.clientY ?? 0;
    arrz.push(1); // 1 表示连笔（lineTo）
    arrx.push(x);
    arry.push(y);

    const ctx = this.ctx;
    ctx.beginPath();
    // 遍历所有历史点重绘整条路径
    for (let i = 0; i < arrx.length; i++) {
      if (arrz[i] === 0) {
        ctx.moveTo(arrx[i], arry[i]); // 起笔点
      } else {
        ctx.lineTo(arrx[i], arry[i]); // 连笔点
      }
    }
    // 画笔样式：黑色、5px 宽、圆角端点和连接
    ctx.setStrokeStyle('#000');
    ctx.setLineWidth(5);
    ctx.setLineCap('round');
    ctx.setLineJoin('round');
    ctx.stroke();
    ctx.draw(true); // true 表示保留上一次绘制内容
  },

  /**
   * 结束书写（手指抬起）
   */
  stopDrawing() {
    this.setData({ isDrawing: false, isInputting: false });
  },

  /**
   * 清空画布
   * 清空坐标数组 + 填充白色背景矩形
   */
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

  /**
   * 提交答案
   * 流程：检查 token -> canvas 导出图片 -> 转 base64 -> 调用百度 OCR -> 提取数字 -> 判题
   * 任何一步失败都会弹出对应提示
   */
  submitAnswer() {
    this.setData({ isDrawing: false, isInputting: false });
    // 预检查：如果还没拿到 token，提示用户稍后重试
    if (!this.data.accessToken) {
      wx.showToast({
        title: '正在获取识别服务，请稍后重试',
        icon: 'none'
      });
      return;
    }

    // 第一步：将 Canvas 内容导出为临时图片文件
    wx.canvasToTempFilePath({
      canvasId: 'handwriting',
      destWidth: canvasw,
      destHeight: canvash,
      success: (res) => {
        // 第二步：将临时图片转成 base64 编码（用于 OCR 接口）
        this.base64Encode(res.tempFilePath, (base64Image) => {
          if (!base64Image) {
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
            return;
          }

          // 第三步：调用百度手写识别 API
          wx.request({
            url: `https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?access_token=${this.data.accessToken}`,
            method: 'POST',
            header: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            // 百度 OCR 要求以 form 形式提交 base64 图片数据
            data: `image=${encodeURIComponent(base64Image)}`,
            success: (response) => {
              console.log('百度API返回结果:', response.data);

              // OCR 接口返回错误码
              if (response.data.error_code) {
                console.error('API错误:', response.data.error_msg);
                wx.showToast({
                  title: '识别服务错误，请重试',
                  icon: 'none'
                });
                return;
              }

              // 有识别结果：合并多行文字，提取纯数字
              if (response.data.words_result && response.data.words_result.length > 0) {
                let recognizedText = '';
                for (let item of response.data.words_result) {
                  recognizedText += item.words;
                }

                // 用正则去除非数字字符，只保留 0-9
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

  /**
   * 将图片文件转 base64 编码
   *
   * 兼容性说明：
   * - 真机上 canvasToTempFilePath 通常返回 wxfile:// 开头的本地路径，可直接 readFile
   * - 开发者工具可能返回 http://tmp/... 形式的临时路径，不能直接被 readFile 读取
   *   这种情况下先尝试 getImageInfo 获取真实本地路径
   *   如果还不行，则用 wx.request 以 arraybuffer 形式下载再转 base64
   *
   * @param {string} filePath - 图片路径
   * @param {function} callback - 回调函数，参数为 base64 字符串或 null
   */
  base64Encode(filePath, callback) {
    const fs = wx.getFileSystemManager();
    if (!filePath) {
      callback(null);
      return;
    }

    // 直接读取本地文件并转 base64
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

    // 通过 wx.request 以 arraybuffer 形式获取，再转 base64（兜底方案）
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

    // 开发者工具返回 http://tmp/... 路径时的兼容处理
    if (/^https?:\/\/tmp\//.test(filePath)) {
      wx.getImageInfo({
        src: filePath,
        success: (infoRes) => {
          // getImageInfo 返回的 path 通常是可读的本地路径
          if (infoRes.path && !/^https?:\/\//.test(infoRes.path)) {
            readAsBase64(infoRes.path);
            return;
          }
          // 如果还是 http 路径，走 request 兜底
          requestAsBase64(filePath);
        },
        fail: (error) => {
          console.error('获取临时图片信息失败:', error, filePath);
          requestAsBase64(filePath);
        }
      });
      return;
    }

    // 正常本地路径，直接读取
    readAsBase64(filePath);
  },

  /**
   * 判题
   * 将识别到的答案与正确答案字符串比较
   * 答错的题目连同用户答案收集到 wrongQuestions 中
   * 延迟 1 秒后进入下一题（让用户看清反馈）
   */
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

    // 延迟 1 秒给用户看反馈，再进入下一题
    setTimeout(() => {
      this.nextQuestion();
    }, 1000);
  },

  /**
   * 下一题 / 结束
   * 如果还有题目就切换，否则调用 finishQuiz 结束本轮练习
   */
  nextQuestion() {
    const nextQuestion = this.data.currentQuestion + 1;
    if (nextQuestion < this.data.questionCount) {
      this.setData({ currentQuestion: nextQuestion });
      this.setCurrentQuestion();
    } else {
      this.finishQuiz();
    }
  },

  /**
   * 结束答题
   * 1. 停止计时
   * 2. 已登录用户：将答题记录和错题提交到后端
   * 3. 未登录用户：直接跳转到结果页
   * 4. 无论提交成功或失败，最终都跳转到结果页（通过 eventChannel 传递数据）
   */
  finishQuiz() {
    clearInterval(this.data.timer);

    const app = getApp();
    const userInfo = app.globalData.userInfo;

    if (userInfo && userInfo.openid) {
      // 计算正确率
      const accuracy = this.data.questionCount ? (this.data.correctCount / this.data.questionCount) : 0;

      // 将错题数据格式化为后端需要的结构
      const wrongQuestions = (this.data.wrongQuestions || []).map((item) => {
        const number2 = Number(item.number2);
        const correctAnswer = Number(item.correctAnswer);
        const userAnswer = Number(item.userAnswer);
        const question = `${item.question}${item.operator}${item.number2}=?`;
        return {
          question,
          operator: item.operator,
          // 用 Number.isFinite 校验，转换失败就保留原始值
          number2: Number.isFinite(number2) ? number2 : item.number2,
          correctAnswer: Number.isFinite(correctAnswer) ? correctAnswer : item.correctAnswer,
          userAnswer: Number.isFinite(userAnswer) ? userAnswer : item.userAnswer
        };
      });

      // 提交答题记录到后端
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
          // 不管成功失败，都跳转到结果页（保证用户体验不被阻断）
          wx.navigateTo({
            url: '../result/result',
            success: (res) => {
              // 通过 eventChannel 向结果页传递答题数据
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
      // 未登录直接跳转，数据通过 eventChannel 传递
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
