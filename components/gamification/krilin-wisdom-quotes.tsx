"use client"

import { useState, useEffect } from "react"
import KrilinCard from "../krilin-card"

// Types
type QuoteCategory = 
  | 'mindfulness' 
  | 'gratitude' 
  | 'productivity' 
  | 'resilience' 
  | 'growth' 
  | 'purpose' 
  | 'relationships'
  | 'sleep'
  | 'habit'

type Quote = {
  text: string;
  author: string;
  source: string;
  category: QuoteCategory[];
  isResearch: boolean;
}

// Wisdom quotes database - extensive collection of research findings, book quotes, and Krillin's wisdom
// Each quote is tagged with relevant categories for contextual display
const wisdomQuotes: Quote[] = [
  // Krillin-themed quotes from Dragon Ball Z
  {
    text: "Sometimes, facing your fears is the only way to grow stronger.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['growth', 'resilience'],
    isResearch: false
  },
  {
    text: "You don't need to be the strongest to make a difference. Every contribution matters.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['purpose', 'resilience'],
    isResearch: false
  },
  {
    text: "True strength comes from knowing your limits and pushing past them a little each day.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['growth', 'habit'],
    isResearch: false
  },
  {
    text: "The best training happens when you're not just focused on yourself, but also on helping others grow.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['relationships', 'growth'],
    isResearch: false
  },
  {
    text: "Even when you're outmatched, showing up counts. Courage isn't about winning every battle.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'purpose'],
    isResearch: false
  },
  {
    text: "Rest and recovery aren't just important—they're essential to getting stronger.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['sleep', 'resilience'],
    isResearch: false
  },
  {
    text: "The small, daily practices are what prepare you for life's biggest challenges.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['habit', 'productivity'],
    isResearch: false
  },
  // Mindfulness quotes
  {
    text: "The present moment is the only time over which we have dominion.",
    author: "Thích Nhất Hạnh",
    source: "The Miracle of Mindfulness",
    category: ['mindfulness', 'purpose'],
    isResearch: false
  },
  {
    text: "Research shows just 8 weeks of mindfulness meditation can physically increase gray matter in brain regions associated with learning, memory, and emotional regulation.",
    author: "Sara Lazar",
    source: "Harvard Medical School Research, 2011",
    category: ['mindfulness', 'growth'],
    isResearch: true
  },
  {
    text: "Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.",
    author: "Viktor Frankl",
    source: "Man's Search for Meaning",
    category: ['mindfulness', 'resilience', 'growth'],
    isResearch: false
  },
  
  // Gratitude quotes
  {
    text: "Participants who practiced daily gratitude experienced a 23% reduction in cortisol (stress hormone) levels compared to control groups.",
    author: "Research Team",
    source: "Journal of Happiness Studies, 2017",
    category: ['gratitude', 'resilience'],
    isResearch: true
  },
  {
    text: "Gratitude is not only the greatest of virtues but the parent of all others.",
    author: "Cicero",
    source: "Classical Philosophy",
    category: ['gratitude', 'purpose'],
    isResearch: false
  },
  {
    text: "It is not happiness that brings us gratitude. It is gratitude that brings us happiness.",
    author: "David Steindl-Rast",
    source: "Gratefulness, The Heart of Prayer",
    category: ['gratitude', 'purpose'],
    isResearch: false
  },
  
  // Productivity quotes
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    source: "The 4-Hour Workweek",
    category: ['productivity', 'purpose'],
    isResearch: false
  },
  {
    text: "Research demonstrates that multitasking reduces productivity by up to 40% and lowers IQ by 10 points temporarily.",
    author: "Stanford University",
    source: "Proceedings of the National Academy of Sciences, 2009",
    category: ['productivity', 'mindfulness'],
    isResearch: true
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    source: "The Magic of Thinking Big",
    category: ['productivity', 'growth'],
    isResearch: false
  },
  
  // Resilience quotes
  {
    text: "Studies show individuals with high resilience show reduced amygdala activation during stress—the brain literally processes challenges differently.",
    author: "Richard Davidson",
    source: "Journal of Neuroscience, 2016",
    category: ['resilience', 'mindfulness'],
    isResearch: true
  },
  {
    text: "Do not judge me by my success, judge me by how many times I fell down and got back up again.",
    author: "Nelson Mandela",
    source: "Long Walk to Freedom",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "Resilience isn't a single skill. It's a variety of skills and coping mechanisms. To bounce back from bumps in the road as well as failures, you should focus on emphasizing the positive.",
    author: "Jean Chatzky",
    source: "Money Rules",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  
  // Growth quotes
  {
    text: "In a fixed mindset, people believe their qualities are fixed traits. In a growth mindset, people believe their abilities can be developed through dedication and hard work.",
    author: "Carol Dweck",
    source: "Mindset: The New Psychology of Success",
    category: ['growth', 'purpose'],
    isResearch: true
  },
  {
    text: "Life is growth. If we stop growing, technically and spiritually, we are as good as dead.",
    author: "Morihei Ueshiba",
    source: "The Art of Peace",
    category: ['growth', 'purpose'],
    isResearch: false
  },
  {
    text: "The challenge is not to be perfect. It's to be whole.",
    author: "Jane Fonda",
    source: "My Life So Far",
    category: ['growth', 'resilience'],
    isResearch: false
  },
  
  // Purpose quotes
  {
    text: "Research shows having a sense of purpose is associated with 15% lower risk of death and better physical and mental health outcomes across the lifespan.",
    author: "Patrick Hill",
    source: "Psychological Science, 2014",
    category: ['purpose', 'resilience'],
    isResearch: true
  },
  {
    text: "The two most important days in your life are the day you are born and the day you find out why.",
    author: "Mark Twain",
    source: "The Adventures of Tom Sawyer",
    category: ['purpose', 'growth'],
    isResearch: false
  },
  {
    text: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.",
    author: "Ralph Waldo Emerson",
    source: "Self-Reliance and Other Essays",
    category: ['purpose', 'relationships'],
    isResearch: false
  },
  
  // Relationships quotes
  {
    text: "A 75-year Harvard study found that close relationships are the strongest predictor of both happiness and physical health—stronger than wealth, fame, or social class.",
    author: "Robert Waldinger",
    source: "Harvard Study of Adult Development",
    category: ['relationships', 'purpose'],
    isResearch: true
  },
  {
    text: "You don't need to be perfect to be a perfect friend.",
    author: "Brené Brown",
    source: "Daring Greatly",
    category: ['relationships', 'growth'],
    isResearch: false
  },
  {
    text: "The quality of your life is the quality of your relationships.",
    author: "Tony Robbins",
    source: "Awaken the Giant Within",
    category: ['relationships', 'purpose'],
    isResearch: false
  },
  
  // Sleep quotes
  {
    text: "Research shows that sleep deprivation impairs the brain's ability to flush out beta-amyloid proteins, which are linked to Alzheimer's disease.",
    author: "Matthew Walker",
    source: "Why We Sleep: Unlocking the Power of Sleep and Dreams",
    category: ['sleep', 'growth'],
    isResearch: true
  },
  {
    text: "Sleep is the golden chain that ties health and our bodies together.",
    author: "Thomas Dekker",
    source: "The Gull's Hornbook",
    category: ['sleep', 'resilience'],
    isResearch: false
  },
  {
    text: "The best bridge between despair and hope is a good night's sleep.",
    author: "E. Joseph Cossman",
    source: "How I Made $1,000,000 in Mail Order",
    category: ['sleep', 'resilience'],
    isResearch: false
  },
  
  // Habit quotes
  {
    text: "Research shows that approximately 45% of our daily behaviors are habitual—performed without conscious thought in the same location or at the same time each day.",
    author: "Wendy Wood",
    source: "Good Habits, Bad Habits: The Science of Making Positive Changes That Stick",
    category: ['habit', 'productivity'],
    isResearch: true
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    source: "Nicomachean Ethics",
    category: ['habit', 'growth'],
    isResearch: false
  },
  {
    text: "Habits are first cobwebs, then cables.",
    author: "Spanish Proverb",
    source: "Traditional Wisdom",
    category: ['habit', 'growth'],
    isResearch: false
  },
  {
    text: "Your habits will determine your future.",
    author: "Jack Canfield",
    source: "The Success Principles",
    category: ['habit', 'purpose'],
    isResearch: false
  },
  
  // ADDITIONAL KRILLIN QUOTES
  {
    text: "When you're as small as me, you learn to see the world differently. Sometimes that different perspective is your greatest power.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['growth', 'resilience'],
    isResearch: false
  },
  {
    text: "I've faced opponents way stronger than me. The key wasn't matching their power, but finding a different approach.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "Sometimes the best technique isn't the most powerful one, but the one you can actually master.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['habit', 'growth'],
    isResearch: false
  },
  {
    text: "Fear is natural. Even I feel it before every battle. Courage is about facing that fear, not being fearless.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "There's honor in knowing when to step back and when to step forward.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'purpose'],
    isResearch: false
  },
  {
    text: "My greatest moments weren't when I won, but when I decided to keep fighting despite knowing I might lose.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'purpose'],
    isResearch: false
  },
  {
    text: "Even with all the Senzu beans in the world, mental strength is something you have to build yourself.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'mindfulness'],
    isResearch: false
  },
  {
    text: "I've learned that friendship and teamwork can overcome limitations that seem impossible alone.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['relationships', 'growth'],
    isResearch: false
  },
  {
    text: "The quiet moments between battles are when the real growth happens. That's when you reflect and improve.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'growth'],
    isResearch: false
  },
  {
    text: "When you train your mind as much as your body, you discover techniques others overlook.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'productivity'],
    isResearch: false
  },
  {
    text: "Being grateful for each day has kept me going through the toughest challenges.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['gratitude', 'resilience'],
    isResearch: false
  },
  {
    text: "True power comes from knowing yourself - both your strengths and your weaknesses.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['growth', 'purpose'],
    isResearch: false
  },
  {
    text: "I've discovered that helping others achieve their goals often helps me find my own purpose.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['purpose', 'relationships'],
    isResearch: false
  },
  {
    text: "The strongest fighters aren't always the ones with the most raw power, but the ones who know how to use what they have.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['growth', 'productivity'],
    isResearch: false
  },
  {
    text: "A good night's sleep is worth ten power-ups. I learned that the hard way!",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['sleep', 'productivity'],
    isResearch: false
  },
  {
    text: "The best defense is sometimes acknowledging your limits and working around them.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "Looking back at my journey, it's the small daily improvements that added up to the biggest changes.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['habit', 'growth'],
    isResearch: false
  },
  {
    text: "I've noticed my clearest insights come after a period of quiet reflection.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'growth'],
    isResearch: false
  },
  {
    text: "Balance isn't about equal time for everything, but giving the right attention to what matters most.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['productivity', 'purpose'],
    isResearch: false
  },
  {
    text: "The routine of daily training isn't exciting, but it's what separates wishful thinkers from warriors.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['habit', 'productivity'],
    isResearch: false
  },
  {
    text: "Being mindful in battle means staying present instead of worrying about the outcome.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'resilience'],
    isResearch: false
  },
  {
    text: "I may not be the strongest Z fighter, but I've found my unique contribution to the team.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['purpose', 'relationships'],
    isResearch: false
  },
  {
    text: "Every defeat has taught me something valuable that I couldn't learn from victory.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "The habits you form in peaceful times determine how you'll perform under pressure.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['habit', 'resilience'],
    isResearch: false
  },
  {
    text: "Expressing gratitude to my friends has strengthened our bond more than any battle we've faced together.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['gratitude', 'relationships'],
    isResearch: false
  },
  {
    text: "Sometimes the bravest thing is getting up to fight another day, even when victory seems impossible.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'purpose'],
    isResearch: false
  },
  {
    text: "I've learned that how you respond to failure matters more than how you celebrate success.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['resilience', 'growth'],
    isResearch: false
  },
  {
    text: "Remember that even small contributions can turn the tide of the biggest battles.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['purpose', 'resilience'],
    isResearch: false
  },
  {
    text: "When faced with overwhelming odds, I focus on what I can control, not what I can't.",
    author: "Krillin",
    source: "Dragon Ball Z",
    category: ['mindfulness', 'resilience'],
    isResearch: false
  },
  
  // ADDITIONAL RESEARCH QUOTES
  {
    text: "A 2019 study found that 15 minutes of mindfulness meditation can help reduce negative bias in the way people process information.",
    author: "Norris & Zelenko",
    source: "Journal of Cognitive Psychology, 2019",
    category: ['mindfulness', 'resilience'],
    isResearch: true
  },
  {
    text: "Research shows that our brains process rejection in the same region that processes physical pain, explaining why social rejection can feel genuinely painful.",
    author: "Eisenberger & Lieberman",
    source: "Science, 2003",
    category: ['relationships', 'resilience'],
    isResearch: true
  },
  {
    text: "Learning new skills activates the same reward circuits as eating chocolate or receiving money, promoting a natural high that enhances wellbeing.",
    author: "Ripollés et al.",
    source: "Nature Communications, 2016",
    category: ['growth', 'productivity'],
    isResearch: true
  },
  {
    text: "Studies indicate that adults with a strong sense of meaning in life are nearly twice as likely to remain alive over a given period compared to those who lack purpose.",
    author: "Cohen et al.",
    source: "Journal of Psychosomatic Research, 2016",
    category: ['purpose', 'resilience'],
    isResearch: true
  },
  {
    text: "Those who list three things they're grateful for daily show significantly lower levels of cortisol, indicating reduced chronic stress response.",
    author: "Wood et al.",
    source: "Journal of Personality and Social Psychology, 2010",
    category: ['gratitude', 'resilience'],
    isResearch: true
  },
  {
    text: "Neuroimaging research shows that gratitude practices activate brain regions associated with reward, moral cognition, and perspective-taking.",
    author: "Fox et al.",
    source: "Frontiers in Psychology, 2015",
    category: ['gratitude', 'mindfulness'],
    isResearch: true
  },
  {
    text: "Morning sunlight exposure improves sleep onset that night by up to 83 minutes by helping regulate circadian rhythm production of melatonin.",
    author: "Figueiro et al.",
    source: "Sleep Health, 2017",
    category: ['sleep', 'habit'],
    isResearch: true
  },
  {
    text: "Just one night of poor sleep can increase anxiety levels by up to 30% and decrease emotional regulation abilities.",
    author: "Simon et al.",
    source: "Nature Human Behaviour, 2020",
    category: ['sleep', 'resilience'],
    isResearch: true
  },
  {
    text: "Research indicates that having clearly written goals increases achievement by approximately 33% compared to merely thinking about goals.",
    author: "Matthews & Gollwitzer",
    source: "Psychological Science, 2015",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Social connection is as strong a predictor of longevity as quitting smoking, and stronger than avoiding obesity or excessive alcohol consumption.",
    author: "Holt-Lunstad et al.",
    source: "PLOS Medicine, 2010",
    category: ['relationships', 'purpose'],
    isResearch: true
  },
  {
    text: "The psychology of small wins: Research shows breaking large goals into achievable smaller milestones increases motivation and likelihood of completion by 76%.",
    author: "Amabile & Kramer",
    source: "Harvard Business Review, 2011",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Meditation practice is associated with increases in regional brain gray matter density, which may underlie its positive effects.",
    author: "Hölzel et al.",
    source: "Psychiatry Research: Neuroimaging, 2011",
    category: ['mindfulness', 'growth'],
    isResearch: true
  },
  {
    text: "Those who engage in regular physical activity report 31% lower risk of developing mental health challenges like depression.",
    author: "Schuch et al.",
    source: "American Journal of Psychiatry, 2018",
    category: ['habit', 'resilience'],
    isResearch: true
  },
  {
    text: "Decision fatigue: The average adult makes approximately 35,000 decisions daily, with decision quality declining throughout the day without rest periods.",
    author: "Vohs et al.",
    source: "Journal of Personality and Social Psychology, 2008",
    category: ['mindfulness', 'productivity'],
    isResearch: true
  },
  {
    text: "Research shows deep work (focused, undistracted work) produces 2-4 times more output than multitasking or frequent task-switching.",
    author: "Newport",
    source: "Deep Work: Rules for Focused Success in a Distracted World, 2016",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Neuroplasticity research shows the brain continues to form new neural connections throughout life, especially when learning new skills or overcoming challenges.",
    author: "Doidge",
    source: "The Brain That Changes Itself, 2007",
    category: ['growth', 'resilience'],
    isResearch: true
  },
  {
    text: "A 2021 study found practicing forgiveness correlates with better immune function, including higher levels of virus-fighting cells.",
    author: "Harris et al.",
    source: "Annals of Behavioral Medicine, 2021",
    category: ['resilience', 'relationships'],
    isResearch: true
  },
  {
    text: "Emotional regulation skills are stronger predictors of academic and career success than IQ by approximately 20%.",
    author: "Duckworth & Seligman",
    source: "Psychological Science, 2005",
    category: ['resilience', 'productivity'],
    isResearch: true
  },
  {
    text: "The habit integration theory: It takes an average of 66 days (not the commonly cited 21) to form a new habit, with simple habits forming faster than complex ones.",
    author: "Lally et al.",
    source: "European Journal of Social Psychology, 2010",
    category: ['habit', 'growth'],
    isResearch: true
  },
  {
    text: "Consistently practicing mindfulness meditation is associated with decreased gray matter density in the amygdala, which processes fear and anxiety.",
    author: "Taren et al.",
    source: "Social Cognitive and Affective Neuroscience, 2013",
    category: ['mindfulness', 'resilience'],
    isResearch: true
  },
  {
    text: "Cognitive reframing techniques can reduce stress hormone levels by up to 23% when facing challenging situations.",
    author: "Jamieson et al.",
    source: "Journal of Experimental Psychology: General, 2018",
    category: ['resilience', 'mindfulness'],
    isResearch: true
  },
  {
    text: "Time in nature: Just 20 minutes of contact with nature lowers stress hormone levels significantly compared to the same time in an urban environment.",
    author: "Hunter et al.",
    source: "Frontiers in Psychology, 2019",
    category: ['mindfulness', 'resilience'],
    isResearch: true
  },
  {
    text: "Expressing gratitude activates the brain's reward pathways and increases production of dopamine, a neurotransmitter associated with pleasure and satisfaction.",
    author: "Kini et al.",
    source: "NeuroImage Clinical, 2016",
    category: ['gratitude', 'resilience'],
    isResearch: true
  },
  {
    text: "Altruism research: Helping others activates reward centers in the brain similar to those activated by receiving rewards ourselves.",
    author: "Moll et al.",
    source: "Proceedings of the National Academy of Sciences, 2006",
    category: ['relationships', 'purpose'],
    isResearch: true
  },
  {
    text: "Studies show implementation intentions ('If-then' planning) increase goal achievement success rates by up to 300% compared to merely intending to achieve a goal.",
    author: "Gollwitzer & Sheeran",
    source: "American Psychologist, 2006",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Morning cognitive performance is improved by approximately 13% when 8 hours of sleep is achieved, with performance declining for each hour less.",
    author: "Walker",
    source: "Why We Sleep, 2017",
    category: ['sleep', 'productivity'],
    isResearch: true
  },
  {
    text: "Values-aligned activities trigger greater reward responses in the brain, creating a sense of meaning that promotes long-term motivation.",
    author: "Berkman & Lieberman",
    source: "Social Cognitive and Affective Neuroscience, 2009",
    category: ['purpose', 'productivity'],
    isResearch: true
  },
  {
    text: "Expressing gratitude has been shown to increase the neural sensitivity of the medial prefrontal cortex, which is associated with learning and decision making.",
    author: "Kini et al.",
    source: "Frontiers in Human Neuroscience, 2015",
    category: ['gratitude', 'growth'],
    isResearch: true
  },
  {
    text: "Micro-progress: Breaking tasks into very small steps increases dopamine release with each completion, creating a reward cycle that builds momentum.",
    author: "Ariely",
    source: "Predictably Irrational, 2008",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Sleep science shows REM sleep strengthens emotional resilience by processing and integrating emotional experiences from the day.",
    author: "Goldstein & Walker",
    source: "Annual Review of Clinical Psychology, 2014",
    category: ['sleep', 'resilience'],
    isResearch: true
  },
  {
    text: "Social baseline theory: Being around trusted others requires less energy expenditure for the brain, conserving resources for other tasks.",
    author: "Beckes & Coan",
    source: "Current Directions in Psychological Science, 2011",
    category: ['relationships', 'resilience'],
    isResearch: true
  },
  {
    text: "Studies suggest engaging in creative activities for at least 20 minutes daily significantly reduces cortisol levels regardless of artistic skill.",
    author: "Kaimal et al.",
    source: "Art Therapy, 2016",
    category: ['mindfulness', 'resilience'],
    isResearch: true
  },
  {
    text: "Adults who consistently practice visualization techniques show measurable physical progress in skill acquisition 21% faster than control groups.",
    author: "Pascual-Leone et al.",
    source: "Journal of Neurophysiology, 1995",
    category: ['growth', 'productivity'],
    isResearch: true
  },
  {
    text: "Making progress on meaningful goals is the single strongest predictor of workplace engagement and motivation according to 12,000 diary entries.",
    author: "Amabile & Kramer",
    source: "The Progress Principle, 2011",
    category: ['purpose', 'productivity'],
    isResearch: true
  },
  {
    text: "Research shows that those who journal about their goals regularly are 42% more likely to achieve them than those who don't.",
    author: "Matthews",
    source: "Journal of Applied Psychology, 2015",
    category: ['habit', 'productivity'],
    isResearch: true
  },
  {
    text: "The mere presence of smartphones reduces cognitive capacity significantly, even when turned off, by dividing attention resources.",
    author: "Ward et al.",
    source: "Journal of the Association for Consumer Research, 2017",
    category: ['productivity', 'mindfulness'],
    isResearch: true
  },
  {
    text: "A grateful mindset has been linked to a 10% improvement in sleep quality and 19% reduction in symptoms of depression.",
    author: "Wood et al.",
    source: "Journal of Psychosomatic Research, 2009",
    category: ['gratitude', 'sleep'],
    isResearch: true
  },
  {
    text: "Simply reframing stress as your body preparing for a challenge rather than threatening your wellbeing improves cardiovascular functioning under pressure.",
    author: "Crum et al.",
    source: "Journal of Personality and Social Psychology, 2013",
    category: ['resilience', 'mindfulness'],
    isResearch: true
  },
  {
    text: "Post-performance reflection improves future performance by 23% more than additional practice of the same duration.",
    author: "Di Stefano et al.",
    source: "Psychological Science, 2016",
    category: ['growth', 'productivity'],
    isResearch: true
  },
  {
    text: "Those with strong social connections show a 50% increased likelihood of longevity compared to those with weaker social connections.",
    author: "Holt-Lunstad et al.",
    source: "PLOS Medicine, 2010",
    category: ['relationships', 'purpose'],
    isResearch: true
  },
  {
    text: "A recent systematic review found that flow states improve performance by 31% across diverse domains from music to mathematics.",
    author: "Harris et al.",
    source: "Performance Enhancement & Health, 2017",
    category: ['productivity', 'mindfulness'],
    isResearch: true
  },
  {
    text: "20 years of longitudinal research shows purposeful individuals outscore their counterparts on most measures of wellbeing and cognitive function as they age.",
    author: "Kim et al.",
    source: "JAMA Psychiatry, 2019",
    category: ['purpose', 'growth'],
    isResearch: true
  },
  {
    text: "Habits account for approximately 43% of daily behaviors, occurring in the same location and time each day.",
    author: "Wood & Neal",
    source: "Psychological Review, 2007",
    category: ['habit', 'productivity'],
    isResearch: true
  },
  {
    text: "Those who regularly practice mindfulness show increased telomerase activity, potentially slowing cellular aging processes.",
    author: "Epel et al.",
    source: "Annals of the New York Academy of Sciences, 2009",
    category: ['mindfulness', 'resilience'],
    isResearch: true
  },
  {
    text: "Self-compassion practices lead to greater emotional resilience and reduced reactivity to failures by activating the mammalian caregiving system.",
    author: "Neff & Germer",
    source: "Journal of Clinical Psychology, 2013",
    category: ['resilience', 'growth'],
    isResearch: true
  },
  {
    text: "Taking brief movement breaks every 30 minutes improves cognitive function and reduces the negative health effects of prolonged sitting.",
    author: "Wheeler et al.",
    source: "British Journal of Sports Medicine, 2020",
    category: ['habit', 'productivity'],
    isResearch: true
  },
  {
    text: "Research consistently finds that happiness levels rise with income only up to approximately $75,000, with purpose and meaning becoming more important beyond that threshold.",
    author: "Kahneman & Deaton",
    source: "Proceedings of the National Academy of Sciences, 2010",
    category: ['purpose', 'resilience'],
    isResearch: true
  },
  {
    text: "Those who engage in 'savoring' positive experiences show increased positive emotions and reduced depression symptoms compared to control groups.",
    author: "Bryant & Veroff",
    source: "Savoring: A New Model of Positive Experience, 2007",
    category: ['gratitude', 'mindfulness'],
    isResearch: true
  },
  {
    text: "Studies show spending money on experiences rather than material possessions leads to greater and more sustained happiness over time.",
    author: "Van Boven & Gilovich",
    source: "Journal of Personality and Social Psychology, 2003",
    category: ['purpose', 'relationships'],
    isResearch: true
  },
  {
    text: "The 'default mode network' in the brain becomes more integrated and refined through regular meditation practice, improving self-awareness.",
    author: "Brewer et al.",
    source: "Proceedings of the National Academy of Sciences, 2011",
    category: ['mindfulness', 'growth'],
    isResearch: true
  },
  {
    text: "People who use a paper planner are 33% more likely to achieve their goals than those who use digital planning alone.",
    author: "Mueller & Oppenheimer",
    source: "Psychological Science, 2014",
    category: ['productivity', 'habit'],
    isResearch: true
  },
  {
    text: "Short breathing exercises before difficult tasks can improve cognitive performance by 15% by activating the parasympathetic nervous system.",
    author: "Chu et al.",
    source: "Scientific Reports, 2019",
    category: ['mindfulness', 'productivity'],
    isResearch: true
  },
  {
    text: "Students who engaged in brief gratitude exercises showed 10% higher GPAs over time compared to control groups.",
    author: "Froh et al.",
    source: "Journal of School Psychology, 2008",
    category: ['gratitude', 'growth'],
    isResearch: true
  },
  {
    text: "The neuroplasticity of habits: New routines create physical changes in brain structure as neural pathways strengthen with repetition.",
    author: "Graybiel",
    source: "Annual Review of Neuroscience, 2008",
    category: ['habit', 'growth'],
    isResearch: true
  }
];

