# 스마트 병원 당직 콜 라우팅 시스템 개발 분석 및 가이드 문서

본 문서는 **스마트 병원 당직 콜 라우팅 시스템(Smart Hospital On-Duty Call Routing System)**의 코드베이스, 비즈니스 규칙 엔진, 데이터 동기화 파이프라인, 관리자 권한 모델(RBAC), 향후 발전 계획을 종합 분석하여 정리한 기술 및 운영 마크다운 문서입니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
| :--- | :--- |
| **프로젝트명** | 스마트 병원 당직 콜 라우팅 시스템 (Hospital Call Routing System) |
| **핵심 목적** | 병동 간호사 및 원내 의료진이 진료과, 병동, 업무, 날짜/시간 선택 시 **정확한 콜 수신자(당직의, 전담간호사, 1/2차 백업)와 직통 연락처(U-CAP, 원내폰, DUMC Talk)**를 1초 내에 파악 |
| **해결 과제** | 복잡한 인턴/전공의 당직표, 주말/야간/정규 시간대별 분기 혼선, 공휴일 오인, 담당자 부재 시 2차 연락처 부재로 인한 콜 지연 및 의료 업무 누락 방지 |
| **주요 사용자** | - **일반 사용자**: 병동 간호사, 당직 의료진, 응급실/외래 간호팀<br>- **운영 관리자**: 교육수련부, 당직 편성 담당자, 간호부 수간호사, 시스템 총괄 관리자 |

---

## 2. 전체 시스템 아키텍처

```mermaid
graph TD
    subgraph Client [사용자 브라우저]
        UV[UserView - 콜 대상자 즉시 검색]
        AV[AdminView - 8개 탭 관리자 포털]
        CDV[CalendarDutyView - 월간 당직 캘린더]
        AUM[AdminUserManagement - RBAC 권한 승인]
        BC[BroadcastChannel - 탭 간 0ms 동기화]
    end

    subgraph Logic [규칙 엔진 & 클라이언트 API]
        RE[dutyRules.ts - 3단계 우선순위 분기 엔진]
        KH[koreanHolidays.ts - 공휴일/대체공휴일 판별]
        API[settingsApi.ts - 스마트 캐시 & 디바운스]
    end

    subgraph Backend [서버리스 & DB]
        EP[api/settings.js - Vercel / Express Endpoint]
        DB[(Neon Serverless PostgreSQL)]
        GSheets[(Google Sheets API / 엑셀)]
    end

    UV --> RE
    AV --> RE
    AV --> API
    AUM --> API
    RE --> KH
    API --> BC
    API --> EP
    EP --> DB
    AV -.-> GSheets
```

---

## 3. 핵심 모듈별 기능 상세

### 3.1 사용자 화면 (`UserView.tsx`)
- **실시간 반응형 매칭**:
  - 진료과(내과 / 비내과), 병동(31병동 ~ 122병동, ICU, 응급실 등), 업무, 날짜/시간 선택 즉시 연산.
  - "현재 시간 적용" 버튼 및 기본 병동 즐겨찾기(`localStorage`) 지원.
- **다층 연락처 카드 표시**:
  - 주 담당자(인턴 1/2, 비내과 당직인턴, 공통전담간호사 등)의 성명, 역할명, 당직폰 번호, U-CAP, DUMC Talk 정보 제공.
  - **원클릭 복사**: 전화번호 및 호출 메시지 템플릿 복사 기능.
  - **백업 연락망 표시**: 1차 부재 시 호출할 수 있는 백업 담당자 및 2차 담당자 자동 계산 표시.
- **원내 비상연락망(Hotline) 팝업**:
  - 응급실(ER), 수술실(OR), 중환자실(ICU), 진단검사의학과, 당직행정 등 주요 부서 다이렉트 검색.

### 3.2 핵심 규칙 엔진 (`dutyRules.ts`)
콜 대상자는 다음 3단계 우선순위로 판별됩니다:

```
[사용자 입력: 진료과, 병동, 업무, 일시]
                 │
                 ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1단계: 관리자 커스텀 룰 (Custom Rules)                   │
 │ - 특정 병동, 특정 업무, 시간대, 요일에 지정된 우선 매칭 │
 └───────────────────────┬────────────────────────────────┘
                         │ (불일치 시)
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2단계: 업무 마스터 기반 분기 (Task Master Engine)       │
 │ - 전담간호사 지원 업무(Y) & 평일 정규시간(08:30~17:00): │
 │   공통전담간호사 스케줄 매칭                            │
 │ - 정규/당직 분리형: 주간(병동의) vs 야간/휴일(당직인턴)│
 │ - 특수 업무: 주말/공휴일 검안/사망진단 등              │
 └───────────────────────┬────────────────────────────────┘
                         │ (불일치 시)
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3단계: 기본 병동군 당직 인턴 매칭 (System Default)     │
 │ - 내과: Group 1(내과 1), Group 2(내과 2)               │
 │ - 비내과: Group 1(비내과 1), Group 2(비내과 2), Group 3│
 │ - 당직폰/U-CAP 직통번호 및 상호 교차 백업 자동 할당    │
 └────────────────────────────────────────────────────────┘
```

