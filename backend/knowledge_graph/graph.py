import json
import os
import glob
from typing import Dict, List, Optional, Set, Tuple
import networkx as nx

class ConceptKnowledgeGraph:
    """
    Manages the directed acyclic graph of concepts and prerequisites across all subjects.
    Edge direction: Prerequisite -> Dependent Concept.
    e.g., variables -> memory_addresses -> pointers -> dereferencing -> pointer_arithmetic
    """

    def __init__(self, concepts_path: Optional[str] = None):
        self.graph = nx.DiGraph()
        self.concepts_data: Dict[str, dict] = {}
        self.subject_concepts: Dict[str, List[str]] = {}
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_dir = os.path.join(base_dir, "data")
        
        if concepts_path:
            self.load_from_file(concepts_path)
        else:
            self.load_all_subjects(data_dir)

    def load_from_file(self, path: str, subject_code: str = "c_programming"):
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if subject_code not in self.subject_concepts:
            self.subject_concepts[subject_code] = []

        for item in data:
            c_id = item["id"]
            item["subject_code"] = subject_code
            self.concepts_data[c_id] = item
            self.subject_concepts[subject_code].append(c_id)
            self.graph.add_node(
                c_id,
                name=item["name"],
                module=item["module"],
                difficulty_baseline=item.get("difficulty_baseline", "medium"),
                description=item.get("description", ""),
                subject_code=subject_code
            )

        # Add directed edges: prereq -> concept
        for item in data:
            c_id = item["id"]
            for prereq in item.get("prerequisites", []):
                if prereq in self.graph:
                    self.graph.add_edge(prereq, c_id, weight=1.0)

    def load_all_subjects(self, data_dir: str):
        self.graph.clear()
        self.concepts_data.clear()
        self.subject_concepts.clear()

        subject_files = {
            "c_programming": "c_concepts.json",
            "python": "python_concepts.json",
            "mathematics": "mathematics_concepts.json",
            "data_structures": "data_structures_concepts.json",
            "computer_networks": "computer_networks_concepts.json",
            "operating_systems": "operating_systems_concepts.json",
            "database_systems": "database_systems_concepts.json",
        }

        for subj_code, filename in subject_files.items():
            path = os.path.join(data_dir, filename)
            if os.path.exists(path):
                self.load_from_file(path, subj_code)

    def get_prerequisites(self, concept_id: str) -> List[str]:
        """Returns direct prerequisites of a concept."""
        if concept_id not in self.graph:
            return []
        return list(self.graph.predecessors(concept_id))

    def get_all_prerequisites(self, concept_id: str) -> Set[str]:
        """Returns all transitive prerequisite ancestors of a concept."""
        if concept_id not in self.graph:
            return set()
        return nx.ancestors(self.graph, concept_id)

    def get_dependents(self, concept_id: str) -> List[str]:
        """Returns concepts that directly depend on this concept."""
        if concept_id not in self.graph:
            return []
        return list(self.graph.successors(concept_id))

    def analyze_prerequisite_bottleneck(
        self,
        concept_id: str,
        concept_performances: Dict[str, dict]
    ) -> Optional[Dict[str, any]]:
        """
        Traverse backward through the prerequisite graph to identify potential bottlenecks.
        If a prerequisite has low accuracy (< 60%) or is AT_RISK/CONFUSED,
        we identify it as a likely prerequisite gap.
        """
        ancestors = self.get_all_prerequisites(concept_id)
        if not ancestors:
            return None

        bottlenecks = []
        for anc_id in ancestors:
            perf = concept_performances.get(anc_id)
            anc_name = self.concepts_data.get(anc_id, {}).get("name", anc_id)
            if perf:
                accuracy = perf.get("accuracy", 100.0)
                status = perf.get("status", "DEVELOPING")
                attempts = perf.get("attempts_count", 0)
                
                # If accuracy is weak or status is CONFUSED/AT_RISK
                if accuracy < 60.0 or status in ["CONFUSED", "AT_RISK"]:
                    bottlenecks.append({
                        "prerequisite_id": anc_id,
                        "prerequisite_name": anc_name,
                        "accuracy": round(accuracy, 1),
                        "status": status,
                        "attempts": attempts,
                        "severity": (60.0 - accuracy) + (30 if status == "CONFUSED" else 10)
                    })

        if not bottlenecks:
            return None

        # Sort by severity descending
        bottlenecks.sort(key=lambda x: x["severity"], reverse=True)
        top_bottleneck = bottlenecks[0]

        evidence_str = (
            f"Prerequisite concept '{top_bottleneck['prerequisite_name']}' has an accuracy of "
            f"{top_bottleneck['accuracy']}% ({top_bottleneck['status']}). "
            f"Gaps in prerequisite knowledge frequently cascade into difficulties with {self.concepts_data.get(concept_id, {}).get('name', concept_id)}."
        )

        return {
            "prerequisite_id": top_bottleneck["prerequisite_id"],
            "prerequisite_name": top_bottleneck["prerequisite_name"],
            "accuracy": top_bottleneck["accuracy"],
            "status": top_bottleneck["status"],
            "evidence": evidence_str,
            "all_weak_ancestors": bottlenecks
        }

    def export_graph_for_visualization(
        self,
        performances: Optional[Dict[str, dict]] = None,
        subject_code: Optional[str] = None
    ) -> dict:
        """
        Formats graph nodes and edges for front-end rendering.
        Each node includes its live student state if available.
        Can be filtered by subject_code.
        """
        performances = performances or {}
        nodes = []
        
        target_nodes = set()
        if subject_code and subject_code in self.subject_concepts:
            target_nodes = set(self.subject_concepts[subject_code])
        else:
            target_nodes = set(self.graph.nodes())

        for node_id in target_nodes:
            if node_id not in self.graph:
                continue
            meta = self.concepts_data.get(node_id, {})
            perf = performances.get(node_id, {})
            status = perf.get("status", "DEVELOPING")
            accuracy = perf.get("accuracy", 0.0)
            confidence = perf.get("average_confidence", 0.0)
            attempts = perf.get("attempts_count", 0)

            # Filter prerequisites to those within target_nodes
            prereqs = [p for p in self.get_prerequisites(node_id) if p in target_nodes]

            nodes.append({
                "id": node_id,
                "name": meta.get("name", node_id),
                "module": meta.get("module", "General"),
                "status": status,
                "accuracy": round(accuracy, 1),
                "confidence": round(confidence, 1),
                "attempts": attempts,
                "prerequisites": prereqs
            })

        edges = []
        for u, v in self.graph.edges():
            if u in target_nodes and v in target_nodes:
                edges.append({
                    "from_concept": u,
                    "to_concept": v,
                    "weight": self.graph[u][v].get("weight", 1.0)
                })

        return {"nodes": nodes, "edges": edges}


# Singleton instance
knowledge_graph = ConceptKnowledgeGraph()
