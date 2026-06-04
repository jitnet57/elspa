# ============================================================
# 📌 네트워크 분석 서비스
# 📋 목적: Python 백엔드에서 그래프 분석 및 캐싱
# 🔧 기능: 중심성, 클러스터링, 경로 분석, 캐싱
# 📅 작성일: 2025-05-29
# ============================================================

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import logging
import numpy as np
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

# ============================================================
# 📊 데이터 클래스
# ============================================================


@dataclass
class Node:
    """그래프 노드"""

    id: str
    label: str
    node_type: str
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class Edge:
    """그래프 엣지"""

    source: str
    target: str
    weight: float = 1.0
    edge_type: Optional[str] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class CentralityResult:
    """중심성 분석 결과"""

    node_id: str
    degree: int
    weighted_degree: float
    centrality: float

    def to_dict(self):
        return asdict(self)


@dataclass
class ClusterResult:
    """클러스터링 결과"""

    node_id: str
    cluster_id: int
    distance: float

    def to_dict(self):
        return asdict(self)


@dataclass
class PathResult:
    """경로 분석 결과"""

    path: List[str]
    hops: int
    strength: float

    def to_dict(self):
        return asdict(self)


# ============================================================
# 💾 캐시 관리자
# ============================================================


class AnalysisCache:
    """분석 결과 캐시 (메모리 기반)"""

    def __init__(self, ttl_minutes: int = 30):
        self.cache: Dict[str, Tuple[any, datetime]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)

    def get(self, key: str) -> Optional[any]:
        """캐시에서 값 조회"""
        if key not in self.cache:
            return None

        value, timestamp = self.cache[key]
        if datetime.now() - timestamp > self.ttl:
            del self.cache[key]
            return None

        return value

    def set(self, key: str, value: any):
        """캐시에 값 저장"""
        self.cache[key] = (value, datetime.now())
        logger.info(f"💾 캐시 저장: {key}")

    def clear(self):
        """캐시 전체 삭제"""
        self.cache.clear()
        logger.info("🗑️  캐시 전체 삭제")

    def stats(self) -> Dict:
        """캐시 통계"""
        return {
            "total_items": len(self.cache),
            "ttl_minutes": self.ttl.total_seconds() / 60,
        }


# ============================================================
# 📊 네트워크 분석 서비스
# ============================================================


