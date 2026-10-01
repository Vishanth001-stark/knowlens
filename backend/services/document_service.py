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
    "mathematics": [
        "math", "maths", "mathematics", "calculus", "derivative", "derivatives", "integral", "integrals",
        "limit", "limits", "chain rule", "continuity", "function", "functions", "matrix", "matrices",
        "vector", "vectors", "probability", "bayes", "bayes' theorem", "conditional probability",
        "differentiation", "algebra", "linear algebra", "differential", "eigenvalue", "eigenvalues",
        "polynomial", "theorem", "trigonometry", "geometry", "statistics", "discrete math", "sample space"
    ],
    "python": [
        "python", "def ", "def(", "class ", "self.", "lambda", "list comprehension", "tuple", "tuples",
        "dictionary", "dictionaries", "generator", "yield", "decorator", "decorators", "legb",
        "mutability", "immutable", "mutable", "__init__", "numpy", "pandas", "pip", "py_"
    ],
    "operating_systems": [
        "operating system", "operating systems", "os", "process", "processes", "thread", "threads",
        "deadlock", "deadlocks", "mutex", "semaphore", "semaphores", "virtual memory", "paging",
        "page fault", "context switch", "scheduler", "cpu scheduling", "banker's algorithm", "fork()",
        "kernel", "round robin", "critical section", "inter-process"
    ],
    "computer_networks": [
        "network", "networks", "networking", "osi layer", "osi model", "tcp", "udp", "ip address",
        "ipv4", "ipv6", "subnet", "subnetting", "dns", "http", "https", "router", "routing",
        "packet", "packets", "three-way handshake", "handshake", "socket", "port 80",
        "congestion control", "flow control", "ethernet", "lan", "wan"
    ],
    "database_systems": [
        "database", "databases", "dbms", "rdbms", "sql", "normalization", "1nf", "2nf", "3nf", "bcnf",
        "primary key", "foreign key", "acid", "transaction", "transactions", "index", "indexes",
        "b-tree", "join", "joins", "inner join", "select * from", "relational model", "relational"
    ],
    "data_structures": [
        "data structure", "data structures", "linked list", "linked lists", "binary search tree",
        "bst", "tree", "trees", "hash table", "hash map", "stack", "stacks", "queue", "queues",
        "heap", "heaps", "graph traversal", "bfs", "dfs", "time complexity", "big o", "traversal", "node"
    ],
    "c_programming": [
        "c programming", "c language", "pointer", "pointers", "dereference", "dereferencing",
        "malloc", "calloc", "memory address", "sizeof", "printf", "scanf", "segmentation fault",
        "segfault", "null pointer", "pointer arithmetic", "#include <stdio.h>", "#include", "char*", "int*"
    ]
}


