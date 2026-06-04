// ============================================================
// 📌 Test Data Generator: Companies, Guides, Customers, Sessions
// 📋 Purpose: Comprehensive test data for settlement calculation validation
// 🔧 Includes: 10 companies, 10 guides, 100 customers, realistic sessions
// 📤 Used by: Test & validation pages for settlement accuracy testing
// ============================================================

export interface Company {
  id: number;
  name: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  settlement_day: number;
  commission_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Guide {
  id: number;
  company_id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  commission_rate?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface ServiceSession {
  id: number;
  guide_id: number;
  customer_id: number;
  service_type: string;
  service_price: number;
  duration_minutes: number;
  session_date: string;
  session_time: string;
  status: 'completed' | 'cancelled' | 'noshow';
  created_at: string;
}

// 10 Companies with English names
export const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Paradise Spa & Wellness',
    representative: 'Robert Martinez',
    phone: '02-1234-5678',
    email: 'info@paradisespa.ph',
    address: 'Manila, Metro Manila',
    settlement_day: 5,
    commission_rate: 30,
    status: 'active',
    created_at: '2025-01-01',
  },
  {
    id: 2,
    name: 'Tranquility Retreat Center',
    representative: 'Maria Santos',
    phone: '02-2345-6789',
    email: 'contact@tranquilityretreat.ph',
    address: 'Cebu, Cebu',
    settlement_day: 10,
    commission_rate: 28,
    status: 'active',
    created_at: '2025-01-05',
  },
  {
    id: 3,
    name: 'Serenity Wellness Clinic',
    representative: 'James Garcia',
    phone: '02-3456-7890',
    email: 'admin@serenity-wellness.ph',
    address: 'Davao, Davao del Sur',
    settlement_day: 15,
    commission_rate: 32,
    status: 'active',
    created_at: '2025-01-10',
  },
  {
    id: 4,
    name: 'Healing Hands Spa',
    representative: 'Ana Reyes',
    phone: '02-4567-8901',
    email: 'support@healinghands.ph',
    address: 'Quezon City, Metro Manila',
    settlement_day: 20,
    commission_rate: 25,
    status: 'active',
    created_at: '2025-01-15',
  },
  {
    id: 5,
    name: 'Rejuvenation Day Spa',
    representative: 'Carlos Perez',
    phone: '02-5678-9012',
    email: 'hello@rejuvenation.ph',
    address: 'Makati, Metro Manila',
    settlement_day: 25,
    commission_rate: 30,
    status: 'active',
    created_at: '2025-01-20',
  },
  {
    id: 6,
    name: 'Zen Spa & Reflexology',
    representative: 'Linda Flores',
    phone: '02-6789-0123',
    email: 'contact@zenspareflexology.ph',
    address: 'Antipolo, Rizal',
    settlement_day: 5,
    commission_rate: 27,
    status: 'active',
    created_at: '2025-02-01',
  },
  {
    id: 7,
    name: 'Oriental Spa & Wellness',
    representative: 'David Wong',
    phone: '02-7890-1234',
    email: 'info@orientalspa.ph',
    address: 'BGC, Taguig',
    settlement_day: 10,
    commission_rate: 31,
    status: 'active',
    created_at: '2025-02-05',
  },
  {
    id: 8,
    name: 'Harmony Spa Resort',
    representative: 'Patricia Lim',
    phone: '02-8901-2345',
    email: 'reservations@harmonyspa.ph',
    address: 'Subic, Zambales',
    settlement_day: 15,
    commission_rate: 29,
    status: 'active',
    created_at: '2025-02-10',
  },
  {
    id: 9,
    name: 'Vitality Wellness Center',
    representative: 'Michael Chen',
    phone: '02-9012-3456',
    email: 'admin@vitalitywellness.ph',
    address: 'Pasig, Metro Manila',
    settlement_day: 20,
    commission_rate: 26,
    status: 'active',
    created_at: '2025-02-15',
  },
  {
    id: 10,
    name: 'Aurora Spa Paradise',
    representative: 'Jennifer Lopez',
    phone: '02-0123-4567',
    email: 'contact@auroraspa.ph',
    address: 'Pampanga, Pampanga',
    settlement_day: 1,
    commission_rate: 30,
    status: 'active',
    created_at: '2025-02-20',
  },
];

