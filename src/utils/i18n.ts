type Lang = 'ko' | 'en';
type Dict = Record<string, Record<Lang, string>>;

const STRINGS: Dict = {
  'kepco.title': { ko: '한국전력 누진단계', en: 'KEPCO Progressive Tier' },
  'kepco.tier': { ko: '현재 단계', en: 'Current tier' },
  'kepco.usage': { ko: '사용량', en: 'Usage' },
  'common.no_entity': {
    ko: '엔티티가 설정되지 않았습니다',
    en: 'No entity configured',
  },
  'common.entity_unavailable': {
    ko: '엔티티를 사용할 수 없습니다',
    en: 'Entity unavailable',
  },
  'transit.title': { ko: '대중교통 도착', en: 'Transit Arrivals' },
  'transit.arriving': { ko: '곧 도착', en: 'Arriving' },
  'transit.minutes': { ko: '분', en: 'min' },
  'transit.next': { ko: '다음', en: 'next' },
  'transit.no_arrival': {
    ko: '도착 정보 없음',
    en: 'No arrival info',
  },
  'pharmacy.title': { ko: '약국 · 재난문자', en: 'Pharmacy & Alerts' },
  'pharmacy.section.pharmacy': { ko: '영업 중 약국', en: 'Open Pharmacies' },
  'pharmacy.section.alerts': { ko: '최근 알림', en: 'Recent Alerts' },
  'pharmacy.open_now': { ko: '영업 중', en: 'Open now' },
  'pharmacy.closed': { ko: '영업 종료', en: 'Closed' },
  'pharmacy.no_data': { ko: '약국 정보가 없습니다', en: 'No pharmacy data' },
  'pharmacy.no_alerts': { ko: '최근 알림 없음', en: 'No recent alerts' },
  'pharmacy.distance_km': { ko: 'km', en: 'km' },
  'timeline.title': { ko: 'AI 알림 타임라인', en: 'AI Alert Timeline' },
  'timeline.empty': {
    ko: '아직 분석 결과가 없습니다',
    en: 'No analysis yet',
  },
  'timeline.today': { ko: '오늘', en: 'Today' },
  'timeline.yesterday': { ko: '어제', en: 'Yesterday' },
  'timeline.confidence': { ko: '신뢰도', en: 'Confidence' },
  'family.title': { ko: '가족 위치', en: 'Family Location' },
  'family.state.home': { ko: '집', en: 'Home' },
  'family.state.not_home': { ko: '외출 중', en: 'Away' },
  'family.state.unknown': { ko: '알 수 없음', en: 'Unknown' },
  'family.last_seen': { ko: '마지막 확인', en: 'Last seen' },
  'family.no_entities': {
    ko: '엔티티가 설정되지 않았습니다',
    en: 'No entities configured',
  },
  // GUI editor labels
  'editor.entity': { ko: '엔티티', en: 'Entity' },
  'editor.entities': { ko: '엔티티 목록', en: 'Entities' },
  'editor.name': { ko: '카드 제목', en: 'Card title' },
  'editor.title': { ko: '제목', en: 'Title' },
  'editor.pharmacy_entity': { ko: '약국 엔티티', en: 'Pharmacy entity' },
  'editor.alert_entities': {
    ko: '알림 이벤트 엔티티 목록',
    en: 'Alert event entities',
  },
  'editor.show_estimate': { ko: '예상 요금 표시', en: 'Show estimate' },
  'editor.show_thumbnails': { ko: '썸네일 표시', en: 'Show thumbnails' },
  'editor.show_confidence': { ko: '신뢰도 표시', en: 'Show confidence' },
  'editor.show_battery': { ko: '배터리 표시', en: 'Show battery' },
  'editor.show_last_changed': {
    ko: '마지막 변경 시각 표시',
    en: 'Show last-changed time',
  },
  'editor.max_rows': { ko: '최대 표시 수', en: 'Max rows' },
  'editor.max_pharmacies': { ko: '약국 최대 표시 수', en: 'Max pharmacies' },
  'editor.max_alerts': { ko: '알림 최대 표시 수', en: 'Max alerts' },
  'editor.history_hours': {
    ko: '히스토리 조회 시간 (시간, 0=비활성)',
    en: 'History window (hours, 0=disable)',
  },
};

export function pickLang(hassLang: string | undefined): Lang {
  return hassLang?.startsWith('ko') ? 'ko' : 'en';
}

export function t(key: string, lang: Lang): string {
  return STRINGS[key]?.[lang] ?? key;
}
