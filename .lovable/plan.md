

## Replace Skills and Fix RoleIds for 9 Employees

### What

Convert 9 employees from the legacy plain-string skills format to the structured object format with `source` tags, using the exact skill lists provided. Also fix `roleId` prefixes to match the catalog.

### Database Updates (SQL via insert tool)

**For each of the 9 employees**, replace the `skills` array with structured objects and remove the legacy `proficiency` map. Also fix `roleId` where needed.

| Employee | ID | roleId Fix | Core Skills | Inferred Skills |
|---|---|---|---|---|
| Helena Fairchild | RAT-E001 | `RAT-ROLE-ADMIN` → `ROLE-ADMIN` | 12 (Platform Admin, Workflow Config, Data Quality Mgmt, etc.) | 4 (Cross-Functional Collab, Process Improvement, Training & Enablement, Operational Risk) |
| Julian Ashcombe | RAT-E002 | `RAT-ROLE-DIRECTOR` → `ROLE-ID` | 12 (CRM Expert, Investment Comm Expert, etc.) | 4 (Stakeholder Mgmt Expert, Wealth Planning, Strategic Planning, Professional Integrity) |
| Sophie Alder | RAT-E005 | `RAT-ROLE-IM` → `ROLE-GT` | 12 (CRM Beginner, Investment Comm Beginner, etc.) | 4 (Learning Agility Advanced, Adaptability, Client Admin, Collaboration) |
| Harriet Cole | RAT-E006 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (CRM Advanced, Suitability Expert, etc.) | 4 (Mentoring Advanced, Knowledge Sharing, Wealth Planning, Professional Integrity Expert) |
| Beatrice Long | RAT-E008 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (Regulatory Compliance Expert, Attention to Detail Expert, etc.) | 4 (Risk Governance, Knowledge Sharing, Process Improvement, Wealth Planning) |
| Louis Everard | RAT-E009 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (Active Listening Expert, Relationship Building Expert, etc.) | 4 (Mentoring, Stakeholder Mgmt, Knowledge Sharing, Change Adoption) |
| Amelia Forsyth | RAT-E010 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (Business Dev Intermediate, rest Advanced, etc.) | 4 (Mentoring, Wealth Planning, Stakeholder Mgmt, Leadership) |
| Theo Redgrave | RAT-E011 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (CRM Intermediate, Research Advanced, etc.) | 4 (Resilience, Stakeholder Mgmt, Learning Agility, Presentation Confidence) |
| Isla Marlowe | RAT-E012 | `RAT-ROLE-IM` → `ROLE-IM` | 12 (Commercial Awareness Intermediate, Wealth Planning Collab Advanced, etc.) | 4 (Mentoring, Stakeholder Mgmt, Knowledge Sharing, Process Improvement) |

**Format** for each skill entry (matching Clara/Elliot/Nathan/Felix):
```json
{ "skillName": "...", "proficiency": "...", "source": "core", "assessmentYear": 2026 }
```
Inferred skills omit `assessmentYear`.

**Also**: Remove the legacy `proficiency` map from each employee record and fix `roleId` values.

### No Code Changes

The parser and profile generator already handle structured skills with `source` tags correctly.

### Files Modified

| File | Change |
|---|---|
| Database (SQL) | Replace skills arrays, remove proficiency maps, fix roleIds for 9 employees |

