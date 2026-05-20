import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import type { CapabilityRow, RoleRequirementRow } from "@/lib/my360v2/bucketing";
export type { CapabilityRow, RoleRequirementRow } from "@/lib/my360v2/bucketing";

export interface HrisData {
  hireDate?: string;
  tenureMonths?: number;
  location?: string;
  priorEmployer?: string;
  priorIndustry?: string;
  workPattern?: string;
  performanceBand?: string;
  engagementScore?: number;
  attritionRiskFlag?: string;
  personaNarrative?: string;
  yearsExperience?: number;
  certifications?: Array<{ name: string; status: string; awardedDate?: string; targetDate?: string }>;
  education?: string[];
}

export interface EmployeeRecord {
  id: string;
  name: string;
  title?: string;
  email?: string;
  reportsTo?: string;
  hris?: HrisData;
}

export interface CompetencyRow {
  competency_id: string;
  track_code: string;
  competency_name: string;
  display_order: number;
  supporting_skills: string[];
}

export interface PersonaCompetency {
  competency_id: string;
  current_level: number;
  confidence?: string;
  validation_needed?: boolean;
  short_rationale?: string | null;
}

export interface RoleCompetencyReq {
  competency_id: string;
  required_level: number;
}

export interface CohortInfo {
  id: string;
  cohort_code: string;
  cohort_title: string;
  role_cohort_code: string;
  start_date?: string;
  due_date?: string;
  common_assessment_date?: string;
}

export interface ModuleRow {
  module_code: string;
  module_title: string;
  module_summary?: string | null;
  progression_stage?: string | null;
  display_order: number;
  difficulty_level?: string;
}

export interface AdaptationRow {
  module_code: string;
  adaptation_type: string;
  reason?: string | null;
  manager_note?: string | null;
  visible_to_learner?: boolean;
}

export interface LearnerProgressRow {
  module_code: string;
  chapter_code?: string | null;
  status: string;
  is_locked: boolean;
  completed_at?: string | null;
}

export interface PersonaBasicsData {
  location?: string;
  office?: string;
  work_pattern?: string;
  languages?: string[];
  pronouns?: string;
  joined_team_months_ago?: number;
  manager_label?: string;
  prior_employer?: string;
  prior_industry?: string;
  years_experience?: number;
  education?: string[];
  certifications?: Array<{ name: string; status: string; target?: string }>;
}

export interface PersonaCareerHereData {
  current_role?: string;
  team?: string;
  tenure_label?: string;
  timeline?: Array<{ role: string; since?: string; from?: string; to?: string }>;
}

export interface PersonaAspirationData {
  north_star?: string;
  next_move?: string;
  horizon_months?: number;
  interests?: string[];
}

export interface PersonaSuccessionData {
  closed_loop_summary?: string;
  engagement_score?: number;
  human_ai_fit?: string;
  workforce_of_the_future?: string;
  successor_for?: string[];
  potential_successors?: string[];
}

export interface PersonaFeedbackRow {
  feedback_at: string;
  author_label: string;
  sentiment: string;
  body: string;
}
export interface PersonaStretchRow {
  title: string;
  detail?: string;
  status: string;
}
export interface PersonaRoleRow {
  role_title: string;
  fit_percent: number;
  horizon_months?: number;
  rationale?: string;
}

export interface My360Data {
  loading: boolean;
  error?: string;
  eligible: boolean;
  employee?: EmployeeRecord;
  personaCode?: string;
  roleCohortCode: string;
  proficiency: CapabilityRow[];
  requirements: RoleRequirementRow[];
  competencyCatalog: CompetencyRow[];
  personaCompetencies: PersonaCompetency[];
  roleCompetencyReqs: RoleCompetencyReq[];
  cohort?: CohortInfo;
  modules: ModuleRow[];
  adaptations: AdaptationRow[];
  progress: LearnerProgressRow[];
  // Persona content
  basics?: PersonaBasicsData;
  careerHere?: PersonaCareerHereData;
  aspiration?: PersonaAspirationData;
  succession?: PersonaSuccessionData;
  managerFeedback: PersonaFeedbackRow[];
  stretchTasks: PersonaStretchRow[];
  potentialRoles: PersonaRoleRow[];
}

const empty: My360Data = {
  loading: true,
  eligible: false,
  roleCohortCode: "assoc_im",
  proficiency: [],
  requirements: [],
  competencyCatalog: [],
  personaCompetencies: [],
  roleCompetencyReqs: [],
  modules: [],
  adaptations: [],
  progress: [],
  managerFeedback: [],
  stretchTasks: [],
  potentialRoles: [],
};


