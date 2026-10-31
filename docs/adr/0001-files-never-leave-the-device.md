# Files never leave the device, and there is no telemetry

Rantakit promises "no internet needed" so that people can process sensitive documents (ID cards, contracts, medical and HR files) without trusting a server. We decided that every file operation runs on the device, and that the app never sends file content, file names, or usage data anywhere. Telemetry, crash reporting, and cloud processing are permanent non-goals, even when they would make the product easier to measure or improve.

Only two kinds of network use are allowed, and neither ever carries file information:

- **Update check.** On by default (laypeople rarely change defaults, and they need security fixes), shows a quiet notice with a one-click download, can be switched off in Settings, and is disabled when a store handles updates.
- **Optional language downloads.** Indonesian and English data (for example OCR languages) ship with the app; other languages are downloaded only when the user explicitly asks for one, with its size shown first.

## Consequences

- Success metrics cannot come from in-app analytics; they have to come from public signals (store statistics, downloads, ratings, issues, usability tests).
- Every feature must work fully offline in Indonesian and English with nothing downloaded.
