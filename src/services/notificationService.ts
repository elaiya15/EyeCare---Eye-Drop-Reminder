// src/services/notificationService.ts
class NotificationService {
  private hasPermission = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private alarmAudio = new Audio('/alarm.mp3'); // Ensure this file exists in /public

  constructor() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.setPreferredVoice();
      this.setPreferredVoice();
    }
    this.alarmAudio.loop = true;
  }

  private setPreferredVoice() {
    const voices = window.speechSynthesis.getVoices();
    this.selectedVoice =
      voices.find(v => v.lang === 'ta-IN') ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en')) ||
      null;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('❌ Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  // ✅ Updated to use Service Worker for PWA compatibility
  async showNotification(title: string, body: string): Promise<void> {
    const options: NotificationOptions = {
      body,
      icon: '/eye-icon.png',
      tag: 'eyecare-reminder',
      requireInteraction: true
    };

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, options }
        });
        console.log('✅ Notification sent to Service Worker');
      } else if (this.hasPermission) {
        new Notification(title, options);
        console.log('⚠️ Fallback to direct notification');
      } else {
        console.warn('❌ No permission to show notification');
        alert(`${title}: ${body}`);
      }
    } catch (error) {
      console.error('❌ Notification error:', error);
    }

    this.speak(`${title}. ${body}`);
    this.playBeep();
  }

  private speak(message: string): void {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(message);
      utter.voice = this.selectedVoice;
      utter.lang = this.selectedVoice?.lang || 'en-IN';
      utter.pitch = 1;
      utter.rate = 1;
      speechSynthesis.speak(utter);
    }
  }

  private playBeep(): void {
    const beep = new Audio('/reminder.mp3');
    beep.play().catch(() => console.warn('Beep blocked by autoplay policy'));
  }

  showPopupAlert(message: string, onStop: () => void): void {
    this.alarmAudio.currentTime = 0;
    this.alarmAudio.play().catch(() => console.warn('Alarm play failed'));

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center space-y-4">
        <h2 class="text-2xl font-bold text-red-600">⏰ Medication Alert</h2>
        <p class="text-gray-800">${message}</p>
        <button id="stop-alarm-btn" class="mt-4 px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition">
          Stop Alarm
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('stop-alarm-btn')?.addEventListener('click', () => {
      this.alarmAudio.pause();
      this.alarmAudio.currentTime = 0;
      overlay.remove();
      onStop();
    });
  }
}

export const notificationService = new NotificationService();
