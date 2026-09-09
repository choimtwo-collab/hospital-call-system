---
name: hospital-call-system
description: 스마트 병원 당직 콜 라우팅 시스템의 아키텍처, 업무 규칙 엔진(Rule Engine), 당직/공통전담 스케줄링, Neon DB 실시간 동기화, RBAC 권한 모델 및 유지보수 가이드라인
---

# 스마트 병원 당직 콜 라우팅 시스템 (Hospital Call System) 스킬

이 스킬은 **스마트 병원 당직 콜 라우팅 시스템 (Smart Hospital On-Duty Call Routing System)** 프로젝트의 전체 아키텍처, 당직/콜 분기 규칙 엔진, 데이터 동기화 파이프라인, 관리자 기능(RBAC/시트 연동 등)에 대한 핵심 지식과 개발/유지보수 가이드라인을 제공합니다.

---

## 1. 프로젝트 개요 & 핵심 목적

- **목적**: 병동 간호사 및 의료진이 특정 시간대(정규/당직/야간/공휴일)와 특정 병동/진료과/업무에 맞는 **정확한 콜 수신 대상자(당직의, 전담간호사, 백업 등) 및 직통 연락처(원내 U-CAP, 휴대전화, DUMC Talk)**를 1초 만에 조회할 수 있도록 지원하는 웹 애플리케이션.
- **핵심 문제 해결**: 복잡한 당직표, 불명확한 진료과/병동 매칭, 공휴일/휴일/시간대별 상이한 담당자 분기 규칙으로 인한 콜 누락 및 지연 해소.
- **기술 스택**:
  - **프론트엔드**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite
  - **데이터베이스/백엔드**: Neon PostgreSQL Serverless (`@neondatabase/serverless`), Express/Vercel Serverless Function (`api/settings.js`)
  - **연동 & 도구**: Google Sheets Sync API, Excel Parser (`xlsx`), Docx & PPTX Generator (`docx`, `pptxgenjs`), BroadcastChannel API (멀티 탭 동기화)

---

## 2. 시스템 아키텍처 & 디렉터리 구조

```
hospital call system/
├── api/
│   └── settings.js             # Vercel / Express 서버리스 REST 엔드포인트 (Neon PostgreSQL CRUD)
├── src/
│   ├── api/
│   │   └── settingsApi.ts      # 프론트엔드 REST 클라이언트 + 캐시 + 스마트 브로드캐스트/폴링
│   ├── components/
│   │   ├── Header.tsx          # 상단 네비게이션 & 로그인/사용자 전환
│   │   ├── UserView.tsx        # 일반 사용자(병동 간호사 등) 대상 빠른 콜 라우팅 조회 화면
│   │   ├── AdminView.tsx       # 관리자 화면 (8개 탭: 당직표, 시트 연동, 업무/룰, 전담간호사, 핫라인 등)
│   │   ├── AdminUserManagement.tsx # RBAC 기반 사용자 승인 및 탭별 세부 권한 관리
│   │   ├── CalendarDutyView.tsx# 월간 캘린더 기반 인터랙티브 당직표 편집기
│   │   └── AuthModal.tsx       # 로그인 / 회원가입 모달 (SHA-256 인증)
│   ├── data/
│   │   └── initialData.ts      # 표준 진료과, 병동 매핑, 기본 당직폰/UCAP, 업무 마스터 초기 데이터
│   ├── utils/
│   │   ├── dutyRules.ts        # 핵심 라우팅 결정 엔진 (evaluateDutyRules, 시간/공휴일 계산)
│   │   ├── koreanHolidays.ts   # 대한민국 공휴일 및 대체공휴일 판별기
│   │   ├── excelParser.ts      # 엑셀 당직표 자동 파싱 및 템플릿 생성
│   │   ├── googleSheetsSync.ts # 구글 스프레드시트 당직표 자동 연동
│   │   └── authUtils.ts        # 비밀번호 해시(Web Crypto SHA-256) 및 인증 유틸
│   ├── types.ts                # 전역 타입 정의 (SearchResult, CustomRule, TaskItem 등)
│   ├── App.tsx                 # 메인 라우팅, 실시간 동기화 상태 관리, 초기 로딩 처리
│   └── main.tsx                # 진입점
├── .agents/skills/hospital-call-system/SKILL.md # 본 가이드 파일
└── SYSTEM_ARCHITECTURE.md      # 상세 시스템 설계 마크다운 문서
```

---

## 3. 핵심 도메인 모델 및 규칙 엔진 (`dutyRules.ts`)

### 3.1 3단계 우선순위 매칭 알고리즘 (`evaluateDutyRules`)
콜 대상자 판별 시 다음 우선순위에 따라 순차적으로 평가합니다:

1. **1순위: 관리자 커스텀 룰 (`customRules`)**
   - 관리자가 우선순위(priority)를 부여한 사용자 정의 룰을 먼저 평가.
   - 조건: 진료과(`department`), 병동군(`wardGroup`), 업무 키워드(`taskKeywords`), 시간대(`timeCategory`), 요일/공휴일(`dayCategory`).
   - 일치 시 `RuleAction`(담당자 역할, 백업 역할, 직통 전화)을 즉시 적용 (`ruleSource: 'DYNAMIC_RULE'`).

