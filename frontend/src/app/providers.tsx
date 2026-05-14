'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettlementScheduler } from '@/hooks/useSettlementScheduler';
import { OfflineBanner } from '@/components/OfflineBanner';

const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60000,
                gcTime: 10 * 60 * 1000,
            },
        },
    });
};

let clientQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        return createQueryClient();
    }
    if (!clientQueryClient) clientQueryClient = createQueryClient();
    return clientQueryClient;
}

/**
 * 월정산 자동 스케줄링 hook 마운트용 컴포넌트
 */
function SettlementSchedulerMount() {
    useSettlementScheduler();
    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <OfflineBanner />
            <SettlementSchedulerMount />
            {children}
        </QueryClientProvider>
    );
}
