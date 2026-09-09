import * as docx from 'docx';
import fs from 'fs';
import path from 'path';

const {
  Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, Header, Footer, PageNumber
} = docx;

// Color Constants
const COLOR_PRIMARY = '0284C7'; // Cyan/Blue
const COLOR_NAVY = '0F172A';    // Dark Navy
const COLOR_MUTED = '475569';   // Gray
const COLOR_BG_LIGHT = 'F1F5F9';// Light Slate
const COLOR_ACCENT = '0D9488';  // Teal
const COLOR_AMBER = 'D97706';   // Amber

function createTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    run: {
      font: 'Malgun Gothic',
      size: 44,
      bold: true,
      color: COLOR_NAVY
    }
  });
}

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    border: {
      bottom: { color: COLOR_PRIMARY, space: 6, style: BorderStyle.SINGLE, size: 12 }
    },
    run: {
      font: 'Malgun Gothic',
      size: 28,
      bold: true,
      color: COLOR_PRIMARY
    }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    run: {
      font: 'Malgun Gothic',
      size: 22,
      bold: true,
      color: COLOR_NAVY
    }
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    run: {
      font: 'Malgun Gothic',
      size: 18,
      bold: true,
      color: COLOR_ACCENT
    }
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    alignment: options.align || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        font: 'Malgun Gothic',
        size: options.size || 20, // 10pt
        color: options.color || (options.muted ? COLOR_MUTED : '1E293B'),
        bold: options.bold || false,
        italics: options.italics || false
      })
    ]
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix + ' ',
      font: 'Malgun Gothic',
      size: 20,
      bold: true,
      color: COLOR_NAVY
    }));
  }
  children.push(new TextRun({
    text: text,
    font: 'Malgun Gothic',
    size: 20,
    color: '334155'
  }));

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: children
  });
}

function createScriptBox(scriptText) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' }
            },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '🎙️ 발표자 대본 (Speaker Script):',
                    font: 'Malgun Gothic',
                    bold: true,
                    size: 20,
                    color: COLOR_PRIMARY
                  })
                ],
                spacing: { after: 80 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: scriptText,
                    font: 'Malgun Gothic',
                    size: 19,
                    color: '1E293B',
                    italics: false
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createMetaTable() {
  const cellStyle = {
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }
    }
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    spacing: { after: 300 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            ...cellStyle,
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [createParagraph('문서 제목', { bold: true, color: COLOR_NAVY })]
          }),
          new TableCell({
            ...cellStyle,
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [createParagraph('스마트 병원 당직 및 전담간호사 콜 라우팅 시스템 PPT 발표 자료 구성안', { bold: true })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            ...cellStyle,
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [createParagraph('목적 및 대상', { bold: true, color: COLOR_NAVY })]
          }),
          new TableCell({
            ...cellStyle,
            children: [createParagraph('원내 의료진, 간호부, 수련교육팀 대상 개발 성과 및 알고리즘 보고')]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            ...cellStyle,
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [createParagraph('슬라이드 수량', { bold: true, color: COLOR_NAVY })]
          }),
          new TableCell({
            ...cellStyle,
            children: [createParagraph('총 10개 슬라이드 (예상 소요 시간: 10~15분)')]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            ...cellStyle,
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            children: [createParagraph('연계 파일', { bold: true, color: COLOR_NAVY })]
          }),
          new TableCell({
            ...cellStyle,
            children: [createParagraph('스마트_병원_당직_콜_라우팅_시스템_발표자료.pptx')]
          })
        ]
      })
    ]
  });
}

