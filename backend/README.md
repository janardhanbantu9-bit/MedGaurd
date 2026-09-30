Backend modules are deliberately separated into services, safety rules and the orchestration pipeline.

Core flow:
Groq extraction -> Zod validation -> RxNorm -> evidence -> safety rules -> Groq explanation.
