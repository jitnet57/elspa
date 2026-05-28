// ============================================================
// 📌 네트워크 분석 알고리즘 라이브러리
// 📋 목적: 중심성, 클러스터링, 경로 분석 등 고급 그래프 분석
// 🔧 포함: Degree Centrality, K-means Clustering, Path Finding
// 📅 작성일: 2025-05-29
// ============================================================

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
  type?: string;
}

export interface CentralityResult {
  nodeId: string;
  degree: number;
  weightedDegree?: number;
  centrality: number;
}

export interface ClusterResult {
  nodeId: string;
  clusterId: number;
  distance: number;
}

export interface PathResult {
  path: string[];
  hops: number;
  strength: number;
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  averageWeight: number;
  maxWeight: number;
  minWeight: number;
  density: number;
  topCentralNodes: CentralityResult[];
}

// ============================================================
// 🔍 Degree Centrality (차수 중심성)
// 각 노드의 연결선 개수를 계산
// ============================================================
export function calculateDegreeCentrality(
  nodes: GraphNode[],
  edges: GraphEdge[]
): CentralityResult[] {
  const centrality: Map<string, CentralityResult> = new Map();

  // 초기화
  nodes.forEach((node) => {
    centrality.set(node.id, {
      nodeId: node.id,
      degree: 0,
      weightedDegree: 0,
      centrality: 0,
    });
  });

  // 엣지 순회
  edges.forEach((edge) => {
    const source = centrality.get(edge.source);
    const target = centrality.get(edge.target);
    const weight = edge.weight || 1;

    if (source) {
      source.degree += 1;
      source.weightedDegree = (source.weightedDegree || 0) + weight;
    }
    if (target) {
      target.degree += 1;
      target.weightedDegree = (target.weightedDegree || 0) + weight;
    }
  });

  // 정규화 (0~1)
  const maxDegree = Math.max(...Array.from(centrality.values()).map((c) => c.degree));
  centrality.forEach((value) => {
    value.centrality = maxDegree > 0 ? value.degree / maxDegree : 0;
  });

  return Array.from(centrality.values()).sort((a, b) => b.degree - a.degree);
}

