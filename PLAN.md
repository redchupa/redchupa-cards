# redchupa-cards — HACS Lovelace 카드 컬렉션

## 1. 목적

> Home Assistant 사용자가 한국형/육아/차량/AI 알림 등 본인 환경에 맞는 카드를 **HACS 한 번 설치로** 다 받을 수 있게 한다.

**왜?**
- 현재 본인 공개 HACS 자산은 통합(`kr_component_kit`) + 애드온(`ha-app-dhlottery`) 2개. **프론트엔드 카드 0**.
- 카드는 시각적 임팩트가 커서 ★/공유율이 통합보다 높음.
- `homeassistant_mcp/dashboards/`, `sweethome/`에 25버전 프로토타입 이미 존재 — 정리만 하면 출시 가능.
- `kr_component_kit` 사용자에게 **소비자 카드**를 같이 제공하면 종합 솔루션이 됨.

## 2. 타겟 사용자

- 한국 거주 HA 사용자
- 1) `kr_component_kit` 설치자 (KEPCO/대중교통/약국 등 시각화 필요)
- 2) `floor3d-toolkit` 사용자 (3D 평면도 카드)
- 3) 베이비캠/현관 AI 알림 사용자 (히스토리 카드 필요)

## 3. 범위

**IN (v1)**
- ✅ KEPCO 누진단계 카드 — 진행률 + 누진 경계 시각화
- ✅ 대중교통 카드 — 정류장 도착 정보 (kr_component_kit 소비자)
- ✅ 약국·재난문자 알림 패널
- ✅ AI 알림 히스토리 카드 — 베이비캠/현관 AI 분석 결과 타임라인
- ✅ 가족 위치 카드 (트래커 + 차량 통합 뷰)
- ✅ floor3d wrapper 카드 (floor3d-toolkit과 연동)

**OUT (v1)**
- ❌ 새 데이터 소스 (모두 기존 HACS 통합 소비자)
- ❌ 비-한국 특화 카드
- ❌ 일반 차트 카드 (apexcharts-card 등 대체재 존재)

## 4. 아키텍처

```
Lit-based Web Components (TypeScript)
├── 빌드: rollup + tsc
├── 출력: dist/redchupa-cards.js (단일 번들)
└── HACS 등록: Plugin (Lovelace card)

각 카드 = <ha-card> 기반 커스텀 엘리먼트
공통 모듈:
- @utils/i18n.ts        한·영
- @utils/ha-helpers.ts  엔티티 조회·아이콘 매핑
- @utils/cache.ts       히스토리 쿼리 캐시
```

데이터 의존:
- `kr_component_kit` 엔티티 (sensor.kepco_*, sensor.pharmacy_*, ...)
- 표준 HA `person.*`, `device_tracker.*`
- `homeassistant_mcp` AI Task 자동화의 입력값(input_text·input_datetime)

## 5. 파일 구조 (v1 골격)

```
redchupa-cards/
├── README.md                  # 한국어 본문 + 영어 details 요약
├── LICENSE                    # MIT
├── hacs.json                  # HACS 플러그인 메타
├── package.json
├── tsconfig.json
├── rollup.config.js
├── .gitignore                 # node_modules, dist/, .env*
├── .env.example               # 개발 시 dev HA URL (커밋 X)
├── PLAN.md                    # 본 문서
├── CLAUDE.md                  # 세션 부트스트랩
├── src/
│   ├── index.ts              # 카드 등록 진입점
│   ├── cards/
│   │   ├── kepco-progress-card.ts
│   │   ├── transit-card.ts
│   │   ├── pharmacy-emergency-card.ts
│   │   ├── ai-alert-timeline-card.ts
│   │   ├── family-location-card.ts
│   │   └── floor3d-wrapper-card.ts
│   ├── editors/              # GUI 편집기 (HACS UI 친화)
│   └── utils/
├── dist/                     # 빌드 산출물 (gitignored 옵션)
├── examples/                 # YAML 예시 (값은 example.local·your_entity_id)
│   ├── kepco.yaml
│   ├── transit.yaml
│   └── full-dashboard.yaml
├── images/                   # 카드 스크린샷 (실명·실주소 마스킹 필수)
└── .github/workflows/
    ├── build.yml             # PR마다 빌드 검증
    └── release.yml           # 태그 푸시 시 dist 첨부
```

## 6. 마일스톤

### M0 — Bootstrap (Day 0, 1 세션)
- [ ] 레포 골격, package.json, rollup, tsconfig 설정
- [ ] HACS 플러그인 메타 (hacs.json, manifest 형식)
- [ ] CI: build.yml — push/PR마다 `npm run build` 검증
- [ ] README 초안 (한국어 + 영어 요약)
- [ ] 첫 카드 1개 (kepco-progress-card) 동작 확인 — `kr_component_kit` 엔티티 mock으로

