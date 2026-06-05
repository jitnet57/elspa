'use client';

/**
 * 🔄 Auto Backup 활성화 (Root Layout용)
 * 📌 이 컴포넌트를 app/layout.tsx에 포함시키면 자동 백업 시작
 * 📅 작성일: 2026-06-05
 */

import { useAutoBackup } from '@/lib/hooks/useAutoBackup';

export function AutoBackupProvider({ children }: { children: React.ReactNode }) {
  // 자동 백업 시작 (3시간마다)
  useAutoBackup();

  return <>{children}</>;
}

/**
 * 📌 사용 방법:
 *
 * 1. app/layout.tsx 에서:
 *
 *    import { AutoBackupProvider } from './layout-backup';
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <html>
 *          <body>
 *            <AutoBackupProvider>
 *              {children}
 *            </AutoBackupProvider>
 *          </body>
 *        </html>
 *      );
 *    }
 *
 * 2. 또는 monitor/page.tsx 에서:
 *
 *    'use client';
 *    import { useAutoBackup } from '@/lib/hooks/useAutoBackup';
 *
 *    export default function Monitor() {
 *      const { manualBackup } = useAutoBackup();
 *
 *      return (
 *        <div>
 *          <button onClick={manualBackup}>수동 백업</button>
 *        </div>
 *      );
 *    }
 */
