import PptxGenJS from 'pptxgenjs';
import path from 'path';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = '스마트 병원 당직 및 전담간호사 콜 라우팅 시스템 발표자료';
pptx.company = '병원 당직 및 콜 시스템 개발팀';

// Color Palette Definition
const COLORS = {
  NAVY_DARK: '0F172A',
  NAVY_MEDIUM: '1E293B',
  BLUE_PRIMARY: '0284C7',
  BLUE_LIGHT: 'E0F2FE',
  CYAN_ACCENT: '06B6D4',
  TEAL_ACCENT: '0D9488',
  AMBER_ACCENT: 'D97706',
  AMBER_BG: 'FEF3C7',
  EMERALD: '059669',
  EMERALD_BG: 'D1FAE5',
  ROSE: 'E11D48',
  ROSE_BG: 'FFE4E6',
  BG_LIGHT: 'F8FAFC',
  CARD_BORDER: 'CBD5E1',
  TEXT_DARK: '0F172A',
  TEXT_MUTED: '475569',
  TEXT_WHITE: 'FFFFFF'
};

// Helper: Common Header for Content Slides
function addSlideHeader(slide, title, category, slideNum) {
  // Top Accent Line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.1,
    fill: { color: COLORS.BLUE_PRIMARY }
  });

  // Category Tag
  slide.addText(category.toUpperCase(), {
    x: 0.8, y: 0.35, w: 8.0, h: 0.25,
    fontSize: 10, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.BLUE_PRIMARY
  });

  // Slide Title
  slide.addText(title, {
    x: 0.8, y: 0.6, w: 10.0, h: 0.55,
    fontSize: 20, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.NAVY_DARK
  });

  // Slide Number
  if (slideNum) {
    slide.addText(slideNum, {
      x: 11.8, y: 0.5, w: 1.0, h: 0.4,
      fontSize: 12, fontFace: 'Arial', bold: true, align: 'right',
      color: COLORS.TEXT_MUTED
    });
  }

  // Divider Line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.8, y: 1.25, w: 11.7, h: 0,
    line: { color: 'E2E8F0', width: 1.5 }
  });
}

// =========================================================================
// SLIDE 1: Title Slide (Cover)
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.NAVY_DARK };

  // Decorative Accent Shapes
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.2, h: '100%',
    fill: { color: COLORS.CYAN_ACCENT }
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.2, y: 1.0, w: 3.5, h: 5.2,
    fill: { color: COLORS.NAVY_MEDIUM, transparency: 20 },
    line: { color: COLORS.BLUE_PRIMARY, width: 1.5 },
    rectRadius: 0.2
  });

  // Highlight points inside decorative card
  slide.addText('SYSTEM HIGHLIGHTS', {
    x: 9.5, y: 1.3, w: 3.0, h: 0.3,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.CYAN_ACCENT
  });

  const highlights = [
    '• 5단계 지능형 연락 알고리즘',
    '• 평일/야간/휴일 자동 판정',
    '• 1초 원클릭 UCAP/당직폰 다이얼',
    '• 업무마스터 안전 가드 탑재',
    '• 구글 시트 실시간 자동 동기화',
    '• 9대 통합 관리자 모듈 제공'
  ];

  slide.addText(highlights.join('\n\n'), {
    x: 9.5, y: 1.8, w: 3.0, h: 4.0,
    fontSize: 11, fontFace: 'Malgun Gothic',
    color: 'E2E8F0', lineSpacing: 18
  });

  // Title Category Tag
  slide.addText('HOSPITAL SMART CALL ROUTER · RESULT REPORT', {
    x: 1.0, y: 1.8, w: 7.8, h: 0.3,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.CYAN_ACCENT
  });

  // Main Title
  slide.addText('스마트 병원 당직 &\n전담간호사 콜 라우팅 시스템', {
    x: 1.0, y: 2.2, w: 8.0, h: 1.6,
    fontSize: 32, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE, lineSpacing: 42
  });

  // Subtitle
  slide.addText('환자 안전과 업무 효율을 위한 원클릭 당직 매칭 · 5단계 라우팅 엔진 · 실시간 동기화 플랫폼', {
    x: 1.0, y: 4.0, w: 7.8, h: 0.7,
    fontSize: 14, fontFace: 'Malgun Gothic',
    color: '94A3B8'
  });

  // Meta Box
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.0, y: 5.4, w: 7.5, h: 0.05,
    fill: { color: COLORS.BLUE_PRIMARY }
  });

  slide.addText('개발 및 운영팀  |  2026 시스템 구축 및 배포 완료 보고', {
    x: 1.0, y: 5.6, w: 7.5, h: 0.4,
    fontSize: 12, fontFace: 'Malgun Gothic',
    color: 'CBD5E1'
  });

  slide.addNotes(
    '안녕하십니까. 오늘 발표를 맡은 개발팀입니다. 병동 간호 현장과 당직 의료진의 소통을 획기적으로 개선하고 오콜을 방지하기 위해 개발된 "스마트 병원 당직 및 전담간호사 콜 라우팅 시스템"의 개발 성과와 알고리즘, 주요 기능을 보고드리겠습니다.'
  );
}

