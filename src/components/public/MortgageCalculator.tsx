"use client";

import { useState, useMemo } from "react";

interface MortgageCalculatorProps {
  listPrice?: number;
}

export function MortgageCalculator({ listPrice }: MortgageCalculatorProps) {
  const [price, setPrice] = useState(listPrice || 500000);
  const [downPercent, setDownPercent] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);
  const [taxRate, setTaxRate] = useState(2.0);

  const calc = useMemo(() => {
    const downPayment = price * (downPercent / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;

    if (monthlyRate === 0) {
      return {
        monthlyPayment: loanAmount / numPayments,
        principal: loanAmount / numPayments,
        interest: 0,
        tax: (price * (taxRate / 100)) / 12,
        insurance: (price * 0.003) / 12,
        total: loanAmount / numPayments + (price * (taxRate / 100)) / 12 + (price * 0.003) / 12,
        downPayment,
        loanAmount,
      };
    }

    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const firstMonthInterest = loanAmount * monthlyRate;
    const firstMonthPrincipal = monthlyPayment - firstMonthInterest;
    const monthlyTax = (price * (taxRate / 100)) / 12;
    const monthlyInsurance = (price * 0.003) / 12;

    return {
      monthlyPayment,
      principal: firstMonthPrincipal,
      interest: firstMonthInterest,
      tax: monthlyTax,
      insurance: monthlyInsurance,
      total: monthlyPayment + monthlyTax + monthlyInsurance,
      downPayment,
      loanAmount,
    };
  }, [price, downPercent, rate, term, taxRate]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="bg-warm-gray p-6 md:p-8">
      <h3 className="text-lg font-semibold text-navy mb-6">Mortgage Calculator</h3>

      <div className="space-y-5 mb-8">
        {/* Price */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">
              Home Price
            </label>
            <span className="text-sm font-semibold text-navy">{fmt(price)}</span>
          </div>
          <input
            type="range"
            min={100000}
            max={5000000}
            step={10000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-1.5 bg-navy/10 rounded-full appearance-none cursor-pointer accent-gold"
          />
        </div>

        {/* Down payment */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">
              Down Payment
            </label>
            <span className="text-sm font-semibold text-navy">
              {downPercent}% ({fmt(calc.downPayment)})
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={downPercent}
            onChange={(e) => setDownPercent(Number(e.target.value))}
            className="w-full h-1.5 bg-navy/10 rounded-full appearance-none cursor-pointer accent-gold"
          />
        </div>

        {/* Interest rate */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">
              Interest Rate
            </label>
            <span className="text-sm font-semibold text-navy">{rate}%</span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={0.125}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-1.5 bg-navy/10 rounded-full appearance-none cursor-pointer accent-gold"
          />
        </div>

        {/* Loan term */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">
              Loan Term
            </label>
          </div>
          <div className="flex gap-2">
            {[15, 20, 30].map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                  term === t
                    ? "bg-navy text-white"
                    : "bg-white text-navy hover:bg-navy/5"
                }`}
              >
                {t} yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="border-t border-navy/10 pt-6">
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-1">
            Est. Monthly Payment
          </p>
          <p className="text-3xl font-bold text-navy">{fmt(calc.total)}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Principal & Interest</span>
            <span className="text-navy font-medium">{fmt(calc.monthlyPayment)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-mid-gray flex items-center gap-1.5">
              Property Tax
              <input
                type="number"
                min={1.8}
                max={2.2}
                step={0.05}
                value={taxRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0 && v <= 5) setTaxRate(v);
                }}
                className="w-14 text-center text-[11px] font-semibold text-navy bg-white border border-navy/15 rounded px-1 py-0.5 focus:outline-none focus:border-gold"
              />
              <span className="text-[11px] text-mid-gray">%</span>
            </span>
            <span className="text-navy font-medium">{fmt(calc.tax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Insurance (est.)</span>
            <span className="text-navy font-medium">{fmt(calc.insurance)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-navy/10">
            <span className="text-mid-gray">Loan Amount</span>
            <span className="text-navy font-medium">{fmt(calc.loanAmount)}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <p className="text-[11px] text-mid-gray mb-2">
          Estimates based on {rate}% rate. Actual payments may vary.
        </p>
      </div>
    </div>
  );
}
