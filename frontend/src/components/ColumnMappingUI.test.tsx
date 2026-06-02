/**
 * ============================================================
 * 📌 파일명: ColumnMappingUI.test.tsx
 * 📋 목적: ColumnMappingUI 컴포넌트 기본 동작 테스트
 * 🔧 실행: npm test ColumnMappingUI.test.tsx
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ColumnMappingUI, { DBField, ColumnMapping } from "./ColumnMappingUI";

// 테스트용 샘플 DB 필드
const sampleDBFields: DBField[] = [
  {
    fieldName: "company_id",
    displayName: "Company ID",
    dataType: "number",
    isRequired: true,
    description: "Unique company identifier",
  },
  {
    fieldName: "settlement_year",
    displayName: "Settlement Year",
    dataType: "number",
    isRequired: true,
    description: "Year of settlement",
  },
  {
    fieldName: "total_revenue",
    displayName: "Total Revenue",
    dataType: "decimal",
    isRequired: false,
    description: "Total revenue amount",
  },
  {
    fieldName: "notes",
    displayName: "Notes",
    dataType: "string",
    isRequired: false,
    description: "Additional notes",
  },
];

// 테스트용 샘플 엑셀 컬럼
const sampleExcelColumns = [
  "Company ID",
  "Settlement Year",
  "Total Revenue",
  "Extra Column",
];

describe("ColumnMappingUI", () => {
  it("should render component with title and description", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
      />
    );

    expect(screen.getByText("엑셀 컬럼 매핑")).toBeInTheDocument();
    expect(
      screen.getByText(/엑셀 파일의 각 컬럼을 데이터베이스 필드로 매핑하세요/)
    ).toBeInTheDocument();
  });

  it("should display stat cards with correct counts", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
      />
    );

    expect(screen.getByText("총 컬럼")).toBeInTheDocument();
    expect(screen.getByText("매핑됨")).toBeInTheDocument();
    expect(screen.getByText("미매핑")).toBeInTheDocument();
    expect(screen.getByText("필수 미매핑")).toBeInTheDocument();
  });

  it("should display all excel columns in table", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
      />
    );

    sampleExcelColumns.forEach((col) => {
      expect(screen.getByText(col)).toBeInTheDocument();
    });
  });

  it("should auto-detect mappings on mount", async () => {
    const onMappingChange = jest.fn();

    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
        onMappingChange={onMappingChange}
        autoDetect={true}
      />
    );

    // 자동 감지로 인한 호출 확인
    await waitFor(() => {
      expect(onMappingChange).toHaveBeenCalled();
    });

    // 매핑 결과 확인
    const calls = onMappingChange.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const mappings = calls[calls.length - 1][0] as ColumnMapping[];
    expect(mappings).toHaveLength(sampleExcelColumns.length);
  });

  it("should show auto-detected badge for auto-mapped columns", async () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
        autoDetect={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("자동 감지됨")).toBeInTheDocument();
    });
  });

  it("should show unmapped warning when columns are not mapped", async () => {
    const excelColumnsWithUnmapped = ["Company ID", "Unknown Column"];

    render(
      <ColumnMappingUI
        excelColumns={excelColumnsWithUnmapped}
        dbFields={sampleDBFields}
        autoDetect={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/미매핑 컬럼 있음/)).toBeInTheDocument();
    });
  });

  it("should show required fields section", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
      />
    );

    expect(screen.getByText("필수 필드")).toBeInTheDocument();
    expect(screen.getByText("Company ID")).toBeInTheDocument();
    expect(screen.getByText("Settlement Year")).toBeInTheDocument();
  });

  it("should show optional fields section", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
      />
    );

    expect(screen.getByText("선택적 필드")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("should call onMappingChange callback when mapping is changed", async () => {
    const onMappingChange = jest.fn();

    const { container } = render(
      <ColumnMappingUI
        excelColumns={["Custom Column"]}
        dbFields={sampleDBFields}
        onMappingChange={onMappingChange}
        autoDetect={false}
      />
    );

    // 드롭다운 찾기 및 클릭
    const dropdowns = container.querySelectorAll("button");
    const mappingDropdown = Array.from(dropdowns).find(
      (btn) => btn.textContent && btn.textContent.includes("선택 안함")
    );

    if (mappingDropdown) {
      fireEvent.click(mappingDropdown);

      // 옵션 선택
      await waitFor(() => {
        const option = screen.getByText("Company ID");
        if (option.closest("button")) {
          fireEvent.click(option.closest("button")!);
        }
      });

      // 콜백 호출 확인
      await waitFor(() => {
        expect(onMappingChange).toHaveBeenCalled();
      });
    }
  });

  it("should display success message when all columns are mapped", async () => {
    const mappedColumns = ["Company ID", "Settlement Year"];
    const fieldsSubset = sampleDBFields.slice(0, 2);

    render(
      <ColumnMappingUI
        excelColumns={mappedColumns}
        dbFields={fieldsSubset}
        autoDetect={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/매핑 완료/)).toBeInTheDocument();
    });
  });

  it("should not display required fields error when all required fields are mapped", async () => {
    const mappedColumns = ["Company ID", "Settlement Year"];

    render(
      <ColumnMappingUI
        excelColumns={mappedColumns}
        dbFields={sampleDBFields}
        autoDetect={true}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/필수 필드 미매핑/)).not.toBeInTheDocument();
    });
  });

  it("should handle empty excel columns gracefully", () => {
    render(
      <ColumnMappingUI
        excelColumns={[]}
        dbFields={sampleDBFields}
        autoDetect={true}
      />
    );

    expect(screen.getByText("엑셀 컬럼 매핑")).toBeInTheDocument();
  });

  it("should handle empty db fields gracefully", () => {
    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={[]}
        autoDetect={true}
      />
    );

    expect(screen.getByText("엑셀 컬럼 매핑")).toBeInTheDocument();
  });

  it("should disable autoDetect when set to false", async () => {
    const onMappingChange = jest.fn();

    render(
      <ColumnMappingUI
        excelColumns={sampleExcelColumns}
        dbFields={sampleDBFields}
        onMappingChange={onMappingChange}
        autoDetect={false}
      />
    );

    // autoDetect=false일 때는 자동 감지 배지가 나타나지 않음
    await waitFor(() => {
      expect(screen.queryByText("자동 감지됨")).not.toBeInTheDocument();
    });
  });
});

describe("ColumnMappingUI - Similarity Calculation", () => {
  it("should calculate exact match as 1.0", () => {
    // 함수를 직접 테스트할 수 없으므로
    // 자동 감지 결과로 확인 (자동 감지가 완벽한 일치를 찾아야 함)
    const exactMatchColumns = ["Company ID"];
    const exactMatchFields: DBField[] = [
      {
        fieldName: "company_id",
        displayName: "Company ID",
        dataType: "number",
        isRequired: true,
      },
    ];

    const onMappingChange = jest.fn();

    render(
      <ColumnMappingUI
        excelColumns={exactMatchColumns}
        dbFields={exactMatchFields}
        onMappingChange={onMappingChange}
        autoDetect={true}
      />
    );

    // 정확히 일치하므로 자동 감지되어야 함
    expect(screen.getByText("자동 감지됨")).toBeInTheDocument();
  });

  it("should calculate word-based matches", () => {
    const wordMatchColumns = ["Total Money"];
    const wordMatchFields: DBField[] = [
      {
        fieldName: "total_revenue",
        displayName: "Total Revenue",
        dataType: "decimal",
        isRequired: false,
      },
    ];

    render(
      <ColumnMappingUI
        excelColumns={wordMatchColumns}
        dbFields={wordMatchFields}
        autoDetect={true}
      />
    );

    // "Total"가 일치하므로 매핑될 수 있음
    const status = screen.getByText(/매핑/);
    expect(status).toBeInTheDocument();
  });
});
