export default function KrilinLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-32 h-32 ${className}`}>
      {/* Pixel art style Krilin head */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {/* Row 1 */}
        <div className="bg-transparent"></div>
        <div className="bg-transparent"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-transparent"></div>
        <div className="bg-transparent"></div>

        {/* Row 2 */}
        <div className="bg-transparent"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-transparent"></div>

        {/* Row 3 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>

        {/* Row 4 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>

        {/* Row 5 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>

        {/* Row 6 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>

        {/* Row 7 */}
        <div className="bg-transparent"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-transparent"></div>

        {/* Row 8 */}
        <div className="bg-transparent"></div>
        <div className="bg-transparent"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-transparent"></div>
        <div className="bg-transparent"></div>
      </div>

      {/* Six dots on forehead */}
      <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 grid grid-cols-3 grid-rows-2 gap-1 w-10">
        <div className="bg-black w-2 h-2 rounded-full"></div>
        <div className="bg-black w-2 h-2 rounded-full"></div>
        <div className="bg-black w-2 h-2 rounded-full"></div>
        <div className="bg-black w-2 h-2 rounded-full"></div>
        <div className="bg-black w-2 h-2 rounded-full"></div>
        <div className="bg-black w-2 h-2 rounded-full"></div>
      </div>
    </div>
  )
}