// =========================================================================
// SLIDE 2: Background & Pain Points
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '도입 배경 및 기존 병동 현장의 Pain Points', 'Background & Problem Definition', '02 / 10');

  // Sub-description
  slide.addText('기존에는 시시각각 변하는 당직자와 전담간호사를 수기로 파악하느라 불필요한 시간 소모와 잦은 오콜이 발생했습니다.', {
    x: 0.8, y: 1.35, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Malgun Gothic', color: COLORS.TEXT_MUTED
  });

  // 4 Pain Point Cards
  const cards = [
    {
      title: '1. 복잡한 수기 확인의 비효율',
      desc: '종이 당직표, 엑셀 출력물, 단체 메신저를 일일이 대조하여 당직의를 찾느라 환자 처치 골든타임 지연 (확인에 2~3분 소요)',
      color: COLORS.AMBER_ACCENT,
      tag: '시간 낭비'
    },
    {
      title: '2. 잦은 오콜(Wrong Call) 발생',
      desc: '진료과(내과/비내과), 병동군, 시간대(정규/이브닝/심야), 요일별로 담당자가 달라 휴식 중인 비당직의에게 잘못 전화가 걸리는 갈등 빈발',
      color: COLORS.ROSE,
      tag: '의료진 갈등'
    },
    {
      title: '3. 전담간호사 vs 의사 경계 모호',
      desc: '어떤 술기(채혈, L-tube, Foley 등)가 전담간호사 지원 대상인지, 수혈동의서는 누구에게 콜해야 하는지 병동별 기준 혼선',
      color: COLORS.BLUE_PRIMARY,
      tag: '업무 혼선'
    },
    {
      title: '4. 당직 스케줄 변경 전파 지연',
      desc: '연차, 대근, 스케줄 트레이드 발생 시 출력된 당직표에 즉시 반영되지 않아 과거 명단의 의사에게 연락 두절 발생',
      color: COLORS.TEAL_ACCENT,
      tag: '업데이트 부재'
    }
  ];

  cards.forEach((c, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.85 + row * 2.2;

    // Card Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.6, h: 2.0,
      fill: { color: COLORS.TEXT_WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 },
      rectRadius: 0.15
    });

    // Color Accent Left Bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 0.15, h: 2.0,
      fill: { color: c.color },
      rectRadius: 0.05
    });

    // Tag
    slide.addShape(pptx.ShapeType.rect, {
      x: x + 0.35, y: y + 0.25, w: 1.2, h: 0.28,
      fill: { color: c.color },
      line: { color: c.color }
    });
    slide.addText(c.tag, {
      x: x + 0.35, y: y + 0.25, w: 1.2, h: 0.28,
      fontSize: 9, fontFace: 'Malgun Gothic', bold: true, align: 'center',
      color: COLORS.TEXT_WHITE
    });

    // Card Title
    slide.addText(c.title, {
      x: x + 1.7, y: y + 0.25, w: 3.6, h: 0.3,
      fontSize: 13, fontFace: 'Malgun Gothic', bold: true,
      color: COLORS.NAVY_DARK
    });

    // Card Content
    slide.addText(c.desc, {
      x: x + 0.35, y: y + 0.68, w: 5.0, h: 1.15,
      fontSize: 10.5, fontFace: 'Malgun Gothic',
      color: COLORS.TEXT_MUTED, lineSpacing: 16
    });
  });

  // Bottom Solution Banner
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 6.35, w: 11.5, h: 0.65,
    fill: { color: COLORS.NAVY_DARK },
    rectRadius: 0.1
  });
  slide.addText('💡 시스템 개발 목표: 진료계열 + 병동 + 요청업무 + 일시 선택 시 1초 만에 최적의 1순위 연락처와 백업 라인을 자동 도출!', {
    x: 1.0, y: 6.45, w: 11.1, h: 0.45,
    fontSize: 12, fontFace: 'Malgun Gothic', bold: true, align: 'center',
    color: COLORS.CYAN_ACCENT
  });

  slide.addNotes(
    '기존 병동 현장에서는 매일 저녁마다 "오늘 내과 1번 당직이 누구인지, 이 술기는 전담간호사에게 해야 하는지"를 일일이 종이와 메신저로 찾아야 했습니다. 이로 인해 처치가 지연되고, 잘못 걸려온 전화로 의료진 간의 피로와 갈등이 극심했습니다. 본 시스템은 이 4대 문제를 알고리즘으로 해결하기 위해 출발했습니다.'
  );
}

