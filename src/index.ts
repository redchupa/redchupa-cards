import { registerCard, logBanner } from './utils/register';

// v1 cards — M1 in progress; remaining cards land in subsequent commits.
import './cards/kepco-progress-card';
import './cards/transit-card';
import './cards/pharmacy-emergency-card';
import './cards/ai-alert-timeline-card';

const VERSION = '0.1.0';

registerCard({
  type: 'kepco-progress-card',
  name: 'KEPCO Progress Card',
  description:
    '한국전력 누진단계 진행률 카드 (kr_component_kit KEPCO 엔티티 소비)',
  preview: true,
});

registerCard({
  type: 'transit-card',
  name: 'Transit Card',
  description:
    '대중교통 도착 정보 카드 (kr_component_kit Transit 엔티티 소비, 다중 정류장)',
  preview: true,
});

registerCard({
  type: 'pharmacy-emergency-card',
  name: 'Pharmacy & Emergency Card',
  description:
    '약국 영업정보 + 재난문자/안전알림 통합 패널 (kr_component_kit 소비)',
  preview: true,
});

registerCard({
  type: 'ai-alert-timeline-card',
  name: 'AI Alert Timeline Card',
  description:
    'AI 자동화가 채우는 input_text/sensor 엔티티들을 시간순 타임라인으로 표시',
  preview: true,
});

logBanner(VERSION);
