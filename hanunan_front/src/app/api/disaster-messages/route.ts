// app/api/disaster-messages/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const dummyDisasters = [
    {
      id: 1,
      category: '화재',
      title: '[광주광역시] 화재 알림',
      location: '광주 동구 조선대학교 인근',
      content: '현재 조선대 본관 인근 화재 발생. 주변 시민들은 대피 바랍니다.',
      aiSummary: '조선대학교 인근 건물에서 화재가 발생하여 소방차 출동 중입니다. 인근 도로 혼잡이 예상되니 우회하세요.',
      latitude: 35.1425,
      longitude: 126.9345,
      severity: 'HIGH'
    },
    {
      id: 2,
      category: '기타',
      title: '[남구] 도로 통제',
      location: '광주 남구 봉선동',
      content: '상하수도 공사로 인한 일부 구간 통제',
      aiSummary: '봉선동 로터리 인근 공사로 인해 1개 차선이 통제 중입니다.',
      latitude: 35.1325,
      longitude: 126.9145,
      severity: 'LOW'
    }
  ];

  return NextResponse.json(dummyDisasters);
}