// =========================================================================
// SLIDE 3: System Architecture & Overall Flow
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '시스템 아키텍처 및 듀얼 뷰(Dual View) 구조', 'System Architecture & Data Flow', '03 / 10');

  // Left Card: User View (Clinical Side)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 5.6, h: 4.6,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.BLUE_PRIMARY, width: 2 },
    rectRadius: 0.15
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.5, w: 5.6, h: 0.65,
    fill: { color: COLORS.BLUE_PRIMARY }
  });
  slide.addText('🏥 임상 현장 화면 (User View)', {
    x: 1.0, y: 1.6, w: 5.2, h: 0.45,
    fontSize: 14, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE
  });

  const userViewFeatures = [
    '• 간호사용 초간결 4단계 호출 필터 (과/병동/업무/일시)',
    '• 최우선 배정 당직의 / 전담간호사 히어로 카드 제공',
    '• 원클릭 UCAP 바로걸기 & 휴대폰 직통 다이얼 연동',
    '• DUMC 톡 ID 확인 및 1초 클립보드 복사',
    '• 업무마스터 임상 표준 가이드 & 인계 주의사항 표시',
    '• 부재 시 1순위 / 2순위 비상 백업 연락처 동시 안내',
    '• "내 기본 병동" 브라우저 1초 기억 기능'
  ];
  slide.addText(userViewFeatures.join('\n\n'), {
    x: 1.1, y: 2.3, w: 5.0, h: 3.6,
    fontSize: 11, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_DARK, lineSpacing: 17
  });

  // Right Card: Admin View (Operations Side)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.5, w: 5.6, h: 4.6,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.TEAL_ACCENT, width: 2 },
    rectRadius: 0.15
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.7, y: 1.5, w: 5.6, h: 0.65,
    fill: { color: COLORS.TEAL_ACCENT }
  });
  slide.addText('⚙️ 운영 관리자 화면 (Admin View)', {
    x: 6.9, y: 1.6, w: 5.2, h: 0.45,
    fontSize: 14, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE
  });

  const adminViewFeatures = [
    '• 월간 당직표 인터랙티브 캘린더 & 그리드 편집기',
    '• 구글 스프레드시트(Google Sheets) 1분 자동 동기화',
    '• 병원 공식 엑셀 파일 드래그 앤 드롭 업로드 & 파싱',
    '• 20종 표준 업무 마스터 (전담지원 여부, 시간대 규칙)',
    '• 노코드 규칙 빌더 (우선순위 기반 동적 룰 생성)',
    '• 공통전담간호 3교대 매트릭스 & 포스트 연락처 관리',
    '• 최고관리자 전용 RBAC 회원 승인 & 탭별 권한 제어'
  ];
  slide.addText(adminViewFeatures.join('\n\n'), {
    x: 7.0, y: 2.3, w: 5.0, h: 3.6,
    fontSize: 11, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_DARK, lineSpacing: 17
  });

  // Bottom Center Sync Bar
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 6.25, w: 11.5, h: 0.75,
    fill: { color: COLORS.NAVY_MEDIUM },
    rectRadius: 0.1
  });
  slide.addText('🔗 실시간 3중 데이터 구조: Google Sheets 당직표 자동 수집 ⟷ Cloud PostgreSQL 백엔드 ⟷ LocalStorage 오프라인 보호', {
    x: 1.0, y: 6.35, w: 11.1, h: 0.55,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true, align: 'center',
    color: COLORS.CYAN_ACCENT
  });

  slide.addNotes(
    '시스템은 완벽히 분리된 듀얼 뷰 체계입니다. 간호사가 쓰는 임상 화면은 군더더기 없이 1초 만에 UCAP을 걸 수 있도록 최적화되었고, 관리자 화면은 9대 마스터 설정을 통해 병원의 정책 변경을 코딩 없이 즉시 수용합니다. 또한 3중 데이터 구조로 네트워크 장애 시에도 문제없이 가동됩니다.'
  );
}

// =========================================================================
// SLIDE 4: Core Routing Algorithm Pipeline
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '핵심 연락 알고리즘 (5단계 의사결정 파이프라인)', 'Core Routing Engine Pipeline', '04 / 10');

  // Pipeline Step Cards
  const steps = [
    {
      num: 'STEP 1',
      title: '환경 변수 판정',
      desc: '• 공휴일/주말 실시간 계산\n• 평일 정규 (08~17시)\n• 이브닝 (17~22시)\n• 심야 야간 (22~08시)\n• 자정 경계 교대 완벽 지원',
      color: COLORS.BLUE_PRIMARY
    },
    {
      num: 'STEP 2',
      title: '규칙 빌더 우선 평가',
      desc: '• 관리자 커스텀 룰 최우선\n• 우선순위 1~N 순차 검사\n• 과/병동/시간/키워드 매칭\n• 일치 시 기본엔진 우회\n(예: 통합의학과 사망선언)',
      color: COLORS.AMBER_ACCENT
    },
    {
      num: 'STEP 3',
      title: '특수 직역/시간 분기',
      desc: '• EKG 임상병리사 매칭\n  (평일 06~08시 정규 EKG)\n• 병리사 순환일정 자동 연동\n• 응급상황/CPR/응급약물\n  ➔ 전담+의사 동시 호출',
      color: COLORS.ROSE
    },
    {
      num: 'STEP 4',
      title: '진료계열 기본 엔진',
      desc: '• 내과계: Group 1 vs 2\n  ➔ 개인 UCAP 매칭\n• 비내과계: Group C vs D\n  ➔ 공용 당직폰 매칭\n• 상시 전담간호 업무 연결\n• 수혈동의서 의사 전담',
      color: COLORS.TEAL_ACCENT
    },
    {
      num: 'STEP 5',
      title: '업무마스터 안전 가드',
      desc: '• 전담지원 불가(N) 검사\n• 간호사 배정 시 강제 차단\n• 의사 직통으로 강제 변경\n• 최종 연락처 매핑\n• 1/2순위 백업 라인 생성',
      color: COLORS.EMERALD
    }
  ];

  steps.forEach((s, idx) => {
    const x = 0.8 + idx * 2.38;
    const y = 1.6;

    // Step Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 2.25, h: 4.5,
      fill: { color: COLORS.TEXT_WHITE },
      line: { color: s.color, width: 2 },
      rectRadius: 0.12
    });

    // Step Header
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 2.25, h: 0.6,
      fill: { color: s.color }
    });
    slide.addText(s.num, {
      x, y: y + 0.05, w: 2.25, h: 0.22,
      fontSize: 9, fontFace: 'Malgun Gothic', bold: true, align: 'center',
      color: COLORS.TEXT_WHITE
    });
    slide.addText(s.title, {
      x, y: y + 0.28, w: 2.25, h: 0.28,
      fontSize: 11, fontFace: 'Malgun Gothic', bold: true, align: 'center',
      color: COLORS.TEXT_WHITE
    });

    // Step Content
    slide.addText(s.desc, {
      x: x + 0.12, y: y + 0.75, w: 2.01, h: 3.6,
      fontSize: 10, fontFace: 'Malgun Gothic',
      color: COLORS.TEXT_DARK, lineSpacing: 16
    });

    // Arrow Connector (except last)
    if (idx < steps.length - 1) {
      slide.addText('▶', {
        x: x + 2.22, y: y + 2.0, w: 0.2, h: 0.3,
        fontSize: 12, fontFace: 'Arial', bold: true, align: 'center',
        color: COLORS.TEXT_MUTED
      });
    }
  });

  // Bottom Summary Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 6.25, w: 11.5, h: 0.75,
    fill: { color: COLORS.NAVY_DARK },
    rectRadius: 0.1
  });
  slide.addText('결과 출력: [최우선 배정자] + [직통 UCAP / 당직폰 번호] + [DUMC 톡] + [업무 표준 지침] + [1순위/2순위 백업 UCAP]', {
    x: 1.0, y: 6.4, w: 11.1, h: 0.45,
    fontSize: 11.5, fontFace: 'Malgun Gothic', bold: true, align: 'center',
    color: COLORS.TEXT_WHITE
  });

  slide.addNotes(
    '이 슬라이드는 시스템의 핵심인 연락 알고리즘 5단계를 보여줍니다. 단순히 표를 조회하는 것이 아니라, 환경을 먼저 판정하고, 관리자 동적 규칙을 검사한 뒤, 특수 직역과 기본 엔진을 거쳐, 마지막으로 업무마스터 안전 가드를 통과해야만 최종 호출 대상이 결정됩니다.'
  );
}

