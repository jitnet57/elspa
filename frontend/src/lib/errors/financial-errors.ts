/**
 * 📌 Financial Error Types & Handlers
 * 📋 목적: 에러 타입 정의 및 사용자 메시지 매핑
 * 🔧 포함: 에러 코드, 필드 에러, 사용자 메시지
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_DATE_RANGE'
  | 'BUDGET_EXCEEDED'
  | 'INVALID_MONTH'
  | 'INVALID_YEAR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface FieldError {
  field: string;
  message: string;
}

export interface FinancialError {
  code: ErrorCode;
  message: string;
  detail?: string;
  fieldErrors?: Record<string, string>;
  timestamp?: string;
}

export class FinancialErrorHandler {
  static parseError(error: any): FinancialError {
    // API 에러 응답
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;

      if (typeof detail === 'object') {
        return {
          code: (detail.error_code as ErrorCode) || 'UNKNOWN_ERROR',
          message: detail.error_message || 'Unknown error',
          detail: detail.detail,
          fieldErrors: detail.field_errors,
          timestamp: detail.timestamp,
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: detail,
      };
    }

    // 네트워크 에러
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        detail: 'Please check your internet connection',
      };
    }

    // 기본 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred',
    };
  }

  static getFieldErrorMessage(fieldErrors: Record<string, string> | undefined): Record<string, string> {
    if (!fieldErrors) return {};

    const mapped: Record<string, string> = {};
    Object.entries(fieldErrors).forEach(([field, msg]) => {
      mapped[field] = this.translateFieldError(field, msg);
    });

    return mapped;
  }

  private static translateFieldError(field: string, message: string): string {
    const translations: Record<string, string> = {
      'category_id': '유효한 카테고리를 선택하세요',
      'amount': '금액은 0보다 커야 합니다',
      'expense_date': '유효한 지출 날짜를 선택하세요',
      'description': '설명은 500자 이하여야 합니다',
      'year': '연도는 2000 이상이어야 합니다',
      'month': '월은 1~12 사이여야 합니다',
      'target_revenue': '목표 매출은 0 이상이어야 합니다',
      'expense_limit': '지출 한도는 0 이상이어야 합니다',
    };

    return translations[field] || message;
  }

  static getUserMessage(error: FinancialError): string {
    const messages: Record<ErrorCode, string> = {
      'VALIDATION_ERROR': '입력 값을 확인하세요',
      'PERMISSION_DENIED': '이 작업을 수행할 권한이 없습니다',
      'RESOURCE_NOT_FOUND': '요청한 리소스를 찾을 수 없습니다',
      'INVALID_DATE_RANGE': '시작 날짜는 종료 날짜보다 이전이어야 합니다',
      'BUDGET_EXCEEDED': '예산을 초과했습니다',
      'INVALID_MONTH': '유효한 월을 선택하세요',
      'INVALID_YEAR': '유효한 연도를 선택하세요',
      'NETWORK_ERROR': '네트워크 연결을 확인하세요',
      'UNKNOWN_ERROR': '알 수 없는 오류가 발생했습니다',
    };

    return messages[error.code] || error.message;
  }
}
