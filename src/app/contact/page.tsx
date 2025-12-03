import React from 'react';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <main className="font-sans bg-[#F5F5F5] min-h-screen py-10 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-0">
        <h1 className="text-3xl lg:text-4xl font-bold mb-10 text-[#1C2630] text-center lg:text-left">Contact Us</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Contact Information */}
          <div className="lg:w-1/3 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-[#1C2630] mb-6">Get in Touch</h2>
              <p className="text-[#3D4752] mb-6">
                Have questions about our products or need assistance? We're here to help! Reach out to us through any of the channels below.
              </p>

              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E6F0FF] p-3 rounded-full">
                    <Image src="/emailicon.png" alt="Email" width={24} height={24} className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[#1C2630] font-semibold text-lg">Email</p>
                    <a href="mailto:contact@bouwbeslag.nl" className="text-[#0066FF] hover:underline">contact@bouwbeslag.nl</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#E6F0FF] p-3 rounded-full">
                    <Image src="/kvkicon.png" alt="KVK" width={24} height={24} className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[#1C2630] font-semibold text-lg">Company Details</p>
                    <p className="text-[#3D4752]">KVK: 77245350</p>
                    <p className="text-[#3D4752]">BTW: NL003174000B88</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#E6F0FF] p-3 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#1C2630] font-semibold text-lg">Address</p>
                    <p className="text-[#3D4752]">Netherlands</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:w-2/3">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold text-[#1C2630] mb-6">Send us a Message</h2>
              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-[#1C2630] font-medium">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-[#1C2630] font-medium">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[#1C2630] font-medium">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="text-[#1C2630] font-medium">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-[#1C2630] font-medium">Message</label>
                  <textarea 
                    id="message" 
                    rows={6}
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors resize-none"
                    placeholder="Write your message here..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="bg-[#0066FF] text-white font-bold py-4 px-8 rounded-sm hover:bg-[#0052CC] transition-colors w-full lg:w-max mt-2"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
