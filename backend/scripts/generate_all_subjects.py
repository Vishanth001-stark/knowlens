import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. PYTHON
# -------------------------------------------------------------
python_concepts = [
    {
        "id": "py_variables",
        "module": "Basics",
        "name": "Variables & References",
        "difficulty_baseline": "easy",
        "description": "Python variables as names referring to objects, id(), and identity vs equality (is vs ==).",
        "prerequisites": []
    },
    {
        "id": "py_data_types",
        "module": "Basics",
        "name": "Data Types",
        "difficulty_baseline": "easy",
        "description": "Built-in types (int, float, str, bool) and dynamic typing rules.",
        "prerequisites": ["py_variables"]
    },
    {
        "id": "py_mutability",
        "module": "Memory Model",
        "name": "Mutability & Immutability",
        "difficulty_baseline": "medium",
        "description": "Differences between mutable (list, dict, set) and immutable (int, str, tuple) objects in memory.",
        "prerequisites": ["py_variables", "py_data_types"]
    },
    {
        "id": "py_lists",
        "module": "Collections",
        "name": "Lists & Slicing",
        "difficulty_baseline": "easy",
        "description": "List operations, indexing, negative indexing, step slicing, and in-place modifications.",
        "prerequisites": ["py_mutability"]
    },
    {
        "id": "py_dicts",
        "module": "Collections",
        "name": "Dictionaries & Sets",
        "difficulty_baseline": "medium",
        "description": "Key-value mapping, hashability requirement for keys, set uniqueness, and dictionary comprehension.",
        "prerequisites": ["py_mutability"]
    },
    {
        "id": "py_control_flow",
        "module": "Control Flow",
        "name": "Control Flow & Loops",
        "difficulty_baseline": "easy",
        "description": "if/elif/else statements, for-in loops, while loops, break, continue, and for-else clauses.",
        "prerequisites": ["py_data_types"]
    },
    {
        "id": "py_functions",
        "module": "Functions",
        "name": "Functions & Arguments",
        "difficulty_baseline": "medium",
        "description": "def syntax, positional vs keyword arguments, *args and **kwargs unpacking.",
        "prerequisites": ["py_control_flow", "py_variables"]
    },
    {
        "id": "py_default_args",
        "module": "Functions",
        "name": "Default Arguments & Mutability Trap",
        "difficulty_baseline": "hard",
        "description": "Evaluation of default arguments at function definition time and the mutable default argument pitfall.",
        "prerequisites": ["py_functions", "py_mutability"]
    },
    {
        "id": "py_scope_legb",
        "module": "Scope",
        "name": "Scope & LEGB Rule",
        "difficulty_baseline": "hard",
        "description": "Local, Enclosing, Global, Built-in scope resolution, global and nonlocal keywords, UnboundLocalError.",
        "prerequisites": ["py_functions"]
    },
    {
        "id": "py_closures",
        "module": "Advanced Functions",
        "name": "Closures & Late Binding",
        "difficulty_baseline": "hard",
        "description": "Functions enclosing outer non-global variables, late binding behavior in closures and loops.",
        "prerequisites": ["py_scope_legb"]
    },
    {
        "id": "py_classes",
        "module": "OOP",
        "name": "Classes & Self",
        "difficulty_baseline": "medium",
        "description": "Class definitions, __init__ constructor, instance attributes vs class attributes, self parameter.",
        "prerequisites": ["py_functions", "py_scope_legb"]
    },
    {
        "id": "py_inheritance",
        "module": "OOP",
        "name": "Inheritance & super()",
        "difficulty_baseline": "hard",
        "description": "Single and multiple inheritance, method overriding, super() call and Method Resolution Order (MRO).",
        "prerequisites": ["py_classes"]
    }
]

