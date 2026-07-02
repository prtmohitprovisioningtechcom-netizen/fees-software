import { FeeStructureFormData } from "@/components/fee-structure/fee-structure-form-dialog";

export type FeeStructureRecord = {
  classId: { _id: string; name: string };
  sessionId: { _id: string; name: string };
  admissionFee: number;
  monthlyFee: number;
  annualFee?: number;
  computerFee: number;
  examFee: number;
  otherFee: number;
  transportFee?: number;
  discount?: number;
};

export type SessionRecord = { _id: string; name: string; startDate?: string };

const extractFees = (s: FeeStructureRecord): Omit<FeeStructureFormData, "classIds" | "sessionId"> => ({
  admissionFee: s.admissionFee,
  monthlyFee: s.monthlyFee,
  annualFee: s.annualFee || 0,
  computerFee: s.computerFee,
  examFee: s.examFee,
  otherFee: s.otherFee,
  transportFee: s.transportFee || 0,
  discount: s.discount || 0,
});

export function findPrefillSource(
  structures: FeeStructureRecord[],
  sessions: SessionRecord[],
  sessionId: string,
  classIds: string[]
): { fees: Omit<FeeStructureFormData, "classIds" | "sessionId">; source: string } | null {
  if (!sessionId || structures.length === 0) return null;

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
  );
  const selectedIdx = sortedSessions.findIndex((s) => s._id === sessionId);
  const olderSessions = selectedIdx >= 0 ? sortedSessions.slice(selectedIdx + 1) : [];

  if (classIds.length === 1) {
    const classId = classIds[0];
    for (const sess of olderSessions) {
      const match = structures.find((s) => s.classId._id === classId && s.sessionId._id === sess._id);
      if (match) {
        return {
          fees: extractFees(match),
          source: `${match.classId.name} — ${match.sessionId.name}`,
        };
      }
    }
  }

  const sameSession = structures.find((s) => s.sessionId._id === sessionId);
  if (sameSession) {
    return {
      fees: extractFees(sameSession),
      source: `${sameSession.classId.name} — ${sameSession.sessionId.name}`,
    };
  }

  for (const sess of olderSessions) {
    const match = structures.find((s) => s.sessionId._id === sess._id);
    if (match) {
      return {
        fees: extractFees(match),
        source: `${match.classId.name} — ${match.sessionId.name}`,
      };
    }
  }

  const latest = structures[0];
  return {
    fees: extractFees(latest),
    source: `${latest.classId.name} — ${latest.sessionId.name}`,
  };
}

export function getClassesWithExistingStructure(
  structures: FeeStructureRecord[],
  sessionId: string
): Set<string> {
  return new Set(
    structures.filter((s) => s.sessionId._id === sessionId).map((s) => s.classId._id)
  );
}
