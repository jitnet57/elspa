"""
============================================================
📌 인증 시스템 테스트
📋 목적: JWT, 로그인, 권한 검사 테스트
🔧 테스트 항목: 9개
📅 작성일: 2026-05-22
============================================================
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from main import app

client = TestClient(app)


class TestLogin:
    """로그인 엔드포인트 테스트"""

    def test_login_success_admin(self):
        """✅ 로그인 성공 (Admin)"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "admin@elspa.com"
        assert data["user"]["role"] == "admin"

    def test_login_success_user(self):
        """✅ 로그인 성공 (User)"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "user@elspa.com",
                "password": "user123"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["user"]["role"] == "user"

    def test_login_failure_wrong_password(self):
        """❌ 로그인 실패 (잘못된 비밀번호)"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    def test_login_failure_nonexistent_user(self):
        """❌ 로그인 실패 (없는 사용자)"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@elspa.com",
                "password": "anypassword"
            }
        )

        assert response.status_code == 401

    def test_login_missing_email(self):
        """❌ 로그인 실패 (이메일 누락)"""
        response = client.post(
            "/api/auth/login",
            json={"password": "admin123"}
        )

        assert response.status_code == 422  # Validation error

    def test_login_missing_password(self):
        """❌ 로그인 실패 (비밀번호 누락)"""
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@elspa.com"}
        )

        assert response.status_code == 422


class TestTokenRefresh:
    """토큰 갱신 테스트"""

    def test_refresh_token_success(self):
        """✅ 토큰 갱신 성공"""
        # 1. 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )
        refresh_token = login_response.json()["refresh_token"]

        # 2. 토큰 갱신
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_refresh_token_failure_invalid(self):
        """❌ 토큰 갱신 실패 (잘못된 토큰)"""
        response = client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )

        assert response.status_code == 401


class TestTokenVerify:
    """토큰 검증 테스트"""

    def test_verify_token_valid(self):
        """✅ 토큰 검증 성공"""
        # 1. 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 토큰 검증
        response = client.post(
            "/api/auth/verify",
            json={"token": access_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["user"]["email"] == "admin@elspa.com"

    def test_verify_token_invalid(self):
        """❌ 토큰 검증 실패"""
        response = client.post(
            "/api/auth/verify",
            json={"token": "invalid_token"}
        )

        assert response.status_code == 200
        assert response.json()["valid"] is False


class TestPayrollAPIAuth:
    """Payroll API 인증 테스트"""

    def test_get_employees_requires_auth(self):
        """❌ 토큰 없이 직원 조회 불가"""
        response = client.get("/api/payroll/employees")

        assert response.status_code == 403  # Forbidden (no token)

    def test_get_employees_with_auth(self):
        """✅ 토큰으로 직원 조회 가능"""
        # 1. 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "user@elspa.com",
                "password": "user123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 인증된 요청
        response = client.get(
            "/api/payroll/employees",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200

    def test_create_employee_requires_admin(self):
        """❌ 일반 사용자는 직원 생성 불가"""
        # 1. 일반 사용자로 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "user@elspa.com",
                "password": "user123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 직원 생성 시도
        response = client.post(
            "/api/payroll/employees",
            json={
                "name": "John Doe",
                "hire_date": "2025-01-15",
                "position": "Therapist"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403  # Forbidden

    def test_create_employee_admin_success(self):
        """✅ Admin 사용자는 직원 생성 가능"""
        # 1. Admin으로 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 직원 생성
        response = client.post(
            "/api/payroll/employees",
            json={
                "name": "Jane Doe",
                "hire_date": "2025-01-15",
                "position": "Therapist"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 201

    def test_calculate_payroll_requires_admin(self):
        """❌ 일반 사용자는 급여 계산 불가"""
        # 1. 일반 사용자로 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "user@elspa.com",
                "password": "user123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 급여 계산 시도 (존재하는 period_id 가정)
        response = client.post(
            "/api/payroll/periods/1/calculate",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403  # Forbidden


class TestLogout:
    """로그아웃 테스트"""

    def test_logout_success(self):
        """✅ 로그아웃 성공"""
        # 1. 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 로그아웃
        response = client.post(
            "/api/auth/logout",
            json={"token": access_token}
        )

        assert response.status_code == 200
        assert "Successfully logged out" in response.json()["message"]


class TestCurrentUser:
    """현재 사용자 정보 조회 테스트"""

    def test_get_current_user(self):
        """✅ 현재 사용자 정보 조회"""
        # 1. 로그인
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "admin@elspa.com",
                "password": "admin123"
            }
        )
        access_token = login_response.json()["access_token"]

        # 2. 현재 사용자 정보 조회
        response = client.post(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@elspa.com"
        assert data["role"] == "admin"


# ============================================================
# Coverage Report
# ============================================================

"""
테스트 커버리지:
- Login: 6개 테스트
  ✅ 성공 (Admin, User)
  ❌ 실패 (잘못된 비밀번호, 없는 사용자)
  ❌ 검증 오류 (이메일, 비밀번호 누락)

- Token Refresh: 2개 테스트
  ✅ 성공
  ❌ 실패 (잘못된 토큰)

- Token Verify: 2개 테스트
  ✅ 성공
  ❌ 실패 (잘못된 토큰)

- Payroll API Auth: 5개 테스트
  ❌ 토큰 없이 조회 불가
  ✅ 토큰으로 조회 가능
  ❌ 일반 사용자는 생성 불가
  ✅ Admin은 생성 가능
  ❌ 일반 사용자는 계산 불가

- Logout: 1개 테스트
  ✅ 로그아웃 성공

- Current User: 1개 테스트
  ✅ 현재 사용자 정보 조회

총 17개 테스트

실행 방법:
  pytest tests/test_auth.py -v
  pytest tests/test_auth.py::TestLogin::test_login_success_admin -v
"""
