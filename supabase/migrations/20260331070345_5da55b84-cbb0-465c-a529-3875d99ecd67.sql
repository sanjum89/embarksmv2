
WITH updated AS (
  SELECT 
    id,
    -- Add rolesCatalog
    jsonb_set(
      jsonb_set(
        data,
        '{rolesCatalog}',
        '[{
          "id": "ROLE-IM",
          "name": "Investment Manager",
          "description": "Manages client investment portfolios, provides tailored advice, and ensures regulatory compliance across all client interactions.",
          "snapshotText": "Advanced proficiency across 13 core competencies with strong client relationship and portfolio management focus.",
          "requiredSkills": [
            {"skillName": "Client Relationship Management", "proficiency": "Advanced"},
            {"skillName": "Investment Communication", "proficiency": "Advanced"},
            {"skillName": "Investment Research", "proficiency": "Advanced"},
            {"skillName": "Portfolio Construction", "proficiency": "Advanced"},
            {"skillName": "Portfolio Management", "proficiency": "Advanced"},
            {"skillName": "Suitability and Documentation", "proficiency": "Advanced"},
            {"skillName": "Regulatory Compliance", "proficiency": "Advanced"},
            {"skillName": "Portfolio Risk Alignment", "proficiency": "Advanced"},
            {"skillName": "Commercial Awareness", "proficiency": "Advanced"},
            {"skillName": "Business Development", "proficiency": "Intermediate"},
            {"skillName": "Relationship Building", "proficiency": "Advanced"},
            {"skillName": "Active Listening", "proficiency": "Advanced"}
          ]
        }]'::jsonb
      ),
      '{employees}',
      (
        SELECT jsonb_agg(
          CASE
            WHEN emp->>'id' IN ('RAT-E003', 'RAT-E004', 'RAT-E007') THEN
              emp || '{"roleId": "ROLE-IM"}'::jsonb
            ELSE emp
          END
        )
        FROM jsonb_array_elements(data->'employees') emp
      )
    ) as new_data
  FROM accounts
  WHERE id = '8e1ac19e-149b-4345-956d-eac65d2490bf'
)
UPDATE accounts SET data = updated.new_data FROM updated WHERE accounts.id = updated.id;
