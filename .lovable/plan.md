

## Generate Rich Content for All Rathbones Skill Target Modules

### Problem

The DB stores skill target steps with IDs like `RAT-INTRO-LM-001`, `RAT-LM-001`, etc. — but there are no matching modules in the catalog. The resolver's fallback synthesizes a module using only `step.description` (a one-liner), so clicking any chapter shows a generic placeholder instead of detailed training content.

There are **21 unique module steps** across 5 skill targets. Only 10 transcripts exist (keyed as `intro-heritage`, `m-rb1`, etc.) but they're mapped to different module IDs (`m-rb-intro-heritage`, `m-rb1`). The DB step IDs never match.

### Solution

Two changes:

**1. Add DB-step-ID modules to the mock catalog** (`src/data/mock.ts`)

Add module entries with IDs matching the DB step IDs so the resolver finds them directly. Map to existing transcripts where content matches, and to new transcripts for the rest.

Mapping of DB step IDs to existing transcripts:
- `RAT-INTRO-LM-001` → `intro-heritage` (Our Heritage & Values)
- `RAT-INTRO-LM-002` → `intro-invest` (How We Invest)
- `RAT-INTRO-LM-003` → `intro-90days` (Your First 90 Days)
- `RAT-LM-001` → reuse/adapt `m-rb1` (Rathbones Proposition & Client Outcomes)
- `RAT-LM-003` → reuse/adapt `m-rb3` (Portfolio Alignment & Suitability)
- `RAT-LM-005` (Investment Process) → reuse/adapt `m-rb5`

New transcripts needed (~15 modules):
- `RAT-LM-002`: Understanding Client Risk Profiles and Objectives
- `RAT-LM-004`: Asset Classes and Their Role in Client Portfolios
- `RAT-LM-006`: Market Context and Economic Indicators for IMs
- `RAT-LM-007`: Regulatory Conduct & Consumer Duty Obligations
- `RAT-LM-008`: Documenting Investment Decisions and Rationale
- `RAT-LM-009`: Fee Structures, Costs, and Value Assessment
- `RAT-LM-010`: Handling Market Volatility Conversations with Clients
- `RAT-BR-LM-001`: Investment Management Vocabulary and Core Concepts
- `RAT-BR-LM-002`: How Rathbones IMs Work with Client Objectives
- `RAT-BR-LM-003`: Portfolio Basics, Risk, and Suitability Foundations
- `RAT-BR-LM-004`: Adjacent Financial Experience vs. IM Expectations
- ST-002 modules (Business Dev): `RAT-LM-004` (Business Development Pipeline), `RAT-LM-005` (Presenting the Rathbones Proposition)
- ST-003 modules (Mentoring): `RAT-LM-006` (Supporting Junior Team Members), `RAT-LM-007` (Contributing to Internal Forums)

Note: Some IDs (RAT-LM-004 through RAT-LM-007) are reused across skill targets with different titles. The resolver matches by step ID within the specific skill target context, so the synthesized module approach will handle these — but for direct catalog matches, we'll need to use the ST-001 versions as primary and let the synthesizer handle the alternates with richer descriptions.

**2. Expand `rathbonesTranscripts.ts`** with ~15 new 800-1200 word transcripts

Each transcript will be realistic, Rathbones-specific training content covering the module topic in depth — similar quality to the existing `intro-heritage` transcript. Video modules will be written as narration transcripts.

### Files Changed

| File | Change |
|---|---|
| `src/data/rathbonesTranscripts.ts` | Add ~15 new transcript entries keyed by DB step ID |
| `src/data/mock.ts` | Add ~18 module entries with DB step IDs pointing to transcript content |

### Content generation approach

Research-grounded content using Rathbones public information (2024 Annual Report, FCA Consumer Duty requirements, wealth management industry practices) to make each transcript realistic and specific to Rathbones' operating model.

