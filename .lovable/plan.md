

## Expand "Investment Management Foundations" to 14 Chapters

### Current State
RAT-ST-001 has 6 steps. Need to expand to 14 with realistic Rathbones investment management content, mixing PDFs and videos.

### New 14-Chapter Structure

| # | ID | Type | Title | Minutes |
|---|-----|------|-------|---------|
| 1 | RAT-ASM-001 | assessment | Investment Manager Baseline Assessment | 20 |
| 2 | RAT-LM-001 | module (PDF) | Rathbones Proposition & Client Outcomes | 35 |
| 3 | RAT-LM-002 | module (Video) | Understanding Client Risk Profiles and Objectives | 30 |
| 4 | RAT-LM-003 | module (PDF) | Portfolio Alignment & Suitability Framework | 40 |
| 5 | RAT-LM-004 | module (Video) | Asset Classes and Their Role in Client Portfolios | 25 |
| 6 | RAT-LM-005 | module (PDF) | Investment Process: Research to Recommendation | 35 |
| 7 | RAT-ASM-003 | assessment | Mid-Path Checkpoint: Portfolio & Suitability | 15 |
| 8 | RAT-LM-006 | module (Video) | Market Context and Economic Indicators for IMs | 30 |
| 9 | RAT-LM-007 | module (PDF) | Regulatory Conduct & Consumer Duty Obligations | 30 |
| 10 | RAT-LM-008 | module (Video) | Documenting Investment Decisions and Rationale | 25 |
| 11 | RAT-LM-009 | module (PDF) | Fee Structures, Costs, and Value Assessment | 20 |
| 12 | RAT-RP-001 | rolePlay | Client Portfolio Review Conversation | 25 |
| 13 | RAT-LM-010 | module (Video) | Handling Market Volatility Conversations with Clients | 25 |
| 14 | RAT-ASM-002 | assessment | Final Readiness Assessment | 20 |

**Mix**: 8 learning modules (4 PDF, 4 Video), 3 assessments, 1 role play

### Technical Approach
Single SQL UPDATE via the insert tool on the `accounts` table, replacing only the RAT-ST-001 entry in the `skillTargets` JSON array with the expanded 14-step version. The `assignedTo` stays `["RAT-E003", "RAT-E004", "RAT-E005"]` (Clara, Elliot, Sophie). All other skill targets remain unchanged.