// =========================================================================
// SLIDE 5: Detailed Rules (Internal Med vs Non-Internal Med)
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '알고리즘 상세 비교: 내과계 vs 비내과계 매칭 규칙', 'Detailed Domain Routing Rules', '05 / 10');

  // 2-Column Comparison Layout
  // Column 1: Internal Medicine
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 5.6, h: 5.4,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.BLUE_PRIMARY, width: 1.5 },
    rectRadius: 0.15
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.5, w: 5.6, h: 0.55,
    fill: { color: COLORS.BLUE_PRIMARY }
  });
  slide.addText('🩺 내과계 (Internal Medicine) 라우팅 규칙', {
    x: 1.0, y: 1.6, w: 5.2, h: 0.35,
    fontSize: 13, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE
  });

  const imRules = [
    '• 병동 이원화 관리:',
    '  - Group 1: 42, 61, 62, 82, 92, 102, MICU ➔ 내과 1 (인턴1)',
    '  - Group 2: 71, 72, 81, 101, 111, 112, 121 ➔ 내과 2 (인턴2)',
    '• 연락처 원칙: 당직의 개인 UCAP 및 개인폰 실시간 매칭',
    '• 수혈 동의서: 상시 인턴 전담 (전담간호사 지원 절대 불가)',
    '• ABGA / Line 채혈:',
    '  - 평일 정규: MICU는 인턴 / 일반병동은 공통전담간호사',
    '  - 야간(22~08시): Group 1은 당직전담, Group 2는 내과2',
    '• T-tube 교체: MICU는 내과1, 일반병동 야간은 전공의 별도안내',
    '• 조영제/진정 동의서: 08~22시 공통전담 / 심야는 당직인턴'
  ];
  slide.addText(imRules.join('\n'), {
    x: 1.0, y: 2.15, w: 5.2, h: 4.6,
    fontSize: 10, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_DARK, lineSpacing: 15
  });

  // Column 2: Non-Internal Medicine (Surgical & Others)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.5, w: 5.6, h: 5.4,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.TEAL_ACCENT, width: 1.5 },
    rectRadius: 0.15
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.7, y: 1.5, w: 5.6, h: 0.55,
    fill: { color: COLORS.TEAL_ACCENT }
  });
  slide.addText('🔪 비내과계 (Non-IM / 외과계) 라우팅 규칙', {
    x: 6.9, y: 1.6, w: 5.2, h: 0.35,
    fontSize: 13, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE
  });

  const nonImRules = [
    '• 3인 당직 체계 & 공용 당직폰 우선 연결:',
    '  - 비내과 1 (5-4080 / 010-7628-5803): 응급실, 수술실 지정병동',
    '  - 비내과 2 (5-4081 / 010-7624-5803): Group C (SICU/외과계)',
    '  - 비내과 3 (5-3499 / 010-5794-4170): Group D (71~121병동)',
    '• 수혈 동의서: Group C는 비내과2 / Group D는 비내과3 전담',
    '• 특수 및 요일별 예외 규칙 (규칙 빌더 연동):',
    '  - 통합의학과 사망선언 ➔ 비내과 2 (5-4081) 고정',
    '  - 주말/휴일 욕창(3단계 sore) 드레싱 ➔ 비내과 1 (5-4080)',
    '  - 일요일 UR Op site 수술부위 드레싱 ➔ 비내과 1 (5-4080)',
    '  - 일요일 AN 마취동의서 ➔ 비내과 1 (5-4080)',
    '  - 응급수술 Assist ➔ 1순위 비내과1, 부재 시 2순위 비내과2'
  ];
  slide.addText(nonImRules.join('\n'), {
    x: 6.9, y: 2.15, w: 5.2, h: 4.6,
    fontSize: 10, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_DARK, lineSpacing: 15
  });

  slide.addNotes(
    '내과계와 비내과계의 가장 큰 차이점은 전화 연결 방식입니다. 내과는 당직의 개인 UCAP으로 바로 연결되지만, 비내과계는 3대의 공용 당직폰으로 연결됩니다. 또한 비내과계는 일요일 마취동의서나 비뇨기과 드레싱 같은 예외 규칙들이 많은데, 알고리즘이 이를 정확히 가려냅니다.'
  );
}

