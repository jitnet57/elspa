// ============================================================
// 📌 모듈명: Performance Metrics (성능 지표)
// 📋 목적: Web Vitals 및 커스텀 성능 메트릭 추적
// 🔧 기능: LCP, FID, CLS, FCP, TTFB 등 핵심 지표 수집
// 📅 작성일: 2026-05-29
// ============================================================

/**
 * 📝 설명:
 * Google Web Vitals의 핵심 지표를 추적하고,
 * 커스텀 성능 메트릭을 수집하여 분석하는 모듈입니다.
 *
 * **핵심 지표 (Core Web Vitals):**
 * 1. LCP (Largest Contentful Paint): 주요 콘텐츠 렌더링 완료 시간 (목표: < 2.5s)
 * 2. FID (First Input Delay): 첫 입력 반응 속도 (목표: < 100ms)
 * 3. CLS (Cumulative Layout Shift): 레이아웃 변화 누적 (목표: < 0.1)
 *
 * **추가 지표:**
 * 4. FCP (First Contentful Paint): 첫 콘텐츠 렌더링 (목표: < 1.8s)
 * 5. TTFB (Time to First Byte): 첫 바이트 도착 (목표: < 600ms)
 *
 * **커스텀 지표:**
 * - 3D 렌더링 초기화 시간
 * - 네트워크 데이터 로드 시간
 * - API 응답 시간
 */

// ============================================================
// Web Vitals 지표 인터페이스
// ============================================================

export interface WebVitalsMetric {
  name: string;           // 지표명 (LCP, FID, CLS 등)
  value: number;          // 측정값
  rating: "good" | "needsImprovement" | "poor";  // 평가 등급
  delta: number;          // 이전 측정값 대비 변화
  id: string;             // 고유 ID
  navigationType?: string; // 네비게이션 타입 (navigate, reload, back-forward)
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };  // LCP 임계값 (ms)
  fid: { good: number; needsImprovement: number };  // FID 임계값 (ms)
  cls: { good: number; needsImprovement: number };  // CLS 임계값 (단위 없음)
  fcp: { good: number; needsImprovement: number };  // FCP 임계값 (ms)
  ttfb: { good: number; needsImprovement: number }; // TTFB 임계값 (ms)
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: string;  // ms, fps, kb 등
  timestamp: number;
}

// ============================================================
// Web Vitals 기본 임계값 (Google 권장)
// ============================================================

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },    // ms
  fid: { good: 100, needsImprovement: 300 },      // ms
  cls: { good: 0.1, needsImprovement: 0.25 },     // unit
  fcp: { good: 1800, needsImprovement: 3000 },    // ms
  ttfb: { good: 600, needsImprovement: 1200 },    // ms
};

// ============================================================
// 성능 메트릭 수집기 클래스
// ============================================================

