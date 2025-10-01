import Image from 'next/image'

export default function KrilinFavicon() {
  return (
    <div className="relative w-16 h-16">
      <Image
        src="/krilin_logo.png"
        alt="Krilin favicon"
        fill
        className="object-contain"
        sizes="4rem"
      />
    </div>
  )
} 