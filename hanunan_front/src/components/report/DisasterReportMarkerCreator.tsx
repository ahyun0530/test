'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { createVerifiedMapReport, VerifiedMapReportResponse } from '@/services/reports';

type LatLng = {
  lat: number;
  lng: number;
};

interface DisasterReportMarkerCreatorProps {
  center?: LatLng;
  onCreated?: (report: VerifiedMapReportResponse) => void;
}

const MAX_GPS_ACCURACY_METERS = 100;

const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저에서는 위치 정보를 사용할 수 없습니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  });

const locationErrorMessage = (error: unknown) => {
  if (typeof GeolocationPositionError !== 'undefined' && error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return '위치 권한을 허용해야 제보가 가능합니다.';
    }
    if (error.code === error.TIMEOUT) {
      return '현재 위치 확인 시간이 초과되었습니다. 실외에서 다시 시도해 주세요.';
    }
  }
  return error instanceof Error ? error.message : '현재 위치를 확인할 수 없습니다.';
};

export default function DisasterReportMarkerCreator({
  center = { lat: 35.1595, lng: 126.8526 },
  onCreated,
}: DisasterReportMarkerCreatorProps) {
  const [selectedPin, setSelectedPin] = useState<LatLng | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('화재');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const imagePreviews = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const openForm = () => {
    if (!localStorage.getItem('token')) {
      alert('소셜 로그인 후 제보할 수 있습니다.');
      return;
    }
    if (!selectedPin) {
      alert('지도에서 재난 발생 위치를 먼저 클릭해 주세요.');
      return;
    }
    setErrorMessage('');
    setIsOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 3) {
      alert('사진은 최대 3장까지 첨부할 수 있습니다.');
      return;
    }
    setImages(files);
  };

  const submitReport = async () => {
    if (!selectedPin) return;
    if (!description.trim()) {
      setErrorMessage('제보 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const position = await getCurrentPosition();
      const accuracy = position.coords.accuracy;

      if (accuracy > MAX_GPS_ACCURACY_METERS) {
        throw new Error('GPS 오차가 너무 큽니다. 창가나 실외에서 다시 시도해 주세요.');
      }

      const created = await createVerifiedMapReport({
        type,
        description: description.trim(),
        pinLatitude: selectedPin.lat,
        pinLongitude: selectedPin.lng,
        userLatitude: position.coords.latitude,
        userLongitude: position.coords.longitude,
        userAccuracyMeters: accuracy,
        images,
      });

      onCreated?.(created);
      setIsOpen(false);
      setDescription('');
      setImages([]);
      alert('제보가 등록되었습니다.');
    } catch (error) {
      setErrorMessage(locationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full min-h-[600px] w-full">
      <Map
        center={center}
        level={4}
        className="h-full min-h-[600px] w-full"
        onClick={(_target, mouseEvent) => {
          setSelectedPin({
            lat: mouseEvent.latLng.getLat(),
            lng: mouseEvent.latLng.getLng(),
          });
        }}
      >
        {selectedPin && <MapMarker position={selectedPin} />}
      </Map>

      <button
        type="button"
        onClick={openForm}
        className="absolute right-6 top-6 z-10 rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:bg-gray-300"
      >
        제보마커생성하기
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">재난 제보</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-900"
                aria-label="닫기"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">유형</span>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                >
                  <option value="화재">화재</option>
                  <option value="침수">침수</option>
                  <option value="정전">정전</option>
                  <option value="도로 파손">도로 파손</option>
                  <option value="기타">기타</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">내용</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-32 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  placeholder="현장 상황을 입력해 주세요."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">사진 첨부</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <img
                      key={preview}
                      src={preview}
                      alt={`첨부 사진 ${index + 1}`}
                      className="h-24 w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}

              {errorMessage && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={submitReport}
              disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600 disabled:bg-gray-300"
            >
              {isSubmitting ? '위치 검증 중...' : '제출 및 위치 검증'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
