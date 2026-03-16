/**
 * ohmymoney AI 추천 카테고리 팩 (Professional Full Set)
 * 대분류(Group) > 소분류(Sub) 계층 구조
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface SubCategory {
  id: string;      // 전역 식별자 (필터링 및 매칭용)
  label: string;   // 노출 이름
  icon?: string;   // 상세 아이콘 (옵션)
}

export interface CategoryGroup {
  id: string;
  label: string;
  icon: string;    // 대표 아이콘 (대분류)
  subCategories: SubCategory[];
}

export const CATEGORY_CATALOG: Record<TransactionType, CategoryGroup[]> = {
  expense: [
    {
      id: 'food',
      label: '식비',
      icon: 'fast-food',
      subCategories: [
        { id: 'food_meal', label: '식사' },
        { id: 'food_cafe', label: '카페/음료' },
        { id: 'food_delivery', label: '배달/유흥' },
        { id: 'food_mart', label: '마트/장보기' },
      ]
    },
    {
      id: 'living',
      label: '생활/쇼핑',
      icon: 'cart',
      subCategories: [
        { id: 'lv_shop', label: '쇼핑' },
        { id: 'lv_conv', label: '편의점' },
        { id: 'lv_life', label: '생활용품' },
        { id: 'lv_beauty', label: '뷰티/패션' },
      ]
    },
    {
      id: 'trans',
      label: '교통/차량',
      icon: 'bus',
      subCategories: [
        { id: 'tr_public', label: '대중교통' },
        { id: 'tr_taxi', label: '택시' },
        { id: 'tr_car', label: '주유/자동차' },
      ]
    },
    {
      id: 'home',
      label: '주거/통신',
      icon: 'home',
      subCategories: [
        { id: 'hm_bill', label: '관리비/월세' },
        { id: 'hm_tel', label: '통신비' },
        { id: 'hm_utility', label: '공과금' },
      ]
    },
    {
      id: 'health',
      label: '의료/건강',
      icon: 'medical',
      subCategories: [
        { id: 'ht_hosp', label: '병원/약국' },
        { id: 'ht_fit', label: '운동/헬스' },
      ]
    },
    {
      id: 'edu',
      label: '교육/취미',
      icon: 'book',
      subCategories: [
        { id: 'ed_book', label: '도서/교육' },
        { id: 'ed_hobb', label: '취미/레저' },
        { id: 'ed_ott', label: '정기구독/OTT' },
      ]
    },
    {
      id: 'event',
      label: '경조사',
      icon: 'gift',
      subCategories: [
        { id: 'ev_gift', label: '선물/경조사' },
        { id: 'ev_donate', label: '기부' },
      ]
    }
  ],
  
  income: [
    {
      id: 'inc_main',
      label: '정규수입',
      icon: 'cash',
      subCategories: [
        { id: 'inc_sal', label: '급여' },
        { id: 'inc_bonus', label: '상여/성과급' },
      ]
    },
    {
      id: 'inc_sub',
      label: '부수입',
      icon: 'trending-up',
      subCategories: [
        { id: 'inc_side', label: '부업/알바' },
        { id: 'inc_sell', label: '중고거래' },
        { id: 'inc_tax', label: '환급금' },
      ]
    },
    {
      id: 'inc_fin',
      label: '금융수입',
      icon: 'analytics',
      subCategories: [
        { id: 'inc_div', label: '배당/이자' },
      ]
    }
  ],
  
  transfer: [
    {
      id: 'move',
      label: '자산이동',
      icon: 'swap-horizontal',
      subCategories: [
        { id: 'mv_acc', label: '계좌이체' },
        { id: 'mv_card', label: '카드대금납부' },
      ]
    },
    {
      id: 'invest',
      label: '저축/대출',
      icon: 'wallet',
      subCategories: [
        { id: 'iv_save', label: '저축/적금' },
        { id: 'iv_loan', label: '대출상환' },
      ]
    }
  ]
};
