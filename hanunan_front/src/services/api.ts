// 카카오 맵 API 타입을 위한 선언 (에러 방지)
declare global {
  interface Window {
    kakao: any;
  }
}

//재난문자 모킹
export interface DisasterMessage {
  id: number;
  msgId: string;
  originalText: string;
  category: string;
  extractedLocation: string;
  latitude: number;
  longitude: number;
  hasLocation: boolean;
  aiSummary: string;
  severity: 'LOW' | 'MID' | 'HIGH';
  sentAt: string;
}

//안전 시설
export interface SafetyFacility {
  id: number;
  type: 'FIRE_HYDRANT' | 'SHELTER' | 'AED';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const MOCK_DATA: DisasterMessage[] = [
  {
    id: 1,
    msgId: "MSG_2026_001",
    originalText: "[광주광역시] 오늘 14시부로 동구 지역 호우경보 발효. 하천 인근 주민들은 대피 바랍니다.",
    category: "폭우",
    extractedLocation: "광주광역시 동구 조선대길 146",
    latitude: 35.143,
    longitude: 126.924,
    hasLocation: true,
    aiSummary: "고지대로 이동하세요. 하수관 역류 및 인근 저지대 주택 침수가 예상됩니다.",
    severity: "HIGH",
    sentAt: new Date().toISOString(),
  },
  {
    id: 2,
    msgId: "MSG_2026_002",
    originalText: "[동구청] 서석동 인근 상가 화재 발생. 주변 도로 통제 중이니 우회 바랍니다.",
    category: "화재",
    extractedLocation: "광주광역시 동구 조선대길 146",
    latitude: 35.146,
    longitude: 126.928,
    hasLocation: true,
    aiSummary: "젖은 수건을 지참하고, 비상계단만 이용하세요. 현재 유독가스가 확산 중입니다.",
    severity: "HIGH",
    sentAt: new Date().toISOString(),
  },
  {
    id: 3,
    msgId: "MSG_2026_003",
    originalText: "[산림청] 동구 지산동 인근 산불 주의보 발령. 입산을 자제 바랍니다.",
    category: "산불",
    extractedLocation: "광주광역시 동구 지산동",
    latitude: 35.148,
    longitude: 126.942,
    hasLocation: true,
    aiSummary: "지산유원지 인근 산불 확산 우려. 등산객은 즉시 하산하십시오.",
    severity: "MID",
    sentAt: new Date().toISOString(),
  }
];
export const getDisasterMessages = async (): Promise<DisasterMessage[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DATA), 300);
  });
};

//기상특보 모킹
export interface WeatherAlert {
  id: number;
  alertId: string;
  regionName: string;
  latitude: number;
  longitude: number;
  boundaryGeojson: string;
  alertType: string;
  severity: 'LOW' | 'MID' | 'HIGH';
  startAt: string;
  endAt: string | null;
  originalText?: string; // 상세창 표시용 추가
  aiSummary?: string;    // 상세창 표시용 추가
}

export const mockWeatherAlerts: WeatherAlert[] = [
  {
    id: 1,
    alertId: "KMA_20260403_001",
    regionName: "광주광역시 동구",
    latitude: 35.143,
    longitude: 126.924,
    boundaryGeojson: JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [126.920, 35.140], [126.930, 35.140],
        [126.930, 35.148], [126.920, 35.148],
        [126.920, 35.140]
      ]]
    }),
    alertType: "강풍주의보",
    severity: "MID",
    startAt: "2026-04-03T10:00:00",
    endAt: null,
    originalText: "[기상특보] 광주지역 강풍주의보 발효 중. 시설물 관리 유의.",
    aiSummary: "광주 동구 지역에 강한 바람이 예상됩니다. 간판 및 시설물 고정에 유의하세요."
  }
];

export const getWeatherAlerts = async (): Promise<WeatherAlert[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWeatherAlerts), 300);
  });
};

export interface FireStation {
  id: number;
  frstCntrid: string;
  frstCetrNm: string;
  centerLatitude: number;
  centerLongitude: number;
  boundaryGeojson: string;
}

