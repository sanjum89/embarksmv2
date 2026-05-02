import type { NormalizedAccount } from "@/types/account-v2";
import { getCompanyProfile, getSiteProfile, getSiteRationale } from "@/lib/accountSelectors";
import { Building2, MapPin, Info } from "lucide-react";

interface Props {
  account: NormalizedAccount;
}

export default function CompanyProfilePanel({ account }: Props) {
  const company = getCompanyProfile(account);
  const site = getSiteProfile(account);
  const rationale = getSiteRationale(account);

  if (!company && !site) {
    return null;
  }

  return (
    <div className="space-y-4">
      {company && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">
              {company.name || account.branding.name}
            </h3>
          </div>
          {company.description && (
            <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {company.industry && (
              <MetaItem label="Industry" value={company.industry} />
            )}
            {company.founded && (
              <MetaItem label="Founded" value={company.founded} />
            )}
            {company.headquarters && (
              <MetaItem label="Headquarters" value={company.headquarters} />
            )}
            {company.headcount != null && (
              <MetaItem label="Headcount" value={company.headcount.toLocaleString()} />
            )}
            {company.scale && (
              <MetaItem label="Scale" value={company.scale} />
            )}
            {company.assetsUnderManagement && (
              <MetaItem label="AUM" value={company.assetsUnderManagement} />
            )}
          </div>
        </div>
      )}

      {site && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-info" />
            <h3 className="font-display text-base font-semibold text-foreground">
              {site.name || "Site Profile"}
            </h3>
          </div>
          {site.description && (
            <p className="text-sm text-muted-foreground mb-3">{site.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {site.location && <MetaItem label="Location" value={site.location} />}
            {site.headcount != null && <MetaItem label="Headcount" value={String(site.headcount)} />}
            {site.functions?.length && (
              <MetaItem label="Functions" value={site.functions.join(", ")} />
            )}
          </div>
          {site.statistics && Object.keys(site.statistics).length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(site.statistics).map(([key, val]) => (
                <MetaItem key={key} label={key} value={String(val)} />
              ))}
            </div>
          )}
        </div>
      )}

      {rationale && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Site Rationale</h3>
          </div>
          {rationale.reason && <p className="text-sm text-muted-foreground">{rationale.reason}</p>}
          {rationale.selectionCriteria?.length && (
            <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground space-y-0.5">
              {rationale.selectionCriteria.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
          {rationale.notes && (
            <p className="mt-2 text-xs text-muted-foreground italic">{rationale.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
