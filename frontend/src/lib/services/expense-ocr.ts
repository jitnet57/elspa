/**
 * 비용 분석 엔진
 * OCR + AI 기반 영수증 자동 분류 및 처리
 */

import { ExpenseRecord } from '@/lib/store/types';

interface OcrResult {
  text: string;
  amount: number;
  date: string;
  vendor: string;
}

interface AiClassificationResult {
  category: string;
  confidence: number;
  tags: string[];
}

export class ExpenseOCRService {
  // 이미지 파일에서 OCR로 텍스트 추출
  static async extractTextFromImage(imageFile: File): Promise<OcrResult | null> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) return null;

      const result: OcrResult = await response.json();
      return result;
    } catch (error) {
      console.error('OCR 추출 실패:', error);
      return null;
    }
  }

  // AI를 이용한 카테고리 자동 분류
  static async classifyExpense(text: string, amount: number): Promise<AiClassificationResult | null> {
    try {
      const response = await fetch('/api/ai/classify-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          amount,
          context: this.buildContext(text, amount),
        }),
      });

      if (!response.ok) return null;

      const result: AiClassificationResult = await response.json();
      return result;
    } catch (error) {
      console.error('AI 분류 실패:', error);
      return null;
    }
  }

  // 영수증 이미지를 자동으로 처리해서 ExpenseRecord 생성
  static async processReceiptImage(imageFile: File, date: string): Promise<Omit<ExpenseRecord, 'id'> | null> {
    try {
      // 1. OCR로 텍스트 추출
      const ocrResult = await this.extractTextFromImage(imageFile);
      if (!ocrResult) return null;

      // 2. AI로 카테고리 분류
      const classification = await this.classifyExpense(ocrResult.text, ocrResult.amount);

      // 3. ExpenseRecord 생성
      return {
        date,
        category: classification?.category || '기타',
        amount: ocrResult.amount,
        description: ocrResult.vendor || '영수증',
        ocr_text: ocrResult.text,
        ai_category: classification?.category,
        verified: false,
        tags: classification?.tags || [],
      };
    } catch (error) {
      console.error('영수증 처리 실패:', error);
      return null;
    }
  }

  // 대량 영수증 처리 (배치)
  static async processBatchReceipts(
    files: File[],
    date: string,
    onProgress?: (progress: number) => void
  ): Promise<Omit<ExpenseRecord, 'id'>[]> {
    const results: Omit<ExpenseRecord, 'id'>[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.processReceiptImage(files[i], date);
      if (result) {
        results.push(result);
      }

      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    }

    return results;
  }

  // 월별 카테고리별 비용 통계
  static calculateCategoryBreakdown(expenses: ExpenseRecord[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    expenses.forEach(exp => {
      const category = exp.ai_category || exp.category;
      breakdown[category] = (breakdown[category] || 0) + exp.amount;
    });

    return breakdown;
  }

  // 예산 대비 실제 지출 비교
  static calculateBudgetVariance(
    expenses: ExpenseRecord[],
    budget: Record<string, number>
  ): Record<string, { actual: number; budgeted: number; variance: number; percentage: number }> {
    const breakdown = this.calculateCategoryBreakdown(expenses);
    const results: Record<string, any> = {};

    Object.entries(budget).forEach(([category, budgeted]) => {
      const actual = breakdown[category] || 0;
      const variance = budgeted - actual;
      const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;

      results[category] = {
        actual,
        budgeted,
        variance,
        percentage: Math.round(percentage),
      };
    });

    return results;
  }

  // 의심스러운 비용 감지 (이상 탐지)
  static detectAnomalies(
    expenses: ExpenseRecord[],
    threshold: number = 2 // 평균의 2배 이상을 이상값으로 판정
  ): ExpenseRecord[] {
    if (expenses.length < 3) return [];

    const amounts = expenses.map(e => e.amount);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length
    );

    return expenses.filter(exp => Math.abs(exp.amount - average) > threshold * stdDev);
  }

  private static buildContext(text: string, amount: number): string {
    const keywords = {
      restaurant: ['식당', '카페', '음식', '식사', '레스토랑', '커피'],
      transport: ['택시', '버스', '기차', '항공', '주유', '휘발유', '차량'],
      office: ['사무용품', '프린터', '종이', '펜', '의자'],
      utility: ['전기', '가스', '물', '인터넷', '통신'],
      rent: ['임차료', '월세', '임대료', '건물'],
    };

    let context = '';
    Object.entries(keywords).forEach(([key, words]) => {
      if (words.some(w => text.toLowerCase().includes(w))) {
        context += key + ' ';
      }
    });

    return context || 'unknown';
  }
}