export interface FireDailyStat {
  id: number;
  ocrnYmd: string;
  fireRcptMnb: number; // 화재 접수 건수
  fireProgMnb: number; // 화재 진행 건수
  stnEndMnb: number;   // 상황 종료 건수
  slfExtshMnb: number; // 자체 진화 건수
}

// 소방서 목록 모킹 데이터
const MOCK_FIRE_STATIONS: FireStation[] = [
  {
    id: 101,
    frstCntrid: "6410111",
    frstCetrNm: "광주동부소방서",
    centerLatitude: 35.151,
    centerLongitude: 126.918,
    boundaryGeojson: JSON.stringify({
      type: "Polygon",
      coordinates: [[
        [126.910, 35.145], [126.925, 35.145],
        [126.925, 35.155], [126.910, 35.155],
        [126.910, 35.145]
      ]]
    })
  }
];

// 특정 소방서 통계 모킹 데이터
const MOCK_FIRE_STATS: Record<number, FireDailyStat> = {
  101: {
    id: 1,
    ocrnYmd: "2026-04-03",
    fireRcptMnb: 5,
    fireProgMnb: 1, // 현재 진행 중인 화재 1건
    stnEndMnb: 3,
    slfExtshMnb: 1
  }
};

export const getFireStations = async (): Promise<FireStation[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_FIRE_STATIONS), 300));
};

export const getFireStationStats = async (id: number): Promise<FireDailyStat> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_FIRE_STATS[id]), 200));
};

export interface CitizenReport {
  id: number;
  userId: number;
  nickname: string; 
  category: string;
  latitude: number;      // 재난 위치
  longitude: number;     // 재난 위치
  userLatitude: number;  // 제보자 위치
  userLongitude: number; // 제보자 위치
  gpsDistanceMeters?: number;
  gpsVerified: boolean;
  locationName: string;
  description: string;
  imageUrl: string[];   
  status: 'ACTIVE' | 'RESOLVED' | 'HIDDEN';
  likeCount: number;
  reportedAt: string;
  targetId: number;
  targetType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY';
  reliability: number;
}

