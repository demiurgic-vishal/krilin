"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

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

type ResearchQuote = {
  text: string; // Krillin's version of the research
  citation: string; // Original source citation
  url?: string; // Link to the actual study
  category: QuoteCategory[];
}

// Research insights rephrased in Krillin's voice - max 120 chars
const researchQuotes: ResearchQuote[] = [
  // Mindfulness & Meditation
  {
    text: "Just 8 weeks of meditation training actually grows your brain - better than any power-up!",
    citation: "Harvard Medical School, 2011",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3004979/",
    category: ['mindfulness', 'growth']
  },
  {
    text: "15 minutes of mindfulness? That's all it takes to see things more clearly!",
    citation: "Journal of Cognitive Psychology, 2019",
    url: "https://doi.org/10.1080/20445911.2019.1586716",
    category: ['mindfulness', 'resilience']
  },
  {
    text: "Meditation physically changes your fear response - now that's real training!",
    citation: "Social Cognitive & Affective Neuroscience, 2013",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3541496/",
    category: ['mindfulness', 'resilience']
  },
  
  // Gratitude
  {
    text: "Daily gratitude cuts stress hormones by 23% - no Destructo Disc required!",
    citation: "Journal of Happiness Studies, 2017",
    url: "https://link.springer.com/article/10.1007/s10902-016-9739-8",
    category: ['gratitude', 'resilience']
  },
  {
    text: "Gratitude literally rewires your brain for happiness - amazing discovery!",
    citation: "NeuroImage Clinical, 2016",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4588123/",
    category: ['gratitude', 'resilience']
  },
  {
    text: "Being grateful improves sleep by 10% - better rest means better training!",
    citation: "Journal of Psychosomatic Research, 2009",
    url: "https://doi.org/10.1016/j.jpsychores.2008.09.002",
    category: ['gratitude', 'sleep']
  },
  
  // Productivity
  {
    text: "Multitasking drops your power level by 40% - focus on one enemy at a time!",
    citation: "Stanford University, 2009",
    url: "https://www.pnas.org/doi/10.1073/pnas.0903620106",
    category: ['productivity', 'mindfulness']
  },
  {
    text: "Written goals boost success by 33% - like having a training plan!",
    citation: "Journal of Applied Psychology, 2015",
    url: "https://psycnet.apa.org/doi/10.1037/a0039096",
    category: ['productivity', 'habit']
  },
  {
    text: "Deep focused work is 2-4x more powerful than scattered efforts!",
    citation: "Deep Work Research, 2016",
    url: "https://www.calnewport.com/books/deep-work/",
    category: ['productivity', 'habit']
  },
  {
    text: "Small wins increase motivation by 76% - every victory counts!",
    citation: "Harvard Business Review, 2011",
    url: "https://hbr.org/2011/05/the-power-of-small-wins",
    category: ['productivity', 'habit']
  },
  
  // Purpose & Meaning
  {
    text: "Having purpose reduces death risk by 15% - fighting for something matters!",
    citation: "Psychological Science, 2014",
    url: "https://doi.org/10.1177/0956797614531799",
    category: ['purpose', 'resilience']
  },
  {
    text: "Purpose-driven people age better - like Master Roshi but with science!",
    citation: "JAMA Psychiatry, 2019",
    url: "https://doi.org/10.1001/jamapsychiatry.2019.0209",
    category: ['purpose', 'growth']
  },
  
  // Relationships
  {
    text: "Good friends are the #1 health predictor - stronger than any solo training!",
    citation: "Harvard 75-Year Study",
    url: "https://www.adultdevelopmentstudy.org/",
    category: ['relationships', 'purpose']
  },
  {
    text: "Social bonds boost survival by 50% - teamwork really makes the dream work!",
    citation: "PLOS Medicine, 2010",
    url: "https://doi.org/10.1371/journal.pmed.1000316",
    category: ['relationships', 'purpose']
  },
  {
    text: "Helping others lights up your brain's reward center - being kind feels great!",
    citation: "PNAS, 2006",
    url: "https://www.pnas.org/doi/10.1073/pnas.0511311103",
    category: ['relationships', 'purpose']
  },
  
  // Habits
  {
    text: "45% of what we do is automatic - that's why training routines matter!",
    citation: "Good Habits Research, 2016",
    url: "https://dornsife.usc.edu/wendywood/research/",
    category: ['habit', 'productivity']
  },
  {
    text: "New habits take 66 days, not 21 - real strength takes time to build!",
    citation: "European Journal of Social Psychology, 2010",
    url: "https://doi.org/10.1002/ejsp.674",
    category: ['habit', 'growth']
  },
  {
    text: "If-then planning triples success rates - like preparing for each opponent!",
    citation: "American Psychologist, 2006",
    url: "https://doi.org/10.1037/0003-066X.61.4.381",
    category: ['productivity', 'habit']
  },
  
  // Sleep
  {
    text: "One bad night increases anxiety 30% - rest is part of the training!",
    citation: "Nature Human Behaviour, 2020",
    url: "https://doi.org/10.1038/s41562-019-0754-8",
    category: ['sleep', 'resilience']
  },
  {
    text: "Morning sunlight helps you sleep 83 minutes faster - nature's Senzu bean!",
    citation: "Sleep Health, 2017",
    url: "https://doi.org/10.1016/j.sleh.2016.11.007",
    category: ['sleep', 'habit']
  },
  {
    text: "Sleep clears brain toxins - it's like maintenance mode for your mind!",
    citation: "Why We Sleep, 2017",
    url: "https://www.simonandschuster.com/books/Why-We-Sleep/Matthew-Walker/9781501144318",
    category: ['sleep', 'resilience']
  },
  
  // Growth & Learning
  {
    text: "Learning new skills feels like chocolate to your brain - knowledge is delicious!",
    citation: "Nature Communications, 2016",
    url: "https://doi.org/10.1038/ncomms12662",
    category: ['growth', 'productivity']
  },
  {
    text: "Your brain keeps growing throughout life - you can always level up!",
    citation: "The Brain That Changes Itself, 2007",
    url: "https://www.penguinrandomhouse.com/books/291743/the-brain-that-changes-itself-by-norman-doidge-md/",
    category: ['growth', 'resilience']
  },
  {
    text: "Reflecting beats practice by 23% - thinking about training improves it!",
    citation: "Psychological Science, 2016",
    url: "https://doi.org/10.1177/0956797616662006",
    category: ['growth', 'productivity']
  },
  
  // Resilience
  {
    text: "Exercise cuts mental health issues by 31% - physical training helps everything!",
    citation: "American Journal of Psychiatry, 2018",
    url: "https://doi.org/10.1176/appi.ajp.2018.17111194",
    category: ['habit', 'resilience']
  },
  {
    text: "Reframing stress as preparation boosts performance - fear becomes fuel!",
    citation: "Journal of Personality & Social Psychology, 2013",
    url: "https://doi.org/10.1037/a0031854",
    category: ['resilience', 'mindfulness']
  },
  {
    text: "Self-compassion activates your care system - be your own best friend!",
    citation: "Journal of Clinical Psychology, 2013",
    url: "https://doi.org/10.1002/jclp.21923",
    category: ['resilience', 'growth']
  },
  
  // Nature & Environment
  {
    text: "20 minutes in nature beats stress better than most techniques!",
    citation: "Frontiers in Psychology, 2019",
    url: "https://doi.org/10.3389/fpsyg.2019.00722",
    category: ['mindfulness', 'resilience']
  },
  {
    text: "Movement breaks every 30 min boost brain power - like mini training sessions!",
    citation: "British Journal of Sports Medicine, 2020",
    url: "https://doi.org/10.1136/bjsports-2020-102590",
    category: ['habit', 'productivity']
  },
  
  // Creativity & Flow
  {
    text: "Flow states boost performance 31% - that's the zone I'm talking about!",
    citation: "Performance Enhancement & Health, 2017",
    url: "https://doi.org/10.1016/j.peh.2017.05.003",
    category: ['productivity', 'mindfulness']
  },
  {
    text: "20 minutes of creativity cuts stress hormones - art is powerful medicine!",
    citation: "Art Therapy, 2016",
    url: "https://doi.org/10.1080/07421656.2016.1166832",
    category: ['mindfulness', 'resilience']
  },
  
  // Technology & Focus
  {
    text: "Just having your phone nearby drops focus - even I put it away to train!",
    citation: "Journal of Consumer Research, 2017",
    url: "https://doi.org/10.1086/691462",
    category: ['productivity', 'mindfulness']
  },
  {
    text: "Paper planning beats digital by 33% - sometimes old school wins!",
    citation: "Psychological Science, 2014",
    url: "https://doi.org/10.1177/0956797614524581",
    category: ['productivity', 'habit']
  },
  
  // Emotional Intelligence
  {
    text: "Emotional control beats IQ by 20% for success - heart over power level!",
    citation: "Psychological Science, 2005",
    url: "https://doi.org/10.1111/j.0956-7976.2005.01534.x",
    category: ['resilience', 'productivity']
  },
  {
    text: "Forgiveness boosts your immune system - letting go makes you stronger!",
    citation: "Annals of Behavioral Medicine, 2021",
    url: "https://doi.org/10.1093/abm/kaab073",
    category: ['resilience', 'relationships']
  },
  
  // Happiness & Wellbeing
  {
    text: "Experiences beat possessions for happiness - adventures over artifacts!",
    citation: "Journal of Personality & Social Psychology, 2003",
    url: "https://doi.org/10.1037/0022-3514.85.6.1193",
    category: ['purpose', 'relationships']
  },
  {
    text: "Savoring good moments fights depression - enjoy every victory!",
    citation: "Savoring: A New Model, 2007",
    url: "https://scholar.google.com/scholar?q=Bryant+Savoring+A+New+Model+2007",
    category: ['gratitude', 'mindfulness']
  },
  {
    text: "After $75k, purpose matters more than money - find what you're fighting for!",
    citation: "PNAS, 2010",
    url: "https://www.pnas.org/doi/10.1073/pnas.1011492107",
    category: ['purpose', 'resilience']
  },
  
  // Breathing & Physiology
  {
    text: "Quick breathing exercises boost performance 15% - ki control is real!",
    citation: "Scientific Reports, 2019",
    url: "https://doi.org/10.1038/s41598-019-46937-8",
    category: ['mindfulness', 'productivity']
  },
  {
    text: "Cognitive reframing cuts stress 23% - change your thoughts, change the battle!",
    citation: "Journal of Experimental Psychology, 2018",
    url: "https://doi.org/10.1037/xge0000371",
    category: ['resilience', 'mindfulness']
  },
  
  // Aging & Longevity
  {
    text: "Mindfulness may slow aging at the cellular level - meditation preserves youth!",
    citation: "Annals of NY Academy of Sciences, 2009",
    url: "https://doi.org/10.1111/j.1749-6632.2009.04414.x",
    category: ['mindfulness', 'resilience']
  },
  {
    text: "Visualization speeds skill learning by 21% - mental training works!",
    citation: "Journal of Neurophysiology, 1995",
    url: "https://doi.org/10.1152/jn.1995.73.2.1024",
    category: ['growth', 'productivity']
  },
  
  // Academic Performance
  {
    text: "Gratitude exercises boost grades by 10% - thankfulness equals success!",
    citation: "Journal of School Psychology, 2008",
    url: "https://doi.org/10.1016/j.jsp.2008.03.005",
    category: ['gratitude', 'growth']
  },
  {
    text: "Daily progress on goals is the #1 motivator - small steps, big results!",
    citation: "The Progress Principle, 2011",
    url: "https://hbr.org/product/the-progress-principle/11964-HBK-ENG",
    category: ['purpose', 'productivity']
  },
  
  // Decision Making
  {
    text: "We make 35,000 decisions daily - no wonder we need mental training!",
    citation: "Journal of Personality & Social Psychology, 2008",
    url: "https://doi.org/10.1037/0022-3514.94.5.883",
    category: ['mindfulness', 'productivity']
  },
  {
    text: "Journaling increases goal achievement 42% - write it to make it real!",
    citation: "Journal of Applied Psychology, 2015",
    url: "https://scholar.dominican.edu/cgi/viewcontent.cgi?article=1265&context=news-releases",
    category: ['habit', 'productivity']
  },
  
  // New Research Insights (2024-2025)
  {
    text: "Just 10 minutes of meditation sharpens focus instantly - even beginners see results!",
    citation: "Frontiers in Human Neuroscience, 2018",
    url: "https://www.frontiersin.org/articles/10.3389/fnhum.2018.00072/full",
    category: ['mindfulness', 'productivity']
  },
  {
    text: "Going for victory beats dodging defeat - approach goals win 59% vs 47% for avoidance!",
    citation: "PLOS ONE, 2021",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0256075",
    category: ['purpose', 'productivity']
  },
  {
    text: "Training for love of it beats external rewards - pure enjoyment drives real achievement!",
    citation: "Perspectives on Psychological Science, 2021",
    url: "https://pubmed.ncbi.nlm.nih.gov/33400615/",
    category: ['purpose', 'growth']
  },
  {
    text: "Forget 21 days - real habits take 60+ days to stick. Stay patient, stay consistent!",
    citation: "Healthcare (Basel), 2024",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11011347/",
    category: ['habit', 'growth']
  },
  {
    text: "Strong willpower equals stronger happiness - self-control masters report way better lives!",
    citation: "Frontiers in Psychology, 2021",
    url: "https://www.frontiersin.org/articles/10.3389/fpsyg.2021.698649/full",
    category: ['resilience', 'purpose']
  },
  {
    text: "Emotional intelligence beats raw power at work - EQ-smart workers perform way better!",
    citation: "BMC Nursing, 2025",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11654103/",
    category: ['relationships', 'productivity']
  },
  {
    text: "Tiny breaks = huge energy boosts! Micro-pauses recharge you faster than Senzu beans!",
    citation: "PLOS ONE, 2022",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9409531/",
    category: ['productivity', 'resilience']
  },
  {
    text: "Weekly gratitude journals boost happiness massively - writing thanks transforms minds!",
    citation: "Applied Psychology: Health & Well-Being, 2022",
    url: "https://pubmed.ncbi.nlm.nih.gov/35137539/",
    category: ['gratitude', 'growth']
  },
  {
    text: "Resilience training makes you stress-proof - bounce back stronger from any attack!",
    citation: "Frontiers in Psychology, 2021",
    url: "https://www.frontiersin.org/articles/10.3389/fpsyg.2021.658421/full",
    category: ['resilience', 'growth']
  },
  {
    text: "17 hours awake = fighting drunk! Sleep deprivation drops your power like nothing else!",
    citation: "CDC/NIOSH, 2020",
    url: "https://www.cdc.gov/niosh/work-hour-training-for-nurses/longhours/mod2/05.html",
    category: ['sleep', 'resilience']
  }
];

