"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, EyeOff, Eye, Loader2 } from "lucide-react"
import { register } from "module"
import { useState } from "react"
import { Label } from "@/components/ui/label"



const Signin = () =>
{
  const [showPassword, setShowPassword] = useState('')

  return (
    <div> 
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Animated Section */}
      <div className="relative hidden lg:block bg-black">
        {/* Crossfade images using AnimatePresence + motion.div */}
        <div className="absolute inset-0">
          
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

        {/* Top text */}
        <div className="absolute top-1/4 left-10 text-white space-y-4 drop-shadow-lg">
          <h2 className="text-4xl  font-bold tracking-tight">
            Stella Tools
          </h2>
          <p className="text-lg opacity-90">
            The world awaits. Embark on your next journey.
          </p>
        </div>

        {/* Bottom text box */}
        <div
          className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-md 
          rounded-2xl border border-white/20 p-6 text-white shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-1">
            Wander, Explore, Experience
          </h3>
          <p className="text-sm text-white/90">
            Discover breathtaking destinations, vibrant cultures, and
            unforgettable adventures across the globe.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="relative flex flex-col justify-center bg-background">
        <div className="absolute top-4 right-4">
          {/* <ThemeToggle /> */}
        </div>

        {/* <div>
          <label>Email</label>
          <input {...register('email')} placeholder="Email Address" />
          {errors.email && <p>{errors.email.message}</p>}
        </div> */}

        <form
          // onSubmit={handleSubmit(onSubmit)}
          className="flex items-center justify-center px-6 py-12"
        >
          <Card className="w-full max-w-md bg-transparent shadow-none border-none text-foreground">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tighter">
                Sign in to your account
              </CardTitle>
            </CardHeader>

              <CardContent className="space-y-4">
              <div className="flex justify-center flex-row gap-3 w-full text-">
              <button className="flex items-center w-full gap-2.5 px-10 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-semibold text-gray-700">Google</span>
              </button>

      <button className="flex justify-center items-start gap-2.5 w-full px-10 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#181717" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span className="text-sm font-semibold text-gray-700">GitHub</span>
      </button>
    </div>
            <div className="flex items-center my-6">
              <Separator className="flex-1" />
              <span className="px-4 text-sm text-muted-foreground whitespace-nowrap">
                or continue with email
              </span>
              <Separator className="flex-1" />
            </div>
              <div className="flex flex-col flex-1 w-full items-center ">
              <Tabs defaultValue="password" className="w-full max-w-md">
                <TabsList className="w-full justify-center">
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
                </TabsList>
                <TabsContent value="one" className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Content for tab one. This demonstrates the tab switching functionality.</p>
                </TabsContent>
                <TabsContent value="two" className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Content for tab two with different information displayed.</p>
                </TabsContent>
              </Tabs>
            </div>

              {/* Email */}
              <div className="space-y-2">
                <Label id="" className="text-sm font-semibold">Email</Label>
                  <Input
                    // {...register('email')}
                    placeholder="name@example.com"
                    id="email"
                    name="email"
                    type="email"
                    // value={formData.email}
                    // onChange={handleChange}
                    className="pl-10 border rounded-lg outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              

              

                {/* Password */ }
                <div className="flex justify-between"><Label className="text-sm font-semibold">Password</Label>
                <a href="" className="underline text-sm font-semibold">Forgot password?</a></div>
                
                <div>
                  {/* <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /> */}
                  <Input
                    // {...register('password')}
                    id="password"
                    name="password"
                    // type={showPassword ? 'text' : 'password'}
                    // value={formData.password}
                    // onChange={handleChange}
                    placeholder="••••••••"
                    className="pl-10 border rounded-lg outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                  /> 
                  <Button
                    type="button"
                    className="absolute right-3 top-3 text-sm font-semibold bg text-black bg-white shadow-md hover:text-foreground "
                  >
              Sign Up
                  </Button>
                  <div className="flex flex-row gap-2 items-center py-2">  <Checkbox/>
                  <span className="text-sm font-semibold">Remeber me</span></div>
                 
              </div>

              {/* Submit */}
                <Button
                  onClick={ (e) =>
                  {
                    e.preventDefault()
                  }}
                type="submit"
                className="w-full  text-white font-semibold  rounded-md transition-all duration-300 hover:scale-105 focus-ring-4 hover:shadow-lg"
              >
                  Sign in
              </Button>

              <div className="my-6">
                <p className="text-center texs-sm text-muted-foreground">
                  By continuing you agree to our{' '}
                  <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </div>

              {/* Social Logins */}
            </CardContent>

            <CardFooter className="text-center text-sm text-muted-foreground">
            
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
    </div>
  )
}
  
export default Signin