// 10 Guides (Massage Therapists) with English names
export const mockGuides: Guide[] = [
  {
    id: 1,
    company_id: 1,
    name: 'Sarah Johnson',
    specialty: 'Swedish Massage',
    phone: '0910-111-1111',
    email: 'sarah@therapist.ph',
    bank_name: 'Metrobank',
    bank_account: '1001-2345-6789',
    commission_rate: 30,
    status: 'active',
    created_at: '2025-01-05',
  },
  {
    id: 2,
    company_id: 1,
    name: 'Emma Wilson',
    specialty: 'Thai Massage',
    phone: '0910-222-2222',
    email: 'emma@therapist.ph',
    bank_name: 'BDO',
    bank_account: '2002-3456-7890',
    status: 'active',
    created_at: '2025-01-10',
  },
  {
    id: 3,
    company_id: 2,
    name: 'Jessica Brown',
    specialty: 'Hot Stone Massage',
    phone: '0910-333-3333',
    email: 'jessica@therapist.ph',
    bank_name: 'BPI',
    bank_account: '3003-4567-8901',
    commission_rate: 28,
    status: 'active',
    created_at: '2025-01-15',
  },
  {
    id: 4,
    company_id: 2,
    name: 'Amanda Davis',
    specialty: 'Foot Reflexology',
    phone: '0910-444-4444',
    email: 'amanda@therapist.ph',
    bank_name: 'Landbank',
    bank_account: '4004-5678-9012',
    status: 'active',
    created_at: '2025-01-20',
  },
  {
    id: 5,
    company_id: 3,
    name: 'Catherine Martin',
    specialty: 'Aromatherapy',
    phone: '0910-555-5555',
    email: 'catherine@therapist.ph',
    bank_name: 'PNB',
    bank_account: '5005-6789-0123',
    status: 'active',
    created_at: '2025-02-01',
  },
  {
    id: 6,
    company_id: 3,
    name: 'Rachel Garcia',
    specialty: 'Deep Tissue Massage',
    phone: '0910-666-6666',
    email: 'rachel@therapist.ph',
    bank_name: 'RCBC',
    bank_account: '6006-7890-1234',
    commission_rate: 32,
    status: 'active',
    created_at: '2025-02-05',
  },
  {
    id: 7,
    company_id: 4,
    name: 'Michelle Anderson',
    specialty: 'Sports Massage',
    phone: '0910-777-7777',
    email: 'michelle@therapist.ph',
    bank_name: 'UnionBank',
    bank_account: '7007-8901-2345',
    status: 'active',
    created_at: '2025-02-10',
  },
  {
    id: 8,
    company_id: 4,
    name: 'Nicole Thompson',
    specialty: 'Shiatsu',
    phone: '0910-888-8888',
    email: 'nicole@therapist.ph',
    bank_name: 'Security Bank',
    bank_account: '8008-9012-3456',
    status: 'active',
    created_at: '2025-02-15',
  },
  {
    id: 9,
    company_id: 5,
    name: 'Victoria White',
    specialty: 'Swedish & Thai Combo',
    phone: '0910-999-9999',
    email: 'victoria@therapist.ph',
    bank_name: 'Metrobank',
    bank_account: '9009-0123-4567',
    commission_rate: 30,
    status: 'active',
    created_at: '2025-02-20',
  },
  {
    id: 10,
    company_id: 5,
    name: 'Lauren Harris',
    specialty: 'Relaxation Massage',
    phone: '0910-1010-1010',
    email: 'lauren@therapist.ph',
    bank_name: 'BDO',
    bank_account: '1010-1234-5678',
    status: 'active',
    created_at: '2025-03-01',
  },
];

// Realistic customer names (English)
const customerFirstNames = [
  'John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Charles', 'Christopher',
  'Daniel', 'Matthew', 'Anthony', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin',
  'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
  'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
  'Frank', 'Gregory', 'Alexander', 'Raymond', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron',
  'Jose', 'Adam', 'Henry', 'Douglas', 'Peter', 'Zachary', 'Kyle', 'Walter', 'Harold', 'Jeremy',
];

const customerLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell',
  'Parker', 'Evans', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook',
];

// Generate 100 customers
export const mockCustomers: Customer[] = Array.from({ length: 100 }, (_, i) => {
  const firstName = customerFirstNames[Math.floor(Math.random() * customerFirstNames.length)];
  const lastName = customerLastNames[Math.floor(Math.random() * customerLastNames.length)];
  const customerId = i + 1;

  return {
    id: customerId,
    name: `${firstName} ${lastName}`,
    phone: `0${Math.floor(Math.random() * 9) + 9}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${customerId}@email.com`,
    status: Math.random() > 0.1 ? 'active' : 'inactive',
    created_at: `2025-${String(Math.floor(Math.random() * 3) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  };
});

// Service types with pricing
const serviceTypes = [
  { name: 'Swedish Massage', basePrice: 2500 },
  { name: 'Thai Massage', basePrice: 2500 },
  { name: 'Hot Stone', basePrice: 3000 },
  { name: 'Foot Reflexology', basePrice: 2000 },
  { name: 'Aromatherapy', basePrice: 2200 },
  { name: 'Deep Tissue', basePrice: 2800 },
  { name: 'Sports Massage', basePrice: 2700 },
  { name: 'Shiatsu', basePrice: 2600 },
  { name: 'Full Body Relax', basePrice: 3500 },
  { name: 'Head & Shoulder', basePrice: 1500 },
];

// Generate realistic sessions (100 sessions across 10 guides)
export const mockSessions: ServiceSession[] = [];
let sessionId = 1;

// Create about 10 sessions per guide (100 total)
for (let guideId = 1; guideId <= 10; guideId++) {
  const sessionsPerGuide = 10;

  for (let j = 0; j < sessionsPerGuide; j++) {
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const priceVariation = (Math.random() * 0.2 - 0.1); // ±10% variation
    const servicePrice = Math.floor(serviceType.basePrice * (1 + priceVariation) / 100) * 100;

    const monthOffset = Math.floor(Math.random() * 3);
    const dayOffset = Math.floor(Math.random() * 28) + 1;
    const sessionDate = `2025-${String(monthOffset + 1).padStart(2, '0')}-${String(dayOffset).padStart(2, '0')}`;

    const hour = Math.floor(Math.random() * 12) + 9; // 9 AM - 9 PM
    const minute = (Math.floor(Math.random() * 6) * 10) % 60; // 0, 10, 20, 30, 40, 50
    const sessionTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const duration = [60, 90, 120][Math.floor(Math.random() * 3)];

    const statuses: Array<'completed' | 'cancelled' | 'noshow'> = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'cancelled', 'noshow'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    mockSessions.push({
      id: sessionId++,
      guide_id: guideId,
      customer_id: Math.floor(Math.random() * 100) + 1,
      service_type: serviceType.name,
      service_price: servicePrice,
      duration_minutes: duration,
      session_date: sessionDate,
      session_time: sessionTime,
      status,
      created_at: sessionDate,
    });
  }
}

// Export all mock data
export const testData = {
  companies: mockCompanies,
  guides: mockGuides,
  customers: mockCustomers,
  sessions: mockSessions,
};
