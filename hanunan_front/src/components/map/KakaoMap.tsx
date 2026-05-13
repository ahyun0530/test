'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { DisasterMessage, WeatherAlert, FireStation, SafetyFacility, FireMarker } from '@/services/api'; //0512

const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;

interface KakaoMapProps {
  center: { lat: number; lng: number };
  activeCategory: "DISASTER" | "SAFETY" | "REPORT";
  disasterData: DisasterMessage[];
  weatherAlerts: WeatherAlert[];
  fireStations: FireStation[];
  safetyData: SafetyFacility[];
  mapReports: any[];
  fireMarkers: FireMarker[]; //0512
  onSelectItem: (item: any, type: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT') => void;
}

export default function KakaoMap({ center, activeCategory, disasterData, weatherAlerts, fireStations, safetyData, mapReports, onSelectItem, fireMarkers }: KakaoMapProps) { //0512
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const myLocationOverlayRef = useRef<any>(null);
  
  // 시설별 클러스터러 관리
  const disasterClusterer = useRef<any>(null);
  const shelterClusterer = useRef<any>(null);   
  const aedClusterer = useRef<any>(null);       
  const hydrantClusterer = useRef<any>(null);   
  const reportClusterer = useRef<any>(null);

  //0512 시간 기반 화재 단계 판별 함수
  const getFireStage = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 2) return 'active';     // 0~2시간: 진행 중 (빨강 + 깜빡임)
    if (diffHours <= 6) return 'cooling';    // 2~6시간: 정리 중 (주황)
    if (diffHours <= 12) return 'ended';     // 6~12시간: 종료 추정 (회색)
    return 'deleted';                         // 12시간 이상: 삭제
  };

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
        () => alert("위치 정보를 가져올 수 없습니다.")
      );
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

      const createClusterer = (color: string) => new kakao.maps.MarkerClusterer({
        map: mapInstance.current,
        averageCenter: true,
        minLevel: 6,
        styles: [{
          width: '40px', height: '40px', background: color,
          borderRadius: '20px', color: '#fff', textAlign: 'center',
          lineHeight: '40px', fontSize: '12px', fontWeight: 'bold'
        }]
      });

      disasterClusterer.current = createClusterer('rgba(255, 75, 75, 0.9)');
      shelterClusterer.current = createClusterer('rgba(76, 92, 164, 0.9)'); 
      aedClusterer.current = createClusterer('rgba(255, 152, 0, 0.9)');   
      hydrantClusterer.current = createClusterer('rgba(244, 67, 54, 0.9)'); 
      reportClusterer.current = createClusterer('rgba(255, 138, 0, 0.9)');

      handleMoveToCurrentLocation();
      kakao.maps.event.addListener(mapInstance.current, 'click', () => onSelectItem(null, 'DISASTER'));
      renderItems();
    });
  };

  const renderItems = () => {
    const { kakao } = window as any;
    if (!mapInstance.current) return;

    // 1. 기존 폴리곤 및 오버레이 제거
    [...overlaysRef.current, ...polygonsRef.current].forEach(item => item.setMap(null));
    overlaysRef.current = [];
    polygonsRef.current = [];

    // 2. 모든 클러스터러 비우기
    [disasterClusterer, shelterClusterer, aedClusterer, hydrantClusterer, reportClusterer]
      .forEach(ref => ref.current?.clear());

    // 3. 마커 바구니 생성
    const disasterMarkers: any[] = [];
    const shelterMarkers: any[] = [];
    const aedMarkers: any[] = [];
    const hydrantMarkers: any[] = [];
    const reportMarkers: any[] = [];

    if (activeCategory === 'DISASTER') {
      //일반 재난문자 데이터
      disasterData.forEach(data => {
        const pos = new kakao.maps.LatLng(data.latitude, data.longitude);
        const content = document.createElement('div');
        content.innerHTML = `<div style="cursor:pointer; width:30px; height:30px; background:white; border-radius:50%; border:3px solid #FF4B4B; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">⚠️</div>`;
        content.onclick = (e) => { e.stopPropagation(); onSelectItem(data, 'DISASTER'); mapInstance.current.panTo(pos); };
        const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 0.5, zIndex: 10 });
        disasterMarkers.push(overlay);
        overlaysRef.current.push(overlay);
      });

      //0512 백엔드 화재 파이프라인 데이터 (FireMarker) 연동
      fireMarkers.forEach(fire => {
        const stage = getFireStage(fire.createdAt);
        if (stage === 'deleted') return; // 12시간 이상 경과 시 렌더링 제외

        const pos = new kakao.maps.LatLng(fire.latitude, fire.longitude);
        const color = stage === 'active' ? '#FF4B4B' : stage === 'cooling' ? '#FF9800' : '#757575';
        const isPulse = stage === 'active' ? 'fire-pulse' : '';

        const content = document.createElement('div');
        content.className = `fire-marker-container ${isPulse}`;
        content.innerHTML = `
          <div style="cursor:pointer; width:34px; height:34px; background:${color}; border:3px solid white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 4px 12px rgba(0,0,0,0.4); transition: all 0.3s;">
            🔥
          </div>
        `;
         
        //0512 클릭 시 InfoPanel이 인식할 수 있도록 필드를 보정해서 넘김
        content.onclick = (e) => { 
          e.stopPropagation(); 
          
          // InfoPanel의 규격에 맞게 데이터를 보정하여 전달
          const processedFire = {
            ...fire,
            isFirePipeline: true, // 이 플래그가 있어야 InfoPanel에서 화재 UI가 뜸
            uniqueKey: `rt-fire-${fire.id}`,
            msgCn: fire.messageContent, // 백엔드 필드명을 UI 필드명으로 매핑
            locationName: fire.parsedAddress || fire.rcptnRgnNm,
          };

          onSelectItem(processedFire, 'DISASTER'); 
          mapInstance.current.panTo(pos); 
        };

        const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 0.5, zIndex: 20 });
        disasterMarkers.push(overlay);
        overlaysRef.current.push(overlay);
      });

      weatherAlerts.forEach(alert => {
        try {
          const alertColor = alert.severity === 'HIGH' ? '#FF0000' : alert.severity === 'MID' ? '#FF9800' : '#FFD700';
          const path = JSON.parse(alert.boundaryGeojson).coordinates[0].map((c: any) => new kakao.maps.LatLng(c[1], c[0]));
          const poly = new kakao.maps.Polygon({
            path, strokeWeight: 3, strokeColor: alertColor, fillColor: alertColor, fillOpacity: 0.15, clickable: true
          });
          kakao.maps.event.addListener(poly, 'click', () => {
            kakao.maps.event.preventMap();
            onSelectItem(alert, 'WEATHER');
          });
          poly.setMap(mapInstance.current);
          polygonsRef.current.push(poly);
        } catch (e) {}
      });

      fireStations.forEach(station => {
        try {
          const path = JSON.parse(station.boundaryGeojson).coordinates[0].map((c: any) => new kakao.maps.LatLng(c[1], c[0]));
          const poly = new kakao.maps.Polygon({
            path, strokeWeight: 3, strokeColor: '#3954AA', fillColor: '#3954AA', fillOpacity: 0.05, strokeStyle: 'dashed', clickable: true
          });
          kakao.maps.event.addListener(poly, 'click', () => {
            kakao.maps.event.preventMap();
            onSelectItem(station, 'FIRE');
          });
          poly.setMap(mapInstance.current);
          polygonsRef.current.push(poly);
        } catch (e) {}
      });
    }

    if (activeCategory === 'SAFETY') {
      safetyData?.forEach((facility) => {
        const pos = new kakao.maps.LatLng(facility.latitude, facility.longitude);
        const icon = facility.type === 'FIRE_HYDRANT' ? '🚨' : facility.type === 'SHELTER' ? '🏠' : '⚡';
        const content = document.createElement('div');
        content.innerHTML = `<div style="cursor:pointer; background:white; color:#333; padding:5px 10px; border:2px solid #4C5CA4; border-radius:20px; font-weight:bold; font-size:12px; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="font-size:14px;">${icon}</span><span>${facility.name}</span></div>`;
        content.onclick = (e) => { e.stopPropagation(); onSelectItem(facility, 'SAFETY'); mapInstance.current.panTo(pos); };
        const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 1 });
        
        if (facility.type === 'SHELTER') shelterMarkers.push(overlay);
        else if (facility.type === 'AED') aedMarkers.push(overlay);
        else if (facility.type === 'FIRE_HYDRANT') hydrantMarkers.push(overlay);
        overlaysRef.current.push(overlay);
      });
    }

    if (activeCategory === 'REPORT') {
      mapReports.forEach((report) => {
        const pos = new kakao.maps.LatLng(report.latitude, report.longitude);
        const icon = report.type.split(' ')[0];
        const content = document.createElement('div');
        content.innerHTML = `<div style="cursor:pointer; background:white; padding:5px 12px; border-radius:20px; border:2px solid #FF8A00; box-shadow:0 2px 8px rgba(0,0,0,0.2); display:flex; align-items:center; gap:5px;"><span style="font-size:14px;">${icon}</span><span style="font-size:12px; font-weight:bold; color:#333;">${report.type.split(' ')[1]} 제보</span></div>`;
        content.onclick = (e) => { e.stopPropagation(); onSelectItem(report, 'REPORT'); mapInstance.current.panTo(pos); };
        const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 1.2, zIndex: 30 });
        reportMarkers.push(overlay);
        overlaysRef.current.push(overlay);
      });
    }

    // 4. 각 클러스터러에 마커 주입
    disasterClusterer.current?.addMarkers(disasterMarkers);
    shelterClusterer.current?.addMarkers(shelterMarkers);
    aedClusterer.current?.addMarkers(aedMarkers);
    hydrantClusterer.current?.addMarkers(hydrantMarkers);
    reportClusterer.current?.addMarkers(reportMarkers);
  };

  useEffect(() => {
    if (mapInstance.current) renderItems();
  }, [disasterData, weatherAlerts, fireStations, safetyData, mapReports, activeCategory]);

  return (
    <div className="relative w-full h-full">
      <Script src={KAKAO_SDK_URL} strategy="afterInteractive" onLoad={initMap} />
      
      {/*0512 화재 마커 애니메이션 스타일 */}
      <style>{`
        .kakao_scale, .kakao_copyright, [style*="z-index: 1; margin: 0px 6px;"] { display: none !important; }
        
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 75, 75, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(255, 75, 75, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 75, 75, 0); }
        }
        .fire-pulse {
          animation: pulse-red 2s infinite;
          border-radius: 50%;
        }
      `}</style>
      
      
      <button
        onClick={(e) => { e.stopPropagation(); handleMoveToCurrentLocation(); }}
        className="absolute bottom-6 right-6 z-[20] bg-white p-3 rounded-full shadow-xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
        title="현위치로 이동"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4C5CA4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </button>
      <style>{`
        .kakao_scale, .kakao_copyright, [style*="z-index: 1; margin: 0px 6px;"] { display: none !important; }
      `}</style>
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}