# Advanced FiveWin Interaction Diagrams

This document provides detailed Mermaid diagrams illustrating complex interactions within the FiveWin framework.

## Complete Application Lifecycle

```mermaid
graph TD
    A[Application Start] --> B[Initialize FiveWin]
    B --> C[Create Main Window]
    C --> D[TWindow.New()]
    D --> E[Create Window Handle]
    E --> F[WM_CREATE]
    F --> G[Initialize Components]
    G --> H[Show Window]
    H --> I[Message Loop Start]
    
    I --> J{Message Received}
    J --> K[WM_COMMAND]
    K --> L[Route to Dialog]
    L --> M[Dialog.Command()]
    M --> N[Process Control Event]
    N --> O[Execute bAction]
    
    J --> P[WM_KEYDOWN]
    P --> Q[Route to Control]
    Q --> R[TControl.KeyDown()]
    R --> S[Process Key]
    S --> T[Update Control State]
    
    J --> U[WM_LBUTTONDOWN]
    U --> V[Route to Control]
    V --> W[TControl.LButtonDown()]
    W --> X[Handle Mouse Event]
    X --> Y[Design Mode Logic]
    X --> Z[Standard Action]
    
    J --> AA[WM_PAINT]
    AA --> AB[Route to Component]
    AB --> AC[TWindow.Paint()]
    AC --> AD[Custom Drawing]
    AD --> AE[Windows GDI]
    
    I --> AF{Application End}
    AF --> AG[Close Windows]
    AG --> AH[TWindow.End()]
    AH --> AI[WM_DESTROY]
    AI --> AJ[Cleanup Resources]
    AJ --> AK[Application Exit]
    
    style A fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style I fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style AF fill:#ffebee,stroke:#c62828,stroke-width:2px
```

## Database Integration Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant UI as FiveWin UI
    participant DBFunc as Database Functions
    participant WA as Work Area
    participant DBEng as Database Engine
    participant FileSys as File System
    
    App->>UI: User Action (Add Record)
    UI->>DBFunc: DbAppend()
    DBFunc->>WA: Current Work Area
    WA->>DBEng: Request New Record
    DBEng->>FileSys: Allocate Record Space
    FileSys->>DBEng: Record Position
    DBEng->>WA: Update Record Pointer
    WA->>DBFunc: Success
    DBFunc->>UI: Return .T.
    UI->>App: Enable Save
    
    App->>UI: User Saves Data
    UI->>DBFunc: Field->NAME := "Value"
    DBFunc->>WA: Update Buffer
    WA->>WA: Store in Field Buffer
    WA->>DBFunc: Buffer Updated
    DBFunc->>UI: Return .T.
    
    App->>UI: User Closes Form
    UI->>DBFunc: DbCommit()
    DBFunc->>WA: Flush Buffer
    WA->>DBEng: Write Record
    DBEng->>FileSys: Write to Disk
    FileSys->>DBEng: Confirm Write
    DBEng->>WA: Update Indexes
    WA->>DBFunc: Success
    DBFunc->>UI: Return .T.
    UI->>App: Data Saved
    
    note over App,FileSys: This flow shows the complete<br/>path from user action to<br/>persistent storage
```

## Event Propagation System

```mermaid
graph LR
    A[Windows Message] --> B[TWindow.HandleEvent]
    B --> C{Message Type}
    
    C --> D[WM_COMMAND]
    D --> E[TDialog.Command]
    E --> F{Control Notification}
    F --> G[BN_CLICKED]
    G --> H[TButton.HandleEvent]
    H --> I[TButton.Click]
    I --> J[Execute bAction]
    
    C --> K[WM_KEYDOWN]
    K --> L[TControl.HandleEvent]
    L --> M[TControl.KeyDown]
    M --> N{Key Type}
    N --> O[VK_RETURN]
    O --> P[TButton.KeyDown]
    P --> Q[TButton.Click]
    Q --> R[Execute bAction]
    
    C --> S[WM_LBUTTONDOWN]
    S --> T[TControl.HandleEvent]
    T --> U[TControl.LButtonDown]
    U --> V{lDrag Enabled}
    V --> W[Yes - Design Mode]
    W --> X[ShowDots]
    W --> Y[Capture Mouse]
    W --> Z[Start Drag Operation]
    V --> AA[No - Standard Action]
    AA --> AB[Process Click]
    
    C --> AC[WM_PAINT]
    AC --> AD[TWindow.Paint]
    AD --> AE{Custom Drawing}
    AE --> AF[Yes - Override Paint]
    AF --> AG[Custom GDI Calls]
    AE --> AH[No - Standard Draw]
    AH --> AI[Default Painting]
    
    style A fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style C fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px
    style V fill:#fff3e0,stroke:#e65100,stroke-width:1px
    style AE fill:#e8f5e8,stroke:#2e7d32,stroke-width:1px
