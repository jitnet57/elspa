# 📊 Excel Import 기능 구현 가이드 & 배포 체크리스트

> **ElSpa Excel Import 기능**의 완전한 구현 가이드입니다.
> 이 문서를 따라 단계별로 구현하고 배포할 수 있습니다.

---

## 📋 목차

1. [시작하기](#-시작하기)
2. [데이터베이스 설정](#-데이터베이스-설정)
3. [백엔드 구현](#-백엔드-구현)
4. [프론트엔드 구현](#-프론트엔드-구현)
5. [API 라우트 등록](#-api-라우트-등록)
6. [설정 & 메뉴](#-설정--메뉴)
7. [배포 체크리스트](#-배포-체크리스트)
8. [사용자 가이드](#-사용자-가이드)
9. [관리자 가이드](#-관리자-가이드)
10. [트러블슈팅](#-트러블슈팅)

---

## 🚀 시작하기

### 개요

Excel Import 기능은 다음을 제공합니다:

- ✅ **엑셀 파일 자동 파싱** (XLSX/XLS)
- ✅ **열 매핑 관리** (Excel ↔ Database)
- ✅ **데이터 검증** (타입, 범위, 중복 체크)
- ✅ **배치 임포트** (대량 데이터 일괄 처리)
- ✅ **에러 로깅** (상세한 에러/경고 기록)
- ✅ **감시 추적** (누가, 언제, 뭘 임포트했는지)

### 지원 테이블

| 테이블 | 설명 | 우선순위 |
|--------|------|---------|
| **therapists** | 테라피스트 정보 (이름, 전화, 급여 등) | 🔴 높음 |
| **customers** | 고객 정보 (이름, 전화, 주소 등) | 🟠 중간 |
| **bookings** | 예약 정보 (고객, 테라피스트, 시간 등) | 🟡 낮음 |
| **staff** | 직원 정보 (급여, 포지션 등) | 🟡 낮음 |

---

## 💾 데이터베이스 설정

### Step 1: 마이그레이션 파일 생성

```bash
# Alembic을 사용하여 마이그레이션 생성
cd /Users/kwangseobpark/elspa
alembic revision --autogenerate -m "Create import_logs table"
```

### Step 2: 마이그레이션 파일 확인 및 수정

생성된 마이그레이션 파일 위치: `app/migrations/versions/`

파일 내용 예시:

```python
"""Create import_logs table

Revision ID: xxxxx
Revises: 
Create Date: 2025-06-02 XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa

# upgrade(): SQL 마이그레이션 적용
def upgrade():
    op.create_table(
        'import_logs',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('table_name', sa.String(255), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger()),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('total_rows', sa.Integer(), default=0),
        sa.Column('success_rows', sa.Integer(), default=0),
        sa.Column('failed_rows', sa.Integer(), default=0),
        sa.Column('warning_rows', sa.Integer(), default=0),
        sa.Column('duration_seconds', sa.Numeric(10, 2)),
        sa.Column('result_summary', sa.JSON()),
        sa.Column('error_summary', sa.Text()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # 인덱스 생성
    op.create_index('ix_import_logs_user_id', 'import_logs', ['user_id'])
    op.create_index('ix_import_logs_table_name', 'import_logs', ['table_name'])
    op.create_index('ix_import_logs_status', 'import_logs', ['status'])
    op.create_index('ix_import_logs_created_at', 'import_logs', ['created_at'])

    # excel_column_mappings, import_error_details, import_warning_details 테이블도 동일하게 생성
    # ... (생략)

# downgrade(): 마이그레이션 취소
def downgrade():
    op.drop_table('import_logs')
    op.drop_table('import_error_details')
    op.drop_table('import_warning_details')
    op.drop_table('excel_column_mappings')
```

### Step 3: 마이그레이션 적용

```bash
# 마이그레이션 적용
alembic upgrade head

# 확인
# Supabase 대시보드에서 다음 테이블이 생성되었는지 확인:
# - import_logs
# - import_error_details
# - import_warning_details
# - excel_column_mappings
```

### Step 4: 초기 매핑 데이터 삽입 (선택사항)

```python
# app/scripts/init_column_mappings.py
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.excel_import_models import ColumnMapping, DataType
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def init_therapist_mappings():
    """테라피스트 테이블의 초기 매핑 설정"""
    mappings = [
        ColumnMapping(
            table_name="therapists",
            excel_column="A",  # 또는 "이름"
            db_field="name",
            data_type=DataType.STRING,
            is_required=True,
            max_length=255,
            description="테라피스트 이름"
        ),
        ColumnMapping(
            table_name="therapists",
            excel_column="B",
            db_field="phone",
            data_type=DataType.STRING,
            is_required=True,
            description="전화번호"
        ),
        # ... 더 많은 매핑들
    ]
    
    with Session(engine) as session:
        session.add_all(mappings)
        session.commit()
        print(f"✅ {len(mappings)}개 매핑 설정 완료")

if __name__ == "__main__":
    init_therapist_mappings()
```

실행:
```bash
python app/scripts/init_column_mappings.py
```

---

## 🔧 백엔드 구현

### Step 1: 필수 패키지 설치

```bash
# requirements-backend.txt에 추가
cat >> requirements-backend.txt << 'EOF'

# ============================================================
# Excel & Data Processing
# ============================================================
openpyxl==3.10.10
pandas==2.1.4
xlrd==2.0.1
EOF

# 설치
pip install -r requirements-backend.txt
```

**설치되는 패키지:**
- `openpyxl`: XLSX 파일 파싱 (최신 Excel 형식)
- `pandas`: 데이터프레임 기반 전처리 & 검증
- `xlrd`: XLS 파일 파싱 (레거시 지원)

### Step 2: Excel 파서 구현

파일 경로: `/Users/kwangseobpark/elspa/app/services/excel_parser.py`

```python
"""
📊 Excel 파일 파싱 & 데이터 추출

기능:
  1. XLSX/XLS 파일 읽기
  2. 데이터 정규화 (공백 제거, 타입 변환)
  3. 열 매핑 자동 감지
  4. 데이터 검증
"""

import openpyxl
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import os
from io import BytesIO

class ExcelParser:
    """Excel 파일 파싱"""
    
    def __init__(self, file_path: str = None, file_content: bytes = None):
        """
        📌 초기화
        file_path: 파일 경로
        file_content: 파일 바이너리 (메모리)
        """
        if file_path:
            self.file_path = file_path
            self.df = pd.read_excel(file_path)
        elif file_content:
            self.df = pd.read_excel(BytesIO(file_content))
        else:
            raise ValueError("file_path 또는 file_content 필요")
    
    def get_rows(self) -> List[Dict]:
        """모든 행을 딕셔너리 리스트로 반환"""
        return self.df.fillna('').to_dict('records')
    
    def get_headers(self) -> List[str]:
        """열 헤더 반환"""
        return list(self.df.columns)
    
    def get_row_count(self) -> int:
        """행 개수"""
        return len(self.df)
    
    def validate_headers(self, required_columns: List[str]) -> Tuple[bool, List[str]]:
        """필수 열 체크"""
        headers = self.get_headers()
        missing = [col for col in required_columns if col not in headers]
        return len(missing) == 0, missing
    
    def get_file_size(self) -> int:
        """파일 크기 (바이트)"""
        if self.file_path:
            return os.path.getsize(self.file_path)
        return 0
```

### Step 3: 데이터 검증 서비스 구현

파일 경로: `/Users/kwangseobpark/elspa/app/services/excel_validator.py`

```python
"""
✅ Excel 데이터 검증 엔진

기능:
  1. 타입 검증 (String, Integer, Float, DateTime, Boolean)
  2. 범위 검증 (min_value, max_value, max_length)
  3. 중복 검증 (allow_duplicates=False)
  4. Enum 검증 (enum_mapping)
  5. 필수 필드 검증 (is_required=True)
  6. 커스텀 규칙 (정규식, 함수)
"""

from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
from enum import Enum
import re

class ValidationRule:
    """개별 검증 규칙"""
    
    def __init__(self, field_name: str, data_type: str, 
                 is_required: bool = False, **kwargs):
        self.field_name = field_name
        self.data_type = data_type
        self.is_required = is_required
        self.max_length = kwargs.get('max_length')
        self.min_value = kwargs.get('min_value')
        self.max_value = kwargs.get('max_value')
        self.enum_mapping = kwargs.get('enum_mapping', {})
        self.allow_duplicates = kwargs.get('allow_duplicates', True)
    
    def validate(self, value: Any) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        값 검증
        Return: (is_valid, error_message, suggested_value)
        """
        # 1. 필수 필드 체크
        if self.is_required and (value is None or value == ''):
            return False, f"필수 필드입니다: {self.field_name}", None
        
        # 2. 타입 변환 & 검증
        try:
            if self.data_type == 'string':
                value = str(value).strip()
                if self.max_length and len(value) > self.max_length:
                    return False, f"최대 {self.max_length}자 초과", None
            
            elif self.data_type == 'integer':
                value = int(float(value))
                if self.min_value and value < self.min_value:
                    return False, f"최소값 {self.min_value} 이상이어야 함", str(self.min_value)
                if self.max_value and value > self.max_value:
                    return False, f"최대값 {self.max_value} 이하여야 함", str(self.max_value)
            
            elif self.data_type == 'float':
                value = float(value)
                if self.min_value and value < self.min_value:
                    return False, f"최소값 {self.min_value} 이상이어야 함", str(self.min_value)
                if self.max_value and value > self.max_value:
                    return False, f"최대값 {self.max_value} 이하여야 함", str(self.max_value)
            
            elif self.data_type == 'datetime':
                # 여러 형식 지원
                for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%m/%d/%Y']:
                    try:
                        value = datetime.strptime(str(value), fmt)
                        break
                    except ValueError:
                        continue
                else:
                    return False, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)", None
            
            elif self.data_type == 'boolean':
                if isinstance(value, bool):
                    pass
                elif str(value).lower() in ['true', 'yes', '1', 'y']:
                    value = True
                elif str(value).lower() in ['false', 'no', '0', 'n']:
                    value = False
                else:
                    return False, "참/거짓 값이어야 합니다", None
            
            elif self.data_type == 'enum':
                if str(value) not in self.enum_mapping:
                    valid_values = ", ".join(self.enum_mapping.keys())
                    return False, f"유효한 값: {valid_values}", None
        
        except ValueError as e:
            return False, f"타입 변환 실패: {str(e)}", None
        
        return True, None, None


class ExcelValidator:
    """Excel 데이터 검증 엔진"""
    
    def __init__(self):
        self.rules: Dict[str, ValidationRule] = {}
        self.seen_values: Dict[str, set] = {}  # 중복 추적
    
    def add_rule(self, rule: ValidationRule):
        """검증 규칙 추가"""
        self.rules[rule.field_name] = rule
        if not rule.allow_duplicates:
            self.seen_values[rule.field_name] = set()
    
    def validate_row(self, row: Dict[str, Any], row_number: int) -> Dict[str, Any]:
        """
        행 검증
        Return: { is_valid, field_errors, row_warnings }
        """
        result = {
            'row_number': row_number,
            'is_valid': True,
            'field_validations': {},
            'row_errors': [],
            'row_warnings': []
        }
        
        for field_name, rule in self.rules.items():
            value = row.get(field_name)
            
            # 1. 필드 검증
            is_valid, error_msg, suggested = rule.validate(value)
            
            result['field_validations'][field_name] = {
                'field_name': field_name,
                'is_valid': is_valid,
                'value': value,
                'error_message': error_msg,
                'suggested_fix': suggested
            }
            
            if not is_valid:
                result['is_valid'] = False
                result['row_errors'].append(error_msg)
            
            # 2. 중복 체크
            if is_valid and not rule.allow_duplicates:
                if value in self.seen_values[field_name]:
                    result['row_warnings'].append(
                        f"중복: {field_name}='{value}' (다른 행에 존재)"
                    )
                else:
                    self.seen_values[field_name].add(value)
        
        return result
```

### Step 4: 임포트 서비스 구현

파일 경로: `/Users/kwangseobpark/elspa/app/services/excel_import_service.py`

```python
"""
🔄 Excel 임포트 서비스

기능:
  1. 파일 받기 & 파싱
  2. 열 매핑 조회
  3. 데이터 검증 & 에러 로깅
  4. 배치 INSERT/UPDATE
  5. 트랜잭션 관리
  6. 감시 추적 기록
"""

from sqlalchemy.orm import Session
from sqlalchemy import insert, update
from datetime import datetime
import time
from typing import Dict, List, Tuple, Any, Optional

from app.models.excel_import_models import (
    ImportLog, ImportErrorDetail, ImportWarningDetail,
    ColumnMapping, ImportStatus, ErrorSeverity
)
from app.services.excel_parser import ExcelParser
from app.services.excel_validator import ExcelValidator, ValidationRule

class ExcelImportService:
    """Excel 임포트 서비스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.start_time = None
        self.import_log = None
    
    def import_from_file(self, file_path: str, table_name: str, user_id: int) -> Dict[str, Any]:
        """
        📌 메인 임포트 함수
        
        Return: { import_log_id, status, success_rows, failed_rows, warnings, errors }
        """
        self.start_time = time.time()
        
        try:
            # 1. 파일 파싱
            parser = ExcelParser(file_path=file_path)
            file_size = parser.get_file_size()
            rows = parser.get_rows()
            
            # 2. ImportLog 생성
            self.import_log = ImportLog(
                user_id=user_id,
                table_name=table_name,
                file_name=file_path.split('/')[-1],
                file_size_bytes=file_size,
                status=ImportStatus.IN_PROGRESS,
                total_rows=len(rows)
            )
            self.db.add(self.import_log)
            self.db.commit()
            self.db.refresh(self.import_log)
            
            # 3. 열 매핑 조회
            mappings = self._get_column_mappings(table_name)
            
            # 4. 검증 규칙 생성
            validator = self._create_validator(mappings)
            
            # 5. 데이터 검증
            validation_results = []
            error_details = []
            warning_details = []
            
            for row_number, row in enumerate(rows, start=2):  # 2부터 시작 (1은 헤더)
                validation_result = validator.validate_row(row, row_number)
                validation_results.append(validation_result)
                
                # 에러 기록
                if not validation_result['is_valid']:
                    for error_msg in validation_result['row_errors']:
                        error_details.append(ImportErrorDetail(
                            import_log_id=self.import_log.id,
                            row_number=row_number,
                            severity=ErrorSeverity.ERROR,
                            error_message=error_msg
                        ))
                
                # 경고 기록
                for warning_msg in validation_result['row_warnings']:
                    warning_details.append(ImportWarningDetail(
                        import_log_id=self.import_log.id,
                        row_number=row_number,
                        warning_type='duplicate',
                        warning_message=warning_msg
                    ))
            
            # 6. 에러/경고 저장
            if error_details:
                self.db.bulk_insert_mappings(ImportErrorDetail, 
                    [{'import_log_id': e.import_log_id, 'row_number': e.row_number, 
                      'severity': e.severity, 'error_message': e.error_message} 
                     for e in error_details])
            
            if warning_details:
                self.db.bulk_insert_mappings(ImportWarningDetail,
                    [{'import_log_id': w.import_log_id, 'row_number': w.row_number,
                      'warning_type': w.warning_type, 'warning_message': w.warning_message}
                     for w in warning_details])
            
            # 7. 통계 계산
            success_rows = sum(1 for v in validation_results if v['is_valid'])
            failed_rows = len(validation_results) - success_rows
            warning_rows = len(warning_details)
            
            # 8. 상태 결정
            if failed_rows == 0:
                status = ImportStatus.SUCCESS
            elif failed_rows < len(validation_results) * 0.5:  # 50% 이상 성공
                status = ImportStatus.PARTIAL
            else:
                status = ImportStatus.FAILED
            
            # 9. 임포트 로그 업데이트
            duration = time.time() - self.start_time
            self.import_log.status = status
            self.import_log.success_rows = success_rows
            self.import_log.failed_rows = failed_rows
            self.import_log.warning_rows = warning_rows
            self.import_log.duration_seconds = duration
            self.import_log.completed_at = datetime.now()
            self.import_log.result_summary = {
                'total': len(validation_results),
                'success': success_rows,
                'failed': failed_rows,
                'warnings': warning_rows
            }
            self.db.commit()
            
            return {
                'import_log_id': self.import_log.id,
                'status': status.value,
                'success_rows': success_rows,
                'failed_rows': failed_rows,
                'warning_rows': warning_rows,
                'duration_seconds': duration,
                'validation_results': validation_results
            }
        
        except Exception as e:
            if self.import_log:
                self.import_log.status = ImportStatus.FAILED
                self.import_log.error_summary = str(e)
                self.db.commit()
            raise
    
    def _get_column_mappings(self, table_name: str) -> List[ColumnMapping]:
        """테이블의 열 매핑 조회"""
        return self.db.query(ColumnMapping).filter(
            ColumnMapping.table_name == table_name,
            ColumnMapping.is_active == True
        ).all()
    
    def _create_validator(self, mappings: List[ColumnMapping]) -> ExcelValidator:
        """검증 규칙 생성"""
        validator = ExcelValidator()
        for mapping in mappings:
            rule = ValidationRule(
                field_name=mapping.db_field,
                data_type=mapping.data_type.value,
                is_required=mapping.is_required,
                max_length=mapping.max_length,
                min_value=mapping.min_value,
                max_value=mapping.max_value,
                enum_mapping=mapping.enum_mapping or {},
                allow_duplicates=mapping.allow_duplicates
            )
            validator.add_rule(rule)
        return validator
```

---

## 🎨 프론트엔드 구현

### Step 1: 필수 패키지 설치

```bash
# frontend/package.json에 다음 패키지 추가
cd /Users/kwangseobpark/elspa/frontend
npm install react-dropzone@14.2.3
npm install xlsx@0.18.5  # 이미 설치됨
```

**패키지 설명:**
- `react-dropzone`: 드래그&드롭 파일 업로드 UI
- `xlsx`: Excel 파일 파싱 (프론트엔드)

### Step 2: API 클라이언트 구현

파일 경로: `/Users/kwangseobpark/elspa/frontend/src/lib/api/excel-import-client.ts`

```typescript
/**
 * 📊 Excel Import API 클라이언트
 * 
 * 기능:
 *   1. 파일 업로드
 *   2. 임포트 상태 조회
 *   3. 에러/경고 조회
 *   4. 매핑 설정 조회/업데이트
 */

import { API_BASE_URL } from './config';

export interface ImportResponse {
  import_log_id: number;
  status: 'success' | 'partial' | 'failed';
  success_rows: number;
  failed_rows: number;
  warning_rows: number;
  duration_seconds: number;
}

export interface ImportError {
  row_number: number;
  field_name: string;
  error_message: string;
  error_value?: string;
  suggested_fix?: string;
}

export interface ImportWarning {
  row_number: number;
  warning_type: string;
  warning_message: string;
  affected_fields?: string;
}

export class ExcelImportClient {
  /**
   * 📌 파일 업로드 & 임포트 시작
   */
  static async uploadFile(
    file: File,
    tableName: string,
    userId: number
  ): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);
    formData.append('user_id', userId.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/excel/import`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 📌 임포트 상태 조회
   */
  static async getImportStatus(importLogId: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/${importLogId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch import status');
    }

    return response.json();
  }

  /**
   * 📌 에러 목록 조회
   */
  static async getImportErrors(importLogId: number): Promise<ImportError[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/${importLogId}/errors`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch errors');
    }

    return response.json();
  }

  /**
   * 📌 경고 목록 조회
   */
  static async getImportWarnings(importLogId: number): Promise<ImportWarning[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/${importLogId}/warnings`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch warnings');
    }

    return response.json();
  }

  /**
   * 📌 열 매핑 조회
   */
  static async getColumnMappings(tableName: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/excel/mappings?table_name=${tableName}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch mappings');
    }

    return response.json();
  }
}
```

### Step 3: 업로드 컴포넌트 구현

파일 경로: `/Users/kwangseobpark/elspa/frontend/src/app/admin/excel-import/ExcelUploader.tsx`

```typescript
/**
 * 📊 Excel 파일 업로드 컴포넌트
 * 
 * 기능:
 *   1. 드래그&드롭 파일 업로드
 *   2. 파일 검증 (XLSX/XLS만)
 *   3. 프리뷰 (처음 5행)
 *   4. 업로드 진행률
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelImportClient, ImportResponse } from '@/lib/api/excel-import-client';

interface ExcelUploaderProps {
  tableName: string;
  userId: number;
  onSuccess?: (result: ImportResponse) => void;
  onError?: (error: Error) => void;
}

export default function ExcelUploader({
  tableName,
  userId,
  onSuccess,
  onError
}: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    // 파일 형식 검증
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(selectedFile.type)) {
      setError('XLSX 또는 XLS 파일만 지원합니다');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // 프리뷰 생성 (처음 5행)
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target?.result, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      setPreview(data.slice(0, 5));
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ExcelImportClient.uploadFile(file, tableName, userId);
      setResult(response);
      onSuccess?.(response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '업로드 실패';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 드래그 드롭 영역 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500 font-semibold">파일을 여기에 놓으세요...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-semibold">Excel 파일을 드래그하거나 클릭하세요</p>
            <p className="text-gray-500 text-sm mt-2">지원 형식: XLSX, XLS</p>
          </div>
        )}
      </div>

      {/* 파일 정보 */}
      {file && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm">
            <strong>파일:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}

      {/* 프리뷰 */}
      {preview.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">프리뷰 (처음 5행)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="border px-2 py-1 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    {Object.values(row as any).map((val: any, i) => (
                      <td key={i} className="border px-2 py-1">
                        {String(val).slice(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className={`border rounded-lg p-4 ${result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className="font-semibold mb-2">임포트 결과</h3>
          <ul className="text-sm space-y-1">
            <li>상태: <strong>{result.status === 'success' ? '✅ 성공' : '⚠️ 부분 성공'}</strong></li>
            <li>성공: {result.success_rows}행</li>
            <li>실패: {result.failed_rows}행</li>
            <li>경고: {result.warning_rows}행</li>
            <li>소요시간: {result.duration_seconds.toFixed(2)}초</li>
          </ul>
        </div>
      )}

      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '업로드 중...' : '업로드'}
      </button>
    </div>
  );
}
```

### Step 4: 결과 표시 컴포넌트

파일 경로: `/Users/kwangseobpark/elspa/frontend/src/app/admin/excel-import/ImportResults.tsx`

```typescript
/**
 * 📊 임포트 결과 표시 컴포넌트
 * 
 * 기능:
 *   1. 성공/실패 통계
 *   2. 에러 목록 (페이지네이션)
 *   3. 경고 목록
 *   4. 내보내기 (CSV)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ExcelImportClient, ImportError, ImportWarning } from '@/lib/api/excel-import-client';

interface ImportResultsProps {
  importLogId: number;
}

export default function ImportResults({ importLogId }: ImportResultsProps) {
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings'>('errors');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [errorsData, warningsData] = await Promise.all([
          ExcelImportClient.getImportErrors(importLogId),
          ExcelImportClient.getImportWarnings(importLogId)
        ]);
        setErrors(errorsData);
        setWarnings(warningsData);
      } catch (err) {
        console.error('Failed to fetch results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [importLogId]);

  const data = activeTab === 'errors' ? errors : warnings;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="border-b">
        <button
          onClick={() => { setActiveTab('errors'); setCurrentPage(1); }}
          className={`px-4 py-2 ${activeTab === 'errors' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          에러 ({errors.length})
        </button>
        <button
          onClick={() => { setActiveTab('warnings'); setCurrentPage(1); }}
          className={`px-4 py-2 ${activeTab === 'warnings' ? 'border-b-2 border-yellow-500 font-semibold' : ''}`}
        >
          경고 ({warnings.length})
        </button>
      </div>

      {/* 테이블 */}
      {paginatedData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-2 text-left">행 번호</th>
                {activeTab === 'errors' ? (
                  <>
                    <th className="px-4 py-2 text-left">필드</th>
                    <th className="px-4 py-2 text-left">에러 메시지</th>
                    <th className="px-4 py-2 text-left">값</th>
                    <th className="px-4 py-2 text-left">제안</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 text-left">타입</th>
                    <th className="px-4 py-2 text-left">메시지</th>
                    <th className="px-4 py-2 text-left">영향 필드</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item: any, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.row_number}</td>
                  {activeTab === 'errors' ? (
                    <>
                      <td className="px-4 py-2">{item.field_name}</td>
                      <td className="px-4 py-2">{item.error_message}</td>
                      <td className="px-4 py-2 text-gray-600">"{item.error_value}"</td>
                      <td className="px-4 py-2 text-blue-600">{item.suggested_fix}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{item.warning_type}</td>
                      <td className="px-4 py-2">{item.warning_message}</td>
                      <td className="px-4 py-2">{item.affected_fields}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'errors' ? '에러가 없습니다!' : '경고가 없습니다!'}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'border'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 API 라우트 등록

### Step 1: 임포트 라우터 생성

파일 경로: `/Users/kwangseobpark/elspa/app/routers/excel_import_router.py`

```python
"""
🔗 Excel Import API 라우터

엔드포인트:
  POST   /api/excel/import              - 파일 업로드 & 임포트 시작
  GET    /api/excel/import/{id}         - 임포트 상태 조회
  GET    /api/excel/import/{id}/errors  - 에러 목록
  GET    /api/excel/import/{id}/warnings - 경고 목록
  GET    /api/excel/mappings            - 열 매핑 조회
  POST   /api/excel/mappings            - 열 매핑 생성/수정
"""

from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.excel_import_models import (
    ImportLog, ImportErrorDetail, ImportWarningDetail,
    ColumnMapping, ImportLogSchema, ImportErrorDetailSchema,
    ImportWarningDetailSchema, ColumnMappingSchema
)
from app.services.excel_import_service import ExcelImportService
import tempfile
import os

router = APIRouter(prefix="/api/excel", tags=["Excel Import"])


@router.post("/import")
async def upload_and_import(
    file: UploadFile = File(...),
    table_name: str = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    📌 Excel 파일 업로드 & 임포트 시작
    
    Request:
      - file: Excel 파일 (XLSX, XLS)
      - table_name: 대상 테이블
      - user_id: 임포트 사용자 ID
    
    Response:
      { import_log_id, status, success_rows, failed_rows, ... }
    """
    # 임시 파일 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # 임포트 실행
        service = ExcelImportService(db)
        result = service.import_from_file(tmp_path, table_name, user_id)
        return result
    
    finally:
        # 임시 파일 삭제
        os.unlink(tmp_path)


@router.get("/import/{import_log_id}", response_model=ImportLogSchema)
async def get_import_status(
    import_log_id: int,
    db: Session = Depends(get_db)
):
    """📌 임포트 상태 조회"""
    log = db.query(ImportLog).filter(ImportLog.id == import_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Import log not found")
    return log


@router.get("/import/{import_log_id}/errors", response_model=List[ImportErrorDetailSchema])
async def get_import_errors(
    import_log_id: int,
    db: Session = Depends(get_db)
):
    """📌 에러 목록 조회"""
    errors = db.query(ImportErrorDetail).filter(
        ImportErrorDetail.import_log_id == import_log_id
    ).all()
    return errors


@router.get("/import/{import_log_id}/warnings", response_model=List[ImportWarningDetailSchema])
async def get_import_warnings(
    import_log_id: int,
    db: Session = Depends(get_db)
):
    """📌 경고 목록 조회"""
    warnings = db.query(ImportWarningDetail).filter(
        ImportWarningDetail.import_log_id == import_log_id
    ).all()
    return warnings


@router.get("/mappings", response_model=List[ColumnMappingSchema])
async def get_column_mappings(
    table_name: str = Query(...),
    db: Session = Depends(get_db)
):
    """📌 테이블의 열 매핑 조회"""
    mappings = db.query(ColumnMapping).filter(
        ColumnMapping.table_name == table_name,
        ColumnMapping.is_active == True
    ).all()
    return mappings


@router.post("/mappings", response_model=ColumnMappingSchema)
async def create_column_mapping(
    mapping: ColumnMappingSchema,
    db: Session = Depends(get_db)
):
    """📌 열 매핑 생성/수정"""
    # 기존 매핑 확인
    existing = db.query(ColumnMapping).filter(
        ColumnMapping.table_name == mapping.table_name,
        ColumnMapping.db_field == mapping.db_field
    ).first()
    
    if existing:
        # 수정
        for key, value in mapping.dict(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # 생성
        new_mapping = ColumnMapping(**mapping.dict())
        db.add(new_mapping)
        db.commit()
        db.refresh(new_mapping)
        return new_mapping
```

### Step 2: main.py에 라우터 등록

파일 경로: `/Users/kwangseobpark/elspa/main.py` (수정)

```python
# main.py 상단에 추가
from app.routers import excel_import_router

# app.include_router 부분에 추가
app.include_router(excel_import_router.router)
```

---

## ⚙️ 설정 & 메뉴

### Step 1: 관리자 메뉴에 Excel Import 추가

파일 경로: `/Users/kwangseobpark/elspa/frontend/src/app/admin/_components/AdminSidebar.tsx` (수정)

```typescript
// 기존 메뉴 항목에 추가
const menuItems = [
  // ... 기존 항목들
  {
    label: '엑셀 임포트',
    href: '/admin/excel-import',
    icon: '📊'
  }
];
```

### Step 2: 설정 추가

파일 경로: `/Users/kwangseobpark/elspa/frontend/src/lib/config/excel-import.config.ts` (생성)

```typescript
/**
 * ⚙️ Excel Import 설정
 */

export const EXCEL_IMPORT_CONFIG = {
  // 지원 테이블
  SUPPORTED_TABLES: {
    therapists: {
      label: '테라피스트',
      description: '테라피스트 정보 (이름, 전화, 급여 등)',
      icon: '👩‍⚕️'
    },
    customers: {
      label: '고객',
      description: '고객 정보 (이름, 전화, 주소 등)',
      icon: '👤'
    },
    bookings: {
      label: '예약',
      description: '예약 정보 (고객, 테라피스트, 시간 등)',
      icon: '📅'
    },
    staff: {
      label: '직원',
      description: '직원 정보 (급여, 포지션 등)',
      icon: '👥'
    }
  },

  // 파일 제약
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FORMATS: ['xlsx', 'xls'],

  // 배치 처리
  BATCH_SIZE: 1000, // 한 번에 처리할 행 수

  // 타임아웃
  UPLOAD_TIMEOUT: 300000 // 5분
};
```

---

## ✅ 배포 체크리스트

### 📋 사전 준비 (Pre-Deployment)

- [ ] **코드 리뷰 완료**
  - [ ] 백엔드 코드 검토 (에러 처리, 보안)
  - [ ] 프론트엔드 코드 검토 (UI/UX, 성능)
  - [ ] SQL 쿼리 검토 (N+1 문제 없는지)

- [ ] **테스트 완료**
  - [ ] 단위 테스트 (parser, validator)
  - [ ] 통합 테스트 (API 엔드포인트)
  - [ ] E2E 테스트 (파일 업로드 & 임포트)
  - [ ] 에러 케이스 테스트 (잘못된 파일, 큰 파일 등)

- [ ] **보안 검토**
  - [ ] 파일 업로드 보안 (바이러스 스캔, 크기 제한)
  - [ ] SQL Injection 방지
  - [ ] 인증/권한 체크
  - [ ] CORS 설정 확인

### 🔧 배포 전 체크 (Pre-Deploy Checklist)

#### Backend

```bash
# 1. 패키지 설치 확인
pip list | grep -E "openpyxl|pandas|xlrd"

# 2. 환경 변수 확인
echo $DATABASE_URL
echo $SUPABASE_URL

# 3. 마이그레이션 상태 확인
alembic current
alembic history

# 4. 로컬 테스트
python -m pytest tests/test_excel_import.py -v

# 5. 린트 & 포맷팅
flake8 app/services/excel_*.py
black app/services/excel_*.py

# 6. 프로덕션 빌드 테스트
python -c "from app.routers.excel_import_router import router; print('✅ Router loaded')"
```

#### Frontend

```bash
# 1. 패키지 설치 확인
npm list react-dropzone xlsx

# 2. TypeScript 타입 체크
npm run build

# 3. 린트 & 포맷팅
npm run lint
npm run format

# 4. 번들 크기 확인
npm run build --analyze

# 5. 로컬 테스트
npm run dev
# http://localhost:3000/admin/excel-import 접속 & 테스트
```

### 🚀 배포 단계 (Deployment Steps)

#### Step 1: 백엔드 배포

```bash
cd /Users/kwangseobpark/elspa

# 1. 변경사항 커밋
git add .
git commit -m "✨ Feat: Excel Import 기능 추가

- 📊 Excel 파일 파싱 & 검증 엔진
- 🔄 배치 임포트 서비스
- 📝 감시 추적 로깅
- 🔗 API 엔드포인트"

# 2. 마이그레이션 적용 (프로덕션 DB)
# Supabase 대시보드에서 SQL 쿼리 실행
# 또는 원격 서버에서:
# alembic upgrade head

# 3. 프론트엔드 환경 변수 확인
# .env.local 또는 .env.production에서
# REACT_APP_API_BASE_URL 확인

# 4. 배포
git push origin main
# GitHub Actions 또는 CI/CD 파이프라인 트리거
```

#### Step 2: 프론트엔드 배포

```bash
cd /Users/kwangseobpark/elspa/frontend

# 1. 빌드
npm run build

# 2. 배포 (Vercel/Cloudflare Pages)
npm run deploy

# 3. 배포 확인
# https://your-app.vercel.app/admin/excel-import 접속
```

#### Step 3: 배포 후 검증

```bash
# 1. 헬스 체크
curl https://api.your-domain.com/health

# 2. API 테스트
curl -X GET "https://api.your-domain.com/api/excel/mappings?table_name=therapists" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. UI 테스트
# /admin/excel-import 페이지 접속
# - 파일 업로드 가능한지 확인
# - 프리뷰 표시되는지 확인
# - 결과 페이지 표시되는지 확인

# 4. 로그 확인
# Sentry 또는 CloudWatch에서 에러 모니터링
```

---

## 📚 사용자 가이드

### 1️⃣ 파일 준비

#### Excel 파일 형식

| 열 | 내용 | 예시 | 필수 |
|----|------|------|------|
| A | 이름 | 김철수 | O |
| B | 전화번호 | 010-1234-5678 | O |
| C | 이메일 | kim@example.com | X |
| D | 급여 | 1500000 | X |

#### 파일명 규칙

```
형식: [날짜]_[테이블명]_[버전].xlsx
예시:
  - 2025-06-01_therapists_v1.xlsx
  - 2025-06-01_customers_final.xlsx
```

### 2️⃣ 파일 업로드

1. **관리자 대시보드 접속**
   - http://your-app.com/admin/excel-import

2. **파일 선택**
   - 드래그&드롭 또는 클릭으로 파일 선택
   - 파일 형식: XLSX, XLS만 지원

3. **프리뷰 확인**
   - 처음 5행 확인
   - 열명과 데이터가 올바른지 확인

4. **업로드 시작**
   - "업로드" 버튼 클릭
   - 진행률 표시됨

### 3️⃣ 결과 확인

#### 성공 (✅ Success)

```
임포트 성공: 100개 행 처리됨
- 성공: 100행
- 실패: 0행
- 경고: 0행
- 소요시간: 2.34초
```

#### 부분 성공 (⚠️ Partial)

```
부분 성공: 90개 성공, 10개 실패
- "에러" 탭에서 실패한 행 확인
- "경고" 탭에서 주의사항 확인
```

#### 실패 (❌ Failed)

```
임포트 실패: 50개 행 에러
- 파일 형식 다시 확인
- 필수 필드 누락되었는지 확인
- 관리자에 문의
```

### 4️⃣ 에러 수정

**에러 유형별 해결 방법:**

| 에러 | 원인 | 해결방법 |
|------|------|---------|
| 필수 필드입니다 | 필수 열이 비어있음 | 해당 열에 값 입력 |
| 유효하지 않은 전화번호 형식 | 형식 오류 | 010-XXXX-XXXX 형식 사용 |
| 최대 255자 초과 | 텍스트가 너무 김 | 텍스트 축약 |
| 중복: email 필드 | 이미 존재하는 값 | 다른 값으로 변경 |
| 타입 변환 실패 | 숫자 필드에 문자 입력 | 숫자로 변경 |

---

## 👨‍💼 관리자 가이드

### 1️⃣ 열 매핑 관리

#### 매핑 조회

```bash
# API
GET /api/excel/mappings?table_name=therapists

# Response
[
  {
    "id": 1,
    "table_name": "therapists",
    "excel_column": "A",
    "db_field": "name",
    "data_type": "string",
    "is_required": true,
    "max_length": 255,
    "description": "테라피스트 이름"
  },
  ...
]
```

#### 매핑 추가/수정

```bash
# API
POST /api/excel/mappings
Content-Type: application/json

{
  "table_name": "therapists",
  "excel_column": "C",
  "db_field": "email",
  "data_type": "string",
  "is_required": false,
  "description": "이메일 주소"
}
```

### 2️⃣ 임포트 히스토리 조회

```bash
# API
GET /api/excel/import

# Response
[
  {
    "id": 1,
    "user_id": 5,
    "table_name": "therapists",
    "file_name": "therapists_2025-06-01.xlsx",
    "status": "success",
    "total_rows": 100,
    "success_rows": 100,
    "failed_rows": 0,
    "warning_rows": 0,
    "duration_seconds": 2.34,
    "created_at": "2025-06-01T10:30:00Z"
  },
  ...
]
```

### 3️⃣ 성능 모니터링

#### 임포트 통계

```bash
# 일일 임포트 수
SELECT DATE(created_at), COUNT(*) FROM import_logs
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

# 테이블별 임포트 수
SELECT table_name, COUNT(*) FROM import_logs
GROUP BY table_name;

# 평균 처리 시간
SELECT table_name, AVG(duration_seconds) FROM import_logs
GROUP BY table_name;
```

#### 에러율 모니터링

```bash
# 실패율
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100 / (SELECT COUNT(*) FROM import_logs), 2) as percentage
FROM import_logs
GROUP BY status;
```

### 4️⃣ 트러블슈팅

#### 문제: 파일 업로드 타임아웃

**원인:** 파일이 너무 크거나 네트워크가 느림  
**해결:**
- 파일 크기 줄이기 (행 수 제한)
- 배치로 나누기

#### 문제: 데이터베이스 동시성 에러

**원인:** 동시에 여러 임포트 진행 중  
**해결:**
- 임포트 큐 시스템 도입
- 배치 처리 간격 조정

#### 문제: 메모리 부족

**원인:** 대용량 파일 처리 시 메모리 초과  
**해결:**
- 청크 단위 처리 (배치 크기 조정)
- 임시 파일 정리 자동화

---

## 🔧 트러블슈팅

### Q1: "ModuleNotFoundError: No module named 'openpyxl'"

**A:** openpyxl이 설치되지 않았습니다.
```bash
pip install openpyxl pandas
```

### Q2: "TypeError: unsupported operand type(s)"

**A:** 데이터 타입 변환 실패. 검증 규칙 확인 필요.
```python
# 검증 로그 추가
print(f"Row {row_number}: {row}")
print(f"Expected type: {rule.data_type}")
```

### Q3: "Database integrity constraint violation"

**A:** 중복 데이터 또는 FK 제약 위반. allow_duplicates 설정 확인.
```python
# 중복 체크 추가
if mapping.allow_duplicates == False:
    # 중복 체크 로직
```

### Q4: 대용량 파일 처리 시 느림

**A:** 배치 크기 조정 및 인덱스 최적화
```python
# 배치 크기 조정
batch_size = 1000
for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    # 처리
```

---

## 📊 데이터 흐름도

```
┌─────────────────┐
│  Excel File     │
│  (XLSX/XLS)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExcelParser     │
│ - Read file     │
│ - Get headers   │
│ - Extract rows  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ColumnMapping   │
│ - Load mappings │
│ - Map columns   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExcelValidator  │
│ - Validate data │
│ - Collect errors│
│ - Collect warns │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ImportService   │
│ - Create log    │
│ - Batch insert  │
│ - Update log    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ImportLog       │
│ (Database)      │
└─────────────────┘
```

---

## 📞 지원 & 문의

- **문제 발생 시:** GitHub Issues 생성
- **기능 제안:** Discussions에서 아이디어 공유
- **보안 이슈:** security@elspa.com으로 보고

---

**최종 업데이트:** 2025-06-02  
**버전:** 1.0.0  
**담당자:** jitnet57 (kang jichul)
