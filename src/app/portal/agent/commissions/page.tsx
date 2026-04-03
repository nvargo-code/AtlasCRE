"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommissionDeal {
  id: string;
  propertyAddress: string;
  propertyCity: string;
  type: string;
  status: string;
  contractPrice: number | null;
  commissionPct: number | null;
  commissionFlat: number | null;
  referralPct: number | null;
  closeDate: string | null;
  contractDate: string | null;
  client: { name: string | null; email: string } | null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function calcCommission(deal: CommissionDeal): {
  grossCommission: number;
  referralFee: number;
  netCommission: number;
} {
  const price = deal.contractPrice || 0;
  const pct = deal.commissionPct || 3;
  const gross = deal.commissionFlat || (price * pct / 100);
  const referral = deal.referralPct ? gross * (deal.referralPct / 100) : 0;
  return {
    grossCommission: Math.round(gross),
    referralFee: Math.round(referral),
    netCommission: Math.round(gross - referral),
  };
}

export default function CommissionsPage() {
  const [deals, setDeals] = useState<CommissionDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/portal/transactions");
      if (res.ok) {
        const data = await res.json();
        setDeals(
          (data.transactions || []).map((t: CommissionDeal & { contractPrice: number }) => ({
            ...t,
            contractPrice: t.contractPrice ? Number(t.contractPrice) : null,
            commissionPct: t.commissionPct ? Number(t.commissionPct) : null,
            commissionFlat: t.commissionFlat ? Number(t.commissionFlat) : null,
            referralPct: t.referralPct ? Number(t.referralPct) : null,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const closedDeals = deals.filter((d) => d.status === "closed");
  const pendingDeals = deals.filter((d) => d.status === "under_contract" || d.status === "pending");

  const closedTotals = closedDeals.reduce(
    (acc, d) => {
      const c = calcCommission(d);
      return {
        volume: acc.volume + (d.contractPrice || 0),
        grossGCI: acc.grossGCI + c.grossCommission,
        referrals: acc.referrals + c.referralFee,
        netGCI: acc.netGCI + c.netCommission,
      };
    },
    { volume: 0, grossGCI: 0, referrals: 0, netGCI: 0 }
  );

  const pendingTotals = pendingDeals.reduce(
    (acc, d) => {
      const c = calcCommission(d);
      return {
        volume: acc.volume + (d.contractPrice || 0),
        projectedGCI: acc.projectedGCI + c.netCommission,
      };
    },
    { volume: 0, projectedGCI: 0 }
  );

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Commission <span className="font-semibold">Tracker</span>
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-navy text-white p-5 text-center">
          <p className="text-2xl font-bold">{closedDeals.length}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Closed Deals</p>
        </div>
        <div className="bg-navy text-white p-5 text-center">
          <p className="text-2xl font-bold">{closedTotals.volume > 0 ? fmt(closedTotals.volume) : "—"}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Total Volume</p>
        </div>
        <div className="bg-navy text-white p-5 text-center">
          <p className="text-2xl font-bold text-gold">{closedTotals.netGCI > 0 ? fmt(closedTotals.netGCI) : "—"}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Net GCI (YTD)</p>
        </div>
        <div className="bg-white border border-navy/10 p-5 text-center">
          <p className="text-2xl font-bold text-navy">{pendingDeals.length}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Pending</p>
        </div>
        <div className="bg-white border border-navy/10 p-5 text-center">
          <p className="text-2xl font-bold text-gold">{pendingTotals.projectedGCI > 0 ? fmt(pendingTotals.projectedGCI) : "—"}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Projected GCI</p>
        </div>
      </div>

      {/* Closed Deals Table */}
      {closedDeals.length > 0 && (
        <div className="bg-white border border-navy/10 mb-6">
          <div className="p-4 border-b border-navy/10">
            <h2 className="text-sm font-semibold text-navy tracking-wide uppercase">Closed Deals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-[10px] font-semibold tracking-wider uppercase text-mid-gray">
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Rate</th>
                  <th className="text-right p-3">Gross</th>
                  <th className="text-right p-3">Referral</th>
                  <th className="text-right p-3">Net</th>
                  <th className="text-right p-3">Closed</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.map((deal) => {
                  const c = calcCommission(deal);
                  return (
                    <tr key={deal.id} className="border-b border-navy/5">
                      <td className="p-3">
                        <Link href="/portal/transactions" className="font-medium text-navy hover:text-gold">{deal.propertyAddress}</Link>
                        <p className="text-[11px] text-mid-gray">{deal.propertyCity}</p>
                      </td>
                      <td className="p-3 text-mid-gray">{deal.client?.name || "—"}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${
                          deal.type === "buy" ? "bg-blue-50 text-blue-700" : deal.type === "sell" ? "bg-green-50 text-green-700" : "bg-purple-50 text-purple-700"
                        }`}>{deal.type}</span>
                      </td>
                      <td className="p-3 text-right font-medium text-navy">{deal.contractPrice ? fmt(deal.contractPrice) : "—"}</td>
                      <td className="p-3 text-right text-mid-gray">{deal.commissionPct || 3}%</td>
                      <td className="p-3 text-right text-navy">{fmt(c.grossCommission)}</td>
                      <td className="p-3 text-right text-red-500">{c.referralFee > 0 ? `-${fmt(c.referralFee)}` : "—"}</td>
                      <td className="p-3 text-right font-semibold text-gold">{fmt(c.netCommission)}</td>
                      <td className="p-3 text-right text-mid-gray text-[11px]">{deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy font-semibold">
                  <td colSpan={3} className="p-3 text-navy">Total</td>
                  <td className="p-3 text-right text-navy">{fmt(closedTotals.volume)}</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right text-navy">{fmt(closedTotals.grossGCI)}</td>
                  <td className="p-3 text-right text-red-500">{closedTotals.referrals > 0 ? `-${fmt(closedTotals.referrals)}` : "—"}</td>
                  <td className="p-3 text-right text-gold text-lg">{fmt(closedTotals.netGCI)}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Pending Pipeline */}
      {pendingDeals.length > 0 && (
        <div className="bg-white border border-navy/10">
          <div className="p-4 border-b border-navy/10">
            <h2 className="text-sm font-semibold text-navy tracking-wide uppercase">Pending Pipeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-[10px] font-semibold tracking-wider uppercase text-mid-gray">
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Projected Net</th>
                  <th className="text-right p-3">Close Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeals.map((deal) => {
                  const c = calcCommission(deal);
                  return (
                    <tr key={deal.id} className="border-b border-navy/5">
                      <td className="p-3 font-medium text-navy">{deal.propertyAddress}</td>
                      <td className="p-3">
                        <span className="text-[9px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 px-2 py-0.5">
                          {deal.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-right text-navy">{deal.contractPrice ? fmt(deal.contractPrice) : "—"}</td>
                      <td className="p-3 text-right font-semibold text-gold">{fmt(c.netCommission)}</td>
                      <td className="p-3 text-right text-mid-gray text-[11px]">{deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : "TBD"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deals.length === 0 && (
        <div className="bg-white border border-navy/10 p-16 text-center">
          <h3 className="text-lg font-semibold text-navy mb-2">No Transactions Yet</h3>
          <p className="text-mid-gray text-sm">
            <Link href="/portal/transactions" className="text-gold hover:text-gold-dark">Create a transaction</Link> to start tracking commissions.
          </p>
        </div>
      )}
    </div>
  );
}