// Build Document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Malgun Gothic', size: 20 }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              text: '스마트 병원 당직 및 전담간호사 콜 라우팅 시스템 · PPT 발표 자료 구성안',
              alignment: AlignmentType.RIGHT,
              run: { font: 'Malgun Gothic', size: 16, color: '94A3B8' }
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '- ', font: 'Malgun Gothic', size: 18, color: '94A3B8' }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Malgun Gothic', size: 18, color: '94A3B8' }),
                new TextRun({ text: ' -', font: 'Malgun Gothic', size: 18, color: '94A3B8' })
              ]
            })
          ]
        })
      },
      children: [
        // Cover Page
        createTitle('스마트 병원 당직 & 전담간호사\n콜 라우팅 시스템 발표 자료 구성안'),
        createParagraph('원클릭 당직 매칭 · 5단계 지능형 라우팅 엔진 · 실시간 동기화 플랫폼', { align: AlignmentType.CENTER, size: 24, color: COLOR_PRIMARY, bold: true }),
        createParagraph('슬라이드별 본문 기획, 레이아웃 가이드 및 전문 발표 대본(Script) 포함', { align: AlignmentType.CENTER, muted: true, size: 18 }),
        new Paragraph({ spacing: { after: 200 } }),

        createMetaTable(),

        createHeading1('목차 (Table of Contents)'),
        createBullet('Slide 1. 표지 (시스템 개요 및 6대 핵심 하이라이트)'),
        createBullet('Slide 2. 도입 배경 및 기존 병동 현장의 Pain Points (4대 문제점)'),
        createBullet('Slide 3. 시스템 아키텍처 및 듀얼 뷰(Dual View) 구조'),
        createBullet('Slide 4. [핵심] 5단계 지능형 연락 알고리즘 (Routing Pipeline)'),
        createBullet('Slide 5. 알고리즘 상세 비교: 내과계 vs 비내과계 매칭 규칙'),
        createBullet('Slide 6. 임상 간호사 중심의 사용자 화면 (User View) 핵심 기능'),
        createBullet('Slide 7. 운영자를 위한 관리자 화면 (Admin View) 9대 모듈'),
        createBullet('Slide 8. 시스템 신뢰성, 안전 가드 및 3중 데이터 보안 체계'),
        createBullet('Slide 9. 시스템 도입 성과 및 기대 효과 (AS-IS vs TO-BE 비교)'),
        createBullet('Slide 10. 향후 발전 로드맵 및 질의응답 (Q&A)'),
        createBullet('부록. 발표 현장 예상 질문 및 답변 가이드 (FAQ)'),
        new Paragraph({ spacing: { after: 300 } }),

        // Slide 1
        createHeading1('Slide 1. 표지 (Title Slide)'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('스마트 병원 당직 & 전담간호사 콜 라우팅 시스템', '슬라이드 제목:'),
        createBullet('환자 안전과 업무 효율을 위한 원클릭 당직 매칭 · 5단계 라우팅 엔진 · 실시간 동기화 플랫폼', '부제:'),
        createBullet('#오콜_방지  #5단계_라우팅_알고리즘  #원클릭_UCAP  #실시간_구글시트_연동', '핵심 태그:'),

        createHeading2('2. 슬라이드 본문 구성 내용'),
        createBullet('병원 공식 타이틀 및 시스템 명칭 강조'),
        createBullet('6대 하이라이트 배너: 5단계 지능형 연락 알고리즘, 평일/야간/휴일 자동 판정, 1초 원클릭 UCAP 다이얼, 업무마스터 안전 가드 탑재, 구글 시트 실시간 동기화, 9대 통합 관리자 모듈'),
        createBullet('발표 메타 정보: 개발 및 운영팀 보고 / 2026 시스템 구축 완료'),

        createHeading2('3. 시각화 가이드'),
        createParagraph('다크 네이비(0F172A) 배경에 발광 시안(06B6D4) 라인을 포인트로 배치하여 최첨단 스마트 병원 시스템의 신뢰감과 전문성을 전달합니다.'),
        new Paragraph({ spacing: { after: 100 } }),

        createScriptBox('"안녕하십니까, 오늘 발표를 맡은 개발팀입니다. 병동 간호 현장과 당직 의료진의 소통을 획기적으로 개선하고 오콜을 근본적으로 방지하기 위해 개발된 [스마트 병원 당직 및 전담간호사 콜 라우팅 시스템]의 개발 성과와 알고리즘, 주요 기능을 보고드리겠습니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 2
        createHeading1('Slide 2. 도입 배경 및 기존 현장의 Pain Points'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('도입 배경 및 기존 병동 현장의 Pain Points', '슬라이드 제목:'),
        createBullet('기존에는 시시각각 변하는 당직자와 전담간호사를 수기로 파악하느라 불필요한 시간 소모와 잦은 오콜이 발생했습니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용 (4대 핵심 문제점)'),
        createBullet('종이 당직표, 엑셀 출력물, 단체 메신저를 일일이 대조하여 당직의를 찾느라 환자 처치 골든타임 지연 (확인에 건당 2~3분 소요)', '1. 복잡한 수기 확인의 비효율:'),
        createBullet('진료과(내과/비내과), 병동군, 시간대(정규/이브닝/심야), 요일별로 담당자가 달라 휴식 중인 비당직의에게 잘못 전화가 걸리는 의료진 갈등 빈발', '2. 잦은 오콜(Wrong Call) 발생:'),
        createBullet('어떤 술기(채혈, L-tube, Foley 등)가 전담간호사 지원 대상인지, 수혈동의서는 누구에게 콜해야 하는지 병동별 기준 혼선', '3. 전담간호사 vs 의사 경계 모호:'),
        createBullet('연차, 대근, 스케줄 변경 발생 시 출력된 당직표에 즉시 반영되지 않아 과거 명단의 의사에게 연락 두절 발생', '4. 당직 스케줄 변경 전파 지연:'),

        createHeading2('3. 해결 목표 (Solution Target)'),
        createParagraph('진료계열 + 병동 + 요청업무 + 일시 선택 시 1초 만에 최적의 1순위 연락처와 백업 라인을 자동 도출하는 알고리즘 엔진 개발.'),
        new Paragraph({ spacing: { after: 100 } }),

        createScriptBox('"기존 병동 현장에서는 매일 저녁마다 오늘 내과 1번 당직이 누구인지, 이 술기는 전담간호사에게 해야 하는지 일일이 종이와 메신저를 대조해야 했습니다. 이로 인해 처치가 지연되고, 잘못 걸려온 전화로 비당직의의 수면이 방해받는 등 갈등이 컸습니다. 우리는 이 4대 문제를 알고리즘으로 해결하고자 했습니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 3
        createHeading1('Slide 3. 시스템 아키텍처 및 듀얼 뷰(Dual View) 구조'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('시스템 아키텍처 및 듀얼 뷰(Dual View) 구조', '슬라이드 제목:'),
        createBullet('임상 간호사를 위한 초간결 호출 화면과 운영자를 위한 9대 관리 모듈이 완벽히 결합된 웹 플랫폼입니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용'),
        createBullet('간호사용 초간결 4단계 호출 필터, 최우선 배정 히어로 카드, 원클릭 UCAP/휴대폰 다이얼 연동, DUMC 톡 ID 확인, 업무마스터 표준 가이드, 1/2순위 백업 연락처 안내', '임상 현장 화면 (User View):'),
        createBullet('월간 당직표 캘린더/그리드 편집기, 구글 시트 1분 자동 동기화, 엑셀 파싱 업로드, 20종 업무마스터, 노코드 규칙 빌더, 공통전담간호 매트릭스, RBAC 회원 승인 및 탭별 권한 제어', '운영 관리자 화면 (Admin View):'),
        createBullet('Google Sheets 실시간 수집 ⟷ Cloud PostgreSQL 백엔드 ⟷ LocalStorage 오프라인 보호 (네트워크 단절 시에도 100% 정상 작동)', '3중 데이터 신뢰성 체계:'),

        createScriptBox('"본 시스템은 간호사가 사용하는 임상 화면과 수련교육팀/간호부가 운영하는 관리자 화면으로 완벽히 분리되어 있습니다. 임상 화면은 1초 만에 UCAP을 걸 수 있도록 최적화되었으며, 관리자 화면은 9대 설정을 통해 병원 정책 변경을 코딩 없이 즉시 수용합니다. 또한 3중 데이터 구조로 병원 네트워크가 단절되어도 정상 작동합니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 4
        createHeading1('Slide 4. [핵심] 5단계 지능형 연락 알고리즘 (Routing Pipeline)'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('핵심 연락 알고리즘 (5단계 의사결정 파이프라인)', '슬라이드 제목:'),
        createBullet('단순한 표 조회가 아닌, 5단계 우선순위 검증을 거쳐 환자에게 가장 안전하고 정확한 의료진을 도출합니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용 (5단계 파이프라인)'),
        createBullet('대한민국 법정 공휴일/대체공휴일 실시간 판정, 평일 정규(08~17시), 이브닝(17~22시), 야간(22~08시), 자정 경계 교대 완벽 지원', 'Step 1. 환경 변수 판정:'),
        createBullet('관리자가 등록한 커스텀 규칙 최우선 평가 (우선순위 1~N 순차 검사, 일치 시 기본엔진 우회하여 강제 적용)', 'Step 2. 규칙 빌더(Rule Builder) 우선 매칭:'),
        createBullet('평일 06~08시 정규 EKG는 임상병리사 순환일정 자동 연결, 병동 내 CPR/응급약물 발생 시 전담간호사와 당직의 동시 호출', 'Step 3. 특수 직역 및 시간대 분기:'),
        createBullet('내과계(Group 1 vs 2 ➔ 개인 UCAP 연결) vs 비내과계(Group C vs D vs 지정 ➔ 공용 당직폰 연결), 상시 전담업무 배정', 'Step 4. 진료계열 및 병동군 기본 엔진:'),
        createBullet('전담지원 불가(N) 업무 검사 ➔ 간호사 배정 차단 및 의사 직통 강제 라우팅, 최종 연락처 매핑 및 1/2순위 백업 라인 산출', 'Step 5. 업무마스터 안전 가드:'),

        createScriptBox('"알고리즘의 심장인 evaluateDutyRules 함수는 5단계 파이프라인으로 작동합니다. 환경을 먼저 판정하고, 관리자의 긴급 규칙을 검사한 뒤, 특수 직역과 기본 엔진을 거쳐, 마지막으로 업무마스터 안전 가드를 통과해야만 최종 호출 대상이 결정됩니다. 이를 통해 어떤 예외 상황에서도 오콜을 100% 방지합니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 5
        createHeading1('Slide 5. 알고리즘 상세 비교: 내과계 vs 비내과계 매칭 규칙'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('알고리즘 상세 비교: 내과계 vs 비내과계 매칭 규칙', '슬라이드 제목:'),
        createBullet('내과의 개인 UCAP 체계와 비내과의 3대 공용 당직폰 체계의 차이점을 시스템이 완벽히 흡수하여 처리합니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용'),
        createBullet('Group 1(MICU, 42, 61, 62 등) ➔ 내과1(인턴1) / Group 2(71, 72, 81 등) ➔ 내과2(인턴2), 개인 UCAP 및 개인폰 실시간 매칭 원칙, 수혈동의서는 상시 인턴 전담, 평일 MICU ABGA는 인턴 / 일반병동은 공통전담, 야간(22~08시) Group 1은 당직전담, Group 2는 내과2 배정', '내과계 (Internal Medicine):'),
        createBullet('비내과 1(5-4080 / 지정병동, 응급수술 지원), 비내과 2(5-4081 / Group C 외과계, SICU 전담), 비내과 3(5-3499 / Group D 71~121병동 전담), 공용 당직폰 번호 우선 연결, 통합의학과 사망선언(비내과2), 주말 3단계 욕창 드레싱(비내과1), 일요일 비뇨기과 수술부위 드레싱(비내과1), 일요일 마취동의서(비내과1)', '비내과계 (Non-IM / 외과계):'),
        createBullet('말초정맥 채혈, Foley/Nelaton, L-tube, 배액관 및 Chemoport 관리 ➔ 진료과 및 시간대 무관 365일 24시간 공통전담간호사 상시 배정', '공통 상시 지원 업무:'),

        createScriptBox('"내과계와 비내과계는 병원 내 연락 체계가 근본적으로 다릅니다. 내과는 의사 개인 UCAP으로 걸어야 하고, 비내과는 3대의 공용 당직폰으로 걸어야 합니다. 또한 비내과는 일요일 마취동의서나 비뇨기과 드레싱 같은 독특한 예외 규칙들이 많은데, 알고리즘이 이를 자동으로 판별해 줍니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 6
        createHeading1('Slide 6. 임상 간호사 중심의 사용자 화면 (User View)'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('임상 간호사 중심의 사용자 화면 (User View)', '슬라이드 제목:'),
        createBullet('바쁜 간호 현장에서 단 3~4번의 터치만으로 오콜 없이 1초 만에 전화를 걸 수 있는 직관적 UI입니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용'),
        createBullet('1. 환자 진료계열 토글(내과/비내과) | 2. 요청 병동(⭐ 내 기본 병동 기억하기) | 3. 요청 업무 키워드 자동완성 검색 | 4. 호출 일시(현재 시간 1초 동기화)', '4단계 입력 패널:'),
        createBullet('알고리즘 배정 직역 및 실제 당직의 성명 표시, 초대형 원클릭 UCAP 다이얼 버튼, 개인폰/당직폰 바로걸기(tel: 연동), DUMC 톡 ID 확인 및 1초 복사', '최우선 호출 히어로 카드:'),
        createBullet('해당 처치에 대한 원내 표준 수행 지침, 인계 시 주의사항 실시간 표출', '업무마스터 임상 가이드 배너:'),
        createBullet('1순위 당직의 부재/통화중 시 즉시 걸 수 있는 1순위/2순위 백업 UCAP 직통 다이얼 제공', '부재 시 비상 백업 카드:'),

        createScriptBox('"사용자 화면은 임상 간호사의 시선에 맞추었습니다. 병동과 업무를 누르는 즉시, 중앙에 커다란 히어로 카드가 뜨며 UCAP 버튼을 누르면 즉시 전화가 걸립니다. 자주 쓰는 병동은 [내 병동]으로 브라우저에 저장되어 매번 병동을 다시 고를 필요가 없습니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 7
        createHeading1('Slide 7. 운영자를 위한 관리자 화면 (Admin View) 9대 모듈'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('운영자를 위한 관리자 화면 (Admin View) 9대 모듈', '슬라이드 제목:'),
        createBullet('병원 규정이나 스케줄이 내일 당장 바뀌더라도 코딩 한 줄 없이 1분 만에 대응하는 9대 서브시스템입니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용 (9대 관리 모듈)'),
        createBullet('1. 당직표 & 엑셀 업로드: 월간 캘린더/그리드 편집 및 병원 공식 엑셀 드래그 앤 드롭 업로드 자동 파싱'),
        createBullet('2. 구글 시트 실시간 연동: 의국 구글 스프레드시트 URL 1분 주기 백그라운드 자동 동기화 및 즉시 새로고침'),
        createBullet('3. 업무 마스터 설정: 20종 표준 업무 CRUD, 전담간호 지원 여부(Y/N), 시간대별 매칭 규격 제어'),
        createBullet('4. 규칙 빌더 (Rule Builder): 코딩 없는 조건부 동적 라우팅 규칙 생성, 우선순위 정렬 및 실시간 On/Off'),
        createBullet('5. 의료진 & 병리사 연락망: 인턴 16명 및 전공의 연락망 관리, EKG 임상병리사 순환일정 관리'),
        createBullet('6. 공통전담간호 매트릭스: 6개 병동군 3교대(Day/Eve/Night) 공식 근무표 및 포스트별 UCAP/공용폰 제어'),
        createBullet('7. 주요 핫라인 관리: 응급실(ER), 중환자실(MICU/SICU), 수술실(OR), 진단검사 등 긴급 다이얼'),
        createBullet('8. 사용자 및 권한 (RBAC): 최고관리자 승인제 회원가입, 9개 탭별 접근 권한 체크박스 제어 시스템'),
        createBullet('9. 데이터 백업 & 복원: 전체 설정 1클릭 JSON 파일 백업/복원 및 긴급 롤백/공장 초기화 지원'),

        createScriptBox('"단순히 고정된 시스템이 아닙니다. 구글 시트 연동을 통해 전공의 의국에서 엑셀 시트만 수정하면 1분 안에 병동 화면에 반영되며, 새로운 예외 규정이 생겨도 [규칙 빌더]를 통해 코딩 없이 바로 규칙을 추가할 수 있습니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 8
        createHeading1('Slide 8. 시스템 신뢰성, 안전 가드 및 3중 데이터 보안 체계'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('시스템 신뢰성, 안전 가드 및 3중 데이터 보안 체계', '슬라이드 제목:'),
        createBullet('의료 현장의 생명줄인 안전성, 무중단 가동성, 보안성을 3중으로 보장합니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용'),
        createBullet('수혈동의서, 기관절개관 교체 등 전담지원 불가(N) 업무는 관리자의 규칙 설정 오류가 있더라도 시스템 안전가드가 2차로 가로채어 반드시 의사에게만 콜이 가도록 강제 격리', '1. 업무마스터 안전 가드 (Fail-Safe Guard):'),
        createBullet('Cloud PostgreSQL(1차) ⟷ Google Sheets 자동 수집(2차) ⟷ LocalStorage 브라우저 오프라인 캐시(3차)로 병원 인터넷 장애 시에도 100% 무중단 가동', '2. 3중 데이터 회복 탄력성 (Triple Resilience):'),
        createBullet('비밀번호 단방향 SHA-256 암호화, 최고관리자 전용 승인 시스템(미승인자 차단), 9개 탭별 세부 RBAC 권한 분리로 무단 당직표 변조 방지', '3. 강력한 보안 및 접근 제어 (RBAC):'),

        createScriptBox('"의료 시스템에서 가장 중요한 것은 안전입니다. 관리자가 실수로 규칙을 잘못 입력하더라도 업무마스터의 안전 가드가 동작하여 의료 처치가 간호사에게 잘못 배정되는 일을 원천 차단합니다. 또한 병원 인터넷이 끊겨도 오프라인 캐시를 통해 시스템은 정상 작동합니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 9
        createHeading1('Slide 9. 시스템 도입 성과 및 기대 효과 (AS-IS vs TO-BE 비교)'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('시스템 도입 성과 및 기대 효과 (AS-IS vs TO-BE)', '슬라이드 제목:'),
        createBullet('당직 확인 시간을 95% 단축하고, 의료진 피로도의 주원인이었던 오콜을 제로화했습니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용 (AS-IS vs TO-BE 비교표)'),
        createBullet('기존 평균 2~3분 소요 ➔ 도입 후 평균 1~3초 완료 (95% 이상 단축, 처치 골든타임 확보)', '당직자 확인 소요 시간:'),
        createBullet('기존 월 30~40건 빈발 ➔ 도입 후 0건에 수렴 (알고리즘 기반 강제 매칭으로 오콜 제로화 달성)', '오콜(Wrong Call) 발생:'),
        createBullet('기존 수시간~반나절 소요 ➔ 도입 후 1분 주기 자동 동기화 (연락 두절 사고 원천 방지)', '당직 변경 반영 속도:'),
        createBullet('기존 병동별 임의 판단 마찰 ➔ 도입 후 업무마스터 규격화 (부서 간 신뢰 구축 및 표준 프로세스 정착)', '전담간호사 업무 분계:'),

        createScriptBox('"도입 성과는 명확합니다. 당직 확인 시간을 2~3분에서 3초로 줄였고, 비당직의에게 전화가 걸려오던 오콜 문제를 제로화했습니다. 무엇보다 간호부와 의국 간의 가장 큰 갈등 요인이었던 [누가 이 처치를 해야 하는가]를 시스템적으로 투명하게 해결했습니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Slide 10
        createHeading1('Slide 10. 향후 발전 로드맵 및 질의응답 (Q&A)'),
        createHeading2('1. 슬라이드 정보'),
        createBullet('향후 발전 로드맵 및 질의응답 (Q&A)', '슬라이드 제목:'),
        createBullet('원내 EMR 임베딩, 모바일 PWA 웹앱, AI 콜 통계 대시보드로 진화해 나갈 계획입니다.', '핵심 메시지:'),

        createHeading2('2. 슬라이드 본문 구성 내용 (3단계 고도화 로드맵)'),
        createBullet('원내 전자의무기록(EMR) 내 콜 버튼 임베딩, DUMC 모바일 톡 앱 직접 푸시 알림 연동, 환자 정보 연동을 통한 호출 사유 자동 전송', 'Phase 1. 원내 EMR & 메신저 직접 연동:'),
        createBullet('별도 앱스토어 설치 없는 홈 화면 추가(PWA), 스마트폰 화면 최적화 반응형 레이아웃 강화, 생체인증(지문/Face ID) 간편 로그인 탑재', 'Phase 2. 모바일 PWA 웹앱 고도화:'),
        createBullet('병동별/시간대별 호출 빈도 통계 대시보드, 전담간호사 vs 당직의 업무 부하 분석 리포트, 적정 당직 인력 배치를 위한 데이터 제공', 'Phase 3. AI 당직 트래픽 통계 분석:'),

        createScriptBox('"향후 원내 EMR 및 메신저 연동, 모바일 PWA 앱 고도화, 호출 통계 대시보드 구축까지 단계적으로 추진할 예정입니다. 지금까지 경청해 주셔서 대단히 감사합니다. 질문이나 의견이 있으시면 말씀해 주시기 바랍니다."'),
        new Paragraph({ spacing: { after: 240 } }),

        // Appendix: FAQ
        createHeading1('부록. 발표 현장 예상 질문 및 답변 가이드 (FAQ)'),
        createHeading2('Q1. 기존에 원내 메신저(DUMC 톡) 조직도나 전화번호부와 무엇이 다른가요?'),
        createParagraph('A. 원내 전화번호부는 "의사 A의 번호"만 알려주지만, 본 시스템은 "오늘 이 시간, 이 병동에서 수혈동의서를 받아야 할 의사가 누구인지"를 병원 규정, 당직표, 업무 규칙을 조합하여 실시간으로 정확히 판별해 준다는 점에서 차원이 다릅니다.'),

        createHeading2('Q2. 인턴 의국에서 당직 스케줄이 갑자기 바뀌면 어떻게 반영하나요?'),
        createParagraph('A. 의국 담당자가 평소 사용하시던 구글 스프레드시트의 이름만 수정하시면 됩니다. 시스템이 1분마다 백그라운드에서 변경 사항을 자동 감지하여 병동 화면에 실시간으로 반영합니다. 긴급한 경우 관리자 화면에서 엑셀 업로드나 캘린더 직접 수정도 가능합니다.'),

        createHeading2('Q3. 병원 전산망이 일시적으로 끊기면 시스템을 쓸 수 없나요?'),
        createParagraph('A. 문제없이 사용 가능합니다. 시스템은 3중 데이터 보존 구조로 설계되어 있어, 네트워크가 일시 단절되더라도 브라우저 로컬 캐시(LocalStorage)에 저장된 최신 데이터를 바탕으로 오프라인 상태에서도 완벽히 정상 가동됩니다.'),

        createHeading2('Q4. 규정상 간호사가 해서는 안 되는 처치가 전담간호사에게 잘못 배정될 위험은 없나요?'),
        createParagraph('A. 원천적으로 불가능합니다. 시스템에 내장된 [업무마스터 안전 가드(Fail-Safe Guard)]가 작동하여, 수혈동의서나 T-tube 교체 등 전담지원 불가(N)로 지정된 업무는 관리자가 규칙을 잘못 설정하더라도 강제로 의사 직통으로만 연결되도록 프로그래밍되어 있습니다.')
      ]
    }
  ]
});

// Save to file
const outputPath = path.resolve(process.cwd(), '스마트_병원_당직_콜_라우팅_시스템_PPT발표자료_구성안.docx');
docx.Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`SUCCESS: Word document created successfully at: ${outputPath}`);
}).catch(err => {
  console.error('ERROR creating Word document:', err);
  process.exit(1);
});
