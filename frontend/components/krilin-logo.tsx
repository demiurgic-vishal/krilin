import Image from 'next/image'

export default function KrilinLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-32 h-32 ${className}`}>
      <Image
        src="/krilin_logo.png"
        alt="Krilin logo"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 8rem, 8rem"
        priority
      />
    </div>
  )
}
