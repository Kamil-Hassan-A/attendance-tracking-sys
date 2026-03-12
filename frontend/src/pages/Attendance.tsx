import { useEffect, useState } from "react"
import api from "@/services/api"

import { Button } from "@/components/ui/button"

function Attendance(){

  const [students,setStudents] = useState<any[]>([])
  const [attendance,setAttendance] = useState<Record<number,boolean>>({})

  useEffect(()=>{

    const fetchStudents = async ()=>{

      try{

        const res = await api.get("/students")

        setStudents(res.data)

      }catch(err){
        console.error(err)
      }

    }

    fetchStudents()

  },[])

  const toggleAttendance = (id:number)=>{

    setAttendance({
      ...attendance,
      [id]: !attendance[id]
    })

  }

  const submitAttendance = async ()=>{

    try{

      await api.post("/attendance",{
        records: attendance
      })

      alert("Attendance saved")

    }catch(err){
      console.error(err)
    }

  }

  return(

    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Mark Attendance
      </h1>

      <table className="w-full border shadow bg-white">

        <thead className="bg-gray-100">

          <tr>

            <th className="p-3 text-left">Student Name</th>
            <th className="p-3 text-left">Present</th>

          </tr>

        </thead>

        <tbody>

          {students.map((student)=>(
            
            <tr key={student.id} className="border-t">

              <td className="p-3">
                {student.name}
              </td>

              <td className="p-3">

                <input
                  type="checkbox"
                  checked={attendance[student.id] || false}
                  onChange={()=>toggleAttendance(student.id)}
                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <Button
        className="mt-6"
        onClick={submitAttendance}
      >
        Submit Attendance
      </Button>

    </div>

  )

}

export default Attendance