
CREATE OR REPLACE FUNCTION embarksmv2.mirror_id(p_target uuid, p_id uuid)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_id IS NULL THEN NULL
              ELSE md5(p_target::text || ':' || p_id::text)::uuid END
$$;

CREATE OR REPLACE FUNCTION embarksmv2.mirror_account_content(p_source uuid, p_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tables text[] := ARRAY[
    'domains','learning_tracks','role_progressions','employee_personas',
    'competency_catalog','module_competency_tags',
    'role_capability_requirements','role_competency_requirements',
    'catalog_modules','catalog_chapters','catalog_assessment_blueprints',
    'catalog_evidence_tasks','catalog_readiness_gates','catalog_gate_requirements',
    'persona_profile_basics','persona_aspiration','persona_career_here',
    'persona_competency_profiles','persona_manager_feedback','persona_module_adaptations',
    'persona_potential_roles','persona_stretch_tasks','persona_succession_notes',
    'employee_capability_proficiency','employee_persona_assignments','mentor_assignments',
    'cohorts','cohort_enrollments','cohort_sessions','cohort_session_attendees',
    'cohort_announcements','cohort_study_groups',
    'learner_progress','learner_analytics',
    'assessment_instances','micro_learnings','chapter_lock_events',
    'readiness_gate_results','promotion_signals','reflections',
    'workforce_group_compliance_rules','workforce_groups',
    'workforce_group_members','workforce_group_links'
  ];
  v_fks jsonb := jsonb_build_object(
    'cohort_enrollments', jsonb_build_array('cohort_id'),
    'cohort_sessions', jsonb_build_array('cohort_id'),
    'cohort_session_attendees', jsonb_build_array('session_id'),
    'cohort_announcements', jsonb_build_array('cohort_id'),
    'cohort_study_groups', jsonb_build_array('cohort_id'),
    'learner_progress', jsonb_build_array('cohort_id'),
    'learner_analytics', jsonb_build_array('cohort_id'),
    'assessment_instances', jsonb_build_array('cohort_id'),
    'micro_learnings', jsonb_build_array('cohort_id','source_assessment_id'),
    'chapter_lock_events', jsonb_build_array('cohort_id','triggered_by_assessment_id'),
    'readiness_gate_results', jsonb_build_array('cohort_id'),
    'promotion_signals', jsonb_build_array('cohort_id','next_cohort_id'),
    'workforce_group_members', jsonb_build_array('group_id'),
    'workforce_group_links', jsonb_build_array('group_id')
  );
  v_selfrefs jsonb := jsonb_build_object(
    'cohorts', jsonb_build_array('next_cohort_id'),
    'workforce_groups', jsonb_build_array('parent_id')
  );
  t text;
  col text;
  ov text;
  i int;
  n bigint;
  result jsonb := '{}'::jsonb;
BEGIN
  IF p_source IS NULL OR p_target IS NULL OR p_source = p_target THEN
    RAISE EXCEPTION 'source and target accounts must be distinct and non-null';
  END IF;

  -- Clear target rows in reverse dependency order
  FOR i IN REVERSE array_length(v_tables, 1)..1 LOOP
    EXECUTE format('DELETE FROM embarksmv2.%I WHERE account_id = $1', v_tables[i]) USING p_target;
  END LOOP;

  -- Copy rows in dependency order
  FOREACH t IN ARRAY v_tables LOOP
    ov := 'jsonb_build_object(''account_id'', $2, ''id'', embarksmv2.mirror_id($2, x.id))';

    IF v_fks ? t THEN
      FOR col IN SELECT jsonb_array_elements_text(v_fks -> t) LOOP
        ov := ov || format(' || jsonb_build_object(%L, embarksmv2.mirror_id($2, x.%I))', col, col);
      END LOOP;
    END IF;

    IF v_selfrefs ? t THEN
      FOR col IN SELECT jsonb_array_elements_text(v_selfrefs -> t) LOOP
        ov := ov || format(' || jsonb_build_object(%L, NULL::uuid)', col);
      END LOOP;
    END IF;

    EXECUTE format(
      'INSERT INTO embarksmv2.%1$I SELECT (jsonb_populate_record(NULL::embarksmv2.%1$I, to_jsonb(x) || %2$s)).* FROM embarksmv2.%1$I x WHERE x.account_id = $1',
      t, ov
    ) USING p_source, p_target;

    GET DIAGNOSTICS n = ROW_COUNT;

    IF v_selfrefs ? t THEN
      FOR col IN SELECT jsonb_array_elements_text(v_selfrefs -> t) LOOP
        EXECUTE format(
          'UPDATE embarksmv2.%1$I d SET %2$I = embarksmv2.mirror_id($2, s.%2$I) FROM embarksmv2.%1$I s WHERE s.account_id = $1 AND d.id = embarksmv2.mirror_id($2, s.id) AND s.%2$I IS NOT NULL',
          t, col
        ) USING p_source, p_target;
      END LOOP;
    END IF;

    result := result || jsonb_build_object(t, n);
  END LOOP;

  RETURN result;
END
$$;

REVOKE ALL ON FUNCTION embarksmv2.mirror_account_content(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION embarksmv2.mirror_account_content(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION embarksmv2.mirror_id(uuid, uuid) TO authenticated, service_role;
