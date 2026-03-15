import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"

function StudentDashboard() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
    api
      .get(`/attendance/my`)
      .then(res => setRecords(res.data))
      .catch(() => {
        console.log("error fetching attendance")
        navigate("/student-login")
      })
  }, [navigate])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        My Attendance
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">{r.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'present' ? 'bg-green-100 text-green-800' :
                      r.status === 'absent' ? 'bg-red-100 text-red-800' :
                      r.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      String(r.status).toLowerCase() === 'leave' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StudentDashboard
