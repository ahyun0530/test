'use client';

import { useEffect } from 'react';
import axios from 'axios';

export default function GoogleRedirect() {
  useEffect(() => {
    // URL에서 구글이 보내준 인가 코드(code) 추출
    const code = new URL(window.location.href).searchParams.get('code');

    if (code) {
      // 백엔드 구글 로그인 엔드포인트로 전송
      axios.post(`http://localhost:8081/member/google/doLogin`, {
        code: code
      })
      .then(res => {
        const data = res.data; 
        
        // 토큰 및 사용자 정보 저장 (카카오와 동일한 방식)
        localStorage.setItem("token", data.token);
        
        const userData = {
          nickname: data.nickname || "구글 사용자", 
          email: data.email
        };
        localStorage.setItem("user", JSON.stringify(userData));
        
        // 메인 페이지로 이동
        window.location.href = '/';
      })
      .catch(err => {
        console.error("구글 로그인 실패:", err);
        alert("백엔드 연결에 실패했습니다.");
      });
    }   
  }, []);

  return (
    <div className="flex justify-center items-center py-12">
      <div className="text-xl font-medium text-gray-700">
        구글 계정으로 로그인 중입니다...
      </div>
    </div>
  );
}