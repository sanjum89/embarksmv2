
UPDATE embarksmv2.accounts
SET data = jsonb_set(
  data,
  '{employees}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN emp->>'id' = 'RAT-E007' THEN
          jsonb_set(emp, '{skills}', '[
            {"skillName":"Client Relationship Management","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Investment Communication","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Investment Research","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Construction","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Management","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Suitability and Documentation","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Regulatory Compliance","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Portfolio Risk Alignment","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Commercial Awareness","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Business Development","proficiency":"Intermediate","assessmentYear":2026,"source":"core"},
            {"skillName":"Relationship Building","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Active Listening","proficiency":"Advanced","assessmentYear":2026,"source":"core"},
            {"skillName":"Risk Governance","proficiency":"Intermediate","source":"inferred"},
            {"skillName":"Process Discipline","proficiency":"Advanced","source":"inferred"},
            {"skillName":"Mentoring and Coaching","proficiency":"Intermediate","source":"inferred"},
            {"skillName":"Knowledge Sharing","proficiency":"Intermediate","source":"inferred"}
          ]'::jsonb)
        ELSE emp
      END
    )
    FROM jsonb_array_elements(data->'employees') emp
  )
)
WHERE id = '8e1ac19e-149b-4345-956d-eac65d2490bf';
