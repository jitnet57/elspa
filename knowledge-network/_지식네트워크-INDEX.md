---
title: 앱 지식 네트워크 (Obsidian)
tags: [knowledge-network, MOC]
---

# 🕸️ ElSpa 앱 지식 네트워크 — Obsidian 버전

> 앱의 `/admin/knowledge-network` · `/network-graph` 데모 데이터(15노드)를 Obsidian 그래프로 옮긴 것.
> `Cmd+G` 그래프 뷰에서 카테고리별로 연결된 네트워크가 보입니다.

**노드 15 · 엣지 20**

## 🔵 서비스 (3)
- [[타이마사지]]
- [[아로마테라피]]
- [[스포츠마사지]]

## 🟢 치료사 (3)
- [[존 (John)]]
- [[마리아 (Maria)]]
- [[알렉스 (Alex)]]

## 🟠 고객 (3)
- [[기업 고객]]
- [[요양원 이용자]]
- [[개인 고객]]

## 🟣 조직 (3)
- [[비즈니스 스파]]
- [[요양원]]
- [[프랜차이즈 네트워크]]

## 🔴 KPI (3)
- [[매출]]
- [[고객 유지율]]
- [[서비스 품질]]

## 🗺️ 네트워크 미리보기 (Mermaid)

> 🔵서비스 🟢치료사 🟠고객 🟣조직 🔴KPI

```mermaid
graph TD
  n0["타이마사지"]:::svc
  n1["아로마테라피"]:::svc
  n2["스포츠마사지"]:::svc
  n3["존 (John)"]:::thr
  n4["마리아 (Maria)"]:::thr
  n5["알렉스 (Alex)"]:::thr
  n6["기업 고객"]:::cus
  n7["요양원 이용자"]:::cus
  n8["개인 고객"]:::cus
  n9["비즈니스 스파"]:::org
  n10["요양원"]:::org
  n11["프랜차이즈 네트워크"]:::org
  n12["매출"]:::kpi
  n13["고객 유지율"]:::kpi
  n14["서비스 품질"]:::kpi
  n0 --- n3
  n1 --- n4
  n2 --- n5
  n3 --- n6
  n4 --- n7
  n5 --- n8
  n6 --- n9
  n7 --- n10
  n8 --- n11
  n9 --- n0
  n9 --- n1
  n11 --- n2
  n12 --- n14
  n12 --- n13
  n13 --- n14
  n14 --- n3
  n14 --- n4
  n14 --- n5
  n13 --- n6
  n12 --- n9
  classDef svc fill:#3b82f6,color:#fff,stroke:#1e40af;
  classDef thr fill:#10b981,color:#fff,stroke:#047857;
  classDef cus fill:#f97316,color:#fff,stroke:#c2410c;
  classDef org fill:#a855f7,color:#fff,stroke:#7e22ce;
  classDef kpi fill:#ef4444,color:#fff,stroke:#b91c1c;
```

---
← [[🧠-KNOWLEDGE-NETWORK-OBSIDIAN]] (문서 지식맵)
