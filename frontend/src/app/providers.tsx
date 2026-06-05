'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettlementScheduler } from '@/hooks/useSettlementScheduler';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useCacheClear } from '@/lib/hooks/useCacheClear';
import { useAutoBackup3h } from '@/lib/hooks/useAutoBackup3h';
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
 * Monthly settlement auto scheduling hook mount component
 */
function SettlementSchedulerMount() {
    useSettlementScheduler();
    return null;
}

/**
 * Exchange rate auto update hook mount component (updated every 5 minutes)
 */
function ExchangeRateMount() {
    useExchangeRate();
    return null;
}

/**
 * Cache clear on route change
 */
function CacheClearMount() {
    useCacheClear();
    return null;
}

/**
 * Auto backup every 3 hours
 */
function AutoBackupMount() {
    useAutoBackup3h();
    return null;
}

/**
 * Automatically open external links in new tab
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

        // Detect dynamically added links
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
                <CacheClearMount />
                {/* <AutoBackupMount /> 파일 저장 대화 방지 */}
                {children}
            </QueryClientProvider>
        </LanguageProvider>
    );
}
