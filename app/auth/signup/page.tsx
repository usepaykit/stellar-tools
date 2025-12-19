"use client"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { register } from "module"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

import { z } from 'zod';



const Signup = () =>
{
 const signUpSchema = z
 .object({
   name: z.string().min(3),
   email: z.string().email(),
   password: z
     .string()
     .min(8)
     .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
 })
  const [showPassword, setShowPassword] = useState(false);

  type SignUpSchema = z.infer<typeof signUpSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors},
    watch,
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpSchema) =>
  {
    console.log("validated:", data)
  }

  
  // function handleSubmit(onSubmit: (data: { name: string; email: string; password: string; confirmPassword: string; }) => Promise<void>)
  // {
  //   console.log("Function not implemented.");
  // }

  return (
    <div> 
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        
      {/* Left Animated Section */}
      <div className="relative hidden lg:block bg-black">
        {/* Crossfade images using AnimatePresence + motion.div */}
    
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center justify-center px-6 py-12"
        >
          <Card className="w-full max-w-md bg-transparent shadow-none border-none text-foreground">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tighter">
                Sign in to your account
              </CardTitle>
            </CardHeader>

              <CardContent className="space-y-4">
              <div className="flex justify-center text-center flex-row gap-3 w-full ">
              
                  <button className="flex justify-center items-start gap-2.5 w-full px-10 py-2.5 
                    bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-semibold text-gray-700">Google</span>
              </button>
    </div>
            <div className="flex items-center my-6">
              <Separator className="flex-1" />
              <span className="px-4 text-sm text-muted-foreground whitespace-nowrap">
                or continue with email
              </span>
              <Separator className="flex-1" />
            </div>
              {/* <div className="flex flex-col flex-1 w-full items-center ">
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
                 */}
                <div className="space-y-2">
                  <Label id="Name" className="text-sm font-semibold">Name</Label>
                  
                  <Controller
                    name="name" 
                    control={ control }
                    render={ ({ field }) =>
                      <Input
                      // {...register('email')}
                      placeholder="John Harry"
                      id="Name"
                      name="Name"
                      type="text"
                      // value={formData.email}
                      // onChange={handleChange}
                      className="pl-10 border rounded-lg outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                    /> }
                  />
                  { errors.email && (
                  <p className="text-destructive ">{errors.email.message }</p>
              )}
                </div>
 
              {/* Email */}
          {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  
                  <Input
                    // {...register('email')}
                    placeholder="name@example.com"
                    id="email"
                    name="email"
                    type="email"
                    // value={formData.email}
                    // onChange={handleChange}
                    className="border rounded-lg outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                { errors.email && (
                  <p className="text-destructive">{errors.email.message }</p>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    // {...register('password')}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    // value={formData.password}
                    // onChange={handleChange}
                    placeholder="••••••••"
                    className="pr-10 border rounded-lg outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>

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
                  Sign Up
              </Button>

              <div className="my-6">
                <p className="text-center texs-sm text-muted-foreground">
                  By continuing you agree to our{' '}
                  <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </div>

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
  
export default Signup
