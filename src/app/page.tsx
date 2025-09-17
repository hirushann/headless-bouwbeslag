import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start font-sans max-w-[1440px] relative mx-auto">
      <div className="my-4 flex gap-5 w-full">
        <div className="bg-[#FFFFFF] shadow-[0px_20px_24px_0px_#0000000A] rounded-[4px] w-[25%]">
          <div className="border-b border-[#F1F1F1] flex items-center p-4">
            <h2 className="font-bold text-[22px]">All Categories</h2>
          </div>
          <div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Accessoires</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Accessoires 2</li>
                  <li>Accessoires 3</li>
                  <li>Accessoires 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Bevestigingsmaterialen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Bevestigingsmaterialen 2</li>
                  <li>Bevestigingsmaterialen 3</li>
                  <li>Bevestigingsmaterialen 4</li>
                </ul>
              </div>
            </div> 
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Binnendeurbeslag</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Binnendeurbeslag 2</li>
                  <li>Binnendeurbeslag 3</li>
                  <li>Binnendeurbeslag 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Brievenbussen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Brievenbussen 2</li>
                  <li>Brievenbussen 3</li>
                  <li>Brievenbussen 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Buitendeurbeslag en veiligheidsbeslag</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Buitendeurbeslag en veiligheidsbeslag 2</li>
                  <li>Buitendeurbeslag en veiligheidsbeslag 3</li>
                  <li>Buitendeurbeslag en veiligheidsbeslag 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Cilinders</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Cilinders 2</li>
                  <li>Cilinders 3</li>
                  <li>Cilinders 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Deurgrepen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Deurgrepen 2</li>
                  <li>Deurgrepen 3</li>
                  <li>Deurgrepen 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Deursluiters</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Deursluiters 2</li>
                  <li>Deursluiters 3</li>
                  <li>Deursluiters 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Bevestigingsmaterialen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Bevestigingsmaterialen 2</li>
                  <li>Bevestigingsmaterialen 3</li>
                  <li>Bevestigingsmaterialen 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Binnendeurbeslag</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Binnendeurbeslag 2</li>
                  <li>Binnendeurbeslag 3</li>
                  <li>Binnendeurbeslag 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Cilinders</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Cilinders 2</li>
                  <li>Cilinders 3</li>
                  <li>Cilinders 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Deurgrepen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Deurgrepen 2</li>
                  <li>Deurgrepen 3</li>
                  <li>Deurgrepen 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Deursluiters</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Deursluiters 2</li>
                  <li>Deursluiters 3</li>
                  <li>Deursluiters 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Bevestigingsmaterialen</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Bevestigingsmaterialen 2</li>
                  <li>Bevestigingsmaterialen 3</li>
                  <li>Bevestigingsmaterialen 4</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow border-b border-[#F5F5F5] !rounded-0">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">Binnendeurbeslag</div>
              <div className="collapse-content text-sm">
                <ul>
                  <li>Binnendeurbeslag 2</li>
                  <li>Binnendeurbeslag 3</li>
                  <li>Binnendeurbeslag 4</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[75%] h-[80vh] bg-[linear-gradient(270deg,#1422AC_0%,#00074B_100.82%)] rounded-sm overflow-hidden relative flex items-center">
          <div className="w-1/2 pl-12 flex flex-col gap-3">
            <h1 className="text-white font-bold text-6xl leading-[120%]">Excellent detailed design!</h1>
            <p className="font-normal text-xl leading-[32px] text-white">Concept collections for door, window and furniture fittings.</p>
            <button className="flex gap-2 items-center bg-[#0066FF] rounded-sm py-4.5 px-7 w-max uppercase">
              <span className="font-bold text-sm text-white leading-[22px]">Toevoegen aan winkelwagen</span>
              <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"/></svg></span>
            </button>
          </div>
          <div className="w-1/2 flex items-center justify-center">
            <Image className="w-full h-full object-contain object-right rotate-340" src="/herobg.png" alt="" width={300} height={100} />
          </div>
        </div>
      </div>
    </main>
  );
}
