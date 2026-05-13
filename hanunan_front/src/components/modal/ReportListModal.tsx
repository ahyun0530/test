//마커별 현장상황 공유 리스트 조회 모달

import React,{ useState } from 'react';
import { 
  CitizenReport, 
  deleteCitizenReport, 
  likeCitizenReport, 
  reportCitizenReport, 
  updateCitizenReport, 
  getCitizenReports 
} from '../../services/api';

interface ReportListModalProps {
  isOpen: boolean;
  onClose: () => void; // 이름 변경: setIsReportModalOpen -> onClose
  setIsCreateModalOpen: (open: boolean) => void;
  reports: CitizenReport[];
  setReports: React.Dispatch<React.SetStateAction<CitizenReport[]>>; // 상태 변경 함수 추가
  currentUserId: number;
  selectedItem: any; // 수정을 위한 데이터 갱신 시 필요
  itemType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT' | null;
  likedReportIds: number[];
  setLikedReportIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const ReportListModal = ({
  isOpen,
  onClose,
  setIsCreateModalOpen,
  reports = [],
  setReports,
  currentUserId,
  selectedItem,
  itemType,
  likedReportIds = [], 
  setLikedReportIds
}: ReportListModalProps) => {
    const [sortBy, setSortBy] = useState<'LATEST' | 'POPULAR'>('LATEST');
    const [editingReportId, setEditingReportId] = useState<number | null>(null);
    const [editDescription, setEditDescription] = useState('');

    //0511 수정
    const visibleReports = reports.filter(r => (r.reliability ?? 100) > 50); // 50점 이하 자동 블라인드 처리된 데이터만 추출
    
  if (!isOpen) return null;
  
// --- [로직: 삭제] ---
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("제보를 삭제하시겠습니까?")) return;
    try {
      const success = await deleteCitizenReport(reportId);
      if (success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        alert("삭제되었습니다.");
      }
    } catch (e) {
      alert("삭제 실패");
    }
  };

  // --- [로직: 좋아요] ---
  const handleLikeReport = async (reportId: number) => {
    const isAlreadyLiked = likedReportIds.includes(reportId);
    try {
      const updatedReport = await likeCitizenReport(reportId, !isAlreadyLiked);
      setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
      
      if (isAlreadyLiked) {
        setLikedReportIds(prev => prev.filter(id => id !== reportId));
      } else {
        setLikedReportIds(prev => [...prev, reportId]);
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
    }
  };

  // --- [로직: 신고하기] ---
  const handleReportClick = async (reportId: number) => {
    const reason = window.prompt("신고 사유를 입력해주세요");
    if (!reason?.trim()) return;
    try {
      const success = await reportCitizenReport(reportId, reason);
      if (success) alert("신고가 정상적으로 접수되었습니다.");
    } catch (e) {
      alert("신고 처리 중 오류 발생");
    }
  };

  // --- [로직: 수정 모드 제어] ---
  const handleEditClick = (report: CitizenReport) => {
    setEditingReportId(report.id);
    setEditDescription(report.description);
  };

  const cancelEdit = () => {
    setEditingReportId(null);
    setEditDescription('');
  };

  const handleUpdateReport = async (reportId: number) => {
    if (!editDescription.trim()) return;
    try {
      const success = await updateCitizenReport(reportId, editDescription);
      if (success && selectedItem) {
        const updatedReports = await getCitizenReports(selectedItem.id, itemType!);
        setReports(updatedReports);
        alert("제보가 수정되었습니다.");
        setEditingReportId(null);
      }
    } catch (e) {
      alert("수정 중 오류 발생");
    }
  };
  return(
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-[#F0F2F5] rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden relative border-4 border-[#3954AA] shadow-2xl">

                        {/* 모달 헤더 */}
                        <div className="flex justify-between items-center p-8 bg-white border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-2.5 bg-[#3954AA] text-white font-bold rounded-xl shadow-lg hover:bg-[#2D438A] transition-all text-sm flex items-center gap-2">
                                    <span className="text-lg">＋</span> 제보하기
                                </button>
                                <h2 className="text-2xl font-black text-[#3954AA] italic">REAL-TIME REPORTS</h2>
                            </div>
                            <button onClick={onClose} className="text-4xl text-black hover:text-gray-600 font-light">✕</button>
                        </div>

                        <div className="px-8 py-3 bg-white border-b border-gray-100 flex gap-2 justify-end">
                            <button
                                onClick={() => setSortBy('LATEST')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === 'LATEST'
                                    ? 'bg-[#3954AA] text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                최신순
                            </button>
                            <button
                                onClick={() => setSortBy('POPULAR')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === 'POPULAR'
                                    ? 'bg-[#3954AA] text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                인기순
                            </button>
                        </div>

                        {/* 리포트 리스트 (스크롤 영역) */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* 0511 수정 50점이하 제외된 제보 리스트 visibleReports로 변경 */}
                            {visibleReports.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-bold">등록된 제보가 없거나 신뢰도가 낮은 제보들입니다.</div>
                            ) : (
                                [...visibleReports]
                                .sort((a, b) => {
                                    if (sortBy === 'POPULAR') return (b.likeCount || 0) - (a.likeCount || 0);
                                    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
                                })
                                .map((report) => {
                                    const isMyReport = report.userId === currentUserId;
                                    const isEditing = editingReportId === report.id;
                                    
                                    //0511 수정 신뢰도 70점 이하 주의 상태 확인
                                    const isLowReliability = (report.reliability ?? 100) <= 70;

                                    return (
                                        //0511 수정 
                                        <div key={report.id} className="relative overflow-hidden bg-white rounded-[35px] p-8 border border-gray-100">
                                            {/* 0511 수정 신뢰도 경고 라벨 */}
                                            {isLowReliability && (
                                                <div className="absolute top-6 left-8 z-20 bg-red-600/10 text-red-600 px-4 py-1.5 rounded-full text-[11px] font-black border border-red-200 animate-pulse backdrop-blur-md">
                                                ⚠️ 신뢰도 낮음: 허위 정보 신고가 접수된 제보입니다.
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-8 right-8 flex flex-col items-center w-20 z-40">
                                                <div className="flex flex-col items-center mb-4 cursor-pointer group/like">
                                                    <button
                                                        onClick={() => handleLikeReport(report.id)}
                                                        className="flex flex-col items-center gap-1"
                                                    >
                                                        <span className="text-xl transition-transform active:scale-125">
                                                            {likedReportIds.includes(report.id) ? '❤️' : '🤍'}
                                                        </span>
                                                    </button>
                                                    <span className="text-base font-black text-[#E91E63] -mt-1">
                                                        {report.likeCount || 0}
                                                    </span>
                                                </div>

                                                {/*0511 수정 내 제보가 아니고 신뢰도가 아직 블라인드 전일 때만 신고 가능 */}
                                                {!isMyReport && (
                                                    <button 
                                                        onClick={() => handleReportClick(report.id)} 
                                                        className="flex flex-col items-center group/report"
                                                    >
                                                        <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 shadow-sm group-hover/report:bg-red-50 transition-colors">
                                                        <span className="text-xl">🚨</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-tighter">REPORT</span>
                                                    </button>
                                                    )}
                                            </div>

                                            <div className={`transition-all duration-300 pr-20 ${isLowReliability ? 'grayscale opacity-60' : ''}`}>
                                                 <div className={`mb-4 ${isLowReliability ? 'mt-8' : ''}`}>
                                                    <p className={`font-black text-xl ${isMyReport ? 'text-orange-600' : 'text-[#3954AA]'}`}>
                                                        {report.nickname} {isMyReport && "(내 제보)"}
                                                    </p>
                                                    <p className="text-sm text-gray-400 italic">📍 {report.locationName}</p>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3 mb-4">
                                                        <textarea
                                                            value={editDescription}
                                                            onChange={(e) => setEditDescription(e.target.value)}
                                                            className="w-full p-4 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 resize-none h-32 text-black text-base"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateReport(report.id)}
                                                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md hover:bg-orange-600"
                                                            >
                                                                저장
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300"
                                                            >
                                                                취소
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-700 text-lg leading-relaxed mb-4">{report.description}</p>
                                                )}

                                                {/* 0511 수정 이미지 영역: 신뢰도 낮으면 살짝 블러 처리 */}
                                                <div className={`flex gap-2 overflow-x-auto pb-2 ${isLowReliability ? 'blur-[1px]' : ''}`}>
                                                    {report.imageUrl?.map((url, i) => (
                                                    <img key={i} src={url} className="h-40 w-60 object-cover rounded-2xl border flex-shrink-0" alt="제보사진" />
                                                    ))}
                                                </div>

                                                {isMyReport && !isEditing && (
                                                    <div className="mt-4 flex gap-3 items-center">
                                                        <button
                                                            onClick={() => handleEditClick(report)}
                                                            className="text-xs text-blue-500 font-bold underline hover:text-blue-700 transition-colors"
                                                        >
                                                            수정하기
                                                        </button>
                                                        <span className="text-gray-300 text-[10px]">|</span>
                                                        <button
                                                            onClick={() => handleDeleteReport(report.id)}
                                                            className="text-xs text-red-400 font-bold underline hover:text-red-600 transition-colors"
                                                        >
                                                            삭제하기
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
           </div>
            
  );
};

export default ReportListModal;