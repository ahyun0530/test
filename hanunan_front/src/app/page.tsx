"use client";
import { useEffect, useState, useRef, useMemo } from 'react';

import { Map, MapMarker } from "react-kakao-maps-sdk";

import KakaoMap from "@/components/map/KakaoMap";

import MyProfileModal from "@/components/modal/MyProfileModal"
import CreateReportModal from "@/components/modal/CreateReportModal";
import ReportWriteModal from "@/components/modal/ReportWriteModal";
import ReportListModal from "@/components/modal/ReportListModal";
import LoginModal from "@/components/auth/LoginModal";

import TopBar from "@/components/layout/TopBar";
import InfoPanel from "@/components/layout/InfoPanel";
import CitizenFeed from "@/components/layout/CitizenFeed";
import CategoryNav from "@/components/layout/CategoryNav";

import { getDistance, sortItemsByDistance } from "@/utils/mapUtils";

import { useInfoPanel } from "@hooks/useInfoPanel";
import { useCategory } from "@hooks/useCategory";
import {
    getDisasterMessages,
    getWeatherAlerts,
    getFireStations,
    getFireStationStats,
    getCitizenReports,
    getSidebarComments,
    createCitizenReport,
    createSidebarComment,
    deleteCitizenReport,
    reportCitizenReport,
    DisasterMessage,
    WeatherAlert,
    FireStation,
    FireDailyStat,
    CitizenReport,
    ReportComment,
    likeCitizenReport,
    updateCitizenReport,
    deleteSidebarComment,
    getSafetyFacilities,
    SafetyFacility,
    getMapReports,
    createMapReport,
    MapReport,
    extractDisasterInfo,
    DisasterExtractResult,
    fetchFireMarkers, //0512
    FireMarker, //0512
} from '@/services/api';