python_questions = [
    {
        "id": 201,
        "topic": "Memory Model",
        "difficulty": "medium",
        "question_type": "code_output",
        "question": "What is the output of the following Python code?",
        "code_snippet": "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))",
        "options": ["3", "4", "Error", "[1, 2, 3, 4]"],
        "correct_answer": "4",
        "explanation": "In Python, variable assignment `b = a` copies the object reference, not the list itself. Modifying `b` mutates the same list that `a` references.",
        "concepts": ["py_mutability", "py_lists"],
        "prerequisites": ["py_variables"],
        "misconception_distractors": {
            "3": "believing_assignment_creates_an_independent_copy"
        }
    },
    {
        "id": 202,
        "topic": "Functions",
        "difficulty": "hard",
        "question_type": "code_output",
        "question": "What does the following function call sequence print?",
        "code_snippet": "def append_to(element, target=[]):\n    target.append(element)\n    return target\n\nprint(append_to(1))\nprint(append_to(2))",
        "options": ["[1] then [2]", "[1] then [1, 2]", "[1] then []", "TypeError"],
        "correct_answer": "[1] then [1, 2]",
        "explanation": "Default arguments are evaluated once when the function is defined, not each time it is called. The same mutable list `target` is reused across calls.",
        "concepts": ["py_default_args"],
        "prerequisites": ["py_mutability", "py_functions"],
        "misconception_distractors": {
            "[1] then [2]": "assuming_default_arguments_are_reinstantiated_per_call"
        }
    },
    {
        "id": 203,
        "topic": "Scope",
        "difficulty": "hard",
        "question_type": "code_output",
        "question": "What happens when executing this code?",
        "code_snippet": "x = 10\ndef foo():\n    print(x)\n    x = 20\n\nfoo()",
        "options": ["Prints 10", "UnboundLocalError", "Prints 20", "NameError: name 'x' is not defined"],
        "correct_answer": "UnboundLocalError",
        "explanation": "Because `x` is assigned inside `foo()`, Python marks `x` as a local variable for the entire scope of `foo()`. Accessing it before assignment raises UnboundLocalError.",
        "concepts": ["py_scope_legb"],
        "prerequisites": ["py_variables", "py_functions"],
        "misconception_distractors": {
            "Prints 10": "assuming_python_falls_back_to_global_before_local_assignment"
        }
    },
    {
        "id": 204,
        "topic": "Advanced Functions",
        "difficulty": "hard",
        "question_type": "code_output",
        "question": "What is the result of calling the functions produced by this list comprehension?",
        "code_snippet": "funcs = [lambda: i for i in range(3)]\nprint([f() for f in funcs])",
        "options": ["[0, 1, 2]", "[2, 2, 2]", "[0, 0, 0]", "TypeError"],
        "correct_answer": "[2, 2, 2]",
        "explanation": "Closures in Python bind variables by reference (late binding). When the lambdas are executed, `i` has completed the loop and holds the final value 2.",
        "concepts": ["py_closures"],
        "prerequisites": ["py_scope_legb"],
        "misconception_distractors": {
            "[0, 1, 2]": "assuming_loop_variable_is_captured_by_value_at_creation_time"
        }
    },
    {
        "id": 205,
        "topic": "OOP",
        "difficulty": "medium",
        "question_type": "mcq",
        "question": "What happens when you modify a mutable class-level attribute through an instance in Python?",
        "code_snippet": "class Dog:\n    tricks = []\n\nd1 = Dog()\nd2 = Dog()\nd1.tricks.append('roll')\nprint(d2.tricks)",
        "options": ["['roll']", "[]", "AttributeError", "None"],
        "correct_answer": "['roll']",
        "explanation": "`tricks` is defined on the class object. Accessing `d1.tricks` retrieves the class attribute list and mutates it in place, reflecting on `d2.tricks`.",
        "concepts": ["py_classes"],
        "prerequisites": ["py_mutability", "py_variables"],
        "misconception_distractors": {
            "[]": "confusing_class_attributes_with_isolated_instance_attributes"
        }
    }
]

