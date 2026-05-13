//시민 댓글 피드 

import React, { useState, useEffect } from 'react';
import { 
  ReportComment, 
  createSidebarComment, 
  deleteSidebarComment 
} from '../../services/api';

interface CitizenFeedProps {
  comments: ReportComment[];
  setComments: React.Dispatch<React.SetStateAction<ReportComment[]>>; // 상태 변경 함수 추가
  currentUserId: number;
  selectedItem: any;
  itemType: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT' | null; // 타입 추가
}
export default function CitizenFeed({
  comments,
  setComments,
  currentUserId,
  selectedItem,
  itemType,
}: CitizenFeedProps) {
  const [commentInput, setCommentInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- [로직 이동] 댓글 등록 핸들러 ---
  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedItem || !itemType) return;

    try {
      const savedComment = await createSidebarComment(
        commentInput,
        currentUserId,
        selectedItem.id,
        itemType
      );
      // 부모 상태 업데이트
      setComments(prev => [savedComment, ...prev]);
      setCommentInput(''); // 입력창 초기화
    } catch (e) {
      console.error("댓글 등록 실패", e);
      alert("댓글 등록 중 오류가 발생했습니다.");
    }
  };

  // --- [로직 이동] 댓글 삭제 핸들러 ---
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const success = await deleteSidebarComment(commentId);
      if (success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        alert("댓글이 삭제되었습니다.");
      }
    } catch (e) {
      console.error("댓글 삭제 실패", e);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };
  return (
                <section className="flex-1 flex flex-col bg-white rounded-[30px] shadow-lg border border-[#3954AA]/10 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#3954AA]/5">
                        <span className="font-black text-[#3954AA] text-xs italic tracking-tighter">CITIZEN FEED</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                        {comments.map((comment) => {
                            const isMyComment = comment.userId === currentUserId;
                            return (
                                <div key={comment.id} className={`p-4 rounded-2xl text-[13px] shadow-sm relative group/item transition-all ${isMyComment ? 'bg-orange-50 border-2 border-orange-400' : 'bg-white border border-gray-100'}`}>

                                    {isMyComment && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                                            title="삭제"
                                        >
                                            <span className="text-[10px]">✕</span>
                                        </button>
                                    )}

                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black ${isMyComment ? 'text-orange-600' : 'text-[#3954AA]'}`}>
                                            {comment.nickname} {isMyComment && "(나)"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mr-4">
                                            {isMounted && comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 leading-snug pr-4">{comment.content}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder={selectedItem ? "현장 상황을 공유하세요..." : "마커를 선택 후 댓글을 남겨주세요."}
                                disabled={!selectedItem}
                                className="w-full text-black p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#3954AA] resize-none h-16 disabled:opacity-50"
                            />
                            <button onClick={handleAddComment} disabled={!selectedItem} className="w-full py-2 bg-[#3954AA] text-white text-xs font-bold rounded-lg hover:bg-[#2D438A] transition-all disabled:bg-gray-300 shadow-md">댓글 등록</button>
                        </div>
                    </div>
                </section>
  );
};
