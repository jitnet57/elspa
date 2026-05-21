# 메시징 시스템 마이그레이션

## 변경 사항 요약

### 1. 새로운 테이블: `message_logs`

```sql
CREATE TABLE message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_record_id INTEGER,
    employee_id INTEGER,
    message_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_kakao_id VARCHAR(255),
    subject VARCHAR(255),
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message_sid VARCHAR(255),
    error_message VARCHAR(1000),
    amount NUMERIC(10, 2),
    payment_date DATE,
    sent_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_record_id) REFERENCES payroll_records(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (payroll_record_id, channel),
    INDEX idx_message_payroll_record (payroll_record_id),
    INDEX idx_message_employee (employee_id),
    INDEX idx_message_status (status),
    INDEX idx_message_channel (channel),
    INDEX idx_message_created_at (created_at)
);
```

### 2. Alembic 마이그레이션 생성

```bash
cd e:\elspa
alembic revision --autogenerate -m "Add MessageLog model for payroll notifications"
alembic upgrade head
```

### 3. 수동 SQL 실행 (Alembic 없이)

PostgreSQL:
```sql
CREATE TABLE message_logs (
    id SERIAL PRIMARY KEY,
    payroll_record_id INTEGER REFERENCES payroll_records(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_kakao_id VARCHAR(255),
    subject VARCHAR(255),
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message_sid VARCHAR(255),
    error_message VARCHAR(1000),
    amount NUMERIC(10, 2),
    payment_date DATE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payroll_record_id, channel)
);

CREATE INDEX idx_message_payroll_record ON message_logs(payroll_record_id);
CREATE INDEX idx_message_employee ON message_logs(employee_id);
CREATE INDEX idx_message_status ON message_logs(status);
CREATE INDEX idx_message_channel ON message_logs(channel);
CREATE INDEX idx_message_created_at ON message_logs(created_at);
```

SQLite:
```sql
CREATE TABLE message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_record_id INTEGER REFERENCES payroll_records(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_kakao_id VARCHAR(255),
    subject VARCHAR(255),
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message_sid VARCHAR(255),
    error_message VARCHAR(1000),
    amount NUMERIC(10, 2),
    payment_date DATE,
    sent_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payroll_record_id, channel)
);

CREATE INDEX idx_message_payroll_record ON message_logs(payroll_record_id);
CREATE INDEX idx_message_employee ON message_logs(employee_id);
CREATE INDEX idx_message_status ON message_logs(status);
CREATE INDEX idx_message_channel ON message_logs(channel);
CREATE INDEX idx_message_created_at ON message_logs(created_at);
```

## 필수 패키지 설치

```bash
pip install twilio  # WhatsApp/SMS 지원
# Kakao Business API는 requests 기반 커스텀 구현
```

## 환경 변수 설정

.env 파일에 다음 항목 추가:

```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+1234567890
KAKAO_API_KEY=your_key
KAKAO_ADMIN_KEY=your_admin_key
```

## API 엔드포인트

1. **메시지 발송**
   ```
   POST /api/messaging/periods/{period_id}/send-notifications
   ```

2. **로그 조회**
   ```
   GET /api/messaging/message-logs
   GET /api/messaging/message-logs/{log_id}
   ```

3. **통계 조회**
   ```
   GET /api/messaging/stats
   ```