# -------------------------------------------------------------
# 2. MATHEMATICS
# -------------------------------------------------------------
math_concepts = [
    {
        "id": "math_functions",
        "module": "Calculus Foundations",
        "name": "Functions & Graphs",
        "difficulty_baseline": "easy",
        "description": "Function definition, domain, range, inverse functions, and graphical representation.",
        "prerequisites": []
    },
    {
        "id": "math_limits",
        "module": "Calculus Foundations",
        "name": "Limits & Continuity",
        "difficulty_baseline": "medium",
        "description": "Definition of limits, one-sided limits, indeterminate forms, and conditions for continuity.",
        "prerequisites": ["math_functions"]
    },
    {
        "id": "math_derivatives",
        "module": "Differentiation",
        "name": "Derivatives & Rate of Change",
        "difficulty_baseline": "medium",
        "description": "Geometric interpretation as tangent slope, limit definition of derivative f'(x), and basic power rule.",
        "prerequisites": ["math_limits"]
    },
    {
        "id": "math_chain_rule",
        "module": "Differentiation",
        "name": "Chain Rule",
        "difficulty_baseline": "hard",
        "description": "Derivative of composite functions: (f(g(x)))' = f'(g(x)) * g'(x), and multi-layer nested compositions.",
        "prerequisites": ["math_derivatives"]
    },
    {
        "id": "math_integrals",
        "module": "Integration",
        "name": "Definite & Indefinite Integrals",
        "difficulty_baseline": "hard",
        "description": "Antiderivatives, Fundamental Theorem of Calculus, area under curve, and substitution method.",
        "prerequisites": ["math_derivatives", "math_chain_rule"]
    },
    {
        "id": "math_prob_basics",
        "module": "Probability",
        "name": "Sample Spaces & Basic Probability",
        "difficulty_baseline": "easy",
        "description": "Sample space, events, complement rule, addition rule for mutually exclusive and joint events.",
        "prerequisites": ["math_functions"]
    },
    {
        "id": "math_conditional_prob",
        "module": "Probability",
        "name": "Conditional Probability & Independence",
        "difficulty_baseline": "medium",
        "description": "P(A|B) = P(A ∩ B) / P(B), statistical independence test P(A ∩ B) = P(A)P(B), and multiplication rule.",
        "prerequisites": ["math_prob_basics"]
    },
    {
        "id": "math_bayes_theorem",
        "module": "Probability",
        "name": "Bayes' Theorem",
        "difficulty_baseline": "hard",
        "description": "Posterior probability calculation: P(A|B) = [P(B|A)P(A)] / P(B), prior probability, and total probability law.",
        "prerequisites": ["math_conditional_prob"]
    }
]

math_questions = [
    {
        "id": 301,
        "topic": "Differentiation",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "What is the derivative of f(x) = (3x^2 + 5)^4 with respect to x?",
        "code_snippet": None,
        "options": [
            "4(3x^2 + 5)^3 * 6x",
            "4(3x^2 + 5)^3",
            "12x(3x^2 + 5)^3",
            "24x(3x^2 + 5)^4"
        ],
        "correct_answer": "4(3x^2 + 5)^3 * 6x",
        "explanation": "By the chain rule, d/dx[g(x)^4] = 4*g(x)^3 * g'(x). Here g(x) = 3x^2 + 5, so g'(x) = 6x, yielding 24x(3x^2 + 5)^3 = 4(3x^2 + 5)^3 * 6x.",
        "concepts": ["math_chain_rule"],
        "prerequisites": ["math_derivatives"],
        "misconception_distractors": {
            "4(3x^2 + 5)^3": "forgetting_inner_derivative_in_chain_rule"
        }
    },
    {
        "id": 302,
        "topic": "Probability",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "A medical test for a disease with a 1% prevalence rate has a 95% true positive rate and a 5% false positive rate. If a randomly selected person tests positive, what is the probability they actually have the disease?",
        "code_snippet": None,
        "options": ["Approximately 16%", "95%", "90%", "Approximately 50%"],
        "correct_answer": "Approximately 16%",
        "explanation": "By Bayes' theorem: P(D|+) = [P(+|D)*P(D)] / [P(+|D)*P(D) + P(+|no D)*P(no D)] = [0.95 * 0.01] / [0.95 * 0.01 + 0.05 * 0.99] = 0.0095 / (0.0095 + 0.0495) ≈ 16.1%.",
        "concepts": ["math_bayes_theorem"],
        "prerequisites": ["math_conditional_prob"],
        "misconception_distractors": {
            "95%": "base_rate_fallacy_confusing_p_pos_given_disease_with_p_disease_given_pos"
        }
    }
]

