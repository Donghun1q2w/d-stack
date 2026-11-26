### Multi-phase plan

**You own the plan, not the code. The plan is a checklist an owner runs box by box and the operator audits from the evidence.** The plan is the deliverable. Do not implement.

1. When the change is one or two files with an obvious approach, skip the plan. Say so and stop.
2. Settle open questions by prototype before you write, per `playbooks/prototype.md`. Ask the operator only about a product or preference call that no run can settle.
3. Write the plan file. Open with what changes, the unit ids in landing order, and the dependency graph, which says which units are independent, which wait for which, and the files each may touch. Then one section per unit. One unit is one change with its own evidence, landed on `main` as one commit or a short run of ordered commits (the **sequence-verifiable-units** principle skill). Each section has checkboxes for what it depends on, the files it edits, the one change it builds, the result you see, and its verification.
4. Tests alone are not sufficient verification. A unit is verified only when its unit, live, and perf boxes are all checked. Each live box drives the real surface with a concrete scenario and a pass predicate. The perf box names the metric, the probe, the `main` baseline measured first, and the number that fails. A unit that changes an interaction waits for the operator's review before it is pushed.
5. Every unit leaves `main` green on its own, because each one lands through `playbooks/commit-and-push.md` before the next starts. A unit that cannot stand alone is merged into its neighbor in the plan.
6. Hand back the plan path and stop. Execution starts on the operator's explicit go.

**Reply:** the plan path, the unit ids with their dependencies and the review-gated set, and what stays unproven.
