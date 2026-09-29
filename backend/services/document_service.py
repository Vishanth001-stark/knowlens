import io
import re
import datetime
from typing import List, Dict, Any, Optional, Tuple
from pypdf import PdfReader
from sqlalchemy.orm import Session

from backend.models.models import Question, Subject, Concept, UploadedDocument, DiagnosticSession
from backend.knowledge_graph.graph import knowledge_graph


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extracts raw text from PDF, TXT, MD, C, PY, or other text documents."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {idx + 1} ---\n" + page_text
            if text.strip():
                return text.strip()
        except Exception as e:
            pass

    # Fallback to UTF-8 / Latin-1 decoding for text-based files
    try:
        return file_bytes.decode("utf-8", errors="replace").strip()
    except Exception:
        return file_bytes.decode("latin-1", errors="replace").strip()


SUBJECT_KEYWORD_PATTERNS = {
    "c_programming": [
        "pointer", "dereference", "malloc", "memory address", "sizeof", "printf",
        "scanf", "struct", "segmentation fault", "null pointer", "array indexing",
        "pointer arithmetic", "stack", "heap", "#include <stdio.h>", "char*", "int*"
    ],
    "python": [
        "python", "def ", "class ", "self", "lambda", "list comprehension", "tuple",
        "dictionary", "generator", "yield", "decorator", "scope legb", "mutability"
    ],
    "mathematics": [
        "calculus", "derivative", "integral", "limit", "chain rule", "continuity",
        "function", "matrix", "vector", "probability", "bayes", "differentiation"
    ],
    "data_structures": [
        "linked list", "binary search tree", "hash table", "hash map", "stack",
        "queue", "heap", "graph traversal", "bfs", "dfs", "node", "time complexity"
    ],
    "operating_systems": [
        "process", "thread", "deadlock", "mutex", "semaphore", "virtual memory",
        "paging", "page fault", "context switch", "scheduler", "cpu scheduling"
    ],
    "computer_networks": [
        "osi layer", "tcp", "udp", "ip address", "subnet", "dns", "http",
        "router", "packet", "three-way handshake", "socket", "port 80"
    ],
    "database_systems": [
        "sql", "database", "normalization", "1nf", "2nf", "3nf", "bcnf", "primary key",
        "foreign key", "acid", "transaction", "index", "b-tree", "join", "rdbms"
    ]
}


CONCEPT_KEYWORD_MAP = {
    "memory_addresses": ["memory address", "byte", "hexadecimal", "0x", "ram", "storage location"],
    "address_operator": ["address operator", "& operator", "&x", "reference"],
    "dereferencing": ["dereference", "*ptr", "value at address", "indirection"],
    "pointer_arithmetic": ["pointer arithmetic", "ptr +", "ptr++", "offset", "sizeof", "stride"],
    "arrays_and_pointers": ["array decay", "ptr to array", "arr[i]", "*(arr + i)"],
    "dynamic_memory": ["malloc", "calloc", "free", "heap", "memory leak", "realloc"],
    "structures": ["struct", "structure member", "arrow operator", "->", "typedef struct"],
    "python_mutability": ["mutable", "immutable", "in-place", "copy", "deepcopy", "list mutation"],
    "python_scopes_legb": ["scope", "global", "nonlocal", "legb", "enclosing", "local variable"],
    "python_closures": ["closure", "enclosed function", "free variable", "inner function"],
    "calc_derivatives": ["derivative", "rate of change", "slope", "tangent line", "dy/dx"],
    "calc_limits": ["limit", "approaches", "infinity", "indeterminate", "l'hopital"],
    "calc_chain_rule": ["chain rule", "composite function", "inner function", "outer function"],
    "ds_linked_lists": ["singly linked list", "doubly linked", "head", "tail", "next pointer"],
    "ds_bst": ["binary search tree", "inorder", "preorder", "postorder", "left child", "right child"],
    "net_osi_layers": ["osi model", "physical layer", "transport layer", "application layer", "network layer"],
    "net_tcp_udp": ["tcp vs udp", "reliable", "connectionless", "handshake", "packet loss"],
    "os_processes_threads": ["process vs thread", "shared memory", "thread safety", "pcb", "thread pool"],
    "os_deadlocks": ["deadlock", "mutual exclusion", "hold and wait", "circular wait", "banker's algorithm"],
    "db_normalization": ["1nf", "2nf", "3nf", "functional dependency", "redundancy", "partial dependency"],
    "db_acid": ["atomicity", "consistency", "isolation", "durability", "commit", "rollback"]
}