# -------------------------------------------------------------
# 3. DATA STRUCTURES
# -------------------------------------------------------------
ds_concepts = [
    {
        "id": "ds_arrays",
        "module": "Linear Structures",
        "name": "Arrays & Dynamic Arrays",
        "difficulty_baseline": "easy",
        "description": "Contiguous memory layout, O(1) random index access, cache locality, and geometric amortized resizing.",
        "prerequisites": []
    },
    {
        "id": "ds_linked_lists",
        "module": "Linear Structures",
        "name": "Singly Linked Lists",
        "difficulty_baseline": "medium",
        "description": "Node pointers, sequential traversal, O(1) head insertion/deletion, and pointer manipulation pitfalls.",
        "prerequisites": ["ds_arrays"]
    },
    {
        "id": "ds_stacks_queues",
        "module": "Linear Structures",
        "name": "Stacks & Queues",
        "difficulty_baseline": "medium",
        "description": "LIFO vs FIFO abstract data types, circular buffer queues, and application to call stacks and BFS.",
        "prerequisites": ["ds_linked_lists"]
    },
    {
        "id": "ds_trees",
        "module": "Hierarchical Structures",
        "name": "Binary Trees & Traversals",
        "difficulty_baseline": "medium",
        "description": "Root, leaf, height, depth, and recursive DFS traversals (pre-order, in-order, post-order).",
        "prerequisites": ["ds_linked_lists"]
    },
    {
        "id": "ds_bst",
        "module": "Hierarchical Structures",
        "name": "Binary Search Trees (BST)",
        "difficulty_baseline": "hard",
        "description": "BST property (all keys in left subtree < root < all keys in right subtree), search, insertion, and deletion.",
        "prerequisites": ["ds_trees"]
    },
    {
        "id": "ds_hash_tables",
        "module": "Associative Structures",
        "name": "Hash Tables & Collisions",
        "difficulty_baseline": "hard",
        "description": "Hash functions, load factor, separate chaining, open addressing (linear probing), and O(1) average lookup.",
        "prerequisites": ["ds_arrays", "ds_linked_lists"]
    }
]

ds_questions = [
    {
        "id": 401,
        "topic": "Hierarchical Structures",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "Which statement correctly defines the Binary Search Tree (BST) invariant?",
        "code_snippet": None,
        "options": [
            "Every node in the left subtree must be less than the root, and every node in the right subtree must be greater.",
            "Only the immediate left child must be less than the parent, and immediate right child greater.",
            "The tree must be strictly balanced such that heights of subtrees differ by at most 1.",
            "Nodes at each depth level must be sorted from left to right."
        ],
        "correct_answer": "Every node in the left subtree must be less than the root, and every node in the right subtree must be greater.",
        "explanation": "The BST invariant applies to ALL nodes in the entire subtree, not merely the immediate left/right children.",
        "concepts": ["ds_bst"],
        "prerequisites": ["ds_trees"],
        "misconception_distractors": {
            "Only the immediate left child must be less than the parent, and immediate right child greater.": "local_parent_child_misconception_ignoring_subtree_invariant"
        }
    },
    {
        "id": 402,
        "topic": "Associative Structures",
        "difficulty": "medium",
        "question_type": "mcq",
        "question": "What is the worst-case time complexity of searching for a key in a hash table using separate chaining if all keys hash to the exact same bucket?",
        "code_snippet": None,
        "options": ["O(N)", "O(1)", "O(log N)", "O(N^2)"],
        "correct_answer": "O(N)",
        "explanation": "If all keys collide into the same bucket, the bucket becomes a linked list of length N, degrading lookup to linear traversal O(N).",
        "concepts": ["ds_hash_tables"],
        "prerequisites": ["ds_linked_lists", "ds_arrays"],
        "misconception_distractors": {
            "O(1)": "assuming_hash_table_lookup_is_strictly_o1_in_all_cases"
        }
    }
]

