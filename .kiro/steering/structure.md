# Structure — Ghostlink

```
ghostlink/
├── index.html                  # Page structure, tabs, result card, viewer
├── styles.css                  # Graveyard theme, responsive layout
├── app.js                      # All logic (URL handling, archive API, UI)
├── README.md                   # Project readme
├── LICENSE                     # MIT
├── KIRO_USAGE.md               # How Kiro was used (honest record)
├── SUBMISSION.md               # Devpost submission copy
├── scripts/
│   └── smoke-test.sh           # Serve + curl + live API smoke test
└── .kiro/
    ├── specs/ghostlink/        # requirements.md, design.md, tasks.md
    ├── steering/               # product.md, tech.md, structure.md
    ├── hooks/                  # validate-on-save.json
    └── agents/                 # ghostlink-builder.json
```

Rules:

- Keep the app dependency-free. Do not add a framework or build tool.
- Never add `.kiro/` to `.gitignore` — the Kiroween rules require it in the repo.
- Keep `app.js` readable in one file; split only if it passes 800 lines.
- All user-facing copy is in English.
