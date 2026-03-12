import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Login() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async () => {

    try{

      const res = await axios.post("http://127.0.0.1:8000/api/auth/login",{
        email,
        password
      })

      localStorage.setItem("token",res.data.access_token)

      navigate("/")

    }catch(err){
      alert("Invalid credentials")
    }

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-lg rounded-xl p-8 w-[400px]">

        <h1 className="text-2xl font-bold text-center mb-2">
          Smart Attendance System
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Login to manage attendance
        </p>

        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="teacher@email.com"
              className="w-full border rounded-md p-2 mt-1"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full border rounded-md p-2 mt-1"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-800 transition"
          >
            Login
          </button>

        </div>

      </div>

    </div>

  )
}

export default Login