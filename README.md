# 🇰🇷 Redchupa Cards

> 한국형 Home Assistant 사용자를 위한 Lovelace 카드 컬렉션
> Lovelace card collection for Korean Home Assistant users — KEPCO progressive-tier, transit arrivals, pharmacy/disaster alerts, AI alert timeline, family location, and floor3d wrapper.

[![License][license-shield]](LICENSE)

> 🌐 English: [README_EN.md](README_EN.md)

[![Open your Home Assistant instance and open a repository inside the HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=redchupa&repository=redchupa-cards&category=plugin)

한국전력 누진단계, 대중교통 도착정보, 야간 약국, 재난문자, 베이비캠/현관 AI 알림 등 — `kr_component_kit`과 `floor3d-toolkit`이 만들어내는 한국 특화 엔티티들을 **한 번에 시각화** 하는 Lovelace 카드 모음입니다.

## 💡 왜 만들었나?

한국형 HA 통합(`kr_component_kit` 등)은 sensor를 풍부하게 만들어 주지만, 그걸 **잘 보여주는 카드**는 사용자가 직접 yaml로 짜야 합니다. KEPCO 누진단계를 한 줄 그래프로, 약국 영업시간을 시간순 정렬로, AI 알림을 타임라인으로 — 이런 시각화 패턴이 **재사용 가능한 카드**로 묶이면 설치만으로 끝납니다.

본 레포는 그 카드들을 단일 HACS plugin 한 개에 묶어 제공합니다.

<details>
<summary><b>🇬🇧 English summary (click to expand)</b></summary>

A HACS plugin bundling six Lovelace custom cards aimed at Korean HA users. Each card is a thin renderer for entities produced by other Korean integrations — primarily [`kr_component_kit`](https://github.com/redchupa/kr_component_kit) and [`floor3d-toolkit`](https://github.com/redchupa/floor3d-toolkit) — so the bundle ships zero external API calls.

**Cards in v1**

| Card | Purpose | Required entities |
|---|---|---|
| `kepco-progress-card` | Visualize current month's KEPCO usage on the progressive-tier scale | `sensor.kepco_*_progress` (from `kr_component_kit`) |
| `transit-card` | Real-time bus/subway arrivals for a saved stop | `sensor.transit_*` (from `kr_component_kit`) |
| `pharmacy-emergency-card` | Open pharmacies + disaster alerts in one panel | `sensor.pharmacy_*`, `event.disaster_*` |
| `ai-alert-timeline-card` | Timeline of AI-analyzed baby-cam / front-door snapshots | user-defined `input_text.*` |
| `family-location-card` | Combined `person` + `device_tracker` + vehicle view | `person.*`, `device_tracker.*` |
| `floor3d-wrapper-card` | Render `.glb` floorplans produced by `floor3d-toolkit` | `floor3d-toolkit` artifact URL |

All rendering is client-side; no outbound network calls outside the HA WebSocket.

</details>

---

## 📋 포함된 카드 (v1 예정)

각 카드는 **클라이언트 측 렌더링만** 수행합니다. 외부 API 호출 없음, 모든 데이터는 HA WebSocket을 통해 들어옵니다.

### ⚡ `kepco-progress-card` — 한국전력 누진단계
- 이번달 사용량을 누진 1·2·3단계 경계 위에 시각화
- `kr_component_kit`의 KEPCO 통합 엔티티 소비
- 예상 요금 표시

### 🚌 `transit-card` — 대중교통 도착
- 저장된 정류장의 버스 / 지하철 실시간 도착
- `kr_component_kit`의 Transit 엔티티 소비
- 즐겨찾기 정류장 다중 표시

### 💊 `pharmacy-emergency-card` — 약국 · 재난문자
- 야간/주말 영업 약국을 거리순으로
- 재난문자 알림을 같은 패널에 통합
- `kr_component_kit`의 Pharmacy + DisasterAlert 소비

### 🤖 `ai-alert-timeline-card` — AI 알림 히스토리
- 베이비캠·현관 카메라의 AI 분석 결과 타임라인
- 자동화가 채워주는 `input_text.*` 엔티티를 카드가 시간순으로 정렬
- 알림 클릭 시 해당 스냅샷 모달

### 👨‍👩‍👧 `family-location-card` — 가족 위치
- `person.*` + `device_tracker.*` + 차량 통합 뷰
- 마지막 갱신 시각, zone 표시

### 🏠 `floor3d-wrapper-card` — 3D 평면도
- `floor3d-toolkit`이 생성한 `.glb`를 카드에서 로드
- 카메라 angle preset 지원

---

## 📦 설치

> ⚠️ v1.0 정식 HACS 등록 전입니다. 현재는 **Custom Repository**로 설치할 수 있으며,
> 배포 산출물(`dist/*.js`)은 git에 커밋되지 않고 **GitHub Releases**에 첨부됩니다.
> HACS가 자동으로 최신 릴리스 asset을 받아갑니다.

### HACS Custom Repository

1. HACS → 우측 상단 메뉴(⋮) → **Custom repositories**
2. URL: `https://github.com/redchupa/redchupa-cards`
3. Category: **Lovelace**
4. 추가 후 HACS에서 **Redchupa Cards** 설치
5. Home Assistant 재시작 (또는 캐시 새로고침)

### 카드 사용

대시보드 편집기에서 **카드 추가 → 수동(Manual)** 으로 다음과 같이 입력하거나,
**Picker → Redchupa Cards** 에서 골라 GUI 에디터로 설정하세요.

```yaml
type: custom:kepco-progress-card
entity: sensor.your_kepco_progress
```

자세한 예시는 [`examples/`](examples/) 폴더 참고. 5개 카드를 한 화면에서
시연하는 [`examples/full-dashboard.yaml`](examples/full-dashboard.yaml) 도 제공.

---

## 🛠️ 개발

```bash
# 의존성 설치
npm install

# 단발 빌드
npm run build

# 변경 감지 빌드 (개발 중)
npm run watch

# 타입체크만
npm run lint
```

빌드 산출물은 `dist/redchupa-cards.js` 단일 파일로 떨어집니다. (목표: gzip < 300KB)

### 로컬에서 카드 띄우기

1. `.env.example` 을 `.env.local` 로 복사하고 **개발용 HA** 정보 입력
2. `dist/redchupa-cards.js` (+ 동일 디렉토리의 `redchupa-cards-*.js` chunk들) 을 개발 HA의 `config/www/` 에 심볼릭 링크 / 복사
3. 대시보드 → Resources 에 `/local/redchupa-cards.js` 등록 (`module` 타입)
4. `npm run watch` 실행 후 카드 yaml 편집

> ⚠️ 절대 **실사용 HA** 의 토큰이나 URL을 `.env` 에 박지 마세요. 별도 dev 인스턴스 사용을 권장합니다.

### 릴리스 절차 (메인테이너 전용)

`dist/` 는 git에 커밋되지 않습니다. 사용자가 받아가는 산출물은 **GitHub Releases**의 asset입니다 — 태그를 푸시하면 [`.github/workflows/release.yml`](.github/workflows/release.yml) 가 빌드 → 검증 → asset 첨부까지 자동으로 처리합니다.

```bash
# 1. main 브랜치가 그린 상태인지 확인
git status

# 2. package.json 버전 bump + commit
npm version patch     # 또는 minor / major

# 3. 태그 푸시 → release 워크플로우 트리거
git push origin main --follow-tags
```

워크플로우가 성공하면 [Releases 페이지](https://github.com/redchupa/redchupa-cards/releases)에서 빌드된 `redchupa-cards.js` + 모든 lazy chunk 파일을 확인할 수 있습니다. HACS는 최신 릴리스에서 이 파일들을 자동으로 받아갑니다.

---

## 🔒 개인정보 / 보안

- 본 카드들은 **외부 네트워크 호출이 없습니다**. 모든 데이터는 사용자의 Home Assistant WebSocket을 통해 들어옵니다.
- 따라서 본 레포에는 **API 키가 필요 없습니다**.
- 카드는 Open Source (MIT) 이며, `dist/redchupa-cards.js` 는 빌드 시 사용된 코드 외엔 아무 것도 포함하지 않습니다.

---

## 💝 후원

이 카드 컬렉션이 유용하셨다면 커피 한 잔 후원 부탁드립니다! 🙏

<table>
  <tr>
    <td align="center">
      <b>Toss (토스)</b><br>
      <img src="https://raw.githubusercontent.com/redchupa/ha-app-dhlottery/main/images/toss-donation.png" width="200">
    </td>
    <td align="center">
      <b>PayPal</b><br>
      <img src="https://raw.githubusercontent.com/redchupa/ha-app-dhlottery/main/images/paypal-donation.png" width="200">
    </td>
  </tr>
</table>

---

## 🙋 지원 / 문의

- **Issues**: https://github.com/redchupa/redchupa-cards/issues
- **Discussions**: https://github.com/redchupa/redchupa-cards/discussions

## 📄 라이선스

MIT License — [LICENSE](LICENSE)

## 🤝 관련 프로젝트

- [`kr_component_kit`](https://github.com/redchupa/kr_component_kit) — 본 카드들이 소비하는 엔티티들의 출처
- [`floor3d-toolkit`](https://github.com/redchupa/floor3d-toolkit) — 3D 평면도 데이터 생성

---

<!-- shields -->
[license-shield]: https://img.shields.io/github/license/redchupa/redchupa-cards.svg
