'use client';

import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    const kakaoClientId = "007f796368af3edc01ad000ad8484adc";
    
    const kakaoRedirectUrl = "http://localhost:3000/oauth/kakao/redirect";
    
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${kakaoRedirectUrl}&response_type=code`;
  
    window.location.href = KAKAO_AUTH_URL;
  };

  const handleGoogleLogin = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID; // 구글 콘솔에서 발급받은 ID
    const googleRedirectUrl = "http://localhost:3000/oauth/google/redirect";
    
    // 구글 인증 URL
    const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${googleRedirectUrl}&response_type=code&scope=email%20profile`;
  
    window.location.href = GOOGLE_AUTH_URL;
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* 1. 모달 창: rounded-[40px]는 너무 둥그니 rounded-[30px] 정도로 조절해볼게요. */}
      <div className="bg-white w-[400px] rounded-[30px] p-12 shadow-2xl relative animate-fadeIn">
        
        {/* 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-2xl"
        >✕</button>

        {/* 2. 로고 영역: 서윤님의 "한눈에 안전" 로고를 상단으로! */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-[#3954AA] mb-2 italic">한눈에 안전</h2>
          <p className="text-gray-500 font-medium text-base">더 안전한 세상을 위한 첫걸음</p>
        </div>

        {/* 3. 로그인 버튼 영역: 카카오를 위로, 구글을 아래로! */}
        <div className="flex flex-col gap-4">
          {/* 카카오 버튼 (기존) */}
          <button 
            onClick={handleKakaoLogin}
            className="w-full h-16 bg-[#FEE500] rounded-2xl flex items-center justify-center gap-3 hover:opacity-95 transition-all shadow-sm"
          >
            {/* 카카오 로고가 있다면 추가: <img src="/kakao-icon.png" alt="K" className="w-6 h-6" /> */}
            <span className="text-black font-bold text-xl">카카오로 로그인하기</span>
          </button>

          {/* 4. 구글 버튼 (서윤님 요청 스타일): 카카오 아래, 회색 배경! */}
          <button 
            onClick={handleGoogleLogin}
            // 💡 bg-gray-100 (회색 배경)과 border-gray-200 (약한 테두리)을 넣었습니다.
            className="w-full h-16 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-inner"
          >
            {/* 구글 로고 아이콘 (public 폴더에 넣어주세요!) */}
            <img src="/google-icon.png" alt="G" className="w-6 h-6" />
            {/* 구글 로고가 "G" 글자라서 "구글로" 앞에 "G"가 중복되지 않게! */}
            <span className="text-black font-bold text-xl">구글로 로그인하기</span>
          </button>

          {/* 하단 문구 */}
          <p className="text-[12px] text-gray-400 text-center mt-6 px-4 leading-relaxed">
            로그인 시 서비스 이용약관 및 개인정보 처리방침에<br/>동의하는 것으로 간주합니다.
          </p>
        </div>
      </div>
    </div>
  );
}