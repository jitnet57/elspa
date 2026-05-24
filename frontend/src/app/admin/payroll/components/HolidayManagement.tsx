import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Holiday {
  id: string;
  date: string;
  month: string;
  day: string;
  name: string;
  type: 'National' | 'Special';
  multiplier: number;
}

const mockHolidays: Holiday[] = [
  {
    id: '1',
    date: 'Dec 25, 2024',
    month: 'Dec',
    day: '25',
    name: 'Christmas Day',
    type: 'National',
    multiplier: 200,
  },
  {
    id: '2',
    date: 'Dec 30, 2024',
    month: 'Dec',
    day: '30',
    name: 'Rizal Day',
    type: 'National',
    multiplier: 200,
  },
  {
    id: '3',
    date: 'Nov 01, 2024',
    month: 'Nov',
    day: '01',
    name: "All Saints' Day",
    type: 'Special',
    multiplier: 130,
  },
  {
    id: '4',
    date: 'Nov 02, 2024',
    month: 'Nov',
    day: '02',
    name: "All Souls' Day",
    type: 'Special',
    multiplier: 130,
  },
];

const typeColors = {
  National: 'bg-red-100 text-red-700',
  Special: 'bg-orange-100 text-orange-700',
};

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState(mockHolidays);
  const [search, setSearch] = useState('');

  const filteredHolidays = holidays.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setHolidays(holidays.filter((h) => h.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button className="text-primary md:hidden">
            <span>☰</span>
          </button>
          <h1 className="text-xl font-bold text-primary">ElSpa Payroll</h1>
        </div>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl8u2leoUvGE3Zm5VrVsZwFcm-2DLkRlWsDZ1Jho0vNOvSzD9C5lupS8IwiLDkTZTJqFWgs5xKw66d8O9nbsTaFNfEkqgrhEtiKILUeAquHhulcgNCc2jblm33vVd5SJT7tqnda_L9I_luXtB-Op0fYbFVQFC5agKiCsAo43gPyvhVhWfLqNEGHyKWq5N6CRlkur66NzCXzkwaqhtulgEckPc2OTC7DGljX74duzj85rL-vVwyPI3LeUZLGdpTuMB_TpEjLTkJwE_Y"
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
      </header>

      <main className="pt-20 pb-8 px-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-2">Holidays</h2>
            <p className="text-body-md text-on-surface-variant">
              Manage Philippine national and special non-working days.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 h-11 rounded-2xl font-bold hover:opacity-90 transition shadow-sm w-full md:w-auto">
            <Plus size={20} />
            Add Holiday
          </button>
        </section>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search holidays by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 h-11 border border-outline-variant rounded-2xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Holidays List */}
        <div className="flex flex-col gap-3">
          {filteredHolidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white border border-outline-variant rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-sm hover:shadow-md transition"
            >
              {/* Date Box + Info */}
              <div className="flex items-start gap-4">
                <div className={`${
                  holiday.type === 'National'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                } p-3 rounded-2xl flex flex-col items-center justify-center min-w-[64px]`}>
                  <span className="text-label-sm font-bold uppercase">{holiday.month}</span>
                  <span className="text-2xl font-bold">{holiday.day}</span>
                </div>
                <div>
                  <h3 className="text-body-lg font-bold text-on-surface">{holiday.name}</h3>
                  <p className="text-label-sm text-on-surface-variant">{holiday.date}</p>
                </div>
              </div>

              {/* Type Badge + Multiplier + Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
                <span className={`px-3 py-1 text-label-sm font-bold rounded-full uppercase ${typeColors[holiday.type]}`}>
                  {holiday.type}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-data-mono font-bold text-primary">{holiday.multiplier}%</span>
                  <span className="text-xs text-outline uppercase font-bold">Rate Multiplier</span>
                </div>
                <div className="flex items-center gap-2 ml-auto md:ml-4">
                  <button className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition">
                    <Edit2 size={18} className="text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(holiday.id)}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-error-container transition"
                  >
                    <Trash2 size={18} className="text-error" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Illustration */}
        <div className="mt-8 rounded-2xl overflow-hidden relative h-48 group">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsF4X_vzP8nqbMbQ6nZ2F1lPfDKy5BQSPEzuLA0YePmHsa73-aEwaSME1Nm8WL4bABQkOz3s7TOlxdX2lIP5CnoEReunsc6RteIMpFIHi4y8PPyld2xXhBIrpy-QoSR3aZzOWXK9Z96i6g2GmJtj7XJG4twJ7tBKA1VnLE2cxn-NOQeZx0GaI2Cxsl7HHXa6j384hRuCaaMUdECXct_YqKphL5fAqJ2FVUZj2bCF_H0jbdPpdddQifhLL7GmNgju9OxHLd_FQg7_la"
            alt="Holidays"
            className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent flex items-end p-6">
            <p className="text-body-md font-bold text-on-surface-variant">
              Total 12 National Holidays in 2024
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex justify-around bg-white border-t border-outline-variant py-2">
        {[
          { icon: '📊', label: 'Dashboard' },
          { icon: '👥', label: 'Staff' },
          { icon: '💳', label: 'Advances' },
          { icon: '📅', label: 'Attendance' },
          { icon: '📝', label: 'Records' },
        ].map((item, idx) => (
          <a
            key={idx}
            href="#"
            className="flex flex-col items-center justify-center py-2 px-3 text-on-surface-variant hover:text-primary"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
