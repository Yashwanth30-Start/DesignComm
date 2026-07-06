# hooks

Reserved for shared hooks that don't belong to one feature — e.g. a future `useWorkflowStatus` that derives Ready/Waiting/Blocked/Commissioned/Complete from linked records. Empty in V1: the motion primitives use Motion's own `useScroll`/`useTransform` directly and don't need a wrapper yet.
