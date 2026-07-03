"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ALLOCATABLE_KEYS,
  DEFAULT_FEE_POLICY,
  type AllocatableFeeKey,
  type FeePolicy,
  type QuarterNumber,
} from "@/lib/fee-policy";
import { QUARTER_LABELS } from "@/lib/fee-schedule";

const QUARTERS: QuarterNumber[] = [1, 2, 3, 4];

interface FeePolicyEditorProps {
  policy: FeePolicy;
  onChange: (policy: FeePolicy) => void;
}

function getPercent(policy: FeePolicy, key: AllocatableFeeKey, quarter: QuarterNumber): number {
  return policy.allocations[key]?.find((a) => a.quarter === quarter)?.percent ?? 0;
}

function setPercent(policy: FeePolicy, key: AllocatableFeeKey, quarter: QuarterNumber, percent: number): FeePolicy {
  const allocations = { ...policy.allocations };
  const list = [...(allocations[key] || [])];
  const idx = list.findIndex((a) => a.quarter === quarter);
  const entry = { quarter, percent: Math.max(0, Math.min(100, percent)) };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  allocations[key] = list.filter((a) => a.percent > 0);
  return { ...policy, allocations };
}

function rowTotal(policy: FeePolicy, key: AllocatableFeeKey): number {
  return QUARTERS.reduce((s, q) => s + getPercent(policy, key, q), 0);
}

export function FeePolicyEditor({ policy, onChange }: FeePolicyEditorProps) {
  const updateComponent = (key: AllocatableFeeKey, patch: Partial<FeePolicy["components"][0]>) => {
    onChange({
      ...policy,
      components: policy.components.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    });
  };

  const resetDefaults = () => onChange(DEFAULT_FEE_POLICY);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-primary">How it works</p>
        <p>Tuition is always <strong>3 × monthly fee</strong> every quarter.</p>
        <p>Set % for other fees per quarter — each row must total <strong>100%</strong> (or 0% if disabled).</p>
        <p>Default: Q1 = Admission + I.C. + Annual + F.I. · Q2/Q3 = ½ Exam each · Q4 = tuition only</p>
        <p><strong>Transport</strong> (if student uses it): 11 months — Q1 = 2 months, Q2–Q4 = 3 months each. Monthly rate is set per route in Transport Routes.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Fee Component</TableHead>
              {QUARTERS.map((q) => (
                <TableHead key={q} className="text-center min-w-[72px]">Q{q}</TableHead>
              ))}
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">New only</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/40">
              <TableCell className="font-medium text-sm">Tuition (3 months)</TableCell>
              {QUARTERS.map((q) => (
                <TableCell key={q} className="text-center text-xs text-muted-foreground">Auto</TableCell>
              ))}
              <TableCell className="text-center text-xs text-muted-foreground">100%</TableCell>
              <TableCell />
            </TableRow>
            {ALLOCATABLE_KEYS.map((key) => {
              const def = policy.components.find((c) => c.key === key) || DEFAULT_FEE_POLICY.components.find((c) => c.key === key)!;
              const total = rowTotal(policy, key);
              const invalid = def.enabled && total > 0 && total !== 100;
              return (
                <TableRow key={key} className={cn(!def.enabled && "opacity-50")}>
                  <TableCell>
                    <Input
                      value={def.label}
                      onChange={(e) => updateComponent(key, { label: e.target.value })}
                      className="h-8 text-sm mb-1"
                      disabled={!def.enabled}
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={def.enabled}
                        onChange={(e) => updateComponent(key, { enabled: e.target.checked })}
                        className="rounded"
                      />
                      Enabled
                    </label>
                  </TableCell>
                  {QUARTERS.map((q) => (
                    <TableCell key={q} className="p-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!def.enabled}
                        value={getPercent(policy, key, q) || ""}
                        onChange={(e) => onChange(setPercent(policy, key, q, Number(e.target.value) || 0))}
                        className="h-8 text-center text-sm px-1"
                      />
                    </TableCell>
                  ))}
                  <TableCell className={cn("text-center text-sm font-semibold", invalid && "text-destructive")}>
                    {total}%
                  </TableCell>
                  <TableCell className="text-center">
                    {key === "admissionFee" ? (
                      <input
                        type="checkbox"
                        checked={!!def.newStudentOnly}
                        onChange={(e) => updateComponent(key, { newStudentOnly: e.target.checked })}
                        className="rounded"
                        title="Charge only for new students"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {QUARTERS.map((q) => (
          <span key={q} className="rounded-full bg-muted px-2 py-0.5">{QUARTER_LABELS[q]}</span>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={resetDefaults}>
        Reset to school default
      </Button>
    </div>
  );
}