export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false);

    const [disasters, setDisasters] = useState<DisasterMessage[]>([]);
    const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
    const [fireStations, setFireStations] = useState<FireStation[]>([]);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isReportWriteModalOpen, setIsReportWriteModalOpen] = useState(false);

    const [likedReportIds, setLikedReportIds] = useState<number[]>([]);
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const currentUserId = 999;

    const [locationInput, setLocationInput] = useState("");
    const [position] = useState({ lat: 35.143, lng: 126.924 });
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [fireMarkers, setFireMarkers] = useState<FireMarker[]>([]); //0512

    const { 
        activeCategory, 
        handleCategoryChange, 
        safetyFacilities, 
        mapReports, 
        setMapReports 
    } = useCategory(isMounted);

    const infoPanelProps = {
        activeCategory,
        disasters,
        weatherAlerts,
        fireStations,
        safetyFacilities,
        mapReports,
        userLocation,
        fireMarkers //0512
    };

    const { 
        selectedItem, setSelectedItem, 
        itemType, fireStats, 
        comments, setComments,
        reports, setReports,
        sortedItems, 
        handleSelectItem 
    } = useInfoPanel(infoPanelProps);


    //0512
    useEffect(() => {
    // 실시간성을 위해 주기적으로 업데이트하거나 마운트 시 호출
    const loadFireData = async () => {
      try {
        const data = await fetchFireMarkers();
        setFireMarkers(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadFireData();
    const interval = setInterval(loadFireData, 1000 * 60 * 5); // 5분마다 갱신
    return () => clearInterval(interval);
  }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUserName(parsed.nickname);
            } catch (e) {
                console.error("유저 정보 파싱 에러", e);
            }
        }
    }, []);


    // (기상청)색상 상수 (Tailwind 또는 Hex 코드)
    const SEVERITY_COLORS = {
        LOW: '#FFD700',  // 노랑 (주의)
        MID: '#FF8C00',  // 주황 (경보)
        HIGH: '#FF0000', // 빨강 (심각)
    };

    useEffect(() => {
        setIsMounted(true);

        Promise.all([
            getDisasterMessages(),
            getWeatherAlerts(),
            getFireStations(),
            getCitizenReports(),
            getSidebarComments(),
            fetchFireMarkers() //0512
        ]).then(([d, w, f, r, c, fireM]) => {//0512
            setDisasters(d);
            setWeatherAlerts(w);
            setFireStations(f);
            setReports(r);
            setComments(c);
            setFireMarkers(fireM);
        });
    }, []);


    // 하이드레이션 방지
    if (!isMounted) return null;

    return (
        <main className="flex h-[100dvh] w-full bg-[#F0F2F5] p-6 gap-6 overflow-hidden relative">
            {/* 상단 오른쪽 헤더(로그인/제보마커) */}
            <TopBar 
                isMounted={isMounted}
                userName={userName}
                setIsReportWriteModalOpen={setIsReportWriteModalOpen}
                setIsProfileModalOpen={setIsProfileModalOpen}
                setIsLoginModalOpen={setIsLoginModalOpen}
            />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            {/* --- 왼쪽 사이드바 --- */}
            <aside className="w-80 flex flex-col gap-6 h-full">
                <h1 className="text-4xl font-black text-[#3954AA] italic">한눈에 안전</h1>

                {/* 3개 마커 필터링 버튼 */}
                <CategoryNav 
                    activeCategory={activeCategory} 
                    handleCategoryChange={handleCategoryChange} 
                />

                {/* 시민 댓글 피드 */}
                <CitizenFeed 
                    comments={comments}
                    setComments={setComments}   // 상태 변경 권한 부여
                    currentUserId={currentUserId}
                    selectedItem={selectedItem}
                    itemType={itemType}         // API 호출을 위해 필요
                />
            </aside>

            <div className="flex-1 flex flex-col gap-6 h-full">
                <section className="flex-1 bg-white rounded-[40px] shadow-xl overflow-hidden relative border-4 border-white">
                    <KakaoMap 
                    center={position} 
                    activeCategory={activeCategory} 
                    disasterData={disasters} 
                    weatherAlerts={weatherAlerts} 
                    fireStations={fireStations} 
                    safetyData={safetyFacilities}
                    mapReports={mapReports} 
                    fireMarkers={fireMarkers} //0512
                    onSelectItem={(item, type) => handleSelectItem(item, type)} //0512 마커 클릭 시 handleSelectItem이 실행되도록 전달
                     />
                </section>

                {/* 하단 패널 */}
                <InfoPanel 
                    selectedItem={selectedItem}
                    itemType={itemType}
                    fireStats={fireStats}
                    activeCategory={activeCategory}
                    sortedItems={sortedItems}
                    userLocation={userLocation}
                    setSelectedItem={setSelectedItem}
                    handleSelectItem={handleSelectItem}
                    getDistance={getDistance}
                    setIsReportModalOpen={setIsReportModalOpen}
                />
            </div>
        
            {/* 정보공유창리스트 모달*/}
            <ReportListModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                setIsCreateModalOpen={setIsCreateModalOpen}
                reports={reports}
                setReports={setReports} // 상태 업데이트를 위해 전달
                currentUserId={currentUserId}
                selectedItem={selectedItem}
                itemType={itemType}
                likedReportIds={likedReportIds} 
                setLikedReportIds={setLikedReportIds}
            />
            {/* 시민 제보 마커 작성 모달 */}
            <ReportWriteModal
                isOpen={isReportWriteModalOpen}
                onClose={() => setIsReportWriteModalOpen(false)}
                currentUserId={currentUserId}
                createMapReport={createMapReport} // API 함수 전달
                setMapReports={setMapReports}     // 상태 변경 함수 전달
            />
            

            {/* (정보 공유)시민 제보 작성 모달 */}
            <CreateReportModal 
                isOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                setIsReportModalOpen={setIsReportModalOpen}
                setReports={setReports}
                currentUserId={currentUserId}   // 현재 로그인 유저 ID
                selectedItem={selectedItem} // 선택된 마커 정보
                itemType={itemType}       // 마커 타입 (DISASTER 등)
                />

            {isProfileModalOpen && isMounted && userName && (
                <MyProfileModal
                    userId={currentUserId}
                    onClose={() => setIsProfileModalOpen(false)}
                    mapReports={mapReports}
                    citizenReports={reports}
                    sidebarComments={comments}
                    setReports={setReports}
                    setMapReports={setMapReports}
                    setSidebarComments={setComments}
                />
            )}
        </main>
    );
}