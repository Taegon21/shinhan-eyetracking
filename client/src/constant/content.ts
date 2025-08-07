export interface ContentItem {
  label: string;
  text: string;
}

export interface SectionInfo {
  id: string;
  title: string;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  content: ContentItem[];
  // 시선 추적을 위한 추가 정보
  name: string; // 관리자 화면에서 표시될 이름
  required: number; // 필요한 시청 시간 (초)
  priority: "high" | "medium" | "low";
}

export interface PageContent {
  header: {
    title: string;
    subtitle: string;
  };
  sections: SectionInfo[];
}

export const PAGE_CONTENTS: Record<string, PageContent> = {
  productJoin: {
    header: {
      title: "🏦 신한은행",
      subtitle: "금융상품 가입",
    },
    sections: [
      {
        id: "risk-warning",
        title: "⚠️ 투자 위험 고지사항",
        name: "위험 고지사항", // 관리자 화면용 짧은 이름
        bgColor: "bg-red-50",
        borderColor: "border-red-400",
        titleColor: "text-red-700",
        required: 10, // 10초 이상 시청 필요
        priority: "high",
        content: [
          {
            label: "원금 손실 위험:",
            text: "본 금융상품은 원금 손실의 위험이 있습니다. 투자원금의 전부 또는 일부를 잃을 수 있습니다.",
          },
          {
            label: "시장 위험:",
            text: "주식, 채권, 파생상품 등의 가격 변동으로 인해 손실이 발생할 수 있습니다.",
          },
        ],
      },
      {
        id: "fee-info",
        title: "💰 수수료 및 보수 안내",
        name: "수수료 안내",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-400",
        titleColor: "text-yellow-700",
        required: 8,
        priority: "high",
        content: [
          {
            label: "판매수수료:",
            text: "가입금액의 1.0% (최대 100만원)",
          },
          {
            label: "연간 관리보수:",
            text: "연 1.5% (매일 차감)",
          },
          {
            label: "성과보수:",
            text: "수익 발생 시 초과수익의 20%",
          },
        ],
      },
      {
        id: "withdrawal-right",
        title: "📅 계약 철회권 및 해지 조건",
        name: "계약 철회권",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-400",
        titleColor: "text-blue-700",
        required: 6,
        priority: "medium",
        content: [
          {
            label: "철회 기간:",
            text: "계약체결일로부터 14일 이내 (영업일 기준)",
          },
          {
            label: "철회 방법:",
            text: "서면, 전화, 인터넷 등을 통해 철회 의사 표시",
          },
          {
            label: "해지 수수료:",
            text: "가입 후 1년 이내 해지 시 0.5% 부과",
          },
        ],
      },
    ],
  },
  productDetail: {
    header: {
      title: "🏦 신한은행",
      subtitle: "금융상품 상세안내",
    },
    sections: [
      {
        id: "product-overview",
        title: "📋 상품 개요",
        name: "상품 개요",
        bgColor: "bg-green-50",
        borderColor: "border-green-400",
        titleColor: "text-green-700",
        required: 5,
        priority: "medium",
        content: [
          {
            label: "상품명:",
            text: "신한 글로벌 멀티에셋 펀드",
          },
          {
            label: "투자대상:",
            text: "국내외 주식, 채권, 대체투자 등 멀티에셋",
          },
          {
            label: "투자 지역:",
            text: "한국, 미국, 유럽, 신흥국 등 글로벌",
          },
        ],
      },
      {
        id: "investment-strategy",
        title: "🎯 투자 전략",
        name: "투자 전략",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-400",
        titleColor: "text-purple-700",
        required: 10,
        priority: "high",
        content: [
          {
            label: "자산배분 전략:",
            text: "시장 상황에 따른 동적 자산배분",
          },
          {
            label: "리스크 관리:",
            text: "VaR 모델 기반 리스크 한도 관리",
          },
          {
            label: "성과 목표:",
            text: "연 5-8% 안정적 수익 추구",
          },
        ],
      },
      {
        id: "subscription-info",
        title: "💳 가입 정보",
        name: "가입 정보",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-400",
        titleColor: "text-indigo-700",
        required: 7,
        priority: "medium",
        content: [
          {
            label: "최소 가입금액:",
            text: "100만원 이상",
          },
          {
            label: "환매 주기:",
            text: "매일 (오후 3시 이전 신청 시)",
          },
          {
            label: "기준가 산정:",
            text: "매일 오후 6시 기준",
          },
        ],
      },
    ],
  },
  productComparison: {
    header: {
      title: "🏦 신한은행",
      subtitle: "상품 비교 분석",
    },
    sections: [
      {
        id: "product-comparison-table",
        title: "📊 상품 비교표",
        name: "상품 비교표",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-400",
        titleColor: "text-orange-700",
        required: 15,
        priority: "high",
        content: [
          {
            label: "글로벌 멀티에셋 펀드:",
            text: "수수료 1.5%, 기대수익률 6-8%, 위험도 중간",
          },
          {
            label: "국내 주식형 펀드:",
            text: "수수료 1.2%, 기대수익률 8-12%, 위험도 높음",
          },
          {
            label: "안정형 채권 펀드:",
            text: "수수료 0.8%, 기대수익률 3-5%, 위험도 낮음",
          },
        ],
      },
      {
        id: "risk-return-analysis",
        title: "📈 위험-수익 분석",
        name: "위험-수익 분석",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-400",
        titleColor: "text-pink-700",
        required: 12,
        priority: "high",
        content: [
          {
            label: "최대 손실 가능성:",
            text: "글로벌 멀티에셋 -15%, 주식형 -25%, 채권형 -5%",
          },
          {
            label: "변동성 수준:",
            text: "글로벌 멀티에셋 중간, 주식형 높음, 채권형 낮음",
          },
          {
            label: "투자 권장 기간:",
            text: "글로벌 멀티에셋 3년 이상, 주식형 5년 이상, 채권형 1년 이상",
          },
        ],
      },
      {
        id: "recommendation",
        title: "💡 투자 성향별 추천",
        name: "투자 성향별 추천",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-400",
        titleColor: "text-cyan-700",
        required: 10,
        priority: "medium",
        content: [
          {
            label: "안정 추구형:",
            text: "안정형 채권 펀드 70% + 글로벌 멀티에셋 30%",
          },
          {
            label: "균형 추구형:",
            text: "글로벌 멀티에셋 60% + 국내 주식형 40%",
          },
          {
            label: "성장 추구형:",
            text: "국내 주식형 70% + 글로벌 멀티에셋 30%",
          },
        ],
      },
    ],
  },
} as const;

// 페이지 이름 매핑
export const PAGE_NAMES: Record<string, string> = {
  productJoin: "상품 가입",
  productDetail: "상품 상세",
  productComparison: "상품 비교",
};

// 페이지별 섹션 정보 추출 (EmployeeView에서 사용)
export const PAGE_SECTIONS: Record<string, SectionInfo[]> = Object.keys(
  PAGE_CONTENTS
).reduce(
  (acc, pageKey) => {
    acc[pageKey] = PAGE_CONTENTS[pageKey].sections;
    return acc;
  },
  {} as Record<string, SectionInfo[]>
);

export type PageType = keyof typeof PAGE_CONTENTS;

// 섹션 상태 인터페이스 (EmployeeView에서 확장해서 사용)
export interface SectionStatusBase {
  id: string;
  name: string;
  required: number;
  priority: "high" | "medium" | "low";
  color: string; // borderColor를 color로 단순화
}
