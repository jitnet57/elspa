/**
 * ============================================================
 * 📌 파일명: excel-import-examples.ts
 * 📋 목적: ExcelImportAPI 클라이언트 사용 예제 모음
 * 🔧 기능: 다양한 시나리오별 사용법 및 패턴
 * 📤 반환값: 예제 함수들
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 실제 프로젝트에서 이 코드를 복사하여 사용하세요
 * ============================================================
 */

import {
  fetchSupportedTablesUtil,
  parseExcelFileUtil,
  validateMappingUtil,
  executeImportUtil,
  bulkExecuteImportUtil,
  ImportTableName,
  ExcelImportError,
  RetryOptions,
} from './excel-import-client';

/**
 * ============================================================
 * 📌 예제 1: 기본 임포트 워크플로우
 * 📋 목적: 파일 선택 → 파싱 → 검증 → 임포트
 * ============================================================
 */

/**
 * 📌 함수: basicImportFlow
 * 📋 목적: 기본 임포트 워크플로우 예제
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 */
export async function basicImportFlow(
  file: File,
  tableName: ImportTableName
): Promise<void> {
  try {
    console.log('1️⃣ 파일 파싱 시작...');
    const parseResult = await parseExcelFileUtil(file, tableName);

    console.log(`✅ 파싱 완료: ${parseResult.headers.length}개 컬럼, ${parseResult.total_rows}개 행`);
    console.log('컬럼:', parseResult.headers);
    console.log('샘플 데이터:', parseResult.sample_data[0]);

    // 추천 매핑 사용
    const mapping = parseResult.suggested_mapping;

    console.log('2️⃣ 매핑 검증 시작...');
    const validationResult = await validateMappingUtil(file, tableName, mapping);

    if (!validationResult.is_valid) {
      console.error('❌ 검증 실패:');
      validationResult.errors.forEach((err) => {
        console.error(`  행 ${err.row_number}: ${err.column} - ${err.error_message}`);
      });
      return;
    }

    console.log(`✅ 검증 완료: ${validationResult.preview_data.length}개 샘플 데이터`);

    console.log('3️⃣ 임포트 시작...');
    const statistics = await executeImportUtil(
      file,
      tableName,
      mapping,
      (event) => {
        if (event.status === 'success') {
          console.log(`✓ 행 ${event.row_number} 임포트 완료`);
        } else {
          console.warn(`✗ 행 ${event.row_number} 실패: ${event.message}`);
        }
      }
    );

    console.log(`✅ 임포트 완료:`);
    console.log(`  성공: ${statistics.success_count}/${statistics.total_rows}`);
    console.log(`  실패: ${statistics.failed_count}`);
    console.log(`  스킵: ${statistics.skipped_count}`);
    console.log(`  소요시간: ${statistics.execution_time_seconds}초`);
  } catch (error) {
    if (error instanceof ExcelImportError) {
      console.error(`❌ 오류 [${error.code}]: ${error.message}`);
      console.error('상세:', error.details);
    } else {
      console.error('❌ 예상치 못한 오류:', error);
    }
  }
}

/**
 * ============================================================
 * 📌 예제 2: 재시도 로직 포함 임포트
 * 📋 목적: 네트워크 오류 시 자동 재시도
 * ============================================================
 */

/**
 * 📌 함수: importWithRetry
 * 📋 목적: 재시도 로직이 포함된 임포트
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 최대 5회 재시도, 초기 2초 대기, 2배 증가
 */
export async function importWithRetry(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>
): Promise<void> {
  const retryOptions: RetryOptions = {
    maxAttempts: 5,
    delayMs: 2000,
    backoffMultiplier: 2,
  };

  try {
    console.log('⏳ 재시도 로직이 활성화된 임포트 시작...');

    const statistics = await executeImportUtil(
      file,
      tableName,
      mapping,
      (event) => {
        console.log(
          `행 ${event.row_number}: ${event.status === 'success' ? '✓' : '✗'} ${event.message}`
        );
      },
      { retryOptions }
    );

    console.log(`✅ 임포트 성공: ${statistics.success_count}/${statistics.total_rows}`);
  } catch (error) {
    if (error instanceof ExcelImportError) {
      console.error(`❌ 최종 실패 [${error.code}]: ${error.message}`);
    } else {
      console.error('❌ 오류:', error);
    }
  }
}

