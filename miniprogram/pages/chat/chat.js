import { request, buildApiUrl } from '../../utils/request';

function nowId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function storageKey(openid) {
  return `chatMessages:${openid || 'guest'}`;
}

Page({
  data: {
    messages: [],
    input: '',
    sending: false,
    bottomId: 'bottom'
  },

  onLoad() {
    const app = getApp();
    Promise.resolve()
      .then(() => app.getUserInfo())
      .catch(() => app.globalData.userInfo || wx.getStorageSync('userInfo') || null)
      .then((userInfo) => {
        const openid = userInfo?.openid;
        const cached = wx.getStorageSync(storageKey(openid));
        if (Array.isArray(cached) && cached.length) {
          this.setData({ messages: cached });
          this.scrollToBottom();
          return;
        }

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

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  send() {
    const text = (this.data.input || '').trim();
    if (!text || this.data.sending) return;

    const app = getApp();
    const userMsg = { id: nowId(), role: 'user', content: text };
    const nextMessages = [...this.data.messages, userMsg];
    this.setData({
      messages: nextMessages,
      input: '',
      sending: true
    });
    this.persistMessages(nextMessages);
    this.scrollToBottom();

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

  persistMessages(messages) {
    const app = getApp();
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const openid = userInfo?.openid;
    wx.setStorageSync(storageKey(openid), messages);
  },

  scrollToBottom() {
    this.setData({ bottomId: `bottom-${nowId()}` });
  }
});
