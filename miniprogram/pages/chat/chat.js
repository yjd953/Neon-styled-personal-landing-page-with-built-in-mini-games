// chat.js - AI 聊天页面
// 功能：对话列表展示、消息发送、AI回复、本地缓存聊天记录
import { request, buildApiUrl } from '../../utils/request';

/**
 * 生成消息唯一 ID
 * 用时间戳 + 随机数拼接，保证同一毫秒内也不冲突
 */
function nowId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/**
 * 生成本地缓存的 key
 * 按 openid 区分不同用户的聊天记录，未登录用 'guest'
 */
function storageKey(openid) {
  return `chatMessages:${openid || 'guest'}`;
}

Page({
  data: {
    messages: [],      // 消息列表，每条包含 id、role（user/assistant）、content
    input: '',         // 输入框内容
    sending: false,    // 是否正在发送（防重复提交）
    bottomId: 'bottom' // 用于滚动到底部的锚点 id
  },

  /**
   * 页面加载
   * 1. 获取用户信息（未登录则自动登录）
   * 2. 从本地 Storage 恢复历史聊天记录
   * 3. 如果没有历史记录，发送一条欢迎语
   */
  onLoad() {
    const app = getApp();
    Promise.resolve()
      .then(() => app.getUserInfo())
      .catch(() => app.globalData.userInfo || wx.getStorageSync('userInfo') || null)
      .then((userInfo) => {
        const openid = userInfo?.openid;
        const cached = wx.getStorageSync(storageKey(openid));
        // 有缓存记录，直接恢复
        if (Array.isArray(cached) && cached.length) {
          this.setData({ messages: cached });
          this.scrollToBottom();
          return;
        }

        // 没有缓存，初始化一条欢迎消息
        const hello = {
          id: nowId(),
          role: 'assistant',
          content: '你好，我是你的口算练习助手。你可以把题目、错题、或者想练习的类型发给我。'
        };
        this.setData({ messages: [hello] });
        this.persistMessages([hello]);
        this.scrollToBottom();
      });
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  /**
   * 发送消息
   * 流程：
   * 1. 校验输入内容和发送状态
   * 2. 将用户消息加入列表并持久化
   * 3. 取最近 20 条消息作为上下文
   * 4. 调用后端 AI 接口获取回复
   * 5. 将 AI 回复加入列表并持久化
   * 6. 错误时显示错误消息
   */
  send() {
    const text = (this.data.input || '').trim();
    if (!text || this.data.sending) return;

    const app = getApp();
    // 构造用户消息
    const userMsg = { id: nowId(), role: 'user', content: text };
    const nextMessages = [...this.data.messages, userMsg];
    this.setData({
      messages: nextMessages,
      input: '',
      sending: true
    });
    this.persistMessages(nextMessages);
    this.scrollToBottom();

    // 取最近 20 条消息作为上下文（控制 token 用量）
    const payloadMessages = nextMessages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content
    }));

    Promise.resolve()
      .then(() => app.getUserInfo())
      .then(() => request({
        url: buildApiUrl('/api/v1/ai/chat'),
        method: 'POST',
        data: {
          messages: payloadMessages
        }
      }))
      .then((res) => {
        // 兼容不同后端返回字段：reply 或 content
        const reply = res?.data?.reply || res?.data?.content || '';
        const assistantMsg = {
          id: nowId(),
          role: 'assistant',
          content: reply || '我没有拿到回复内容，你可以再试一次。'
        };
        const finalMessages = [...this.data.messages, assistantMsg];
        this.setData({ messages: finalMessages });
        this.persistMessages(finalMessages);
        this.scrollToBottom();
      })
      .catch((message) => {
        // 请求失败也显示一条错误消息，让用户知道发生了什么
        const assistantMsg = {
          id: nowId(),
          role: 'assistant',
          content: `请求失败：${String(message || '未知错误')}`
        };
        const finalMessages = [...this.data.messages, assistantMsg];
        this.setData({ messages: finalMessages });
        this.persistMessages(finalMessages);
        this.scrollToBottom();
      })
      .finally(() => {
        this.setData({ sending: false });
      });
  },

  /**
   * 持久化聊天记录到本地 Storage
   * 按 openid 区分存储 key
   */
  persistMessages(messages) {
    const app = getApp();
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const openid = userInfo?.openid;
    wx.setStorageSync(storageKey(openid), messages);
  },

  /**
   * 滚动到消息列表底部
   * 通过修改 bottomId 触发锚点重新定位
   * （每次生成新的 id，确保即使内容相同也会重新滚动）
   */
  scrollToBottom() {
    this.setData({ bottomId: `bottom-${nowId()}` });
  }
});
