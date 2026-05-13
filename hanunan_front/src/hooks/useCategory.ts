
import { useState, useEffect } from 'react';
import { getSafetyFacilities, getMapReports, SafetyFacility, MapReport } from '@/services/api';

export const useCategory = (isMounted: boolean) => {
    const [activeCategory, setActiveCategory] = useState<'DISASTER' | 'SAFETY' | 'REPORT'>('DISASTER');
    const [safetyFacilities, setSafetyFacilities] = useState<SafetyFacility[]>([]);
    const [mapReports, setMapReports] = useState<MapReport[]>([]);

    const handleCategoryChange = (category: 'DISASTER' | 'SAFETY' | 'REPORT') => {
        setActiveCategory(category);
    };

    useEffect(() => {
        if (!isMounted) return;

        if (activeCategory === 'REPORT') {
            getMapReports().then(setMapReports);
        }

        if (activeCategory === 'SAFETY') {
            const fetchSafetyData = async () => {
                try {
                    const data = await getSafetyFacilities();
                    setSafetyFacilities(data);
                } catch (error) {
                    console.error("안전 시설 데이터를 가져오는데 실패했습니다.", error);
                }
            };
            fetchSafetyData();
        }
    }, [activeCategory, isMounted]);


    return {
        activeCategory,
        handleCategoryChange,
        safetyFacilities,
        mapReports,
        setMapReports 
    };
};