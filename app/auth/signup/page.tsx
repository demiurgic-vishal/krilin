"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import KrilinCard from "@/components/krilin-card"
import KrilinButton from "@/components/krilin-button"
import { Input } from "@/components/ui/input"

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true)
    
    // This would be replaced with actual registration logic
    console.log("Signup attempt with:", data)
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <KrilinCard title="Create Your Account" className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="font-pixel text-[#33272a] block text-sm">Username</label>
            <Input
              {...register("username")}
              type="text"
              placeholder="YourUsername"
              className="w-full font-pixel border-2 border-[#33272a]"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-[#ff6b35] text-xs font-pixel mt-1">{errors.username.message}</p>
            )}
          </div>
          
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
          
          <div className="space-y-2">
            <label className="font-pixel text-[#33272a] block text-sm">Confirm Password</label>
            <Input
              {...register("confirmPassword")}
              type="password"
              placeholder="••••••••"
              className="w-full font-pixel border-2 border-[#33272a]"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-[#ff6b35] text-xs font-pixel mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <div className="pt-2">
            <KrilinButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </KrilinButton>
          </div>
          
          <div className="text-center font-pixel text-sm text-[#33272a]">
            <p>Already have an account?</p>
            <Link 
              href="/auth/login"
              className="text-[#ff6b35] hover:underline"
            >
              Login instead
            </Link>
          </div>
        </form>
      </KrilinCard>
    </div>
  )
}
