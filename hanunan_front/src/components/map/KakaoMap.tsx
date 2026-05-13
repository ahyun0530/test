
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { DisasterMessage, WeatherAlert, FireStation, SafetyFacility, DisasterExtractResult, FireMarker } from '@/services/api';

const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;

interface KakaoMapProps {
  center: { lat: number; lng: number };
  activeCategory: 'DISASTER' | 'SAFETY' | 'REPORT';
  disasterData: DisasterMessage[];
  weatherAlerts: WeatherAlert[];
  fireStations: FireStation[];
  safetyData: SafetyFacility[];
  mapReports: any[];
  extractedDisaster?: DisasterExtractResult | null;
  fireMarkers?: FireMarker[];
  onSelectItem: (item: any, type: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT') => void;
}

export default function KakaoMap({ center, activeCategory, disasterData, weatherAlerts, fireStations, safetyData, mapReports, extractedDisaster, fireMarkers = [], onSelectItem }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const myLocationOverlayRef = useRef<any>(null);
  const extractedOverlayRef = useRef<any>(null);
  const fireOverlaysRef = useRef<any[]>([]);
  const fireInfoOverlayRef = useRef<any>(null);
  const fireInfoOpenIdRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const handleMoveToCurrentLocation = () => {
    const { kakao } = window as any;
    if (navigator.geolocation && mapInstance.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locPosition = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

          mapInstance.current.panTo(locPosition);

          if (myLocationOverlayRef.current) myLocationOverlayRef.current.setMap(null);
          const content = `<div style="width:18px; height:18px; background:#4C5CA4; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(76,92,164,0.5);"></div>`;
          myLocationOverlayRef.current = new kakao.maps.CustomOverlay({
            position: locPosition,
            content,
            yAnchor: 0.5,
          });
          myLocationOverlayRef.current.setMap(mapInstance.current);
        },
        (err) => {
          alert("위치 정보를 가져올 수 없습니다.");
        }
      );
    }
  };

  const requestLocation = (map: any) => {
    const { kakao } = window as any;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const locPosition = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        map.panTo(locPosition);
        if (myLocationOverlayRef.current) myLocationOverlayRef.current.setMap(null);
        const content = `<div style="width:16px; height:16px; background:#007AFF; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(0,122,255,0.5);"></div>`;
        myLocationOverlayRef.current = new kakao.maps.CustomOverlay({ position: locPosition, content, yAnchor: 0.5 });
        myLocationOverlayRef.current.setMap(map);
      });
    }
  };

  const initMap = () => {
    const { kakao } = window as any;
    kakao.maps.load(() => {
      if (!mapRef.current) return;
      mapInstance.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5
      });

      clustererRef.current = new kakao.maps.MarkerClusterer({
        map: mapInstance.current,
        averageCenter: true,
        minLevel: 6,
        disableClickZoom: false
      });

      handleMoveToCurrentLocation();

      kakao.maps.event.addListener(mapInstance.current, 'click', () => onSelectItem(null, 'DISASTER'));
      renderItems();
      setMapReady(true);
    });
  };
  const renderItems = () => {
    const { kakao } = window as any;
    if (!mapInstance.current) return;

    [...overlaysRef.current, ...polygonsRef.current].forEach(item => item.setMap(null));
    overlaysRef.current = [];
    polygonsRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clear();
    }

    // 1. 재난 문자 마커 (Z-Index를 높여서 항상 위로)
    if (activeCategory === 'DISASTER') {
      const markers: any[] = [];

      // A. 재난 문자 마커
      disasterData.forEach(data => {
        const pos = new kakao.maps.LatLng(data.latitude, data.longitude);
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="cursor:pointer; width:30px; height:30px; background:white; border-radius:50%; border:3px solid #FF4B4B; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            ⚠️
          </div>`;

        content.onclick = (e) => { 
          e.stopPropagation(); 
          onSelectItem(data, 'DISASTER'); 
          mapInstance.current.panTo(pos); 
        };

        const overlay = new kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 0.5,
          zIndex: 10
        });
        
        markers.push(overlay); 
      });

      weatherAlerts.forEach(alert => {
        try {
          const colors = { HIGH: '#FF0000', MID: '#FF9800', LOW: '#FFD700' };
          const alertColor = colors[alert.severity] || '#FF9800';

          const path = JSON.parse(alert.boundaryGeojson).coordinates[0].map((c: any) => new kakao.maps.LatLng(c[1], c[0]));
          const poly = new kakao.maps.Polygon({
            path,
            strokeWeight: 3,
            strokeColor: alertColor,
            fillColor: alertColor,
            fillOpacity: 0.15
          });
          poly.setMap(mapInstance.current);
          polygonsRef.current.push(poly);

          const pos = new kakao.maps.LatLng(alert.latitude, alert.longitude);
          const content = document.createElement('div');
          content.innerHTML = `
            <div style="cursor:pointer; display:flex; align-items:center; background:white; padding:3px 8px 3px 3px; border-radius:20px; border:2px solid ${alertColor}; box-shadow:0 2px 6px rgba(0,0,0,0.2); white-space:nowrap;">
              <div style="width:22px; height:22px; background:${alertColor}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; margin-right:5px;">📢</div>
              <span style="font-size:11px; font-weight:bold; color:#333;">${alert.alertType}</span>
            </div>`;

          content.onclick = (e) => {
            e.stopPropagation();
            onSelectItem(alert, 'WEATHER');
            mapInstance.current.panTo(pos);
          };

          const overlay = new kakao.maps.CustomOverlay({
            position: pos,
            content,
            yAnchor: 0.7,
            zIndex: 5
          });
          
          markers.push(overlay); 
        } catch (e) { }
      });

      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers);
      }
    }

    // 주변 안전 시설
    if (activeCategory === 'SAFETY') {
      const markers: any[] = [];

      safetyData?.forEach((facility) => {
        const pos = new kakao.maps.LatLng(facility.latitude, facility.longitude);
        const icon = facility.type === 'FIRE_HYDRANT' ? '🚨' : facility.type === 'SHELTER' ? '🏠' : '⚡';

        const content = document.createElement('div');
        content.innerHTML = `
          <div style="cursor:pointer; background:white; color:#333; padding:5px 10px; border:2px solid #4C5CA4; border-radius:20px; font-weight:bold; font-size:12px; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
            <span style="font-size:14px;">${icon}</span>
            <span>${facility.name}</span>
          </div>`;

        content.onclick = (e) => {
          e.stopPropagation();
          onSelectItem(facility, 'SAFETY');
          mapInstance.current.panTo(pos);
        };

        const overlay = new kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 1
        });

        markers.push(overlay);
      });

      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers);
      }
    }

    if (activeCategory === 'REPORT') {
      const markers: any[] = []; 

      mapReports.forEach((report) => {
        const pos = new kakao.maps.LatLng(report.latitude, report.longitude);
        const icon = report.type.split(' ')[0];

        const content = document.createElement('div');
        content.innerHTML = `
        <div style="cursor:pointer; background:white; padding:5px 12px; border-radius:20px; border:2px solid #FF8A00; box-shadow:0 2px 8px rgba(0,0,0,0.2); display:flex; align-items:center; gap:5px;">
          <span style="font-size:14px;">${icon}</span>
          <span style="font-size:12px; font-weight:bold; color:#333;">${report.type.split(' ')[1]} 제보</span>
        </div>`;

        content.onclick = (e) => {
          e.stopPropagation();
          onSelectItem(report, 'REPORT');
          mapInstance.current.panTo(pos);
        };

        const overlay = new kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 1.2,
          zIndex: 30
        });

        markers.push(overlay); 
      });

      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers);
      }
    }
  };

  useEffect(() => {
    if (mapInstance.current) renderItems();
  }, [disasterData, weatherAlerts, mapReports, activeCategory]);

  useEffect(() => {
    const { kakao } = window as any;
    if (!mapInstance.current || !kakao) return;

    if (extractedOverlayRef.current) {
      extractedOverlayRef.current.setMap(null);
      extractedOverlayRef.current = null;
    }

    if (!extractedDisaster?.lat || !extractedDisaster?.lng) return;

    const pos = new kakao.maps.LatLng(extractedDisaster.lat, extractedDisaster.lng);

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <div style="
          background:white;
          border:3px solid #4C5CA4;
          border-radius:16px;
          padding:8px 14px;
          box-shadow:0 4px 16px rgba(76,92,164,0.35);
          min-width:160px;
          max-width:240px;
          text-align:center;
        ">
          <div style="font-size:11px; font-weight:900; color:#4C5CA4; letter-spacing:0.05em; margin-bottom:4px;">📍 AI 위치 추출</div>
          ${extractedDisaster.time ? `<div style="font-size:11px; color:#FF6B35; font-weight:700; margin-bottom:3px;">🕐 ${extractedDisaster.time}</div>` : ''}
          <div style="font-size:11px; color:#333; font-weight:600; line-height:1.4; word-break:keep-all;">${extractedDisaster.location || '위치 정보'}</div>
        </div>
        <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #4C5CA4;"></div>
        <div style="
          width:16px; height:16px;
          background:#4C5CA4;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 0 4px rgba(76,92,164,0.3), 0 0 0 8px rgba(76,92,164,0.1);
          margin-top:-2px;
        "></div>
      </div>`;

    extractedOverlayRef.current = new kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.15,
      zIndex: 50,
    });
    extractedOverlayRef.current.setMap(mapInstance.current);
    mapInstance.current.panTo(pos);
  }, [extractedDisaster]);

  const getFireStage = (createdAt: string): 'active' | 'cooling' | 'ended' | null => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    if (hours >= 12) return null;
    if (hours >= 6)  return 'ended';
    if (hours >= 2)  return 'cooling';
    return 'active';
  };

  const stageStyle = {
    active:  { bg: 'linear-gradient(135deg,#CC0000,#FF2020)', stem: '#CC0000', shadow: 'rgba(204,0,0,0.6)',    opacity: '1',   animation: 'firePulse 1.2s ease-in-out infinite', cardBorder: '#CC0000' },
    cooling: { bg: 'linear-gradient(135deg,#FF6A00,#FF9500)', stem: '#FF6A00', shadow: 'rgba(255,106,0,0.4)',  opacity: '0.55', animation: 'none',                               cardBorder: '#FF6A00' },
    ended:   { bg: '#999999',                                  stem: '#999999', shadow: 'rgba(0,0,0,0.15)',     opacity: '0.45', animation: 'none',                               cardBorder: '#999999' },
  };

  useEffect(() => {
    const { kakao } = window as any;
    if (!mapInstance.current || !kakao) return;

    // 기존 화재 마커 전부 제거
    fireOverlaysRef.current.forEach(o => o.setMap(null));
    fireOverlaysRef.current = [];
    if (fireInfoOverlayRef.current) {
      fireInfoOverlayRef.current.setMap(null);
      fireInfoOverlayRef.current = null;
    }

    fireMarkers
      .filter(fire => getFireStage(fire.createdAt) !== null)
      .forEach((fire, index) => {
      const stage = getFireStage(fire.createdAt)!;
      const s = stageStyle[stage];
      const pos = new kakao.maps.LatLng(fire.latitude, fire.longitude);

      // 핀드롭 딜레이를 마커마다 약간씩 다르게
      const delay = index * 80;

      const content = document.createElement('div');
      content.innerHTML = `
        <div class="fire-pin-wrapper" style="
          display:flex; flex-direction:column; align-items:center;
          animation: firePinDrop 0.45s cubic-bezier(.22,.68,0,1.2) ${delay}ms both;
          cursor:pointer;
          opacity:${s.opacity};
        ">
          <div style="
            width:36px; height:36px;
            background:${s.bg};
            border:2.5px solid white;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:18px;
            box-shadow:0 3px 12px ${s.shadow};
            animation:${s.animation};
          ">🔥</div>
          <div style="width:2px;height:8px;background:${s.stem};"></div>
          <div style="width:8px;height:4px;background:${s.shadow};border-radius:50%;"></div>
        </div>`;

      content.onclick = (e) => {
        e.stopPropagation();

        // 같은 마커 재클릭 시 닫기 (토글)
        if (fireInfoOpenIdRef.current === fire.id) {
          fireInfoOverlayRef.current?.setMap(null);
          fireInfoOverlayRef.current = null;
          fireInfoOpenIdRef.current = null;
          return;
        }

        // 다른 마커의 인포윈도우가 열려있으면 닫기
        if (fireInfoOverlayRef.current) {
          fireInfoOverlayRef.current.setMap(null);
          fireInfoOverlayRef.current = null;
        }

        const infoContent = document.createElement('div');
        infoContent.innerHTML = `
          <div id="fire-info-card-${fire.id}" style="
            position:relative;
            background:white;
            border-radius:16px;
            padding:14px 16px 12px;
            box-shadow:0 6px 24px rgba(0,0,0,0.18);
            width:300px;
            border-top:4px solid ${s.cardBorder};
            cursor:pointer;
          ">
            <button id="fire-info-close-${fire.id}" style="
              position:absolute; top:8px; right:10px;
              background:none; border:none; cursor:pointer;
              font-size:15px; color:#aaa; line-height:1;
            ">✕</button>
            <div style="font-size:12px;font-weight:900;color:${s.cardBorder};margin-bottom:6px;">${stage === 'active' ? '🔥 화재 진행 중' : stage === 'cooling' ? '🟠 정리 중' : '⬜ 상황 종료'}</div>
            <div style="font-size:11px;color:#555;margin-bottom:3px;">📍 ${fire.parsedAddress}</div>
            <div style="font-size:11px;color:#777;margin-bottom:8px;">📡 수신: ${fire.rcptnRgnNm}</div>
            <div style="
              font-size:11px;color:#333;line-height:1.6;
              border-top:1px solid #f0f0f0;padding-top:8px;
              word-break:keep-all;overflow-wrap:break-word;white-space:normal;
            ">${fire.messageContent}</div>
            <div style="font-size:10px;color:#bbb;margin-top:6px;text-align:right;">
              ${new Date(fire.createdAt).toLocaleString('ko-KR')}
            </div>
          </div>`;

        const infoOverlay = new kakao.maps.CustomOverlay({
          position: pos,
          content: infoContent,
          yAnchor: 1.25,
          zIndex: 100,
        });
        infoOverlay.setMap(mapInstance.current);
        fireInfoOverlayRef.current = infoOverlay;
        fireInfoOpenIdRef.current = fire.id;

        const closeOverlay = () => {
          infoOverlay.setMap(null);
          fireInfoOverlayRef.current = null;
          fireInfoOpenIdRef.current = null;
        };

        // 팝업 카드 클릭 시 닫기 + ✕ 버튼 클릭 시 닫기
        setTimeout(() => {
          const card = document.getElementById(`fire-info-card-${fire.id}`);
          const closeBtn = document.getElementById(`fire-info-close-${fire.id}`);
          if (card) card.onclick = (ev) => { ev.stopPropagation(); closeOverlay(); };
          if (closeBtn) closeBtn.onclick = (ev) => { ev.stopPropagation(); closeOverlay(); };
        }, 0);

        mapInstance.current.panTo(pos);
      };

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: 1.2,
        zIndex: 40,
      });
      overlay.setMap(mapInstance.current);
      fireOverlaysRef.current.push(overlay);
    });
  }, [fireMarkers, mapReady]);

  return (
    <div className="relative w-full h-full">
      <Script src={KAKAO_SDK_URL} strategy="afterInteractive" onLoad={initMap} />

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleMoveToCurrentLocation();
        }}
        className="absolute bottom-24 right-6 z-[20] bg-white p-3 rounded-full shadow-xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
        title="현위치로 이동"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4C5CA4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </button>

      <style>{`
        .kakao_scale, .kakao_copyright, [style*="z-index: 1; margin: 0px 6px;"] {
          display: none !important;
        }
        @keyframes firePinDrop {
          0%   { transform: translateY(-40px); opacity: 0; }
          60%  { transform: translateY(4px);   opacity: 1; }
          80%  { transform: translateY(-6px); }
          100% { transform: translateY(0);     opacity: 1; }
        }
        @keyframes firePulse {
          0%, 100% { box-shadow: 0 3px 12px rgba(255,75,75,0.55); transform: scale(1); }
          50%       { box-shadow: 0 3px 22px rgba(255,75,75,0.85), 0 0 0 6px rgba(255,75,75,0.15); transform: scale(1.08); }
        }
      `}</style>

      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}