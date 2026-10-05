import type { Language } from '../context/LanguageContext';

/**
 * Copy for the phone/Google sign-in flow (AuthPage), the hidden admin login
 * (AdminAuthModal), and the post-login "verify your phone" card
 * (PhoneVerificationCard).
 */
export const authTranslations: Record<Language, {
  client: {
    backToHome: string;
    accountAccess: string;
    homeAriaLabel: string;
    signInTitle: string;
    enterCodeTitle: string;
    signInSubtitle: string;
    codeSentTo: (phone: string) => string;
    lockedForOneHour: string;
    otpIncorrectCodesEntered: (max: number) => string;
    sendAttemptsUsed: (max: number) => string;
    tryAgainIn: string;
    connectingToGoogle: string;
    continueWithGoogle: string;
    orWithMobileNumber: string;
    mobileNumberLabel: string;
    mobileNumberPlaceholder: string;
    sendingCode: string;
    lockedWithTime: (time: string) => string;
    sendVerificationCode: string;
    verificationCodeLabel: string;
    otpPlaceholder: string;
    verifyingCode: string;
    lockedParenTime: (time: string) => string;
    verifyAndEnterDashboard: string;
    changePhoneNumber: string;
    noMoreCodes: (time: string) => string;
    resendIn: (seconds: number) => string;
    resendCode: string;
    privacyNote: string;
    footerSecurePhoneVerification: string;
    errors: {
      invalidPhone: string;
      googleSignInFailed: string;
      sendFailedGeneric: string;
      networkErrorSending: string;
      enterCode: string;
      verificationFailedGeneric: string;
      invalidCodeGeneric: string;
      attemptsRemaining: (remaining: number) => string;
      resendFailedGeneric: string;
      sendLocked: (max: number, time: string) => string;
      verifyLocked: (max: number, time: string) => string;
    };
    success: {
      googleSignedIn: string;
      codeSentLastRequest: string;
      codeSentWithCount: (attempts: number, max: number) => string;
      verifiedSuccessfully: string;
      newCodeSentLastRequest: string;
      newCodeSentWithCount: (attempts: number, max: number) => string;
    };
  };
  admin: {
    closeModalAriaLabel: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPasswordAriaLabel: string;
    hidePasswordAriaLabel: string;
    signIn: string;
    errors: {
      missingFields: string;
      incorrectCredentials: string;
    };
  };
  phoneLink: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    sendingOtp: string;
    sendVerificationCode: string;
    otpLabel: string;
    changePhone: string;
    otpPlaceholder: string;
    verifying: string;
    verifyAndAccessDashboard: string;
    backToHome: string;
    signOut: string;
  };
}> = {
  en: {
    client: {
      backToHome: 'Back to home',
      accountAccess: 'Client Account Access',
      homeAriaLabel: 'RapiQR home',
      signInTitle: 'Client Sign In',
      enterCodeTitle: 'Enter Verification Code',
      signInSubtitle: 'Sign in with Google or enter your mobile number',
      codeSentTo: (phone) => `We sent a verification code to ${phone}`,
      lockedForOneHour: 'Locked for 1 hour',
      otpIncorrectCodesEntered: (max) => `${max} incorrect codes entered.`,
      sendAttemptsUsed: (max) => `${max} attempts used.`,
      tryAgainIn: 'Try again in',
      connectingToGoogle: 'Connecting to Google…',
      continueWithGoogle: 'Continue with Google',
      orWithMobileNumber: 'Or with mobile number',
      mobileNumberLabel: 'Mobile Number',
      mobileNumberPlaceholder: '10-digit mobile number',
      sendingCode: 'Sending Code…',
      lockedWithTime: (time) => `Locked · ${time}`,
      sendVerificationCode: 'Send Verification Code',
      verificationCodeLabel: 'Verification Code',
      otpPlaceholder: 'Enter code',
      verifyingCode: 'Verifying Code…',
      lockedParenTime: (time) => `Locked (${time})`,
      verifyAndEnterDashboard: 'Verify & Enter Dashboard',
      changePhoneNumber: 'Change phone number',
      noMoreCodes: (time) => `No more codes · ${time}`,
      resendIn: (seconds) => `Resend in ${seconds}s`,
      resendCode: 'Resend Code',
      privacyNote: 'By continuing, you agree to RapiQR’s Terms of Service & Privacy Policy.',
      footerSecurePhoneVerification: 'Secure phone verification.',
      errors: {
        invalidPhone: 'Please enter a valid 10-digit mobile number.',
        googleSignInFailed: 'Google sign-in failed. Please try again.',
        sendFailedGeneric: 'Failed to send verification code. Please try again.',
        networkErrorSending: 'Network error while sending verification code.',
        enterCode: 'Please enter the verification code.',
        verificationFailedGeneric: 'Verification failed. Please try again.',
        invalidCodeGeneric: 'Invalid verification code.',
        attemptsRemaining: (remaining) =>
          `(${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before a 1-hour lock)`,
        resendFailedGeneric: 'Failed to resend code. Please try again.',
        sendLocked: (max, time) =>
          `You've used all ${max} code requests. For your security, new codes are locked for 1 hour — try again in ${time}.`,
        verifyLocked: (max, time) =>
          `Too many incorrect codes (${max}/${max}). For your security, verification is locked for 1 hour — try again in ${time}.`,
      },
      success: {
        googleSignedIn: 'Signed in with Google! Loading dashboard…',
        codeSentLastRequest: 'Code sent. That was your last code request — new codes are locked for 1 hour.',
        codeSentWithCount: (attempts, max) =>
          `Verification code sent to your phone. (${attempts} of ${max} requests used)`,
        verifiedSuccessfully: 'Verified successfully! Loading dashboard…',
        newCodeSentLastRequest: 'New code sent. That was your last code request — new codes are locked for 1 hour.',
        newCodeSentWithCount: (attempts, max) => `New verification code sent. (${attempts} of ${max} requests used)`,
      },
    },
    admin: {
      closeModalAriaLabel: 'Close modal',
      title: 'Admin Access',
      subtitle: 'Sign in with the admin email and password.',
      emailLabel: 'Admin email',
      emailPlaceholder: 'admin email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Password',
      showPasswordAriaLabel: 'Show password',
      hidePasswordAriaLabel: 'Hide password',
      signIn: 'Sign In',
      errors: {
        missingFields: 'Enter the admin email and password.',
        incorrectCredentials: 'Incorrect email or password.',
      },
    },
    phoneLink: {
      title: 'Verify Phone Number',
      subtitle: 'Enter the verification code sent to your phone to access your dashboard.',
      phoneLabel: 'Mobile Phone Number',
      phonePlaceholder: '10-digit mobile number',
      sendingOtp: 'Sending OTP...',
      sendVerificationCode: 'Send Verification Code',
      otpLabel: 'Enter OTP Code',
      changePhone: 'Change Phone',
      otpPlaceholder: 'Enter code',
      verifying: 'Verifying...',
      verifyAndAccessDashboard: 'Verify & Access Dashboard',
      backToHome: '← Back to Home',
      signOut: 'Sign Out',
    },
  },
  hi: {
    client: {
      backToHome: 'होम पर वापस जाएं',
      accountAccess: 'क्लाइंट अकाउंट एक्सेस',
      homeAriaLabel: 'RapiQR होम',
      signInTitle: 'क्लाइंट साइन इन',
      enterCodeTitle: 'वेरिफिकेशन कोड दर्ज करें',
      signInSubtitle: 'Google से साइन इन करें या अपना मोबाइल नंबर दर्ज करें',
      codeSentTo: (phone) => `हमने ${phone} पर वेरिफिकेशन कोड भेजा है`,
      lockedForOneHour: '1 घंटे के लिए लॉक',
      otpIncorrectCodesEntered: (max) => `${max} गलत कोड दर्ज किए गए।`,
      sendAttemptsUsed: (max) => `${max} प्रयास उपयोग हो गए।`,
      tryAgainIn: 'फिर कोशिश करें',
      connectingToGoogle: 'Google से जुड़ रहे हैं…',
      continueWithGoogle: 'Google से जारी रखें',
      orWithMobileNumber: 'या मोबाइल नंबर से',
      mobileNumberLabel: 'मोबाइल नंबर',
      mobileNumberPlaceholder: '10 अंकों का मोबाइल नंबर',
      sendingCode: 'कोड भेजा जा रहा है…',
      lockedWithTime: (time) => `लॉक · ${time}`,
      sendVerificationCode: 'वेरिफिकेशन कोड भेजें',
      verificationCodeLabel: 'वेरिफिकेशन कोड',
      otpPlaceholder: 'कोड दर्ज करें',
      verifyingCode: 'कोड सत्यापित हो रहा है…',
      lockedParenTime: (time) => `लॉक (${time})`,
      verifyAndEnterDashboard: 'सत्यापित करें और डैशबोर्ड में जाएं',
      changePhoneNumber: 'मोबाइल नंबर बदलें',
      noMoreCodes: (time) => `अब और कोड नहीं · ${time}`,
      resendIn: (seconds) => `${seconds} सेकंड में फिर से भेजें`,
      resendCode: 'कोड फिर से भेजें',
      privacyNote: 'जारी रखकर, आप RapiQR की सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं।',
      footerSecurePhoneVerification: 'सुरक्षित फ़ोन सत्यापन।',
      errors: {
        invalidPhone: 'कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें।',
        googleSignInFailed: 'Google साइन-इन विफल रहा। कृपया फिर से कोशिश करें।',
        sendFailedGeneric: 'वेरिफिकेशन कोड भेजने में विफल। कृपया फिर से कोशिश करें।',
        networkErrorSending: 'वेरिफिकेशन कोड भेजते समय नेटवर्क में त्रुटि हुई।',
        enterCode: 'कृपया वेरिफिकेशन कोड दर्ज करें।',
        verificationFailedGeneric: 'सत्यापन विफल रहा। कृपया फिर से कोशिश करें।',
        invalidCodeGeneric: 'अमान्य वेरिफिकेशन कोड।',
        attemptsRemaining: (remaining) => `(1-घंटे के लॉक से पहले ${remaining} प्रयास शेष)`,
        resendFailedGeneric: 'कोड फिर से भेजने में विफल। कृपया फिर से कोशिश करें।',
        sendLocked: (max, time) =>
          `आपने सभी ${max} कोड रिक्वेस्ट उपयोग कर ली हैं। आपकी सुरक्षा के लिए, नए कोड 1 घंटे के लिए लॉक हैं — ${time} में फिर कोशिश करें।`,
        verifyLocked: (max, time) =>
          `बहुत अधिक गलत कोड (${max}/${max})। आपकी सुरक्षा के लिए, सत्यापन 1 घंटे के लिए लॉक है — ${time} में फिर कोशिश करें।`,
      },
      success: {
        googleSignedIn: 'Google से साइन इन हो गया! डैशबोर्ड लोड हो रहा है…',
        codeSentLastRequest: 'कोड भेजा गया। यह आपका आखिरी कोड रिक्वेस्ट था — नए कोड 1 घंटे के लिए लॉक हैं।',
        codeSentWithCount: (attempts, max) => `आपके फ़ोन पर वेरिफिकेशन कोड भेजा गया। (${max} में से ${attempts} रिक्वेस्ट उपयोग हुए)`,
        verifiedSuccessfully: 'सफलतापूर्वक सत्यापित! डैशबोर्ड लोड हो रहा है…',
        newCodeSentLastRequest: 'नया कोड भेजा गया। यह आपका आखिरी कोड रिक्वेस्ट था — नए कोड 1 घंटे के लिए लॉक हैं।',
        newCodeSentWithCount: (attempts, max) => `नया वेरिफिकेशन कोड भेजा गया। (${max} में से ${attempts} रिक्वेस्ट उपयोग हुए)`,
      },
    },
    admin: {
      closeModalAriaLabel: 'मोडल बंद करें',
      title: 'एडमिन एक्सेस',
      subtitle: 'एडमिन ईमेल और पासवर्ड से साइन इन करें।',
      emailLabel: 'एडमिन ईमेल',
      emailPlaceholder: 'एडमिन ईमेल',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'पासवर्ड',
      showPasswordAriaLabel: 'पासवर्ड दिखाएं',
      hidePasswordAriaLabel: 'पासवर्ड छुपाएं',
      signIn: 'साइन इन',
      errors: {
        missingFields: 'एडमिन ईमेल और पासवर्ड दर्ज करें।',
        incorrectCredentials: 'गलत ईमेल या पासवर्ड।',
      },
    },
    phoneLink: {
      title: 'फ़ोन नंबर सत्यापित करें',
      subtitle: 'अपने डैशबोर्ड तक पहुंचने के लिए अपने फ़ोन पर भेजा गया वेरिफिकेशन कोड दर्ज करें।',
      phoneLabel: 'मोबाइल फ़ोन नंबर',
      phonePlaceholder: '10 अंकों का मोबाइल नंबर',
      sendingOtp: 'OTP भेजा जा रहा है...',
      sendVerificationCode: 'वेरिफिकेशन कोड भेजें',
      otpLabel: 'OTP कोड दर्ज करें',
      changePhone: 'फ़ोन बदलें',
      otpPlaceholder: 'कोड दर्ज करें',
      verifying: 'सत्यापित किया जा रहा है...',
      verifyAndAccessDashboard: 'सत्यापित करें और डैशबोर्ड एक्सेस करें',
      backToHome: '← होम पर वापस जाएं',
      signOut: 'साइन आउट',
    },
  },
  gu: {
    client: {
      backToHome: 'હોમ પર પાછા જાઓ',
      accountAccess: 'ક્લાયન્ટ એકાઉન્ટ એક્સેસ',
      homeAriaLabel: 'RapiQR હોમ',
      signInTitle: 'ક્લાયન્ટ સાઇન ઇન',
      enterCodeTitle: 'વેરિફિકેશન કોડ દાખલ કરો',
      signInSubtitle: 'Google થી સાઇન ઇન કરો અથવા તમારો મોબાઇલ નંબર દાખલ કરો',
      codeSentTo: (phone) => `અમે ${phone} પર વેરિફિકેશન કોડ મોકલ્યો છે`,
      lockedForOneHour: '1 કલાક માટે લૉક',
      otpIncorrectCodesEntered: (max) => `${max} ખોટા કોડ દાખલ થયા.`,
      sendAttemptsUsed: (max) => `${max} પ્રયાસો વપરાઈ ગયા.`,
      tryAgainIn: 'ફરી પ્રયાસ કરો',
      connectingToGoogle: 'Google સાથે જોડાઈ રહ્યા છીએ…',
      continueWithGoogle: 'Google સાથે આગળ વધો',
      orWithMobileNumber: 'અથવા મોબાઇલ નંબરથી',
      mobileNumberLabel: 'મોબાઇલ નંબર',
      mobileNumberPlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
      sendingCode: 'કોડ મોકલાઈ રહ્યો છે…',
      lockedWithTime: (time) => `લૉક · ${time}`,
      sendVerificationCode: 'વેરિફિકેશન કોડ મોકલો',
      verificationCodeLabel: 'વેરિફિકેશન કોડ',
      otpPlaceholder: 'કોડ દાખલ કરો',
      verifyingCode: 'કોડ વેરિફાય થઈ રહ્યો છે…',
      lockedParenTime: (time) => `લૉક (${time})`,
      verifyAndEnterDashboard: 'વેરિફાય કરો અને ડેશબોર્ડમાં જાઓ',
      changePhoneNumber: 'મોબાઇલ નંબર બદલો',
      noMoreCodes: (time) => `હવે વધુ કોડ નહીં · ${time}`,
      resendIn: (seconds) => `${seconds} સેકન્ડમાં ફરી મોકલો`,
      resendCode: 'કોડ ફરી મોકલો',
      privacyNote: 'આગળ વધીને, તમે RapiQR ની સેવાની શરતો અને પ્રાઇવસી પોલિસી સાથે સંમત થાઓ છો.',
      footerSecurePhoneVerification: 'સુરક્ષિત ફોન વેરિફિકેશન.',
      errors: {
        invalidPhone: 'કૃપા કરી માન્ય 10-આંકડાનો મોબાઇલ નંબર દાખલ કરો.',
        googleSignInFailed: 'Google સાઇન-ઇન નિષ્ફળ થયું. કૃપા કરી ફરી પ્રયાસ કરો.',
        sendFailedGeneric: 'વેરિફિકેશન કોડ મોકલવામાં નિષ્ફળ. કૃપા કરી ફરી પ્રયાસ કરો.',
        networkErrorSending: 'વેરિફિકેશન કોડ મોકલતી વખતે નેટવર્ક ભૂલ આવી.',
        enterCode: 'કૃપા કરી વેરિફિકેશન કોડ દાખલ કરો.',
        verificationFailedGeneric: 'વેરિફિકેશન નિષ્ફળ થયું. કૃપા કરી ફરી પ્રયાસ કરો.',
        invalidCodeGeneric: 'અમાન્ય વેરિફિકેશન કોડ.',
        attemptsRemaining: (remaining) => `(1-કલાકના લૉક પહેલાં ${remaining} પ્રયાસો બાકી)`,
        resendFailedGeneric: 'કોડ ફરી મોકલવામાં નિષ્ફળ. કૃપા કરી ફરી પ્રયાસ કરો.',
        sendLocked: (max, time) =>
          `તમે તમામ ${max} કોડ રિક્વેસ્ટ વાપરી લીધી છે. તમારી સુરક્ષા માટે, નવા કોડ 1 કલાક માટે લૉક છે — ${time} માં ફરી પ્રયાસ કરો.`,
        verifyLocked: (max, time) =>
          `ઘણા બધા ખોટા કોડ (${max}/${max}). તમારી સુરક્ષા માટે, વેરિફિકેશન 1 કલાક માટે લૉક છે — ${time} માં ફરી પ્રયાસ કરો.`,
      },
      success: {
        googleSignedIn: 'Google સાથે સાઇન ઇન થયું! ડેશબોર્ડ લોડ થઈ રહ્યું છે…',
        codeSentLastRequest: 'કોડ મોકલાયો. આ તમારી છેલ્લી કોડ રિક્વેસ્ટ હતી — નવા કોડ 1 કલાક માટે લૉક છે.',
        codeSentWithCount: (attempts, max) => `તમારા ફોન પર વેરિફિકેશન કોડ મોકલાયો. (${max} માંથી ${attempts} રિક્વેસ્ટ વપરાઈ)`,
        verifiedSuccessfully: 'સફળતાપૂર્વક વેરિફાય થયું! ડેશબોર્ડ લોડ થઈ રહ્યું છે…',
        newCodeSentLastRequest: 'નવો કોડ મોકલાયો. આ તમારી છેલ્લી કોડ રિક્વેસ્ટ હતી — નવા કોડ 1 કલાક માટે લૉક છે.',
        newCodeSentWithCount: (attempts, max) => `નવો વેરિફિકેશન કોડ મોકલાયો. (${max} માંથી ${attempts} રિક્વેસ્ટ વપરાઈ)`,
      },
    },
    admin: {
      closeModalAriaLabel: 'મોડલ બંધ કરો',
      title: 'એડમિન એક્સેસ',
      subtitle: 'એડમિન ઈમેલ અને પાસવર્ડ સાથે સાઇન ઇન કરો.',
      emailLabel: 'એડમિન ઈમેલ',
      emailPlaceholder: 'એડમિન ઈમેલ',
      passwordLabel: 'પાસવર્ડ',
      passwordPlaceholder: 'પાસવર્ડ',
      showPasswordAriaLabel: 'પાસવર્ડ બતાવો',
      hidePasswordAriaLabel: 'પાસવર્ડ છુપાવો',
      signIn: 'સાઇન ઇન',
      errors: {
        missingFields: 'એડમિન ઈમેલ અને પાસવર્ડ દાખલ કરો.',
        incorrectCredentials: 'ખોટો ઈમેલ અથવા પાસવર્ડ.',
      },
    },
    phoneLink: {
      title: 'ફોન નંબર વેરિફાય કરો',
      subtitle: 'તમારા ડેશબોર્ડ સુધી પહોંચવા માટે તમારા ફોન પર મોકલેલ વેરિફિકેશન કોડ દાખલ કરો.',
      phoneLabel: 'મોબાઇલ ફોન નંબર',
      phonePlaceholder: '10 આંકડાનો મોબાઇલ નંબર',
      sendingOtp: 'OTP મોકલાઈ રહ્યો છે...',
      sendVerificationCode: 'વેરિફિકેશન કોડ મોકલો',
      otpLabel: 'OTP કોડ દાખલ કરો',
      changePhone: 'ફોન બદલો',
      otpPlaceholder: 'કોડ દાખલ કરો',
      verifying: 'વેરિફાય થઈ રહ્યું છે...',
      verifyAndAccessDashboard: 'વેરિફાય કરો અને ડેશબોર્ડ એક્સેસ કરો',
      backToHome: '← હોમ પર પાછા જાઓ',
      signOut: 'સાઇન આઉટ',
    },
  },
};
