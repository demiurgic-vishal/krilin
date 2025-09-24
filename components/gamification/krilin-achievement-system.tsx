"use client"

import { useState } from "react"
import KrilinCard from "../krilin-card"
import KrilinButton from "../krilin-button"
import KrilinPowerMeter from "../krilin-power-meter"

export default function KrilinAchievementSystem() {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'challenges' | 'journal'>('stats')

  const dailyStats = {
    tasksCompleted: 8,
    tasksCreated: 12,
    focusMinutes: 240,
    streakDays: 5,
    journalEntries: 2,
    powerLevel: 78,
    experiencePoints: 1250,
    level: 15
  }

  const achievements = [
    { id: 1, name: "TASK MASTER", description: "Complete 50 tasks", progress: 68, max: 100, unlocked: true },
    { id: 2, name: "FOCUS WARRIOR", description: "Maintain focus for 500 minutes", progress: 76, max: 100, unlocked: true },
    { id: 3, name: "CONSISTENCY SENSEI", description: "Maintain a 7-day streak", progress: 71, max: 100, unlocked: true },
    { id: 4, name: "JOURNAL KEEPER", description: "Write 30 journal entries", progress: 43, max: 100, unlocked: false },
    { id: 5, name: "EARLY RISER", description: "Complete 3 tasks before 9 AM", progress: 33, max: 100, unlocked: false },
  ]

  const challenges = [
    { 
      id: 1, 
      name: "SUPER FOCUSED WEEK", 
      description: "Complete 5 deep work sessions of 25+ minutes each day for a week", 
      reward: "150 XP + Focus Warrior Badge",
      progress: 65,
      daysLeft: 3
    },
    { 
      id: 2, 
      name: "JOURNALING STREAK", 
      description: "Write in your journal every day for 5 days", 
      reward: "100 XP + Journal Master Badge",
      progress: 40,
      daysLeft: 3
    },
    { 
      id: 3, 
      name: "INBOX ZERO", 
      description: "Clear all your pending emails and messages", 
      reward: "120 XP + Communication Badge",
      progress: 25,
      daysLeft: 2
    },
  ]

  const journalEntries = [
    { id: 1, date: "April 4, 2025", title: "Reflection on Product Launch", preview: "Today we successfully launched the new...", mood: "excited" },
    { id: 2, date: "April 3, 2025", title: "Team Meeting Notes", preview: "The quarterly planning session went well...", mood: "focused" },
    { id: 3, date: "April 1, 2025", title: "Monthly Goals Review", preview: "Looking back at March, I accomplished...", mood: "thoughtful" },
  ]

  return (
    <div className="space-y-6">
      {/* Level and XP Bar */}
      <div className="relative border-2 border-[#33272a] bg-[#fffaeb] p-4">
        <div className="absolute top-0 right-0 bg-[#ff6b35] px-3 py-1 text-white font-pixel">
          LVL {dailyStats.level}
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#ffc15e] rounded-full flex items-center justify-center">
            <span className="font-pixel text-xl text-[#33272a]">{dailyStats.level}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-sm text-[#33272a]">EXPERIENCE</span>
              <span className="font-pixel text-sm text-[#33272a]">{dailyStats.experiencePoints} / 1500 XP</span>
            </div>
            <div className="h-4 bg-[#e5e5e5] border-2 border-[#33272a] relative">
              <div 
                className="h-full bg-[#ff6b35]"
                style={{ width: `${(dailyStats.experiencePoints / 1500) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs font-pixel text-[#594a4e] mt-1">250 XP until next level</div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-center">
            <div className="font-pixel text-3xl text-[#ff6b35]">{dailyStats.tasksCompleted}</div>
            <div className="font-pixel text-xs text-[#594a4e]">TASKS DONE</div>
          </div>
          
          <div className="text-center">
            <div className="font-pixel text-3xl text-[#ff6b35]">{dailyStats.streakDays}</div>
            <div className="font-pixel text-xs text-[#594a4e]">DAY STREAK</div>
          </div>
          
          <div className="text-center">
            <div className="font-pixel text-3xl text-[#ff6b35]">{dailyStats.focusMinutes}</div>
            <div className="font-pixel text-xs text-[#594a4e]">FOCUS MIN</div>
          </div>
          
          <div className="text-center">
            <div className="font-pixel text-3xl text-[#ff6b35]">{dailyStats.journalEntries}</div>
            <div className="font-pixel text-xs text-[#594a4e]">JOURNALS</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap">
        <KrilinButton 
          variant={activeTab === 'stats' ? "primary" : "secondary"}
          onClick={() => setActiveTab('stats')}
        >
          STATS
        </KrilinButton>
        
        <KrilinButton 
          variant={activeTab === 'achievements' ? "primary" : "secondary"}
          onClick={() => setActiveTab('achievements')}
        >
          ACHIEVEMENTS
        </KrilinButton>
        
        <KrilinButton 
          variant={activeTab === 'challenges' ? "primary" : "secondary"}
          onClick={() => setActiveTab('challenges')}
        >
          CHALLENGES
        </KrilinButton>
        
        <KrilinButton 
          variant={activeTab === 'journal' ? "primary" : "secondary"}
          onClick={() => setActiveTab('journal')}
        >
          JOURNAL
        </KrilinButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KrilinCard title="PRODUCTIVITY STATS">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">DAILY TASK COMPLETION</span>
                  <span className="font-pixel text-sm text-[#33272a]">{dailyStats.tasksCompleted}/{dailyStats.tasksCreated}</span>
                </div>
                <KrilinPowerMeter value={(dailyStats.tasksCompleted / dailyStats.tasksCreated) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">FOCUS TIME</span>
                  <span className="font-pixel text-sm text-[#33272a]">{dailyStats.focusMinutes}/300 min</span>
                </div>
                <KrilinPowerMeter value={(dailyStats.focusMinutes / 300) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">JOURNAL STREAK</span>
                  <span className="font-pixel text-sm text-[#33272a]">{dailyStats.streakDays}/7 days</span>
                </div>
                <KrilinPowerMeter value={(dailyStats.streakDays / 7) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-sm text-[#33272a]">OVERALL POWER LEVEL</span>
                  <span className="font-pixel text-sm text-[#33272a]">{dailyStats.powerLevel}/100</span>
                </div>
                <KrilinPowerMeter value={dailyStats.powerLevel} />
              </div>
            </div>
          </KrilinCard>
          
          <KrilinCard title="ACTIVITY BREAKDOWN">
            <div className="space-y-4">
              <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
                <h3 className="font-pixel text-sm text-[#33272a] mb-2">MOST PRODUCTIVE HOURS</h3>
                <div className="grid grid-cols-12 gap-1 h-20">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="relative h-full">
                      <div 
                        className="absolute bottom-0 w-full bg-[#ff6b35]" 
                        style={{ 
                          height: `${[40, 35, 20, 15, 60, 80, 65, 70, 55, 30, 20, 10][i]}%` 
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-pixel text-xs text-[#594a4e]">8AM</span>
                  <span className="font-pixel text-xs text-[#594a4e]">8PM</span>
                </div>
              </div>
              
              <div className="border-2 border-[#33272a] p-3 bg-[#fffffc]">
                <h3 className="font-pixel text-sm text-[#33272a] mb-2">WEEKLY PRODUCTIVITY</h3>
                <div className="grid grid-cols-7 gap-1 h-20">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={day} className="relative h-full">
                      <div 
                        className="absolute bottom-0 w-full bg-[#ffc15e]" 
                        style={{ 
                          height: `${[70, 65, 80, 75, 85, 40, 30][i]}%` 
                        }}
                      ></div>
                      <div className="absolute bottom-[-20px] w-full text-center">
                        <span className="font-pixel text-xs text-[#594a4e]">{day}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </KrilinCard>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achievements.map(achievement => (
            <div key={achievement.id} className={`border-2 border-[#33272a] bg-[#fffffc] overflow-hidden ${!achievement.unlocked ? 'opacity-60' : ''}`}>
              <div className="bg-[#594a4e] text-white font-pixel p-2">
                {achievement.name}
                {achievement.unlocked && (
                  <span className="inline-block ml-2 w-4 h-4 bg-[#ffc15e] rounded-full"></span>
                )}
              </div>
              <div className="p-3">
                <p className="font-pixel text-sm text-[#33272a] mb-2">{achievement.description}</p>
                <div className="flex justify-between mb-1">
                  <span className="font-pixel text-xs text-[#594a4e]">PROGRESS</span>
                  <span className="font-pixel text-xs text-[#594a4e]">{achievement.progress}%</span>
                </div>
                <KrilinPowerMeter value={achievement.progress} label="" />
              </div>
            </div>
          ))}
          
          <KrilinButton className="w-full">VIEW ALL ACHIEVEMENTS</KrilinButton>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {challenges.map(challenge => (
            <KrilinCard key={challenge.id} title={challenge.name}>
              <div className="space-y-3">
                <p className="font-pixel text-sm text-[#33272a]">{challenge.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="bg-[#ffc15e] px-2 py-1 font-pixel text-xs text-[#33272a]">
                    REWARD: {challenge.reward}
                  </div>
                  <div className="font-pixel text-xs text-[#594a4e]">
                    {challenge.daysLeft} DAYS LEFT
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-pixel text-xs text-[#594a4e]">PROGRESS</span>
                    <span className="font-pixel text-xs text-[#594a4e]">{challenge.progress}%</span>
                  </div>
                  <KrilinPowerMeter value={challenge.progress} label="" />
                </div>
              </div>
            </KrilinCard>
          ))}
          
          <KrilinButton className="w-full">FIND NEW CHALLENGES</KrilinButton>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="font-pixel text-xl text-[#33272a]">MY JOURNAL</h2>
            <KrilinButton>NEW ENTRY</KrilinButton>
          </div>
          
          {journalEntries.map(entry => (
            <div key={entry.id} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
              <div className="flex justify-between items-center bg-[#594a4e] p-2">
                <span className="font-pixel text-sm text-white">{entry.title}</span>
                <span className="font-pixel text-xs text-[#ffc15e]">{entry.date}</span>
              </div>
              <div className="p-3">
                <p className="font-pixel text-sm text-[#33272a] mb-2">{entry.preview}...</p>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#ffc15e] rounded-full"></div>
                    <span className="font-pixel text-xs text-[#594a4e]">MOOD: {entry.mood.toUpperCase()}</span>
                  </div>
                  <KrilinButton variant="secondary" className="px-2 py-1 text-xs">READ MORE</KrilinButton>
                </div>
              </div>
            </div>
          ))}
          
          <KrilinButton className="w-full">VIEW ALL ENTRIES</KrilinButton>
        </div>
      )}
    </div>
  )
}
