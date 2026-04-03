"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function PortalSettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    alertFrequency: "daily" as "instant" | "daily" | "weekly",
    newListings: true,
    priceDrops: true,
    statusChanges: true,
    openHouses: false,
    marketUpdates: true,
  });

  function updatePref(key: string, value: unknown) {
    setPrefs({ ...prefs, [key]: value });
    setSaved(false);
  }

  async function savePrefs() {
    try {
      const res = await fetch("/api/portal/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAlerts: prefs.emailAlerts,
          alertFrequency: prefs.alertFrequency,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-navy">
          <span className="font-semibold">Settings</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">
          Manage your account and notification preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Profile */}
        <ProfileSection />

        {/* Notification preferences */}
        <div className="bg-white border border-navy/10 p-6">
          <h2 className="font-semibold text-navy mb-4">Notification Preferences</h2>

          <div className="space-y-5">
            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Email Alerts</p>
                <p className="text-[12px] text-mid-gray">Receive email notifications about your saved searches and homes.</p>
              </div>
              <button
                onClick={() => updatePref("emailAlerts", !prefs.emailAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative ${prefs.emailAlerts ? "bg-gold" : "bg-navy/20"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${prefs.emailAlerts ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {prefs.emailAlerts && (
              <>
                {/* Frequency */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                    Alert Frequency
                  </p>
                  <div className="flex gap-2">
                    {(["instant", "daily", "weekly"] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => updatePref("alertFrequency", freq)}
                        className={`px-4 py-2 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                          prefs.alertFrequency === freq
                            ? "bg-navy text-white"
                            : "bg-warm-gray text-navy hover:bg-navy/10"
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert types */}
                <div className="space-y-3 pt-2">
                  {[
                    { key: "newListings", label: "New Listings", desc: "Homes matching your saved searches" },
                    { key: "priceDrops", label: "Price Drops", desc: "When saved homes reduce their price" },
                    { key: "statusChanges", label: "Status Changes", desc: "When homes go pending, sold, or back on market" },
                    { key: "openHouses", label: "Open Houses", desc: "Upcoming open houses for saved homes" },
                    { key: "marketUpdates", label: "Market Updates", desc: "Monthly neighborhood market reports" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-navy/5 last:border-0">
                      <div>
                        <p className="text-sm text-navy">{item.label}</p>
                        <p className="text-[11px] text-mid-gray">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => updatePref(item.key, !(prefs as Record<string, unknown>)[item.key])}
                        className={`w-9 h-5 rounded-full transition-colors relative ${(prefs as Record<string, unknown>)[item.key] ? "bg-gold" : "bg-navy/20"}`}
                      >
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${(prefs as Record<string, unknown>)[item.key] ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={savePrefs}
              className={`px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                saved ? "bg-green-600 text-white" : "bg-gold text-white hover:bg-gold-dark"
              }`}
            >
              {saved ? "Saved" : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Sign out */}
        <div className="bg-white border border-navy/10 p-6">
          <h2 className="font-semibold text-navy mb-4">Account</h2>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-500 text-sm font-medium hover:text-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/portal/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      })
      .catch(() => {});
  }, []);

  async function saveProfile() {
    setStatus("saving");
    const res = await fetch("/api/portal/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("idle");
    }
  }

  return (
    <div className="bg-white border border-navy/10 p-6">
      <h2 className="font-semibold text-navy mb-4">Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Email</label>
          <p className="text-navy text-sm px-4 py-2.5 bg-warm-gray">{session?.user?.email || "—"}</p>
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="512-555-0123" className="w-full border border-navy/15 px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <button
          onClick={saveProfile}
          disabled={status === "saving"}
          className={`px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
            status === "saved" ? "bg-green-600 text-white" : "bg-gold text-white hover:bg-gold-dark"
          } disabled:opacity-50`}
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleChange() {
    if (newPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match"); return; }
    setStatus("saving");
    setError("");

    const res = await fetch("/api/portal/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw || null, newPassword: newPw }),
    });

    if (res.ok) {
      setStatus("success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to change password");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white border border-navy/10 p-6">
      <h2 className="font-semibold text-navy mb-4">Change Password</h2>
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 mb-4 border border-red-200">{error}</div>}
      {status === "success" && <div className="bg-green-50 text-green-700 text-sm p-3 mb-4 border border-green-200">Password updated successfully.</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-1">Current Password <span className="text-navy/30">(optional if first time)</span></label>
          <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-1">New Password</label>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-1">Confirm Password</label>
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
        </div>
        <button onClick={handleChange} disabled={status === "saving" || !newPw} className="bg-navy text-white px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 disabled:opacity-50">
          {status === "saving" ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
