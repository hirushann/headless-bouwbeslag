"use client";
import React, { useState, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";

const ProductPage = () => {
  const [selectedImage, setSelectedImage] = useState('/afbeelding.png');
  const [quantity, setQuantity] = useState(1);

  const thumbnails = [
    '/top.jpg',
    '/right.jpg',
    '/Front_orthographic.jpg',
    '/2partsPosed-depth.jpg',
    '/afbeelding.png',
  ];

  const colours = [
    { name: 'Red', colorCode: 'bg-red-600' },
    { name: 'Blue', colorCode: 'bg-blue-600' },
    { name: 'Green', colorCode: 'bg-green-600' },
    { name: 'Yellow', colorCode: 'bg-yellow-400' },
  ];

  const models = [
    { id: 1, name: 'Model A', image: '/mainprodimg.png' },
    { id: 2, name: 'Model B', image: '/mainprodimg.png' },
    { id: 3, name: 'Model C', image: '/mainprodimg.png' },
    { id: 4, name: 'Model C', image: '/mainprodimg.png' },
    { id: 5, name: 'Model C', image: '/mainprodimg.png' },
    { id: 6, name: 'Model C', image: '/mainprodimg.png' },
  ];

  const volumeDiscounts = [
    { quantity: '1-9', price: '€10.00' },
    { quantity: '10-49', price: '€9.00' },
    { quantity: '50+', price: '€8.00' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className='bg-[#F5F5F5] font-sans'>
        <div className="max-w-[1440px] mx-auto py-8">
            <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <Link href="/" className="hover:underline flex items-center gap-1 text-black">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                    </span>
                    <span>Deurbeslag</span>
                </Link>{""}
                <Link href="/" className="hover:underline flex items-center gap-1 text-black">
                    <span>/ Binnendeuren</span>
                </Link>{""}
                    / Schuifdeurkommen  
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side: Images */}
                <div className="lg:w-1/2">
                    <img
                        src={selectedImage}
                        alt="Main Product"
                        className="w-full h-auto rounded-lg object-cover mb-4"
                    />
                    <div className="grid grid-cols-4 gap-4">
                        {thumbnails.map((thumb, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(thumb)}
                            className={`border rounded-md overflow-hidden w-full h-full flex-shrink-0 ${
                            selectedImage === thumb ? 'border-blue-600' : 'border-gray-300'
                            }`}
                            aria-label={`Thumbnail ${idx + 1}`}
                        >
                            <img
                            src={thumb}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            />
                        </button>
                        ))}
                    </div>
                    <div className='text-[#1C2530] font-bold text-3xl mt-8'>
                        <h3>Handig om dij te bestellen</h3>
                        <div className='grid grid-cols-3 gap-4 mt-4'>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Matching accessories</button>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Matching roses</button>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Matching keyroses</button>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Matching cilinderosses</button>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Matching blind roses</button>
                            <button className='border border-[#0066FF1A] bg-[#0066FF1A] py-2.5 cursor-pointer text-[#0066FF] font-bold text-base rounded-sm hover:bg-white'>Must need</button>
                        </div>
                    </div>
                </div>

                {/* Right side: Product details */}
                <div className="lg:w-1/2 flex flex-col gap-5">
                    <div>
                        <Image src="/productcatlogo.png" className="w-auto h-auto" alt="Product Category Logo" width={50} height={50} />
                    </div>
                    {/* Title and Brand */}
                    <div>
                        <h1 className="text-3xl font-bold text-[#1C2530]">Premium Door Handle</h1>
                    </div>

                    {/* Price and Discount */}
                    <div className="flex items-center gap-4">
                        <p className="text-3xl font-bold text-[#0066FF]">€12.99</p>
                        <p className="text-lg font-normal line-through text-[#212121]">€15.99</p>
                        <div className="tooltip tooltip-right" data-tip="Deze korting is gebaseerd op de adviesprijs van €100,00">
                            <button className="bg-[#FF5E00] px-[12px] py-[5px] rounded-sm text-white text-[13px] font-bold cursor-pointer">40% OFF</button>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h2 className="font-semibold text-lg mb-2">Key Features:</h2>
                        <ul className="list-none list-inside text-gray-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#03B955" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>
                                <span>Premium RVS construction with Bronze PVD coating</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#03B955" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>
                                <span>Suitable for door thickness 38-43mm</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#03B955" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>
                                <span>Includes mounting hardware and square spindle</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#03B955" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>
                                <span>Ergonomic oval design for comfortable grip</span>
                            </li>
                        </ul>
                    </div>

                    {/* Colour Swatches */}
                    <div className="flex gap-2 items-center">
                        <h2 className="font-semibold text-lg mb-2">Our Colours:</h2>
                        <div className="flex gap-3">
                        {colours.map((colour) => (
                            <button
                            key={colour.name}
                            className={`w-8 h-8 rounded-full border border-gray-300 ${colour.colorCode}`}
                            aria-label={colour.name}
                            title={colour.name}
                            />
                        ))}
                        </div>
                    </div>

                    {/* Models Carousel */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-lg">Our Models</h2>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => scrollBy(-200)} className="w-8 h-8 flex items-center justify-center rounded-full border border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer" aria-label="Previous models">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button type="button" onClick={() => scrollBy(200)} className="w-8 h-8 flex items-center justify-center rounded-full border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer" aria-label="Next models">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        </div>
                        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
                        {models.map((model) => (
                            <div key={model.id} className="flex-shrink-0 w-32 h-32 border border-[#E8E1DC] rounded-sm  bg-white flex items-center justify-center">
                            <img src={model.image} alt={model.name} className="max-h-full max-w-full object-contain" />
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Volume Discount Section */}
                    <div className="bg-white border border-white rounded-lg p-4 flex items-center gap-8">
                        <h2 className="font-semibold text-lg">Volume discount:</h2>
                        <div className="flex gap-8 items-start">
                            <div>
                                <p className='mb-1 text-[#3D4752] font-medium text-lg'>Quantity:</p>
                                <label className="text-[#3D4752] font-normal text-base flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 !border-[#DCDCDC] !rounded-[3px]" />
                                    10
                                </label>
                                <label className="text-[#3D4752] font-normal text-base flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 !border-[#DCDCDC] !rounded-[3px]" />
                                    50
                                </label>
                                <label className="text-[#3D4752] font-normal text-base flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 !border-[#DCDCDC] !rounded-[3px]" />
                                    100
                                </label>
                            </div>
                            <div>
                                <p className='mb-1 text-[#3D4752] font-medium text-lg'>Discount</p>
                                <p className='text-[#03B955] font-medium text-base'>5%</p>
                                <p className='text-[#03B955] font-medium text-base'>10%</p>
                                <p className='text-[#03B955] font-medium text-base'>15%</p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-[#E4EFFF] py-3 px-5 rounded-md'> 
                        <p className='text-[#3D4752] font-normal text-base'>Become a business customer and benefit from competitive purchase prices! <a href="#" className='text-[#0066FF] font-bold'>Click here</a> to request an account</p>
                    </div>

                    {/* Quantity Selector and Add to Cart */}
                    <div className="flex items-center gap-4 mt-4 justify-between">
                        <div className='w-3/12 flex justify-center items-center'>
                            <p className="text-3xl font-bold text-[#1C2530]">€12.99</p>
                        </div>

                        <div className="flex border border-[#EDEDED] shadow-xs rounded-sm overflow-hidden bg-white w-3/12">
                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-5 py-3 text-2xl cursor-pointer border-r border-[#EDEDED]">-</button>
                            <div className="px-6 py-2 text-base font-medium text-center min-w-[60px] flex items-center justify-center">
                                {quantity.toString().padStart(2, '0')}
                            </div>
                            <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-5 py-3 text-2xl cursor-pointer border-l border-[#EDEDED]">+</button>
                        </div>

                        <div className='w-6/12'>
                            <button type="button" className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-sm hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-3 w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                                ADD TO CART
                            </button>
                        </div>
                    </div>

                    <div className='bg-[#FFE1E1] py-3 px-5 rounded-md'> 
                        <p className='text-[#FF5E00] font-semibold text-lg'>Dit artikel moet besteld worden</p>
                        <p className='text-[#3D4752] font-normal text-sm'>Indien je nu bestelt wordt dit artikel vandaag verzonden</p>
                    </div>

                    <div>
                        <p className='text-[#212121] font-medium text-lg mb-3'>Need Help?</p>
                        <div className='flex gap-3 items-center justify-center'>
                            <button className='border border-[#0066FF] rounded-sm py-2.5 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors'>
                                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 transition-colors"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" /><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" /></svg></span>
                                Mail us
                            </button>
                            <button className='border border-[#0066FF] rounded-sm py-2 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors'>
                                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="size-6"><path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z"/></svg></span>
                                WhatsApp
                            </button>
                            <button className='border border-[#0066FF] rounded-sm py-2.5 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors'>
                                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="size-5"><path d="M376 32C504.1 32 608 135.9 608 264C608 277.3 597.3 288 584 288C570.7 288 560 277.3 560 264C560 162.4 477.6 80 376 80C362.7 80 352 69.3 352 56C352 42.7 362.7 32 376 32zM384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256C352 238.3 366.3 224 384 224zM352 152C352 138.7 362.7 128 376 128C451.1 128 512 188.9 512 264C512 277.3 501.3 288 488 288C474.7 288 464 277.3 464 264C464 215.4 424.6 176 376 176C362.7 176 352 165.3 352 152zM176.1 65.4C195.8 60 216.4 70.1 224.2 88.9L264.7 186.2C271.6 202.7 266.8 221.8 252.9 233.2L208.8 269.3C241.3 340.9 297.8 399.3 368.1 434.2L406.7 387C418 373.1 437.1 368.4 453.7 375.2L551 415.8C569.8 423.6 579.9 444.2 574.5 463.9L573 469.4C555.4 534.1 492.9 589.3 416.6 573.2C241.6 536.1 103.9 398.4 66.8 223.4C50.7 147.1 105.9 84.6 170.5 66.9L176 65.4z"/></svg></span>
                                Call us
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='mt-8'>
                <div className="grid grid-cols-2 gap-5 h-full">
                    <div className='flex flex-col gap-5'>
                        {/* first row left accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group" open>
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Product description
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-[#3D4752] space-y-4 font-normal text-base">
                                    <p>
                                        The Premium Bronze Door Handle Set represents the perfect fusion of contemporary design and exceptional functionality. Crafted from high-grade stainless steel and finished with a durable Bronze PVD coating, this handle set delivers both aesthetic appeal and long-lasting performance.
                                    </p>
                                    <p>
                                        Each handle features an ergonomic oval design that provides comfortable grip and smooth operation. The bronze finish adds warmth and sophistication to any interior, making it ideal for modern homes, offices, and commercial spaces. The handles are spring-loaded for consistent return to horizontal position.
                                    </p>
                                    <p>
                                        This professional-grade door hardware meets Class 4 durability standards according to EN1906:2012, ensuring reliable performance even in high-traffic environments. The set includes everything needed for installation: two handles, rosettes, mounting screws, and an 8x8mm square spindle.
                                    </p>
                                    <div className="bg-[#E3EEFF] text-gray-800 p-5 rounded-lg border-0">
                                        <p className="font-semibold text-gray-900 text-lg">Installation Tip:</p>
                                        <p className="text-base text-normal">
                                            Due to the extended handle design, we recommend using painter's tape to protect the spindle during installation. 
                                            Insert patent screws through the base rosette before mounting to prevent damage to the bronze finish.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* second row left accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Product specifications
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-700">
                                        <tbody>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">SKU</td>
                                            <td className="px-6 py-3">34354354656675</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Width</td>
                                            <td className="px-6 py-3">19mm</td>
                                            </tr>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">Height</td>
                                            <td className="px-6 py-3">60mm</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Category</td>
                                            <td className="px-6 py-3">Door handle without rosette</td>
                                            </tr>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">Brand</td>
                                            <td className="px-6 py-3">VDS</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Colour</td>
                                            <td className="px-6 py-3">Bronze</td>
                                            </tr>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">Length</td>
                                            <td className="px-6 py-3">130mm</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Finishing</td>
                                            <td className="px-6 py-3">Bronze blend</td>
                                            </tr>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">Material</td>
                                            <td className="px-6 py-3">Stainless steel</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Product Suitable for</td>
                                            <td className="px-6 py-3">Indoor and Outdoor</td>
                                            </tr>
                                            <tr className="bg-[#F3F8FF]">
                                            <td className="px-6 py-3 font-medium text-gray-900">Product Feathered</td>
                                            <td className="px-6 py-3">No</td>
                                            </tr>
                                            <tr>
                                            <td className="px-6 py-3 font-medium text-gray-900">Series</td>
                                            <td className="px-6 py-3">Anastasius</td>
                                            </tr>
                                        </tbody>
                                        </table>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* third row left accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Vergelijk dit product met andere winkels
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <div className='mt-1 flex flex-col gap-3'>
                                        <p className='text-[#3D4752] font-normal text-base'>Wij helpen je graag: dit product staat ook bekend onder artikelnummers:</p>
                                        <div className='flex gap-4 flex-wrap w-full'>
                                            <div className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm">BDH-OV-130-BZ</div>
                                            <div className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm">OVAL-1741-PRO-8MM</div>
                                            <div className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm">DH-BRONZE-CLASSIC</div>
                                            <div className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm">RVS-HANDLE-OV-BZ</div>
                                            <div className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm">DOOR-HANDLE-130-OVAL</div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* fourth row left accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Assets & Downloads
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <div className='flex flex-col gap-4'>
                                        <p className='text-[#3D4752] font-normal text-base'>Download technical drawings, installation guides, and product certificates.</p>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                                                <div>
                                                    <p className='text-[#1C2530] font-semibold text-base'>Technical Drawing</p>
                                                    <p className='text-[#3D4752] font-normal text-xs'>CAD file with dimensions</p>
                                                </div>
                                                <div>
                                                    <button className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Download</button>
                                                </div>
                                            </div>
                                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                                                <div>
                                                    <p className='text-[#1C2530] font-semibold text-base'>Installation Guide</p>
                                                    <p className='text-[#3D4752] font-normal text-xs'>Step-by-step PDF guide</p>
                                                </div>
                                                <div>
                                                    <button className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Download</button>
                                                </div>
                                            </div>
                                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                                                <div>
                                                    <p className='text-[#1C2530] font-semibold text-base'>Product Certificate</p>
                                                    <p className='text-[#3D4752] font-normal text-xs'>EN1906:2012 compliance</p>
                                                </div>
                                                <div>
                                                    <button className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Download</button>
                                                </div>
                                            </div>
                                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                                                <div>
                                                    <p className='text-[#1C2530] font-semibold text-base'>Care Instructions</p>
                                                    <p className='text-[#3D4752] font-normal text-xs'>Maintenance guidelines</p>
                                                </div>
                                                <div>
                                                    <button className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Download</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* fifth row left accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Installation Video
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <p className='text-[#3D4752] font-normal text-base'>Watch our professional installation demonstration for optimal results.</p>
                                    <iframe width="100%" height="350" className='rounded-md' src="https://www.youtube.com/embed/u31qwQUeGuM?si=WIn23DoCPBrCzbg7" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                                </div>
                            </details>
                        </div>
                    </div>

                    <div className='flex flex-col gap-5'>
                        {/* first row right accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group" open>
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Technical drawing & Dimensions
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <img src="/technicaldrawings.png" alt="" />
                                </div>
                            </details>
                        </div>

                        {/* second row right accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Ambiance Pictures
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <div className='grid grid-cols-3 gap-4'>
                                        <img src="/Ambpic1.png" className='w-full h-52 rounded-sm' alt="" />
                                        <img src="/AmbPic2.png" className='w-full h-52 rounded-sm' alt="" />
                                        <img src="/AmbPic3.png" className='w-full h-52 rounded-sm' alt="" />
                                        <img src="/AmbPic4.png" className='w-full h-52 rounded-sm' alt="" />
                                        <img src="/AmbPic5.png" className='w-full h-52 rounded-sm' alt="" />
                                        <img src="/AmbPic6.png" className='w-full h-52 rounded-sm' alt="" />
                                    </div>
                                    <div>
                                        <p className='text-[#3D4752] font-normal text-base'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,</p>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* third row right accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    Warranty
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <p className='text-[#3D4752] font-semibold text-lg'>Warranty Coverage Includes:</p>
                                    <ul className='list-disc list-inside text-[#3D4752] font-normal text-base'>
                                        <li>Manufacturing defects in materials and workmanship</li>
                                        <li>Functional failures of spring mechanism</li>
                                        <li>Premature wear of moving parts under normal use</li>
                                        <li>Coating defects and discoloration (excluding normal wear)</li>
                                        <li>Free replacement or repair at manufacturer's discretion</li>
                                    </ul>
                                </div>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <p className='text-[#3D4752] font-semibold text-lg'>Warranty Coverage Includes:</p>
                                    <ul className='list-disc list-inside text-[#3D4752] font-normal text-base'>
                                        <li>Manufacturing defects in materials and workmanship</li>
                                        <li>Functional failures of spring mechanism</li>
                                        <li>Premature wear of moving parts under normal use</li>
                                        <li>Coating defects and discoloration (excluding normal wear)</li>
                                        <li>Free replacement or repair at manufacturer's discretion</li>
                                    </ul>
                                </div>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <p className='text-[#3D4752] font-semibold text-lg'>Warranty Coverage Includes:</p>
                                    <ul className='list-disc list-inside text-[#3D4752] font-normal text-base'>
                                        <li>Manufacturing defects in materials and workmanship</li>
                                        <li>Functional failures of spring mechanism</li>
                                        <li>Premature wear of moving parts under normal use</li>
                                        <li>Coating defects and discoloration (excluding normal wear)</li>
                                        <li>Free replacement or repair at manufacturer's discretion</li>
                                    </ul>
                                </div>
                            </details>
                        </div>

                        {/* fourth row right accordion */}
                        <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-6 py-5 font-semibold text-xl text-[#1C2530]">
                                    FAQ’s
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <div className="collapse collapse-arrow border-0 border-base-300 !p-0">
                                        <input type="radio" name="my-accordion-2" defaultChecked />
                                        <div className="collapse-title text-[#3D4752] text-lg font-semibold p-2">Is Manufacturing defects in materials and workmanship?</div>
                                        <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">Manufacturing defects in materials and workmanship Manufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects</div>
                                    </div>
                                    <div className="collapse collapse-arrow border-0 border-base-300 !p-0">
                                        <input type="radio" name="my-accordion-2" />
                                        <div className="collapse-title text-[#3D4752] text-lg font-semibold p-2">Is Manufacturing defects in materials and workmanship?</div>
                                        <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">Manufacturing defects in materials and workmanship Manufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects</div>
                                    </div>
                                    <div className="collapse collapse-arrow border-0 border-base-300 !p-0">
                                        <input type="radio" name="my-accordion-2" />
                                        <div className="collapse-title text-[#3D4752] text-lg font-semibold p-2">Is Manufacturing defects in materials and workmanship?</div>
                                        <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">Manufacturing defects in materials and workmanship Manufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects</div>
                                    </div>
                                    <div className="collapse collapse-arrow border-0 border-base-300 !p-0">
                                        <input type="radio" name="my-accordion-2" />
                                        <div className="collapse-title text-[#3D4752] text-lg font-semibold p-2">Is Manufacturing defects in materials and workmanship?</div>
                                        <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">Manufacturing defects in materials and workmanship Manufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects</div>
                                    </div>
                                    <div className="collapse collapse-arrow border-0 border-base-300 !p-0">
                                        <input type="radio" name="my-accordion-2" />
                                        <div className="collapse-title text-[#3D4752] text-lg font-semibold p-2">Is Manufacturing defects in materials and workmanship?</div>
                                        <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">Manufacturing defects in materials and workmanship Manufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects in materials and workmanshipManufacturing defects</div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
            
            <div></div>
        </div>
    </div>
  );
};

export default ProductPage;