// =========================================================================
// SLIDE 6: User View Features & Clinical UI
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '임상 간호사 중심의 사용자 화면 (User View)', 'User Experience & Clinical UI', '06 / 10');

  // Left Side: 4 Controls Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 4.8, h: 5.4,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.CARD_BORDER, width: 1 },
    rectRadius: 0.15
  });

  slide.addText('호출 조건 선택 영역 (입력 패널)', {
    x: 1.1, y: 1.7, w: 4.2, h: 0.35,
    fontSize: 13, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.NAVY_DARK
  });

  const controls = [
    { title: '1. 환자 진료계열 선택', desc: '[내과계열] vs [비내과계열] 원클릭 토글' },
    { title: '2. 요청 병동 선택 (⭐ 내 병동 기억)', desc: '자주 근무하는 병동을 브라우저에 기본 저장' },
    { title: '3. 요청 업무 자동완성 검색', desc: 'EKG, 사망, 드레싱, 수혈 등 20종 키워드 검색' },
    { title: '4. 호출 일시 & 공휴일 감지', desc: '현재시간 1초 동기화, 주말/공휴일 뱃지 자동 부여' },
    { title: '⚡ 규칙 빌더 퀵 프리셋 칩', desc: '관리자가 등록한 주요 예외 상황 원클릭 자동 설정' }
  ];

  controls.forEach((ctrl, idx) => {
    const y = 2.2 + idx * 0.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.0, y, w: 4.4, h: 0.78,
      fill: { color: COLORS.BG_LIGHT },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08
    });
    slide.addText(ctrl.title, {
      x: 1.15, y: y + 0.08, w: 4.1, h: 0.28,
      fontSize: 10.5, fontFace: 'Malgun Gothic', bold: true,
      color: COLORS.BLUE_PRIMARY
    });
    slide.addText(ctrl.desc, {
      x: 1.15, y: y + 0.36, w: 4.1, h: 0.35,
      fontSize: 9.5, fontFace: 'Malgun Gothic',
      color: COLORS.TEXT_MUTED
    });
  });

  // Right Side: Hero Card Preview & Details
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.9, y: 1.5, w: 6.4, h: 5.4,
    fill: { color: COLORS.TEXT_WHITE },
    line: { color: COLORS.CYAN_ACCENT, width: 2 },
    rectRadius: 0.15
  });

  // Mock Hero Header
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.9, y: 1.5, w: 6.4, h: 0.7,
    fill: { color: COLORS.NAVY_DARK }
  });
  slide.addText('당직 매칭 성공 (최우선 연결 대상)', {
    x: 6.2, y: 1.7, w: 5.8, h: 0.3,
    fontSize: 13, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.CYAN_ACCENT
  });

  // Main Call Result Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.2, y: 2.4, w: 5.8, h: 1.3,
    fill: { color: COLORS.BLUE_LIGHT },
    line: { color: COLORS.BLUE_PRIMARY, width: 1 },
    rectRadius: 0.1
  });
  slide.addText('최우선 호출 대상: 내과1 (인턴1) 정소영 전공의', {
    x: 6.4, y: 2.55, w: 5.4, h: 0.35,
    fontSize: 14, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.NAVY_DARK
  });
  slide.addText('📞 병동 내선(UCAP): 52644 (클릭 즉시 다이얼)   |   📱 개인폰: 010-3948-1029', {
    x: 6.4, y: 2.95, w: 5.4, h: 0.35,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.BLUE_PRIMARY
  });
  slide.addText('💬 DUMC 톡 ID: 정소영(인턴)    [연락처 클립보드 원클릭 복사]', {
    x: 6.4, y: 3.3, w: 5.4, h: 0.3,
    fontSize: 10, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_MUTED
  });

  // Guidelines Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.2, y: 3.85, w: 5.8, h: 1.3,
    fill: { color: COLORS.BG_LIGHT },
    line: { color: COLORS.CARD_BORDER, width: 1 },
    rectRadius: 0.1
  });
  slide.addText('📋 업무마스터 표준 임상 지침 & 지원 기준', {
    x: 6.4, y: 3.95, w: 5.4, h: 0.25,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEAL_ACCENT
  });
  slide.addText('• 전담지원 여부: 전담간호 지원 불가 (의료진 전담 업무)\n• 시간대 배정 원칙: 정규/당직 표준 규칙 준수 (MICU 인턴 배정)\n• 주의사항: 응급 수혈 필요 시 혈액은행 불출 전 동의서 서명 필수', {
    x: 6.4, y: 4.25, w: 5.4, h: 0.8,
    fontSize: 9.5, fontFace: 'Malgun Gothic',
    color: COLORS.TEXT_MUTED, lineSpacing: 15
  });

  // Backup Line Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.2, y: 5.3, w: 5.8, h: 1.35,
    fill: { color: COLORS.AMBER_BG },
    line: { color: COLORS.AMBER_ACCENT, width: 1 },
    rectRadius: 0.1
  });
  slide.addText('🛡️ 부재 시 비상 백업 순위 (Backup Call Line)', {
    x: 6.4, y: 5.4, w: 5.4, h: 0.25,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.AMBER_ACCENT
  });
  slide.addText('• 1순위 백업: 비내과 1 (당직인턴 1) ➔ UCAP 5-4080 (010-7628-5803)\n• 2순위 백업: 비내과 2 (당직인턴 2) ➔ UCAP 5-4081 (010-7624-5803)\n• 통화 중이거나 부재 시 백업 버튼을 누르면 즉시 다음 순위자로 다이얼됩니다.', {
    x: 6.4, y: 5.7, w: 5.4, h: 0.85,
    fontSize: 9.5, fontFace: 'Malgun Gothic',
    color: COLORS.NAVY_DARK, lineSpacing: 15
  });

  slide.addNotes(
    '사용자 화면은 직관성과 신속성에 초점을 맞추었습니다. 병동 간호사는 4가지 항목을 선택하기만 하면, 눈에 띄는 히어로 카드를 통해 누구에게 전화해야 하는지 즉시 알 수 있으며, 화면의 번호를 클릭하면 바로 전화가 연결됩니다. 부재 시 백업 라인까지 완벽히 제공됩니다.'
  );
}

