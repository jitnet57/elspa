#!/usr/bin/env python3
"""
============================================================
📌 Security Tests Runner
📋 목적: 모든 보안 테스트 실행 및 보고서 생성
🔧 사용: python scripts/run_security_tests.py
📅 작성일: 2026-05-22
============================================================
"""

import subprocess
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class SecurityTestRunner:
    """보안 테스트 실행기"""

    def __init__(self):
        self.test_dir = Path("tests/security")
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.now().isoformat()
        self.results = {}

    def run_pytest(self, test_file: str, verbose: bool = True) -> Tuple[int, str]:
        """pytest 테스트 실행"""
        cmd = ["pytest", str(test_file), "-v", "--tb=short"]
        if verbose:
            cmd.append("-s")

        print(f"🧪 Running: {test_file}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode, result.stdout + result.stderr

    def run_bandit(self) -> Tuple[int, str]:
        """Bandit 보안 스캔"""
        print("🔍 Running Bandit security scan...")
        result = subprocess.run(
            ["bandit", "-r", "app/", "-f", "json"],
            capture_output=True,
            text=True
        )
        return result.returncode, result.stdout

    def run_safety(self) -> Tuple[int, str]:
        """Safety 의존성 체크"""
        print("📦 Running Safety dependency check...")
        result = subprocess.run(
            ["safety", "check", "--json"],
            capture_output=True,
            text=True
        )
        return result.returncode, result.stdout

    def run_all_tests(self) -> bool:
        """모든 보안 테스트 실행"""
        test_files = [
            "tests/security/test_sql_injection.py",
            "tests/security/test_xss.py",
            "tests/security/test_auth_security.py",
            "tests/security/test_security_headers.py",
        ]

        all_passed = True
        for test_file in test_files:
            returncode, output = self.run_pytest(test_file)
            self.results[test_file] = {
                "status": "✅ PASSED" if returncode == 0 else "❌ FAILED",
                "returncode": returncode,
                "output": output,
            }

            if returncode != 0:
                all_passed = False
                print(f"❌ {test_file} failed")
            else:
                print(f"✅ {test_file} passed")

        return all_passed

    def run_security_scans(self) -> Dict:
        """보안 스캔 실행 (Bandit, Safety)"""
        scans = {}

        # Bandit
        try:
            returncode, output = self.run_bandit()
            scans["bandit"] = {
                "status": "✅ PASSED" if returncode == 0 else "⚠️ WARNING",
                "returncode": returncode,
                "output": output,
            }
            # 보고서 저장
            with open(self.reports_dir / "bandit-report.json", "w") as f:
                f.write(output)
        except Exception as e:
            print(f"⚠️ Bandit failed: {e}")
            scans["bandit"] = {"status": "⚠️ SKIPPED", "error": str(e)}

        # Safety
        try:
            returncode, output = self.run_safety()
            scans["safety"] = {
                "status": "✅ PASSED" if returncode == 0 else "⚠️ WARNING",
                "returncode": returncode,
                "output": output,
            }
            # 보고서 저장
            with open(self.reports_dir / "safety-report.json", "w") as f:
                f.write(output)
        except Exception as e:
            print(f"⚠️ Safety failed: {e}")
            scans["safety"] = {"status": "⚠️ SKIPPED", "error": str(e)}

        return scans

    def generate_report(self) -> str:
        """테스트 보고서 생성"""
        report = f"""
# Security Test Report

**생성 시간:** {self.timestamp}
**환경:** Test

## 📊 테스트 결과 요약

"""

        # 테스트 결과
        report += "### Unit Tests\n\n"
        passed = sum(1 for r in self.results.values() if r["returncode"] == 0)
        total = len(self.results)

        for test_file, result in self.results.items():
            status = "✅ PASSED" if result["returncode"] == 0 else "❌ FAILED"
            report += f"- {test_file}: {status}\n"

        report += f"\n**총합:** {passed}/{total} 통과\n\n"

        # 종합 평가
        if passed == total:
            report += "## ✅ 평가\n\n**모든 보안 테스트 통과!**\n"
        else:
            report += "## ⚠️ 평가\n\n**일부 테스트 실패 - 검토 필요**\n"

        report += f"\n---\n\n**문서 버전:** 1.0\n**검토자:** Security Team\n"

        return report

    def save_results(self):
        """테스트 결과 저장"""
        # JSON 보고서
        with open(self.reports_dir / "security-test-results.json", "w") as f:
            json.dump(self.results, f, indent=2)

        # Markdown 보고서
        report = self.generate_report()
        with open(self.reports_dir / "security-test-report.md", "w") as f:
            f.write(report)

        print(f"\n📁 Reports saved to {self.reports_dir}")

    def run(self) -> int:
        """전체 테스트 실행"""
        print("=" * 60)
        print("🔒 ElSpa Security Test Suite")
        print("=" * 60)

        # 1. Unit Tests
        print("\n[1/3] Running Unit Tests...\n")
        tests_passed = self.run_all_tests()

        # 2. Security Scans
        print("\n[2/3] Running Security Scans...\n")
        scans = self.run_security_scans()

        # 3. Report Generation
        print("\n[3/3] Generating Reports...\n")
        self.save_results()

        # 종합 결과
        print("\n" + "=" * 60)
        if tests_passed:
            print("✅ Security tests completed successfully!")
            return 0
        else:
            print("❌ Some security tests failed!")
            return 1


def main():
    """메인 함수"""
    runner = SecurityTestRunner()
    exit_code = runner.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
