import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

window.DebooBiometric = {
  check: () => BiometricAuth.checkBiometry(),

  authenticate: () => BiometricAuth.authenticate({
    reason: 'افتح تطبيق DEBOO16',
    androidTitle: 'تأكيد الهوية',
    androidSubtitle: 'استخدم بصمة الإصبع',
    cancelTitle: 'إلغاء',
    allowDeviceCredential: true
  })
};