// =========================================================================
// SLIDE 7: Admin View 9 Key Management Modules
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '운영자를 위한 관리자 화면 (Admin View) 9대 모듈', 'Admin View & 9 Management Modules', '07 / 10');

  // 3x3 Grid Modules
  const modules = [
    { title: '1. 당직표 & 엑셀 업로드', desc: '월간 캘린더/그리드 편집 및 병원 공식 엑셀 드래그 앤 드롭 업로드 자동 파싱', icon: '📅' },
    { title: '2. 구글 시트 실시간 연동', desc: '의국 구글 스프레드시트 URL 1분 주기 백그라운드 자동 동기화 및 즉시 새로고침', icon: '📊' },
    { title: '3. 업무 마스터 설정', desc: '20종 표준 업무 CRUD, 전담간호 지원 여부(Y/N), 시간대별 매칭 규격 제어', icon: '📋' },
    { title: '4. 규칙 빌더 (Rule Builder)', desc: '코딩 없는 조건부 동적 라우팅 규칙 생성, 우선순위 정렬 및 실시간 On/Off', icon: '⚡' },
    { title: '5. 의료진 & 병리사 연락망', desc: '인턴 16명 및 전공의 연락망 관리, EKG 임상병리사 순환일정 관리', icon: '📞' },
    { title: '6. 공통전담간호 매트릭스', desc: '6개 병동군 3교대(Day/Eve/Night) 공식 근무표 및 포스트별 UCAP/공용폰 제어', icon: '👥' },
    { title: '7. 주요 핫라인 관리', desc: '응급실(ER), 중환자실(MICU/SICU), 수술실(OR), 진단검사 등 긴급 다이얼', icon: '🚨' },
    { title: '8. 사용자 및 권한 (RBAC)', desc: '최고관리자 승인제 회원가입, 9개 탭별 접근 권한 체크박스 부여 시스템', icon: '🔒' },
    { title: '9. 데이터 백업 & 복원', desc: '전체 설정 1클릭 JSON 파일 백업/복원 및 긴급 롤백/초기화 기능 지원', icon: '💾' }
  ];

  modules.forEach((m, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.8 + col * 3.95;
    const y = 1.5 + row * 1.75;

    // Card Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 3.75, h: 1.6,
      fill: { color: COLORS.TEXT_WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 },
      rectRadius: 0.1
    });

    // Icon + Title
    slide.addText(`${m.icon} ${m.title}`, {
      x: x + 0.2, y: y + 0.18, w: 3.35, h: 0.3,
      fontSize: 11.5, fontFace: 'Malgun Gothic', bold: true,
      color: COLORS.NAVY_DARK
    });

    // Content
    slide.addText(m.desc, {
      x: x + 0.2, y: y + 0.55, w: 3.35, h: 0.95,
      fontSize: 9.5, fontFace: 'Malgun Gothic',
      color: COLORS.TEXT_MUTED, lineSpacing: 14
    });
  });

  slide.addNotes(
    '관리자 화면은 병원 규정의 변화를 코딩 한 줄 없이 수용할 수 있는 9가지 서브시스템으로 구성되어 있습니다. 특히 구글 시트 연동을 통해 의국에서 작성한 당직표가 1분 만에 임상 현장에 자동 반영되며, 규칙 빌더를 통해 새로운 예외 규정도 즉시 등록할 수 있습니다.'
  );
}

