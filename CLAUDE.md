# Claude 세션 부트스트랩 — redchupa-cards

> 이 파일은 새 Claude Code 세션이 이 프로젝트 폴더를 열 때 자동으로 읽는 컨텍스트입니다.

## 🔒 최상위 규칙 (위반 시 즉시 작업 중단)

레포 어디에도 다음을 평문으로 포함하지 말 것:
- API 키, 토큰, OAuth secret, WordPress 패스워드
- 사설 IP (`192.168.x.x`, `10.x.x.x`), NAS IP, HA IP
- 본인 서버 URL (`ha.redchupa.com`, `redchupa.com`, 본인 도메인)
- 가족 실명 (`jerry`, `하린`, `우하린`, `WooRin`, `예린`, `제리`)
- 본인 차량 번호판, 주소, 전화번호
- 본인 엔티티 ID 그대로 (예: `sensor.kepco_redchupa_*` 같은 식별자)
- 스크린샷에 위 정보 노출 (모자이크/마스킹 필수)

대신: `your_*`, `example.local`, `YOUR_API_KEY`, `<placeholder>` 사용.

**예외 (의도적 공개)**: 후원 메타
- `manufacturer="우*만"`, `model="토스 1000-1261-7813"`, `sw_version="커피 한잔은 사랑입니다"`
- README의 후원 섹션(토스/PayPal 이미지)

## 프로젝트 한 줄

HACS 등록용 Lovelace 카드 컬렉션 (한국형 HA 사용자 대상). `kr_component_kit` 소비자 카드 + AI 알림 + floor3d wrapper.

## 작업 시작 시

1. **`PLAN.md` 정독** — 범위, 아키텍처, 마일스톤, 보안 가드 §7
2. **`../MASTER_PLAN.md` 정독** — 공통 규칙
3. 현재 마일스톤(M0/M1/M2/M3) 어디인지 사용자에게 확인
4. 변경 전 항상 현재 상태 보여주고 승인받기 (`feedback_approach.md` 원칙)

## 코드 원칙

- TypeScript + Lit (Web Component)
- 가독성 > 최적화
- 외부 네트워크 호출 금지 (HA WebSocket만)
- 단위 빌드 < 300KB gzip
- 카드 등록 시 manifest에 후원 정보 noted

## 본인 자산 (재활용 시 즉시 일반화)

PLAN.md §8 참고. 모든 참조 자산에 본인 엔티티 ID·실명·IP가 포함되어 있으니, 코드에 카피·페이스트 절대 금지. 패턴만 추출해서 새 코드를 작성.

## 발행 전 체크리스트

```bash
# 보안 grep (모두 0건이어야 함)
grep -rE "192\.168\.|10\.0\.|redchupa\.com|ha\.redchupa|jerry|하린|예린|제리|WooRin|AIza|sk-[a-zA-Z0-9]" . --exclude-dir=node_modules --exclude-dir=dist
```

## 다음 단계 (사용자가 처음 세션 열 때)

PLAN.md §10 "다음 세션 시작 프롬프트" 를 그대로 첫 메시지로 사용.
