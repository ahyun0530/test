//마커별 제보 작성 모달

import React, { useState, useRef } from 'react';
import { createCitizenReport } from '../../services/api';

interface CreateReportModalProps {
  isOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsReportModalOpen: (open: boolean) => void;
  setReports: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserId: number;
  selectedItem: any;
  itemType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT' | null;
}

const CreateReportModal = ({
  isOpen,
  setIsCreateModalOpen,
  setIsReportModalOpen,
  setReports,
  currentUserId,
  selectedItem,
  itemType
}: CreateReportModalProps) => {
  // --- [로직: 내부 상태 관리] ---
  const [newDescription, setNewDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- [핸들러: 사진 선택] ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      alert("사진은 최대 3장까지 업로드 가능합니다.");
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // --- [핸들러: 사진 삭제] ---
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]); // 메모리 해제
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearPreviews = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setSelectedFiles([]);
    setNewDescription('');
  };

  // --- [핸들러: 제보 등록 전송] ---
  const handleCreateReport = async () => {
    if (!newDescription.trim()) { alert('내용을 입력해 주세요.'); return; }
    if (!selectedItem) { alert('대상 마커를 선택해주세요.'); return; }

    setIsSubmitting(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const payload = {
          userId: currentUserId,
          category: selectedItem.category || selectedItem.alertType || "화제제보",
          latitude: selectedItem.latitude,
          longitude: selectedItem.longitude,
          userLatitude: pos.coords.latitude,
          userLongitude: pos.coords.longitude,
          description: newDescription,
          imageUrl: previews, 
          targetId: selectedItem.id,
          targetType: itemType,
        };

        try {
          const savedReport = await createCitizenReport(payload as any);
          setReports(prev => [savedReport, ...prev]);
          clearPreviews();
          setIsCreateModalOpen(false);
          setIsReportModalOpen(true);
          alert(savedReport.gpsVerified ? "위치 인증이 완료되었습니다." : "제보가 등록되었습니다.");
        } catch (e) {
          alert("제보 등록 중 오류 발생");
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        setIsSubmitting(false);
        alert("위치 정보를 허용해야 제보가 가능합니다.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

    return (
         <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-6">
                    <div className="bg-[#E4E9F2] rounded-[30px] w-full max-w-2xl p-10 relative shadow-2xl border-2 border-[#3954AA]">
                        {!isSubmitting && (
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    clearPreviews();
                                }}
                                className="absolute top-6 right-6 text-3xl text-black hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                        <div className="space-y-6">
                            <div>
                                <label className="text-xl font-bold text-[#3954AA] mb-2 block">내용</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full !text-black !opacity-100 text-base rounded-xl h-40 p-6 border border-gray-200 bg-white focus:outline-none focus:border-[#3954AA] resize-none"
                                    placeholder="현장 상황을 공유해 주세요."
                                />
                            </div>
                            <div>
                                <label className="text-xl font-bold text-[#3954AA] mb-2 block">사진첨부 ({previews.length}/3)</label>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                                <div className="grid grid-cols-4 gap-4">
                                    {previews.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white">
                                            <img src={src} alt="preview" className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full text-xs">✕</button>
                                        </div>
                                    ))}
                                    {previews.length < 3 && (
                                        <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-[#3954AA]/30 cursor-pointer">
                                            <span className="text-[#3954AA] text-3xl">＋</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleCreateReport}
                                    disabled={isSubmitting}
                                    className={`px-10 py-3 font-bold rounded-xl shadow-lg transition-all ${isSubmitting
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-[#4C5CA4] text-white hover:bg-[#3954AA]'
                                        }`}
                                >
                                    {isSubmitting ? "게시 중..." : "게시"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
    );
};

export default CreateReportModal;