"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useUserContext } from "@/context/UserContext";

function AccountContent() {
  const { user: contextUser, isLoading: contextLoading } = useUserContext();
  // const [user, setUser] = useState<any>(null); // Removed redundant local state. We use 'user' derived from context or just contextUser. 
  
  // Actually, we can just use contextUser directly, but the component uses 'user' state everywhere.
  // To minimize refactor risk, let's keep 'user' state synced with contextUser.
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [billingForm, setBillingForm] = useState<any>(null);
  const [shippingForm, setShippingForm] = useState<any>(null);
  const [billingSaving, setBillingSaving] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);
  const [shippingSuccess, setShippingSuccess] = useState<string | null>(null);
  // ... other states ...
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
  const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  
  // Sync local user state with Context User
  useEffect(() => {
    if (contextUser) {
        // console.log("👤 AccountClient: Context User Loaded:", contextUser);
        setUser(contextUser);
        setBillingForm((prev: any) => prev || contextUser.billing || {});
        setShippingForm((prev: any) => prev || contextUser.shipping || {});
    }
  }, [contextUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !contextLoading && !contextUser) {
      router.push("/account/login");
      return;
    }

    if (contextUser && contextUser.id) {
        // We have user! Just fetch orders.
        fetchOrders(contextUser.id, token);
    } else if (!contextLoading && !contextUser) {
        if (!token) router.push("/account/login");
    }
  }, [contextUser, contextLoading]);

  const fetchOrders = (userId: number, token: string | null) => {
      if (!token) {
          console.warn("⚠️ AccountClient: No token available to fetch orders.");
          return;
      }
      setLoadingOrders(true);
      
      console.log(`📦 AccountClient: Fetching orders for Customer ID ${userId}...`);

      axios
        .get(`/api/user/orders`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((ordersRes) => {
            console.log("✅ AccountClient: Orders fetched:", ordersRes.data);
            setOrders(ordersRes.data || []);
        })
        .catch(err => {
            console.error("❌ AccountClient: Error fetching orders:", err);
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

    // Handlers for address forms
  const handleBillingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };
  const handleShippingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingForm({ ...shippingForm, [e.target.name]: e.target.value });
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSaving(true);
    setBillingError(null);
    setBillingSuccess(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");
      await axios.put(
        `${WP_API_URL}/wp-json/wc/v3/customers/${user.id}`,
        { billing: billingForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBillingSuccess("Billing address updated!");
      setUser((prev: any) => ({ ...prev, billing: { ...billingForm } }));
    } catch (err: any) {
      setBillingError(err.response?.data?.message || err.message || "Error updating billing address.");
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");
      await axios.put(
        `${WP_API_URL}/wp-json/wc/v3/customers/${user.id}`,
        { shipping: shippingForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShippingSuccess("Shipping address updated!");
      setUser((prev: any) => ({ ...prev, shipping: { ...shippingForm } }));
    } catch (err: any) {
      setShippingError(err.response?.data?.message || err.message || "Error updating shipping address.");
    } finally {
      setShippingSaving(false);
    }
  };

  // Validate old password on blur (immediate check)
  const handleOldPasswordBlur = async () => {
    setOldPasswordError(null);
    if (!oldPassword) {
      setOldPasswordError("Old password is required.");
      return;
    }
    let loginIdentifier = user?.username || user?.email || user?.billing?.email;
    if (!loginIdentifier) {
      setOldPasswordError("Could not determine your login username or email.");
      return;
    }
    try {
      await axios.post(`${WP_API_URL}/wp-json/jwt-auth/v1/token`, {
        username: loginIdentifier,
        password: oldPassword,
      });
      setOldPasswordError(null);
    } catch (loginErr: any) {
      setOldPasswordError("Old password is incorrect.");
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      // 1. Validate old password by calling JWT validate endpoint
      let loginIdentifier = user?.username || user?.email || user?.billing?.email;
      if (!loginIdentifier) throw new Error("Could not determine your login username or email.");
      try {
        await axios.post(`${WP_API_URL}/wp-json/jwt-auth/v1/token`, {
          username: loginIdentifier,
          password: oldPassword,
        });
        setOldPasswordError(null);
      } catch (loginErr: any) {
        setOldPasswordError("Old password is incorrect.");
        setPasswordResetError("Old password is incorrect.");
        setPasswordResetLoading(false);
        return;
      }

      // 2. Check new password and confirm
      if (!newPassword || !confirmPassword) {
        setPasswordResetError("Please enter the new password and confirmation.");
        setPasswordResetLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordResetError("New password and confirmation do not match.");
        setPasswordResetLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setPasswordResetError("New password must be at least 6 characters.");
        setPasswordResetLoading(false);
        return;
      }

      // 3. Update password via WP REST API
      await axios.put(
        `${WP_API_URL}/wp-json/wp/v2/users/me`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordResetSuccess("Password has been updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordResetError(null);
      setOldPasswordError(null);
    } catch (err: any) {
      setPasswordResetError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reset password. Please try again."
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };


  if (!user) {
    return <div className="p-10 text-gray-500 flex justify-center mt-10">Loading your account...</div>;
  }

  const NavItem = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors duration-200 border-l-4 ${
        activeTab === id
          ? "border-[#0066FF] bg-white text-[#0066FF] font-semibold shadow-sm"
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
      <p className="text-3xl font-bold text-[#0066FF]">{value}</p>
      <p className="text-gray-400 text-xs">{desc}</p>
    </div>
  );

  return (
    <main className="bg-[#F5F5F5] min-h-screen">
      <div className="max-w-[1440px] mx-auto py-12 px-6 lg:px-12 font-sans">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-[#0066FF] flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span>My Account</span>
          </div>
          <h1 className="font-bold text-4xl text-[#1C2530]">My Account</h1>
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
              label="My Orders" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>}
            />
            <NavItem 
              id="details" 
              label="Account Details" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
            />
            <NavItem 
              id="addresses" 
              label="Addresses" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>}
            />
            
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
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
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {user.first_name || user.user_display_name} 👋</h2>
                  <p className="text-gray-500">Here is what's happening with your account today.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full">
                  <StatCard 
                    title="Total Orders" 
                    value={orders.length.toString()} 
                    desc="Lifetime orders" 
                  />
                  <StatCard 
                    title="Total Spent" 
                    value={`€${orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}`} 
                    desc="Lifetime spend" 
                  />
                  <StatCard 
                    title="Avg. Order" 
                    value={`€${orders.length > 0 ? (orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / orders.length).toFixed(2) : "0.00"}`} 
                    desc="Per order average" 
                  />
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#1C2530]">Recent Orders</h3>
                    {orders.length > 3 && (
                      <button className="text-[#0066FF] hover:underline text-sm font-medium" onClick={() => setActiveTab("orders")}>
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
                              <p className="font-bold text-[#1C2530]">Order #{order.id}</p>
                              <p className="text-sm text-gray-500">{new Date(order.date_created).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#1C2530]">€{order.total}</p>
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
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-white rounded-lg border border-[#DBE3EA] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-gray-500 bg-white p-8 rounded-lg border border-[#DBE3EA] text-center">No orders found.</p>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="bg-white border border-[#DBE3EA] p-6 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-lg text-[#1C2530]">Order #{order.id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                order.status === "completed" ? "bg-green-100 text-green-700" :
                                order.status === "processing" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              } capitalize`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm">Placed on {new Date(order.date_created).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#1C2530] mb-1">€{order.total}</p>
                            <p className="text-sm text-gray-500">{order.line_items?.length} items</p>
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
                <h2 className="text-2xl font-bold mb-6">Account Details</h2>
                <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">First Name</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50" type="text" defaultValue={user?.first_name || user?.billing?.first_name || ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Last Name</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50" type="text" defaultValue={user?.last_name || user?.billing?.last_name || ""} readOnly />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Username</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50" type="text" defaultValue={user?.username || user?.name || ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Email Address</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] bg-gray-50" type="text" defaultValue={user?.email || user?.billing?.email || ""} readOnly />
                      </div>
                    </div>
                  </form>

                  <div className="mt-10 pt-10 border-t border-[#DBE3EA]">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6">Change Password</h3>
                    <form className="max-w-md space-y-4" onSubmit={handlePasswordReset}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1C2530]">Current Password</label>
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
                        <label className="text-sm font-medium text-[#1C2530]">New Password</label>
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
                        <label className="text-sm font-medium text-[#1C2530]">Confirm New Password</label>
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
                        {passwordResetLoading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Addresses</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Billing Address Card */}
                  <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6 border-b border-[#DBE3EA] pb-4">Billing Address</h3>
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="first_name" value={billingForm?.first_name || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="last_name" value={billingForm?.last_name || ""} onChange={handleBillingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Address Line 1</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_1" value={billingForm?.address_1 || ""} onChange={handleBillingInput} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Address Line 2 (Optional)</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_2" value={billingForm?.address_2 || ""} onChange={handleBillingInput} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">City</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="city" value={billingForm?.city || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Postcode</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="postcode" value={billingForm?.postcode || ""} onChange={handleBillingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Country</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="country" value={billingForm?.country || ""} onChange={handleBillingInput} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="email" value={billingForm?.email || ""} onChange={handleBillingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
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
                      {billingSaving ? "Saving..." : "Save Billing Address"}
                    </button>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-white p-8 rounded-lg border border-[#DBE3EA] shadow-sm flex flex-col h-full">
                    <h3 className="text-lg font-bold text-[#1C2530] mb-6 border-b border-[#DBE3EA] pb-4">Shipping Address</h3>
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="first_name" value={shippingForm?.first_name || ""} onChange={handleShippingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="last_name" value={shippingForm?.last_name || ""} onChange={handleShippingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Address Line 1</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_1" value={shippingForm?.address_1 || ""} onChange={handleShippingInput} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Address Line 2 (Optional)</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="address_2" value={shippingForm?.address_2 || ""} onChange={handleShippingInput} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">City</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="city" value={shippingForm?.city || ""} onChange={handleShippingInput} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Postcode</label>
                          <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="postcode" value={shippingForm?.postcode || ""} onChange={handleShippingInput} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Country</label>
                        <input className="w-full border border-[#DBE3EA] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0066FF]" type="text" name="country" value={shippingForm?.country || ""} onChange={handleShippingInput} />
                      </div>
                    </div>
                    
                    {shippingSuccess && <p className="text-green-600 text-xs mt-3">{shippingSuccess}</p>}
                    {shippingError && <p className="text-red-600 text-xs mt-3">{shippingError}</p>}

                    <button 
                      onClick={handleSaveShipping} 
                      disabled={shippingSaving} 
                      className="mt-6 w-full bg-[#1C2530] text-white font-bold py-3 rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {shippingSaving ? "Saving..." : "Save Shipping Address"}
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
    <Suspense fallback={<div className="p-10 text-gray-500 font-sans flex justify-center">Loading account...</div>}>
      <AccountContent />
    </Suspense>
  );
}