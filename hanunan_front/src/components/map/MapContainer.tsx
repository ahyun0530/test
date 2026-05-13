'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useGeolocation } from '@/hooks/useGeolocation';

const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface MapContainerProps {
  initialCenter?: { lat: number; lng: number };
  initialLevel?: number;
}

export default function MapContainer({
  initialCenter = DEFAULT_CENTER,
  initialLevel = 5,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const myLocationOverlayRef = useRef<any>(null);

  const { coords, loading, error, fetchLocation } = useGeolocation();

  const initMap = () => {
    const { kakao } = window as any;
    kakao.maps.load(() => {
      if (!mapRef.current) return;
      mapInstance.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
        level: initialLevel,
      });
    });
  };

  // coords가 바뀔 때마다 지도 이동 + 마커 갱신
  useEffect(() => {
    const { kakao } = (window as any) ?? {};
    if (!coords || !mapInstance.current || !kakao?.maps) return;

    const locPosition = new kakao.maps.LatLng(coords.lat, coords.lng);
    mapInstance.current.panTo(locPosition);

    if (myLocationOverlayRef.current) {
      myLocationOverlayRef.current.setMap(null);
    }

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:48px; height:48px;">
        <div style="
          position:absolute; inset:0;
          background:rgba(76,92,164,0.18);
          border-radius:50%;
          animation:myLocPulse 1.8s ease-out infinite;
        "></div>
        <div style="
          width:18px; height:18px;
          background:#4C5CA4;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 10px rgba(76,92,164,0.55);
          position:relative; z-index:1;
        "></div>
      </div>`;

    myLocationOverlayRef.current = new kakao.maps.CustomOverlay({
      position: locPosition,
      content,
      yAnchor: 0.5,
      zIndex: 99,
    });
    myLocationOverlayRef.current.setMap(mapInstance.current);
  }, [coords]);

  return (
    <div className="relative w-full h-full">
      <Script src={KAKAO_SDK_URL} strategy="afterInteractive" onLoad={initMap} />

      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* 현재 위치 버튼 */}
      <button
        onClick={fetchLocation}
        disabled={loading}
        className="absolute bottom-24 right-6 z-20 flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-xl border border-gray-100 text-sm font-semibold text-[#4C5CA4] hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        title="현재 위치로 이동"
      >
        {loading ? (
          <svg
            className="animate-spin"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )}
        {loading ? '위치 확인 중...' : '현재 위치'}
      </button>

      {/* 오류 토스트 */}
      {error && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 bg-red-50 text-red-600 text-xs font-medium px-4 py-2 rounded-full shadow border border-red-200 whitespace-nowrap">
          {error}
        </div>
      )}

      <style>{`
        @keyframes myLocPulse {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
