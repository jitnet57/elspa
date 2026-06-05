import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Supabase 환경변수 미설정');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
    .from('massage_services')
    .select('name,base_price,base_duration_minutes')
    .limit(10);

  if (error) {
    console.error('❌ 에러:', error);
  } else {
    console.log('✅ 마사지 서비스 로드:', data?.length, 'items');
    if (data) {
      data.forEach((s: any) => {
        console.log(`  - ${s.name} (${s.base_duration_minutes}분) ₱${s.base_price}`);
      });
    }
  }
}

test();
