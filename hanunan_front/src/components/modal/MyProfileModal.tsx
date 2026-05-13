//나의 활동 내역 조회 모달

import React, { useState } from 'react';
import { MapReport, 
    CitizenReport, 
    ReportComment, 
    deleteCitizenReport,
    deleteSidebarComment,
    updateCitizenReport
} from '@/services/api';

interface MyProfileModalProps {
        userId: number;
        onClose: () => void;
        mapReports: MapReport[];
        citizenReports: CitizenReport[];
        sidebarComments: ReportComment[];
        setReports: React.Dispatch<React.SetStateAction<CitizenReport[]>>;
        setMapReports: React.Dispatch<React.SetStateAction<MapReport[]>>;
        setSidebarComments: React.Dispatch<React.SetStateAction<ReportComment[]>>;
    }

    const MyProfileModal = ({
        userId,
        onClose,
        mapReports,
        citizenReports,
        sidebarComments,
        setReports,
        setMapReports,
        setSidebarComments
    }: MyProfileModalProps) => {
        const [activeTab, setActiveTab] = useState<'MAP' | 'FIELD' | 'COMMENT'>('MAP');
        const [editingId, setEditingId] = useState<number | null>(null);
        const [editValue, setEditValue] = useState("");

        const myMapReports = (mapReports || []).filter(r => r.userId === userId);
        const myFieldReports = (citizenReports || []).filter(r => r.userId === userId);
        const myComments = (sidebarComments || []).filter(c => c.userId === userId);

        const onDeleteClick = async (id: number) => {
            if (!window.confirm("정말로 삭제하시겠습니까?")) return;
            try {
                if (activeTab === 'FIELD') {
                    await deleteCitizenReport(id);
                    setReports(prev => prev.filter(r => r.id !== id));
                } else if (activeTab === 'COMMENT') {
                    await deleteSidebarComment(id);
                    setSidebarComments(prev => prev.filter(c => c.id !== id));
                } else {
                    await deleteCitizenReport(id);
                    setMapReports(prev => prev.filter(r => r.id !== id));
                }
                alert("삭제되었습니다.");
            } catch (error) {
                alert("삭제에 실패했습니다.");
            }
        };

        const onSaveEdit = async (id: number) => {
            if (!editValue.trim()) return;
            try {
                if (activeTab === 'FIELD') {
                    await updateCitizenReport(id, editValue);
                    setReports(prev => prev.map(r => r.id === id ? { ...r, description: editValue } : r));
                } else if (activeTab === 'COMMENT') {
                    setSidebarComments(prev => prev.map(c => c.id === id ? { ...c, content: editValue } : c));
                } else {
                    await updateCitizenReport(id, editValue);
                    setMapReports(prev => prev.map(r => r.id === id ? { ...r, description: editValue } : r));
                }
                setEditingId(null);
                alert("수정되었습니다.");
            } catch (error) {
                alert("수정에 실패했습니다.");
            }
        };

        return (
            <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-2xl rounded-[30px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-black">
                    <div className="p-6 border-b flex justify-between items-center bg-white">
                        <h2 className="text-xl font-black text-[#4C5CA4]">내 활동 내역</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">✕</button>
                    </div>

                    <div className="flex bg-gray-50 border-b">
                        {['MAP', 'FIELD', 'COMMENT'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setEditingId(null); }}
                                className={`flex-1 py-4 font-bold text-xs ${activeTab === tab ? 'text-[#4C5CA4] border-b-2 border-[#4C5CA4] bg-white' : 'text-gray-400'}`}
                            >
                                {tab === 'MAP' ? `📍 시민 제보 (${myMapReports.length})` :
                                    tab === 'FIELD' ? `💬 현장 공유 (${myFieldReports.length})` :
                                        `✍️ 내 댓글 (${myComments.length})`}
                            </button>
                        ))}
                    </div>

                    <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-white">
                        {(activeTab === 'MAP' ? myMapReports : activeTab === 'FIELD' ? myFieldReports : myComments).length > 0 ? (
                            (activeTab === 'MAP' ? myMapReports : activeTab === 'FIELD' ? myFieldReports : myComments).map((item: any) => {
                                const isEditing = editingId === item.id;
                                return (
                                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${isEditing ? 'border-[#4C5CA4] bg-blue-50/20' : 'border-gray-100 bg-gray-50/30'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-bold px-2 py-1 bg-white border rounded-lg text-gray-500">
                                                {activeTab === 'COMMENT' ? 'COMMENT' : (item.type || item.category)}
                                            </span>
                                            <div className="flex gap-3">
                                                {isEditing ? (
                                                    <><button onClick={() => onSaveEdit(item.id)} className="text-[11px] font-bold text-blue-600">저장</button>
                                                        <button onClick={() => setEditingId(null)} className="text-[11px] font-bold text-gray-400">취소</button></>
                                                ) : (
                                                    <><button onClick={() => { setEditingId(item.id); setEditValue(activeTab === 'COMMENT' ? item.content : item.description); }} className="text-[11px] font-bold text-gray-400 hover:text-blue-600">수정</button>
                                                        <button onClick={() => onDeleteClick(item.id)} className="text-[11px] font-bold text-gray-400 hover:text-red-500">삭제</button></>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full p-3 text-sm border-2 border-blue-100 rounded-xl focus:outline-none focus:border-[#4C5CA4] resize-none h-24 mb-2 text-black font-medium"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700 font-bold mb-3">{activeTab === 'COMMENT' ? item.content : item.description}</p>
                                        )}

                                        {activeTab === 'FIELD' && item.imageUrl && item.imageUrl.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {item.imageUrl.map((url: string, i: number) => (
                                                    <img key={i} src={url} className="h-20 w-32 object-cover rounded-xl border flex-shrink-0 shadow-sm" alt="제보사진" />
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 flex justify-between items-center">
                                            <p className="text-[10px] text-gray-400">📍 {item.locationName || "위치 정보 없음"}</p>
                                            {activeTab === 'COMMENT' && item.createdAt && (
                                                <p className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 font-bold space-y-2">
                                <p className="text-xl">작성된 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    export default MyProfileModal;