// =========================================================================
// SLIDE 8: System Reliability, Security & Data Sync
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '시스템 신뢰성, 안전 가드 및 보안 체계', 'Reliability, Safety Guard & Security', '08 / 10');

  const pillars = [
    {
      title: '🛡️ 업무마스터 안전 가드',
      sub: 'Fail-Safe Safety Guard',
      items: [
        '• 전담지원 불가(N) 10종 업무 강제 격리',
        '• 수혈동의서, 기관절개관 교체 등은 간호사에게 절대 콜 배정 불가',
        '• 규칙 빌더 설정 오류가 발생해도 시스템 가드가 2차로 의사 직통 배정 강제',
        '• 의료법 및 원내 임상 지침 100% 준수'
      ],
      color: COLORS.ROSE
    },
    {
      title: '🔄 3중 데이터 회복 탄력성',
      sub: 'Triple Data Resilience',
      items: [
        '• 1단계: Cloud PostgreSQL (Neon DB) 실시간 동기화',
        '• 2단계: Google Sheets 자동 수집 파이프라인 (1분 주기 폴링)',
        '• 3단계: LocalStorage 브라우저 오프라인 캐시 자동 백업',
        '• 병원 네트워크 단절 시에도 현장 무중단 100% 가동'
      ],
      color: COLORS.BLUE_PRIMARY
    },
    {
      title: '🔐 강력한 권한 관리 (RBAC)',
      sub: 'Security & Access Control',
      items: [
        '• 비밀번호 SHA-256 단방향 암호화 저장',
        '• 최고 관리자(SUPER_ADMIN) 전용 승인 시스템 (미승인자 로그인 차단)',
        '• 9개 관리자 탭별 세부 접근 권한 체크박스 제어',
        '• 무단 당직표 변조 및 개인정보 유출 원천 차단'
      ],
      color: COLORS.EMERALD
    }
  ];

  pillars.forEach((p, idx) => {
    const x = 0.8 + idx * 3.95;
    const y = 1.5;

    // Outer Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 3.75, h: 5.4,
      fill: { color: COLORS.TEXT_WHITE },
      line: { color: p.color, width: 2 },
      rectRadius: 0.15
    });

    // Header Box
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 3.75, h: 0.75,
      fill: { color: p.color }
    });
    slide.addText(p.title, {
      x, y: y + 0.1, w: 3.75, h: 0.3,
      fontSize: 12, fontFace: 'Malgun Gothic', bold: true, align: 'center',
      color: COLORS.TEXT_WHITE
    });
    slide.addText(p.sub, {
      x, y: y + 0.42, w: 3.75, h: 0.22,
      fontSize: 9, fontFace: 'Arial', align: 'center',
      color: 'E2E8F0'
    });

    // Content List
    slide.addText(p.items.join('\n\n'), {
      x: x + 0.2, y: y + 1.0, w: 3.35, h: 4.1,
      fontSize: 10.5, fontFace: 'Malgun Gothic',
      color: COLORS.TEXT_DARK, lineSpacing: 16
    });
  });

  slide.addNotes(
    '병원 시스템에서 가장 중요한 것은 안전과 신뢰성입니다. 만약 관리자가 규칙을 잘못 입력하더라도 업무마스터의 안전 가드가 동작하여 의료 처치가 간호사에게 잘못 배정되는 일을 원천 차단합니다. 또한 3중 데이터 구조로 원내 인터넷이 끊겨도 오프라인 캐시를 통해 시스템이 정상 가동됩니다.'
  );
}

// =========================================================================
// SLIDE 9: Expected Impact (AS-IS vs TO-BE)
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.BG_LIGHT };
  addSlideHeader(slide, '시스템 도입 성과 및 기대 효과 (AS-IS vs TO-BE)', 'Expected Impact & Business Value', '09 / 10');

  // Comparison Table
  const tableData = [
    [
      { text: '비교 지표', options: { bold: true, fill: { color: COLORS.NAVY_DARK }, color: COLORS.TEXT_WHITE, fontSize: 11, align: 'center' } },
      { text: '기존 현장 (AS-IS)', options: { bold: true, fill: { color: COLORS.NAVY_DARK }, color: COLORS.TEXT_WHITE, fontSize: 11, align: 'center' } },
      { text: '시스템 도입 후 (TO-BE)', options: { bold: true, fill: { color: COLORS.NAVY_DARK }, color: COLORS.TEXT_WHITE, fontSize: 11, align: 'center' } },
      { text: '개선 성과', options: { bold: true, fill: { color: COLORS.NAVY_DARK }, color: COLORS.TEXT_WHITE, fontSize: 11, align: 'center' } }
    ],
    [
      { text: '당직자 확인 소요 시간', options: { bold: true, fontSize: 10 } },
      { text: '평균 2 ~ 3분 소요\n(종이 당직표/엑셀 수기 대조)', options: { fontSize: 10, color: COLORS.TEXT_MUTED } },
      { text: '평균 1 ~ 3초 완료\n(원클릭 조건 선택 즉시 출력)', options: { fontSize: 10, bold: true, color: COLORS.BLUE_PRIMARY } },
      { text: '⏱️ 95% 이상 단축\n(처치 골든타임 확보)', options: { fontSize: 10, bold: true, color: COLORS.EMERALD } }
    ],
    [
      { text: '오콜(Wrong Call) 발생', options: { bold: true, fontSize: 10 } },
      { text: '월 평균 30~40건 빈발\n(비당직의 수면 방해/갈등)', options: { fontSize: 10, color: COLORS.TEXT_MUTED } },
      { text: '0건에 수렴\n(알고리즘 기반 강제 매칭)', options: { fontSize: 10, bold: true, color: COLORS.BLUE_PRIMARY } },
      { text: '🚫 오콜 제로화 달성\n(의료진 피로도 대폭 경감)', options: { fontSize: 10, bold: true, color: COLORS.EMERALD } }
    ],
    [
      { text: '당직 변경 반영 속도', options: { bold: true, fontSize: 10 } },
      { text: '수시간 ~ 반나절 소요\n(구두 전파 및 출력물 누락)', options: { fontSize: 10, color: COLORS.TEXT_MUTED } },
      { text: '1분 주기 자동 동기화\n(구글 시트 수정 즉시 반영)', options: { fontSize: 10, bold: true, color: COLORS.BLUE_PRIMARY } },
      { text: '⚡ 실시간성 확보\n(연락 두절 사고 원천 방지)', options: { fontSize: 10, bold: true, color: COLORS.EMERALD } }
    ],
    [
      { text: '전담간호사 업무 분계', options: { bold: true, fontSize: 10 } },
      { text: '병동별 임의 판단으로\n간호-의사 간 마찰 빈발', options: { fontSize: 10, color: COLORS.TEXT_MUTED } },
      { text: '업무마스터 규격화\n(지원 가능 여부 자동 판정)', options: { fontSize: 10, bold: true, color: COLORS.BLUE_PRIMARY } },
      { text: '🤝 부서 간 신뢰 구축\n(표준 임상 프로세스 정착)', options: { fontSize: 10, bold: true, color: COLORS.EMERALD } }
    ]
  ];

  slide.addTable(tableData, {
    x: 0.8, y: 1.5, w: 11.5, h: 4.5,
    colW: [2.2, 3.1, 3.1, 3.1],
    border: { pt: 1, color: COLORS.CARD_BORDER },
    fill: { color: COLORS.TEXT_WHITE }
  });

  // Bottom Summary Badge
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 6.25, w: 11.5, h: 0.65,
    fill: { color: COLORS.EMERALD_BG },
    line: { color: COLORS.EMERALD, width: 1.5 },
    rectRadius: 0.1
  });
  slide.addText('🌟 최종 결론: 단순한 연락처 조회를 넘어, 병원 내 불필요한 소통 마찰을 없애고 환자 안전을 지키는 스마트 임상 인프라 구축!', {
    x: 1.0, y: 6.35, w: 11.1, h: 0.45,
    fontSize: 11.5, fontFace: 'Malgun Gothic', bold: true, align: 'center',
    color: COLORS.EMERALD
  });

  slide.addNotes(
    '도입 성과는 명확합니다. 당직자 확인 시간을 95% 줄였고, 비당직의에게 전화가 걸려오던 오콜 문제를 제로화했습니다. 무엇보다 간호부와 인턴 의국 간의 가장 큰 갈등 요인이었던 "누가 이 처치를 해야 하는가"를 시스템적으로 투명하게 해결했습니다.'
  );
}

