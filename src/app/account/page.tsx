"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

function AccountContent() {
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
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/account/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // 1) Get the WP user via JWT to retrieve the numeric user ID
      console.log("Fetching WP current user via JWT /wp/v2/users/me ...");
      axios
        .get(`${WP_API_URL}/wp-json/wp/v2/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((meRes) => {
          const wpUserId = meRes.data?.id;
          if (!wpUserId) {
            return;
          }

          // 2) Fetch WooCommerce customer by the resolved WP user id
          return axios
            .get(`${WP_API_URL}/wp-json/wc/v3/customers/${wpUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((custRes) => {
              setUser(custRes.data);
              setBillingForm(custRes.data.billing || {});
              setShippingForm(custRes.data.shipping || {});
              // 3) Fetch orders for this customer id (filter by customer)
              return axios
                .get(`${WP_API_URL}/wp-json/wc/v3/orders`, {
                  headers: { Authorization: `Bearer ${token}` },
                  params: { customer: wpUserId },
                })
                .then((ordersRes) => {
                  setOrders(ordersRes.data || []);
                })
                .finally(() => setLoadingOrders(false));
            })
            .catch((custErr) => {
              return axios
                .get(`${WP_API_URL}/wp-json/wc/v3/orders`, {
                  headers: { Authorization: `Bearer ${token}` },
                  params: { customer: wpUserId },
                })
                .then((ordersRes) => {
                  setOrders(ordersRes.data || []);
                })
                .finally(() => setLoadingOrders(false));
            });
        });
    }
    
  }, []);

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
    return <div className="p-10">Loading your account...</div>;
  }

  <main className="bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto py-8 font-sans">
        <div>
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
              <Link href="/" className="hover:underline flex items-center gap-1 text-black">
                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
                <span>Home</span>
              </Link>{" "}
              / My Account
          </div>

          <h1 className="font-bold text-4xl mb-8 text-[#1C2530]">My Account</h1>
        </div>

        <div className="flex gap-6">
          <nav className="flex flex-col border-r border-[#DBE3EA] pr-6 min-w-[280px]">
            <button className={`mb-2 text-left px-6 py-3 rounded flex items-center gap-2 text-base font-normal cursor-pointer ${activeTab === "dashboard" ? "bg-[#0066FF] text-white font-semibold" : "hover:bg-gray-100 hover:cursor-pointer"}`} onClick={() => setActiveTab("dashboard")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
              Dashboard
            </button>
            <button className={`mb-2 text-left px-6 py-3 rounded flex items-center gap-2 text-base font-normal cursor-pointer ${activeTab === "orders" ? "bg-[#0066FF] text-white font-semibold" : "hover:bg-gray-100 hover:cursor-pointer"}`} onClick={() => setActiveTab("orders")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
              My Orders
            </button>
            <button className={`mb-2 text-left px-6 py-3 rounded flex items-center gap-2 text-base font-normal cursor-pointer ${activeTab === "details" ? "bg-[#0066FF] text-white font-semibold" : "hover:bg-gray-100 hover:cursor-pointer"}`} onClick={() => setActiveTab("details")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
              Account Details
            </button>
            <button className={`mb-2 text-left px-6 py-3 rounded flex items-center gap-2 text-base font-normal cursor-pointer ${activeTab === "addresses" ? "bg-[#0066FF] text-white font-semibold" : "hover:bg-gray-100 hover:cursor-pointer"}`} onClick={() => setActiveTab("addresses")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
              Addresses
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/");
              }}
              className="mt-auto text-red-600 text-left px-6 py-3 rounded hover:bg-red-100 cursor-pointer border border-red-400">
              Logout
            </button>
          </nav>

          <section className="flex-1">
            {activeTab === "dashboard" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Welcome back, {user.user_display_name} 👋</h2>
                <div className="flex w-full gap-8">
                  <div className="stats stats-vertical shadow w-1/3 bg-white">
                    <div className="stat">
                      <div className="stat-title">Total Orders</div>
                      <div className="stat-value">{orders.length}</div>
                      <div className="stat-desc">All orders linked to your account</div>
                    </div>

                    <div className="stat">
                      <div className="stat-title">Total Spent</div>
                      <div className="stat-value">€{orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}</div>
                      <div className="stat-desc">Across all completed orders</div>
                    </div>

                    <div className="stat">
                      <div className="stat-title">Avg. Order Value</div>
                      <div className="stat-value">
                        €{orders.length > 0 ? (
                          (orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / orders.length).toFixed(2)
                        ) : (
                          "0.00"
                        )}
                      </div>
                      <div className="stat-desc">Per order average</div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="w-full flex flex-col">
                    <h3 className="text-xl font-semibold mb-3">Recent Orders</h3>
                    {loadingOrders ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="border border-[#DBE3EA] p-4 rounded-sm flex justify-between items-center shadow animate-pulse bg-white h-[72px]"
                          >
                            <div className="flex flex-col gap-2 w-1/2">
                              <div className="h-4 w-24 bg-gray-300 rounded" />
                              <div className="h-3 w-16 bg-gray-300 rounded" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/4 items-end">
                              <div className="h-4 w-16 bg-gray-300 rounded" />
                              <div className="h-3 w-14 bg-gray-300 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {orders.length === 0 ? (
                          <p className="text-gray-500">No recent orders.</p>
                        ) : (
                          <ul className="space-y-3">
                            {orders.slice(0, 3).map((order) => (
                              <li key={order.id} className="border border-[#DBE3EA] p-4 rounded-sm flex justify-between items-center shadow bg-white">
                                <div>
                                  <p className="font-medium">Order #{order.id}</p>
                                  <p className="text-sm text-gray-500">{new Date(order.date_created).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{order.total} {order.currency}</p>
                                  <p className="text-sm capitalize">{order.status}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                    {orders.length > 3 && (
                      <button className="mt-3 text-blue-600 ml-auto hover:text-blue-800 cursor-pointer" onClick={() => setActiveTab("orders")} >
                        View all orders →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Orders</h2>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((skeleton) => (
                      <div key={skeleton} className="border border-[#DBE3EA] p-4 rounded-sm flex justify-between items-center shadow h-18">
                        <div className="flex flex-col gap-2 w-1/2">
                          <div className="h-4 w-24 bg-gray-300 rounded" />
                          <div className="h-3 w-16 bg-gray-300 rounded" />
                        </div>
                        <div className="flex flex-col gap-2 w-1/4 items-end">
                          <div className="h-4 w-16 bg-gray-300 rounded" />
                          <div className="h-3 w-14 bg-gray-300 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {orders.length === 0 ? (
                      <p>No orders found.</p>
                    ) : (
                      <ul className="space-y-4">
                        {orders.map((order) => (
                          <li key={order.id} className="border border-[#DBE3EA] p-4 rounded-sm flex justify-between items-center shadow bg-white">
                            <div>
                              <p><strong>Order #{order.id}</strong></p>
                              <p>Status: {order.status}</p>
                            </div>
                            <div>
                              <p>Total: {order.total} {order.currency}</p>
                              <p>Date: {new Date(order.date_created).toLocaleDateString()}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="w-full">
                <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                <form className="max-w-4xl w-full space-y-4 flex flex-col">
                  <div className="w-full flex gap-5">
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">First Name</legend>
                      <label className="input validator w-full">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                        <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" defaultValue={user?.first_name || user?.billing?.first_name || ""} readOnly placeholder="firstname"/>
                      </label>
                    </fieldset>
                    
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">Last Name</legend>
                      <label className="input validator w-full">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                        <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" defaultValue={user?.last_name || user?.billing?.last_name || ""} readOnly placeholder="lastname"/>
                      </label>
                    </fieldset>
                  </div>

                  <div className="w-full flex gap-5">
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">Username</legend>
                      <label className="input validator w-full">
                        <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" defaultValue={user?.username || user?.name || ""} readOnly placeholder="Username"/>
                      </label>
                    </fieldset>

                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">Email</legend>
                      <label className="input validator w-full">
                        <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" /></svg>
                        <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" defaultValue={user?.email || user?.billing?.email || ""} readOnly placeholder="lastname"/>
                      </label>
                    </fieldset>
                  </div>

                  {/* Password Reset Form */}
                  
                </form>

                <div className="w-full flex flex-col gap-5 border-t border-[#DBE3EA] pt-8 mt-8">
                  <h3 className="text-lg font-semibold mb-2">Change Password</h3>
                  <form className="flex flex-col gap-4 max-w-md" onSubmit={handlePasswordReset}>
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">Old Password</legend>
                      <label className={`input w-full${oldPasswordError ? " border-red-500" : ""}`}>
                        <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        <input
                          className={`!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full bg-transparent ${oldPasswordError ? "border-red-500" : ""}`}
                          type="password"
                          placeholder="Enter old password"
                          minLength={3}
                          maxLength={30}
                          value={oldPassword}
                          onChange={e => {
                            setOldPassword(e.target.value);
                            if (oldPasswordError) setOldPasswordError(null);
                          }}
                          onBlur={handleOldPasswordBlur}
                          required
                        />
                      </label>
                      {oldPasswordError && (
                        <div className="text-red-600 text-sm mt-1">{oldPasswordError}</div>
                      )}
                    </fieldset>
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">New Password</legend>
                      <label className={`input w-full${passwordResetError && passwordResetError.toLowerCase().includes("new password") ? " border-red-500" : ""}`}>
                        <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        <input
                          className={`!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full bg-transparent ${passwordResetError && passwordResetError.toLowerCase().includes("new password") ? "border-red-500" : ""}`}
                          type="password"
                          placeholder="Enter new password"
                          minLength={6}
                          maxLength={30}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                      </label>
                    </fieldset>
                    <fieldset className="fieldset w-full">
                      <legend className="fieldset-legend">Confirm New Password</legend>
                      <label className={`input w-full${passwordResetError && passwordResetError.toLowerCase().includes("confirmation") ? " border-red-500" : ""}`}>
                        <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        <input
                          className={`!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full bg-transparent ${passwordResetError && passwordResetError.toLowerCase().includes("confirmation") ? "border-red-500" : ""}`}
                          type="password"
                          placeholder="Confirm new password"
                          minLength={6}
                          maxLength={30}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                        />
                      </label>
                    </fieldset>
                    {passwordResetError && (
                      <div className="text-red-600 text-sm">{passwordResetError}</div>
                    )}
                    {passwordResetSuccess && (
                      <div className="text-green-700 text-sm">{passwordResetSuccess}</div>
                    )}
                    <button
                      type="submit"
                      className="mt-2 text-sm bg-blue-600 text-white rounded-sm px-4 py-2.5 hover:bg-blue-100 hover:text-blue-800 ml-auto border cursor-pointer"
                      disabled={passwordResetLoading}
                    >
                      {passwordResetLoading ? "Resetting..." : "Change Password"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Addresses</h2>

                <div className="flex w-full gap-8 flex-row justify-center items-stretch">
                  {/* Billing Address */}
                  <div className="border border-[#DBE3EA] p-4 rounded-sm w-full flex flex-col bg-white">
                    <h3 className="font-semibold mb-2">Billing Address</h3>
                    <div className="grid gap-2">
                      <div className="w-full flex gap-5">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">First Name</legend>
                          <label className="input validator w-full">
                            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" value={billingForm?.first_name || ""} onChange={e => setBillingForm({ ...(billingForm || {}), first_name: e.target.value })} placeholder="firstname"/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Last Name</legend>
                          <label className="input validator w-full">
                            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Last Name" value={billingForm?.last_name || ""} onChange={e => setBillingForm({ ...(billingForm || {}), last_name: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>

                      <div className="w-full flex gap-5">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Address Line 1</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Address Line 1" value={billingForm?.address_1 || ""} onChange={e => setBillingForm({ ...(billingForm || {}), address_1: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Address Line 2</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Address Line 2" value={billingForm?.address_2 || ""} onChange={e => setBillingForm({ ...(billingForm || {}), address_2: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>

                      <div className="w-full flex gap-5">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">City</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="City" value={billingForm?.city || ""} onChange={e => setBillingForm({ ...(billingForm || {}), city: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Postcode</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Postcode" value={billingForm?.postcode || ""} onChange={e => setBillingForm({ ...(billingForm || {}), postcode: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>
                      <fieldset className="fieldset w-full">
                        <legend className="fieldset-legend">Country</legend>
                        <label className="input validator w-full">
                          <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" /></svg>
                          <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Country" value={billingForm?.country || ""} onChange={e => setBillingForm({ ...(billingForm || {}), country: e.target.value })}/>
                        </label>
                      </fieldset>

                      <div className="w-full flex gap-5">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Email</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Email" value={billingForm?.email || ""} onChange={e => setBillingForm({ ...(billingForm || {}), email: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Phone</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Phone" value={billingForm?.phone || ""} onChange={e => setBillingForm({ ...(billingForm || {}), phone: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>
                    </div>
                    <button onClick={handleSaveBilling} disabled={billingSaving} className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-sm ml-auto">
                      {billingSaving ? "Saving..." : "Save Billing Address"}
                    </button>
                  </div>

                  {/* Shipping Address */}
                  <div className="border border-[#DBE3EA] p-4 rounded-sm w-full flex flex-col bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="grid gap-2">
                      <div className="flex gap-5 w-full">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">First Name</legend>
                          <label className="input validator w-full">
                            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="First Name" value={shippingForm?.first_name || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), first_name: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Last Name</legend>
                          <label className="input validator w-full">
                            <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="First Name" value={shippingForm?.last_name || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), last_name: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>

                      <div className="flex gap-5 w-full">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Address Line 1</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Address Line 1" value={shippingForm?.address_1 || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), address_1: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Address Line 2</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Address Line 2" value={shippingForm?.address_2 || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), address_2: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>

                      <div className="flex gap-5 w-full">
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">City</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="City" value={shippingForm?.city || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), city: e.target.value })}/>
                          </label>
                        </fieldset>
                        <fieldset className="fieldset w-full">
                          <legend className="fieldset-legend">Postcode</legend>
                          <label className="input validator w-full">
                            <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                            <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Postcode" value={shippingForm?.postcode || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), postcode: e.target.value })}/>
                          </label>
                        </fieldset>
                      </div>
                      <fieldset className="fieldset w-full">
                        <legend className="fieldset-legend">Country</legend>
                        <label className="input validator w-full">
                          <svg className="!h-[1.2em] opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" /></svg>
                          <input className="!outline-0 !ring-0 focus:!outline-0 focus:!ring-0 w-full" type="text" placeholder="Country" value={shippingForm?.country || ""} onChange={e => setShippingForm({ ...(shippingForm || {}), country: e.target.value })}/>
                        </label>
                      </fieldset>
                    </div>
                    <button onClick={handleSaveShipping} disabled={shippingSaving} className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-sm ml-auto">
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

}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-500">Loading account...</div>}>
      <AccountContent />
    </Suspense>
  );
}