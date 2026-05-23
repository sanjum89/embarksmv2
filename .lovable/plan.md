Export the existing Product Feature Specification at `.lovable/plan.md` to `/mnt/documents/` in two formats:

1. **Markdown** — copy as `product-feature-spec.md`.
2. **PDF** — render the Markdown to `product-feature-spec.pdf` using a Python script (markdown → HTML → PDF via reportlab/weasyprint), with QA pass on each page.

Both files will be delivered via `<presentation-artifact>` tags so the user can download them directly. No code changes to the app.