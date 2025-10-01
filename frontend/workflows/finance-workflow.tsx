"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"
import KrilinPowerMeter from "../components/krilin-power-meter"

export default function FinanceWorkflow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <KrilinCard title="MONTHLY BUDGET" className="mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">HOUSING</span>
                <span className="font-pixel text-sm text-[#33272a]">$1,500 / $1,500</span>
              </div>
              <KrilinPowerMeter value={100} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">FOOD</span>
                <span className="font-pixel text-sm text-[#33272a]">$425 / $500</span>
              </div>
              <KrilinPowerMeter value={85} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">TRANSPORTATION</span>
                <span className="font-pixel text-sm text-[#33272a]">$180 / $250</span>
              </div>
              <KrilinPowerMeter value={72} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">ENTERTAINMENT</span>
                <span className="font-pixel text-sm text-[#33272a]">$120 / $150</span>
              </div>
              <KrilinPowerMeter value={80} />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-sm text-[#33272a]">SAVINGS</span>
                <span className="font-pixel text-sm text-[#33272a]">$350 / $500</span>
              </div>
              <KrilinPowerMeter value={70} />
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <KrilinButton variant="secondary" className="px-2 py-1">ADD CATEGORY</KrilinButton>
            <KrilinButton className="px-2 py-1">ADD EXPENSE</KrilinButton>
          </div>
        </KrilinCard>
        
        <KrilinCard title="FINANCIAL GOALS">
          <div className="space-y-4">
            <div className="border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <h4 className="font-pixel text-sm text-[#33272a]">EMERGENCY FUND</h4>
              <div className="flex justify-between mt-1 mb-1">
                <span className="font-pixel text-xs text-[#594a4e]">$5,200 / $10,000</span>
                <span className="font-pixel text-xs text-[#594a4e]">52%</span>
              </div>
              <KrilinPowerMeter value={52} label="" />
            </div>
            
            <div className="border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <h4 className="font-pixel text-sm text-[#33272a]">VACATION FUND</h4>
              <div className="flex justify-between mt-1 mb-1">
                <span className="font-pixel text-xs text-[#594a4e]">$1,800 / $3,000</span>
                <span className="font-pixel text-xs text-[#594a4e]">60%</span>
              </div>
              <KrilinPowerMeter value={60} label="" />
            </div>
          </div>
        </KrilinCard>
      </div>
      
      <div>
        <KrilinCard title="RECENT TRANSACTIONS" className="mb-6">
          <div className="space-y-2">
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Grocery Store</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 3, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a]">-$85.43</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#4ecdc4] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Salary Deposit</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 1, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a] text-[#4ecdc4]">+$2,500.00</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Coffee Shop</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 2, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a]">-$4.75</div>
            </div>
            
            <div className="flex justify-between p-2 border-l-4 border-[#ff6b35] bg-[#fffffc]">
              <div>
                <div className="font-pixel text-sm text-[#33272a]">Online Subscription</div>
                <div className="font-pixel text-xs text-[#594a4e]">Apr 2, 2025</div>
              </div>
              <div className="font-pixel text-sm text-[#33272a]">-$14.99</div>
            </div>
          </div>
        </KrilinCard>
        
        <KrilinCard title="PAYMENT METHODS">
          <div className="space-y-3">
            <div className="relative border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <div className="absolute top-2 right-2 w-10 h-6 bg-[#ff6b35] flex items-center justify-center">
                <span className="font-pixel text-xs text-white">VISA</span>
              </div>
              <h4 className="font-pixel text-sm text-[#33272a] mb-4">CREDIT CARD</h4>
              <div className="font-pixel text-xs text-[#594a4e]">**** **** **** 4829</div>
              <div className="font-pixel text-xs text-[#594a4e] mt-1">Exp: 09/27</div>
            </div>
            
            <div className="relative border-2 border-[#33272a] p-2 bg-[#fffffc]">
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#4ecdc4] rounded-full"></div>
              <h4 className="font-pixel text-sm text-[#33272a] mb-4">BANK ACCOUNT</h4>
              <div className="font-pixel text-xs text-[#594a4e]">**** 7548</div>
              <div className="font-pixel text-xs text-[#594a4e] mt-1">Checking Account</div>
            </div>
          </div>
        </KrilinCard>
      </div>
    </div>
  )
}
