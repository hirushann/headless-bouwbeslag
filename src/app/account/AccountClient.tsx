"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useUserContext } from "@/context/UserContext";

function AccountContent() {
  const {
    user,
    token,
    isLoading: contextLoading,
    error: accountError,
    refreshUser,
    updateUser,
    signOut,
    isB2B,
  } = useUserContext();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState<any>(null);
  const [shippingForm, setShippingForm] = useState<any>(null);
  const [billingSaving, setBillingSaving] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);
  const [shippingSuccess, setShippingSuccess] = useState<string | null>(null);
  const [detailsForm, setDetailsForm] = useState<any>(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  // Password reset state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);
  const [oldPasswordError, setOldPasswordError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const EMPIRE_API_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test").replace(/\/$/, "");
  
  const getOrderTotal = (order: any) => {
    const total = parseFloat(order.totals?.net_total_with_tax || order.total || 0);
    if (isB2B) {
      const tax = parseFloat(order.totals?.total_tax || order.total_tax || 0);
      return Math.max(0, total - tax);
    }
    return total;
  };
  
  // Forms are editable projections of the provider-owned customer record.
  useEffect(() => {
    if (user) {
        setBillingForm({
            ...user.billing,
            first_name: user.billing?.first_name || user.first_name || "",
            last_name: user.billing?.last_name || user.last_name || "",
            company: user.billing?.company || user.company_name || "",
            email: user.billing?.email || user.email || "",
        });
        setShippingForm({
            ...user.shipping,
            first_name: user.shipping?.first_name || user.first_name || "",
            last_name: user.shipping?.last_name || user.last_name || "",
            company: user.shipping?.company || user.company_name || "",
        });
        setDetailsForm({
            first_name: user.first_name || user.billing?.first_name || "",
            last_name: user.last_name || user.billing?.last_name || "",
            company_name: user.company_name || user.billing?.company || "",
            vat_number: user.vat_number || user.billing?.vat_number || "",
        });
    }
  }, [user]);

  useEffect(() => {
    if (!token && !contextLoading && !user) {
      router.push("/account/login");
      return;
    }

    if (user?.id && token) {
        fetchOrders(token);
    }
  }, [user?.id, token, contextLoading, router]);

  const fetchOrders = (authToken: string) => {
      setLoadingOrders(true);
      setOrdersError(null);

      axios
        .get(`/api/user/orders`, {
            headers: { Authorization: `Bearer ${authToken}` },
        })
        .then((ordersRes) => {
            setOrders(ordersRes.data || []);
        })
        .catch(() => {
            setOrders([]);
            setOrdersError("Bestellingen konden niet worden geladen. Probeer het opnieuw.");
        })
        .finally(() => setLoadingOrders(false));
  };

  // Sync tab state with URL ?tab=... param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

    // Handlers for details forms
  const handleDetailsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetailsForm({ ...detailsForm, [e.target.name]: e.target.value });
  };

  const saveDetails = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      
      setDetailsSaving(true);
      setDetailsError(null);
      setDetailsSuccess(null);

      try {
          // We can use the NextJS API route if it exists, or call EMPIRE_API_URL directly like password reset does
          const response = await axios.put(`${EMPIRE_API_URL}/api/profile`, detailsForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          const updatedUser = response.data?.data;
          updateUser(updatedUser || detailsForm);
          await refreshUser();
          setDetailsSuccess("Accountgegevens succesvol bijgewerkt.");
      } catch (err: any) {
          setDetailsError(err?.response?.data?.message || "Het bijwerken van accountgegevens is mislukt.");
      } finally {
          setDetailsSaving(false);
      }
  };

    // Handlers for address forms
  const handleBillingInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };
  const handleShippingInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingForm({ ...shippingForm, [e.target.name]: e.target.value });
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSaving(true);
    setBillingError(null);
    setBillingSuccess(null);
    try {
      if (!token) throw new Error("No auth token");
      const response = await axios.put(
        `${EMPIRE_API_URL}/api/customer/address`,
        { billing: billingForm, shipping: shippingForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const address = response.data?.data;
      const savedBilling = address?.billing || billingForm;
      const savedShipping = address?.shipping || shippingForm;
      setBillingForm(savedBilling);
      setShippingForm(savedShipping);
      setBillingSuccess("Factuuradres bijgewerkt!");
      updateUser({ billing: savedBilling, shipping: savedShipping });
      await refreshUser();
    } catch (err: any) {
      setBillingError(err.response?.data?.message || err.message || "Fout bij het bijwerken van factuuradres.");
    } finally {
      setBillingSaving(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingSaving(true);
    setShippingError(null);
    setShippingSuccess(null);
    try {
      if (!token) throw new Error("No auth token");
      const response = await axios.put(
        `${EMPIRE_API_URL}/api/customer/address`,
        { billing: billingForm, shipping: shippingForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const address = response.data?.data;
      const savedBilling = address?.billing || billingForm;
      const savedShipping = address?.shipping || shippingForm;
      setBillingForm(savedBilling);
      setShippingForm(savedShipping);
      setShippingSuccess("Afleveradres bijgewerkt!");
      updateUser({ billing: savedBilling, shipping: savedShipping });
      await refreshUser();
    } catch (err: any) {
      setShippingError(err.response?.data?.message || err.message || "Fout bij het bijwerken van afleveradres.");
    } finally {
      setShippingSaving(false);
    }
  };

  // Validate old password on blur (immediate check)
  const handleOldPasswordBlur = async () => {
    // We will validate password by attempting a login
    setOldPasswordError(null);
    if (!oldPassword) {
      setOldPasswordError("Huidig wachtwoord is vereist.");
      return;
    }
    let loginIdentifier = user?.email || user?.billing?.email;
    if (!loginIdentifier) {
      setOldPasswordError("Kan uw login e-mailadres niet bepalen.");
      return;
    }
    try {
      await axios.post(`${EMPIRE_API_URL}/api/login`, {
        email: loginIdentifier,
        password: oldPassword,
        device_name: "nextjs-storefront"
      });
      setOldPasswordError(null);
    } catch (loginErr: any) {
      setOldPasswordError("Huidig wachtwoord is onjuist.");
    }
  };

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError(null);
    setPasswordResetSuccess(null);
    setOldPasswordError(null);
    setPasswordResetLoading(true);
    try {
      if (!token) throw new Error("No auth token");

      // 1. Validate old password
      let loginIdentifier = user?.email || user?.billing?.email;
      if (!loginIdentifier) throw new Error("Kan uw login e-mailadres niet bepalen.");
      try {
        await axios.post(`${EMPIRE_API_URL}/api/login`, {
          email: loginIdentifier,
          password: oldPassword,
          device_name: "nextjs-storefront"
        });
        setOldPasswordError(null);
      } catch (loginErr: any) {
        setOldPasswordError("Huidig wachtwoord is onjuist.");
        setPasswordResetError("Huidig wachtwoord is onjuist.");
        setPasswordResetLoading(false);
        return;
      }

      // 2. Check new password and confirm
      if (!newPassword || !confirmPassword) {
        setPasswordResetError("Voer het nieuwe wachtwoord en de bevestiging in.");
        setPasswordResetLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordResetError("Nieuw wachtwoord en bevestiging komen niet overeen.");
        setPasswordResetLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setPasswordResetError("Nieuw wachtwoord moet minimaal 6 tekens lang zijn.");
        setPasswordResetLoading(false);
        return;
      }

      // 3. Update password via API
      await axios.put(
        `${EMPIRE_API_URL}/api/profile/password`,
        { 
            current_password: oldPassword,
            password: newPassword,
            password_confirmation: confirmPassword 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordResetSuccess("Wachtwoord is succesvol bijgewerkt!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordResetError(null);
      setOldPasswordError(null);
    } catch (err: any) {
      setPasswordResetError(
        err?.response?.data?.message ||
        err?.message ||
        "Het opnieuw instellen van het wachtwoord is mislukt. Probeer het opnieuw."
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };


  if (!contextLoading && !user) {
    return (
      <main className="min-h-[60vh] bg-[#F5F5F5] flex items-center justify-center px-6">
        <div className="max-w-lg rounded-lg border border-[#DBE3EA] bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1C2530] mb-2">Sessie niet beschikbaar</h1>
          <p className="text-gray-600 mb-5">
            {accountError || "Je wordt doorgestuurd naar de inlogpagina."}
          </p>
          <Link href="/account/login" className="text-[#0050D1] font-semibold hover:underline">
            Ga naar inloggen
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-[#F5F5F5] min-h-screen">
        <div className="max-w-[1440px] mx-auto py-12 px-6 lg:px-12 font-sans">
          
          {/* Breadcrumb Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-64 h-10 bg-gray-300 rounded"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar Navigation Skeleton */}
            <nav className="flex flex-col w-full lg:w-[280px] shrink-0 gap-2 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-md w-full"></div>
              ))}
            </nav>

            {/* Main Content Area Skeleton */}
            <section className="flex-1 w-full min-w-0 space-y-8 animate-pulse">
              {/* Profile Intro Skeleton */}
              <div>
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>

              {/* Stats / Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col p-6 gap-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>

              {/* List / Details Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6 mt-8">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="h-12 w-12 bg-gray-200 rounded-full shrink-0"></div>
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const NavItem = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors duration-200 border-l-4 ${
        activeTab === id
          ? "border-[#0066FF] bg-white text-[#0050D1] font-semibold shadow-sm"
          : "border-transparent text-gray-600 hover:bg-white hover:text-gray-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ title, value, desc }: { title: string; value: string; desc: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DBE3EA] flex flex-col gap-2 flex-1">
      <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-bold text-[#0050D1]">{value}</p>
      <p className="text-gray-400 text-xs">{desc}</p>
    </div>
  );

  return (
    <main className="bg-[#F5F5F5] min-h-screen">
      <div className="max-w-[1440px] mx-auto py-12 px-6 lg:px-12 font-sans">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-[#0050D1] flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span>Mijn Account</span>
          </div>
          <h1 className="font-bold text-4xl text-[#1C2530]">Mijn Account</h1>
          {accountError && (
            <p role="alert" className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              {accountError}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <nav className="flex flex-col w-full lg:w-[280px] shrink-0 gap-1">
            <NavItem 
              id="dashboard" 
              label="Dashboard" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>}
            />
            <NavItem 
              id="orders" 
              label="Mijn Bestellingen" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>}
            />
            <NavItem 
              id="details" 
              label="Accountgegevens" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
            />
            <NavItem 
              id="addresses" 
              label="Adressen" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>}
            />
            
            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="mt-6 text-red-600 text-left px-6 py-4 flex items-center gap-3 rounded hover:bg-red-50 transition-colors border-l-4 border-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>
              Logout
            </button>
          </nav>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0">
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welkom terug, {user.first_name || user.user_display_name} 👋</h2>
                  <p className="text-gray-500">Here is what's happening with your account today.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full">
                  <StatCard 
                    title="Totaal Bestellingen" 
                    value={orders.length.toString()} 
                    desc="Totaal aantal bestellingen" 
                  />
                  <StatCard 
                    title="Totaal Uitgegeven" 
                    value={`€${orders.reduce((sum, o) => sum + getOrderTotal(o), 0).toFixed(2)}`} 
                    desc="Totale uitgaven" 
                  />
                  <StatCard 
                    title="Gem. Bestelling" 
                    value={`€${orders.length > 0 ? (orders.reduce((sum, o) => sum + getOrderTotal(o), 0) / orders.length).toFixed(2) : "0.00"}`} 
                    desc="Gemiddelde per bestelling" 
                  />
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#1C2530]">Recente Bestellingen</h3>
                    {orders.length > 3 && (
                      <button className="text-[#0050D1] hover:underline text-sm font-medium" onClick={() => setActiveTab("orders")}>
                        View all
                      </button>
                    )}
                  </div>

                  {loadingOrders ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-white rounded-lg border border-[#DBE3EA] animate-pulse" />
                      ))}
                    </div>
                  ) : ordersError ? (
                    <div role="alert" className="bg-white p-8 rounded-lg border border-red-200 text-center text-red-700">
                      {ordersError}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] text-center text-gray-500">
                          No orders placed yet.
                        </div>
                      ) : (
                        orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="bg-white border border-[#DBE3EA] p-5 rounded-lg flex flex-wrap justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                            <div>
                              <p className="font-bold text-[#1C2530]">Bestelling #{order.order_reference || order.id}</p>
                              <p className="text-sm text-gray-500">{new Date(order.created_at || order.date_created).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#1C2530]">€{getOrderTotal(order).toFixed(2)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                order.status === "completed" ? "bg-green-100 text-green-700" :
                                order.status === "processing" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              } capitalize`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Mijn Bestellingen</h2>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-white rounded-lg border border-[#DBE3EA] animate-pulse" />
                    ))}
                  </div>
                ) : ordersError ? (
                  <div role="alert" className="bg-white p-8 rounded-lg border border-red-200 text-center text-red-700">
                    {ordersError}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-gray-500 bg-white p-8 rounded-lg border border-[#DBE3EA] text-center">Geen bestellingen gevonden.</p>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="bg-white border border-[#DBE3EA] p-6 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-lg text-[#1C2530]">Bestelling #{order.order_reference || order.id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                order.status === "completed" ? "bg-green-100 text-green-700" :
                                order.status === "processing" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              } capitalize`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm">Geplaatst op {new Date(order.created_at || order.date_created).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#1C2530] mb-1">€{getOrderTotal(order).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{(order.items || order.line_items || []).length} artikelen</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Accountgegevens</h2>
                <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm">
                  <form className="space-y-6" onSubmit={saveDetails}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Voornaam</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]" type="text" name="first_name" value={detailsForm?.first_name || ""} onChange={handleDetailsInput} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Achternaam</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]" type="text" name="last_name" value={detailsForm?.last_name || ""} onChange={handleDetailsInput} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1C2530]">Bedrijfsnaam</label>
                      <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]" type="text" name="company_name" value={detailsForm?.company_name || ""} onChange={handleDetailsInput} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="account-vat-number" className="text-sm font-medium text-[#1C2530]">BTW-nummer</label>
                      <input
                        id="account-vat-number"
                        className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]"
                        type="text"
                        name="vat_number"
                        value={detailsForm?.vat_number || ""}
                        onChange={handleDetailsInput}
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Gebruikersnaam</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50 text-gray-500 cursor-not-allowed" type="text" defaultValue={user?.username || user?.name || ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">E-mailadres</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50 text-gray-500 cursor-not-allowed" type="text" defaultValue={user?.email || user?.billing?.email || ""} readOnly />
                      </div>
                    </div>

                    {detailsError && <p className="text-red-600 text-sm mt-2">{detailsError}</p>}
                    {detailsSuccess && <p className="text-green-600 text-sm mt-2">{detailsSuccess}</p>}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={detailsSaving}
                        className="bg-[#0066FF] text-white font-bold py-3 px-6 rounded-sm hover:bg-[#0052CC] transition-colors disabled:opacity-50"
                      >
                        {detailsSaving ? "Bezig met opslaan..." : "Wijzigingen opslaan"}
                      </button>
                    </div>
                  </form>

                  <div className="mt-10 pt-10 border-t border-[#DBE3EA]">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6">Wachtwoord wijzigen</h3>
                    <form className="max-w-md space-y-4" onSubmit={handlePasswordReset}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Huidig wachtwoord</label>
                        <input
                          className={`w-full border rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] ${oldPasswordError ? "border-red-500" : "border-[#DBE3EA]"}`}
                          type="password"
                          placeholder="••••••••"
                          value={oldPassword}
                          onChange={e => {
                            setOldPassword(e.target.value);
                            if (oldPasswordError) setOldPasswordError(null);
                          }}
                          onBlur={handleOldPasswordBlur}
                          required
                        />
                        {oldPasswordError && <p className="text-red-600 text-xs">{oldPasswordError}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Nieuw wachtwoord</label>
                        <input
                          className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]"
                          type="password"
                          placeholder="••••••••"
                          minLength={6}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Bevestig nieuw wachtwoord</label>
                        <input
                          className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF]"
                          type="password"
                          placeholder="••••••••"
                          minLength={6}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                        />
                        {passwordResetError && <p className="text-red-600 text-xs">{passwordResetError}</p>}
                        {passwordResetSuccess && <p className="text-green-600 text-xs">{passwordResetSuccess}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={passwordResetLoading}
                        className="bg-[#0066FF] text-white font-bold py-3 px-6 rounded-sm hover:bg-[#0052CC] transition-colors disabled:opacity-50 mt-2"
                      >
                        {passwordResetLoading ? "Bezig met bijwerken..." : "Wachtwoord bijwerken"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Adressen</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Billing Address Card */}
                  <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6 border-b border-[#DBE3EA] pb-4">Factuuradres</h3>
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Voornaam</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="first_name" value={billingForm?.first_name || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Achternaam</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="last_name" value={billingForm?.last_name || ""} onChange={handleBillingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Bedrijfsnaam</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="company" value={billingForm?.company || ""} onChange={handleBillingInput} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Adresregel 1</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_1" value={billingForm?.address_1 || ""} onChange={handleBillingInput} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Adresregel 2 (Optioneel)</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_2" value={billingForm?.address_2 || ""} onChange={handleBillingInput} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Plaats</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="city" value={billingForm?.city || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Postcode</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="postcode" value={billingForm?.postcode || ""} onChange={handleBillingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Land</label>
                        <select className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF] bg-white" name="country" value={billingForm?.country || "NL"} onChange={handleBillingInput}>
                          <option value="NL">Nederland</option>
                          <option value="BE">België</option>
                          <option value="DE">Duitsland</option>
                          <option value="FR">Frankrijk</option>
                          <option value="LU">Luxemburg</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">E-mail</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="email" value={billingForm?.email || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Telefoonnummer</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="phone" value={billingForm?.phone || ""} onChange={handleBillingInput} />
                        </div>
                      </div>
                    </div>
                    
                    {billingSuccess && <p className="text-green-600 text-xs mt-3">{billingSuccess}</p>}
                    {billingError && <p className="text-red-600 text-xs mt-3">{billingError}</p>}
                    
                    <button 
                      onClick={handleSaveBilling} 
                      disabled={billingSaving} 
                      className="mt-6 w-full bg-[#1C2530] text-white font-bold py-3 rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {billingSaving ? "Bezig met opslaan..." : "Factuuradres opslaan"}
                    </button>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6 border-b border-[#DBE3EA] pb-4">Afleveradres</h3>
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Voornaam</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="first_name" value={shippingForm?.first_name || ""} onChange={handleShippingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Achternaam</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="last_name" value={shippingForm?.last_name || ""} onChange={handleShippingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Bedrijfsnaam</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="company" value={shippingForm?.company || ""} onChange={handleShippingInput} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Adresregel 1</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_1" value={shippingForm?.address_1 || ""} onChange={handleShippingInput} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Adresregel 2 (Optioneel)</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_2" value={shippingForm?.address_2 || ""} onChange={handleShippingInput} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Plaats</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="city" value={shippingForm?.city || ""} onChange={handleShippingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Postcode</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="postcode" value={shippingForm?.postcode || ""} onChange={handleShippingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Land</label>
                        <select className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF] bg-white" name="country" value={shippingForm?.country || "NL"} onChange={handleShippingInput}>
                          <option value="NL">Nederland</option>
                          <option value="BE">België</option>
                          <option value="DE">Duitsland</option>
                          <option value="FR">Frankrijk</option>
                          <option value="LU">Luxemburg</option>
                        </select>
                      </div>
                    </div>
                    
                    {shippingSuccess && <p className="text-green-600 text-xs mt-3">{shippingSuccess}</p>}
                    {shippingError && <p className="text-red-600 text-xs mt-3">{shippingError}</p>}

                    <button 
                      onClick={handleSaveShipping} 
                      disabled={shippingSaving} 
                      className="mt-6 w-full bg-[#1C2530] text-white font-bold py-3 rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {shippingSaving ? "Bezig met opslaan..." : "Afleveradres opslaan"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <main className="bg-[#F5F5F5] min-h-screen">
        <div className="max-w-[1440px] mx-auto py-12 px-6 lg:px-12 font-sans">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
              <span className="flex items-center gap-1">Home</span>
              <span className="text-gray-300">/</span>
              <span>Mijn Account</span>
            </div>
            <h1 className="font-bold text-4xl text-[#1C2530]">Mijn Account</h1>
          </div>
          <div className="p-10 text-gray-500 font-sans flex justify-center">Account laden...</div>
        </div>
      </main>
    }>
      <AccountContent />
    </Suspense>
  );
}