HOTSPOT_KNOWLEDGE_BASE = {
    "pointer_arithmetic": {
        "concept": "Pointer Arithmetic",
        "risk_level": "high",
        "potential_confusion": "Off-by-type byte scaling misconception: Assuming ptr + 1 advances 1 single memory byte rather than sizeof(*ptr) bytes.",
        "prerequisite_bottleneck": "Memory Addresses",
        "remedy_suggestion": "Review how data types occupy multi-byte slots in RAM (e.g. 4 bytes for int) before calculating pointer offsets."
    },
    "dereferencing": {
        "concept": "Dereferencing (*ptr)",
        "risk_level": "high",
        "potential_confusion": "Conflating the pointer variable's address (&p), its stored address (p), and the target value (*p).",
        "prerequisite_bottleneck": "Memory Addresses",
        "remedy_suggestion": "Trace memory boxes visually: box for variable, box for pointer containing address."
    },
    "memory_addresses": {
        "concept": "Memory Addresses & Storage",
        "risk_level": "medium",
        "potential_confusion": "Assuming memory addresses are random integers rather than contiguous byte offsets in RAM.",
        "prerequisite_bottleneck": "Variables & Storage",
        "remedy_suggestion": "Practice visual memory mapping showing hexadecimal byte locations."
    },
    "arrays_and_pointers": {
        "concept": "Arrays and Pointers Equivalence",
        "risk_level": "medium",
        "potential_confusion": "Believing an array identifier is a modifiable pointer variable rather than a constant address.",
        "prerequisite_bottleneck": "Pointer Arithmetic",
        "remedy_suggestion": "Understand that arr++ is illegal in C, whereas ptr++ increments an allocated pointer."
    },
    "python_mutability": {
        "concept": "Object References & Mutability",
        "risk_level": "high",
        "potential_confusion": "Assuming variable assignment b = a creates an independent duplicate rather than sharing the same object in heap memory.",
        "prerequisite_bottleneck": "Variables & Object Model",
        "remedy_suggestion": "Use Python tutor / id() to see when references point to the identical memory address."
    },
    "os_processes_threads": {
        "concept": "Processes vs. Threads",
        "risk_level": "medium",
        "potential_confusion": "Assuming threads have completely separate address spaces instead of sharing the parent process's heap and global variables.",
        "prerequisite_bottleneck": "Virtual Memory",
        "remedy_suggestion": "Differentiate per-thread state (registers, stack) from shared process resources (heap, file descriptors)."
    },
    "os_deadlocks": {
        "concept": "Deadlock Detection & Prevention",
        "risk_level": "high",
        "potential_confusion": "Confusing starvation or live-lock with true circular deadlock where no thread can make progress.",
        "prerequisite_bottleneck": "Mutex & Concurrency",
        "remedy_suggestion": "Check the 4 Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait."
    },
    "db_normalization": {
        "concept": "Database Normalization (2NF & 3NF)",
        "risk_level": "high",
        "potential_confusion": "Confusing partial functional dependencies (2NF violation) with transitive dependencies (3NF violation).",
        "prerequisite_bottleneck": "Functional Dependencies",
        "remedy_suggestion": "Identify candidate keys first, then verify if non-prime attributes depend only on the primary key."
    }
}