CONCEPT_KEYWORD_MAP = {
    # Mathematics
    "math_functions": ["function", "domain", "range", "inverse function", "graph of function"],
    "math_limits": ["limit", "limits", "approaches", "indeterminate", "continuity", "continuous"],
    "math_derivatives": ["derivative", "derivatives", "rate of change", "tangent slope", "f'(x)", "dy/dx", "power rule"],
    "math_chain_rule": ["chain rule", "composite function", "inner function", "outer function", "f(g(x))"],
    "math_integrals": ["integral", "integrals", "integration", "antiderivative", "fundamental theorem", "area under curve"],
    "math_prob_basics": ["sample space", "event", "probability", "complement rule", "mutually exclusive"],
    "math_conditional_prob": ["conditional probability", "p(a|b)", "independent events", "independence"],
    "math_bayes_theorem": ["bayes", "bayes' theorem", "posterior probability", "prior probability", "total probability"],

    # Python
    "py_variables": ["variable assignment", "variable", "identifier"],
    "py_data_types": ["int", "float", "str", "boolean", "type conversion"],
    "py_mutability": ["mutable", "immutable", "in-place", "copy", "deepcopy", "list mutation", "id()"],
    "py_lists": ["list", "append", "pop", "slice", "list comprehension"],
    "py_dicts": ["dictionary", "dict", "key value", "keys()", "values()", "items()"],
    "py_control_flow": ["if elif else", "for loop", "while loop", "break", "continue"],
    "py_functions": ["def ", "return", "function parameter", "argument"],
    "py_default_args": ["default argument", "mutable default argument", "def foo(x=[]"],
    "py_scope_legb": ["legb", "scope", "global", "nonlocal", "local scope", "enclosing scope"],
    "py_closures": ["closure", "enclosed function", "free variable", "inner function"],
    "py_classes": ["class ", "self", "instance", "method", "constructor", "__init__"],
    "py_inheritance": ["inheritance", "super()", "subclass", "polymorphism", "override"],

    # Computer Networks
    "cn_osi_model": ["osi", "osi model", "physical layer", "data link", "network layer", "transport layer", "application layer"],
    "cn_ip_addressing": ["ip address", "ipv4", "ipv6", "subnet", "subnetting", "cidr", "mask"],
    "cn_tcp_udp": ["tcp", "udp", "connection-oriented", "connectionless", "reliable transport", "datagram"],
    "cn_three_way_handshake": ["three-way handshake", "syn", "syn-ack", "ack", "handshake"],
    "cn_flow_congestion": ["flow control", "congestion control", "sliding window", "slow start", "window size"],
    "cn_dns_http": ["dns", "http", "https", "domain name", "port 53", "port 80", "port 443"],

    # Operating Systems
    "os_processes_threads": ["process", "processes", "thread", "threads", "pcb", "thread pool", "user thread", "kernel thread"],
    "os_cpu_scheduling": ["scheduling", "cpu scheduler", "fcfs", "round robin", "sjf", "priority scheduling", "preemptive"],
    "os_synchronization": ["synchronization", "race condition", "critical section", "mutex", "semaphore", "peterson"],
    "os_deadlocks": ["deadlock", "deadlocks", "mutual exclusion", "hold and wait", "circular wait", "banker's algorithm"],
    "os_virtual_memory": ["virtual memory", "paging", "page table", "page fault", "tlb", "lru", "swapping"],

    # Database Systems
    "db_relational_model": ["relational model", "relation", "tuple", "attribute", "primary key", "foreign key", "schema"],
    "db_sql_joins": ["join", "inner join", "left join", "right join", "cross join", "cartesian product"],
    "db_normalization": ["normalization", "1nf", "2nf", "3nf", "bcnf", "functional dependency", "partial dependency"],
    "db_transactions_acid": ["acid", "transaction", "atomicity", "consistency", "isolation", "durability", "commit", "rollback"],
    "db_indexes": ["index", "indexes", "b-tree", "hash index", "clustered index", "lookup time"],

    # Data Structures
    "ds_arrays": ["array", "contiguous memory", "element index", "traversal"],
    "ds_linked_lists": ["linked list", "singly linked", "doubly linked", "head pointer", "next node", "tail"],
    "ds_stacks_queues": ["stack", "queue", "push", "pop", "enqueue", "dequeue", "lifo", "fifo"],
    "ds_trees": ["tree", "root", "leaf", "parent node", "child node", "tree traversal", "depth", "height"],
    "ds_bst": ["binary search tree", "bst", "inorder traversal", "left child smaller", "right child greater"],
    "ds_hash_tables": ["hash table", "hash map", "hash function", "collision", "chaining", "open addressing"],

    # C Programming
    "memory_addresses": ["memory address", "byte", "hexadecimal", "0x", "ram", "storage location"],
    "address_operator": ["address operator", "& operator", "&x", "reference"],
    "dereferencing": ["dereference", "*ptr", "value at address", "indirection"],
    "pointer_arithmetic": ["pointer arithmetic", "ptr +", "ptr++", "offset", "sizeof", "stride"],
    "arrays_and_pointers": ["array decay", "ptr to array", "arr[i]", "*(arr + i)"],
    "dynamic_memory": ["malloc", "calloc", "free", "heap", "memory leak", "realloc"],
    "structure_definition": ["struct", "structure member", "arrow operator", "->", "typedef struct"]
}


