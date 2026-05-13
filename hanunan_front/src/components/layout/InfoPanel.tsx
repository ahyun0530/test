//하단 패널

import React from 'react';

interface InfoPanelProps {
  selectedItem: any;
  itemType: string | null;
  fireStats: any;
  activeCategory: string;
  sortedItems: any[];
  userLocation: { lat: number; lng: number } | null;
  setSelectedItem: (item: any) => void;
  handleSelectItem: (
    item: any, 
    type: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT'
  ) => void | Promise<void>;
  getDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  setIsReportModalOpen: (open: boolean) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedItem,
  itemType,
  fireStats,
  activeCategory,
  sortedItems,
  userLocation,
  setSelectedItem,
  handleSelectItem,
  getDistance,
  setIsReportModalOpen,
}) => {

  // 0512: 실시간 화재 데이터 여부 확인
 const isFirePipeline = selectedItem?.isFirePipeline || selectedItem?.uniqueKey?.startsWith('rt-fire');

  return (
    <section className="h-[300px] bg-[#4C5CA4] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
      {selectedItem ? (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-black">
              {/*0512 실시간 화재 데이터일 경우 타이틀 강조 */}
              {isFirePipeline ? (
                <span className="text-[#FFB800]">🔥 실시간 화재 감지</span>
              ) : (
                itemType === 'FIRE' ? `${selectedItem.frstCetrNm} 통계` :
                itemType === 'SAFETY' ? selectedItem.name :
                (selectedItem.category || selectedItem.alertType || '상세 정보')
              )}
            </h2>
            <button onClick={() => setSelectedItem(null)} className="text-2xl hover:opacity-50 transition-opacity">✕</button>
          </div>

          <div className="grid grid-cols-3 gap-8 flex-1 overflow-hidden">
            {/* 1. 위치 및 발생 정보 섹션 */}
            <div className="bg-black/10 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar">
              <p className="text-sm opacity-50 mb-2 uppercase tracking-widest font-bold">
                {isFirePipeline ? 'Report Content' : (itemType === 'FIRE' ? 'Station Info' : 'Location Info')}
              </p>
              {/* 0512 */}
              <div className="space-y-2">
                {isFirePipeline ? (
                  <>
                    <p className="text-lg font-bold text-white">
                        주소: {selectedItem.parsedAddress || '위치 분석 중...'}
                    </p>

                    {/* 2. 수신 지역(rcptnRgnNm) 추가 */}
                    <p className="text-sm font-medium text-[#69CCFE] mb-2">
                        📍 수신 지역: {selectedItem.rcptnRgnNm || '지역 정보 없음'}
                    </p>

                    <p className="text-md leading-relaxed italic opacity-90 border-t border-white/10 pt-2">
                        내용: "{selectedItem.msgCn || selectedItem.messageContent}"
                    </p>

                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#FFB800]">🕒</span>
                        <span className="text-xs font-bold text-[#FFB800]">
                        발생일자: {
                            selectedItem?.crtDt || selectedItem?.createdAt 
                            ? new Date(selectedItem.crtDt || selectedItem.createdAt).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                                })
                            : "정보 없음"
                        }
                        </span>
                    </div>
                  </>
                ) : itemType === 'FIRE' ? (
                  <div className="space-y-1">
                    <p className="text-xl font-bold italic">관할 코드: {selectedItem.frstCntrid}</p>
                    <p className="text-lg opacity-80 italic">오늘 날짜: {fireStats?.ocrnYmd}</p>
                  </div>
                ) : itemType === 'REPORT' ? (
                  <div className="space-y-1">
                  <p className="text-xl font-bold text-[#FFB800]">
                    {selectedItem.type} {/* '🔥 화재' 또는 '🌧️ 기상' 출력 */}
                  </p>
                  <p className="text-sm opacity-70">
                    📍 제보 위치: {selectedItem.latitude.toFixed(4)}, {selectedItem.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-[#69CCFE] mt-2">
                    🕒 제보 시간: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : '방금 전'}
                  </p>
                  <p className="text-base font-medium text-white leading-relaxed italic">
                      "{selectedItem.description || "상세 내용이 없습니다."}"
                  </p>
                </div>
                ):(
                  <p className="text-lg leading-relaxed italic">
                    {itemType === 'SAFETY' ? `${selectedItem.address}` : `"${selectedItem.originalText || selectedItem.msgCn}"`}
                  </p>
                )}
              </div>
            </div>

            {/* 2. AI 분석 및 대응 섹션 */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-[#69CCFE] mb-2 uppercase tracking-widest font-bold">✨ AI Analysis</p>
              
              {isFirePipeline ? (
                <div className="space-y-3">
                    <p className="text-base font-bold text-white leading-relaxed italic">
                        {/* 데이터가 없을 경우 표시할 기본 메시지 */}
                        {selectedItem.aiSummary 
                        ? `"${selectedItem.aiSummary}"` 
                        : "실시간 화재 상황에 대한 AI 요약을 준비 중입니다..."}
                    </p>
                    <div className="pt-2 border-t border-white/10">
                        <p className="text-xs text-[#69CCFE] animate-pulse">● 실시간 데이터 분석 중</p>
                    </div>
                </div>
              ) : itemType === 'FIRE' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-xs opacity-60">🔥 화재 접수</p>
                    <p className="text-2xl font-black">{fireStats?.fireRcptMnb}건</p>
                  </div>
                  <div className="text-center bg-red-500/20 p-3 rounded-xl border border-red-400/30">
                    <p className="text-xs text-red-300 font-bold">🚒 현재 진행</p>
                    <p className="text-2xl font-black text-red-100">{fireStats?.fireProgMnb}건</p>
                  </div>
                </div>
              ) : (
                <p className="text-base font-medium opacity-90 leading-relaxed italic">
                  {selectedItem.aiSummary ? `"${selectedItem.aiSummary}"` : "데이터 분석 정보를 불러올 수 없습니다."}
                </p>
              )}
            </div>

            {/* 3. 액션 섹션 (제보/공유) */}
            <div
              className="cursor-pointer group h-full"
              onClick={() => setIsReportModalOpen(true)}
            >
              <div className="text-center bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center h-full hover:bg-white/10 transition-all gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:bg-[#69CCFE]/20 transition-colors">
                   <span className="text-2xl">📢</span>
                </div>
                <p className="text-sm font-bold text-white group-hover:scale-105 transition-transform">현장 제보 및 공유</p>
                <p className="text-[10px] opacity-50">추가 정보를 시민들과 공유하세요</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 리스트 모드 */
        <div className="h-full overflow-y-auto custom-scrollbar p-2">
          <h2 className="text-3xl font-black mb-4 px-4 sticky top-0 bg-[#4C5CA4] py-2 z-10">
            📍 내 주변 {activeCategory === 'SAFETY' ? '안전 시설' : activeCategory === 'REPORT' ? '시민 제보' : '재난 및 화재'}
          </h2>

          <div className="grid grid-cols-1 gap-3 px-4">
            {sortedItems.length > 0 ? (
              sortedItems.map((d) => (
                <div
                  key={d.uniqueKey}
                  onClick={() => {
                    // d.contentType이 'REPORT'인지 확인하거나, 제보 데이터 특성(userId 등)으로 판별
                    const type = d.userId ? 'REPORT' : d.contentType; 
                    handleSelectItem(d, type);
                  }}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    d.userId ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' : // 제보 전용 스타일
                    d.isFirePipeline ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30' : 
                    'bg-white/10 border-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      d.userId ? 'bg-[#69CCFE] text-white' : // 제보 라벨
                      d.isFirePipeline ? 'bg-[#FFB800] text-black' : 
                      'bg-[#69CCFE] text-[#4C5CA4]'
                    }`}>
                      {d.userId ? '시민 제보' : (d.isFirePipeline ? '실시간 화재' : (d.category || '기타'))}
                    </span>
                    <span className="text-xs font-bold opacity-70">
                      {userLocation
                        ? `${getDistance(userLocation.lat, userLocation.lng, d.latitude, d.longitude).toFixed(1)}km`
                        : '계산중...'}
                    </span>
                  </div>

                  <p className="text-sm font-medium leading-relaxed truncate">
                    {d.isFirePipeline 
                      ? `[감지] ${d.msgCn || d.messageContent}` 
                      : (d.frstCetrNm || d.originalText || d.name || d.description)}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-[150px] flex flex-col items-center justify-center text-white/40 gap-2">
                <p className="text-sm font-medium tracking-tight">주변에 정보가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default InfoPanel;