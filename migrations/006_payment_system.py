"""
결제 시스템 마이그레이션
- 기존 booking의 payment_method 확장
- payment_status 필드 추가
- payment_details JSON 필드 추가
- 테라피스트 수수료 기록용 테이블 추가

Revision ID: 006
Revises: 005_network_admin_fields
Create Date: 2026-06-02 21:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005_network_admin_fields'
branch_labels = None
depends_on = None


def upgrade():
    """
    업그레이드: 결제 시스템 관련 필드 및 테이블 추가
    """

    # 1. bookings 테이블에 새로운 컬럼 추가
    op.add_column('bookings', sa.Column(
        'payment_status',
        sa.String(50),
        nullable=True,
        default='pending',
        comment='pending(미결제), paid(결제완료), failed(결제실패), refunded(환불), partial(부분결제)'
    ))

    op.add_column('bookings', sa.Column(
        'payment_details',
        postgresql.JSON(),
        nullable=True,
        comment='결제 상세 정보 (transaction_id, approval_code 등)'
    ))

    op.add_column('bookings', sa.Column(
        'paid_at',
        sa.DateTime(),
        nullable=True,
        comment='실제 결제 완료 시간'
    ))

    op.add_column('bookings', sa.Column(
        'payment_gateway',
        sa.String(50),
        nullable=True,
        comment='결제 게이트웨이 (stripe, paypal, paymongo, none)'
    ))

    # 2. payment_records 테이블 생성 (결제 이력 추적)
    op.create_table(
        'payment_records',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('booking_id', sa.BigInteger(), sa.ForeignKey('bookings.id'), nullable=False, index=True),
        sa.Column('therapist_id', sa.BigInteger(), sa.ForeignKey('therapists.id'), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_type', sa.String(50), nullable=False, comment='booking, deposit, refund, adjustment'),
        sa.Column('status', sa.String(50), nullable=False, default='completed', comment='pending, completed, failed, cancelled'),
        sa.Column('gateway', sa.String(50), nullable=True, comment='stripe, paypal, paymongo, cash, bank_transfer'),
        sa.Column('transaction_id', sa.String(255), nullable=True, unique=True),
        sa.Column('reference_code', sa.String(100), nullable=True),
        sa.Column('method', sa.String(50), nullable=True, comment='card, cash, kakaopay, bank_transfer'),
        sa.Column('metadata', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 3. therapist_commission_ledger 테이블 생성 (테라피스트 수수료 기록)
    op.create_table(
        'therapist_commission_ledger',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('therapist_id', sa.BigInteger(), sa.ForeignKey('therapists.id'), nullable=False, index=True),
        sa.Column('booking_id', sa.BigInteger(), sa.ForeignKey('bookings.id'), nullable=True),
        sa.Column('commission_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('commission_rate', sa.Numeric(5, 2), nullable=True, comment='수수료율 (%)'),
        sa.Column('base_amount', sa.Numeric(10, 2), nullable=False, comment='수수료 계산 기준 금액'),
        sa.Column('transaction_type', sa.String(50), nullable=False, comment='booking_service, referral, adjustment'),
        sa.Column('status', sa.String(50), nullable=False, default='pending', comment='pending, approved, paid, cancelled'),
        sa.Column('period', sa.String(10), nullable=True, comment='월정산 기준 (2026-06)'),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 4. payment_method_settings 테이블 생성 (결제 수단 설정)
    op.create_table(
        'payment_method_settings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('method_name', sa.String(50), nullable=False, unique=True, comment='card, cash, kakaopay, bank_transfer'),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('gateway', sa.String(50), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_online', sa.Boolean(), nullable=False, default=False, comment='온라인 결제 여부'),
        sa.Column('fee_percentage', sa.Numeric(5, 2), nullable=True, comment='수수료율'),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 5. 인덱스 생성
    op.create_index('ix_payment_records_booking_therapist', 'payment_records', ['booking_id', 'therapist_id'])
    op.create_index('ix_payment_records_transaction', 'payment_records', ['transaction_id'])
    op.create_index('ix_therapist_commission_ledger_period', 'therapist_commission_ledger', ['therapist_id', 'period'])
    op.create_index('ix_therapist_commission_ledger_status', 'therapist_commission_ledger', ['status', 'period'])

    print("✅ Payment system migration upgrade completed")


def downgrade():
    """
    다운그레이드: 생성된 테이블 및 컬럼 제거
    """

    # 1. 인덱스 제거
    op.drop_index('ix_therapist_commission_ledger_status')
    op.drop_index('ix_therapist_commission_ledger_period')
    op.drop_index('ix_payment_records_transaction')
    op.drop_index('ix_payment_records_booking_therapist')

    # 2. 테이블 제거
    op.drop_table('payment_method_settings')
    op.drop_table('therapist_commission_ledger')
    op.drop_table('payment_records')

    # 3. bookings 테이블에서 컬럼 제거
    op.drop_column('bookings', 'payment_gateway')
    op.drop_column('bookings', 'paid_at')
    op.drop_column('bookings', 'payment_details')
    op.drop_column('bookings', 'payment_status')

    print("✅ Payment system migration downgrade completed")