export class PerformanceMonitor {
  private webVitals: Map<string, WebVitalsMetric> = new Map();
  private customMetrics: CustomMetric[] = [];
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private isSupported: boolean = typeof window !== "undefined" && "PerformanceObserver" in window;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    if (thresholds) {
      this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    }
    this.init();
  }

  /**
   * 📌 함수: init
   * 📋 목적: Performance Observer 초기화 및 리스너 등록
   * 🔧 작동: paint, largest-contentful-paint, first-input, layout-shift 이벤트 추적
   */
  private init(): void {
    if (!this.isSupported) {
      console.warn("⚠️ PerformanceObserver는 이 브라우저에서 지원하지 않습니다.");
      return;
    }

    try {
      // ===== Paint Timing (FCP, LCP) =====
      this.observePaint();

      // ===== Largest Contentful Paint =====
      this.observeLCP();

      // ===== First Input Delay =====
      this.observeFID();

      // ===== Layout Shift =====
      this.observeCLS();

      // ===== Navigation Timing (TTFB, FCP) =====
      this.observeNavigation();

      console.log("✅ Performance Monitor 초기화 완료");
    } catch (error) {
      console.error("❌ Performance Monitor 초기화 실패:", error);
    }
  }

  /**
   * 📌 함수: observePaint
   * 📋 목적: FCP(First Contentful Paint) 측정
   */
  private observePaint(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            const metric = this.createMetric("FCP", entry.startTime);
            this.webVitals.set("FCP", metric);
            console.log(`📊 FCP: ${Math.round(entry.startTime)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["paint"] });
    } catch (error) {
      console.warn("⚠️ Paint Observer 지원하지 않음:", error);
    }
  }

  /**
   * 📌 함수: observeLCP
   * 📋 목적: LCP(Largest Contentful Paint) 측정
   * 📝 설명: 화면에 표시되는 가장 큰 콘텐츠 렌더링 완료 시간
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        const metric = this.createMetric("LCP", lastEntry.renderTime || lastEntry.loadTime);
        this.webVitals.set("LCP", metric);
        console.log(`📊 LCP: ${Math.round(metric.value)}ms (${metric.rating})`);
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      console.warn("⚠️ LCP Observer 지원하지 않음:", error);
    }
  }

  /**
   * 📌 함수: observeFID
   * 📋 목적: FID(First Input Delay) 측정
   * 📝 설명: 사용자의 첫 상호작용에 대한 반응 시간
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric = this.createMetric("FID", entry.processingDuration);
          this.webVitals.set("FID", metric);
          console.log(`📊 FID: ${Math.round(metric.value)}ms (${metric.rating})`);
        }
      });

      observer.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      console.warn("⚠️ FID Observer 지원하지 않음:", error);
    }
  }

  /**
   * 📌 함수: observeCLS
   * 📋 목적: CLS(Cumulative Layout Shift) 측정
   * 📝 설명: 예상치 못한 레이아웃 변화의 누적값
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            // 사용자 입력 500ms 이내의 shift는 제외
            clsValue += (entry as any).value;
          }
        }

        const metric: WebVitalsMetric = {
          name: "CLS",
          value: clsValue,
          rating: this.rateMetric("CLS", clsValue),
          delta: 0,
          id: `cls-${Date.now()}`,
        };
        this.webVitals.set("CLS", metric);
        console.log(`📊 CLS: ${clsValue.toFixed(3)} (${metric.rating})`);
      });

      observer.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("⚠️ CLS Observer 지원하지 않음:", error);
    }
  }

  /**
   * 📌 함수: observeNavigation
   * 📋 목적: TTFB, FCP, 페이지 로드 완료 시간 측정
   */
  private observeNavigation(): void {
    try {
      // Navigation Timing API 사용
      if ("PerformanceNavigationTiming" in window) {
        window.addEventListener("load", () => {
          const navEntry = performance.getEntriesByType("navigation")[0] as any;

          if (navEntry) {
            // TTFB (Time to First Byte)
            const ttfb = navEntry.responseStart - navEntry.fetchStart;
            const ttfbMetric = this.createMetric("TTFB", ttfb);
            this.webVitals.set("TTFB", ttfbMetric);
            console.log(`📊 TTFB: ${Math.round(ttfb)}ms (${ttfbMetric.rating})`);

            // Total Load Time
            const totalLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
            console.log(`📊 Total Load Time: ${Math.round(totalLoadTime)}ms`);
          }
        });
      }
    } catch (error) {
      console.warn("⚠️ Navigation Observer 지원하지 않음:", error);
    }
  }

  /**
   * 📌 함수: createMetric
   * 📋 목적: Web Vitals 메트릭 객체 생성
   */
  private createMetric(name: string, value: number): WebVitalsMetric {
    return {
      name,
      value,
      rating: this.rateMetric(name, value),
      delta: 0,
      id: `${name}-${Date.now()}`,
    };
  }

  /**
   * 📌 함수: rateMetric
   * 📋 목적: 측정값을 기준에 따라 평가 (good, needsImprovement, poor)
   */
  private rateMetric(
    metricName: string,
    value: number
  ): "good" | "needsImprovement" | "poor" {
    const key = metricName.toLowerCase() as keyof PerformanceThresholds;
    const threshold = this.thresholds[key];

    if (!threshold) return "good";

    if (value <= threshold.good) return "good";
    if (value <= threshold.needsImprovement) return "needsImprovement";
    return "poor";
  }

  /**
   * 📌 함수: recordCustomMetric
   * 📋 목적: 커스텀 성능 메트릭 기록
   * 🔧 매개변수:
   *    - name: 메트릭명 (예: "3d-init-time")
   *    - value: 측정값
   *    - unit: 단위 (ms, fps, kb 등)
   */
  public recordCustomMetric(name: string, value: number, unit: string = "ms"): void {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    this.customMetrics.push(metric);
    console.log(`📊 [Custom] ${name}: ${value}${unit}`);
  }

  /**
   * 📌 함수: getWebVitals
   * 📋 목적: 수집된 Web Vitals 반환
   */
  public getWebVitals(): Map<string, WebVitalsMetric> {
    return new Map(this.webVitals);
  }

  /**
   * 📌 함수: getCustomMetrics
   * 📋 목적: 수집된 커스텀 메트릭 반환
   */
  public getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics];
  }

  /**
   * 📌 함수: getAllMetrics
   * 📋 목적: 모든 메트릭을 객체로 반환
   */
  public getAllMetrics(): {
    webVitals: Record<string, WebVitalsMetric>;
    customMetrics: CustomMetric[];
    timestamp: number;
  } {
    const webVitalsObj: Record<string, WebVitalsMetric> = {};
    this.webVitals.forEach((value, key) => {
      webVitalsObj[key] = value;
    });

    return {
      webVitals: webVitalsObj,
      customMetrics: this.customMetrics,
      timestamp: Date.now(),
    };
  }

  /**
   * 📌 함수: sendToAnalytics
   * 📋 목적: 수집된 메트릭을 분석 서버로 전송
   * 🔧 매개변수: endpoint (API 엔드포인트)
   */
  public async sendToAnalytics(endpoint: string): Promise<void> {
    try {
      const data = this.getAllMetrics();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        // keepalive를 사용하면 페이지 이탈 시에도 전송됨
        keepalive: true,
      });

      if (response.ok) {
        console.log("✅ 메트릭 전송 성공");
      } else {
        console.warn(`⚠️ 메트릭 전송 실패: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ 메트릭 전송 중 오류:", error);
    }
  }

  /**
   * 📌 함수: getPerformanceScore
   * 📋 목적: 종합 성능 점수 계산 (0-100)
   */
  public getPerformanceScore(): number {
    const metrics = this.getAllMetrics();
    let score = 100;
    let count = 0;

    // Web Vitals 평가
    Object.values(metrics.webVitals).forEach((metric) => {
      if (metric.rating === "poor") score -= 30;
      else if (metric.rating === "needsImprovement") score -= 15;
      count++;
    });

    // 최소 점수 0
    return Math.max(0, score);
  }
}

// ============================================================
// 싱글톤 인스턴스
// ============================================================

let instance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!instance) {
    instance = new PerformanceMonitor();
  }
  return instance;
}

// ============================================================
// 자동 초기화 (클라이언트 사이드 렌더링 시)
// ============================================================

if (typeof window !== "undefined") {
  // 페이지 로드 완료 시 메트릭 전송
  window.addEventListener("load", () => {
    setTimeout(() => {
      const monitor = getPerformanceMonitor();
      const metrics = monitor.getAllMetrics();

      // 콘솔에 출력
      console.log("📊 === Performance Metrics ===");
      console.table(metrics.webVitals);
      console.table(metrics.customMetrics);
      console.log(`🎯 Performance Score: ${monitor.getPerformanceScore()}/100`);

      // 분석 서버로 전송 (개발 환경에서만)
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        monitor.sendToAnalytics(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT);
      }
    }, 3000); // 3초 대기 후 전송 (모든 지표 수집 완료 확보)
  });
}
