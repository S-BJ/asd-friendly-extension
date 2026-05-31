export const SENSITIVE_PAGE_KINDS = Object.freeze({
  none: "none",
  login: "login",
  payment: "payment",
  account: "account",
  health: "health",
  legal: "legal",
  identity: "identity",
  upload: "upload"
});

const SENSITIVE_PATTERNS = Object.freeze([
  [
    SENSITIVE_PAGE_KINDS.login,
    /\b(login|sign[- ]?in|password|2fa|otp)\b|로그인|비밀번호/i,
    /\b(password|2fa|otp|verification code|security code)\b|비밀번호|인증번호|본인인증|(?=.*로그인)(?=.*아이디)/i
  ],
  [
    SENSITIVE_PAGE_KINDS.payment,
    /\b(payment|checkout|billing|credit ?card|pay ?now)\b|결제|청구/i,
    /\b(card number|credit card|billing address|payment method|pay now|checkout)\b|카드번호|결제하기|결제 수단|청구 주소|주문 결제/i
  ],
  [
    SENSITIVE_PAGE_KINDS.account,
    /\b(account security|security settings|change password|reset password|account[- ]settings|profile[- ]security)\b|계정\s*보안|보안\s*설정|비밀번호\s*(변경|재설정)/i,
    /\b(account security|profile settings|security settings|change password)\b|계정\s*(설정|보안)|프로필\s*(수정|설정)|보안\s*(설정|인증)|비밀번호\s*(변경|재설정)/i
  ],
  [
    SENSITIVE_PAGE_KINDS.health,
    /\b(medical record|health record|patient portal|clinic appointment|doctor appointment|prescription refill|test result)\b|진료\s*(예약|기록)|처방\s*(전|재발급|리필)|검진\s*(결과|예약)|의료\s*기록|환자\s*포털/i,
    /\b(medical record|health record|clinic appointment|doctor appointment|patient portal|prescription refill|test result)\b|진료\s*(예약|기록)|처방\s*(전|재발급|리필)|검진\s*(결과|예약)|의료\s*(기록|상담)|건강\s*(기록|검진\s*결과)/i
  ],
  [
    SENSITIVE_PAGE_KINDS.legal,
    /\b(sign contract|legal document|court filing|attorney[- ]client|accept terms|agree to terms)\b|법률\s*(상담|문서)|계약서|약관\s*(동의|확인)|개인정보\s*(수집|제공|입력|동의)/i,
    /\b(sign contract|legal document|court filing|attorney client|accept terms|agree to terms)\b|법률\s*(상담|문서)|계약서|약관\s*(동의|확인)|개인정보\s*(수집|제공|입력|동의)/i
  ],
  [
    SENSITIVE_PAGE_KINDS.identity,
    /\b(verify identity|identity verification|passport number|driver['’]?s? license number|upload id|id photo|ssn)\b|본인\s*(인증|확인)\s*(하기|진행|입력|수단)|주민등록번호|신분증\s*(업로드|촬영|제출)|여권\s*(번호|업로드|제출)|운전면허\s*(번호|업로드)/i,
    /\b(verify identity|identity verification|enter passport|passport number|driver license number|upload id|id photo|ssn|social security number)\b|주민등록번호|신분증\s*(업로드|촬영|제출)|여권\s*(번호|업로드|제출)|운전면허\s*(번호|업로드)|본인\s*(인증|확인)\s*(하기|진행|입력|수단)|인증번호/i
  ],
  [
    SENSITIVE_PAGE_KINDS.upload,
    /\b(upload|uploads|uploaded|uploading|attach|attachment|choose file|select file|file picker|image-edit|photo upload|upload photo|upload image|profile photo|camera access|use camera|turn on camera|take photo|submit photo|verify photo|passport photo|id photo)\b|업로드|첨부|파일\s*(선택|첨부|업로드)|사진\s*(업로드|첨부|제출|등록|촬영|인증)|이미지\s*(업로드|첨부|제출|등록)|카메라\s*(권한|사용|촬영|켜기)/i,
    /\b(upload|uploads|uploaded|uploading|choose file|select file|file picker|image-edit|photo upload|upload photo|upload image|profile photo|camera access|use camera|turn on camera|take photo|submit photo|verify photo|passport photo|id photo)\b|파일\s*(선택|첨부|업로드)|사진\s*(업로드|첨부|제출|등록|촬영|인증)|이미지\s*(업로드|첨부|제출|등록)|카메라\s*(권한|사용|촬영|켜기)/i
  ]
]);

const BODY_TEXT_ONLY_SENSITIVE_KINDS = new Set([]);

export function detectSensitivePageKind({
  url = "",
  title = "",
  visibleText = "",
  hasInteractiveSensitiveControl = false
} = {}) {
  const pageHaystack = `${url} ${title}`.slice(0, 1000);
  const visibleHaystack = String(visibleText || "").slice(0, 4000);
  const canUseVisibleText = Boolean(hasInteractiveSensitiveControl);
  for (const [kind, pagePattern, visiblePattern] of SENSITIVE_PATTERNS) {
    if (pagePattern.test(pageHaystack)) return kind;
    if ((canUseVisibleText || BODY_TEXT_ONLY_SENSITIVE_KINDS.has(kind)) && visiblePattern.test(visibleHaystack)) {
      return kind;
    }
  }
  return SENSITIVE_PAGE_KINDS.none;
}

export function isSensitivePage(context) {
  return detectSensitivePageKind(context) !== SENSITIVE_PAGE_KINDS.none;
}
