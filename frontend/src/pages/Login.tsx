import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

function Login() {

  const navigate = useNavigate()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const handleLogin = async (e:React.FormEvent) => {

    e.preventDefault()
    setLoading(true)

    try{

      const res = await api.post("/auth/login",{
        email,
        password
      })

      // store token
      localStorage.setItem("token", res.data.access_token)

      // redirect to dashboard
      navigate("/")

    }catch(err){
      console.error(err)
      alert("Invalid credentials")
    }

    setLoading(false)
  }

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <Card className="w-[420px] shadow-2xl border">

        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">
            Smart Attendance System
          </CardTitle>

          <CardDescription>
            Login to manage attendance
          </CardDescription>
        </CardHeader>

        <CardContent>

          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-2">
              <Label>Email</Label>

              <Input
                type="email"
                placeholder="teacher@email.com"
                onChange={(e)=>setEmail(e.target.value)}
              />

            </div>

            <div className="space-y-2">
              <Label>Password</Label>

              <Input
                type="password"
                placeholder="Enter password"
                onChange={(e)=>setPassword(e.target.value)}
              />

            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  )
}

export default Login