let MOCK_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 1,
    userId: 10,
    nickname: "홍길동",
    category: "폭우",
    latitude: 35.143,
    longitude: 126.924,
    userLatitude: 35.143,
    userLongitude: 126.924,
    gpsVerified: true,
    locationName: "조선대 정문 앞",
    description: "폭우 제보",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 5,
    reportedAt: "2026-04-03T16:40:00",
    targetId: 1,
    targetType: 'DISASTER',
    reliability: 100
  },
  {
    id: 2,
    userId: 11,
    nickname: "익명 1",
    category: "화재",
    latitude: 35.146,
    longitude: 126.928,
    userLatitude: 35.146,
    userLongitude: 126.928,
    gpsVerified: true,
    locationName: "서석동 사거리",
    description: "화재 제보",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 2,
    reportedAt: "2026-04-03T16:47:00",
    targetId: 2,
    targetType: 'DISASTER',
    reliability: 100
  },
  {
    id: 3,
    userId: 101,
    nickname: "소방관",
    category: "소방",
    latitude: 35.151,
    longitude: 126.918,
    userLatitude: 35.151,
    userLongitude: 126.918,
    gpsVerified: true,
    locationName: "광주동부소방서",
    description: "소방서 제보",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 10,
    reportedAt: "2026-04-03T16:40:00",
    targetId: 101,
    targetType: 'FIRE',
    reliability: 100
  },
{
    id: 4,
    userId: 12,
    nickname: "의심스러운사용자",
    category: "화재",
    latitude: 35.146,
    longitude: 126.928,
    userLatitude: 35.146,
    userLongitude: 126.928,
    gpsVerified: true,
    locationName: "조선대 인근",
    description: "신뢰도 45점 테스트용입니다.",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 0,
    reportedAt: "2026-04-03T17:00:00",
    targetId: 2,
    targetType: 'DISASTER',
    reliability: 45 // 70 미만이므로 UI에서 흐릿하게 보이거나 필터링 대상
  },
  {
    id: 5,
    userId: 13,
    nickname: "길가던사람",
    category: "화재",
    latitude: 35.146,
    longitude: 126.928,
    userLatitude: 35.146,
    userLongitude: 126.928,
    gpsVerified: true,
    locationName: "서석동 주민센터 인근",
    description: "신뢰도 75점 테스트용입니다.",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 1,
    reportedAt: "2026-04-03T17:05:00",
    targetId: 2,
    targetType: 'DISASTER',
    reliability: 75 // 정상 노출 기준
  },
  {
    id: 6,
    userId: 14,
    nickname: "장난감",
    category: "화재",
    latitude: 35.146,
    longitude: 126.928,
    userLatitude: 35.146,
    userLongitude: 126.928,
    gpsVerified: true,
    locationName: "동구청 앞",
    description: "신뢰도 70점 테스트용입니다.",
    imageUrl: [],
    status: 'ACTIVE',
    likeCount: 0,
    reportedAt: "2026-04-03T17:10:00",
    targetId: 2,
    targetType: 'DISASTER',
    reliability: 70 // 70 미만이므로 흐릿하게 처리 대상
  }
];
export const createCitizenReport = async (
  reportData: Omit<CitizenReport, 'id' | 'reportedAt' | 'gpsVerified' | 'status' | 'likeCount' | 'locationName'>
): Promise<CitizenReport> => {
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.coord2Address(reportData.userLongitude, reportData.userLatitude, (result: any, status: any) => {
      let actualAddress = "위치 정보 없음";

      if (status === window.kakao.maps.services.Status.OK) {
        actualAddress = result[0].road_address
          ? result[0].road_address.address_name
          : result[0].address.address_name;
      } else {
        actualAddress = `지정된 위치 (좌표: ${reportData.userLatitude.toFixed(3)}, ${reportData.userLongitude.toFixed(3)})`;
      }

      setTimeout(() => {
        const isVerified = Math.abs(reportData.userLatitude - reportData.latitude) < 0.005 &&
          Math.abs(reportData.userLongitude - reportData.longitude) < 0.005;

        const newReport: CitizenReport = {
          ...reportData,
          id: Date.now(),
          reportedAt: new Date().toISOString(),
          gpsVerified: isVerified,
          locationName: actualAddress, 
          status: 'ACTIVE',
          likeCount: 0,
          nickname: "사용자",
          reliability: 100
        };

        MOCK_CITIZEN_REPORTS = [newReport, ...MOCK_CITIZEN_REPORTS];
        resolve(newReport);
      }, 300);
    });
  });
};

export const getCitizenReports = async (targetId?: number, targetType?: string): Promise<CitizenReport[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (targetId && targetType) {
        const filtered = MOCK_CITIZEN_REPORTS.filter(
          (r) => r.targetId === targetId && r.targetType === targetType
        );
        resolve(filtered);
      } else {
        resolve(MOCK_CITIZEN_REPORTS);
      }
    }, 300);
  });
};

export const deleteCitizenReport = async (reportId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_CITIZEN_REPORTS = MOCK_CITIZEN_REPORTS.filter((r) => r.id !== reportId);
      resolve(true);
    }, 200);
  });
};

export const likeCitizenReport = async (reportId: number, isAdding: boolean): Promise<CitizenReport> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const report = MOCK_CITIZEN_REPORTS.find((r) => r.id === reportId);
      if (report) {
        if (isAdding) {
          report.likeCount += 1;
        } else {
          report.likeCount = Math.max(0, report.likeCount - 1);
        }
      }
      resolve({ ...report! });
    }, 200);
  });
};

export const updateCitizenReport = async (reportId: number, description: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const target = MOCK_CITIZEN_REPORTS.find(r => r.id === reportId);
      if (target) {
        target.description = description;
        resolve(true);
      } else {
        resolve(false);
      }
    }, 200);
  });
};

