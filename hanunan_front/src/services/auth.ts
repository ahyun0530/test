import axios from 'axios';

// 로그인 모킹 
export const mockUser = {
  id: 1,
  kakaoId: "12345678",
  nickname: "서윤",
  profileImageUrl: "https://example.com/profile.jpg",
  role: "USER",
  reportCount: 5,
  validReportCount: 3
};

// 내 프로필 조회 API (/api/users/me)
export const getMyProfile = async (token: string) => {
  try {
    // 실제 연동 시:
    // const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return res.data;

    // 모킹 데이터 반환
    return mockUser;
  } catch (error) {
    console.error("프로필 조회 실패", error);
    return null;
  }
};