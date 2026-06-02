#!/usr/bin/env python3
# ============================================================
# 📌 로컬 파일 저장 서버
# 📋 목적: 프론트에서 전송한 데이터를 XLSX로 저장
#         ~/elspa/data/에 현재파일 + 백업파일 생성
# 🔧 실행: python3 file_server.py
# 📅 작성일: 2026-06-02
# ============================================================

from flask import Flask, request, jsonify
from pathlib import Path
from datetime import datetime
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows
import pandas as pd
import json
import shutil
import traceback

app = Flask(__name__)

# 설정
DATA_DIR = Path.home() / "elspa" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# 📋 XLSX 저장 함수
# ============================================================
def save_xlsx(filename_base: str, data: list, description: str = ""):
    """
    데이터를 XLSX로 저장 + 백업 파일 생성

    Args:
        filename_base: "bookings", "expenses" 등 (날짜/시간은 자동 추가)
        data: 리스트 형태의 데이터 (각 요소는 딕셔너리)
        description: 시트 설명
    """
    try:
        # 타임스탐프 생성
        timestamp = datetime.now().strftime("%Y%m%d-%H%M")
        filename = f"{timestamp}-{filename_base}.xlsx"
        filepath = DATA_DIR / filename

        # DataFrame 변환
        if not data:
            df = pd.DataFrame()
        else:
            df = pd.DataFrame(data)

        # XLSX 저장
        df.to_excel(str(filepath), sheet_name='Data', index=False)

        # 백업 파일 생성
        backup_filename = f"{timestamp}-{filename_base}.backup"
        backup_filepath = DATA_DIR / backup_filename
        shutil.copy(str(filepath), str(backup_filepath))

        return {
            'success': True,
            'message': f'✅ 저장 완료: {filename}',
            'file': filename,
            'backup': backup_filename,
            'path': str(filepath),
            'size': filepath.stat().st_size,
            'rows': len(data),
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
        }

# ============================================================
# 🔄 REST API
# ============================================================

@app.route('/health', methods=['GET'])
def health():
    """헬스 체크"""
    return jsonify({
        'status': 'ok',
        'data_dir': str(DATA_DIR),
        'timestamp': datetime.now().isoformat(),
    })

@app.route('/api/save-bookings', methods=['POST'])
def save_bookings():
    """예약 데이터 저장"""
    try:
        data = request.get_json()
        bookings = data.get('bookings', [])

        result = save_xlsx('bookings', bookings, '예약 데이터')

        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/save-expenses', methods=['POST'])
def save_expenses():
    """비용 데이터 저장"""
    try:
        data = request.get_json()
        expenses = data.get('expenses', [])

        result = save_xlsx('expenses', expenses, '비용 기록')

        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/save-attendance', methods=['POST'])
def save_attendance():
    """출결 데이터 저장"""
    try:
        data = request.get_json()
        attendance = data.get('attendance', [])

        result = save_xlsx('attendance', attendance, '출결 기록')

        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/save-payroll', methods=['POST'])
def save_payroll():
    """급여 데이터 저장"""
    try:
        data = request.get_json()
        payroll = data.get('payroll', [])

        result = save_xlsx('payroll', payroll, '급여 기록')

        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/save-all', methods=['POST'])
def save_all():
    """모든 데이터 한 번에 저장"""
    try:
        data = request.get_json()
        results = {}

        # 각 데이터 타입별로 저장
        for key in ['bookings', 'expenses', 'attendance', 'payroll']:
            items = data.get(key, [])
            if items:
                results[key] = save_xlsx(key, items, f'{key} 데이터')

        return jsonify({
            'success': True,
            'message': f'✅ {len(results)}개 파일 저장 완료',
            'results': results,
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/list-files', methods=['GET'])
def list_files():
    """저장된 파일 목록"""
    try:
        files = sorted([f for f in DATA_DIR.glob('*') if f.is_file()])
        file_list = []

        for f in files:
            stat = f.stat()
            file_list.append({
                'name': f.name,
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })

        return jsonify({
            'success': True,
            'data_dir': str(DATA_DIR),
            'count': len(file_list),
            'files': file_list,
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ============================================================
# 🎯 메인
# ============================================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 ElSpa 파일 저장 서버 시작")
    print("="*60)
    print(f"📁 데이터 디렉토리: {DATA_DIR}")
    print(f"🌐 서버: http://localhost:5000")
    print(f"📊 API: POST http://localhost:5000/api/save-all")
    print("="*60 + "\n")

    app.run(host='localhost', port=5000, debug=False)