export interface ReportComment {
  id: number;
  reportId: number;
  userId: number;
  nickname: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  targetId: number;
  targetType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT';
}

/*export const getComments = async (reportId: number): Promise<ReportComment[]> => {
  const response = await fetch(`/api/reports/${reportId}/comments`);
  return response.json();
};

export const createComment = async (reportId: number, content: string, image?: File) => {
  const formData = new FormData();
  formData.append('content', content);
  if (image) formData.append('image', image);

  const response = await fetch(`/api/reports/${reportId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰
    },
    body: formData
  });
  return response.json();
}; 

export const MOCK_REPORTS: {
  id: number;
  userId: number;
  nickname: string;
  locationName: string;
  description: string;
  imageUrl: string[];
  reportedAt: string;
  comments: ReportComment[]; 
}[] = [
  {
    id: 101,
    userId: 1,
    nickname: "119안전센터",
    locationName: "조선대학교 정문 인근",
    description: "상가 화재 발생. 주변 도로 통제 중이니 우회 바랍니다.",
    imageUrl: ["https://example.com/fire1.jpg"],
    reportedAt: "2026-04-04T20:10:00",
    comments: [
      {
        id: 1,
        reportId: 101,
        userId: 999,
        nickname: "홍길동",
        content: "현재 소방차 도착해서 진압 중입니다!",
        imageUrl: null,
        createdAt: "2026-04-04T20:15:00"
      },
      {
        id: 2,
        reportId: 101,
        userId: 42,
        nickname: "지나가던시민",
        content: "연기가 너무 심해요. 다들 조심하세요.",
        imageUrl: null,
        createdAt: "2026-04-04T20:20:00"
      }
    ]
  }
]; */


let MOCK_SIDEBAR_COMMENTS: ReportComment[] = [
  {
    id: 1,
    reportId: 0,
    userId: 42,
    nickname: "지나가던시민",
    content: "연기가 너무 심해요. 다들 조심하세요.",
    imageUrl: null,
    createdAt: "2026-04-04T20:20:00",
    targetId: 2,
    targetType: 'DISASTER'
  },
  {
    id: 2,
    reportId: 0,
    userId: 10,
    nickname: "홍길동",
    content: "현재 소방차 도착해서 진압 중입니다!",
    imageUrl: null,
    createdAt: "2026-04-04T20:15:00",
    targetId: 2,
    targetType: 'DISASTER'
  }
];

export const getSidebarComments = async (targetId?: number, targetType?: string): Promise<ReportComment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (targetId && targetType) {
        const filtered = MOCK_SIDEBAR_COMMENTS.filter(
          (c) => c.targetId === targetId && c.targetType === targetType
        );
        resolve(filtered);
      } else {
        resolve(MOCK_SIDEBAR_COMMENTS);
      }
    }, 300);
  });
};

export const createSidebarComment = async (
  content: string,
  userId: number,
  targetId: number,
  targetType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT'
): Promise<ReportComment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newComment: ReportComment = {
        id: Date.now(),
        reportId: 0,
        userId: userId,
        nickname: "사용자",
        content: content,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        targetId: targetId,
        targetType: targetType
      };
      MOCK_SIDEBAR_COMMENTS = [newComment, ...MOCK_SIDEBAR_COMMENTS];
      resolve(newComment);
    }, 200);
  });
};

export const reportCitizenReport = async (reportId: number, reason: string): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`제보 ${reportId}번 신고 접수: ${reason}`);
    setTimeout(() => resolve(true), 200);
  });
};

export const deleteSidebarComment = async (commentId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_SIDEBAR_COMMENTS = MOCK_SIDEBAR_COMMENTS.filter((c) => c.id !== commentId);
      resolve(true);
    }, 200);
  });
};

export interface SafetyFacility {
  id: number;
  type: 'FIRE_HYDRANT' | 'SHELTER' | 'AED';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  aiSummary: string;       
  manager?: string;
  lastCheck?: string;
  contact?: string;
  detailLocation?: string;
}

