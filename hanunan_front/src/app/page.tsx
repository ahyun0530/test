"use client";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { useEffect, useState, useRef } from 'react';
import KakaoMap from "@/components/map/KakaoMap";
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
    getFireMarkers,
    FireMarker,
} from '@/services/api';
import LoginModal from "@/components/auth/LoginModal";

export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false);

    const [position] = useState({ lat: 35.143, lng: 126.924 });
    const [disasters, setDisasters] = useState<DisasterMessage[]>([]);
    const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
    const [fireStations, setFireStations] = useState<FireStation[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [likedReportIds, setLikedReportIds] = useState<number[]>([]);
    const [safetyFacilities, setSafetyFacilities] = useState<SafetyFacility[]>([]);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [fireStats, setFireStats] = useState<FireDailyStat | null>(null);
    const [itemType, setItemType] = useState<'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT' | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 사진 업로드 관련 상태
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 댓글 관련 상태 (초기값 안전하게 설정)
    const [comments, setComments] = useState<ReportComment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const currentUserId = 999;

    // 내가 공감한 제보 ID들
    const [likedReports, setLikedReports] = useState<number[]>([]);

    //제보등록 느림을 위한 코드
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 수정 모드 관련 상태
    const [editingReportId, setEditingReportId] = useState<number | null>(null);
    const [editDescription, setEditDescription] = useState('');

    const [sortBy, setSortBy] = useState<'LATEST' | 'POPULAR'>('LATEST');

    const [isReportWriteModalOpen, setIsReportWriteModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [locationInput, setLocationInput] = useState("");

    //초기값은 'DISASTER'
    const [activeCategory, setActiveCategory] = useState<'DISASTER' | 'SAFETY' | 'REPORT'>('DISASTER');

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [mapCenter, setMapCenter] = useState({ lat: 35.1595, lng: 126.8526 }); //제보 생성 위치

    const [mapReports, setMapReports] = useState<MapReport[]>([]);
    const [selectedReportType, setSelectedReportType] = useState('🔥 화재');
    const [fireMarkers, setFireMarkers] = useState<FireMarker[]>([]);
    const [reportDescription, setReportDescription] = useState('');

    const [disasterInput, setDisasterInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedDisaster, setExtractedDisaster] = useState<DisasterExtractResult | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    // 화재 마커 로드 및 5분 주기 갱신
    useEffect(() => {
        const fetchFireMarkers = async () => {
            try {
                const data = await getFireMarkers();
                setFireMarkers(data);
            } catch (e) {
                console.error('화재 마커 조회 실패:', e);
            }
        };

        fetchFireMarkers();
        const interval = setInterval(fetchFireMarkers, 300000); // 5분
        return () => clearInterval(interval);
    }, []);

    const handleAnalyzeDisaster = async () => {
        if (!disasterInput.trim()) return;
        setIsAnalyzing(true);
        setExtractedDisaster(null);
        try {
            const result = await extractDisasterInfo(disasterInput);
            setExtractedDisaster(result);
        } catch (e) {
            alert('분석 중 오류가 발생했습니다. 백엔드 서버를 확인해주세요.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 카테고리 변경 시 데이터 로드
    useEffect(() => {
        if (activeCategory === 'REPORT') {
            getMapReports().then(setMapReports);
        }
    }, [activeCategory]);

    // 모달에서 '등록하기' 클릭 시 실행될 함수
    const handleReportSubmit = async (reportData: any) => {
        const savedReport = await createMapReport(reportData);
        setMapReports(prev => [savedReport, ...prev]); // 지도 상태 업데이트
        alert("제보 마커가 지도에 생성되었습니다.");
    };

    // 사이트바 버튼 클릭 핸들러
    const handleCategoryChange = (category: 'DISASTER' | 'SAFETY' | 'REPORT') => {
        setActiveCategory(category);
    };

    //제보창이 열릴 때 내 위치를 가져오는 효과
    useEffect(() => {
        if (isReportWriteModalOpen) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setMapCenter({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        });
                    },
                    (error) => {
                        console.error("위치 정보를 가져오는데 실패했습니다.", error);
                        // 실패 시 기존 기본값(광주) 유지
                    }
                );
            }
        }
    }, [isReportWriteModalOpen]);

    //페이지 로드 시 로컬 스토리지에서 로그인 상태 복원
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoggedIn(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                setUserName(parsed.nickname || parsed.email?.split('@')[0] || '사용자');
            } else {
                setUserName('사용자');
            }
        } catch (e) {
            setUserName('사용자');
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;

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
            getSidebarComments()
        ]).then(([d, w, f, r, c]) => {
            setDisasters(d);
            setWeatherAlerts(w);
            setFireStations(f);
            setReports(r);
            setComments(c);
        });
    }, []);

    const handleSelectItem = async (item: any, type: 'DISASTER' | 'WEATHER' | 'FIRE' | 'SAFETY' | 'REPORT') => {
        if (!item) {
            setSelectedItem(null);
            setItemType(null);
            setReports([]);
            setComments([]);
            return;
        }

        setSelectedItem(item);
        setItemType(type);
        setFireStats(null);

        if (type === 'REPORT') {
            setReports([]);
            setComments([]);
            return;
        }

        if (type === 'FIRE') {
            try {
                const stats = await getFireStationStats(item.id);
                setFireStats(stats);
            } catch (e) {
                console.error("통계 로딩 실패", e);
            }
        }

        //기존 카테고리(DISASTER, WEATHER 등)의 제보 및 댓글 로딩
        try {
            const filteredReports = await getCitizenReports(item.id, type);
            // setReports(filteredReports); 
        } catch (e) {
            console.error("제보 목록 로딩 실패", e);
        }

        try {
            const filteredComments = await getSidebarComments(item.id, type);
            setComments(filteredComments);
        } catch (e) {
            console.error("댓글 목록 로딩 실패", e);
            setComments([]);
        }
    };

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

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // 1. 제보 삭제 핸들러 추가
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

    const clearPreviews = () => {
        //previews.forEach(url => URL.revokeObjectURL(url));
        setPreviews([]);
        setSelectedFiles([]);
    };

    const handleCreateReport = async () => {
        if (!newDescription.trim()) {
            alert('내용을 입력해 주세요.');
            return;
        }

        if (!selectedItem) {
            alert('대상 마커를 선택해주세요.');
            return;
        }

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

                // UI 업데이트
                setReports(prev => [savedReport, ...prev]);
                setNewDescription('');
                clearPreviews();
                setIsCreateModalOpen(false);
                setIsReportModalOpen(true);

                alert(savedReport.gpsVerified ? " 위치 인증이 완료되었습니다." : "제보가 등록되었습니다.");
            } catch (e) {
                console.error("제보 등록 에러:", e);
                alert("제보 등록 중 오류가 발생했습니다.");
            } finally {
                setIsSubmitting(false); // 로딩 종료
            }
        },
            (error) => {
                setIsSubmitting(false); // 에러 시 로딩 종료
                alert("위치 정보를 허용해야 제보가 가능합니다.");
            },
            { enableHighAccuracy: true, timeout: 5000 } // 타임아웃 5초 설정
        );
    };

    // 3. 댓글 등록 핸들러 (UI 로직만 유지)
    const handleAddComment = async () => {
        if (!commentInput.trim() || !selectedItem || !itemType) return;

        try {
            const savedComment = await createSidebarComment(
                commentInput,
                currentUserId,
                selectedItem.id,
                itemType!
            );

            setComments(prev => [savedComment, ...prev]);
            setCommentInput('');
        } catch (e) {
            console.error("댓글 등록 실패", e);
            alert("댓글 등록 중 오류가 발생했습니다.");
        }
    };

    // 공감 클릭 핸들러
    const handleLikeReport = async (reportId: number) => {
        const isAlreadyLiked = likedReports.includes(reportId);

        try {
            const updatedReport = await likeCitizenReport(reportId, !isAlreadyLiked);

            setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));

            if (isAlreadyLiked) {
                setLikedReports(prev => prev.filter(id => id !== reportId));
            } else {
                setLikedReports(prev => [...prev, reportId]);
            }
        } catch (error) {
            console.error("좋아요 처리 중 오류 발생:", error);
        }
    };

    // 하이드레이션 방지
    if (!isMounted) return null;

    const handleReportClick = async (reportId: number) => {
        const reason = window.prompt("신고 사유를 입력해주세요 (예: 허위 사실, 부적절한 이미지 등)");

        if (!reason || !reason.trim()) return;

        try {
            const success = await reportCitizenReport(reportId, reason);
            if (success) {
                alert("신고가 정상적으로 접수되었습니다. 검토 후 조치하겠습니다.");
            }
        } catch (e) {
            alert("신고 처리 중 오류가 발생했습니다.");
        }
    };

    // 댓글 삭제 핸들러
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

    // 수정 모드 진입
    const handleEditClick = (report: CitizenReport) => {
        setEditingReportId(report.id);
        setEditDescription(report.description);
    };

    // 수정 취소
    const cancelEdit = () => {
        setEditingReportId(null);
        setEditDescription('');
    };

    const handleOpenReportWriteModal = () => {
        const token = localStorage.getItem('token');
        if (!isLoggedIn || !token) {
            alert('로그인 후 제보마커를 생성할 수 있습니다.');
            setIsLoginModalOpen(true);
            return;
        }

        setIsReportWriteModalOpen(true);
    };

    // 수정 완료 저장
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
            console.error("수정 실패", e);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

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

    return (
        <main className="flex h-[100dvh] w-full bg-[#F0F2F5] p-6 gap-6 overflow-hidden relative">
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                <button
                    onClick={handleOpenReportWriteModal}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                    <span className="text-lg"></span>
                    제보마커생성하기
                </button>
                {isMounted && isLoggedIn ? (
                    <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-2xl shadow-xl border-2 border-[#3954AA]/20 animate-fadeIn">
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-all"
                            onClick={() => setIsProfileModalOpen(true)}
                        >
                            <div className="w-8 h-8 bg-[#3954AA] rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner">
                                {(userName ?? 'U').charAt(0)}
                            </div>
                            <span className="font-black text-gray-800 tracking-tight">
                                <span className="text-[#3954AA]">{userName}</span>님
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                localStorage.removeItem('user');
                                localStorage.removeItem('token');
                                setUserName(null);
                                setIsLoggedIn(false);
                                window.location.reload();
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors ml-2 border-l pl-2 border-gray-200"
                        >
                            LOGOUT
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="px-8 py-2.5 bg-[#3954AA] text-white font-black rounded-xl shadow-lg hover:bg-[#2D438A] hover:scale-105 transition-all"
                    >
                        로그인
                    </button>
                )}
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            {/* --- 왼쪽 사이드바 --- */}
            <aside className="w-80 flex flex-col gap-6 h-full">
                <h1 className="text-4xl font-black text-[#3954AA] italic">한눈에 안전</h1>

                <nav className="flex flex-col gap-3">
                    <button
                        onClick={() => handleCategoryChange('DISASTER')}
                        className={`p-4 rounded-2xl font-bold text-left shadow-md transition-all ${activeCategory === 'DISASTER' ? 'bg-[#4C5CA4] text-white' : 'bg-white text-[#4C5CA4]'}`}
                    >
                        ⚠️ 실시간 재난 정보
                    </button>
                    <button
                        onClick={() => handleCategoryChange('SAFETY')}
                        className={`p-4 rounded-2xl font-bold text-left border border-[#4C5CA4]/20 transition-all ${activeCategory === 'SAFETY' ? 'bg-[#4C5CA4] text-white' : 'bg-white text-[#4C5CA4]'}`}
                    >
                        🏢 주변 안전 시설
                    </button>
                    <button
                        onClick={() => handleCategoryChange('REPORT')}
                        className={`p-4 rounded-2xl font-bold text-left border border-[#4C5CA4]/20 transition-all ${activeCategory === 'REPORT' ? 'bg-[#4C5CA4] text-white' : 'bg-white text-[#4C5CA4]'}`}
                    >
                        📢 시민 제보
                    </button>
                </nav>

                {/* 시민 댓글 피드 */}
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
            </aside>

            <div className="flex-1 flex flex-col gap-6 h-full">
                <section className="flex-1 bg-white rounded-[40px] shadow-xl overflow-hidden relative border-4 border-white">
                    <KakaoMap center={position} activeCategory={activeCategory} disasterData={disasters} weatherAlerts={weatherAlerts} fireStations={fireStations} safetyData={safetyFacilities} mapReports={mapReports} extractedDisaster={extractedDisaster} fireMarkers={fireMarkers} onSelectItem={handleSelectItem} />

                </section>

                <section className="h-[300px] bg-[#4C5CA4] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                    {selectedItem ? (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-3xl font-black">
                                    {itemType === 'FIRE' ? `${selectedItem.frstCetrNm} 통계` :
                                        itemType === 'SAFETY' ? selectedItem.name :
                                            (selectedItem.category || selectedItem.alertType)}
                                </h2>
                                <button onClick={() => setSelectedItem(null)} className="text-2xl">✕</button>
                            </div>

                            <div className="grid grid-cols-3 gap-8 flex-1 overflow-hidden">
                                <div className="bg-black/10 rounded-2xl p-6 border border-white/5 overflow-y-auto">
                                    <p className="text-sm opacity-50 mb-2 uppercase tracking-widest font-bold">
                                        {itemType === 'FIRE' ? 'Station Info' : 'Location Info'}
                                    </p>
                                    {itemType === 'FIRE' ? (
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold italic">관할 코드: {selectedItem.frstCntrid}</p>
                                            <p className="text-lg opacity-80 italic">오늘 날짜: {fireStats?.ocrnYmd}</p>
                                        </div>
                                    ) : itemType === 'REPORT' ? (
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold italic">위치: {selectedItem.locationName}</p>
                                            <p className="text-md opacity-80 italic">제보 시각: {new Date(selectedItem.createdAt).toLocaleString()}</p>
                                            <p className="text-sm opacity-60 italic">작성자: {selectedItem.nickname}</p>
                                            <p className="text-sm opacity-60 italic">제보 내용: {selectedItem.description}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-lg leading-relaxed italic">
                                                {itemType === 'SAFETY' ? `${selectedItem.address}` : `"${selectedItem.originalText}"`}
                                            </p>
                                            {itemType === 'SAFETY' && selectedItem.manager && (
                                                <p className="text-sm leading-relaxed italic"> 관할: {selectedItem.manager}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white/10 rounded-2xl p-6 border border-white/10 overflow-y-auto">
                                    <p className="text-sm text-[#69CCFE] mb-2 uppercase tracking-widest font-bold">✨ AI Analysis</p>

                                    {itemType === 'FIRE' ? (
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
                                    ) : itemType === 'REPORT' ? (
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                            <p className="text-white font-bold text-[17px] leading-8 break-keep relative z-10">
                                                "젖은 수건을 지참하고, 비상계단만 이용하세요. 현재 유독가스가 확산 중입니다."
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {itemType === 'SAFETY' && (
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-bold leading-relaxed">
                                                        최근 점검일: {selectedItem.lastCheck || '확인 필요'}
                                                    </p>
                                                </div>
                                            )}

                                            <p className="text-base font-medium opacity-90 leading-relaxed italic">
                                                {itemType === 'SAFETY' ? selectedItem.aiSummary : `"${selectedItem.aiSummary}"`}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="cursor-pointer group h-full"
                                    onClick={() => setIsReportModalOpen(true)}
                                >
                                    <div className="text-center bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center h-full hover:bg-white/10 transition-all gap-1">
                                        <p className="text-sm font-bold text-white group-hover:scale-105 transition-transform">현장 공유</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <p className="text-xl font-bold italic">지도에서 아이콘이나 관할 구역을 클릭하세요.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* --- 모달 영역 --- */}
            {isReportModalOpen && (
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
                            <button onClick={() => setIsReportModalOpen(false)} className="text-4xl text-black hover:text-gray-600 font-light">✕</button>
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
                            {[...reports]
                                .sort((a, b) => {
                                    if (sortBy === 'POPULAR') {
                                        return (b.likeCount || 0) - (a.likeCount || 0);
                                    }
                                    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
                                })
                                .map((report) => {
                                    const isMyReport = report.userId === currentUserId;
                                    const isEditing = editingReportId === report.id;

                                    return (
                                        <div
                                            key={report.id}
                                            className={`p-8 bg-white rounded-[35px] shadow-sm relative border-2 transition-all min-h-[220px] ${isMyReport ? 'border-orange-400 shadow-md' : 'border-gray-100'}`}
                                        >
                                            <div className="absolute top-6 right-6 flex flex-col items-center w-20">
                                                <div className="flex flex-col items-center mb-4 cursor-pointer group/like">
                                                    <button
                                                        onClick={() => handleLikeReport(report.id)}
                                                        className="flex flex-col items-center gap-1"
                                                    >
                                                        <span className="text-xl transition-transform active:scale-125">
                                                            {likedReports.includes(report.id) ? '❤️' : '🤍'}
                                                        </span>
                                                    </button>
                                                    <span className="text-base font-black text-[#E91E63] -mt-1">
                                                        {report.likeCount || 0}
                                                    </span>
                                                </div>

                                                {!isMyReport && (
                                                    <button onClick={() => handleReportClick(report.id)} className="flex flex-col items-center group/report">
                                                        <div className="w-14 h-14 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 shadow-sm group-hover/report:bg-red-50 transition-colors">
                                                            <span className="text-2xl">🚨</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">REPORT</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="pr-24">
                                                <div className="mb-4">
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

                                                <div className="flex gap-2 overflow-x-auto pb-2">
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
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* 시민 제보 마커  작성 모달 */}
            {isReportWriteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsReportWriteModalOpen(false)}
                    />

                    <div className="relative bg-[#F0F2F5] rounded-[40px] w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden border-4 border-[#3954AA] shadow-2xl animate-slide-up">

                        <div className="flex justify-between items-center p-8 bg-white border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[#3954AA] italic flex items-center gap-3">
                                    <span className="text-orange-500 text-3xl">📣</span> CREATE REPORT
                                </h2>
                            </div>
                            <button onClick={() => setIsReportWriteModalOpen(false)} className="text-4xl text-black hover:text-gray-600 font-light">✕</button>
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
                                className="w-full py-5 bg-[#3954AA] text-white rounded-[25px] text-xl font-black shadow-lg hover:bg-[#2e4388] transition-all transform hover:scale-[1.01] active:scale-[0.98]"
                                onClick={async () => {
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
                                            type: selectedReportType as '🔥 화재' | '🌧️ 기상',
                                            description: reportDescription,
                                            latitude: selectedLocation.lat,
                                            longitude: selectedLocation.lng,
                                            userId: currentUserId,
                                        });
                                        setMapReports(prev => [newReport, ...prev]);

                                        alert('제보가 성공적으로 접수되었습니다.');

                                        setIsReportWriteModalOpen(false);
                                        setReportDescription('');
                                        setSelectedLocation(null);
                                    } catch (error) {
                                        console.error("제보 등록 실패:", error);
                                        alert("제보 등록 중 오류가 발생했습니다.");
                                    }
                                }}
                            >
                                SUBMIT REPORT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
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
            )}

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
