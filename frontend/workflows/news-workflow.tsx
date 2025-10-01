"use client"

import KrilinCard from "../components/krilin-card"
import KrilinButton from "../components/krilin-button"

export default function NewsWorkflow() {
  const newsArticles = [
    {
      id: 1,
      title: "New AI System Breaks Records in Problem-Solving Speed",
      source: "Tech Daily",
      time: "2 hours ago",
      category: "technology",
      imageUrl: "/placeholder.jpg"
    },
    {
      id: 2,
      title: "Global Climate Summit Reaches Historic Agreement",
      source: "World News Network",
      time: "4 hours ago",
      category: "environment",
      imageUrl: "/placeholder.jpg"
    },
    {
      id: 3,
      title: "Space Tourism Company Announces First Commercial Flight",
      source: "Science Today",
      time: "6 hours ago",
      category: "science",
      imageUrl: "/placeholder.jpg"
    },
    {
      id: 4,
      title: "Major Breakthrough in Renewable Energy Storage",
      source: "Energy Weekly",
      time: "8 hours ago",
      category: "technology",
      imageUrl: "/placeholder.jpg"
    }
  ]

  const categories = [
    "All", "Technology", "Business", "Science", "Health", "Sports", "Entertainment", "Politics"
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
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

      <div className="relative">
        <input 
          type="text"
          placeholder="Search news..."
          className="w-full p-3 pl-10 font-pixel text-sm border-2 border-[#33272a] bg-[#fffffc]"
        />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute top-3 left-3 w-5 h-5 text-[#594a4e]" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsArticles.map(article => (
          <KrilinCard key={article.id} title={article.title}>
            <div className="space-y-3">
              <div className="relative h-40 overflow-hidden">
                <div className="absolute inset-0 bg-[#33272a] translate-x-1 translate-y-1"></div>
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="relative z-10 w-full h-full object-cover"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-pixel text-sm text-[#33272a]">{article.source}</span>
                <span className="font-pixel text-xs text-[#594a4e]">{article.time}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="px-2 py-1 bg-[#ff6b35] text-white text-xs font-pixel">
                  {article.category.toUpperCase()}
                </span>
                <KrilinButton variant="secondary" className="px-3 py-1 text-xs">
                  READ MORE
                </KrilinButton>
              </div>
            </div>
          </KrilinCard>
        ))}
      </div>
      
      <KrilinButton className="w-full">LOAD MORE NEWS</KrilinButton>
    </div>
  )
}