const MOCK_SAFETY_FACILITIES: SafetyFacility[] = [
  { 
    id: 1, 
    type: 'FIRE_HYDRANT', 
    name: '소화전', 
    address: '광주광역시 동구 필문대로 309', 
    latitude: 35.145, 
    longitude: 126.927,
    manager: '광주 동부소방서',
    lastCheck: '2026-03-20',
    aiSummary: '주변 5m 이내 주정차 금지 구역입니다. 소방 활동을 위해 항시 비워두세요.'
  },
  { 
    id: 2, 
    type: 'SHELTER', 
    name: '대피소', 
    address: '광주광역시 동구 제봉로 82', 
    latitude: 35.147, 
    longitude: 126.922,
    manager: '광주 동구청 안전과',
    lastCheck: '2026-04-01',
    aiSummary: '재난 발생 시 해당 대피소로 대피하세요. 생필품이 비치되어 있습니다.'
  },
  { 
    id: 3, 
    type: 'AED', 
    name: '제세동기', 
    address: '광주광역시 동구 서남로 1', 
    latitude: 35.146, 
    longitude: 126.923,
    manager: '보건소',
    lastCheck: '2026-01-15',
    detailLocation: '본관 1층 당직실 앞',
    aiSummary: '설치 위치: 본관 1층 당직실 앞. 누구나 비상시 즉시 사용 가능합니다.'
  },
];

export const getSafetyFacilities = async (): Promise<SafetyFacility[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_SAFETY_FACILITIES), 300);
  });
};

export interface MapReport {
  id: number;
  userId: number;
  type: string;        
  description: string; 
  latitude: number;
  longitude: number;
  locationName: string;
  nickname: string;
  createdAt: string;
  likeCount: number;
}

let MOCK_MAP_REPORTS: MapReport[] = [];

export const getMapReports = async (): Promise<MapReport[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_MAP_REPORTS]), 300);
  });
};

export const createMapReport = async (
  data: Omit<MapReport, 'id' | 'createdAt' | 'likeCount' | 'locationName' | 'nickname'>
): Promise<MapReport> => {
  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    
    geocoder.coord2Address(data.longitude, data.latitude, (result: any, status: any) => {
      const address = status === window.kakao.maps.services.Status.OK 
        ? result[0].address.address_name 
        : "위치 정보 없음";

      const newReport: MapReport = {
        ...data,
        id: Date.now(),
        locationName: address,
        nickname: "나의 제보",
        createdAt: new Date().toISOString(),
        likeCount: 0
      };

      MOCK_MAP_REPORTS = [newReport, ...MOCK_MAP_REPORTS];
      resolve(newReport);
    });
  });
};

export const getMyMapReports = async (userId: number): Promise<MapReport[]> => {
  const allReports = await getMapReports();
  return allReports.filter(report => report.userId === userId);
};

export const getMyCitizenReports = async (userId: number): Promise<CitizenReport[]> => {
  const allReports = await getCitizenReports();
  return allReports.filter(report => report.userId === userId);
};
//0512
export interface FireMarker {
  id: number;
  sn: string;
  messageContent: string;
  rcptnRgnNm: string;
  parsedAddress: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}
//0512
export const fetchFireMarkers = async (): Promise<FireMarker[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fire/markers`);
  if (!response.ok) throw new Error('화재 마커를 불러오는데 실패했습니다.');
  return response.json();
};

export const testFireMarker = async (message: string, rcptnRgnNm?: string): Promise<FireMarker> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fire/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, rcptnRgnNm: rcptnRgnNm || '' }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || '테스트 마커 추가 실패');
  }
  return res.json();
};

export interface DisasterExtractResult {
  time: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

export const extractDisasterInfo = async (message: string): Promise<DisasterExtractResult> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/disaster/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('재난문자 분석 실패');
  return res.json();
};


//신뢰도 기준점 상수화
export const RELIABILITY_LIMITS = {
  WARNING: 70, // 70점 이하: 투명도 조절 (주의)
  BLIND: 50,   // 50점 이하: 화면에서 숨김 (차단)
};