/**
 * ============================================================
 * 📌 예제 3: 일괄 임포트 (여러 파일)
 * 📋 목적: 여러 파일 순차 임포트
 * ============================================================
 */

/**
 * 📌 함수: batchImportExample
 * 📋 목적: 여러 파일 순차 임포트 예제
 * 🔧 매개변수:
 *    - files: {file: File, tableName: ImportTableName, mapping: Record<string, string>}[]
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 */
export async function batchImportExample(
  files: Array<{
    file: File;
    tableName: ImportTableName;
    mapping: Record<string, string>;
  }>
): Promise<void> {
  try {
    console.log(`🚀 ${files.length}개 파일 일괄 임포트 시작...`);

    const results = await bulkExecuteImportUtil(
      files,
      (event) => {
        const fileIdx = event.fileIndex;
        console.log(
          `[파일 ${fileIdx}] 행 ${event.row_number}: ${event.status === 'success' ? '✓' : '✗'}`
        );
      },
      { skipErrors: true } // 에러 발생 시에도 계속 진행
    );

    console.log('\n📊 일괄 임포트 결과:');
    results.forEach((stats, idx) => {
      console.log(`파일 ${idx}:`);
      console.log(`  성공: ${stats.success_count}/${stats.total_rows}`);
      console.log(`  실패: ${stats.failed_count}`);
      console.log(`  소요시간: ${stats.execution_time_seconds}초`);
    });

    // 전체 통계 계산
    const totalStats = {
      totalRows: results.reduce((sum, r) => sum + r.total_rows, 0),
      totalSuccess: results.reduce((sum, r) => sum + r.success_count, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed_count, 0),
    };

    console.log('\n📈 전체 통계:');
    console.log(`  총 행 수: ${totalStats.totalRows}`);
    console.log(`  성공: ${totalStats.totalSuccess}`);
    console.log(`  실패: ${totalStats.totalFailed}`);
    console.log(`  성공률: ${((totalStats.totalSuccess / totalStats.totalRows) * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ 일괄 임포트 오류:', error);
  }
}

/**
 * ============================================================
 * 📌 예제 4: 지원되는 테이블 조회
 * 📋 목적: 임포트 가능한 테이블과 컬럼 정보 확인
 * ============================================================
 */

/**
 * 📌 함수: displaySupportedTables
 * 📋 목적: 지원되는 테이블 정보 출력
 * 🔧 매개변수: (없음)
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 */
export async function displaySupportedTables(): Promise<void> {
  try {
    console.log('📚 지원되는 테이블 조회 중...');

    const response = await fetchSupportedTablesUtil();

    console.log(`✅ ${response.total_count}개 테이블 발견:\n`);

    response.tables.forEach((table) => {
      console.log(`📋 테이블: ${table.name} (${table.display_name})`);
      console.log(`   설명: ${table.description}`);
      console.log(`   컬럼:`);

      table.fields.forEach((field) => {
        const required = field.required ? '[필수]' : '[선택]';
        const type = `(${field.type})`;
        console.log(`     - ${field.name}: ${type} ${required}`);

        if (field.description) {
          console.log(`       설명: ${field.description}`);
        }

        if (field.values?.length) {
          console.log(`       허용값: ${field.values.join(', ')}`);
        }
      });

      console.log();
    });
  } catch (error) {
    console.error('❌ 테이블 조회 실패:', error);
  }
}

/**
 * ============================================================
 * 📌 예제 5: 에러 처리 및 복구
 * 📋 목적: 다양한 에러 상황 처리
 * ============================================================
 */

/**
 * 📌 함수: advancedErrorHandling
 * 📋 목적: 상세한 에러 처리 예제
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 */
export async function advancedErrorHandling(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>
): Promise<void> {
  try {
    console.log('🔍 상세 에러 처리 예제...');

    const statistics = await executeImportUtil(
      file,
      tableName,
      mapping,
      (event) => {
        if (event.status === 'failed' && event.errors) {
          console.warn(`⚠️ 행 ${event.row_number} 에러:`);
          Object.entries(event.errors).forEach(([column, error]) => {
            console.warn(`   ${column}: ${error}`);
          });
        }
      }
    );

    // 부분 성공 처리
    if (statistics.failed_count > 0) {
      console.warn(
        `⚠️ ${statistics.failed_count}개 행 실패 (${(
          (statistics.failed_count / statistics.total_rows) *
          100
        ).toFixed(1)}%)`
      );

      // 실패 원인 분석
      statistics.errors.forEach((err, idx) => {
        if (idx < 5) {
          // 처음 5개만 표시
          console.warn(`  ${idx + 1}. ${JSON.stringify(err)}`);
        }
      });

      if (statistics.errors.length > 5) {
        console.warn(`  ... 외 ${statistics.errors.length - 5}개 에러`);
      }
    }

    console.log('✅ 임포트 완료 (부분 성공)');
  } catch (error) {
    // 에러 타입별 처리
    if (error instanceof ExcelImportError) {
      switch (error.code) {
        case 'PARSE_ERROR':
          console.error('❌ 파일 포맷 오류: Excel 파일이 손상되었을 수 있습니다');
          break;

        case 'VALIDATION_ERROR':
          console.error('❌ 검증 오류: 컬럼 매핑을 다시 확인하세요');
          break;

        case 'HTTP_401':
          console.error('❌ 인증 오류: 로그인이 필요합니다');
          break;

        case 'HTTP_403':
          console.error('❌ 권한 오류: 이 작업을 수행할 권한이 없습니다');
          break;

        case 'HTTP_413':
          console.error('❌ 파일 크기 오류: 파일이 너무 큽니다 (최대 10MB)');
          break;

        default:
          console.error(`❌ API 오류 [${error.code}]: ${error.message}`);
      }

      if (error.details) {
        console.error('상세 정보:', error.details);
      }
    } else {
      console.error('❌ 예상치 못한 오류:', error);
    }
  }
}

/**
 * ============================================================
 * 📌 예제 6: 커스텀 재시도 전략
 * 📋 목적: 특정 에러에만 재시도
 * ============================================================
 */

/**
 * 📌 함수: selectiveRetry
 * 📋 목적: 특정 네트워크 에러만 재시도
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의:
 *    - 타임아웃 에러: 재시도 O
 *    - 검증 에러: 재시도 X
 *    - 권한 에러: 재시도 X
 */
export async function selectiveRetry(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>
): Promise<void> {
  const isRetryableError = (error: any): boolean => {
    // 네트워크 관련 에러만 재시도
    const retryableCodes = ['HTTP_408', 'HTTP_429', 'HTTP_500', 'HTTP_502', 'HTTP_503'];

    if (error instanceof ExcelImportError) {
      return retryableCodes.includes(error.code);
    }

    return false;
  };

  let lastError: Error | null = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`시도 ${attempt}/${maxAttempts}...`);

      const statistics = await executeImportUtil(file, tableName, mapping);

      console.log(`✅ 임포트 성공 (시도 ${attempt})`);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error)) {
        console.error(`❌ 재시도 불가능한 에러: ${lastError.message}`);
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.warn(`⏳ ${delay / 1000}초 후 재시도...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError) {
    console.error(`❌ 최종 실패 후 ${maxAttempts}회 재시도: ${lastError.message}`);
    throw lastError;
  }
}

/**
 * ============================================================
 * 📌 예제 7: 진행률 UI 업데이트
 * 📋 목적: 실시간 진행률을 UI에 반영
 * ============================================================
 */

/**
 * 📌 함수: importWithProgressBar
 * 📋 목적: 진행률 바를 업데이트하며 임포트
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 *    - onProgressUpdate: (progress: {current: number, total: number, percent: number}) => void
 * 📤 반환값: void
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 이 함수는 UI 업데이트를 위해 progress 콜백을 자주 호출합니다
 */
export async function importWithProgressBar(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>,
  onProgressUpdate?: (progress: { current: number; total: number; percent: number }) => void
): Promise<void> {
  try {
    let totalRows = 0;

    const statistics = await executeImportUtil(
      file,
      tableName,
      mapping,
      (event) => {
        if (totalRows === 0) {
          // 첫 이벤트에서 총 행 수 설정 (추정)
          totalRows = event.row_number * 10; // 추정값
        }

        const percent = (event.row_number / totalRows) * 100;

        onProgressUpdate?.({
          current: event.row_number,
          total: totalRows,
          percent: Math.min(percent, 100),
        });
      }
    );

    // 최종 진행률 업데이트 (100%)
    onProgressUpdate?.({
      current: statistics.total_rows,
      total: statistics.total_rows,
      percent: 100,
    });

    console.log(`✅ 완료: ${statistics.success_count}/${statistics.total_rows}`);
  } catch (error) {
    console.error('❌ 임포트 실패:', error);
  }
}
