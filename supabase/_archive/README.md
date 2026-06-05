# 보관(archive) — 통합 전 개별 스키마

이 폴더의 SQL들은 루트 **`SUPABASE_SCHEMA.sql`(단일 권위 파일)** 로 통합되었습니다.
신규 초기화는 루트 `SUPABASE_SCHEMA.sql` 하나만 실행하세요. (히스토리 보존용 보관)

- schema.sql, payroll_companies_schema.sql, deductions_schema.sql,
  sss_records_schema.sql, management_metrics_schema.sql, app_settings_schema.sql

> 유지(미보관): settlement_mock_data.sql(목데이터·UI 참조), delete_data.sql(초기화 유틸),
> payroll_daily_wage.sql / migrations/add_department_job_title.sql (데이터 업데이트 유틸)