```

## Focus Management System

```mermaid
stateDiagram-v2
    [*] --> NoFocus
    NoFocus --> FocusReceived: WM_SETFOCUS
    FocusReceived --> Focused: Process GotFocus
    Focused --> ProcessingInput: User Interaction
    ProcessingInput --> Validation: WM_KILLFOCUS
    Validation --> Validating: Execute lValid
    Validating --> Valid: bValid Returns .T.
    Validating --> Invalid: bValid Returns .F.
    Invalid --> Focused: Maintain Focus
    Valid --> FocusLost: Complete Validation
    FocusLost --> Unfocused: Process LostFocus
    Unfocused --> NoFocus: Focus Transferred
    
    note right of NoFocus
        Control does not have focus
        Default visual state
        Not processing keyboard input
    end note
    
    note right of FocusReceived
        Windows sent focus message
        Preparing to receive input
        About to show focus indicators
    end note
    
    note right of Focused
        Control has active focus
        Ready for user input
        Showing focus rectangle
        Processing key events
    end note
    
    note right of ProcessingInput
        Handling user interactions
        Mouse clicks, key presses
        Updating internal state
        May trigger validation
    end note
    
    note right of Validation
        Preparing to lose focus
        Checking data validity
        Running validation logic
        Deciding focus transfer
    end note
    
    note right of Validating
        Executing bValid codeblock
        May interact with other controls
        Can cancel focus change
        User may see validation UI
    end note
    
    note right of Valid
        Data validation passed
        Focus transfer approved
        Preparing to lose focus
        Updating UI state
    end note
    
    note right of Invalid
        Data validation failed
        Focus transfer rejected
        Maintaining current focus
        Showing error feedback
    end note
    
    note right of FocusLost
        Focus transfer confirmed
        Cleaning up focus state
        Notifying parent container
        Updating navigation info
    end note
    
    note right of Unfocused
        Focus completely lost
        Back to default state
        No longer processing input
        Ready for next focus cycle
    end note
```

## Design Mode Architecture

```mermaid
graph TD
    A[Design Mode] --> B[lDrag Property]
    B --> C[Enable/Disable]
    
    C --> D[Enabled]
    D --> E[ShowDots]
    D --> F[LButtonDown Handler]
    D --> G[MouseMove Handler]
    D --> H[LButtonUp Handler]
    
    E --> I[Create 8 Handle Windows]
    E --> J[Position Around Control]
    E --> K[Set Visible]
    
    F --> L[Mouse Coordinates]
    L --> M{Click Location}
    M --> N[On Handle]
    N --> O[Start Resize]
    M --> P[On Control]
    P --> Q[Start Move]
    
    G --> R[Current Operation]
    R --> S[Resizing]
    S --> T[Update Size]
    S --> U[Move Handles]
    R --> V[Moving]
    V --> W[Update Position]
    V --> X[Move Handles]
    
    H --> Y[End Operation]
    Y --> Z[Release Capture]
    Y --> AA[Hide Temporary UI]
    
    C --> AB[Disabled]
    AB --> AC[HideDots]
    AB --> AD[Normal Event Handling]
    
    subgraph "Resize Handles"
        I
        J
        K
    end
    
    subgraph "Mouse Event Processing"
        L
        M
        N
        O
        P
        Q
    end
    
    subgraph "Drag Operations"
        R
        S
        T
        U
        V
        W
        X
    end
    
    style A fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style D fill:#fff3e0,stroke:#e65100,stroke-width:1px
    style AB fill:#e3f2fd,stroke:#1976d2,stroke-width:1px
```

## Multi-threading Considerations

```mermaid
graph LR
    A[Main Thread] --> B[UI Message Loop]
    B --> C[Process Windows Messages]
    C --> D[Route to FiveWin Objects]
    D --> E[Execute Methods]
    
    F[Background Thread] --> G[Database Operations]
    G --> H[File I/O]
    H --> I[Network Requests]
    I --> J[Long-running Tasks]
    
    J --> K{Thread Communication}
    K --> L[PostMessage]
    K --> M[Synchronize]
    K --> N[Thread-safe Queues]
    
    L --> B
    M --> O[Critical Sections]
    M --> P[Mutexes]
    N --> Q[Message Queue]
    Q --> B
    
    subgraph "Thread Safety"
        M
        O
        P
        N
        Q
    end
    
    note over A,F: FiveWin is primarily single-threaded<br/>UI applications but can integrate<br/>with background operations
    
    style A fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style F fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style K fill:#e3f2fd,stroke:#1976d2,stroke-width:1px
```

## Memory Management Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant FiveWin as FiveWin Framework
    participant Heap as Memory Heap
    participant GC as Garbage Collector
    participant OS as Operating System
    
    App->>FiveWin: Create TDialog
    FiveWin->>Heap: malloc() Window Data
    Heap->>FiveWin: Return Memory Pointer
    FiveWin->>OS: CreateWindowEx()
    OS->>FiveWin: Return hWnd
    
    App->>FiveWin: Add Controls
    FiveWin->>Heap: malloc() Control Objects
    Heap->>FiveWin: Return Object Pointers
    FiveWin->>FiveWin: Link Controls to Dialog
    
    App->>FiveWin: User Interaction
    FiveWin->>FiveWin: Process Events
    FiveWin->>Heap: Temporary Buffers
    Heap->>FiveWin: Buffer Memory
    FiveWin->>Heap: Release Buffers
    
    App->>FiveWin: Close Dialog
    FiveWin->>FiveWin: Destroy Controls
    FiveWin->>Heap: free() Control Objects
    FiveWin->>OS: DestroyWindow()
    OS->>Heap: free() Window Data
    FiveWin->>App: Dialog Closed
    
    note over App,OS: Proper memory management is crucial<br/>for stable FiveWin applications.<br/>Always clean up resources.
```

These advanced diagrams illustrate the complex interactions and systems within FiveWin, providing a deeper understanding of how the framework operates and how different components interact with each other.