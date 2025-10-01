"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"

export default function LearningWorkflow() {
  const categories = [
    "All", "Technology", "Design", "Business", "Language", "Science", "Arts"
  ]

  const courses = [
    {
      id: 1,
      title: "Pixel Art Fundamentals",
      author: "Alex Chen",
      progress: 65,
      lessons: 12,
      duration: "5h 30m",
      image: "/placeholder.jpg"
    },
    {
      id: 2,
      title: "Web Development with React",
      author: "Sarah Johnson",
      progress: 42,
      lessons: 24,
      duration: "12h 15m",
      image: "/placeholder.jpg"
    },
    {
      id: 3,
      title: "UX Design Principles",
      author: "Miguel Santos",
      progress: 0,
      lessons: 18,
      duration: "8h 45m",
      image: "/placeholder.jpg"
    },
    {
      id: 4,
      title: "Machine Learning Basics",
      author: "Priya Sharma",
      progress: 78,
      lessons: 20,
      duration: "10h 20m",
      image: "/placeholder.jpg"
    }
  ]

  const learningStats = [
    { label: "COURSES ENROLLED", value: 8 },
    { label: "HOURS LEARNING", value: 42 },
    { label: "CERTIFICATES", value: 3 },
    { label: "WEEKLY STREAK", value: 5 }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {learningStats.map((stat, i) => (
          <div key={i} className={`border-2 border-[#33272a] p-4 bg-[#fffffc] ${i === 3 ? "md:col-span-3 md:col-start-1" : ""}`}>
            <div className="font-pixel text-xs text-[#594a4e]">{stat.label}</div>
            <div className="font-pixel text-3xl text-[#ff6b35] mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

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

      <h2 className="font-pixel text-xl text-[#33272a]">MY COURSES</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map(course => (
          <KrilinCard key={course.id} title={course.title}>
            <div className="space-y-3">
              <div className="relative h-36 overflow-hidden">
                <div className="absolute inset-0 bg-[#33272a] translate-x-1 translate-y-1"></div>
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="relative z-10 w-full h-full object-cover"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-pixel text-sm text-[#33272a]">by {course.author}</span>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-[#594a4e]">{course.lessons} lessons</span>
                  <span className="font-pixel text-xs text-[#594a4e]">|</span>
                  <span className="font-pixel text-xs text-[#594a4e]">{course.duration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-pixel text-xs text-[#594a4e]">PROGRESS</span>
                  <span className="font-pixel text-xs text-[#594a4e]">{course.progress}%</span>
                </div>
                <KrilinPowerMeter value={course.progress} label="" />
              </div>
              
              <KrilinButton className="w-full">
                {course.progress === 0 ? "START COURSE" : "CONTINUE LEARNING"}
              </KrilinButton>
            </div>
          </KrilinCard>
        ))}
      </div>
      
      <h2 className="font-pixel text-xl text-[#33272a]">RECOMMENDED FOR YOU</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Course thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">Game Development with Unity</h3>
            <p className="font-pixel text-xs text-[#594a4e]">24 lessons · 10h 45m</p>
          </div>
        </div>
        
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Course thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">Digital Illustration</h3>
            <p className="font-pixel text-xs text-[#594a4e]">18 lessons · 8h 20m</p>
          </div>
        </div>
        
        <div className="border-2 border-[#33272a] bg-[#fffffc] p-3 flex items-center gap-3">
          <div className="w-16 h-16 bg-[#33272a] flex-shrink-0">
            <img src="/placeholder.jpg" alt="Course thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-[#33272a]">AI for Creatives</h3>
            <p className="font-pixel text-xs text-[#594a4e]">15 lessons · 6h 30m</p>
          </div>
        </div>
      </div>
      
      <KrilinButton className="w-full">EXPLORE ALL COURSES</KrilinButton>
    </div>
  )
}
