'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettlementScheduler } from '@/hooks/useSettlementScheduler';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { OfflineBanner } from '@/components/OfflineBanner';
import { InAppBrowserBanner } from '@/components/InAppBrowserBanner';
import { LanguageProvider } from '@/lib/LanguageContext';

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

/**
 * 환율 자동 갱신 hook 마운트용 컴포넌트 (5분마다 갱신)
 */
function ExchangeRateMount() {
    useExchangeRate();
    return null;
}

/**
 * 외부 링크 자동으로 새 탭에서 열기
 */
function ExternalLinkHandler() {
    React.useEffect(() => {
        const processLinks = () => {
            const links = document.querySelectorAll('a[href^="http"], a[href^="//"]');
            links.forEach(link => {
                if (!link.getAttribute('target')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        };

        processLinks();

        // 동적으로 추가되는 링크도 감지
        const observer = new MutationObserver(processLinks);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <InAppBrowserBanner />
                <OfflineBanner />
                <SettlementSchedulerMount />
                <ExchangeRateMount />
                <ExternalLinkHandler />
                {children}
            </QueryClientProvider>
        </LanguageProvider>
    );
}
