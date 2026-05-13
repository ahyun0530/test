//제보마커 생성 모달

import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

interface ReportWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  setMapReports: React.Dispatch<React.SetStateAction<any[]>>;
  createMapReport: (data: any) => Promise<any>;
}

const ReportWriteModal = ({
    isOpen,
    onClose,
    currentUserId,
    setMapReports,
    createMapReport
}: ReportWriteModalProps) => {
    const [mapCenter, setMapCenter] = useState({ lat: 35.1595, lng: 126.8526 }); // 기본값 광주
    const [selectedReportType, setSelectedReportType] = useState('🔥 화재');
    const [reportDescription, setReportDescription] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

    //제보창이 열릴 때 내 위치를 가져오는 효과
        useEffect(() => {
            if (isOpen) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            setMapCenter(newPos);
                            setSelectedLocation(newPos);
                        },
                        (error) => {
                            console.error("위치 정보를 가져오는데 실패했습니다.", error);
                            // 실패 시 기존 기본값(광주) 유지
                        }
                    );
                }
            }
        }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
    if (!selectedLocation) {
      alert('지도에서 위치를 선택해 주세요!');
      return;
    }
    if (!reportDescription.trim()) {
      alert('상세 내용을 입력해 주세요!');
      return;
    }

    try {
      const newReport = await createMapReport({
        type: selectedReportType,
        description: reportDescription,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        userId: currentUserId,
      });

      // 성공 시 처리
     setMapReports((prev) => [newReport, ...prev]);
      alert('제보가 성공적으로 접수되었습니다.');
      
      // 상태 초기화 및 닫기
      setReportDescription('');
      setSelectedLocation(null);
      onClose();
    } catch (error) {
      console.error("제보 등록 실패:", error);
      alert("제보 등록 중 오류가 발생했습니다.");
    }
  };

    return(
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
                             <div
                                 className="absolute inset-0 bg-black/50"
                                 onClick={onClose}
                             />
         
                             <div className="relative bg-[#F0F2F5] rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden border-4 border-[#3954AA] shadow-2xl animate-slide-up">
         
                                 <div className="flex justify-between items-center p-8 bg-white border-b border-gray-200">
                                     <div className="flex items-center gap-4">
                                         <h2 className="text-2xl font-black text-[#3954AA] italic flex items-center gap-3">
                                             <span className="text-orange-500 text-3xl">📣</span> CREATE REPORT
                                         </h2>
                                     </div>
                                     <button onClick={onClose} className="text-4xl text-black hover:text-gray-600 font-light">✕</button>
                                 </div>
         
                                 <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F0F2F5]">
         
                                     <div className="space-y-3">
                                         <p className="text-sm font-black text-[#3954AA] uppercase tracking-wider italic">1. TYPE</p>
                                         <div className="flex flex-wrap gap-3">
                                             {['🔥 화재', '🌧️ 기상'].map((type) => (
                                                 <button
                                                     key={type}
                                                     onClick={() => setSelectedReportType(type)}
                                                     className={`px-6 py-3 rounded-[20px] border-2 transition-all shadow-sm font-bold ${selectedReportType === type
                                                         ? "bg-[#3954AA] border-[#3954AA] text-white"
                                                         : "bg-white border-gray-100 text-[#3954AA] hover:border-[#3954AA]"
                                                         }`}
                                                 >
                                                     {type}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
         
                                     <div className="space-y-3">
                                         <p className="text-sm font-black text-[#3954AA] uppercase tracking-wider italic">2. DESCRIPTION</p>
                                         <textarea
                                             value={reportDescription}
                                             onChange={(e) => setReportDescription(e.target.value)}
                                             placeholder="상황을 자세히 설명해주세요 (예: OO동 사거리 건물 화재 발생)"
                                             className="w-full h-48 bg-white border-2 border-gray-100 rounded-[30px] p-6 text-black placeholder:text-gray-300 focus:outline-none focus:border-[#3954AA] shadow-sm transition-all resize-none font-medium text-lg"
                                         />
                                     </div>
         
                                     <div className="space-y-3">
                                         <p className="text-sm font-black text-[#3954AA] uppercase tracking-wider italic">3. LOCATION (지도 클릭 시 핀이 고정됩니다)</p>
                                         <div className="w-full h-80 rounded-[30px] overflow-hidden border-2 border-[#3954AA]/20 shadow-inner relative">
                                             <Map
                                                 center={mapCenter}
                                                 style={{ width: "100%", height: "100%" }}
                                                 level={3}
                                                 onClick={(_t, mouseEvent) => {
                                                     setSelectedLocation({
                                                         lat: mouseEvent.latLng.getLat(),
                                                         lng: mouseEvent.latLng.getLng(),
                                                     });
                                                 }}
                                             >
                                                 {selectedLocation && <MapMarker position={selectedLocation} />}
                                             </Map>
         
                                         </div>
                                     </div>
                                 </div>
         
                                 <div className="p-8 bg-white border-t border-gray-200">
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-5 bg-[#3954AA] text-white rounded-[25px] text-xl font-black shadow-lg hover:bg-[#2e4388] transition-all transform hover:scale-[1.01] active:scale-[0.98]"
                                    >
                                         SUBMIT REPORT
                                     </button>
                                 </div>
                             </div>
                         </div>
    );
};

export default ReportWriteModal;
