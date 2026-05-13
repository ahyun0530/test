'use client';

import { useEffect } from 'react';
import axios from 'axios';

export default function KakaoRedirect() {
  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');

    if (code) {
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/member/kakao/doLogin`, {
        code: code
      })
      .then(res => {
        const data = res.data; 
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          nickname: data.nickname || data.email?.split('@')[0] || '사용자',
          email: data.email,
        }));
        
        window.location.href = '/';
      })
      .catch(err => {
        console.error("로그인 실패:", err);
        alert("백엔드 연결에 실패했습니다.");
      });
    }   
  }, []);

  return (
    <div className="flex justify-center items-center py-12">
      <div className="text-xl font-medium text-gray-700">
        로그인 중입니다...
      </div>
    </div>
  );
}