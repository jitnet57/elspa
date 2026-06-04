-- ============================================================
-- 📌 마이그레이션: staffs 테이블에 department, job_title 추가
-- 📋 목적: 직원 부서 및 직책 관리 기능 추가
-- 📅 작성일: 2026-06-04
-- ============================================================

-- 부서 필드 추가 (department)
ALTER TABLE staffs
ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'Office',
ADD COLUMN IF NOT EXISTS job_title VARCHAR(50) DEFAULT 'staff';

-- NOT NULL 제약 조건 추가 (기존 레코드는 기본값으로 자동 채워짐)
ALTER TABLE staffs
ALTER COLUMN department SET NOT NULL,
ALTER COLUMN job_title SET NOT NULL;

-- 인덱스 추가 (조회 성능 개선)
CREATE INDEX IF NOT EXISTS idx_staffs_department ON staffs(department);
CREATE INDEX IF NOT EXISTS idx_staffs_job_title ON staffs(job_title);
CREATE INDEX IF NOT EXISTS idx_staffs_department_job_title ON staffs(department, job_title);

-- 업종 필드를 직책 기본값으로 채우기 (레거시 호환)
-- 예: 기존 position='테라피스트'인 경우 department='Therapist', job_title='staff' 설정
UPDATE staffs
SET
  department = CASE
    WHEN position ILIKE '%테라피스트%' OR position ILIKE '%therapist%' THEN 'Therapist'
    WHEN position ILIKE '%드라이버%' OR position ILIKE '%driver%' THEN 'Driver'
    WHEN position ILIKE '%네일%' OR position ILIKE '%nail%' THEN 'Nail'
    WHEN position ILIKE '%커피%' OR position ILIKE '%coffee%' THEN 'Hollys Coffee'
    WHEN position ILIKE '%메인테넌스%' OR position ILIKE '%maintenance%' THEN 'Maintenance'
    WHEN position ILIKE '%yega%' THEN 'Yega'
    ELSE 'Office'
  END,
  job_title = CASE
    WHEN position ILIKE '%매니저%' OR position ILIKE '%manager%' THEN 'manager'
    WHEN position ILIKE '%chef%' THEN 'chef'
    ELSE 'staff'
  END
WHERE department = 'Office' AND job_title = 'staff';
