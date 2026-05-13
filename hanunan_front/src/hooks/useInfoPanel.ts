//하단 패널 관련 함수 로직

import { useState, useMemo } from 'react';
import { getDistance, sortItemsByDistance } from "@/utils/mapUtils";
import { 
    getFireStationStats, 
    getCitizenReports, 
    getSidebarComments, 
    FireMarker } from '@/services/api'; //0512

interface UseInfoPanelProps {
    activeCategory: 'DISASTER' | 'SAFETY' | 'REPORT';
    disasters: any[];
    weatherAlerts: any[];
    fireStations: any[];
    safetyFacilities: any[];
    mapReports: any[];
    fireMarkers: FireMarker[]; //0512
    userLocation: { lat: number, lng: number } | null;
}

export const useInfoPanel = ({
    activeCategory,
    disasters,
    weatherAlerts,
    fireStations,
    safetyFacilities,
    mapReports,
    fireMarkers, //0512
    userLocation
}: UseInfoPanelProps) => {

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [itemType, setItemType] = useState<'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT' | null>(null);
    const [fireStats, setFireStats] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    
    const sortedItems = useMemo(() => {
        let itemsToDisplay: any[] = [];

        if (activeCategory === 'DISASTER') {
            //일반 재난문자 매핑
            const disasterItems = disasters.map(d => ({
                ...d,
                uniqueKey: `disaster-${d.id}`,
                contentType: 'DISASTER' 
            }));

            //0512 백엔드 실시간 화재 마커 매핑
            const realTimeFireItems = fireMarkers.map(f => ({
                ...f,
                uniqueKey: `rt-fire-${f.id}`,
                contentType: 'DISASTER', // 재난 카테고리에 표시
                isFirePipeline: true,    // 화재 파이프라인 데이터 구분자
                // 리스트 UI 호환을 위해 필드명 통일
                msgCn: f.messageContent,
                crtDt: f.createdAt,
                locationName: f.parsedAddress || f.rcptnRgnNm
            }));

            const weatherItems = weatherAlerts.map(w => ({
                ...w,
                uniqueKey: `weather-${w.id}`,
                contentType: 'WEATHER' 
            }));

            const fireItems = fireStations.map(f => ({
                ...f,
                uniqueKey: `fire-${f.id}`,
                contentType: 'FIRE',
                name: f.frstCetrNm,
                latitude: f.centerLatitude,
                longitude: f.centerLongitude
            }));

            //0512 화재 파이프라인 아이템을 포함하여 통합
            itemsToDisplay = [...disasterItems, ...realTimeFireItems, ...weatherItems, ...fireItems];
        }
        else if (activeCategory === 'SAFETY') {
            itemsToDisplay = safetyFacilities.map(s => ({ ...s, uniqueKey: `safety-${s.id}` }));
        }
        else if (activeCategory === 'REPORT') {
            itemsToDisplay = mapReports.map(r => ({ ...r, uniqueKey: `report-${r.id}` }));
        }

        const filteredItems = userLocation
            ? itemsToDisplay.filter(item => {
                if (item.latitude === undefined || item.longitude === undefined) return false;
                const dist = getDistance(userLocation.lat, userLocation.lng, item.latitude, item.longitude);
                return dist <= 10;
            })
            : itemsToDisplay;

        return sortItemsByDistance(filteredItems, userLocation);

    }, [activeCategory, disasters, weatherAlerts, fireStations, safetyFacilities, mapReports, userLocation]);
    
    const handleSelectItem = async (item: any, type: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT') => {
        if (!item) {
            setSelectedItem(null);
            setItemType(null);
            setFireStats(null);
            return;
        }

        //0512 화재 파이프라인 데이터인 경우 필드 보정 로직
        let processedItem = item;
        if (type === 'DISASTER' && (item.isFirePipeline || item.uniqueKey?.startsWith('rt-fire'))) {
            processedItem = {
                ...item,
                isFirePipeline: true, // 판정 플래그 주입
                msgCn: item.messageContent || item.msgCn, // 원문 매핑 보정
                parsedAddress: item.parsedAddress || item.locationName || item.rcptnRgnNm, // 주소 매핑 보정
                aiSummary: item.aiSummary // AI 요령 유지
            };
        }

        setSelectedItem(processedItem);
        setItemType(type);

        // 1. 소방서 통계 로딩
        if (type === 'FIRE') {
            try {
                const stats = await getFireStationStats(item.id);
                setFireStats(stats);
            } catch (e) { console.error("통계 로딩 실패", e); }
        }

        // 2. 해당 마커의 댓글 로딩
        try {
            const filteredComments = await getSidebarComments(item.id, type);
            setComments(filteredComments);
        } catch (e) { setComments([]); }

        // 3. 해당 마커의 제보 로딩
        try {
            const filteredReports = await getCitizenReports(item.id, type);
            setReports(filteredReports);
        } catch (e) { setReports([]); }
    };

    return {
        selectedItem, setSelectedItem,
        itemType, fireStats,
        comments, setComments,
        reports, setReports,
        sortedItems, 
        handleSelectItem
    };
};