// =========================================================================
// SLIDE 10: Future Roadmap & Q&A
// =========================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.NAVY_DARK };

  // Category Tag
  slide.addText('NEXT STEPS & CONCLUSION', {
    x: 1.0, y: 0.8, w: 10.0, h: 0.3,
    fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.CYAN_ACCENT
  });

  // Slide Title
  slide.addText('향후 발전 로드맵 및 질의응답 (Q&A)', {
    x: 1.0, y: 1.15, w: 10.0, h: 0.6,
    fontSize: 26, fontFace: 'Malgun Gothic', bold: true,
    color: COLORS.TEXT_WHITE
  });

  // 3 Roadmap Cards
  const roadmap = [
    {
      step: 'PHASE 1',
      title: '원내 EMR & 메신저 연동',
      desc: '• 원내 전자의무기록(EMR) 내 콜 버튼 임베딩\n• DUMC 모바일 톡 앱 직접 푸시 알림 연동\n• 환자 정보 연동을 통한 호출 사유 자동 전송',
      color: COLORS.BLUE_PRIMARY
    },
    {
      step: 'PHASE 2',
      title: '모바일 PWA 웹앱 고도화',
      desc: '• 별도 앱스토어 설치 없는 홈 화면 추가 (PWA)\n• 스마트폰 화면 최적화 반응형 레이아웃 강화\n• 생체인증(지문/Face ID) 간편 로그인 탑재',
      color: COLORS.CYAN_ACCENT
    },
    {
      step: 'PHASE 3',
      title: 'AI 당직 트래픽 통계 분석',
      desc: '• 병동별 / 시간대별 호출 빈도 통계 대시보드\n• 전담간호사 vs 당직의 업무 부하 분석 리포트\n• 적정 당직 인력 배치를 위한 의사결정 데이터 제공',
      color: COLORS.TEAL_ACCENT
    }
  ];

  roadmap.forEach((r, idx) => {
    const x = 1.0 + idx * 3.8;
    const y = 2.0;

    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 3.5, h: 3.6,
      fill: { color: COLORS.NAVY_MEDIUM },
      line: { color: r.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addText(r.step, {
      x: x + 0.3, y: y + 0.25, w: 2.9, h: 0.25,
      fontSize: 11, fontFace: 'Malgun Gothic', bold: true,
      color: r.color
    });

    slide.addText(r.title, {
      x: x + 0.3, y: y + 0.55, w: 2.9, h: 0.45,
      fontSize: 14, fontFace: 'Malgun Gothic', bold: true,
      color: COLORS.TEXT_WHITE
    });

    slide.addText(r.desc, {
      x: x + 0.3, y: y + 1.2, w: 2.9, h: 2.1,
      fontSize: 10.5, fontFace: 'Malgun Gothic',
      color: 'CBD5E1', lineSpacing: 17
    });
  });

  // Q&A Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 5.9, w: 11.1, h: 0.9,
    fill: { color: COLORS.BLUE_PRIMARY, transparency: 20 },
    line: { color: COLORS.CYAN_ACCENT, width: 1.5 },
    rectRadius: 0.12
  });

  slide.addText('경청해 주셔서 대단히 감사합니다. 질의응답을 진행하도록 하겠습니다.', {
    x: 1.2, y: 6.05, w: 10.7, h: 0.35,
    fontSize: 14, fontFace: 'Malgun Gothic', bold: true, align: 'center',
    color: COLORS.TEXT_WHITE
  });
  slide.addText('Q&A / 피드백 및 논의 사항', {
    x: 1.2, y: 6.4, w: 10.7, h: 0.3,
    fontSize: 11, fontFace: 'Malgun Gothic', align: 'center',
    color: COLORS.CYAN_ACCENT
  });

  slide.addNotes(
    '향후 원내 EMR 및 메신저 연동, 모바일 PWA 앱 고도화, 호출 통계 대시보드 구축까지 단계적으로 추진할 예정입니다. 지금까지 경청해 주셔서 감사합니다. 질문이나 의견이 있으시면 말씀해 주시기 바랍니다.'
  );
}

// Generate the PPTX File
const outputPath = path.resolve(process.cwd(), '스마트_병원_당직_콜_라우팅_시스템_발표자료.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(fileName => {
    console.log(`SUCCESS: Presentation created successfully at: ${fileName}`);
  })
  .catch(err => {
    console.error('ERROR creating presentation:', err);
    process.exit(1);
  });
