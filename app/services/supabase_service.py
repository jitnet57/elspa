# ============================================================
# 📌 Supabase Storage 서비스
# 📋 목적: CSV 파일을 Supabase Storage에 저장
# 🔧 기능: 파일 업로드, 다운로드, 삭제
# 📅 작성일: 2026-05-28
# ============================================================

import os
import logging
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabase Storage 관리 서비스"""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.client: Optional[Client] = None

        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
                logger.info("✅ Supabase 클라이언트 초기화 완료")
            except Exception as e:
                logger.error(f"❌ Supabase 초기화 실패: {e}")
                self.client = None

    def _ensure_bucket_exists(self, bucket_name: str) -> bool:
        """Bucket이 없으면 생성"""
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return False

            # Bucket 목록 조회
            buckets = self.client.storage.list_buckets()
            bucket_names = [b.name for b in buckets]

            if bucket_name not in bucket_names:
                logger.info(f"📦 Bucket 생성 중: {bucket_name}")
                self.client.storage.create_bucket(bucket_name, {"public": False})
                logger.info(f"✅ Bucket 생성 완료: {bucket_name}")

            return True
        except Exception as e:
            logger.warning(f"⚠️ Bucket 관리 실패: {e}")
            return True  # 이미 존재할 수 있으므로 계속 진행

    def upload_file(
        self, bucket: str, file_path: str, file_content: bytes
    ) -> bool:
        """
        Supabase Storage에 파일 업로드

        Args:
            bucket: Bucket 이름
            file_path: Storage 내 파일 경로
            file_content: 파일 내용 (바이트)

        Returns:
            업로드 성공 여부
        """
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return False

            # Bucket 확인/생성
            self._ensure_bucket_exists(bucket)

            # 파일 업로드
            logger.info(f"📤 파일 업로드: {bucket}/{file_path}")
            response = self.client.storage.from_(bucket).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": "text/csv"},
            )

            logger.info(f"✅ 파일 업로드 완료: {bucket}/{file_path}")
            return True

        except Exception as e:
            logger.error(f"❌ 파일 업로드 실패: {e}")
            return False

    def download_file(self, bucket: str, file_path: str) -> Optional[bytes]:
        """
        Supabase Storage에서 파일 다운로드

        Args:
            bucket: Bucket 이름
            file_path: Storage 내 파일 경로

        Returns:
            파일 내용 (바이트), 실패 시 None
        """
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return None

            logger.info(f"📥 파일 다운로드: {bucket}/{file_path}")
            response = self.client.storage.from_(bucket).download(path=file_path)

            logger.info(f"✅ 파일 다운로드 완료: {bucket}/{file_path}")
            return response

        except Exception as e:
            logger.error(f"❌ 파일 다운로드 실패: {e}")
            return None

    def delete_file(self, bucket: str, file_path: str) -> bool:
        """
        Supabase Storage에서 파일 삭제

        Args:
            bucket: Bucket 이름
            file_path: Storage 내 파일 경로

        Returns:
            삭제 성공 여부
        """
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return False

            logger.info(f"🗑️ 파일 삭제: {bucket}/{file_path}")
            self.client.storage.from_(bucket).remove([file_path])

            logger.info(f"✅ 파일 삭제 완료: {bucket}/{file_path}")
            return True

        except Exception as e:
            logger.error(f"❌ 파일 삭제 실패: {e}")
            return False

    def list_files(self, bucket: str, prefix: str = "") -> list:
        """
        Bucket의 파일 목록 조회

        Args:
            bucket: Bucket 이름
            prefix: 경로 prefix

        Returns:
            파일 목록
        """
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return []

            logger.info(f"📋 파일 목록 조회: {bucket}/{prefix}")
            files = self.client.storage.from_(bucket).list(path=prefix)

            logger.info(f"✅ 파일 목록 조회 완료: {len(files)} 개")
            return files

        except Exception as e:
            logger.error(f"❌ 파일 목록 조회 실패: {e}")
            return []

    def get_public_url(self, bucket: str, file_path: str) -> Optional[str]:
        """
        파일의 공개 URL 생성

        Args:
            bucket: Bucket 이름
            file_path: Storage 내 파일 경로

        Returns:
            공개 URL, 실패 시 None
        """
        try:
            if not self.client:
                logger.error("Supabase 클라이언트가 없습니다")
                return None

            url = self.client.storage.from_(bucket).get_public_url(file_path)
            logger.info(f"🔗 공개 URL 생성: {url}")
            return url

        except Exception as e:
            logger.error(f"❌ 공개 URL 생성 실패: {e}")
            return None
