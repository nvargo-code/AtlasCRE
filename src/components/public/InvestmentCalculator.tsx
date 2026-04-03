"use client";

import { useState, useMemo } from "react";

interface Inputs {
  purchasePrice: string;
  downPaymentPct: string;
  interestRate: string;
  loanTerm: string;
  closingCostsPct: string;
  rehabCost: string;
  monthlyRent: string;
  otherIncome: string;
  vacancy: string;
  propertyTax: string;
  insurance: string;
  hoa: string;
  maintenance: string;
  propertyMgmt: string;
  appreciation: string;
  rentGrowth: string;
}

const defaults: Inputs = {
  purchasePrice: "400000",
  downPaymentPct: "25",
  interestRate: "7.0",
  loanTerm: "30",
  closingCostsPct: "3",
  rehabCost: "0",
  monthlyRent: "2800",
  otherIncome: "0",
  vacancy: "5",
  propertyTax: "8000",
  insurance: "2400",
  hoa: "0",
  maintenance: "2400",
  propertyMgmt: "0",
  appreciation: "3",
  rentGrowth: "3",
};

function n(val: string): number {
  return Number(val) || 0;
}

function fmt(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${Math.round(val).toLocaleString()}`;
  return `$${val.toFixed(0)}`;
}

function pct(val: number): string {
  return `${val.toFixed(2)}%`;
}

export function InvestmentCalculator() {
  const [inputs, setInputs] = useState<Inputs>(defaults);

  function set(key: keyof Inputs, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const results = useMemo(() => {
    const price = n(inputs.purchasePrice);
    const dpPct = n(inputs.downPaymentPct) / 100;
    const downPayment = price * dpPct;
    const loanAmount = price - downPayment;
    const rate = n(inputs.interestRate) / 100 / 12;
    const term = n(inputs.loanTerm) * 12;
    const closingCosts = price * (n(inputs.closingCostsPct) / 100);
    const rehab = n(inputs.rehabCost);
    const totalCashInvested = downPayment + closingCosts + rehab;

    // Monthly mortgage payment (P&I)
    const monthlyMortgage = rate > 0 && term > 0
      ? loanAmount * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
      : 0;

    // Monthly income
    const grossRent = n(inputs.monthlyRent);
    const otherIncome = n(inputs.otherIncome);
    const vacancyLoss = grossRent * (n(inputs.vacancy) / 100);
    const effectiveIncome = grossRent + otherIncome - vacancyLoss;

    // Monthly expenses
    const propTax = n(inputs.propertyTax) / 12;
    const insurance = n(inputs.insurance) / 12;
    const hoa = n(inputs.hoa);
    const maintenance = n(inputs.maintenance) / 12;
    const mgmt = grossRent * (n(inputs.propertyMgmt) / 100);
    const totalExpenses = propTax + insurance + hoa + maintenance + mgmt;

    // Cash flow
    const noi = effectiveIncome - totalExpenses;
    const monthlyCashFlow = noi - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;
    const annualNOI = noi * 12;

    // Key metrics
    const capRate = price > 0 ? (annualNOI / price) * 100 : 0;
    const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const grossYield = price > 0 ? ((grossRent * 12) / price) * 100 : 0;
    const dscr = monthlyMortgage > 0 ? noi / monthlyMortgage : 0;
    const rentToPrice = price > 0 ? (grossRent / price) * 100 : 0;

    // 5-year projection
    const projections = [];
    let equity = downPayment;
    let propValue = price;
    let rent = grossRent;
    let cumCashFlow = 0;

    for (let year = 1; year <= 5; year++) {
      propValue *= 1 + n(inputs.appreciation) / 100;
      rent *= 1 + n(inputs.rentGrowth) / 100;
      const yearNOI = (rent * 12 * (1 - n(inputs.vacancy) / 100)) - (totalExpenses * 12);
      const yearCashFlow = yearNOI - (monthlyMortgage * 12);
      cumCashFlow += yearCashFlow;

      // Rough equity: value - remaining loan balance (simplified)
      const monthsPassed = year * 12;
      const remainingBalance = loanAmount > 0 && rate > 0
        ? loanAmount * (Math.pow(1 + rate, term) - Math.pow(1 + rate, monthsPassed)) / (Math.pow(1 + rate, term) - 1)
        : loanAmount - (loanAmount / term * monthsPassed);
      equity = propValue - Math.max(0, remainingBalance);

      projections.push({
        year,
        propertyValue: Math.round(propValue),
        equity: Math.round(equity),
        annualCashFlow: Math.round(yearCashFlow),
        cumCashFlow: Math.round(cumCashFlow),
        totalReturn: Math.round(equity - downPayment + cumCashFlow),
      });
    }

    const fiveYearROI = totalCashInvested > 0
      ? ((projections[4]?.totalReturn || 0) / totalCashInvested) * 100
      : 0;

    return {
      downPayment, loanAmount, closingCosts, totalCashInvested,
      monthlyMortgage, effectiveIncome, totalExpenses, noi,
      monthlyCashFlow, annualCashFlow, annualNOI,
      capRate, cashOnCash, grossYield, dscr, rentToPrice,
      projections, fiveYearROI,
    };
  }, [inputs]);

  const cashFlowPositive = results.monthlyCashFlow >= 0;

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          {/* Purchase */}
          <div className="bg-warm-gray p-6">
            <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Purchase</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase Price" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} prefix="$" />
              <Field label="Down Payment" value={inputs.downPaymentPct} onChange={(v) => set("downPaymentPct", v)} suffix="%" />
              <Field label="Interest Rate" value={inputs.interestRate} onChange={(v) => set("interestRate", v)} suffix="%" />
              <Field label="Loan Term" value={inputs.loanTerm} onChange={(v) => set("loanTerm", v)} suffix="yr" />
              <Field label="Closing Costs" value={inputs.closingCostsPct} onChange={(v) => set("closingCostsPct", v)} suffix="%" />
              <Field label="Rehab/Repairs" value={inputs.rehabCost} onChange={(v) => set("rehabCost", v)} prefix="$" />
            </div>
          </div>

          {/* Income */}
          <div className="bg-warm-gray p-6">
            <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Monthly Income</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly Rent" value={inputs.monthlyRent} onChange={(v) => set("monthlyRent", v)} prefix="$" />
              <Field label="Other Income" value={inputs.otherIncome} onChange={(v) => set("otherIncome", v)} prefix="$" />
              <Field label="Vacancy Rate" value={inputs.vacancy} onChange={(v) => set("vacancy", v)} suffix="%" />
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-warm-gray p-6">
            <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Annual Expenses</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Property Tax" value={inputs.propertyTax} onChange={(v) => set("propertyTax", v)} prefix="$" suffix="/yr" />
              <Field label="Insurance" value={inputs.insurance} onChange={(v) => set("insurance", v)} prefix="$" suffix="/yr" />
              <Field label="HOA (monthly)" value={inputs.hoa} onChange={(v) => set("hoa", v)} prefix="$" suffix="/mo" />
              <Field label="Maintenance" value={inputs.maintenance} onChange={(v) => set("maintenance", v)} prefix="$" suffix="/yr" />
              <Field label="Property Mgmt" value={inputs.propertyMgmt} onChange={(v) => set("propertyMgmt", v)} suffix="%" />
            </div>
          </div>

          {/* Growth */}
          <div className="bg-warm-gray p-6">
            <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Growth Assumptions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Appreciation" value={inputs.appreciation} onChange={(v) => set("appreciation", v)} suffix="%/yr" />
              <Field label="Rent Growth" value={inputs.rentGrowth} onChange={(v) => set("rentGrowth", v)} suffix="%/yr" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Monthly Cash Flow */}
          <div className={`p-8 text-center ${cashFlowPositive ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-2">Monthly Cash Flow</p>
            <p className={`text-4xl font-bold ${cashFlowPositive ? "text-green-700" : "text-red-600"}`}>
              {results.monthlyCashFlow >= 0 ? "+" : ""}{fmt(results.monthlyCashFlow)}</p>
            <p className="text-sm text-mid-gray mt-1">
              {fmt(results.annualCashFlow)}/year
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Cap Rate" value={pct(results.capRate)} good={results.capRate >= 5} />
            <MetricCard label="Cash-on-Cash" value={pct(results.cashOnCash)} good={results.cashOnCash >= 8} />
            <MetricCard label="Gross Yield" value={pct(results.grossYield)} good={results.grossYield >= 8} />
            <MetricCard label="DSCR" value={results.dscr.toFixed(2)} good={results.dscr >= 1.25} />
            <MetricCard label="Rent-to-Price" value={pct(results.rentToPrice)} good={results.rentToPrice >= 0.6} />
            <MetricCard label="5-Year ROI" value={pct(results.fiveYearROI)} good={results.fiveYearROI >= 50} />
          </div>

          {/* Cash Required */}
          <div className="bg-white border border-navy/10 p-6">
            <h3 className="text-sm font-semibold text-navy mb-3 tracking-wide uppercase">Cash Required</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-mid-gray">Down Payment</span>
                <span className="font-semibold text-navy">{fmt(results.downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mid-gray">Closing Costs</span>
                <span className="font-semibold text-navy">{fmt(results.closingCosts)}</span>
              </div>
              {n(inputs.rehabCost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-mid-gray">Rehab/Repairs</span>
                  <span className="font-semibold text-navy">{fmt(n(inputs.rehabCost))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-navy/10">
                <span className="font-semibold text-navy">Total Cash Needed</span>
                <span className="font-bold text-gold text-lg">{fmt(results.totalCashInvested)}</span>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white border border-navy/10 p-6">
            <h3 className="text-sm font-semibold text-navy mb-3 tracking-wide uppercase">Monthly Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-mid-gray">Effective Income</span>
                <span className="font-semibold text-green-700">+{fmt(results.effectiveIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mid-gray">Operating Expenses</span>
                <span className="font-semibold text-red-600">-{fmt(results.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mid-gray">NOI</span>
                <span className="font-semibold text-navy">{fmt(results.noi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mid-gray">Mortgage (P&I)</span>
                <span className="font-semibold text-red-600">-{fmt(results.monthlyMortgage)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-navy/10">
                <span className="font-semibold text-navy">Cash Flow</span>
                <span className={`font-bold text-lg ${cashFlowPositive ? "text-green-700" : "text-red-600"}`}>
                  {results.monthlyCashFlow >= 0 ? "+" : ""}{fmt(results.monthlyCashFlow)}
                </span>
              </div>
            </div>
          </div>

          {/* 5-Year Projection */}
          <div className="bg-white border border-navy/10 p-6">
            <h3 className="text-sm font-semibold text-navy mb-3 tracking-wide uppercase">5-Year Projection</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-navy">
                    <th className="text-left py-2 text-[10px] font-semibold tracking-wider uppercase">Year</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase">Value</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase">Equity</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase">Cash Flow</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {results.projections.map((p) => (
                    <tr key={p.year} className="border-b border-navy/10">
                      <td className="py-2 text-navy font-medium">Year {p.year}</td>
                      <td className="py-2 text-right text-mid-gray">{fmt(p.propertyValue)}</td>
                      <td className="py-2 text-right text-navy">{fmt(p.equity)}</td>
                      <td className="py-2 text-right text-mid-gray">{fmt(p.annualCashFlow)}</td>
                      <td className="py-2 text-right font-semibold text-gold">{fmt(p.totalReturn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">{label}</label>
      <div className="flex items-center border border-navy/15 bg-white">
        {prefix && <span className="text-mid-gray text-sm pl-3">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-2 text-sm focus:outline-none min-w-0"
        />
        {suffix && <span className="text-mid-gray text-xs pr-3">{suffix}</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`p-4 text-center border ${good ? "bg-green-50/50 border-green-200" : "bg-white border-navy/10"}`}>
      <p className={`text-xl font-bold ${good ? "text-green-700" : "text-navy"}`}>{value}</p>
      <p className="text-[9px] font-semibold tracking-[0.1em] uppercase text-mid-gray mt-1">{label}</p>
    </div>
  );
}