### 3.3 관리자 포털 (`AdminView.tsx` & `CalendarDutyView.tsx`)
관리자는 부여받은 권한에 따라 8가지 관리 탭에 접근할 수 있습니다:
1. **당직표 관리**: 월간 캘린더 그리드에서 일자별 내과/비내과 당직의 성명 인라인 수정, 병동군 매핑 조정.
2. **구글 시트 연동**: 구글 스프레드시트 URL 및 시트명 지정, 자동/수동 원클릭 동기화.
3. **업무 마스터 관리**: 40여 종의 의료/처치/동의서 업무 목록 관리 (전담간호사 지원 여부, 시간대별 규칙, 키워드).
4. **커스텀 라우팅 룰**: 관리자가 드래그 앤 드롭 또는 우선순위 숫자로 세부 조건별 분기 규칙 추가/수정.
5. **연락처 관리**: 인턴 의사, 전담간호사, 당직폰/U-CAP 번호부 관리.
6. **공통전담간호사 스케줄**: 요일별/타임슬롯별(Day, Evening, Night) 근무 간호사 일괄 배정 도구.
7. **원내 비상연락망**: 필수 원내 핫라인 연락처 관리.
8. **데이터 관리**: 엑셀(`xlsx`) 업로드/다운로드 및 기본 샘플 데이터 리셋.

### 3.4 사용자 관리 및 RBAC (`AdminUserManagement.tsx`)
- **회원가입 승인제**: 신규 관리자 가입 시 `PENDING` 상태로 대기하며 최고 관리자가 확인 후 승인(`APPROVED`) 또는 반려.
- **세부 탭별 권한 부여**: 각 사용자별로 접근 가능한 관리 탭(`schedules`, `common_nurse`, `tasks` 등)을 개별 체크박스로 제어.
- **최고 관리자(SUPER_ADMIN)**: 모든 탭 및 사용자 관리/비밀번호 초기화 권한 보유.

### 3.5 Neon DB & 서버리스 동기화 파이프라인 (`settingsApi.ts`)
- **JSONB 단일 테이블 구조**: `app_settings` 테이블의 `(key, value, updated_at)` 구조로 유연한 스키마리스 영속성 지원.
- **Zero-Network 해시 캐시**: 로컬 상태와 이전 저장 데이터가 동일하면 불필요한 HTTP 전송을 100% 방지.
- **BroadcastChannel 통신**: 동일 PC 내 여러 브라우저 탭 간에 서버 쿼리 없이 0ms 즉각 동기화 (발신 탭 ID 검증으로 에코 루프 차단).
- **스마트 폴링**: 비활성 탭에서는 조회를 멈추고 탭 복귀 시 및 최소 20초 쿨타임을 두고 5분 간격으로만 저비용 폴링.

---

## 4. 데이터 스키마 및 핵심 타입 (`src/types.ts`)

```typescript
// 1. 라우팅 검색 결과
export interface SearchResult {
  isRegularHours: boolean;         // 정규 근무시간 여부 (평일 08:30~17:00)
  isHolidayOrWeekend: boolean;     // 주말 또는 공휴일 여부
  holidayName?: string;            // 공휴일 명칭
  assignedRole: string;            // 최종 배정된 역할 (예: '내과 1', '공통전담 2')
  assignedPerson: string;          // 담당자 성명
  contactInfo: ContactInfo;        // 개인 연락처
  dutyPhone: string | null;        // 공용 당직폰 번호
  dutyUcap: string | null;         // 공용 당직 U-CAP 번호
  backupRole: string;              // 백업 역할
  backupContact1?: ContactInfo & { roleName: string }; // 1차 백업
  backupContact2?: ContactInfo & { roleName: string }; // 2차 백업
  notes: string;                   // 알림 및 추가 안내 사항
  ruleSource?: 'DYNAMIC_RULE' | 'SYSTEM_DEFAULT';
  matchedTaskItem?: TaskItem;
}

// 2. 업무 마스터 항목
export interface TaskItem {
  id: string;
  code?: string;                   // 업무 식별 코드 (예: TSK_EKG_P)
  name: string;                   // 업무명 (예: 단순 심전도)
  specialtyType: '내과계' | '비내과계' | '공통';
  category: '검사' | '치료 및 처치' | '동의서' | '사망 및 기타';
  isNurseSupport: 'Y' | 'N' | boolean; // 전담간호사 지원 여부
  nurseSupportNote?: string;
  timeRuleType: '정규/당직 분리형' | '시간대 무관 고정형' | '특정 시간 예외형';
  description?: string;
}

// 3. 사용자 및 RBAC
export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: 'SUPER_ADMIN' | 'USER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  permissions: AdminTabId[];       // 허용된 탭 목록
  createdAt: string;
}
```

---

## 5. 배포 및 운영 가이드

### 5.1 로컬 개발 환경 실행
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행 (기본 포트 5173)
npm run dev

# 빌드 및 타입 검사
npm run build
```

### 5.2 환경 변수 (`.env`)
```env
# Neon PostgreSQL 연결 문자열
DATABASE_URL="postgresql://user:pass@ep-cool-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# API 엔드포인트 URL (Vercel 배포 시 공백, 로컬 테스트 시 http://localhost:3001 또는 Vite 프록시)
VITE_API_URL=""
```

### 5.3 Vercel 배포
1. 루트 디렉터리의 `api/settings.js`가 Vercel Serverless Functions로 자동 인식됩니다.
2. Vercel Project Settings > Environment Variables에 `DATABASE_URL`을 설정합니다.
3. 빌드 명령어 `npm run build`, 출력 디렉터리 `dist`로 배포합니다.

---

## 6. 유지보수 및 확장 권장사항 (Roadmap)

1. **원내 EMR/메신저 연동**:
   - 현재 DUMC Talk URL 링크 지원 형태에서 원내 메신저 웹훅 API로 다이렉트 푸시 알림 연계.
2. **모바일 PWA (Progressive Web App) 강화**:
   - 서비스 워커(Service Worker)를 적용하여 네트워크가 불안정한 엘리베이터/지하 병동에서도 오프라인 캐시 기반 당직 조회 가능.
3. **감사 로그(Audit Trail) 고도화**:
   - 당직표 변경 및 권한 부여 이력을 별도 테이블에 타임스탬프와 함께 기록하여 변경 추적성 확보.