# -------------------------------------------------------------
# 4. COMPUTER NETWORKS
# -------------------------------------------------------------
cn_concepts = [
    {
        "id": "cn_osi_model",
        "module": "Architecture",
        "name": "OSI & TCP/IP Layering",
        "difficulty_baseline": "easy",
        "description": "Layer responsibilities (Physical to Application), protocol encapsulation, headers, and payload traversal.",
        "prerequisites": []
    },
    {
        "id": "cn_ip_addressing",
        "module": "Network Layer",
        "name": "IP Addressing & Subnetting",
        "difficulty_baseline": "medium",
        "description": "IPv4 format, CIDR notation (/24), subnet masks, network address vs broadcast address calculation.",
        "prerequisites": ["cn_osi_model"]
    },
    {
        "id": "cn_tcp_udp",
        "module": "Transport Layer",
        "name": "TCP vs UDP Fundamentals",
        "difficulty_baseline": "medium",
        "description": "Connection-oriented vs connectionless, reliability, port numbers, checksums, and latency tradeoffs.",
        "prerequisites": ["cn_osi_model"]
    },
    {
        "id": "cn_three_way_handshake",
        "module": "Transport Layer",
        "name": "TCP 3-Way Handshake",
        "difficulty_baseline": "hard",
        "description": "SYN, SYN-ACK, ACK sequence exchange, initial sequence number (ISN) negotiation, and connection teardown.",
        "prerequisites": ["cn_tcp_udp"]
    },
    {
        "id": "cn_flow_congestion",
        "module": "Transport Layer",
        "name": "Flow Control vs Congestion Control",
        "difficulty_baseline": "hard",
        "description": "Receiver sliding window (flow control) vs network bandwidth management (slow start, AIMD congestion control).",
        "prerequisites": ["cn_tcp_udp", "cn_three_way_handshake"]
    },
    {
        "id": "cn_dns_http",
        "module": "Application Layer",
        "name": "DNS & HTTP/HTTPS",
        "difficulty_baseline": "medium",
        "description": "Hierarchical domain name resolution, DNS record types (A, CNAME), HTTP methods, status codes, and TLS.",
        "prerequisites": ["cn_tcp_udp"]
    }
]

cn_questions = [
    {
        "id": 501,
        "topic": "Transport Layer",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "What is the primary difference between Flow Control and Congestion Control in TCP?",
        "code_snippet": None,
        "options": [
            "Flow control prevents the sender from overwhelming the receiver; congestion control prevents overwhelming the network routers.",
            "Flow control is managed by intermediate routers; congestion control is negotiated strictly between endpoints.",
            "Flow control adjusts window size based on packet loss; congestion control uses the receiver advertised window.",
            "They are two synonymous names for the exact same sliding window mechanism."
        ],
        "correct_answer": "Flow control prevents the sender from overwhelming the receiver; congestion control prevents overwhelming the network routers.",
        "explanation": "Flow control protects the destination receiver buffer using rwnd. Congestion control protects network links and intermediate router queues using cwnd.",
        "concepts": ["cn_flow_congestion"],
        "prerequisites": ["cn_tcp_udp"],
        "misconception_distractors": {
            "They are two synonymous names for the exact same sliding window mechanism.": "confusing_endpoint_flow_control_with_network_congestion_control"
        }
    },
    {
        "id": 502,
        "topic": "Network Layer",
        "difficulty": "medium",
        "question_type": "mcq",
        "question": "For the subnet 192.168.1.64/26, what is the usable host IP address range?",
        "code_snippet": None,
        "options": [
            "192.168.1.65 to 192.168.1.126",
            "192.168.1.64 to 192.168.1.127",
            "192.168.1.1 to 192.168.1.64",
            "192.168.1.65 to 192.168.1.127"
        ],
        "correct_answer": "192.168.1.65 to 192.168.1.126",
        "explanation": "/26 leaves 6 host bits (64 total addresses: .64 to .127). The first (.64) is network ID and the last (.127) is broadcast, so usable host range is .65 to .126.",
        "concepts": ["cn_ip_addressing"],
        "prerequisites": ["cn_osi_model"],
        "misconception_distractors": {
            "192.168.1.64 to 192.168.1.127": "including_network_and_broadcast_addresses_as_usable_hosts"
        }
    }
]

