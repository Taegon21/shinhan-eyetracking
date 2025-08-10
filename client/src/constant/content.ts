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
        name: "위험 고지사항",
        bgColor: "bg-red-50/30",
        borderColor: "border-red-400",
        titleColor: "text-red-700",
        required: 10,
        priority: "high",
        content: [
          {
            label: "원금 손실 위험:",
            text: "본 금융상품은 원금이 보장되지 않으며 시장 상황에 따라 투자원금의 일부 또는 전부 손실이 발생할 수 있습니다.",
          },
          {
            label: "시장·금리·환율 위험:",
            text: "금리, 환율, 주가, 신용스프레드, 원자재 가격 및 지정학적 이슈 등 거시 변수 변동에 따라 수익률이 변동될 수 있습니다.",
          },
          {
            label: "유동성 위험:",
            text: "환매(해지) 시점에 시장 유동성이 부족한 경우 환매가 지연되거나 불리한 가격으로 체결될 수 있습니다.",
          },
          {
            label: "파생상품 관련 위험:",
            text: "레버리지·헤지 목적의 파생상품을 활용하는 경우 가격 변동성이 확대되어 손실이 커질 수 있습니다.",
          },
          {
            label: "과거 성과의 한계:",
            text: "과거의 운용 성과는 미래의 수익을 보장하지 않으며, 투자 결정은 투자설명서·약관을 충분히 숙지한 후에 이루어져야 합니다.",
          },
        ],
      },
      {
        id: "fee-info",
        title: "💰 수수료 및 보수 안내",
        name: "수수료 안내",
        bgColor: "bg-yellow-50/30",
        borderColor: "border-yellow-400",
        titleColor: "text-yellow-700",
        required: 8,
        priority: "high",
        content: [
          {
            label: "판매수수료:",
            text: "가입금액의 1.0% (최대 100만원). 상품 및 채널에 따라 면제 또는 차등 적용될 수 있습니다.",
          },
          {
            label: "연간 운용·관리보수:",
            text: "연 1.5% 수준으로 매일 기준가에 반영되어 차감됩니다(집합투자/일임/판매/수탁 보수 포함).",
          },
          {
            label: "성과보수:",
            text: "성과 발생 시 초과수익의 20%를 부과할 수 있으며, 기준·산식은 투자설명서를 따릅니다.",
          },
          {
            label: "기타 비용:",
            text: "거래비용, 환헤지 비용 등 운용 과정에서 발생하는 부대비용이 성과에 영향을 미칠 수 있습니다.",
          },
          {
            label: "과세 안내:",
            text: "이익 및 분배금에 대한 과세는 관련 법령·세제 변경에 따라 달라질 수 있습니다.",
          },
        ],
      },
      {
        id: "withdrawal-right",
        title: "📅 계약 철회권 및 해지 조건",
        name: "계약 철회권",
        bgColor: "bg-blue-30/10",
        borderColor: "border-blue-400",
        titleColor: "text-blue-700",
        required: 6,
        priority: "medium",
        content: [
          {
            label: "철회 기간:",
            text: "계약 체결일로부터 14일 이내(영업일 기준). 일부 상품은 관련 법령·상품 특성상 제외될 수 있습니다.",
          },
          {
            label: "철회 방법:",
            text: "영업점, 고객센터, 인터넷·모바일 채널 등을 통해 본인 확인 후 철회 의사를 표시합니다.",
          },
          {
            label: "해지 수수료:",
            text: "가입 후 1년 이내 해지 시 0.5% 부과 등 상품별 차등 적용될 수 있으며, 상세 기준은 약관을 따릅니다.",
          },
          {
            label: "환매 처리:",
            text: "펀드 등 집합투자상품은 환매 대금 지급까지 T+N일이 소요될 수 있습니다.",
          },
          {
            label: "유의사항:",
            text: "철회 또는 환매 시점의 시장가격에 따라 손실이 발생할 수 있으며, 이미 발생한 비용은 반환되지 않을 수 있습니다.",
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
        bgColor: "bg-green-50/30",
        borderColor: "border-green-400",
        titleColor: "text-green-700",
        required: 5,
        priority: "medium",
        content: [
          {
            label: "상품명:",
            text: "신한 글로벌 멀티에셋 펀드(오픈형, 공모)",
          },
          {
            label: "투자대상:",
            text: "국내외 주식·채권·대체투자 등 다양한 자산군에 분산 투자",
          },
          {
            label: "위험등급:",
            text: "중위험·중수익 추구(상품설명서의 위험등급 기준 적용)",
          },
          {
            label: "환헤지 정책:",
            text: "주요 통화에 대해 부분 환헤지 전략을 병행하여 환변동 리스크를 관리",
          },
          {
            label: "분배 정책:",
            text: "분배금은 내부 기준에 따라 지급할 수 있으며, 지급 여부·시기는 운용 결과에 따라 변동",
          },
        ],
      },
      {
        id: "investment-strategy",
        title: "🎯 투자 전략",
        name: "투자 전략",
        bgColor: "bg-purple-50/30",
        borderColor: "border-purple-400",
        titleColor: "text-purple-700",
        required: 10,
        priority: "high",
        content: [
          {
            label: "자산배분:",
            text: "전략적(SAA)·전술적(TAA) 자산배분을 병행하여 시장 국면별로 비중을 조정",
          },
          {
            label: "리스크 관리:",
            text: "VaR·드로다운 한도 등 사전 정의된 리스크 가이드라인을 준수하며 변동성 목표 구간을 유지",
          },
          {
            label: "리밸런싱:",
            text: "정기·수시 리밸런싱을 통해 편중 위험을 완화하고 목표 위험 수준을 관리",
          },
          {
            label: "성과 목표:",
            text: "중장기적으로 연 5~8% 수준의 안정적 초과수익을 추구하되, 시장 상황에 따라 변동될 수 있음",
          },
        ],
      },
      {
        id: "subscription-info",
        title: "💳 가입 정보",
        name: "가입 정보",
        bgColor: "bg-indigo-50/30",
        borderColor: "border-indigo-400",
        titleColor: "text-indigo-700",
        required: 7,
        priority: "medium",
        content: [
          {
            label: "최소 가입금액:",
            text: "100만원 이상(채널·이벤트에 따라 상이할 수 있음)",
          },
          {
            label: "매수/환매 컷오프:",
            text: "영업일 오후 3시 이전 신청 건은 당일 기준가 적용(지연 시 익영업일 처리)",
          },
          {
            label: "기준가 산정:",
            text: "매 영업일 오후 6시 기준으로 산정되며 공시 지연 시 변동 가능",
          },
          {
            label: "환매 대금 지급:",
            text: "환매 신청 후 통상 T+N영업일 이내 지급(상품·시장 상황에 따라 상이)",
          },
          {
            label: "환매수수료:",
            text: "단기 환매 시 환매수수료가 부과될 수 있으며, 부과 기간·율은 상품설명서 참조",
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
        bgColor: "bg-orange-50/30",
        borderColor: "border-orange-400",
        titleColor: "text-orange-700",
        required: 15,
        priority: "high",
        content: [
          {
            label: "글로벌 멀티에셋 펀드:",
            text: "수수료 1.5% 내외, 기대수익률 6~8%, 위험도 중간, 환매 T+N, 권장기간 3년 이상",
          },
          {
            label: "국내 주식형 펀드:",
            text: "수수료 1.2% 내외, 기대수익률 8~12%, 위험도 높음, 변동성 큼, 권장기간 5년 이상",
          },
          {
            label: "안정형 채권 펀드:",
            text: "수수료 0.8% 내외, 기대수익률 3~5%, 위험도 낮음, 금리·크레딧 리스크 존재, 권장기간 1년 이상",
          },
        ],
      },
      {
        id: "risk-return-analysis",
        title: "📈 위험-수익 분석",
        name: "위험-수익 분석",
        bgColor: "bg-pink-50/30",
        borderColor: "border-pink-400",
        titleColor: "text-pink-700",
        required: 12,
        priority: "high",
        content: [
          {
            label: "최대 손실 가능성:",
            text: "글로벌 멀티에셋 -15%, 주식형 -25%, 채권형 -5% 수준의 피크-투-트로프 드로다운을 가정(시장 국면별 상이)",
          },
          {
            label: "변동성 수준:",
            text: "멀티에셋 중간, 주식형 높음, 채권형 낮음. 상관관계 변화에 따라 변동성은 달라질 수 있음.",
          },
          {
            label: "분산 효과:",
            text: "자산군 간 상관관계가 낮을수록 포트폴리오 차원의 위험 조절에 유리하며, 장기 수익률 안정화에 기여",
          },
        ],
      },
      {
        id: "recommendation",
        title: "💡 투자 성향별 추천",
        name: "투자 성향별 추천",
        bgColor: "bg-cyan-50/30",
        borderColor: "border-cyan-400",
        titleColor: "text-cyan-700",
        required: 10,
        priority: "medium",
        content: [
          {
            label: "안정 추구형:",
            text: "안정형 채권 70% + 글로벌 멀티에셋 30%. 목표: 변동성 완화 및 완만한 수익 추구.",
          },
          {
            label: "균형 추구형:",
            text: "글로벌 멀티에셋 60% + 국내 주식형 40%. 목표: 성장성과 안정성의 균형.",
          },
          {
            label: "성장 추구형:",
            text: "국내 주식형 70% + 글로벌 멀티에셋 30%. 목표: 장기 초과수익 추구(고변동성 감내).",
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