class DocumentIntelligenceService:
    """Processes uploaded study materials, extracts concepts, identifies confusion hotspots, and generates diagnostics."""

    def analyze_document(
        self,
        file_bytes: bytes,
        filename: str,
        db: Session,
        student_id: int,
        preferred_subject: Optional[str] = None
    ) -> Dict[str, Any]:
        text = extract_text_from_file(file_bytes, filename)
        text_lower = text.lower()
        file_size = len(file_bytes)

        # 1. Detect subject
        detected_subject_code = preferred_subject or self._detect_subject(text_lower)
        subject_record = db.query(Subject).filter(Subject.code == detected_subject_code).first()
        subject_name = subject_record.name if subject_record else "C Programming"

        # 2. Extract concepts matching knowledge graph & text keywords
        detected_concept_ids = self._extract_concepts(text_lower, detected_subject_code)

        # 3. Identify confusion hotspots
        hotspots = self._identify_hotspots(detected_concept_ids)

        # 4. Generate custom diagnostic questions matching the document
        questions = self._generate_diagnostic_questions(
            db=db,
            subject_id=subject_record.id if subject_record else 1,
            detected_concept_ids=detected_concept_ids,
            document_text=text
        )

        # 5. Persist UploadedDocument record
        doc_record = UploadedDocument(
            student_id=student_id,
            filename=filename,
            file_type=filename.split(".")[-1].lower() if "." in filename else "txt",
            file_size=file_size,
            detected_subject=subject_name,
            extracted_concepts=detected_concept_ids,
            confusion_hotspots=hotspots,
            generated_questions=questions,
            created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        return {
            "id": doc_record.id,
            "filename": doc_record.filename,
            "file_type": doc_record.file_type,
            "file_size": doc_record.file_size,
            "detected_subject": doc_record.detected_subject,
            "extracted_concepts": doc_record.extracted_concepts,
            "confusion_hotspots": doc_record.confusion_hotspots,
            "question_count": len(questions),
            "generated_questions": questions,
            "created_at": doc_record.created_at.isoformat()
        }

    def _detect_subject(self, text_lower: str) -> str:
        scores = {}
        for subj, patterns in SUBJECT_KEYWORD_PATTERNS.items():
            count = sum(text_lower.count(p) for p in patterns)
            scores[subj] = count

        best_subject = max(scores, key=scores.get)
        return best_subject if scores[best_subject] > 0 else "c_programming"

    def _extract_concepts(self, text_lower: str, subject_code: str) -> List[str]:
        matched = []
        for concept_id, kws in CONCEPT_KEYWORD_MAP.items():
            if any(kw in text_lower for kw in kws):
                matched.append(concept_id)

        # If none matched specifically, provide foundational concepts for subject
        if not matched:
            if subject_code == "c_programming":
                matched = ["memory_addresses", "dereferencing", "pointer_arithmetic"]
            elif subject_code == "python":
                matched = ["python_mutability", "python_scopes_legb"]
            elif subject_code == "operating_systems":
                matched = ["os_processes_threads", "os_deadlocks"]
            elif subject_code == "database_systems":
                matched = ["db_normalization", "db_acid"]
            else:
                matched = ["memory_addresses", "pointer_arithmetic"]

        return matched

    def _identify_hotspots(self, concept_ids: List[str]) -> List[Dict[str, Any]]:
        hotspots = []
        for cid in concept_ids:
            if cid in HOTSPOT_KNOWLEDGE_BASE:
                hotspots.append(HOTSPOT_KNOWLEDGE_BASE[cid])

        # If no explicit hotspot, add a default intelligent diagnostic hotspot
        if not hotspots:
            hotspots.append({
                "concept": concept_ids[0].replace("_", " ").title() if concept_ids else "Foundational Concept",
                "risk_level": "medium",
                "potential_confusion": "Potential gap between theoretical definition and practical code implementation.",
                "prerequisite_bottleneck": "Foundational Syntax & Execution",
                "remedy_suggestion": "Verify prerequisite definitions through code tracing and counter-examples."
            })
        return hotspots

    def _generate_diagnostic_questions(
        self,
        db: Session,
        subject_id: int,
        detected_concept_ids: List[str],
        document_text: str
    ) -> List[Dict[str, Any]]:
        # Find questions in DB matching these concepts
        candidate_questions = []
        for cid in detected_concept_ids:
            # Query questions where concepts JSON contains this concept
            db_qs = db.query(Question).filter(Question.subject_id == subject_id).all()
            for q in db_qs:
                if q.concepts and cid in q.concepts:
                    if q.id not in [cq["id"] for cq in candidate_questions]:
                        candidate_questions.append({
                            "id": q.id,
                            "topic": q.topic,
                            "difficulty": q.difficulty,
                            "question": q.question,
                            "code_snippet": q.code_snippet,
                            "options": q.options,
                            "correct_answer": q.correct_answer,
                            "explanation": q.explanation,
                            "concepts": q.concepts,
                            "prerequisites": q.prerequisites or [],
                            "misconception_distractors": q.misconception_distractors or {}
                        })

        # If we have at least 5 questions, return top 5 (ordered prerequisite to advanced)
        if len(candidate_questions) >= 5:
            return candidate_questions[:5]

        # Otherwise fill with representative questions from that subject
        remaining_qs = db.query(Question).filter(Question.subject_id == subject_id).all()
        for q in remaining_qs:
            if q.id not in [cq["id"] for cq in candidate_questions]:
                candidate_questions.append({
                    "id": q.id,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "question": q.question,
                    "code_snippet": q.code_snippet,
                    "options": q.options,
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation,
                    "concepts": q.concepts,
                    "prerequisites": q.prerequisites or [],
                    "misconception_distractors": q.misconception_distractors or {}
                })
            if len(candidate_questions) >= 5:
                break

        return candidate_questions[:5]


document_service = DocumentIntelligenceService()
