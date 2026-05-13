export interface VerifiedMapReportRequest {
  type: string;
  description: string;
  pinLatitude: number;
  pinLongitude: number;
  userLatitude: number;
  userLongitude: number;
  userAccuracyMeters?: number;
  images?: File[];
}

export interface VerifiedMapReportResponse {
  id: number;
  userId: number;
  nickname: string | null;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  userLatitude: number;
  userLongitude: number;
  userAccuracyMeters?: number;
  distanceMeters: number;
  gpsVerified: boolean;
  status: 'ACTIVE' | 'RESOLVED' | 'HIDDEN';
  imageUrls: string[];
  createdAt: string;
}

export const createVerifiedMapReport = async (
  data: VerifiedMapReportRequest
): Promise<VerifiedMapReportResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('로그인 후 제보할 수 있습니다.');
  }

  const formData = new FormData();
  formData.append('type', data.type);
  formData.append('description', data.description);
  formData.append('pinLatitude', String(data.pinLatitude));
  formData.append('pinLongitude', String(data.pinLongitude));
  formData.append('userLatitude', String(data.userLatitude));
  formData.append('userLongitude', String(data.userLongitude));
  if (data.userAccuracyMeters !== undefined) {
    formData.append('userAccuracyMeters', String(data.userAccuracyMeters));
  }
  data.images?.forEach((image) => formData.append('images', image));

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || '제보 등록에 실패했습니다.');
  }

  return res.json();
};