2. **2순위: 업무 마스터 기반 분기 (`tasks`)**
   - 선택된 업무(`selectedTask`)의 `specialtyType`, `isNurseSupport`, `timeRuleType` 확인.
   - **전담간호사 지원 가능 업무 (`isNurseSupport === 'Y'`)**:
     - 정규 진료시간대(평일 08:30~17:00, 비공휴일)일 경우 공통전담 스케줄(`cnGroupSchedules` / `weeklyCNSchedule`)을 조회하여 해당 병동/시간대 담당 간호사 우선 매칭.
     - 백업으로 인턴/전공의 지정.
   - **정규/당직 분리형 (`timeRuleType === '정규/당직 분리형'`)**:
     - 정규 시간: 병동 전담의 또는 1차 지정의.
     - 당직/야간/휴일: 당직 인턴(내과 1~2, 비내과 1~3)으로 자동 전환.
   - **사망진단 등 특정 특수 업무**:
     - 주말/공휴일 사망진단 병리과/검안의 스케줄(`pathologistSchedules`) 연계.

3. **3순위: 시스템 기본 당직 룰 (Default Fallback)**
   - 내과계 병동: 내과 1(Group 1) / 내과 2(Group 2) 당직 인턴.
   - 비내과계 병동: 비내과 1(Group 1) / 비내과 2(Group 2) / 비내과 3(Group 3) 당직 인턴.
   - 당직폰/U-CAP 매핑 테이블(`DUTY_PHONES`, `DUTY_UCAPS`)에서 직통번호 조회.
   - 백업 담당자 1, 2 자동 계산 (예: 내과 1 부재 시 내과 2, 비내과 1 부재 시 비내과 2/3).

---

## 4. 데이터 저장 및 실시간 동기화 (`settingsApi.ts` & Neon DB)

### 4.1 Neon Serverless PostgreSQL 구조
단일 테이블 `app_settings`에 Key-Value(JSONB) 형태로 유연하게 저장:
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 무료 플랜 및 네트워크 비용 극최적화 전략
1. **중복 전송 원천 차단 (Hash Cache)**:
   - 메모리 내 `lastKnownDataCache`에 직렬화된 해시를 저장하여 내용 변경이 없는 경우 HTTP 요청 0건 발생.
2. **디바운싱 (`saveSettingDebounced`)**:
   - 빈번한 상태 변경 시 500ms 지연 후 묶어서 전송.
3. **스마트 탭 간 동기화 (`BroadcastChannel`)**:
   - 동일 PC 내 여러 탭이 열려 있을 경우 불필요한 API 요청 없이 `hcs_neon_sync_channel` 브로드캐스트로 0ms 즉시 동기화.
   - 발신 탭 세션 ID(`TAB_SESSION_ID`)를 검증하여 에코(반사) 루프 차단.
4. **저전력 백그라운드 폴링**:
   - 화면이 보이지 않는 탭(`visibilityState !== 'visible'`)에서는 쿼리 완전 중지.
   - 탭 활성화 시점 및 최소 20초 쿨타임을 준수하며 5분 간격 체크.

---

## 5. 역할 기반 접근 제어 (RBAC) & 사용자 관리

### 5.1 사용자 등급 및 상태
- `Role`:
  - `SUPER_ADMIN`: 모든 탭 및 사용자 관리/승인/권한 설정 가능.
  - `USER`: 일반 관리자/사용자. 승인된 특정 탭만 접근 가능.
- `Status`:
  - `PENDING`: 회원가입 직후 상태 (관리자 승인 대기).
  - `APPROVED`: 승인 완료 (접근 가능).
  - `REJECTED`: 거절/차단.

### 5.2 탭별 세부 권한 (`AdminTabId`)
- `schedules`: 당직표 관리 및 캘린더 편집
- `sheets`: 구글 시트 동기화 설정
- `tasks`: 업무 마스터 관리
- `rules`: 커스텀 콜 라우팅 규칙 관리
- `contacts`: 의사/간호사/부서 연락처 관리
- `common_nurse`: 공통전담간호사 스케줄/병동군 배정
- `hotlines`: 원내 주요 핫라인/비상연락망
- `data`: 엑셀 가져오기/내보내기 및 데이터 초기화
- `users`: 관리자 계정 승인 및 권한 부여 (최고 관리자 전용)

---

## 6. 개발 및 코드 수정 시 주의사항 (Developer Checklist)

1. **상태 변경 시 Neon DB 저장 패턴 준수**:
   - 관리자 화면에서 상태 변경 시 반드시 `saveSettingDebounced` 또는 `saveSetting`을 호출하여 영속화해야 합니다.
   - 변경 후 `registerKnownSettings`로 로컬 캐시를 최신화하여 루프를 방지합니다.
2. **시간대 처리 (`Asia/Seoul`)**:
   - `getLocalISOString()` 유틸리티를 사용하여 브라우저 UTC 오차를 제거하고 한국 표준시(KST) 기준 날짜/시간을 생성해야 합니다.
3. **공휴일 계산**:
   - `koreanHolidays.ts`에 대체공휴일 및 설날/추석 연휴 계산 로직이 내장되어 있습니다. 신규 공휴일 규정 반영 시 이 유틸을 업데이트합니다.
4. **전담간호사 vs 당직의 라우팅 경합 방지**:
   - `dutyRules.ts` 수정 시 간호사 근무표에 이름이 비어있는 경우 Fallback으로 반드시 당직 인턴/전담의가 지정되도록 방어 코드를 유지해야 합니다.