### M1 — 핵심 4카드 (1~2 세션)
- [ ] kepco-progress-card — 누진단계 시각화
- [ ] transit-card — 대중교통 도착정보
- [ ] pharmacy-emergency-card — 야간/주말 약국 + 재난문자
- [ ] ai-alert-timeline-card — `homeassistant_mcp/dashboards/`의 자동화 결과 타임라인
- [ ] 각 카드에 examples/*.yaml + 스크린샷 (마스킹)
- [ ] 카드별 GUI 에디터 (선택)

### M2 — 확장 카드 + floor3d 연동 (1~2 세션)
- [ ] family-location-card — person + device_tracker + 차량 통합
- [ ] floor3d-wrapper-card — `floor3d-toolkit`이 만드는 glb를 카드에서 로드
- [ ] i18n: 영문 라벨 옵션
- [ ] examples/full-dashboard.yaml — 한 화면 종합 데모

### M3 — HACS 정식 등록
- [ ] HACS default repository PR 제출 (kr_component_kit 등록 경험 활용)
- [ ] 데모 영상 / GIF
- [ ] 문서 영문판 (README_EN.md)
- [ ] 후원 섹션 (`ha-app-dhlottery` 동일 패턴: 토스 + PayPal 이미지)

## 7. 무료/보안 가드 (본 레포 특화)

### 코드 단계
- 카드는 **클라이언트 측 렌더링만** — 외부 API 호출 없음. 모든 데이터는 HA WebSocket을 통해 들어옴.
- 따라서 본 레포에는 **API 키가 존재할 이유가 없음**. 키 등장 시 즉시 코드 리뷰 차단.
- 데모 dev 환경 HA URL은 `.env.local` (gitignore) — `localhost:8123` 또는 `example.local:8123` 만 README/예시에 노출.

### 스크린샷 단계
- 모든 스크린샷은 **합성 데이터 또는 마스킹 필수**:
  - 엔티티 ID 중 실명 포함 부분은 모자이크 (예: `person.jerry` → 마스킹)
  - 차량 번호판 마스킹
  - GPS 좌표 노출 시 좌표 흐리기
- 데모용 별도 HA 인스턴스 권장 (실가족 데이터 X)

### 예시 YAML
- 절대 본인 엔티티 ID 그대로 X. 항상 `your_*`, `sensor.example_*` 사용
- `sensor.kepco_progress` (○) vs `sensor.kepco_redchupa_progress` (✗)

### 후원 메타
- 카드 자체는 device 메타가 없음 (프론트엔드 코드)
- README "후원" 섹션에만 토스/PayPal 이미지 포함
- `package.json` "author": `redchupa <git URL>` OK, 본인 이메일 X

## 8. 본인 자산 참조 (재활용 가능 경로)

| 자산 | 위치 | 어디에 쓰나 |
|---|---|---|
| 기존 대시보드 JSON | `homeassistant_mcp/dashboards/lovelace_full_2026-05-07.json` | 카드 사용 패턴 추출 (가족 위치, AI 알림 등) |
| honeycomb 프로토타입 | `homeassistant_mcp/dashboards/honeycomb_v1_section.json` | 메뉴 카드 디자인 레퍼런스 |
| floorplan picture-elements | `homeassistant_mcp/dashboards/floorplan-picture-elements-original.yaml` | floor3d-wrapper와 비교 |
| AI 알림 히스토리 패턴 | `homeassistant_mcp/memory/automation_baby_sleep_ai.md`, `automation_front_door_ai.md` | timeline 카드의 입력 데이터 형식 |
| kr_component_kit 엔티티 목록 | `github_auto_development/kr_component_kit/README.md` | 카드별 대상 sensor 명세 |

> **주의**: 위 파일들에 본인 실엔티티 ID / 좌표 / IP가 들어있음. **참조만**, 카드 코드/예시에는 절대 카피·페이스트 금지. 추출 시 즉시 플레이스홀더로 치환.

## 9. 수락 기준 (v1.0 DoD)

- [ ] HACS Custom repository로 설치 후 6개 카드 모두 등록·렌더링 확인
- [ ] 각 카드 examples/*.yaml로 5분 안에 첫 카드 띄울 수 있음
- [ ] CI 빌드 그린, dist/redchupa-cards.js < 300KB (gzip)
- [ ] 모든 스크린샷 마스킹 검수 (개인정보 0)
- [ ] README 한·영 완성
- [ ] 후원 섹션 정상 노출
- [ ] 보안 grep: `192.168` / `redchupa.com` / `jerry` / `하린` / `예린` / `제리` / `AIza` / `sk-` 매칭 0건

## 10. 다음 세션 시작 프롬프트

```
이 폴더는 redchupa-cards 프로젝트입니다.
PLAN.md 와 CLAUDE.md 를 먼저 읽고, M0(Bootstrap) 부터 시작해주세요.

작업 순서:
1. PLAN.md §5 파일 구조대로 골격 생성 (package.json, rollup, tsconfig, hacs.json)
2. .gitignore, .env.example 작성
3. README.md 초안 (kr_component_kit README 톤 참고)
4. 첫 카드 src/cards/kepco-progress-card.ts 스켈레톤 + examples/kepco.yaml
5. GitHub Actions build.yml — npm run build 검증

작업 전 PLAN.md §7 (보안/무료 가드) 와 MASTER_PLAN.md 의 공통 규칙을 반드시 준수하세요.
끝나면 진행 사항 요약 + 다음 단계 제안.
```