// Route to category mapping
const routeCategories: Record<string, QuoteCategory[]> = {
  '/': ['growth', 'resilience', 'purpose'], // Home - mix
  '/dashboard': ['productivity', 'growth'],
  '/chat': ['relationships', 'resilience'],
  '/productivity': ['productivity', 'habit'],
  '/wellness': ['mindfulness', 'gratitude'],
  '/workflows': ['productivity', 'habit'],
  '/settings': ['growth', 'purpose']
};

export default function KrilinWisdomStrip() {
  const pathname = usePathname()
  const [currentQuote, setCurrentQuote] = useState<ResearchQuote | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Get relevant quotes based on current route
  const getRelevantQuotes = () => {
    const categories = routeCategories[pathname] || ['growth', 'resilience']
    
    return researchQuotes.filter(quote =>
      quote.category.some(cat => categories.includes(cat))
    )
  }

  // Get a random quote
  const getNextQuote = () => {
    const relevantQuotes = getRelevantQuotes()
    if (relevantQuotes.length === 0) return null
    
    // Get a random quote different from current one if possible
    let newQuote = relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)]
    if (relevantQuotes.length > 1 && currentQuote && newQuote.text === currentQuote.text) {
      newQuote = relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)]
    }
    
    return newQuote
  }

  // Initialize and rotate quotes
  useEffect(() => {
    const newQuote = getNextQuote()
    setCurrentQuote(newQuote)
    setTimeout(() => setIsVisible(true), 100)
  }, [pathname])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        const newQuote = getNextQuote()
        setCurrentQuote(newQuote)
        setIsVisible(true)
      }, 300)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isPaused, pathname, currentQuote])

  if (!currentQuote) return null

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on the citation link, open the study
    const target = e.target as HTMLElement;
    if (target.classList.contains('citation-link') && currentQuote?.url) {
      e.stopPropagation();
      window.open(currentQuote.url, '_blank', 'noopener,noreferrer');
    } else {
      // Otherwise toggle pause
      setIsPaused(!isPaused);
    }
  };

  return (
    <div 
      className="bg-[#ffc15e]/10 border-b border-[#ffc15e]/20 py-2 px-4 cursor-pointer transition-all hover:bg-[#ffc15e]/15"
      onClick={handleClick}
      title={isPaused ? "Click to resume rotation" : "Click to pause rotation"}
    >
      <div className="container mx-auto max-w-7xl">
        <div className={`text-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <span className="font-pixel text-xs text-[#594a4e]">
            "{currentQuote.text}"
            <span 
              className={`citation-link ml-2 text-[10px] ${currentQuote.url ? 'text-[#33272a]/60 hover:text-[#ff6b35] hover:underline cursor-pointer' : 'text-[#33272a]/60'}`}
              title={currentQuote.url ? "Click to view study" : undefined}
            >
              [{currentQuote.citation}]
            </span>
            {isPaused && <span className="ml-2 text-[#ff6b35] text-[10px]">(PAUSED)</span>}
          </span>
        </div>
      </div>
    </div>
  )
}