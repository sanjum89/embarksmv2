
UPDATE accounts
SET data = jsonb_set(
  data,
  '{employees}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN emp->>'id' = 'RAT-E004' THEN
          jsonb_set(emp, '{skills}', '[
            {"skillName":"Client Relationship Management","proficiency":"Expert","assessmentYear":2026,"source":"core"},
            {"skillName":"Investment Communication","proficiency":"Expert","assessmentYear":2026,"source":"core"},
            {"skillName":"Investment Research","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Construction","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Management","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Suitability and Documentation","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Regulatory Compliance","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Risk Alignment","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Commercial Awareness","proficiency":"Expert","assessmentYear":2026,"source":"core"},
            {"skillName":"Business Development","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Relationship Building","proficiency":"Expert","assessmentYear":2026,"source":"core"},
            {"skillName":"Active Listening","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Proposition Development","proficiency":"Advanced","source":"inferred"},
            {"skillName":"Stakeholder Management","proficiency":"Advanced","source":"inferred"},
            {"skillName":"Mentoring and Coaching","proficiency":"Intermediate","source":"inferred"},
            {"skillName":"Change Adoption / Transformation Readiness","proficiency":"Intermediate","source":"inferred"}
          ]'::jsonb)
        ELSE emp
      END
    )
    FROM jsonb_array_elements(data->'employees') emp
  )
)
WHERE id = '8e1ac19e-149b-4345-956d-eac65d2490bf';
