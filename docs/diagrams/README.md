# Diagrams

Sources of truth for the four system diagrams. Each renders inline below and each has a .mmd file beside this one.

## Workspace hierarchy

The intentionally shallow information architecture. Every route supports one of the couple's real questions, and the Decision Room is reachable from Today, Places, or Plan when a meaningful choice is ready.

```mermaid
flowchart TB
    A[Today<br/>Planning Pulse] --> B[Foreground decision]
    A --> C[Agent work in progress]
    A --> D[This week]

    E[Vision] --> F[Vision Readback]
    F --> G[Confirmed priorities]
    F --> H[Palette direction]
    F --> I[Delegation preferences]

    J[Places] --> K[Curated place selection]
    K --> L[Place detail]
    L --> M[Evidence and reality check]
    L --> N[Request tour]
    N --> O[Tour coordination]
    O --> P[Tour brief and outcome]

    Q[Plan] --> R[Decision Room]
    Q --> S[Timeline]
    Q --> T[Budget scenarios]
    Q --> U[Documents and commitments]

    V[Guests] --> W[Guest readiness]
    V --> X[Website Studio]
    V --> Y[Invites and communication]

    Z[More] --> AA[Preferences and privacy]
    Z --> AB[Connections]
    Z --> AC[Activity and support]

    B --> R
    H --> K
    I --> N
    P --> R
    R --> S
    T --> R
    U --> R
    X --> Y

    classDef primary fill:#F3F5FF,stroke:#5965C5,stroke-width:2px,color:#111;
    classDef decision fill:#FFF8E7,stroke:#A06B00,stroke-width:2px,color:#281500;
    classDef supporting fill:#E8F6EE,stroke:#2D8C62,stroke-width:2px,color:#102A1D;
    classDef detail fill:#FDEFF1,stroke:#B8485B,stroke-width:2px,color:#30040A;
    class A,E,J,Q,V,Z primary;
    class B,F,K,R,W,AA decision;
    class C,D,G,H,I,M,N,O,P,S,T,U,X,Y,AB,AC supporting;
    class L detail;
```

_Source: `docs/diagrams/vowos_ui_information_architecture.mmd`_

## Calm decision loop

The primary behavioural pattern. VowOS presents a recommendation, its evidence, and the effect of acting. If the couple is not ready, it returns to useful work rather than creating pressure.

```mermaid
flowchart LR
    A[Planning Pulse<br/>One important thing] --> B[Decision preview<br/>Recommendation and deadline]
    B --> C[Decision Room<br/>Two real choices]
    C --> D[Why it fits<br/>Vision, cost, practicality]
    C --> E[Evidence<br/>Verified facts and unknowns]
    C --> F[What happens next<br/>Clear action impact]
    D --> G{Ready to decide?}
    E --> G
    F --> G
    G -->|Not yet| H[Save question or ask VowOS]
    H --> I[Agent follows up or researches]
    I --> C
    G -->|Yes| J[Specific approval]
    J --> K[Quiet receipt<br/>What VowOS will do next]
    K --> L[Planning Pulse updates]

    classDef start fill:#F3F5FF,stroke:#5965C5,stroke-width:2px,color:#111;
    classDef evidence fill:#E8F6EE,stroke:#2D8C62,stroke-width:2px,color:#102A1D;
    classDef decision fill:#FFF8E7,stroke:#A06B00,stroke-width:2px,color:#281500;
    classDef outcome fill:#FDEFF1,stroke:#B8485B,stroke-width:2px,color:#30040A;
    class A,B,C start;
    class D,E,F,H,I evidence;
    class G,J decision;
    class K,L outcome;
```

_Source: `docs/diagrams/vowos_ui_decision_flow.mmd`_

## Trust states

How a fact becomes something the product is allowed to say. Masterplan section 3, implemented in prototype/js/model.js.

```mermaid
flowchart LR
    A[A fact arrives] --> B{Who stated it?}
    B -->|The place, a vendor,<br/>or an official document| C[Confirmed<br/>with a timestamp]
    B -->|A third party| D[Reported]
    B -->|Nobody. The agent<br/>derived it from a pattern| E[Inferred]
    B -->|Nobody, and we know it| F[Unknown]
    Z[No state declared] -->|Never silently omitted| F

    C --> G{Past its freshness<br/>window for its category?}
    G -->|No| H["Verified by source on date"]
    G -->|Yes, downgrade one level| D

    D --> I["According to source,<br/>not yet confirmed"]
    E --> J["Our estimate based on basis"]
    F --> K["We have not confirmed this yet"]

    H --> L[May appear in a<br/>decision surface]
    I --> L
    J --> L
    K --> L
    K --> M[Never renders a figure.<br/>A figure implies a source.]

    classDef start fill:#F3F5FF,stroke:#5965C5,stroke-width:2px,color:#111;
    classDef decision fill:#FFF8E7,stroke:#A06B00,stroke-width:2px,color:#281500;
    classDef state fill:#E8F6EE,stroke:#2D8C62,stroke-width:2px,color:#102A1D;
    classDef outcome fill:#FDEFF1,stroke:#B8485B,stroke-width:2px,color:#30040A;
    class A,Z start;
    class B,G decision;
    class C,D,E,F state;
    class H,I,J,K,L,M outcome;
```

_Source: `docs/diagrams/vowos_trust_states.mmd`_

## Delegation model

What VowOS may do on its own, and the branch no setting can reach around. Masterplan section 4.

```mermaid
flowchart TB
    A[VowOS is about to act] --> B{Money, or something<br/>that cannot be undone?}
    B -->|Yes| C[Always comes back to you both.<br/>No setting reaches this branch.]
    B -->|No| D{Does it leave VowOS<br/>or touch a third party?}

    D -->|No| E[Acts and reports.<br/>Reversible, stays inside your plan.]
    D -->|Yes| F{Your delegation level}

    F -->|Propose only| G[Drafts it and holds it<br/>for your review]
    F -->|Act and report| G
    F -->|Act with standing approval| H{Covered by a scope<br/>you explicitly granted?}

    H -->|Yes| I[Acts, then tells you,<br/>naming the scope it used]
    H -->|No| G

    G --> J[You see the exact recipients<br/>and the exact message first]
    J --> K[Quiet receipt]
    I --> K
    E --> K

    classDef start fill:#F3F5FF,stroke:#5965C5,stroke-width:2px,color:#111;
    classDef decision fill:#FFF8E7,stroke:#A06B00,stroke-width:2px,color:#281500;
    classDef supporting fill:#E8F6EE,stroke:#2D8C62,stroke-width:2px,color:#102A1D;
    classDef guard fill:#FDEFF1,stroke:#B8485B,stroke-width:2px,color:#30040A;
    class A start;
    class B,D,F,H decision;
    class E,G,I,J,K supporting;
    class C guard;
```

_Source: `docs/diagrams/vowos_delegation_model.mmd`_
