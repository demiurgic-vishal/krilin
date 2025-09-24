"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import KrilinCard from "@/components/krilin-card"
import KrilinButton from "@/components/krilin-button"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    
    // This would be replaced with actual authentication logic
    console.log("Login attempt with:", data)
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <KrilinCard title="Login to Krilin" className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="font-pixel text-[#33272a] block text-sm">Email</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="your@email.com"
              className="w-full font-pixel border-2 border-[#33272a]"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-[#ff6b35] text-xs font-pixel mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="font-pixel text-[#33272a] block text-sm">Password</label>
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full font-pixel border-2 border-[#33272a]"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-[#ff6b35] text-xs font-pixel mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <div className="pt-2">
            <KrilinButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </KrilinButton>
          </div>
          
          <div className="text-center font-pixel text-sm text-[#33272a]">
            <p>Don't have an account?</p>
            <Link 
              href="/auth/signup"
              className="text-[#ff6b35] hover:underline"
            >
              Create an account
            </Link>
          </div>
        </form>
      </KrilinCard>
    </div>
  )
}
