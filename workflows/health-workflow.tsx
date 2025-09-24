"use client"

import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"
import KrilinButton from "../components/krilin-button"

export default function HealthWorkflow() {
  const activities = [
    { id: 1, name: "Morning Run", duration: 30, completed: true, time: "6:30 AM" },
    { id: 2, name: "Meditation", duration: 15, completed: false, time: "7:15 AM" },
    { id: 3, name: "Evening Yoga", duration: 45, completed: false, time: "6:00 PM" }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <KrilinCard title="DAILY HEALTH STATS" className="mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">STEPS</span>
                <span className="font-pixel text-sm text-[#33272a]">6,543 / 10,000</span>
              </div>
              <KrilinPowerMeter value={65} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">WATER INTAKE</span>
                <span className="font-pixel text-sm text-[#33272a]">5 / 8 glasses</span>
              </div>
              <KrilinPowerMeter value={62} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">CALORIES BURNED</span>
                <span className="font-pixel text-sm text-[#33272a]">1,245 kcal</span>
              </div>
              <KrilinPowerMeter value={78} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">ACTIVE MINUTES</span>
                <span className="font-pixel text-sm text-[#33272a]">45 / 60 min</span>
              </div>
              <KrilinPowerMeter value={75} />
            </div>
          </div>
        </KrilinCard>

        <KrilinCard title="VITALS">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
              <div className="font-pixel text-xs text-[#594a4e]">HEART RATE</div>
              <div className="font-pixel text-2xl text-[#ff6b35] mt-1">72 BPM</div>
            </div>
            
            <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
              <div className="font-pixel text-xs text-[#594a4e]">SLEEP</div>
              <div className="font-pixel text-2xl text-[#4ecdc4] mt-1">7h 20m</div>
            </div>
            
            <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
              <div className="font-pixel text-xs text-[#594a4e]">BLOOD PRESSURE</div>
              <div className="font-pixel text-xl text-[#33272a] mt-1">120/80</div>
            </div>
            
            <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
              <div className="font-pixel text-xs text-[#594a4e]">WEIGHT</div>
              <div className="font-pixel text-xl text-[#33272a] mt-1">150 lbs</div>
            </div>
          </div>
        </KrilinCard>
      </div>
      
      <div>
        <KrilinCard title="TODAY'S ACTIVITIES" className="mb-6">
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 border-2 border-[#33272a] bg-[#fffffc]">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={activity.completed}
                    className="w-4 h-4 accent-[#ff6b35]"
                    readOnly
                  />
                  <div>
                    <div className={`font-pixel text-sm ${activity.completed ? 'line-through text-gray-500' : 'text-[#33272a]'}`}>
                      {activity.name}
                    </div>
                    <div className="font-pixel text-xs text-[#594a4e]">
                      {activity.time} · {activity.duration} min
                    </div>
                  </div>
                </div>
                <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                  {activity.completed ? 'COMPLETED' : 'START'}
                </KrilinButton>
              </div>
            ))}
            
            <KrilinButton className="w-full">ADD ACTIVITY</KrilinButton>
          </div>
        </KrilinCard>
        
        <KrilinCard title="WEEKLY GOALS">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">RUN 15 MILES</span>
                <span className="font-pixel text-sm text-[#33272a]">8.5 / 15 mi</span>
              </div>
              <KrilinPowerMeter value={56} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">MEDITATE 5 DAYS</span>
                <span className="font-pixel text-sm text-[#33272a]">3 / 5 days</span>
              </div>
              <KrilinPowerMeter value={60} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">SLEEP 7+ HOURS</span>
                <span className="font-pixel text-sm text-[#33272a]">4 / 7 days</span>
              </div>
              <KrilinPowerMeter value={57} />
            </div>
          </div>
        </KrilinCard>
      </div>
    </div>
  )
}