# -------------------------------------------------------------
# 5. OPERATING SYSTEMS
# -------------------------------------------------------------
os_concepts = [
    {
        "id": "os_processes_threads",
        "module": "Concurrency",
        "name": "Processes vs Threads",
        "difficulty_baseline": "medium",
        "description": "Address space isolation, Process Control Block (PCB), thread stack vs shared heap, and context switch costs.",
        "prerequisites": []
    },
    {
        "id": "os_cpu_scheduling",
        "module": "Process Management",
        "name": "CPU Scheduling Algorithms",
        "difficulty_baseline": "medium",
        "description": "Preemptive vs non-preemptive scheduling, Round Robin, SJF, multi-level feedback queues, turnaround & waiting times.",
        "prerequisites": ["os_processes_threads"]
    },
    {
        "id": "os_synchronization",
        "module": "Concurrency",
        "name": "Race Conditions & Mutexes",
        "difficulty_baseline": "hard",
        "description": "Critical section problem, atomic instructions (TestAndSet), mutual exclusion, semaphores, and condition variables.",
        "prerequisites": ["os_processes_threads"]
    },
    {
        "id": "os_deadlocks",
        "module": "Concurrency",
        "name": "Deadlocks & Coffman Conditions",
        "difficulty_baseline": "hard",
        "description": "Mutual exclusion, hold and wait, no preemption, circular wait, resource allocation graphs, and Banker's algorithm.",
        "prerequisites": ["os_synchronization"]
    },
    {
        "id": "os_virtual_memory",
        "module": "Memory Management",
        "name": "Virtual Memory & Paging",
        "difficulty_baseline": "hard",
        "description": "Virtual vs physical address translation, MMU, Page Tables, TLB cache, page faults, and replacement policies (LRU).",
        "prerequisites": ["os_processes_threads"]
    }
]

os_questions = [
    {
        "id": 601,
        "topic": "Concurrency",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "Which of the following is SHARED among all threads within the same process?",
        "code_snippet": None,
        "options": [
            "Heap memory and open file descriptors",
            "Stack memory and registers",
            "Thread local storage and program counter",
            "Process ID (PID) and call stack frames"
        ],
        "correct_answer": "Heap memory and open file descriptors",
        "explanation": "Threads share process address space including code, data, heap, and open OS resources. Each thread maintains its own unique call stack and CPU register state.",
        "concepts": ["os_processes_threads"],
        "prerequisites": [],
        "misconception_distractors": {
            "Stack memory and registers": "confusing_shared_heap_with_thread_isolated_stack"
        }
    },
    {
        "id": 602,
        "topic": "Concurrency",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "To prevent a deadlock from occurring, which of the following is sufficient according to the Coffman conditions?",
        "code_snippet": None,
        "options": [
            "Eliminate at least ONE of the four Coffman conditions.",
            "Eliminate ALL four Coffman conditions simultaneously.",
            "Ensure CPU utilization remains below 80%.",
            "Assign every process an equal scheduling priority."
        ],
        "correct_answer": "Eliminate at least ONE of the four Coffman conditions.",
        "explanation": "All four Coffman conditions must hold simultaneously for a deadlock to exist. Breaking any single condition guarantees deadlock prevention.",
        "concepts": ["os_deadlocks"],
        "prerequisites": ["os_synchronization"],
        "misconception_distractors": {
            "Eliminate ALL four Coffman conditions simultaneously.": "believing_all_deadlock_conditions_must_be_broken_simultaneously"
        }
    }
]

