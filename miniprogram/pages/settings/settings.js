import { request, buildApiUrl } from '../../utils/request';

Page({
  data: {
    enableSound: true,
    enableHaptics: true,
    saving: false
  },

  onLoad() {
    this.loadSettings();
  },

  loadSettings() {
    request({
      url: buildApiUrl('/api/v1/settings'),
      method: 'GET'
    }).then((res) => {
      const settings = res.data || {};
      this.setData({
        enableSound: settings.enableSound !== false,
        enableHaptics: settings.enableHaptics !== false
      });
    }).catch(() => {});
  },

  onToggleSound(e) {
    this.setData({ enableSound: !!e.detail.value });
  },

  onToggleHaptics(e) {
    this.setData({ enableHaptics: !!e.detail.value });
  },

  saveSettings() {
    if (this.data.saving) return;
    this.setData({ saving: true });

    request({
      url: buildApiUrl('/api/v1/settings'),
      method: 'PUT',
      data: {
        enableSound: this.data.enableSound,
        enableHaptics: this.data.enableHaptics
      }
    }).then(() => {
      wx.showToast({
        title: '已保存',
        icon: 'success'
      });
    }).catch((message) => {
      wx.showToast({
        title: String(message || '保存失败'),
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ saving: false });
    });
  }
});
