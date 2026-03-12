import { useState } from "react";
import api from "../services/api";

function Register() {
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleRegister = async (e:React.FormEvent) => {
    e.preventDefault();

    try{
      await api.post("/auth/register",{
        full_name:name,
        email,
        password
      });

      alert("Registered successfully");

    }catch(err){
      console.error(err);
      alert("Registration failed");
    }
  }

  return(
    <div>
      <h1>Register</h1>

      <form onSubmit={handleRegister}>

        <input
          placeholder="Name"
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button type="submit">Register</button>

      </form>
    </div>
  )
}

export default Register;