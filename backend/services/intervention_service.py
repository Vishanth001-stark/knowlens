from typing import Dict, List, Any
from backend.models.models import Intervention, InterventionQuestion
from backend.schemas.schemas import InterventionStep, InterventionResponse
from backend.knowledge_graph.graph import knowledge_graph

class InterventionService:
    """
    Generates targeted micro-learning recovery sessions and curated verification tests
    customized to the specific misconception diagnosed.
    """

    INTERVENTION_TEMPLATES: Dict[str, dict] = {
        "pointer_arithmetic": {
            "title": "Targeted Recovery: Pointer Offsets and Memory Arithmetic",
            "steps": [
                {
                    "step_number": 1,
                    "title": "Prerequisite Grounding: Memory Addresses & Bytes",
                    "duration_label": "3 min",
                    "type": "review",
                    "content": "Every byte in RAM has a unique numerical address (e.g., 0x1000). A pointer stores one of these addresses. However, when we write 'ptr + 1', C does NOT add 1 raw byte. It scales the addition by sizeof(*ptr).",
                    "code_example": "int *p = (int *)0x1000;\n// sizeof(int) is 4 bytes\n// p + 1 points to 0x1004, NOT 0x1001!",
                    "key_takeaway": "Pointer addition is always type-scaled, not single-byte increments."
                },
                {
                    "step_number": 2,
                    "title": "Pointer Math vs Value Math",
                    "duration_label": "4 min",
                    "type": "visual_explanation",
                    "content": "Distinguish between moving the pointer (address) vs changing the pointed-to data (value):\n- `p + 1` evaluates to a new address\n- `*p + 1` takes the value at current address and adds 1\n- `*(p + 1)` navigates to the next element and dereferences it",
                    "code_example": "int arr[] = {10, 20};\nint *p = arr;\nprintf(\"%d\\n\", *p + 1);   // Prints 11 (10 + 1)\nprintf(\"%d\\n\", *(p + 1)); // Prints 20 (arr[1])",
                    "key_takeaway": "Parentheses matter: *(p + i) accesses offset element; *p + i adds to element value."
                },
                {
                    "step_number": 3,
                    "title": "Array Decay & Offset Equivalence",
                    "duration_label": "3 min",
                    "type": "guided_example",
                    "content": "In C, the expression `arr[i]` is defined by the C standard to be completely identical to `*(arr + i)`. You can even write `i[arr]`, which compiles to the exact same memory offset.",
                    "code_example": "int v[] = {100, 200, 300};\n// v[2] == *(v + 2) == 300",
                    "key_takeaway": "Bracket indexing is merely syntactic sugar for pointer arithmetic and dereferencing."
                },
                {
                    "step_number": 4,
                    "title": "Interactive Walkthrough & Self-Check",
                    "duration_label": "2 min",
                    "type": "guided_example",
                    "content": "Trace the memory step-by-step: If double is 8 bytes and ptr is 0x2000, ptr + 3 points to 0x2000 + (3 * 8) = 0x2018 in hex.",
                    "code_example": "double *d = (double *)0x2000;\n// d + 3 advances by 24 (0x18) bytes -> 0x2018",
                    "key_takeaway": "Multiply the integer offset by the byte-width of the target data type."
                },
                {
                    "step_number": 5,
                    "title": "Post-Intervention Verification",
                    "duration_label": "3 min",
                    "type": "practice",
                    "content": "You will now solve 3 targeted verification questions to measure recovery. Your accuracy will be compared directly to your pre-intervention baseline.",
                    "code_example": None,
                    "key_takeaway": "Ready for verification check."
                }
            ],
            "verification_questions": [
                {
                    "question": "If 'char *c' is at 0x3000 and 'int *i' is at 0x3000 (sizeof(int)=4, sizeof(char)=1), what are the addresses of (c + 2) and (i + 2)?",
                    "code_snippet": "char *c = (char *)0x3000;\nint *i = (int *)0x3000;\n// Addresses of (c + 2) and (i + 2)?",
                    "options": [
                        "0x3002 and 0x3008",
                        "0x3002 and 0x3002",
                        "0x3008 and 0x3008",
                        "0x3004 and 0x3008"
                    ],
                    "correct_answer": "0x3002 and 0x3008",
                    "explanation": "char is 1 byte, so c+2 advances 2 bytes to 0x3002. int is 4 bytes, so i+2 advances 2*4=8 bytes to 0x3008.",
                    "difficulty": "medium"
                },
                {
                    "question": "What does the code print?",
                    "code_snippet": "#include <stdio.h>\nint main() {\n    int a[] = {50, 60, 70};\n    int *p = a;\n    printf(\"%d\", *p + 2);\n    return 0;\n}",
                    "options": ["52", "70", "60", "Compilation error"],
                    "correct_answer": "52",
                    "explanation": "*p evaluates to 50. Adding 2 yields 50 + 2 = 52. If it had been *(p + 2), it would be 70.",
                    "difficulty": "easy"
                },
                {
                    "question": "What is the output after executing this pointer traversal?",
                    "code_snippet": "#include <stdio.h>\nint main() {\n    int vals[4] = {1, 2, 3, 4};\n    int *p = vals + 1;\n    printf(\"%d \", *(p + 1));\n    printf(\"%d\", p[-1]);\n    return 0;\n}",
                    "options": ["3 1", "2 1", "3 2", "4 1"],
                    "correct_answer": "3 1",
                    "explanation": "p points to vals[1] (2). *(p + 1) is vals[2] (3). p[-1] is *(p - 1), which is vals[0] (1).",
                    "difficulty": "hard"
                }
            ]
        },
        "dereferencing": {
            "title": "Targeted Recovery: Pointer Indirection and Dereferencing (*)",
            "steps": [
                {
                    "step_number": 1,
                    "title": "Address vs Contents Distinction",
                    "duration_label": "3 min",
                    "type": "review",
                    "content": "A pointer variable holds an address. The '*' operator is the key that opens that address to read or write the actual value inside.",
                    "code_example": "int val = 99;\nint *p = &val;\n// p is the address (e.g. 0x7fff00)\n// *p is the integer 99",
                    "key_takeaway": "Using p gets you where it lives; using *p gets you what lives there."
                },
                {
                    "step_number": 2,
                    "title": "Mutating Memory through Indirection",
                    "duration_label": "3 min",
                    "type": "visual_explanation",
                    "content": "Assigning to *p overwrites the value stored in the original variable. Assigning to p changes where the pointer points without altering any variable value.",
                    "code_example": "*p = 500; // val is now 500\np = NULL; // val is still 500, but p points nowhere",
                    "key_takeaway": "L-value *p mutates the pointed cell; L-value p redirects the pointer."
                },
                {
                    "step_number": 3,
                    "title": "Common Dereference Traps",
                    "duration_label": "3 min",
                    "type": "guided_example",
                    "content": "Never dereference uninitialized or NULL pointers. Always ensure the pointer holds a valid address of allocated memory before prefixing it with *.",
                    "code_example": "int *ptr = NULL;\n// *ptr = 10; // RUNTIME CRASH (SEGFAULT)",
                    "key_takeaway": "Only dereference valid, non-null addresses."
                },
                {
                    "step_number": 4,
                    "title": "Guided Step-by-Step Tracing",
                    "duration_label": "2 min",
                    "type": "guided_example",
                    "content": "Trace the execution: int x = 10, y = 20; int *p = &x; *p = y; What is x? x becomes 20 because the contents of y are copied into the memory location pointed to by p.",
                    "code_example": "int x = 10, y = 20;\nint *p = &x;\n*p = y;\n// x is now 20",
                    "key_takeaway": "*p = y copies y's value into x's address."
                },
                {
                    "step_number": 5,
                    "title": "Verification Check",
                    "duration_label": "3 min",
                    "type": "practice",
                    "content": "Attempt 3 quick verification questions to prove your mastery of pointer indirection.",
                    "code_example": None,
                    "key_takeaway": "Ready for verification check."
                }
            ],
            "verification_questions": [
                {
                    "question": "What is the final value of 'val'?",
                    "code_snippet": "#include <stdio.h>\nint main() {\n    int val = 12;\n    int *p1 = &val;\n    int *p2 = p1;\n    *p2 = 88;\n    printf(\"%d\", val);\n    return 0;\n}",
                    "options": ["88", "12", "Garbage", "Address of val"],
                    "correct_answer": "88",
                    "explanation": "p1 and p2 both point to val. *p2 = 88 writes 88 into val.",
                    "difficulty": "easy"
                },
                {
                    "question": "Which statement will produce a runtime segmentation fault?",
                    "code_snippet": "int a = 10;\nint *p = NULL;\nint *q = &a;",
                    "options": [
                        "*p = 20;",
                        "*q = 20;",
                        "p = q;",
                        "q = NULL;"
                    ],
                    "correct_answer": "*p = 20;",
                    "explanation": "Dereferencing a NULL pointer (*p) accesses address 0, causing a segmentation fault.",
                    "difficulty": "medium"
                },
                {
                    "question": "What does the following snippet print?",
                    "code_snippet": "#include <stdio.h>\nint main() {\n    int x = 5, y = 10;\n    int *p = &x;\n    *p += 5;\n    p = &y;\n    *p += 5;\n    printf(\"%d %d\", x, y);\n    return 0;\n}",
                    "options": ["10 15", "5 10", "15 15", "10 10"],
                    "correct_answer": "10 15",
                    "explanation": "*p += 5 modifies x from 5 to 10. Then p is redirected to y, and *p += 5 modifies y from 10 to 15.",
                    "difficulty": "medium"
                }
            ]
        },
        "memory_addresses": {
            "title": "Targeted Recovery: Memory Addresses & Address-Of (&) Operator",
            "steps": [
                {
                    "step_number": 1,
                    "title": "1. Simple Explanation: How Memory is Numbered",
                    "duration_label": "1 min",
                    "type": "review",
                    "content": "Every byte in your computer's RAM has a unique numerical street address (expressed in hexadecimal, e.g., 0x7ffd98). When you declare 'int x = 42;', the OS reserves 4 contiguous bytes in memory to store the number 42, starting at a specific address like 0x1000.",
                    "code_example": "int x = 42;\n// x evaluates to 42 (the value)\n// &x evaluates to 0x7ffe04 (where 42 is stored in RAM)",
                    "key_takeaway": "A variable has two separate properties: its value (what's inside) and its address (where it lives)."
                },
                {
                    "step_number": 2,
                    "title": "2. Visual Analogy: Mailbox vs Mailbox Contents",
                    "duration_label": "1 min",
                    "type": "visual_explanation",
                    "content": "Think of a row of post office boxes:\n- Box Number #104 is the Memory Address (&x).\n- The letter inside Box #104 with '$50' written on it is the Value (x).\n- If you tell a friend 'go to #104', you gave them an address. If you hand them $50, you gave them the value.",
                    "code_example": "// Analogy in C:\nint mailbox_104 = 50;\nprintf(\"Address: %p\\n\", (void*)&mailbox_104); // Box #104\nprintf(\"Value: %d\\n\", mailbox_104);             // $50",
                    "key_takeaway": "Never confuse the box number (&) with the letter inside (*)."
                },
                {
                    "step_number": 3,
                    "title": "3. Worked Example: Tracing Addresses and Offsets",
                    "duration_label": "2 min",
                    "type": "guided_example",
                    "content": "Let's trace two integer variables allocated consecutively on the stack. Because each int occupies 4 bytes, their addresses differ by 4 bytes (or sizeof(int)).",
                    "code_example": "int a = 10;\nint b = 20;\n// If &a is 0x1000, then in a typical 4-byte layout,\n// the next variable &b will be at 0x1004 or 0x0FFC.\n// The '&' operator extracts that exact location.",
                    "key_takeaway": "&var yields a pointer holding the starting memory address of that variable."
                },
                {
                    "step_number": 4,
                    "title": "4. Checkpoint: Two Foundational Concept Checks",
                    "duration_label": "1 min",
                    "type": "guided_example",
                    "content": "Check 1: What is printed by printf(\"%p\", &x)? A memory address, NOT the value of x.\nCheck 2: Does changing x modify &x? No! The address remains fixed in RAM for x's entire lifetime.",
                    "code_example": "int count = 5;\ncount = 10; // &count is still the exact same memory address!",
                    "key_takeaway": "A variable's memory address does not change when you modify its value."
                },
                {
                    "step_number": 5,
                    "title": "5. Practice Verification (2 Easy + 1 Application)",
                    "duration_label": "2 min",
                    "type": "practice",
                    "content": "You will now solve 2 quick fundamental questions followed by 1 applied question to verify recovery.",
                    "code_example": None,
                    "key_takeaway": "Ready for verification check."
                }
            ],
            "verification_questions": [
                {
                    "question": "(Easy) Which operator in C is used to retrieve the memory address of an existing variable?",
                    "code_snippet": None,
                    "options": [
                        "& (Address-of operator)",
                        "* (Dereference operator)",
                        "-> (Arrow operator)",
                        "% (Modulo operator)"
                    ],
                    "correct_answer": "& (Address-of operator)",
                    "explanation": "The ampersand (&) operator yields the memory address of its operand.",
                    "difficulty": "easy"
                },
                {
                    "question": "(Easy) If variable 'int num = 100;' is stored at memory address 0x2000, what does '&num' evaluate to?",
                    "code_snippet": None,
                    "options": [
                        "0x2000",
                        "100",
                        "4",
                        "NULL"
                    ],
                    "correct_answer": "0x2000",
                    "explanation": "&num evaluates to the memory address 0x2000 where num resides in RAM.",
                    "difficulty": "easy"
                },
                {
                    "question": "(Application) Two int variables 'x' and 'y' (4 bytes each) are declared consecutively in memory. If &x is 0x1000 and &y is 0x1004, what is the byte distance between their starting addresses?",
                    "code_snippet": "int x = 10;\nint y = 20;\n// &x = 0x1000, &y = 0x1004",
                    "options": [
                        "4 bytes (equal to sizeof(int))",
                        "1 byte",
                        "8 bytes",
                        "0 bytes"
                    ],
                    "correct_answer": "4 bytes (equal to sizeof(int))",
                    "explanation": "0x1004 - 0x1000 = 4 bytes, matching the size of an int in bytes.",
                    "difficulty": "application"
                }
            ]
        }
    }

    @classmethod
    def get_or_create_intervention(
        cls,
        concept_id: str,
        student_id: int,
        pre_score: float
    ) -> Dict[str, Any]:
        """
        Creates or returns the targeted intervention data structure for the concept.
        """
        concept_name = knowledge_graph.concepts_data.get(concept_id, {}).get("name", concept_id)
        template = cls.INTERVENTION_TEMPLATES.get(concept_id)

        if not template:
            # Generate adaptive generic 5-step intervention
            template = {
                "title": f"Targeted Recovery: {concept_name}",
                "steps": [
                    {
                        "step_number": 1,
                        "title": f"Core Foundations of {concept_name}",
                        "duration_label": "3 min",
                        "type": "review",
                        "content": f"Reviewing the key mechanics and definition of {concept_name}. Identifying where misconceptions frequently arise.",
                        "code_example": f"// Core syntax and usage for {concept_name}\n",
                        "key_takeaway": f"Understand the baseline syntax and semantic rules of {concept_name}."
                    },
                    {
                        "step_number": 2,
                        "title": "Common Pitfalls & Edge Cases",
                        "duration_label": "4 min",
                        "type": "visual_explanation",
                        "content": f"Examining common mistakes observed in student submissions regarding {concept_name}.",
                        "code_example": None,
                        "key_takeaway": "Distinguish between the correct idiom and the misconception distractor."
                    },
                    {
                        "step_number": 3,
                        "title": "Step-by-Step Code Walkthrough",
                        "duration_label": "3 min",
                        "type": "guided_example",
                        "content": "Analyzing a working example with line-by-line state inspection.",
                        "code_example": "// Walkthrough snippet\n",
                        "key_takeaway": "Observe state transitions at each step."
                    },
                    {
                        "step_number": 4,
                        "title": "Guided Practice Reflection",
                        "duration_label": "2 min",
                        "type": "guided_example",
                        "content": "Test your mental model against edge cases.",
                        "code_example": None,
                        "key_takeaway": "Formulate predictions before verifying output."
                    },
                    {
                        "step_number": 5,
                        "title": "Verification Assessment",
                        "duration_label": "3 min",
                        "type": "practice",
                        "content": "Complete 3 verification items to assess recovery.",
                        "code_example": None,
                        "key_takeaway": "Validate updated conceptual model."
                    }
                ],
                "verification_questions": [
                    {
                        "question": f"Which statement best applies to {concept_name} in C?",
                        "code_snippet": None,
                        "options": [
                            f"Standard behavior adhering to ANSI C semantics for {concept_name}",
                            "An undefined behavior edge case",
                            "An invalid construct disallowed by standard compilers",
                            "A deprecated keyword"
                        ],
                        "correct_answer": f"Standard behavior adhering to ANSI C semantics for {concept_name}",
                        "explanation": f"This tests accurate conceptual classification of {concept_name}.",
                        "difficulty": "medium"
                    },
                    {
                        "question": f"Consider this code snippet testing {concept_name}:",
                        "code_snippet": "#include <stdio.h>\nint main() {\n    printf(\"Verified\");\n    return 0;\n}",
                        "options": ["Verified", "Error", "Nothing", "Garbage"],
                        "correct_answer": "Verified",
                        "explanation": "Standard output evaluation.",
                        "difficulty": "easy"
                    },
                    {
                        "question": f"What is the expected complexity or behavior in {concept_name}?",
                        "code_snippet": None,
                        "options": ["Predictable and deterministic", "Random", "Platform undefined", "Syntax error"],
                        "correct_answer": "Predictable and deterministic",
                        "explanation": "Standard C execution model.",
                        "difficulty": "medium"
                    }
                ]
            }

        return {
            "concept_id": concept_id,
            "concept_name": concept_name,
            "title": template["title"],
            "steps": template["steps"],
            "verification_questions": template["verification_questions"],
            "pre_intervention_score": pre_score
        }
