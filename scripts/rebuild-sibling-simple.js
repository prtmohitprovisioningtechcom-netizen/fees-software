const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/app/fee-collection/[studentId]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update State
content = content.replace(
  'const [selectedSiblings, setSelectedSiblings] = useState<Record<string, number[]>>({});',
  'const [selectedSiblings, setSelectedSiblings] = useState<string[]>([]);'
);

// 2. Remove toggleSiblingQuarter & getSiblingSelectedAmount & replace toggleQuarter
const toggleOldRegex = /const toggleSiblingQuarter = \([\s\S]*?setPaymentAmount\(String\(Math\.min\(sum, totalDue\)\)\);\n    \}\n  \};/m;
const newToggle = `
  const toggleSibling = (sibId: string) => {
    setSelectedSiblings(prev => 
      prev.includes(sibId) ? prev.filter(id => id !== sibId) : [...prev, sibId]
    );
  };

  const getSiblingCalculatedAmount = (sibId: string) => {
    const sib = siblings.find(s => s.student._id === sibId);
    if (!sib) return 0;
    return selectedQuarters.reduce((acc, q) => {
      const qRow = sib.calculation?.quarterlySchedule?.find((item: any) => item.quarter === q);
      return acc + (qRow?.pending || 0);
    }, 0);
  };

  const toggleQuarter = (quarter: number, quarterPending: number) => {
    if (quarterPending <= 0) return;
    
    let newQuarters;
    if (selectedQuarters.includes(quarter)) {
      newQuarters = selectedQuarters.filter(q => q !== quarter);
    } else {
      newQuarters = [...selectedQuarters, quarter].sort();
    }
    setSelectedQuarters(newQuarters);
  };

  // Auto-calculate grand total whenever quarters or siblings change
  useEffect(() => {
    const totalDue = discountChanged ? previewNetDue() : (displayCalc?.previousDue ?? 0);
    let mainSum = 0;
    if (selectedQuarters.length > 0) {
      mainSum = selectedQuarters.reduce((acc, q) => {
        const qRow = displaySchedule.find((item) => item.quarter === q);
        return acc + (qRow?.pending || 0);
      }, 0);
    }
    
    let sibSum = 0;
    selectedSiblings.forEach(sibId => {
      sibSum += getSiblingCalculatedAmount(sibId);
    });

    const grandTotal = Math.min(mainSum, totalDue) + sibSum;
    
    if (selectedQuarters.length === 0) {
      setPaymentAmount("");
    } else {
      setPaymentAmount(String(grandTotal));
    }
  }, [selectedQuarters, selectedSiblings, displaySchedule, discountChanged, displayCalc, siblings]);
`;
content = content.replace(toggleOldRegex, newToggle);

// 3. Update handleCollect
const handleCollectRegex = /const handleCollect = async \(\) => \{[\s\S]*?finally \{\n      setSubmitting\(false\);\n    \}\n  \};/m;
const newHandleCollect = `const handleCollect = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Enter valid payment amount", variant: "destructive" });
      return;
    }
    if (isSuperAdmin && paymentDate && paymentDate > todayCalendarDateString()) {
      toast({ title: "Invalid date", description: "Payment date cannot be in the future", variant: "destructive" });
      return;
    }
    if (transportRequired && !transportRouteId) {
      toast({ title: "Transport route needed", description: "Select a route before collecting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Main student amount calculation
      const totalDue = discountChanged ? previewNetDue() : (displayCalc?.previousDue ?? 0);
      let mainSum = selectedQuarters.reduce((acc, q) => {
        const qRow = displaySchedule.find((item) => item.quarter === q);
        return acc + (qRow?.pending || 0);
      }, 0);
      mainSum = Math.min(mainSum, totalDue);

      const mainRes = await feePaymentsApi.collect({
        studentId,
        sessionId: session?._id || sessionId,
        feeDiscount: Number(studentDiscount) || 0,
        paymentAmount: selectedSiblings.length > 0 ? mainSum : amount, // if siblings, mainSum is strict. If no siblings, they might have typed custom amount.
        paymentMode,
        remarks: (selectedQuarters.length > 0 ? \`Quarters: \${selectedQuarters.join(", ")}\` : "") + (remarks ? \` - \${remarks}\` : ""),
        includeAdmission,
        quarter: selectedQuarters.length > 0 ? Math.min(...selectedQuarters) : undefined,
        paymentType: selectedQuarters.length > 0 ? "quarterly" : "custom",
        ...(isSuperAdmin && paymentDate ? { paymentDate } : {}),
      }) as { data: { _id?: string; id?: string } };
      
      const ids = [mainRes.data._id || mainRes.data.id];

      // Collect for siblings
      for (const sibId of selectedSiblings) {
        const sibAmount = getSiblingCalculatedAmount(sibId);
        const sib = siblings.find(s => s.student._id === sibId);
        if (sibAmount > 0 && sib) {
          const sibRes = await feePaymentsApi.collect({
             studentId: sibId,
             sessionId: session?._id || sessionId,
             feeDiscount: (sib.student.feeDiscount as number) || 0,
             paymentAmount: sibAmount,
             paymentMode,
             remarks: \`Quarters: \${selectedQuarters.join(", ")} (Family grouped payment)\`,
             includeAdmission: false,
             quarter: selectedQuarters.length > 0 ? Math.min(...selectedQuarters) : undefined,
             paymentType: selectedQuarters.length > 0 ? "quarterly" : "custom",
             ...(isSuperAdmin && paymentDate ? { paymentDate } : {}),
          }) as { data: { _id?: string; id?: string } };
          ids.push(sibRes.data._id || sibRes.data.id);
        }
      }

      window.location.href = \`/receipt/\${ids.filter(Boolean).join(",")}\`;
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };`;
content = content.replace(handleCollectRegex, newHandleCollect);

// 4. Update the sibling UI
const siblingUIOldRegex = /\{\/\* Siblings \*\/\}([\s\S]*?)<\/CardContent>\n            <\/Card>\n          \)\}/m;
const newSiblingUI = `{/* Siblings */}
          {siblings.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/10">
              <CardHeader className="pb-3 border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
                  <span className="h-4 w-4 bg-blue-600 mask mask-user"></span>
                  Family / Siblings Found
                </CardTitle>
                <p className="text-xs text-muted-foreground font-normal">
                  Tick the checkbox to collect fees for siblings. The same quarters you selected above will be added to the sibling's fee automatically!
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {siblings.map((sib, i) => {
                  const sibId = sib.student._id as string;
                  const isChecked = selectedSiblings.includes(sibId);
                  const sibAmount = getSiblingCalculatedAmount(sibId);
                  
                  return (
                    <label 
                      key={sibId} 
                      className={\`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all \${isChecked ? 'bg-blue-100/50 border-blue-300' : 'bg-white dark:bg-background hover:bg-slate-50'}\`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => toggleSibling(sibId)}
                          disabled={selectedQuarters.length === 0}
                        />
                        <div>
                          <p className="font-semibold text-sm">{displayStudentField(sib.student.studentName as string)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Class: {refName(sib.student.classId as { name: string })}
                          </p>
                        </div>
                      </div>
                      
                      {selectedQuarters.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Select quarter above</span>
                      ) : (
                        <div className="text-right">
                          {sibAmount > 0 ? (
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                              + {formatCurrency(sibAmount)}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">No dues for this quarter</span>
                          )}
                        </div>
                      )}
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          )}`;
content = content.replace(siblingUIOldRegex, newSiblingUI);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Applied simple sibling flow');
