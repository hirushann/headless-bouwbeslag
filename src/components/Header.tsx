"use client";

import { useCartStore } from "@/lib/cartStore";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const items = useCartStore((state) => state.items);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 0; // Free shipping

  const increaseQuantity = (id: string) => {
    const item = useCartStore.getState().items.find((i) => i.id === id);
    if (item) {
      useCartStore.getState().updateQty(id, item.quantity + 1);
    }
  };

  const decreaseQuantity = (id: string) => {
    const item = useCartStore.getState().items.find((i) => i.id === id);
    if (item && item.quantity > 1) {
      useCartStore.getState().updateQty(id, item.quantity - 1);
    }
  };

  const removeItem = (id: string) => {
    useCartStore.getState().removeItem(id);
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

  return (
    <div className="bg-[#F7F7F7] w-full">
      <div className="shadow-[0px_4px_40px_0px_#00000012] bg-white w-full p-2">
        <div className="max-w-[1440px] mx-auto relative flex justify-between items-center w-full">
          <div className="flex justify-start items-center gap-3 w-3/4 font-sans text-sm">
            <div className="flex gap-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="#03B955"
              >
                <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" />
              </svg>
              <span className="font-normal">Best prices guaranteed</span>
            </div>
            <div className="flex gap-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="#03B955"
              >
                <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" />
              </svg>
              <span>Money back guarantee</span>
            </div>
            <div className="flex gap-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="#03B955"
              >
                <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" />
              </svg>
              <span>Largest range in Europe</span>
            </div>
            <div className="flex gap-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="#03B955"
              >
                <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" />
              </svg>
              <span>30-day return policy</span>
            </div>
          </div>

          <div className="w-1/4 flex justify-end items-center">
            <img className="w-full" src="/header-top-pay.png" alt="" />
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto flex justify-between items-center py-4 font-sans">
        <a href="/">
          <img className="w-64" src="/logo.png" alt="" />
        </a>
        <div className="flex justify-center items-center w-[30%]">
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
                <input
                  className="bg-white"
                  type="text"
                  placeholder="Search something..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn bg-[#2332C51A] rounded-[4px] border-0 shadow-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="#0066FF"
              >
                <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
              </svg>
            </button>
          </form>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex">
            <div className="indicator">
              <span className="indicator-item badge badge-secondary text-xs font-bold bg-blue-800 rounded-full border-0 text-white">
                {totalQty}
              </span>
              <button
                onClick={() => setIsCartOpen(true)}
                className="cursor-pointer btn btn-ghost p-0 bg-transparent m-0 relative hover:bg-transparent focus:bg-transparent active:bg-transparent hover:border-0"
                aria-label="Open cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  width="30"
                  height="30"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 items-center">
            <div
              className="tooltip tooltip-bottom flex"
              data-tip="Need any help?"
            >
              <button className="m-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width="20"
                  height="20"
                  fill="#000000"
                >
                  <path d="M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 240C302.3 240 288 254.3 288 272C288 285.3 277.3 296 264 296C250.7 296 240 285.3 240 272C240 227.8 275.8 192 320 192C364.2 192 400 227.8 400 272C400 319.2 364 339.2 344 346.5L344 350.3C344 363.6 333.3 374.3 320 374.3C306.7 374.3 296 363.6 296 350.3L296 342.2C296 321.7 310.8 307 326.1 302C332.5 299.9 339.3 296.5 344.3 291.7C348.6 287.5 352 281.7 352 272.1C352 254.4 337.7 240.1 320 240.1zM288 432C288 414.3 302.3 400 320 400C337.7 400 352 414.3 352 432C352 449.7 337.7 464 320 464C302.3 464 288 449.7 288 432z" />
                </svg>
              </button>
            </div>
            <span className="font-medium text-base">Help</span>
          </div>
          <select
            defaultValue="Pick a font"
            className="select select-ghost font-medium text-base !border-0 focus:border-0 !outline-0 !box-shadow-none"
          >
            <option disabled={false}>My Account</option>
            <option>All Orders</option>
            <option>Shipping Addresses</option>
            <option>Logout</option>
          </select>
        </div>
      </div>
      <div className="bg-[#1C2530] shadow-[0px_4px_40px_0px_#00000012] w-full">
        <div className="max-w-[1440px] relative mx-auto flex justify-between items-center">
          <div className="flex justify-start items-center">
            <a href="/categories">
              <div className="bg-[#0066FF] flex gap-1 py-4 px-5 w-max items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width="25"
                  height="25"
                  fill="#ffffff"
                >
                  <path d="M96 96C113.7 96 128 110.3 128 128L128 464C128 472.8 135.2 480 144 480L544 480C561.7 480 576 494.3 576 512C576 529.7 561.7 544 544 544L144 544C99.8 544 64 508.2 64 464L64 128C64 110.3 78.3 96 96 96zM192 160C192 142.3 206.3 128 224 128L416 128C433.7 128 448 142.3 448 160C448 177.7 433.7 192 416 192L224 192C206.3 192 192 177.7 192 160zM224 240L352 240C369.7 240 384 254.3 384 272C384 289.7 369.7 304 352 304L224 304C206.3 304 192 289.7 192 272C192 254.3 206.3 240 224 240zM224 352L480 352C497.7 352 512 366.3 512 384C512 401.7 497.7 416 480 416L224 416C206.3 416 192 401.7 192 384C192 366.3 206.3 352 224 352z" />
                </svg>
                <span className="text-white font-normal text-sm">
                  All Categories
                </span>
              </div>
            </a>
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">
                Interior door fittings
              </span>
            </div>
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">
                Exterior door fittings
              </span>
            </div>
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">
                Window hardware
              </span>
            </div>
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">
                Sliding door hardware
              </span>
            </div>
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">Assortment</span>
            </div>
          </div>
          <div className="flex justify-start items-center">
            <div className="flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">Blog</span>
            </div>
            <div className="bg-[#2B394A] flex gap-1 py-4 px-5 w-max items-center">
              <span className="text-white font-normal text-sm">
                Request a quote
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div>
        {/* Backdrop */}
        <div
          className={`fixed top-[180px] left-0 right-0 bottom-0 bg-black/20 z-40 transition-opacity duration-300 ${
            isCartOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsCartOpen(false)}
          aria-label="Close cart backdrop"
        />
        {/* Drawer */}
        <div className={`fixed top-[180px] right-0 h-[calc(100%-120px)] w-150 bg-white shadow-lg z-50 transform transition-transform duration-300 ${ isCartOpen ? "translate-x-0" : "translate-x-full" }`} aria-hidden={!isCartOpen}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-[#E9E9E9] p-4 bg-[#F7F7F7]">
              <h2 className="text-lg font-medium text-[#1C2530]">Toegevoegd aan winkelmand</h2>
              <button onClick={() => setIsCartOpen(false)} aria-label="Close cart" className="text-2xl font-bold leading-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 cursor-pointer"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 mb-8">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm">Your cart is empty</p>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center justify-between p-3 mb-3 border border-[#DEDEDE] rounded-sm relative">
                        <div className="flex items-center gap-4">
                            <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded" />
                            <div>
                            <h3 className="font-semibold">{item.name}</h3>
                                <div className="flex gap-2 ">
                                    <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2">Color: {item.color}</p>
                                    <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2">Brand: {item.brand}</p>
                                    <p className="text-sm text-gray-600">Model: {item.model}</p>
                                </div>
                            <p className="text-green-600 text-sm mt-1">Ready to ship in 1–3 days</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
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
                                    useCartStore.getState().updateQuantity(item.id, newQuantity);
                                  }}
                                  aria-label={`Set quantity of ${item.name}`}
                                />
                                <button onClick={() => increaseQuantity(item.id)} className="border-l border-[#EDEDED] cursor-pointer px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200" aria-label={`Increase quantity of ${item.name}`}>+</button>
                            </div>
                            <span className="font-bold text-lg">
                            €{(item.price * item.quantity).toFixed(2)}
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
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-3 text-base font-medium text-[#3D4752]">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between mb-4 text-base">
                  <p className="font-bold">Total amount <span className="font-medium">(incl 21% VAT)</span></p>
                  <span className="font-bold">€{(subtotal + shipping).toFixed(2)}</span>
                </div>
                <button className="w-full bg-[#0066FF] text-white font-bold px-4 py-3.5 rounded-sm text-base">ORDER NOW</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
