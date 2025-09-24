export default function KrilinFavicon() {
  return (
    <div className="relative w-16 h-16">
      {/* Simplified pixel art Krilin head for favicon */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
        {/* Row 1 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>

        {/* Row 2 */}
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>

        {/* Row 3 */}
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>

        {/* Row 4 */}
        <div className="bg-black"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-[#f8d8b0]"></div>
        <div className="bg-black"></div>
      </div>

      {/* Three dots on forehead */}
      <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex gap-[2px]">
        <div className="bg-black w-1 h-1"></div>
        <div className="bg-black w-1 h-1"></div>
        <div className="bg-black w-1 h-1"></div>
      </div>
    </div>
  )
} 