HOTSPOT_KNOWLEDGE_BASE = {
    # Mathematics
    "math_derivatives": {
        "concept": "Calculus Derivatives & Rate of Change",
        "risk_level": "high",
        "potential_confusion": "Confusing the slope of the tangent line f'(x) with average rate of change or the function value f(x).",
        "prerequisite_bottleneck": "Limits & Continuity",
        "remedy_suggestion": "Review the limit definition of difference quotients [f(x+h) - f(x)]/h before applying mechanical power rules."
    },
    "math_limits": {
        "concept": "Limits & Indeterminate Forms",
        "risk_level": "high",
        "potential_confusion": "Treating 0/0 as 0 or 1 rather than an indeterminate form requiring factoring or algebraic manipulation.",
        "prerequisite_bottleneck": "Functions & Factoring",
        "remedy_suggestion": "Evaluate left-hand and right-hand limits and cancel common algebraic factors before direct substitution."
    },
    "math_chain_rule": {
        "concept": "Chain Rule for Composite Functions",
        "risk_level": "high",
        "potential_confusion": "Omitting multiplication by the inner derivative g'(x) when differentiating composite f(g(x)).",
        "prerequisite_bottleneck": "Derivatives & Rate of Change",
        "remedy_suggestion": "Decompose into inner u = g(x) and outer y = f(u), computing dy/dx = (dy/du) * (du/dx) explicitly."
    },
    "math_integrals": {
        "concept": "Definite & Indefinite Integrals",
        "risk_level": "high",
        "potential_confusion": "Confusing antiderivative functions with net signed area under curve.",
        "prerequisite_bottleneck": "Derivatives & Chain Rule",
        "remedy_suggestion": "Apply the Fundamental Theorem of Calculus step-by-step and check endpoints."
    },
    "math_bayes_theorem": {
        "concept": "Bayes' Theorem & Conditional Probability",
        "risk_level": "high",
        "potential_confusion": "Transposing conditional directions: confusing P(A|B) with P(B|A) (the Prosecutor's Fallacy).",
        "prerequisite_bottleneck": "Conditional Probability & Independence",
        "remedy_suggestion": "Draw probability tree diagrams to clearly distinguish prior probabilities from likelihoods."
    },

    # Python
    "py_mutability": {
        "concept": "Object References & Mutability",
        "risk_level": "high",
        "potential_confusion": "Assuming variable assignment b = a creates an independent duplicate rather than sharing the identical heap object.",
        "prerequisite_bottleneck": "Variables & Memory Reference",
        "remedy_suggestion": "Use id(a) and id(b) to inspect memory addresses and distinguish shallow vs deep copies."
    },
    "py_scope_legb": {
        "concept": "LEGB Scope Resolution",
        "risk_level": "high",
        "potential_confusion": "Attempting to reassign outer variables without the global or nonlocal declaration keyword.",
        "prerequisite_bottleneck": "Functions & Variables",
        "remedy_suggestion": "Trace the 4 lookup namespaces: Local -> Enclosing -> Global -> Built-in."
    },

    # Operating Systems
    "os_deadlocks": {
        "concept": "Deadlock Detection & Coffman Conditions",
        "risk_level": "high",
        "potential_confusion": "Confusing thread starvation or live-lock with true circular deadlock where no thread can proceed.",
        "prerequisite_bottleneck": "Process Synchronization & Mutex",
        "remedy_suggestion": "Check the 4 Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait."
    },
    "os_processes_threads": {
        "concept": "Processes vs. Threads",
        "risk_level": "medium",
        "potential_confusion": "Assuming threads have independent heap spaces instead of sharing the parent process address space.",
        "prerequisite_bottleneck": "Virtual Memory",
        "remedy_suggestion": "Separate per-thread state (stack, registers) from shared process state (heap, data, file descriptors)."
    },

    # Computer Networks
    "cn_tcp_udp": {
        "concept": "TCP vs. UDP Transport Protocols",
        "risk_level": "medium",
        "potential_confusion": "Assuming UDP guarantees packet delivery order or provides automated loss recovery.",
        "prerequisite_bottleneck": "OSI Transport Layer",
        "remedy_suggestion": "Contrast TCP byte-stream connection handshakes with UDP datagram message boundaries."
    },

    # Database Systems
    "db_normalization": {
        "concept": "Database Normalization (2NF & 3NF)",
        "risk_level": "high",
        "potential_confusion": "Confusing partial functional dependencies (2NF violation) with transitive dependencies (3NF violation).",
        "prerequisite_bottleneck": "Functional Dependencies",
        "remedy_suggestion": "Determine candidate keys first, then verify if non-prime attributes depend only on the primary key."
    },
    "db_transactions_acid": {
        "concept": "ACID Transaction Properties",
        "risk_level": "medium",
        "potential_confusion": "Confusing Consistency with Isolation in concurrent database execution schedules.",
        "prerequisite_bottleneck": "Transactions & Locks",
        "remedy_suggestion": "Trace isolation levels (Read Committed vs Serializable) and phantom read phenomena."
    },

    # Data Structures
    "ds_linked_lists": {
        "concept": "Linked List Pointer Manipulation",
        "risk_level": "high",
        "potential_confusion": "Overwriting node->next before preserving the reference to successor nodes, causing memory detachment.",
        "prerequisite_bottleneck": "Pointers & Node References",
        "remedy_suggestion": "Use temporary successor pointer variables and draw node box diagrams prior to pointer updates."
    },
    "ds_bst": {
        "concept": "Binary Search Tree Invariants",
        "risk_level": "high",
        "potential_confusion": "Assuming node > left and node < right applies only locally to immediate children rather than the entire subtree.",
        "prerequisite_bottleneck": "Binary Trees & Recursion",
        "remedy_suggestion": "Enforce valid value intervals [min_bound, max_bound] during tree traversals."
    },

    # C Programming
    "pointer_arithmetic": {
        "concept": "Pointer Arithmetic & Stride",
        "risk_level": "high",
        "potential_confusion": "Assuming ptr + 1 advances 1 single memory byte rather than sizeof(*ptr) bytes.",
        "prerequisite_bottleneck": "Memory Addresses & Storage",
        "remedy_suggestion": "Multiply integer offset by the byte width of the target data type (e.g. 4 bytes for int)."
    },
    "dereferencing": {
        "concept": "Dereferencing (*ptr)",
        "risk_level": "high",
        "potential_confusion": "Conflating the pointer variable's address (&p), its stored address (p), and the target value (*p).",
        "prerequisite_bottleneck": "Memory Addresses",
        "remedy_suggestion": "Trace memory boxes visually: one box for the variable and one box for the pointer containing the address."
    },
    "memory_addresses": {
        "concept": "Memory Addresses & Storage",
        "risk_level": "medium",
        "potential_confusion": "Assuming memory addresses are arbitrary numbers rather than structured byte indices in RAM.",
        "prerequisite_bottleneck": "Variables & RAM Model",
        "remedy_suggestion": "Inspect hexadecimal memory addresses and physical RAM byte layouts."
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

        # 1. Detect subject from content and filename
        detected_subject_code = self._detect_subject(text_lower, filename)
        subject_record = db.query(Subject).filter(Subject.code == detected_subject_code).first()
        if not subject_record:
            subject_record = db.query(Subject).first()
        subject_name = subject_record.name if subject_record else "C Programming"

        # 2. Extract concepts matching knowledge graph & text keywords
        detected_concept_ids = self._extract_concepts(text_lower, detected_subject_code)

        # 3. Identify confusion hotspots
        hotspots = self._identify_hotspots(detected_concept_ids)

        # 4. Generate custom diagnostic questions matching the document and subject
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
            "detected_subject_code": detected_subject_code,
            "extracted_concepts": doc_record.extracted_concepts,
            "confusion_hotspots": doc_record.confusion_hotspots,
            "question_count": len(questions),
            "generated_questions": questions,
            "created_at": doc_record.created_at.isoformat()
        }

    def _detect_subject(self, text_lower: str, filename: str = "") -> str:
        # Give substantial weight to the filename tokens
        fname_clean = re.sub(r'[^a-zA-Z0-9]', ' ', filename).lower()
        combined_text = f"{fname_clean} {fname_clean} {fname_clean} {text_lower}"

        scores = {}
        for subj, patterns in SUBJECT_KEYWORD_PATTERNS.items():
            count = sum(combined_text.count(p) for p in patterns)
            scores[subj] = count

        best_subject = max(scores, key=scores.get)
        if scores[best_subject] > 0:
            return best_subject

        # Explicit fallback checks on filename tokens
        if any(w in fname_clean for w in ["math", "maths", "calculus", "algebra", "derivative", "integral", "matrix"]):
            return "mathematics"
        if any(w in fname_clean for w in ["python", "py"]):
            return "python"
        if any(w in fname_clean for w in ["os", "operating", "deadlock", "process", "thread"]):
            return "operating_systems"
        if any(w in fname_clean for w in ["network", "networks", "tcp", "udp", "ip", "osi"]):
            return "computer_networks"
        if any(w in fname_clean for w in ["db", "database", "sql", "rdbms", "normalization"]):
            return "database_systems"
        if any(w in fname_clean for w in ["tree", "bst", "list", "stack", "queue", "graph", "ds"]):
            return "data_structures"
        if any(w in fname_clean for w in ["c", "pointer", "pointers"]):
            return "c_programming"

        return "mathematics" if ("math" in fname_clean or "calc" in fname_clean) else "c_programming"

    def _extract_concepts(self, text_lower: str, subject_code: str) -> List[str]:
        matched = []
        for concept_id, kws in CONCEPT_KEYWORD_MAP.items():
            # Check if concept belongs to this subject
            if any(kw in text_lower for kw in kws):
                matched.append(concept_id)

        # If none matched specifically, provide foundational concepts specific to the detected subject
        if not matched:
            defaults = {
                "mathematics": ["math_limits", "math_derivatives", "math_chain_rule"],
                "python": ["py_variables", "py_mutability", "py_scope_legb"],
                "operating_systems": ["os_processes_threads", "os_deadlocks", "os_virtual_memory"],
                "computer_networks": ["cn_osi_model", "cn_tcp_udp", "cn_three_way_handshake"],
                "database_systems": ["db_relational_model", "db_normalization", "db_transactions_acid"],
                "data_structures": ["ds_arrays", "ds_linked_lists", "ds_bst"],
                "c_programming": ["memory_addresses", "dereferencing", "pointer_arithmetic"],
            }
            matched = defaults.get(subject_code, ["math_derivatives" if subject_code == "mathematics" else "memory_addresses"])

        return matched

    def _identify_hotspots(self, concept_ids: List[str]) -> List[Dict[str, Any]]:
        hotspots = []
        for cid in concept_ids:
            if cid in HOTSPOT_KNOWLEDGE_BASE:
                hotspots.append(HOTSPOT_KNOWLEDGE_BASE[cid])

        # If no explicit hotspot, add a default intelligent diagnostic hotspot
        if not hotspots:
            concept_title = concept_ids[0].replace("_", " ").title() if concept_ids else "Core Foundational Concept"
            hotspots.append({
                "concept": concept_title,
                "risk_level": "medium",
                "potential_confusion": f"Potential gap between theoretical formulas and practical problem solving in {concept_title}.",
                "prerequisite_bottleneck": "Foundational Prerequisites",
                "remedy_suggestion": "Verify core formulas and definitions through targeted conceptual diagnosis."
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
