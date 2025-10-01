"use client"

import KrilinButton from "../components/krilin-button"
import KrilinCard from "../components/krilin-card"

export default function ShoppingWorkflow() {
  const categories = [
    "All", "Electronics", "Clothing", "Home", "Books", "Groceries", "Beauty"
  ]

  const products = [
    {
      id: 1,
      name: "Wireless Earbuds",
      price: 79.99,
      rating: 4.5,
      reviews: 128,
      image: "/placeholder.jpg",
      category: "Electronics"
    },
    {
      id: 2,
      name: "Pixel Design T-Shirt",
      price: 24.99,
      rating: 4.2,
      reviews: 76,
      image: "/placeholder.jpg",
      category: "Clothing"
    },
    {
      id: 3,
      name: "Smart Home Speaker",
      price: 129.99,
      rating: 4.7,
      reviews: 213,
      image: "/placeholder.jpg",
      category: "Electronics"
    },
    {
      id: 4,
      name: "Retro Gaming Console",
      price: 149.99,
      rating: 4.8,
      reviews: 358,
      image: "/placeholder.jpg",
      category: "Electronics"
    }
  ]

  const cartItems = [
    { id: 101, name: "Mechanical Keyboard", price: 89.99, quantity: 1 },
    { id: 102, name: "Desktop Lamp", price: 34.99, quantity: 2 }
  ]

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-pixel text-xl text-[#33272a]">SHOP</h2>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search products..."
              className="w-60 p-2 pl-8 font-pixel text-sm border-2 border-[#33272a] bg-[#fffffc]"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute top-2.5 left-2 w-4 h-4 text-[#594a4e]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="border-2 border-[#33272a] bg-[#fffffc] overflow-hidden">
              <div className="h-40 relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-[#ffc15e] px-2 py-1">
                  <span className="font-pixel text-xs text-[#33272a]">${product.price}</span>
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                <h3 className="font-pixel text-sm text-[#33272a]">{product.name}</h3>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-[#ffc15e]" : "text-gray-300"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 font-pixel text-xs text-[#594a4e]">({product.reviews})</span>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <KrilinButton variant="secondary" className="px-2 py-1 text-xs">
                      ADD TO CART
                    </KrilinButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <KrilinButton className="w-full">LOAD MORE PRODUCTS</KrilinButton>
      </div>

      <div>
        <KrilinCard title="SHOPPING CART" className="sticky top-4">
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="font-pixel text-sm text-[#594a4e] text-center py-4">Your cart is empty</p>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between p-3 border-2 border-[#33272a] bg-[#fffffc]">
                    <div>
                      <div className="font-pixel text-sm text-[#33272a]">{item.name}</div>
                      <div className="font-pixel text-xs text-[#594a4e]">${item.price} x {item.quantity}</div>
                    </div>
                    <div className="font-pixel text-sm text-[#33272a]">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}

                <div className="flex justify-between p-3 border-t-2 border-[#33272a]">
                  <div className="font-pixel text-sm text-[#33272a]">Total:</div>
                  <div className="font-pixel text-sm text-[#33272a]">${cartTotal.toFixed(2)}</div>
                </div>

                <KrilinButton className="w-full">CHECKOUT</KrilinButton>
              </>
            )}
          </div>
        </KrilinCard>
      </div>
    </div>
  )
}
