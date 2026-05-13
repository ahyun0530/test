//사이드바 카테고리 3개 버튼 레이아웃

import React from 'react';

interface CategoryNavProps {
  activeCategory: 'DISASTER' | 'SAFETY' | 'REPORT';
  handleCategoryChange: (category: 'DISASTER' | 'SAFETY' | 'REPORT') => void;
}

const CategoryNav: React.FC<CategoryNavProps> = ({ activeCategory, handleCategoryChange }) => {
  return (
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
  );
};

export default CategoryNav;