class NetworkAnalysisService:
    """
    네트워크 분석 메인 서비스

    기능:
    1. Degree Centrality 계산
    2. K-means 클러스터링
    3. 경로 찾기 (BFS/DFS)
    4. 강도 통계
    5. 결과 캐싱
    """

    def __init__(self, cache_ttl_minutes: int = 30):
        self.cache = AnalysisCache(ttl_minutes=cache_ttl_minutes)
        self.nodes: List[Node] = []
        self.edges: List[Edge] = []
        self.last_update = datetime.now()

    # ============================================================
    # 📥 데이터 로드
    # ============================================================

    def load_nodes(self, nodes: List[Dict]):
        """노드 데이터 로드"""
        self.nodes = [
            Node(
                id=n["id"],
                label=n.get("label", n["id"]),
                node_type=n.get("type", "unknown"),
                x=n.get("x"),
                y=n.get("y"),
                z=n.get("z"),
            )
            for n in nodes
        ]
        self.cache.clear()  # 데이터 변경 시 캐시 초기화
        self.last_update = datetime.now()
        logger.info(f"📥 {len(self.nodes)} 개 노드 로드됨")

    def load_edges(self, edges: List[Dict]):
        """엣지 데이터 로드"""
        self.edges = [
            Edge(
                source=e["source"],
                target=e["target"],
                weight=e.get("weight", 1.0),
                edge_type=e.get("type"),
            )
            for e in edges
        ]
        self.cache.clear()
        self.last_update = datetime.now()
        logger.info(f"📥 {len(self.edges)} 개 엣지 로드됨")

    def add_edge(self, source: str, target: str, weight: float = 1.0):
        """엣지 추가"""
        self.edges.append(Edge(source=source, target=target, weight=weight))
        self.cache.clear()
        logger.info(f"➕ 엣지 추가: {source} -> {target}")

    def add_node(self, node_id: str, label: str, node_type: str):
        """노드 추가"""
        self.nodes.append(Node(id=node_id, label=label, node_type=node_type))
        self.cache.clear()
        logger.info(f"➕ 노드 추가: {node_id}")

    # ============================================================
    # 🔍 중심성 분석
    # ============================================================

    def calculate_degree_centrality(self) -> List[CentralityResult]:
        """
        Degree Centrality 계산

        각 노드의 차수(연결된 엣지 수)를 계산하고 정규화
        반환값: 중심성 기준 내림차순 정렬
        """
        cache_key = "centrality"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        centrality_map: Dict[str, CentralityResult] = {}

        # 초기화
        for node in self.nodes:
            centrality_map[node.id] = CentralityResult(
                node_id=node.id,
                degree=0,
                weighted_degree=0.0,
                centrality=0.0,
            )

        # 엣지 순회
        for edge in self.edges:
            if edge.source in centrality_map:
                centrality_map[edge.source].degree += 1
                centrality_map[edge.source].weighted_degree += edge.weight

            if edge.target in centrality_map:
                centrality_map[edge.target].degree += 1
                centrality_map[edge.target].weighted_degree += edge.weight

        # 정규화
        max_degree = max((c.degree for c in centrality_map.values()), default=1)
        for result in centrality_map.values():
            result.centrality = result.degree / max_degree if max_degree > 0 else 0

        # 정렬
        results = sorted(centrality_map.values(), key=lambda x: x.degree, reverse=True)
        self.cache.set(cache_key, results)
        logger.info(f"📊 중심성 계산 완료 ({len(results)} 노드)")
        return results

    # ============================================================
    # 🎯 클러스터링
    # ============================================================

    def cluster_nodes_kmeans(self, k: int = 4, max_iterations: int = 100) -> List[ClusterResult]:
        """
        K-means 클러스터링

        노드의 2D 위치 기반으로 K개 클러스터로 분할

        파라미터:
        - k: 클러스터 수
        - max_iterations: 최대 반복 횟수

        반환값: 각 노드의 클러스터 할당
        """
        cache_key = f"clusters_k{k}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # 좌표 있는 노드만
        nodes_with_coords = [n for n in self.nodes if n.x is not None and n.y is not None]

        if not nodes_with_coords:
            # 위치 데이터 없으면 균등 분배
            results = [
                ClusterResult(node_id=n.id, cluster_id=i % k, distance=0.0)
                for i, n in enumerate(self.nodes)
            ]
            self.cache.set(cache_key, results)
            return results

        if k >= len(nodes_with_coords):
            results = [
                ClusterResult(node_id=n.id, cluster_id=i, distance=0.0)
                for i, n in enumerate(nodes_with_coords)
            ]
            self.cache.set(cache_key, results)
            return results

        # 초기 중심점 선택 (랜덤)
        np.random.seed(42)
        initial_indices = np.random.choice(len(nodes_with_coords), k, replace=False)
        centroids = np.array(
            [[nodes_with_coords[i].x, nodes_with_coords[i].y] for i in initial_indices]
        )

        # K-means 반복
        for iteration in range(max_iterations):
            # 각 노드를 가장 가까운 중심점에 할당
            coords = np.array([[n.x, n.y] for n in nodes_with_coords])
            distances = np.linalg.norm(coords[:, np.newaxis] - centroids, axis=2)
            assignments = np.argmin(distances, axis=1)

            # 새로운 중심점 계산
            new_centroids = []
            for c in range(k):
                cluster_indices = np.where(assignments == c)[0]
                if len(cluster_indices) > 0:
                    new_centroids.append(coords[cluster_indices].mean(axis=0))
                else:
                    new_centroids.append(centroids[c])
            new_centroids = np.array(new_centroids)

            # 수렴 확인
            if np.allclose(centroids, new_centroids, atol=0.01):
                logger.info(f"🎯 K-means 수렴 (반복: {iteration + 1})")
                break

            centroids = new_centroids

        # 최종 결과
        coords = np.array([[n.x, n.y] for n in nodes_with_coords])
        distances = np.linalg.norm(coords[:, np.newaxis] - centroids, axis=2)
        final_assignments = np.argmin(distances, axis=1)
        final_distances = np.min(distances, axis=1)

        results = [
            ClusterResult(
                node_id=nodes_with_coords[i].id,
                cluster_id=int(final_assignments[i]),
                distance=float(final_distances[i]),
            )
            for i in range(len(nodes_with_coords))
        ]

        # 좌표 없는 노드 추가
        nodes_without_coords = [n for n in self.nodes if n.x is None or n.y is None]
        for i, node in enumerate(nodes_without_coords):
            results.append(ClusterResult(node_id=node.id, cluster_id=i % k, distance=0.0))

        self.cache.set(cache_key, results)
        logger.info(f"🎯 K-means 클러스터링 완료 (k={k})")
        return results

    # ============================================================
    # 🛤️ 경로 분석
    # ============================================================

    def find_all_paths(
        self, source: str, target: str, max_depth: int = 3
    ) -> List[PathResult]:
        """
        A에서 B로 가는 모든 경로 찾기 (BFS)

        파라미터:
        - source: 시작 노드
        - target: 종료 노드
        - max_depth: 최대 깊이

        반환값: 경로 리스트 (홉 수 기준 정렬)
        """
        # 인접 리스트 생성
        adjacency: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        for edge in self.edges:
            adjacency[edge.source].append((edge.target, edge.weight))
            adjacency[edge.target].append((edge.source, edge.weight))  # 양방향

        paths = []

        def dfs(current: str, target: str, path: List[str], depth: int, strength: float):
            """깊이 우선 탐색"""
            if depth > max_depth:
                return
            if current == target and len(path) > 1:
                avg_strength = strength / (len(path) - 1)
                paths.append(PathResult(path=path[:], hops=len(path) - 1, strength=avg_strength))
                return

            for next_node, weight in adjacency[current]:
                if next_node not in path:
                    path.append(next_node)
                    dfs(next_node, target, path, depth + 1, strength + weight)
                    path.pop()

        dfs(source, target, [source], 0, 0)
        logger.info(f"🛤️  경로 찾기: {source} -> {target}, 발견된 경로: {len(paths)}")
        return sorted(paths, key=lambda x: (x.hops, -x.strength))

    # ============================================================
    # 📊 통계
    # ============================================================

    def get_network_stats(self) -> Dict:
        """네트워크 통계 계산"""
        if not self.edges:
            return {
                "total_nodes": len(self.nodes),
                "total_edges": 0,
                "average_weight": 0,
                "max_weight": 0,
                "min_weight": 0,
                "density": 0,
                "top_central_nodes": [],
            }

        weights = [e.weight for e in self.edges]
        avg_weight = sum(weights) / len(weights)
        max_weight = max(weights)
        min_weight = min(weights)

        # 밀도 = 2|E| / |V|(|V|-1)
        n = len(self.nodes)
        density = (2 * len(self.edges)) / (n * (n - 1)) if n > 1 else 0

        # 상위 중심 노드
        centrality = self.calculate_degree_centrality()
        top_central = [asdict(c) for c in centrality[:5]]

        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "average_weight": avg_weight,
            "max_weight": max_weight,
            "min_weight": min_weight,
            "density": density,
            "top_central_nodes": top_central,
        }

    def get_edge_weight_histogram(self, buckets: int = 10) -> List[Dict]:
        """엣지 강도 히스토그램"""
        if not self.edges:
            return []

        weights = [e.weight for e in self.edges]
        max_weight = max(weights)
        min_weight = min(weights)
        bucket_size = (max_weight - min_weight) / buckets if buckets > 0 else 1

        histogram = []
        for i in range(buckets):
            start = min_weight + i * bucket_size
            end = start + bucket_size
            count = sum(1 for w in weights if start <= w < end)
            histogram.append(
                {
                    "range": f"{start:.2f}-{end:.2f}",
                    "count": count,
                }
            )

        return histogram

    # ============================================================
    # 🔧 유틸리티
    # ============================================================

    def get_paths_from_node(
        self, node_id: str, max_hops: int = 3
    ) -> Dict[str, any]:
        """특정 노드에서 출발하는 모든 경로"""
        hops_map: Dict[str, int] = {}
        visited_edges: set = set()

        # BFS
        queue = deque([(node_id, 0)])
        visited = set()

        while queue:
            current, hops = queue.popleft()

            if current in visited or hops >= max_hops:
                continue
            visited.add(current)
            hops_map[current] = hops

            # 인접 노드 탐색
            for edge in self.edges:
                if edge.source == current:
                    visited_edges.add(f"{edge.source}-{edge.target}")
                    if edge.target not in visited:
                        queue.append((edge.target, hops + 1))

                if edge.target == current:
                    visited_edges.add(f"{edge.target}-{edge.source}")
                    if edge.source not in visited:
                        queue.append((edge.source, hops + 1))

        return {
            "node_id": node_id,
            "edge_ids": list(visited_edges),
            "hops": hops_map,
        }

    def export_data(self) -> Dict:
        """전체 네트워크 데이터 내보내기"""
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "last_update": self.last_update.isoformat(),
            "stats": self.get_network_stats(),
        }