export function useMy360Data(): My360Data & { refresh: () => void } {
  const { activeAccount } = useAccount();
  const { user } = useUser();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<My360Data>(empty);

  useEffect(() => {
    let cancelled = false;
    const accountId = (activeAccount as any)?.id as string | undefined;
    const employeeId = user.id;
    if (!accountId || !employeeId) {
      setState({ ...empty, loading: false });
      return;
    }

    (async () => {
      setState((s) => ({ ...s, loading: true }));

      // Pull employee record + persona assignment from account jsonb
      const employees = ((activeAccount as any)?.data?.employees ?? []) as EmployeeRecord[];
      const employee = employees.find((e) => e.id === employeeId);

      // Persona code + role cohort
      const { data: persona } = await supabase
        .from("employee_persona_assignments")
        .select("persona_code, role_progression_code")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId)
        .maybeSingle();

      const personaCode = (persona as any)?.persona_code as string | undefined;
      const personaRoleProgression = (persona as any)?.role_progression_code as string | undefined;

      // Look up persona's default role progression as a fallback
      let personaDefaultRole: string | undefined;
      if (personaCode) {
        const { data: personaRow } = await supabase
          .from("employee_personas")
          .select("default_role_progression_code")
          .eq("account_id", accountId)
          .eq("code", personaCode)
          .maybeSingle();
        personaDefaultRole = (personaRow as any)?.default_role_progression_code ?? undefined;
      }

      // Capability proficiency
      const { data: prof } = await supabase
        .from("employee_capability_proficiency")
        .select("capability_code,current_level,source,confidence,validation_needed,short_rationale")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId);

      const eligible = !!prof && prof.length > 0;

      if (!eligible) {
        if (!cancelled) {
          setState({
            ...empty,
            loading: false,
            eligible: false,
            employee,
            personaCode,
          });
        }
        return;
      }

      // Enrollment → cohort → modules + progress
      const { data: enroll } = await supabase
        .from("cohort_enrollments")
        .select("cohort_id")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId)
        .eq("status", "active")
        .maybeSingle();

      const cohortId = (enroll as any)?.cohort_id as string | undefined;

      const cohortRes = cohortId
        ? await supabase
            .from("cohorts")
            .select("id,cohort_code,cohort_title,role_cohort_code,start_date,due_date,common_assessment_date")
            .eq("id", cohortId)
            .maybeSingle()
        : ({ data: null } as any);

      const cohort = (cohortRes as any).data as CohortInfo | null;
      const roleCohortCode =
        cohort?.role_cohort_code ?? personaRoleProgression ?? personaDefaultRole ?? "assoc_im";

      const [reqRes, ccRes, pcpRes, rcrRes] = await Promise.all([
        supabase
          .from("role_capability_requirements")
          .select("capability_code,required_level,criticality,source_module_codes")
          .eq("account_id", accountId)
          .eq("role_cohort_code", roleCohortCode),
        supabase
          .from("competency_catalog")
          .select("competency_id,track_code,competency_name,display_order,supporting_skills")
          .eq("account_id", accountId)
          .order("display_order"),
        personaCode
          ? supabase
              .from("persona_competency_profiles")
              .select("competency_id,current_level,confidence,validation_needed,short_rationale")
              .eq("account_id", accountId)
              .eq("persona_code", personaCode)
          : Promise.resolve({ data: [] } as any),
        supabase
          .from("role_competency_requirements")
          .select("competency_id,required_level")
          .eq("account_id", accountId)
          .eq("role_cohort_code", roleCohortCode),
      ]);

      const [modulesRes, adaptRes, progressRes] = await Promise.all([
        supabase
          .from("catalog_modules")
          .select("module_code,module_title,module_summary,progression_stage,display_order,difficulty_level")
          .eq("account_id", accountId)
          .eq("role_cohort_code", roleCohortCode)
          .order("display_order"),
        personaCode
          ? supabase
              .from("persona_module_adaptations")
              .select("module_code,adaptation_type,reason,manager_note,visible_to_learner")
              .eq("account_id", accountId)
              .eq("persona_code", personaCode)
          : Promise.resolve({ data: [] } as any),
        cohortId
          ? supabase
              .from("learner_progress")
              .select("module_code,chapter_code,status,is_locked,completed_at")
              .eq("account_id", accountId)
              .eq("employee_id", employeeId)
              .eq("cohort_id", cohortId)
          : Promise.resolve({ data: [] } as any),
      ]);

      if (cancelled) return;
      setState({
        loading: false,
        eligible: true,
        employee,
        personaCode,
        roleCohortCode,
        proficiency: (prof ?? []) as CapabilityRow[],
        requirements: ((reqRes as any).data ?? []) as RoleRequirementRow[],
        competencyCatalog: ((ccRes as any).data ?? []) as CompetencyRow[],
        personaCompetencies: ((pcpRes as any).data ?? []) as PersonaCompetency[],
        roleCompetencyReqs: ((rcrRes as any).data ?? []) as RoleCompetencyReq[],
        cohort: cohort ?? undefined,
        modules: ((modulesRes as any).data ?? []) as ModuleRow[],
        adaptations: ((adaptRes as any).data ?? []) as AdaptationRow[],
        progress: ((progressRes as any).data ?? []) as LearnerProgressRow[],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, user.id, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
