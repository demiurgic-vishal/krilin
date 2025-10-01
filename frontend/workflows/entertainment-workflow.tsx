"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"

export default function EntertainmentWorkflow() {
  const categories = [
    "All", "Movies", "TV Shows", "Music", "Games", "Books", "Podcasts"
  ]

  const recommendedContent = [
    {
      id: 1,
      title: "Pixel Warriors: The Movie",
      type: "Movie",
      genre: "Sci-Fi",
      rating: 4.5,
      duration: "2h 15m",
      image: "/placeholder.jpg"
    },
    {
      id: 2,
      title: "Digital Horizons",
      type: "TV Series",
      genre: "Drama",
      rating: 4.8,
      duration: "3 Seasons",
      image: "/placeholder.jpg"
    },
    {
      id: 3,
      title: "Synthetic Beats",
      type: "Music Album",
      genre: "Electronic",
      rating: 4.2,
      duration: "12 Tracks",
      image: "/placeholder.jpg"
    },
    {
      id: 4,
      title: "Quantum Realms",
      type: "Game",
      genre: "RPG",
      rating: 4.7,
      duration: "60+ hours",
      image: "/placeholder.jpg"
    }
  ]

  const watchlist = [
    { id: 101, title: "The Bit Chronicles", type: "Movie", addedDate: "Apr 2" },
    { id: 102, title: "Neon Nights", type: "TV Series", addedDate: "Mar 30" },
    { id: 103, title: "Virtual Reality: A History", type: "Documentary", addedDate: "Mar 28" }
  ]

  const recentlyPlayed = [
    { id: 201, title: "8-Bit Symphony", artist: "Digital Orchestra", lastPlayed: "2h ago", progress: 35 },
    { id: 202, title: "Pixel Pop", artist: "Retro Wave", lastPlayed: "Yesterday", progress: 78 },
    { id: 203, title: "Electronic Dreams", artist: "Synthwave Collective", lastPlayed: "2 days ago", progress: 100 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <KrilinButton 
            key={category}
            variant={index === 0 ? "primary" : "secondary"}
            className="px-3 py-1 text-xs"
          >
            {category.toUpperCase()}
          </KrilinButton>
        ))}
      </div>

      <h2 className="font-pixel text-xl text-[#33272a]">RECOMMENDED FOR YOU</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendedContent.map(item => (
          <div key={item.id} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
            <div className="h-48 relative">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 right-0 bg-[#ff6b35] px-2 py-1">
                <span className="font-pixel text-xs text-white">{item.type}</span>
              </div>
            </div>
            
            <div className="p-3 space-y-2">
              <h3 className="font-pixel text-sm text-[#33272a]">{item.title}</h3>
              
              <div className="flex justify-between items-center">
                <span className="font-pixel text-xs text-[#594a4e]">{item.genre} • {item.duration}</span>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-[#ffc15e]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 font-pixel text-xs text-[#594a4e]">{item.rating}</span>
                </div>
              </div>
              
              <KrilinButton variant="secondary" className="w-full text-xs py-1">
                {item.type === "Movie" || item.type === "TV Series" ? "WATCH NOW" : 
                 item.type === "Music Album" ? "LISTEN NOW" : "PLAY NOW"}
              </KrilinButton>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KrilinCard title="MY WATCHLIST" className="h-full">
          <div className="space-y-3">
            {watchlist.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div>
                  <div className="font-pixel text-sm text-[#33272a]">{item.title}</div>
                  <div className="font-pixel text-xs text-[#594a4e]">{item.type} • Added {item.addedDate}</div>
                </div>
                <div className="flex gap-2">
                  <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                    WATCH
                  </KrilinButton>
                  <button className="p-1 bg-[#ff6b35] border border-[#33272a] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <KrilinButton className="w-full">ADD TO WATCHLIST</KrilinButton>
          </div>
        </KrilinCard>
        
        <KrilinCard title="RECENTLY PLAYED" className="h-full">
          <div className="space-y-3">
            {recentlyPlayed.map(item => (
              <div key={item.id} className="p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div className="flex justify-between mb-1">
                  <div>
                    <div className="font-pixel text-sm text-[#33272a]">{item.title}</div>
                    <div className="font-pixel text-xs text-[#594a4e]">{item.artist} • {item.lastPlayed}</div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center bg-[#ff6b35] border border-[#33272a] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>
                <KrilinPowerMeter value={item.progress} label="" />
              </div>
            ))}
            <KrilinButton className="w-full">VIEW MUSIC LIBRARY</KrilinButton>
          </div>
        </KrilinCard>
      </div>
      
      <h2 className="font-pixel text-xl text-[#33272a]">TRENDING NOW</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Content thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">Virtual Reality: The Future</h3>
            <p className="font-pixel text-xs text-[#594a4e]">Documentary • 1h 45m</p>
          </div>
        </div>
        
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Content thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">Retro Arcade: The Game</h3>
            <p className="font-pixel text-xs text-[#594a4e]">Game • Adventure</p>
          </div>
        </div>
        
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Content thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">Digital Nomads</h3>
            <p className="font-pixel text-xs text-[#594a4e]">TV Series • 2 Seasons</p>
          </div>
        </div>
      </div>
    </div>
  )
}