# -------------------------------------------------------------
# 6. DATABASE SYSTEMS
# -------------------------------------------------------------
db_concepts = [
    {
        "id": "db_relational_model",
        "module": "Foundations",
        "name": "Relational Model & Keys",
        "difficulty_baseline": "easy",
        "description": "Tuples, attributes, candidate keys, primary keys, foreign keys, and referential integrity constraints.",
        "prerequisites": []
    },
    {
        "id": "db_sql_joins",
        "module": "Querying",
        "name": "SQL Joins & Aggregations",
        "difficulty_baseline": "medium",
        "description": "INNER JOIN, LEFT/RIGHT OUTER JOIN, FULL OUTER JOIN, GROUP BY, and WHERE vs HAVING clauses.",
        "prerequisites": ["db_relational_model"]
    },
    {
        "id": "db_normalization",
        "module": "Schema Design",
        "name": "Normalization (1NF, 2NF, 3NF)",
        "difficulty_baseline": "hard",
        "description": "Functional dependencies, partial dependencies (2NF), transitive dependencies (3NF), and redundancy elimination.",
        "prerequisites": ["db_relational_model"]
    },
    {
        "id": "db_transactions_acid",
        "module": "Transaction Processing",
        "name": "ACID Properties & Isolation",
        "difficulty_baseline": "hard",
        "description": "Atomicity, Consistency, Isolation, Durability, write-ahead logging (WAL), dirty reads, and isolation levels.",
        "prerequisites": ["db_relational_model"]
    },
    {
        "id": "db_indexes",
        "module": "Performance",
        "name": "Indexes & B-Trees",
        "difficulty_baseline": "hard",
        "description": "Clustered vs non-clustered indexes, B+ tree node splitting, composite index prefix rule, and query execution plans.",
        "prerequisites": ["db_relational_model"]
    }
]

db_questions = [
    {
        "id": 701,
        "topic": "Schema Design",
        "difficulty": "hard",
        "question_type": "mcq",
        "question": "A table in First Normal Form (1NF) with candidate key {StudentID, CourseID} has an attribute ProfessorOffice that depends solely on CourseID. Which normal form is violated?",
        "code_snippet": None,
        "options": ["Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form only", "First Normal Form (1NF)"],
        "correct_answer": "Second Normal Form (2NF)",
        "explanation": "2NF requires that all non-key attributes are fully functionally dependent on the entire composite primary key. Since ProfessorOffice depends on only part of the key (CourseID), it is a partial dependency violating 2NF.",
        "concepts": ["db_normalization"],
        "prerequisites": ["db_relational_model"],
        "misconception_distractors": {
            "Third Normal Form (3NF)": "confusing_partial_key_dependency_with_transitive_nonkey_dependency"
        }
    },
    {
        "id": 702,
        "topic": "Querying",
        "difficulty": "medium",
        "question_type": "mcq",
        "question": "What is the functional difference between WHERE and HAVING in SQL?",
        "code_snippet": None,
        "options": [
            "WHERE filters rows before aggregation; HAVING filters aggregated group rows after GROUP BY.",
            "WHERE applies only to numeric columns; HAVING applies only to text columns.",
            "HAVING is an older deprecated syntax replaced by WHERE in ANSI SQL.",
            "WHERE can use aggregate functions like COUNT(), while HAVING cannot."
        ],
        "correct_answer": "WHERE filters rows before aggregation; HAVING filters aggregated group rows after GROUP BY.",
        "explanation": "WHERE filters individual table rows prior to grouping. HAVING filters groups after aggregate evaluations (such as COUNT, SUM, AVG) have completed.",
        "concepts": ["db_sql_joins"],
        "prerequisites": ["db_relational_model"],
        "misconception_distractors": {
            "WHERE can use aggregate functions like COUNT(), while HAVING cannot.": "inverting_where_and_having_aggregation_roles"
        }
    }
]

# Write all files
subjects_to_write = [
    ("python_concepts.json", python_concepts),
    ("python_questions.json", python_questions),
    ("mathematics_concepts.json", math_concepts),
    ("mathematics_questions.json", math_questions),
    ("data_structures_concepts.json", ds_concepts),
    ("data_structures_questions.json", ds_questions),
    ("computer_networks_concepts.json", cn_concepts),
    ("computer_networks_questions.json", cn_questions),
    ("operating_systems_concepts.json", os_concepts),
    ("operating_systems_questions.json", os_questions),
    ("database_systems_concepts.json", db_concepts),
    ("database_systems_questions.json", db_questions),
]

for filename, data in subjects_to_write:
    file_path = os.path.join(data_dir, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {len(data)} items to {filename}")

print("All 7 subject datasets generated successfully!")
