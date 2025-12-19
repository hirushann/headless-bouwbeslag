"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { useUserContext } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncRemoveItem } from "@/lib/cartApi";
import { getDeliveryInfo } from "@/lib/deliveryUtils";

export default function Header({
  shippingSettings,
}: {
  shippingSettings?: { flatRate: number; freeShippingThreshold: number | null };
}) {
  const items = useCartStore((state) => state.items);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { userRole } = useUserContext();
  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
  const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

  const subtotal = items.reduce(
    (sum, item) => {
       const displayedItemPrice = isB2B ? item.price : item.price * 1.21;
       return sum + displayedItemPrice * item.quantity;
    },
    0
  );

  const { flatRate = 0, freeShippingThreshold = null } = shippingSettings || {};

  const isFreeShipping =
    freeShippingThreshold !== null && subtotal >= freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : flatRate;
  const displayShipping = isB2B ? shipping : shipping * 1.21;

  const increaseQuantity = (id: number) => {
    const item = useCartStore.getState().items.find((i) => i.id === Number(id));
    if (item) {
      useCartStore.getState().updateQty(Number(id), item.quantity + 1);
    }
  };

  const decreaseQuantity = (id: number) => {
    const item = useCartStore.getState().items.find((i) => i.id === Number(id));
    if (item && item.quantity > 1) {
      useCartStore.getState().updateQty(Number(id), item.quantity - 1);
    }
  };

  const removeItem = (id: number) => {
    useCartStore.getState().removeItem(Number(id));
    // Trigger background sync to remove from WP session
    syncRemoveItem(Number(id)).catch(err => console.error("Background sync failed:", err));
  };

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isCartOpen]);

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
      }
    };
    checkLogin();
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      setIsVisible(currentScrollPos > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []); 



  // STEP 2: Update click handler to use helper
  const handleCheckoutRedirect = () => {
    // Instead of building external URL, we just go to our local checkout page
    // The checkout page will handle adding items via URL params itself
    if (items.length === 0) return;
    router.push("/checkout");
  };

  return (
    <div className="bg-[#F7F7F7] w-full relative">
      
      <div className="shadow-[0px_4px_40px_0px_#00000012] bg-white w-full p-2">
        <div className="max-w-[1440px] mx-auto relative flex justify-between items-center w-full">
          <div className="flex justify-start items-center gap-3 w-3/4 font-sans text-sm">
            <div className="flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
              <span className="font-normal">Gegarandeerd de goedkoopste!</span>
            </div>
            <div className="hidden lg:flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
              <span>Uitsluitend A merken</span>
            </div>
            <div className="hidden lg:flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
              <span>Snelle levering</span>
            </div>
            <div className="hidden lg:flex gap-1 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
              <span>De beste service</span>
            </div>
          </div>
          <div className="w-1/4 flex justify-end items-center">
            <img className="w-full hidden lg:block" src="/header-top-pay.png" alt="" />
            <img className="w-full lg:hidden" src="/mobile-rating.png" alt="" />
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 bg-[#F7F7F7] w-full ${isVisible ? 'fixed top-0 left-0 z-50' : ''}`}>
        <div className="max-w-[1440px] mx-auto flex justify-between items-center py-4 font-sans px-2 lg:px-0">
          <a href="/">
            <img className="w-56 lg:w-64" src="/logo.png" alt="" />
          </a>
          <div className="hidden lg:flex justify-center items-center w-[30%]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              className="join w-full border border-[#E2E2E2] rounded-[4px]"
            >
              <div className="w-full rounded-[5px]">
                <label className="input validator w-full border-0 rounded-[5px] bg-white">
                  <input className="bg-white" type="text" placeholder="Search something..." value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
              </div>
              <button type="submit" className="btn bg-[#2332C51A] rounded-[4px] border-0 shadow-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#0066FF"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" /></svg>
              </button>
            </form>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex">
              <div className="indicator">
                <span className="indicator-item badge badge-secondary text-xs font-bold bg-blue-800 rounded-full border-0 text-white">{totalQty}</span>
                <button onClick={() => setIsCartOpen(true)} className="cursor-pointer btn btn-ghost p-0 bg-transparent m-0 relative hover:bg-transparent focus:bg-transparent active:bg-transparent hover:border-0" aria-label="Open cart">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7 lg:size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex lg:gap-1.5 items-center">
              <div className="tooltip tooltip-bottom flex" data-tip="Antwoord op al je vragen">
                <Link className="flex items-center" href="/hulp">
                  <div className="m-0 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="size-7 lg:size-5" fill="#000000"><path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 240C302.3 240 288 254.3 288 272C288 285.3 277.3 296 264 296C250.7 296 240 285.3 240 272C240 227.8 275.8 192 320 192C364.2 192 400 227.8 400 272C400 319.2 364 339.2 344 346.5L344 350.3C344 363.6 333.3 374.3 320 374.3C306.7 374.3 296 363.6 296 350.3L296 342.2C296 321.7 310.8 307 326.1 302C332.5 299.9 339.3 296.5 344.3 291.7C348.6 287.5 352 281.7 352 272.1C352 254.4 337.7 240.1 320 240.1zM288 432C288 414.3 302.3 400 320 400C337.7 400 352 414.3 352 432C352 449.7 337.7 464 320 464C302.3 464 288 449.7 288 432z" /></svg>
                  </div>
                </Link>
              </div>
              <Link href="/hulp" className="flex items-center">
                 <span className="hidden lg:block font-medium text-base cursor-pointer">Hulp</span>
              </Link>
            </div>
            <div className="flex lg:hidden">
              <Link href="/account">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              </Link>
            </div>
            {/* My Account Dropdown */}
            {!isLoggedIn ? (
              <Link 
                href="/account/login"
                className="font-medium text-base hidden lg:block cursor-pointer"
              >
                Mijn account
              </Link>
            ) : (
              <select
                className="select select-ghost font-medium text-base !border-0 focus:border-0 !outline-0 !box-shadow-none hidden lg:block cursor-pointer"
                // defaultValue="account"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "account") {
                    router.push("/account");
                  } else if (val === "orders") {
                    router.push("/account?tab=orders");
                  } else if (val === "addresses") {
                    router.push("/account?tab=addresses");
                  } else if (val === "details") {
                    router.push("/account?tab=details");
                  } else if (val === "logout") {
                    if (typeof window !== "undefined") {
                      localStorage.clear();
                      setIsLoggedIn(false);
                      router.push("/");
                    }
                  }
                  // Always reset to "account"
                  e.target.value = "account";
                }}
              >
                <option className="cursor-pointer" value="account">
                  Mijn account
                </option>
                {/* <option className="cursor-pointer" value="account">My Account</option> */}
                <option className="cursor-pointer" value="orders">Orders</option>
                <option className="cursor-pointer" value="addresses">Addresses</option>
                <option className="cursor-pointer" value="details">Account Details</option>
                <option className="cursor-pointer" value="logout">Logout</option>
              </select>
            )}
          </div>
        </div>
        <div className="bg-[#1C2530] shadow-[0px_4px_40px_0px_#00000012] w-full">
          <div className="p-4 flex lg:hidden w-full gap-5">
            <div>
              <div className="dropdown w-full">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-lg dropdown-content bg-[#1C2530] z-1 mt-4.5 w-75 p-2 shadow text-white">
                  <li>
                    <a href="/categories">Categorieën</a>  
                  </li>
                  <li>
                    <a href="#">Deurklink</a>  
                  </li>
                  <li>
                    <a href="#">Cilinder</a>  
                  </li>
                  <li>
                    <a href="#">Tochtstrip</a>  
                  </li>
                  <li>
                    <a href="#">Deurstopper</a>  
                  </li>
                </ul>
              </div>
            </div>
            <div className="w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim()) {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }
                }}
                className="join w-full border border-[#E2E2E2] rounded-[4px] bg-white"
              >
                <div className="w-full rounded-[4px] bg-white">
                  <label className="input validator w-full border-0 rounded-[5px] bg-white">
                    <input className="bg-white" type="text" placeholder="Start met zoeken..." value={query} onChange={(e) => setQuery(e.target.value)} />
                  </label>
                </div>
                <button type="submit" className="btn bg-[#d4d7f6] rounded-[4px] border-0 shadow-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#0066FF"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" /></svg>
                </button>
              </form>
            </div>
          </div>
          <div className="max-w-[1440px] relative mx-auto hidden lg:flex justify-between items-center">
            <div className="flex justify-start items-center">
              <a href="/categories">
                <div className="bg-[#0066FF] flex gap-1 py-4 px-5 w-max items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="25" height="25" fill="#ffffff"><path d="M96 96C113.7 96 128 110.3 128 128L128 464C128 472.8 135.2 480 144 480L544 480C561.7 480 576 494.3 576 512C576 529.7 561.7 544 544 544L144 544C99.8 544 64 508.2 64 464L64 128C64 110.3 78.3 96 96 96zM192 160C192 142.3 206.3 128 224 128L416 128C433.7 128 448 142.3 448 160C448 177.7 433.7 192 416 192L224 192C206.3 192 192 177.7 192 160zM224 240L352 240C369.7 240 384 254.3 384 272C384 289.7 369.7 304 352 304L224 304C206.3 304 192 289.7 192 272C192 254.3 206.3 240 224 240zM224 352L480 352C497.7 352 512 366.3 512 384C512 401.7 497.7 416 480 416L224 416C206.3 416 192 401.7 192 384C192 366.3 206.3 352 224 352z" /></svg>
                  <span className="text-white font-normal text-sm">
                    Categorieën
                  </span>
                </div>
              </a>
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">
                  Deurklink
                </span>
              </div>
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">
                  Cilinder
                </span>
              </div>
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">
                  Tochtstrip
                </span>
              </div>
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">
                  Deurstopper
                </span>
              </div>
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">Deurbeslag</span>
              </div>
            </div>
            <div className="flex justify-start items-center">
              <div className="flex gap-1 py-4 px-5 w-max items-center">
                <Link href="/kennisbank">
                  <span className="text-white font-normal text-sm cursor-pointer">Kennisbank</span>
                </Link>
              </div>
              {/* <div className="bg-[#2B394A] flex gap-1 py-4 px-5 w-max items-center">
                <span className="text-white font-normal text-sm">
                  Request a quote
                </span>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div>
        {/* Backdrop */}
        <div
          className={`fixed top-0 left-0 right-0 bottom-0 bg-black/20 z-[60] transition-opacity duration-300 ${
            isCartOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsCartOpen(false)}
          aria-label="Close cart backdrop"
        />
        {/* Drawer */}
        <div className={`fixed top-0 right-0 h-full w-full lg:w-150 bg-white shadow-lg z-[70] transform transition-transform duration-300 ${ isCartOpen ? "translate-x-0" : "translate-x-full" }`} aria-hidden={!isCartOpen}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-[#E9E9E9] p-4 bg-[#F7F7F7]">
              <p className="text-lg font-medium text-[#1C2530]">Winkelmand</p>
              <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" className="text-2xl font-bold leading-none hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 cursor-pointer"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 mb-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-16 text-gray-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                    <p className="text-gray-500 font-medium">Je winkelwagen is leeg</p>
                    <button onClick={() => setIsCartOpen(false)} className="mt-4 text-[#0066FF] font-semibold hover:underline">Verder winkelen</button>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center justify-between p-3 mb-3 border border-[#DEDEDE] rounded-sm relative flex-col lg:flex-row">
                        <div className="flex items-center gap-4">
                            {item.slug ? (
                              <Link href={`/${item.slug}`}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded bg-gray-100 cursor-pointer hover:opacity-80 transition" />
                                ) : (
                                    <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400 cursor-pointer hover:opacity-80 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                    </div>
                                )}
                              </Link>
                            ) : (
                                item.image ? (
                                    <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded bg-gray-100" />
                                ) : (
                                    <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                    </div>
                                )
                            )}
                            <div>
                                {item.slug ? (
                                  <Link href={`/${item.slug}`} className="hover:text-blue-600 transition">
                                    <h3 className="font-semibold">{item.name}</h3>
                                  </Link>
                                ) : (
                                  <h3 className="font-semibold">{item.name}</h3>
                                )}
                                {(item.color || item.brand || item.model) && (
                                  <div className="flex gap-2 flex-wrap mt-1 mb-2">
                                      {item.color && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Color: {item.color}</p>}
                                      {item.brand && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Brand: {item.brand}</p>}
                                      {item.model && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Model: {item.model}</p>}
                                  </div>
                                )}
                                
                                {(() => {
                                  // Recalculate dynamic delivery info mostly for color coding match
                                  // Use stored values if available, otherwise fallback (though existing items might miss new fields, hence defaults)
                                  const info = getDeliveryInfo(
                                    item.stockStatus || 'instock',
                                    item.quantity,
                                    item.stockQuantity !== undefined ? item.stockQuantity : null,
                                    item.leadTimeInStock || 1,
                                    item.leadTimeNoStock || 30
                                  );

                                  // Determine color based on type (matching ProductPageClient logic)
                                  let colorClass = "text-[#03B955]"; // Green (In stock)
                                  if (info.type === "PARTIAL_STOCK") colorClass = "text-[#03B955]"; // Green
                                  else if (info.type === "BACKORDER" || info.type === "OUT_OF_STOCK") colorClass = "text-[#FF5E00]"; // Orange/Red

                                  return (
                                    <p className={`${colorClass} text-xs font-semibold mt-1`}>
                                      {info.message}
                                    </p>
                                  );
                                })()}
                            </div>
                        </div>
                        <div className="flex w-full lg:w-auto flex-row-reverse lg:flex-col items-center lg:items-end gap-2">
                            <div className="flex items-center border border-[#EDEDED] shadow-xs rounded-sm">
                                <button onClick={() => decreaseQuantity(item.id)} className="border-r border-[#EDEDED] cursor-pointer px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200" aria-label={`Decrease quantity of ${item.name}`}>−</button>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-12 text-center px-2 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = Math.max(
                                      1,
                                      parseInt(e.target.value) || 1
                                    );
                                    useCartStore.getState().updateQty(item.id, newQuantity);
                                  }}
                                  aria-label={`Set quantity of ${item.name}`}
                                />
                                <button onClick={() => increaseQuantity(item.id)} className="border-l border-[#EDEDED] cursor-pointer px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200" aria-label={`Increase quantity of ${item.name}`}>+</button>
                            </div>
                            <span className="font-bold text-lg flex flex-col">
                            €{((isB2B ? item.price : item.price * 1.21) * item.quantity).toFixed(2)} <span className="text-xs font-normal text-gray-500">{taxLabel}</span>
                            </span>
                            <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from cart`} className="text-red-600 hover:text-red-800 cursor-pointer bg-[#FFEAEB] rounded-full p-1 absolute -top-2 -right-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                        </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-[#E9E9E9] pt-6 mt-6 sticky bottom-1 bg-white p-4">
                <div className="flex justify-between mb-3 text-base font-medium text-[#3D4752]">
                  <span>Subtotaal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-3 text-base font-medium text-[#3D4752]">
                  <span>Verzendkosten</span>
                  <span>
                    {isFreeShipping 
                      ? "Gratis" 
                      : displayShipping === 0 
                        ? "N.t.b." 
                        : `€${displayShipping.toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between mb-4 text-base">
                  <p className="font-bold">Totaalbedrag 
                    <span className="font-normal text-xs ml-1.5">{taxLabel}</span>
                  </p>
                  <span className="font-bold">€{(subtotal + displayShipping).toFixed(2)}</span>
                </div>
                {items.length > 0 && isB2B && (
                     <div className="flex justify-between mb-4 text-sm text-gray-500">
                        <span>Totaal (incl. BTW)</span>
                        {/* Subtotal is Ex-VAT here. Shipping is assumed Ex-VAT (flatRate). Add 21% to total. */}
                        <span>€{((subtotal + shipping) * 1.21).toFixed(2)}</span>
                     </div>
                )}
                <button onClick={handleCheckoutRedirect} className="w-full bg-[#0066FF] text-white font-bold px-4 py-3.5 rounded-sm text-base">
                  Afrekenen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