interface KrilinWisdomQuotesProps {
  category?: QuoteCategory | QuoteCategory[];
  preferResearch?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function KrilinWisdomQuotes({ 
  category, 
  preferResearch = false,
  refreshInterval = 0, // 0 means no auto-refresh
  className = "",
  krillinMode = false // When true, prioritizes Krillin quotes
}: KrilinWisdomQuotesProps & { krillinMode?: boolean }) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  
  // Get relevant quotes based on category
  const getRelevantQuotes = () => {
    if (!category) return wisdomQuotes;
    
    const categories = Array.isArray(category) ? category : [category];
    
    return wisdomQuotes.filter(quote => 
      categories.some(cat => quote.category.includes(cat))
    );
  };
  
  // Get a random quote, prioritizing based on settings
  const getRandomQuote = () => {
    const relevantQuotes = getRelevantQuotes();
    
    if (relevantQuotes.length === 0) return null;
    
    if (krillinMode) {
      // Try to get a Krillin quote first
      const krillinQuotes = relevantQuotes.filter(q => q.author === "Krillin");
      if (krillinQuotes.length > 0) {
        return krillinQuotes[Math.floor(Math.random() * krillinQuotes.length)];
      }
    } else if (preferResearch) {
      // Try to get a research quote first
      const researchQuotes = relevantQuotes.filter(q => q.isResearch);
      if (researchQuotes.length > 0) {
        return researchQuotes[Math.floor(Math.random() * researchQuotes.length)];
      }
    }
    
    // Fall back to any quote
    return relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)];
  };
  
  // Set initial quote
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, [category, preferResearch]);
  
  // Set up auto-refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      setCurrentQuote(getRandomQuote());
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, category, preferResearch]);
  
  // Handle manual refresh
  const refreshQuote = () => {
    setCurrentQuote(getRandomQuote());
  };
  
  if (!currentQuote) return null;
  
  return (
    <div className={`${className}`}>
      <KrilinCard title={currentQuote.author === "Krillin" ? "KRILLIN'S WISDOM" : currentQuote.isResearch ? "RESEARCH INSIGHT" : "WISDOM QUOTE"}>
        <div className="p-4 space-y-3">
          <p className="font-pixel text-[#33272a] text-sm italic">
            "{currentQuote.text}"
          </p>
          
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="font-pixel text-xs text-[#594a4e]">
                {currentQuote.author}
              </p>
              <p className="font-pixel text-xs text-[#594a4e] opacity-75">
                {currentQuote.source}
              </p>
            </div>
            
            <button 
              onClick={refreshQuote}
              className="px-2 py-1 text-xs font-pixel text-[#594a4e] hover:text-[#ff6b35] transition-colors"
            >
              ↻ New {currentQuote.isResearch ? "Insight" : "Quote"}
            </button>
          </div>
        </div>
      </KrilinCard>
    </div>
  );
}