// ============================================================
// 🎯 K-means Clustering (노드 그룹화)
// 노드 위치 기반 K개의 클러스터로 분할
// ============================================================
export function clusterNodesKMeans(
  nodes: GraphNode[],
  k: number = 4,
  maxIterations: number = 100
): ClusterResult[] {
  // 유효성 검사
  if (nodes.length === 0) return [];
  if (k >= nodes.length) {
    return nodes.map((node, i) => ({
      nodeId: node.id,
      clusterId: i,
      distance: 0,
    }));
  }

  // 좌표 있는 노드만 필터링
  const nodesWithCoords = nodes.filter((n) => n.x !== undefined && n.y !== undefined);
  if (nodesWithCoords.length === 0) {
    // 위치 데이터 없으면 랜덤 배치
    return nodes.map((node, i) => ({
      nodeId: node.id,
      clusterId: i % k,
      distance: 0,
    }));
  }

  // 초기 중심점 선택 (랜덤)
  let centroids: Array<{ x: number; y: number }> = [];
  const selectedIndices = new Set<number>();
  while (centroids.length < k && selectedIndices.size < nodesWithCoords.length) {
    const idx = Math.floor(Math.random() * nodesWithCoords.length);
    if (!selectedIndices.has(idx)) {
      selectedIndices.add(idx);
      const node = nodesWithCoords[idx];
      centroids.push({ x: node.x!, y: node.y! });
    }
  }

  // K-means 반복
  let assignments: Array<{ nodeId: string; clusterId: number; distance: number }> = [];
  for (let iter = 0; iter < maxIterations; iter++) {
    // 1단계: 각 노드를 가장 가까운 중심점에 할당
    assignments = nodesWithCoords.map((node) => {
      let minDist = Infinity;
      let clusterId = 0;
      centroids.forEach((centroid, idx) => {
        const dist = Math.sqrt(
          Math.pow(node.x! - centroid.x, 2) + Math.pow(node.y! - centroid.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          clusterId = idx;
        }
      });
      return {
        nodeId: node.id,
        clusterId,
        distance: minDist,
      };
    });

    // 2단계: 중심점 재계산
    const newCentroids: Array<{ x: number; y: number }> = [];
    for (let c = 0; c < k; c++) {
      const clusterNodes = assignments
        .filter((a) => a.clusterId === c)
        .map((a) => nodesWithCoords.find((n) => n.id === a.nodeId)!)
        .filter((n) => n);

      if (clusterNodes.length > 0) {
        const avgX = clusterNodes.reduce((sum, n) => sum + n.x!, 0) / clusterNodes.length;
        const avgY = clusterNodes.reduce((sum, n) => sum + n.y!, 0) / clusterNodes.length;
        newCentroids.push({ x: avgX, y: avgY });
      } else {
        // 빈 클러스터는 랜덤 노드로 초기화
        const randomNode = nodesWithCoords[Math.floor(Math.random() * nodesWithCoords.length)];
        newCentroids.push({ x: randomNode.x!, y: randomNode.y! });
      }
    }

    // 수렴 확인
    let converged = true;
    for (let c = 0; c < k; c++) {
      const dist = Math.sqrt(
        Math.pow(centroids[c].x - newCentroids[c].x, 2) +
          Math.pow(centroids[c].y - newCentroids[c].y, 2)
      );
      if (dist > 0.01) {
        converged = false;
        break;
      }
    }
    centroids = newCentroids;
    if (converged) break;
  }

  // 좌표 없는 노드들을 균형있게 배치
  const nodesWithoutCoords = nodes.filter((n) => n.x === undefined || n.y === undefined);
  let clusterIndex = 0;
  nodesWithoutCoords.forEach((node) => {
    assignments.push({
      nodeId: node.id,
      clusterId: clusterIndex % k,
      distance: 0,
    });
    clusterIndex++;
  });

  return assignments;
}

// ============================================================
// 🛤️ Path Finding (경로 찾기 - BFS)
// A에서 B로 가는 모든 경로를 찾음 (깊이 제한)
// ============================================================
export function findAllPaths(
  source: string,
  target: string,
  edges: GraphEdge[],
  maxDepth: number = 3
): PathResult[] {
  const adjacencyMap: Map<string, Array<{ target: string; weight: number }>> = new Map();

  // 인접 리스트 생성
  edges.forEach((edge) => {
    if (!adjacencyMap.has(edge.source)) {
      adjacencyMap.set(edge.source, []);
    }
    const weight = edge.weight || 1;
    adjacencyMap.get(edge.source)!.push({ target: edge.target, weight });

    // 양방향 엣지 추가
    if (!adjacencyMap.has(edge.target)) {
      adjacencyMap.set(edge.target, []);
    }
    adjacencyMap.get(edge.target)!.push({ target: edge.source, weight });
  });

  const paths: PathResult[] = [];

  // DFS로 경로 탐색
  function dfs(current: string, target: string, path: string[], depth: number, strength: number) {
    if (depth > maxDepth) return;
    if (current === target && path.length > 1) {
      paths.push({
        path: [...path],
        hops: path.length - 1,
        strength: strength / (path.length - 1), // 평균 강도
      });
      return;
    }

    const neighbors = adjacencyMap.get(current) || [];
    for (const { target: next, weight } of neighbors) {
      if (!path.includes(next)) {
        dfs(next, target, [...path, next], depth + 1, strength + weight);
      }
    }
  }

  dfs(source, target, [source], 0, 0);

  return paths.sort((a, b) => a.hops - b.hops || b.strength - a.strength);
}

// ============================================================
// 🔗 Path Highlighting (경로 강조)
// 특정 노드에서 출발하는 모든 경로 계산
// ============================================================
export function getPathsFromNode(
  nodeId: string,
  edges: GraphEdge[],
  nodes: GraphNode[],
  maxHops: number = 3
): { edgeIds: string[]; hops: Map<string, number> } {
  const hopsMap: Map<string, number> = new Map();
  const visitedEdges = new Set<string>();

  // BFS로 모든 경로 탐색
  const queue: Array<{ nodeId: string; hops: number }> = [{ nodeId, hops: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId: current, hops } = queue.shift()!;

    if (visited.has(current) || hops >= maxHops) continue;
    visited.add(current);
    hopsMap.set(current, hops);

    // 현재 노드에서 출발하는 모든 엣지
    edges.forEach((edge) => {
      if (edge.source === current) {
        visitedEdges.add(`${edge.source}-${edge.target}`);
        if (!visited.has(edge.target)) {
          queue.push({ nodeId: edge.target, hops: hops + 1 });
        }
      }
      if (edge.target === current) {
        visitedEdges.add(`${edge.target}-${edge.source}`);
        if (!visited.has(edge.source)) {
          queue.push({ nodeId: edge.source, hops: hops + 1 });
        }
      }
    });
  }

  return {
    edgeIds: Array.from(visitedEdges),
    hops: hopsMap,
  };
}

// ============================================================
// 📊 Network Statistics (네트워크 통계)
// ============================================================
export function calculateNetworkStats(
  nodes: GraphNode[],
  edges: GraphEdge[]
): NetworkStats {
  const centrality = calculateDegreeCentrality(nodes, edges);
  const weights = edges.map((e) => e.weight || 1);

  const averageWeight = weights.length > 0 ? weights.reduce((a, b) => a + b) / weights.length : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;

  // 밀도 = 2 * |E| / (|V| * (|V| - 1))
  const density =
    nodes.length > 1 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0;

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    averageWeight,
    maxWeight,
    minWeight,
    density,
    topCentralNodes: centrality.slice(0, 5),
  };
}

// ============================================================
// 🎨 Path Color by Hops (홉 깊이에 따른 색상)
// ============================================================
export function getPathColor(hops: number): string {
  const colors = ['#FF0000', '#FF6600', '#FFFF00', '#00AA00', '#0000FF', '#AA00FF'];
  return colors[Math.min(hops, colors.length - 1)];
}

// ============================================================
// 📈 Edge Weight Statistics (엣지 강도 통계)
// ============================================================
export function getEdgeWeightHistogram(
  edges: GraphEdge[],
  buckets: number = 10
): Array<{ range: string; count: number }> {
  if (edges.length === 0) return [];

  const weights = edges.map((e) => e.weight || 1);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const bucketSize = (maxWeight - minWeight) / buckets;

  const histogram: Array<{ range: string; count: number }> = [];
  for (let i = 0; i < buckets; i++) {
    const start = minWeight + i * bucketSize;
    const end = start + bucketSize;
    const count = weights.filter((w) => w >= start && w < end).length;
    histogram.push({
      range: `${start.toFixed(1)}-${end.toFixed(1)}`,
      count,
    });
  }

  return histogram;
}
